import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { InventorySlip, SlipType, Requisition, Item } from '../types/inventory';
import { Plus, Search, Trash2, FileText, Download, Printer, Edit, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SlipModal } from '../components/inventory/SlipModal';
import { DetailSlipModal } from '../components/inventory/DetailSlipModal';
import { PrintCompletionReportModal } from '../components/inventory/PrintCompletionReportModal';
import { GlobalCompletionModal } from '../components/inventory/GlobalCompletionModal';
import { useAuth } from '../contexts/AuthContext';
import { slipFromDatabase, itemFromDatabase } from '../utils/dataTransform';

export const InventoryIssues: React.FC = () => {
  const { profile } = useAuth();
  const [slips, setSlips] = useState<InventorySlip[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<InventorySlip | null>(null);
  const [detailSlip, setDetailSlip] = useState<InventorySlip | null>(null);
  const [printSlip, setPrintSlip] = useState<InventorySlip | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isGlobalCompleteModalOpen, setIsGlobalCompleteModalOpen] = useState(false);
  
  const [globalPrintItems, setGlobalPrintItems] = useState<any[]>([]);
  const [globalSourceSlipCodes, setGlobalSourceSlipCodes] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch Issue slips
        const { data: slipsData, error: slipsError } = await supabase
          .from('inventory_slips')
          .select('*')
          .eq('type', 'Issue');

        if (slipsError) throw slipsError;
        setSlips((slipsData || []).map(slip => slipFromDatabase(slip)) as InventorySlip[]);

        // Fetch items for reference
        const { data: itemsData, error: itemsError } = await supabase
          .from('inventory_items')
          .select('*');

        if (itemsError) throw itemsError;
        setItems((itemsData || []).map(item => itemFromDatabase(item)) as Item[]);
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Lỗi tải dữ liệu: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time changes
    const slipsChannel = supabase
      .channel('inventory_slips_issue_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_slips', filter: 'type=eq.Issue' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSlips(prev => [...prev, slipFromDatabase(payload.new) as InventorySlip]);
          } else if (payload.eventType === 'UPDATE') {
            setSlips(prev =>
              prev.map(slip => (slip.id === payload.new.id ? (slipFromDatabase(payload.new) as InventorySlip) : slip))
            );
          } else if (payload.eventType === 'DELETE') {
            setSlips(prev => prev.filter(slip => slip.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(slipsChannel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (profile?.role !== 'admin') {
      alert('Chỉ Admin mới có quyền xóa phiếu. Vui lòng liên hệ quản trị viên.');
      return;
    }

    const slipToDelete = slips.find(s => s.id === id);

    if (window.confirm(`Bạn có chắc chắn muốn xóa phiếu "${slipToDelete?.code}"?`)) {
      try {
        // Step 1: Restore inventory quantities before deleting
        if (slipToDelete?.items && slipToDelete.items.length > 0) {
          console.log(`📦 [InventoryIssues] Restoring warehouse quantities...`);
          
          for (const slipItem of slipToDelete.items) {
            if (slipItem.itemId && slipItem.quantity > 0) {
              try {
                console.log(`📈 [InventoryIssues] Adding back ${slipItem.quantity} to item ${slipItem.itemId}`);
                
                // Fetch current quantity
                const { data: itemData, error: fetchError } = await supabase
                  .from('inventory_items')
                  .select('quantity')
                  .eq('id', slipItem.itemId)
                  .single();
                
                if (fetchError) {
                  console.error(`❌ [InventoryIssues] Error fetching item ${slipItem.itemId}:`, fetchError);
                  throw fetchError;
                }
                
                // Calculate new quantity
                const currentQuantity = itemData?.quantity || 0;
                const newQuantity = currentQuantity + slipItem.quantity;
                
                console.log(`   Current: ${currentQuantity}, Adding back: ${slipItem.quantity}, New: ${newQuantity}`);
                
                // Update inventory
                const { error: updateError } = await supabase
                  .from('inventory_items')
                  .update({ quantity: newQuantity })
                  .eq('id', slipItem.itemId);
                
                if (updateError) {
                  console.error(`❌ [InventoryIssues] Error updating item ${slipItem.itemId}:`, updateError);
                  console.error(`   Error code: ${updateError.code}`);
                  console.error(`   Error message: ${updateError.message}`);
                  console.error(`   Full error:`, JSON.stringify(updateError, null, 2));
                  throw updateError;
                }
                
                // Verify the update by reading back
                const { data: verifyData, error: verifyError } = await supabase
                  .from('inventory_items')
                  .select('quantity')
                  .eq('id', slipItem.itemId)
                  .single();
                
                if (verifyError) {
                  console.warn(`⚠️ [InventoryIssues] Could not verify item ${slipItem.itemId}:`, verifyError);
                } else {
                  console.log(`🔍 [InventoryIssues] Verified - Item ${slipItem.itemId} now has quantity: ${verifyData?.quantity}`);
                }
                
                console.log(`✅ [InventoryIssues] Item ${slipItem.itemId} quantity restored to ${newQuantity}`);
              } catch (err) {
                console.error(`❌ [InventoryIssues] Error processing item ${slipItem.itemId}:`, err);
                throw err;
              }
            }
          }
          console.log(`✅ [InventoryIssues] All warehouse quantities restored`);
        }

        // Step 2: Delete the slip
        const { error } = await supabase
          .from('inventory_slips')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setSlips(prev => prev.filter(slip => slip.id !== id));
        alert('Xóa phiếu và phục hồi kho thành công');
      } catch (error) {
        console.error('Error deleting slip:', error);
        alert('Lỗi xóa phiếu: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const getItemName = (itemId: string) => {
    return items.find(i => i.id === itemId)?.name || 'N/A';
  };

  const filteredSlips = React.useMemo(() => {
    return slips.filter(slip =>
      slip.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [slips, searchTerm]);

  const isSlipLocked = (slipDate: string) => {
    const date = new Date(slipDate);
    const now = new Date();
    
    // Get start of current week (Monday)
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() + diffToMonday);
    startOfCurrentWeek.setHours(0, 0, 0, 0);
  
    return date < startOfCurrentWeek;
  };

  const getSlipDisplayStatus = (slip: InventorySlip) => {
    if (slip.status === 'Đã hoàn thành') return slip.status;
    if (isSlipLocked(slip.date)) return 'Đã khóa';
    return slip.status || 'Đang mở';
  };

  const handleExportExcel = () => {
    const dataToExport = filteredSlips.map(slip => ({
      'Mã phiếu': slip.code,
      'Ngày xuất': new Date(slip.date).toLocaleDateString('vi-VN'),
      'Lý do xuất': slip.reason || '',
      'Người yêu cầu': slip.requester || '',
      'Trạng thái': getSlipDisplayStatus(slip),
      'Số lượng vật tư': slip.items?.length || 0
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_phieu_xuat");
    XLSX.writeFile(wb, "Danh_sach_phieu_xuat.xlsx");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Phiếu Xuất Kho</h1>
        <div className="flex gap-2 flex-wrap">
          {(profile?.role === 'admin' || profile?.role === 'manager') && (
            <button
              onClick={() => setIsGlobalCompleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <CheckCircle size={20} /> Tạo Biên Bản Hoàn Thành
            </button>
          )}
          <button
            onClick={() => {
              setEditingSlip(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Plus size={20} /> Thêm Phiếu Xuất
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
          placeholder="Tìm kiếm theo mã hoặc lý do..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Loading */}
      {loading && <div className="text-center py-4 text-gray-600">Đang tải dữ liệu...</div>}

      {/* Table & Mobile View */}
      {!loading && (
        <>
        <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto overflow-y-auto max-h-[calc(100vh-240px)]">
          <table className="w-full relative">
            <thead className="bg-gray-100 border-b sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Mã Phiếu</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Ngày</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Lý Do</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Số Mặt Hàng</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Trạng Thái</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Không có phiếu xuất nào
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip) => (
                  <tr key={slip.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{slip.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(slip.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{slip.reason || '-'}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700 font-semibold">
                      {(slip.items as any[])?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          getSlipDisplayStatus(slip) === 'Đã đóng'
                            ? 'bg-green-100 text-green-800'
                            : getSlipDisplayStatus(slip) === 'Đã hoàn thành'
                              ? 'bg-blue-100 text-blue-800'
                              : getSlipDisplayStatus(slip) === 'Đã khóa'
                                ? 'bg-gray-200 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {getSlipDisplayStatus(slip)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setDetailSlip(slip);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Xem chi tiết"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setPrintSlip(slip);
                            setIsPrintModalOpen(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="In phiếu xác nhận"
                        >
                          <Printer size={18} />
                        </button>
                        {((!isSlipLocked(slip.date) && slip.status !== 'Đã hoàn thành') || profile?.role === 'admin' || profile?.role === 'manager') && (
                          <button
                            onClick={() => {
                              setEditingSlip(slip);
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
                            onClick={() => handleDelete(slip.id)}
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
          {filteredSlips.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">Không có phiếu xuất nào</div>
          ) : (
            filteredSlips.map((slip) => (
              <div key={slip.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{slip.code}</h3>
                    <p className="text-sm text-gray-500">{new Date(slip.date).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    getSlipDisplayStatus(slip) === 'Đã đóng'
                      ? 'bg-green-100 text-green-800'
                      : getSlipDisplayStatus(slip) === 'Đã hoàn thành'
                        ? 'bg-blue-100 text-blue-800'
                        : getSlipDisplayStatus(slip) === 'Đã khóa'
                          ? 'bg-gray-200 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getSlipDisplayStatus(slip)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <span className="block text-xs text-gray-400">Lý do</span>
                  <span className="font-medium text-gray-800">{slip.reason || '-'}</span>
                </div>
                <div className="flex justify-end gap-2 border-t pt-3">
                  <button
                    onClick={() => {
                      setDetailSlip(slip);
                      setIsDetailModalOpen(true);
                    }}
                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
                    title="Xem chi tiết"
                  >
                    <FileText size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setPrintSlip(slip);
                      setIsPrintModalOpen(true);
                    }}
                    className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-md"
                    title="In phiếu xác nhận"
                  >
                    <Printer size={18} />
                  </button>
                  {((!isSlipLocked(slip.date) && slip.status !== 'Đã hoàn thành') || profile?.role === 'admin' || profile?.role === 'manager') && (
                    <button
                      onClick={() => {
                        setEditingSlip(slip);
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
                      onClick={() => handleDelete(slip.id)}
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
      <SlipModal
        isOpen={isModalOpen}
        slip={editingSlip}
        type={SlipType.Issue}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSlip(null);
        }}
      />

      <DetailSlipModal
        isOpen={isDetailModalOpen}
        slip={detailSlip}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailSlip(null);
        }}
      />

      <PrintCompletionReportModal
        isOpen={isPrintModalOpen}
        slip={printSlip}
        items={items}
        globalPrintItems={globalPrintItems}
        globalSourceSlipCodes={globalSourceSlipCodes}
        onClose={() => {
          setIsPrintModalOpen(false);
          setPrintSlip(null);
          setGlobalPrintItems([]);
          setGlobalSourceSlipCodes([]);
        }}
      />

      <GlobalCompletionModal
        isOpen={isGlobalCompleteModalOpen}
        onClose={() => setIsGlobalCompleteModalOpen(false)}
        onPrintReport={(itemsToPrint, sourceSlips) => {
          setGlobalPrintItems(itemsToPrint);
          setGlobalSourceSlipCodes(sourceSlips);
          setIsPrintModalOpen(true);
        }}
      />
    </div>
  );
};
