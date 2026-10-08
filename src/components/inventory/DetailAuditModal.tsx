import React, { useEffect, useState } from 'react';
import { X, FileText, Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { InventoryAudit, InventoryAuditItem, Item } from '../../types/inventory';
import { supabase } from '../../supabase-client';
import { itemFromDatabase } from '../../utils/dataTransform';

interface DetailAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: InventoryAudit | null;
}

export const DetailAuditModal: React.FC<DetailAuditModalProps> = ({ isOpen, onClose, audit }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [auditItems, setAuditItems] = useState<InventoryAuditItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !audit) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch audit items
        const { data: auditItemsData, error: itemsError } = await supabase
          .from('inventory_audit_items')
          .select('*')
          .eq('audit_id', audit.id);

        if (itemsError) throw itemsError;

        if (auditItemsData) {
          const transformedItems = auditItemsData.map(d => ({
            id: d.id,
            auditId: d.audit_id,
            itemId: d.item_id,
            systemStock: d.system_stock,
            actualStock: d.actual_stock,
            difference: d.difference,
            notes: d.notes
          }));
          setAuditItems(transformedItems);

          // Fetch inventory items
          const itemIds = transformedItems.map(i => i.itemId).filter(Boolean);
          if (itemIds.length > 0) {
            const { data: invData, error: invError } = await supabase
              .from('inventory_items')
              .select('*')
              .limit(999999); // Fetch all to avoid URI Too Long error with .in()

            if (invError) throw invError;
            if (invData) {
              setItems(invData.map((item: any) => itemFromDatabase(item)) as Item[]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading audit details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, audit?.id]);

  if (!isOpen || !audit) return null;

  const getItemName = (itemId: string) => {
    return items.find(i => i.id === itemId)?.name || `[Đã xóa] ${itemId}`;
  };

  const getItemCode = (itemId: string) => {
    return items.find(i => i.id === itemId)?.code || '-';
  };

  const getItemUnit = (itemId: string) => {
    return items.find(i => i.id === itemId)?.unit || '-';
  };

  const handleExportExcel = () => {
    if (!audit) return;

    // Prepare general information
    const generalInfo = [
      { A: "THÔNG TIN PHIẾU KIỂM KÊ" },
      { A: "Mã Phiếu:", B: audit.code },
      { A: "Ngày Lập:", B: new Date(audit.date).toLocaleDateString('vi-VN') },
      { A: "Người Lập:", B: audit.createdBy },
      { A: "Trạng Thái:", B: audit.status },
      { A: "Ghi Chú:", B: audit.notes || '' },
      {},
      { A: "DANH SÁCH VẬT TƯ" },
      { 
        A: "Mã Vật Tư", 
        B: "Tên Vật Tư", 
        C: "Đơn Vị", 
        D: "Tồn Hệ Thống", 
        E: "Tồn Thực Tế", 
        F: "Chênh Lệch",
        G: "Ghi chú"
      }
    ];

    // Prepare item rows
    const filteredAuditItems = auditItems.filter(item => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        const code = (getItemCode(item.itemId) || '').toLowerCase();
        const name = (getItemName(item.itemId) || '').toLowerCase();
        return code.includes(s) || name.includes(s);
    });
    
    const itemRows = filteredAuditItems.map(item => ({
      A: getItemCode(item.itemId),
      B: getItemName(item.itemId),
      C: getItemUnit(item.itemId),
      D: item.systemStock,
      E: item.actualStock,
      F: item.difference,
      G: item.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet([...generalInfo, ...itemRows], { skipHeader: true });

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Mã VT
      { wch: 40 }, // Tên VT
      { wch: 10 }, // Đơn vị
      { wch: 15 }, // Tồn HT
      { wch: 15 }, // Tồn TT
      { wch: 15 }, // Chênh lệch
      { wch: 30 }  // Ghi chú
    ];

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi Tiết Kiểm Kê");
    XLSX.writeFile(wb, `Phieu_Kiem_Ke_${audit.code}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[90vw] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <FileText className="text-indigo-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Chi tiết Phiếu Kiểm Kê</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-xs text-gray-500 mb-1">Mã Phiếu</p>
              <p className="font-semibold text-indigo-700">{audit.code}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Ngày Lập</p>
              <p className="font-medium text-gray-900">{new Date(audit.date).toLocaleDateString('vi-VN')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Người Lập</p>
              <p className="font-medium text-gray-900">{audit.createdBy}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Trạng Thái</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                audit.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {audit.status}
              </span>
            </div>
            <div className="col-span-full">
              <p className="text-xs text-gray-500 mb-1">Ghi Chú</p>
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 min-h-[60px]">
                {audit.notes || '-'}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Danh Sách Vật Tư Kiểm Kê</h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h3 className="font-semibold text-gray-800 text-lg mb-4 sm:mb-0 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              Chi tiết vật tư kiểm kê
            </h3>
            <div className="w-full sm:w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm vật tư..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">

                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-12 text-center">STT</th>
                      <th className="px-4 py-3 font-semibold">Vật Tư</th>
                      <th className="px-4 py-3 font-semibold">Đơn Vị</th>
                      <th className="px-4 py-3 font-semibold text-right">Tồn Hệ Thống</th>
                      <th className="px-4 py-3 font-semibold text-right">Tồn Thực Tế</th>
                      <th className="px-4 py-3 font-semibold text-right">Chênh Lệch</th>
                      <th className="px-4 py-3 font-semibold">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditItems
                      .filter(item => {
                        if (!searchTerm) return true;
                        const s = searchTerm.toLowerCase();
                        const code = (getItemCode(item.itemId) || '').toLowerCase();
                        const name = (getItemName(item.itemId) || '').toLowerCase();
                        return code.includes(s) || name.includes(s);
                      })
                      .map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-center text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900">
                          <span className="font-semibold text-base text-indigo-700 block mb-1">{getItemName(item.itemId)}</span>
                          <span className="text-sm text-gray-500">{getItemCode(item.itemId)}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{getItemUnit(item.itemId)}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">{item.systemStock}</td>
                        <td className="px-4 py-3 text-right text-indigo-600 font-medium">{item.actualStock}</td>
                        <td className={`px-4 py-3 text-right font-bold ${item.difference < 0 ? 'text-red-600' : item.difference > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {item.difference > 0 ? '+' : ''}{item.difference}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleExportExcel}
            className="px-6 py-2.5 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
};
