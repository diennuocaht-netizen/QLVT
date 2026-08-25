import React, { useEffect, useState } from 'react';
import { X, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Requisition, RequisitionItem, RequisitionItemStatus, Item } from '../../types/inventory';
import { supabase } from '../../supabase-client';

interface DetailRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: Requisition | null;
}

export const DetailRequisitionModal: React.FC<DetailRequisitionModalProps> = ({ isOpen, onClose, requisition }) => {
  const [items, setItems] = useState<Item[]>([]);

  const handleExportExcel = () => {
    if (!requisition) return;

    // Prepare general information
    const generalInfo = [
      { A: "TỜ TRÌNH MUA SẮM" },
      { A: "Mã Tờ Trình:", B: requisition.code },
      { A: "Ngày tạo:", B: new Date(requisition.date).toLocaleDateString('vi-VN') },
      { A: "Người yêu cầu:", B: requisition.createdBy || '-' },
      { A: "Mục đích:", B: requisition.purpose || '-' },
      { A: "Ghi chú:", B: requisition.notes || '-' },
      { A: "Trạng thái:", B: requisition.status },
      {} // empty row
    ];

    // Prepare table headers
    const headerRow = {
      A: "Mã VT",
      B: "Tên Vật Tư",
      C: "Đơn Vị",
      D: "Yêu Cầu",
      E: "Đã Nhập",
      F: "Đơn Giá",
      G: "Thành Tiền",
      H: "Trạng Thái",
      I: "Hệ Thống",
      J: "Mục Đích",
      K: "Phương Thức",
      L: "Mã Chi Phí"
    };

    // Prepare item rows
    const itemRows = requisition.items.map(item => {
      const price = getItemPrice(item.itemId);
      const totalPrice = item.requestedQuantity * price;
      return {
        A: getItemCode(item.itemId),
        B: getItemName(item.itemId),
        C: getItemUnit(item.itemId),
        D: item.requestedQuantity,
        E: item.receivedQuantity,
        F: price,
        G: totalPrice,
        H: item.itemStatus,
        I: item.subsystem || '-',
        J: item.purpose || '-',
        K: item.method || '-',
        L: item.costCode || '-'
      };
    });

    const totalRow = {
      A: "Tổng Giá Trị:",
      B: "",
      C: "",
      D: "",
      E: "",
      F: "",
      G: calculateTotalValue()
    };

    const wsData = [...generalInfo, headerRow, ...itemRows, {}, totalRow];
    
    const ws = XLSX.utils.json_to_sheet(wsData, { skipHeader: true });
    
    // Adjust column widths
    ws['!cols'] = [
      { wch: 15 }, // Mã
      { wch: 30 }, // Tên
      { wch: 10 }, // Đơn vị
      { wch: 10 }, // Yêu cầu
      { wch: 10 }, // Đã nhập
      { wch: 15 }, // Đơn giá
      { wch: 15 }, // Thành tiền
      { wch: 20 }, // Trạng thái
      { wch: 15 }, // Hệ thống
      { wch: 15 }, // Mục đích
      { wch: 15 }, // Phương thức
      { wch: 15 }, // Mã chi phí
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "To_Trinh");
    XLSX.writeFile(wb, `To_Trinh_${requisition.code}.xlsx`);
  };

  useEffect(() => {
    let channel: any;
    const loadAndSubscribe = async () => {
      // Load initial data
      const { data } = await supabase.from('inventory_items').select('*');
      if (data) setItems(data as Item[]);

      // Subscribe to changes
      channel = supabase
        .channel(`inventory_items_changes_${Math.random()}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'inventory_items' },
          () => {
            supabase.from('inventory_items').select('*').then(({ data }) => {
              if (data) setItems(data as Item[]);
            });
          }
        )
        .subscribe();
    };
    loadAndSubscribe();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (!isOpen || !requisition) return null;

  const getItemName = (itemId: string) => {
    return items.find(i => i.id === itemId)?.name || itemId;
  };

  const getItemCode = (itemId: string) => {
    return items.find(i => i.id === itemId)?.code || '-';
  };

  const getItemUnit = (itemId: string) => {
    return items.find(i => i.id === itemId)?.unit || '-';
  };

  const getItemPrice = (itemId: string) => {
    return items.find(i => i.id === itemId)?.unitPrice || 0;
  };

  const calculateTotalValue = () => {
    return requisition.items.reduce((total, item) => {
      const price = getItemPrice(item.itemId);
      return total + (item.requestedQuantity * price);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đã duyệt':
        return 'bg-blue-100 text-blue-800';
      case 'Đã nhập đủ':
        return 'bg-green-100 text-green-800';
      case 'Từ chối':
      case 'Đã đóng':
        return 'bg-red-100 text-red-800';
      case 'Đã nhập 1 phần':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getItemStatusColor = (itemStatus: RequisitionItemStatus) => {
    return itemStatus === RequisitionItemStatus.Completed
      ? 'bg-green-50 text-green-800'
      : 'bg-orange-50 text-orange-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[90vw] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết Tờ Trình Mua Vật Tư</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mã Tờ Trình</label>
                <p className="text-base font-semibold text-indigo-600">{requisition.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ngày Tạo</label>
                <p className="text-base text-gray-900">{requisition.date}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Người Tạo</label>
                <p className="text-base text-gray-900">{requisition.createdBy}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Trạng Thái</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(requisition.status)}`}>
                  {requisition.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Loại</label>
                <p className="text-base text-gray-900">{requisition.type}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-600 mb-2">Mục Đích</label>
            <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{requisition.purpose}</p>
          </div>

          <div className="mb-8">
            {requisition.notes && (
              <>
                <label className="block text-sm font-medium text-gray-600 mb-2">Ghi Chú</label>
                <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{requisition.notes}</p>
              </>
            )}
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh Sách Vật Tư Yêu Cầu</h3>
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Mã</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Tên Vật Tư</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Đơn Vị</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Yêu Cầu</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Đã Nhập</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Đơn Giá</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Thành Tiền</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng Thái</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Hệ Thống</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Mục Đích</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Phương Thức</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Mã Chi Phí</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requisition.items.map((item, index) => {
                    const price = getItemPrice(item.itemId);
                    const totalPrice = item.requestedQuantity * price;
                    const remaining = item.requestedQuantity - item.receivedQuantity;
                    return (
                      <tr key={index} className={`hover:bg-gray-50 ${item.itemStatus === RequisitionItemStatus.Completed ? 'bg-green-50' : ''}`}>
                        <td className="px-4 py-3 text-gray-900 font-medium">{getItemCode(item.itemId)}</td>
                        <td className="px-4 py-3 text-gray-900">{getItemName(item.itemId)}</td>
                        <td className="px-4 py-3 text-gray-600">{getItemUnit(item.itemId)}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">{item.requestedQuantity}</td>
                        <td className="px-4 py-3 text-right text-indigo-600 font-medium">{item.receivedQuantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{price.toLocaleString('vi-VN')} ₫</td>
                        <td className="px-4 py-3 text-right text-indigo-600 font-semibold">{totalPrice.toLocaleString('vi-VN')} ₫</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getItemStatusColor(item.itemStatus)}`}>
                            {item.itemStatus}
                            {remaining > 0 && ` (${remaining} còn lại)`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{item.subsystem || '-'}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{item.purpose || '-'}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{item.method || '-'}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{item.costCode || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="text-right space-y-2">
                <div className="flex gap-4 items-center justify-end">
                  <span className="text-gray-600">Tổng Giá Trị Yêu Cầu:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {calculateTotalValue().toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
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
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Download size={20} /> Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
};
