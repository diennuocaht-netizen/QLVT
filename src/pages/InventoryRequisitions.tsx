import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { Requisition, InventorySlip, RequisitionStatus } from '../types/inventory';
import { Plus, Search, Trash2, FileText, CheckCircle, XCircle, Edit, Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { RequisitionModal } from '../components/inventory/RequisitionModal';
import { DetailRequisitionModal } from '../components/inventory/DetailRequisitionModal';
import { PrintRequisitionModal } from '../components/inventory/PrintRequisitionModal';
import { useAuth } from '../contexts/AuthContext';
import { requisitionFromDatabase, slipFromDatabase } from '../utils/dataTransform';

export const InventoryRequisitions: React.FC = () => {
  const { profile } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [slips, setSlips] = useState<InventorySlip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState<Requisition | null>(null);
  const [detailRequisition, setDetailRequisition] = useState<Requisition | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [printRequisition, setPrintRequisition] = useState<Requisition | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let isInitialLoadComplete = false;

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch requisitions
        const { data: reqData, error: reqError } = await supabase
          .from('inventory_requisitions')
          .select('*');

        if (reqError) throw reqError;
        if (isMounted) {
          setRequisitions((reqData || []).map(req => requisitionFromDatabase(req)) as Requisition[]);
        }

        // Fetch slips
        const { data: slipsData, error: slipsError } = await supabase
          .from('inventory_slips')
          .select('*');

        if (slipsError) throw slipsError;
        if (isMounted) {
          setSlips((slipsData || []).map(slip => slipFromDatabase(slip)) as InventorySlip[]);
          isInitialLoadComplete = true;
          console.log('✅ [InventoryRequisitions] Initial data load complete');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Lỗi tải dữ liệu: ' + (error instanceof Error ? error.message : 'Unknown error'));
        if (isMounted) {
          isInitialLoadComplete = true;
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Subscribe to real-time changes AFTER initial load (helps prevent duplicates)
    const subscribeToChanges = async () => {
      // Wait for initial load to complete
      let attempts = 0;
      while (!isInitialLoadComplete && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!isMounted) return;
      
      const reqChannel = supabase
        .channel(`inventory_requisitions_changes_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_requisitions' }, (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            const newReq = requisitionFromDatabase(payload.new) as Requisition;
            setRequisitions(prev => {
              // Check if requisition already exists (deduplication)
              const exists = prev.some(req => req.id === newReq.id);
              if (exists) {
                console.log('⚠️ [InventoryRequisitions] Requisition already exists, skipping duplicate:', newReq.id);
                return prev;
              }
              return [...prev, newReq];
            });
          } else if (payload.eventType === 'UPDATE') {
            setRequisitions(prev =>
              prev.map(req => (req.id === payload.new.id ? (requisitionFromDatabase(payload.new) as Requisition) : req))
            );
          } else if (payload.eventType === 'DELETE') {
            setRequisitions(prev => prev.filter(req => req.id !== payload.old.id));
          }
        })
        .subscribe();

      const slipChannel = supabase
        .channel(`inventory_slips_changes_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_slips' }, (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            const newSlip = slipFromDatabase(payload.new) as InventorySlip;
            setSlips(prev => {
              // Check if slip already exists (deduplication)
              const exists = prev.some(slip => slip.id === newSlip.id);
              if (exists) {
                console.log('⚠️ [InventoryRequisitions] Slip already exists, skipping duplicate:', newSlip.id);
                return prev;
              }
              return [...prev, newSlip];
            });
          } else if (payload.eventType === 'UPDATE') {
            setSlips(prev =>
              prev.map(slip => (slip.id === payload.new.id ? (slipFromDatabase(payload.new) as InventorySlip) : slip))
            );
          } else if (payload.eventType === 'DELETE') {
            setSlips(prev => prev.filter(slip => slip.id !== payload.old.id));
          }
        })
        .subscribe();

      return () => {
        if (reqChannel) supabase.removeChannel(reqChannel);
        if (slipChannel) supabase.removeChannel(slipChannel);
      };
    };

    // Start subscription
    let unsubscribe: (() => void) | null = null;
    subscribeToChanges().then(fn => {
      if (isMounted) unsubscribe = fn || null;
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (profile?.role !== 'admin') {
      alert('Chỉ Admin mới có quyền xóa tờ trình. Vui lòng liên hệ Administrator.');
      return;
    }

    const req = requisitions.find(r => r.id === id);
    const relatedSlips = slips.filter(slip =>
      slip.requisition_ids && slip.requisition_ids.includes(id)
    );

    const relatedSlipsText = relatedSlips.length > 0
      ? `\n\nPhiếu liên quan sẽ được xóa (${relatedSlips.length}):\n${relatedSlips.map(s => `- ${s.code}`).join('\n')}`
      : '';

    if (window.confirm(`Bạn có chắc chắn muốn xóa tờ trình "${req?.code}"?${relatedSlipsText}`)) {
      try {
        const { error } = await supabase
          .from('inventory_requisitions')
          .delete()
          .eq('id', id);

        if (error) throw error;
        alert('Xóa tờ trình thành công');
      } catch (error) {
        console.error('Error deleting requisition:', error);
        alert('Lỗi xóa tờ trình: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const getRequisitionDisplayStatus = (req: Requisition) => {
    if (!req.items || req.items.length === 0) return { text: 'Mới tạo (0)', color: 'bg-gray-100 text-gray-800' };
    
    const completedItems = req.items.filter(item => (item.receivedQuantity || 0) >= item.requestedQuantity).length;
    const totalItems = req.items.length;
    
    if (completedItems === totalItems) {
      return { text: 'Hoàn thành', color: 'bg-green-100 text-green-800' };
    } else {
      return { text: `Đã nhận đủ ${completedItems}/${totalItems} vật tư`, color: 'bg-blue-100 text-blue-800' };
    }
  };

  const filteredRequisitions = React.useMemo(() => {
    return requisitions.filter(req =>
      req.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requisitions, searchTerm]);

  const handleExportExcel = () => {
    const dataToExport = filteredRequisitions.map(req => ({
      'Mã tờ trình': req.code,
      'Ngày tạo': new Date(req.date).toLocaleDateString('vi-VN'),
      'Mục đích': req.purpose || '',
      'Người tạo': req.createdBy || '',
      'Trạng thái': getRequisitionDisplayStatus(req).text,
      'Số lượng vật tư': req.items?.length || 0
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_to_trinh");
    XLSX.writeFile(wb, "Danh_sach_to_trinh.xlsx");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Tờ Trình Xin Cấp Vật Tư</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingRequisition(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={20} /> Tờ Trình Mới
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={20} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Tìm kiếm theo mã hoặc mục đích..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        />
      </div>

      // Loading
      {loading && <div className="text-center py-4 text-gray-600">Đang tải dữ liệu...</div>}

      {/* Table & Mobile View */}
      {!loading && (
        <>
          <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto overflow-y-auto max-h-[calc(100vh-240px)]">
          <table className="w-full relative">
            <thead className="bg-gray-100 border-b sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Mã Tờ Trình</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Ngày</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Loại</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Mục Đích</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Số Mặt Hàng</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Trạng Thái</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Không có tờ trình nào
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((req) => (
                  <tr key={req.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(req.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.purpose || '-'}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700 font-semibold">
                      {(req.items as any[])?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getRequisitionDisplayStatus(req).color}`}
                      >
                        {getRequisitionDisplayStatus(req).text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setDetailRequisition(req);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Xem chi tiết"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setPrintRequisition(req);
                            setIsPrintModalOpen(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="In Tờ trình"
                        >
                          <Printer size={18} />
                        </button>
                        {(profile?.role === 'admin' || profile?.role === 'manager') && (
                          <button
                            onClick={() => {
                              setEditingRequisition(req);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Sửa"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {profile?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(req.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {filteredRequisitions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">Không có tờ trình nào</div>
          ) : (
            filteredRequisitions.map((req) => (
              <div key={req.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{req.code}</h3>
                    <p className="text-sm text-gray-500">{new Date(req.date).toLocaleDateString('vi-VN')} - {req.type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRequisitionDisplayStatus(req).color}`}>
                    {getRequisitionDisplayStatus(req).text}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <span className="block text-xs text-gray-400">Mục đích</span>
                  <span className="font-medium text-gray-800">{req.purpose || '-'}</span>
                </div>
                <div className="flex justify-end gap-2 border-t pt-3">
                  <button
                    onClick={() => {
                      setDetailRequisition(req);
                      setIsDetailModalOpen(true);
                    }}
                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
                    title="Xem chi tiết"
                  >
                    <FileText size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setPrintRequisition(req);
                      setIsPrintModalOpen(true);
                    }}
                    className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-md"
                    title="In Tờ trình"
                  >
                    <Printer size={18} />
                  </button>
                  {(profile?.role === 'admin' || profile?.role === 'manager') && (
                    <button
                      onClick={() => {
                        setEditingRequisition(req);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md"
                      title="Sửa"
                    >
                      <Edit size={18} />
                    </button>
                  )}
                  {profile?.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </>
      )}

      {/* Modals */}
      <RequisitionModal
        isOpen={isModalOpen}
        requisition={editingRequisition}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRequisition(null);
        }}
      />

      <DetailRequisitionModal
        isOpen={isDetailModalOpen}
        requisition={detailRequisition}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailRequisition(null);
        }}
      />

      <PrintRequisitionModal
        isOpen={isPrintModalOpen}
        requisition={printRequisition}
        onClose={() => {
          setIsPrintModalOpen(false);
          setPrintRequisition(null);
        }}
      />
    </div>
  );
};
