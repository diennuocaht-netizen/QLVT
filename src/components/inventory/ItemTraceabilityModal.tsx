import React, { useEffect, useState } from 'react';
import { X, FileText, TrendingUp, TrendingDown, Package, MapPin, Tag, Layers } from 'lucide-react';
import { Item, InventorySlip, SlipType, Requisition } from '../../types/inventory';
import { supabase } from '../../supabase-client';
import { slipFromDatabase, requisitionFromDatabase } from '../../utils/dataTransform';

interface ItemTraceabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
}

interface TraceabilityRecord {
  type: 'receipt' | 'issue' | 'requisition';
  code: string;
  date: string;
  quantity?: number;
  status: string;
  details: string;
}

export const ItemTraceabilityModal: React.FC<ItemTraceabilityModalProps> = ({ isOpen, onClose, item }) => {
  const [slips, setSlips] = useState<InventorySlip[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [records, setRecords] = useState<TraceabilityRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'receipts' | 'issues' | 'requisitions'>('all');
  const [locations, setLocations] = useState<{id: string, code: string, name: string}[]>([]);

  useEffect(() => {
    let channels: any[] = [];
    const loadAndSubscribe = async () => {
      // Load initial data
      const { data: slipsData } = await supabase.from('inventory_slips').select('*');
      if (slipsData) setSlips((slipsData || []).map(slip => slipFromDatabase(slip) as InventorySlip));

      const { data: reqsData } = await supabase.from('inventory_requisitions').select('*');
      if (reqsData) setRequisitions((reqsData || []).map(r => requisitionFromDatabase(r) as Requisition));

      const { data: locData } = await supabase.from('inventory_locations').select('*');
      if (locData) setLocations(locData);

      // Subscribe to changes
      const slipsChannel = supabase
        .channel('inventory_slips_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'inventory_slips' },
            () => {
            supabase.from('inventory_slips').select('*').then(({ data }) => {
              if (data) setSlips((data || []).map(slip => slipFromDatabase(slip) as InventorySlip));
            });
          }
        )
        .subscribe();
      channels.push(slipsChannel);

      const reqsChannel = supabase
        .channel('inventory_requisitions_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'inventory_requisitions' },
            () => {
              supabase.from('inventory_requisitions').select('*').then(({ data }) => {
                if (data) setRequisitions((data || []).map(r => requisitionFromDatabase(r) as Requisition));
              });
            }
        )
        .subscribe();
      channels.push(reqsChannel);
    };

    loadAndSubscribe();

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  useEffect(() => {
    if (!item) return;

    const newRecords: TraceabilityRecord[] = [];

    // Process receipts
    slips
      .filter(s => s.type === SlipType.Receipt)
      .forEach(slip => {
        const slipItem = slip.items.find(i => i.itemId === item.id);
        if (slipItem) {
          newRecords.push({
            type: 'receipt',
            code: slip.code,
            date: slip.date,
            quantity: slipItem.quantity,
            status: slip.status || 'Đang mở',
            details: `Phiếu nhập - Loại: ${slip.receiptType || 'N/A'}`
          });
        }
      });

    // Process issues
    slips
      .filter(s => s.type === SlipType.Issue)
      .forEach(slip => {
        const slipItem = slip.items.find(i => i.itemId === item.id);
        if (slipItem) {
          newRecords.push({
            type: 'issue',
            code: slip.code,
            date: slip.date,
            quantity: slipItem.quantity,
            status: slip.status || 'Đang mở',
            details: `Phiếu xuất - Người xuất: ${slipItem.handler || 'N/A'}, Hệ thống: ${slipItem.subsystem || 'N/A'}`
          });
        }
      });

    // Process requisitions
    requisitions.forEach(req => {
      const reqItem = req.items.find(i => i.itemId === item.id);
      if (reqItem) {
        newRecords.push({
          type: 'requisition',
          code: req.code,
          date: req.date,
          quantity: reqItem.requestedQuantity,
          status: req.status || 'Mới tạo',
          details: `Tờ trình mua sắm - Loại: ${req.type}, Đã nhập: ${reqItem.receivedQuantity}/${reqItem.requestedQuantity}`
        });
      }
    });

    // Sort by date descending
    newRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecords(newRecords);
  }, [item, slips, requisitions]);

  if (!isOpen || !item) return null;

  const receipts = records.filter(r => r.type === 'receipt');
  const issues = records.filter(r => r.type === 'issue');
  const reqs = records.filter(r => r.type === 'requisition');

  const displayRecords = 
    activeTab === 'all' ? records :
    activeTab === 'receipts' ? receipts :
    activeTab === 'issues' ? issues :
    reqs;

  const totalReceived = receipts.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalIssued = issues.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalRequisitioned = reqs.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const currentStock = (item.initialStock || 0) + totalReceived - totalIssued;
  const locationCode = locations.find(l => l.id === item.locationId)?.code || '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Truy xuất vật tư</h2>
            <p className="text-sm text-gray-600 mt-1">{item.code} - {item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Item Master Details */}
          <div className="p-6 bg-white border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package size={20} className="text-indigo-600" />
              Thông tin chi tiết
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Tag size={16} className="text-gray-500" />
                  <span className="text-xs text-gray-500 uppercase font-semibold">Danh mục</span>
                </div>
                <p className="font-medium text-gray-900">{item.category}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Layers size={16} className="text-gray-500" />
                  <span className="text-xs text-gray-500 uppercase font-semibold">Đơn vị tính</span>
                </div>
                <p className="font-medium text-gray-900">{item.unit}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={16} className="text-gray-500" />
                  <span className="text-xs text-gray-500 uppercase font-semibold">Vị trí kệ</span>
                </div>
                <p className="font-medium text-gray-900">{locationCode}</p>
              </div>
              <div className={`p-4 rounded-lg border ${currentStock <= 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Package size={16} className={currentStock <= 0 ? 'text-red-500' : 'text-green-500'} />
                  <span className={`text-xs uppercase font-semibold ${currentStock <= 0 ? 'text-red-600' : 'text-green-600'}`}>Tồn kho hiện tại</span>
                </div>
                <p className={`text-xl font-bold ${currentStock <= 0 ? 'text-red-700' : 'text-green-700'}`}>{currentStock}</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="p-6 bg-gray-50 border-b border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng số phiếu</p>
                  <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                </div>
                <FileText className="text-gray-400" size={24} />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Tổng nhập</p>
                  <p className="text-2xl font-bold text-green-700">{totalReceived}</p>
                </div>
                <TrendingUp className="text-green-400" size={24} />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Tổng xuất</p>
                  <p className="text-2xl font-bold text-red-700">{totalIssued}</p>
                </div>
                <TrendingDown className="text-red-400" size={24} />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Tờ trình</p>
                  <p className="text-2xl font-bold text-blue-700">{totalRequisitioned}</p>
                </div>
                <FileText className="text-blue-400" size={24} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="p-6">
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tất cả ({records.length})
              </button>
              <button
                onClick={() => setActiveTab('receipts')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'receipts'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Phiếu nhập ({receipts.length})
              </button>
              <button
                onClick={() => setActiveTab('issues')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'issues'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Phiếu xuất ({issues.length})
              </button>
              <button
                onClick={() => setActiveTab('requisitions')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'requisitions'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tờ trình ({reqs.length})
              </button>
            </div>

            {/* Records Table */}
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Mã Phiếu</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Ngày</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">Số lượng</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Loại</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Trạng thái</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayRecords.length > 0 ? (
                    displayRecords.map((record, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-indigo-600">{record.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.date}</td>
                        <td className="px-4 py-3 text-sm font-medium text-right">
                          <span className={
                            record.type === 'receipt' ? 'text-green-700' :
                            record.type === 'issue' ? 'text-red-700' :
                            'text-blue-700'
                          }>
                            {record.type === 'receipt' ? '+' : record.type === 'issue' ? '-' : '→'}
                            {record.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.type === 'receipt' ? 'bg-green-100 text-green-800' :
                            record.type === 'issue' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {record.type === 'receipt' ? 'Nhập' : record.type === 'issue' ? 'Xuất' : 'Tờ trình'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'Đã đóng' || record.status === 'Đã hoàn thành' ? 'bg-gray-100 text-gray-800' :
                            record.status === 'Đã duyệt' || record.status === 'Đã nhập đủ' ? 'bg-blue-100 text-blue-800' :
                            record.status === 'Từ chối' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.details}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Không có dữ liệu cho tab này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 p-6 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
