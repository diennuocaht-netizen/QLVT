import React, { useEffect, useState } from 'react';
import { X, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { InventorySlip, SlipType, Item, Requisition } from '../../types/inventory';
import { supabase } from '../../supabase-client';

interface DetailSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: InventorySlip | null;
}

export const DetailSlipModal: React.FC<DetailSlipModalProps> = ({ isOpen, onClose, slip }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const channels: any[] = [];

  useEffect(() => {
    let channel: any;
    const loadAndSubscribe = async () => {
      // Load initial data
      const { data } = await supabase.from('inventory_items').select('*');
      if (data) setItems(data as Item[]);

      // Subscribe to changes
      channel = supabase
        .channel('inventory_items_changes')
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

  useEffect(() => {
    let channel: any;
    const loadAndSubscribe = async () => {
      // Load initial data
      const { data } = await supabase.from('inventory_requisitions').select('*');
      if (data) setRequisitions(data as Requisition[]);

      // Subscribe to changes
      channel = supabase
        .channel('inventory_requisitions_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'inventory_requisitions' },
          () => {
            supabase.from('inventory_requisitions').select('*').then(({ data }) => {
              if (data) setRequisitions(data as Requisition[]);
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

  if (!isOpen || !slip) return null;

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

  const getRequisitionCode = (requisitionId: string) => {
    return requisitions.find(r => r.id === requisitionId)?.code || requisitionId;
  };

  const calculateTotalValue = () => {
    return slip.items.reduce((total, item) => {
      const price = getItemPrice(item.itemId);
      return total + (item.quantity * price);
    }, 0);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Đã hoàn thành':
      case 'Đã đóng':
        return 'bg-green-100 text-green-800';
      case 'Đã duyệt':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const isReceipt = slip.type === SlipType.Receipt;

  const handleExportExcel = () => {
    if (!slip) return;
    
    // Prepare general information
    const generalInfo = [
      { A: "THÔNG TIN PHIẾU" },
      { A: "Mã Phiếu:", B: slip.code },
      { A: "Ngày tạo:", B: new Date(slip.date).toLocaleDateString('vi-VN') },
      { A: "Người yêu cầu:", B: slip.requester || '-' },
      { A: "Lý do:", B: slip.reason || '-' },
      { A: "Ghi chú:", B: slip.notes || '-' },
      { A: "Trạng thái:", B: slip.status },
      {} // empty row
    ];

    // Prepare table headers
    const headerRow = {
      A: "Mã VT",
      B: "Tên Vật Tư",
      C: "Đơn Vị",
      D: "SL",
      E: "Đơn Giá",
      F: "Thành Tiền",
      G: "Ngày Giao/Nhận",
      H: "Người Giao/Nhận",
      I: "Hệ Thống",
      J: "Mục Đích",
      K: "Phương Thức",
      L: "Mã Chi Phí"
    };
    
    // Prepare item rows
    const itemRows = slip.items.map(item => {
      const price = getItemPrice(item.itemId);
      const totalPrice = item.quantity * price;
      return {
        A: getItemCode(item.itemId),
        B: getItemName(item.itemId),
        C: getItemUnit(item.itemId),
        D: item.quantity,
        E: price,
        F: totalPrice,
        G: isReceipt ? (item.receiveDate || '-') : (item.issueDate || '-'),
        H: item.handler || '-',
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
      F: calculateTotalValue()
    };

    const wsData = [...generalInfo, headerRow, ...itemRows, {}, totalRow];
    
    const ws = XLSX.utils.json_to_sheet(wsData, { skipHeader: true });
    
    // Adjust column widths
    ws['!cols'] = [
      { wch: 15 }, // Mã
      { wch: 30 }, // Tên
      { wch: 10 }, // Đơn vị
      { wch: 10 }, // SL
      { wch: 15 }, // Đơn giá
      { wch: 15 }, // Thành tiền
      { wch: 15 }, // Ngày
      { wch: 20 }, // Người
      { wch: 15 }, // Hệ thống
      { wch: 15 }, // Mục đích
      { wch: 15 }, // Phương thức
      { wch: 15 }, // Mã chi phí
    ];

    const wb = XLSX.utils.book_new();
    const sheetName = isReceipt ? "Phieu_Nhap" : "Phieu_Xuat";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}_${slip.code}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[90vw] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {isReceipt ? 'Chi tiết Phiếu Nhập' : 'Chi tiết Phiếu Xuất'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mã Phiếu</label>
                <p className="text-base font-semibold text-indigo-600">{slip.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ngày Lập</label>
                <p className="text-base text-gray-900">{slip.date}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Người Lập</label>
                <p className="text-base text-gray-900">{slip.createdBy}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Trạng Thái</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(slip.status)}`}>
                  {slip.status}
                </span>
              </div>
              {isReceipt && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Loại Nhập</label>
                  <p className="text-base text-gray-900">{slip.receiptType}</p>
                </div>
              )}
              {!isReceipt && slip.weekOfYear && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tuần/Kỳ</label>
                  <p className="text-base text-gray-900">{slip.weekOfYear}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-600 mb-2">Mục Đích / Lý Do</label>
            <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{slip.reason || '-'}</p>
          </div>

          {isReceipt && slip.handoverRecordUrl && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Biên bản nhận vật tư</label>
                  <p className="text-sm text-gray-700 mb-3">Tài liệu đã được upload khi đóng phiếu nhập.</p>
                </div>
              </div>
              <a
                href={slip.handoverRecordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <FileText size={16} />
                Tải xuống Biên bản
              </a>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh Sách Vật Tư</h3>
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {isReceipt ? (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Mã</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Tên Vật Tư</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Đơn Vị</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Số Lượng</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Đơn Giá</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Thành Tiền</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Tờ Trình</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Vật Tư</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Số Lượng</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Đơn Giá</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Thành Tiền</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày Xuất</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Người Xuất</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Hệ Thống</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Mục Đích</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Phương Thức</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Mã Chi Phí</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {slip.items.map((item, index) => {
                    const price = getItemPrice(item.itemId);
                    const totalPrice = item.quantity * price;
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        {isReceipt ? (
                          <>
                            <td className="px-4 py-3 text-gray-900 font-medium">{getItemCode(item.itemId)}</td>
                            <td className="px-4 py-3 text-gray-900">{getItemName(item.itemId)}</td>
                            <td className="px-4 py-3 text-gray-600">{getItemUnit(item.itemId)}</td>
                            <td className="px-4 py-3 text-right text-gray-900 font-medium">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{price.toLocaleString('vi-VN')} ₫</td>
                            <td className="px-4 py-3 text-right text-indigo-600 font-semibold">{totalPrice.toLocaleString('vi-VN')} ₫</td>
                            <td className="px-4 py-3 text-gray-600 text-sm">{item.requisitionId ? `Tờ trình: ${getRequisitionCode(item.requisitionId)}` : 'Nhận ngoài'}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-gray-900">
                              <span className="font-medium">{getItemCode(item.itemId)}</span>
                              <br />
                              <span className="text-sm text-gray-600">{getItemName(item.itemId)}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 font-medium">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{price.toLocaleString('vi-VN')} ₫</td>
                            <td className="px-4 py-3 text-right text-indigo-600 font-semibold">{totalPrice.toLocaleString('vi-VN')} ₫</td>
                            <td className="px-4 py-3 text-gray-600">{item.issueDate || '-'}</td>
                            <td className="px-4 py-3 text-gray-900">{item.handler || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.subsystem || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.purpose || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.method || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.costCode || '-'}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isReceipt && (
              <div className="mt-4 flex justify-end">
                <div className="text-right space-y-2">
                  <div className="flex gap-4 items-center justify-end">
                    <span className="text-gray-600">Tổng Giá Trị:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {calculateTotalValue().toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              </div>
            )}
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
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Download size={20} /> Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
};
