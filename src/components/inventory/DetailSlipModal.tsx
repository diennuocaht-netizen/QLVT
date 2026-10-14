import React, { useEffect, useState } from 'react';
import { X, FileText, Download, Printer, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { InventorySlip, SlipType, Item, Requisition } from '../../types/inventory';
import { supabase } from '../../supabase-client';
import { itemFromDatabase } from '../../utils/dataTransform';
import { PrintCompletionReportModal } from './PrintCompletionReportModal';

interface DetailSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: InventorySlip | null;
}

export const DetailSlipModal: React.FC<DetailSlipModalProps> = ({ isOpen, onClose, slip }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const channels: any[] = [];

  useEffect(() => {
    let channel: any;
    const loadAndSubscribe = async () => {
      // Load initial data
      
        const { data, error } = await supabase.from('inventory_items').select('*').order('created_at', { ascending: false }).limit(999999);

      if (data) setItems(data.map((item: any) => itemFromDatabase(item)) as Item[]);

      // Subscribe to changes
      channel = supabase
        .channel(`inventory_items_changes_${Math.random()}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'inventory_items' },
          () => {
            


              supabase.from('inventory_items').select('*').order('created_at', { ascending: false }).limit(999999).then
(({ data }) => {
              if (data) setItems(data.map((item: any) => itemFromDatabase(item)) as Item[]);
            });
          }
        )
        .subscribe();
    };
    loadAndSubscribe();
      return () => {
        if (channel) supabase.removeChannel(channel);
      };
    }, [slip?.id]);

  useEffect(() => {
    let channel: any;
    const loadAndSubscribe = async () => {
      // Load initial data
      const { data } = await supabase.from('inventory_requisitions').select('*').limit(999999);
      if (data) setRequisitions(data as Requisition[]);

      // Subscribe to changes
      channel = supabase
        .channel(`inventory_requisitions_changes_${Math.random()}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'inventory_requisitions' },
          () => {
            supabase.from('inventory_requisitions').select('*').limit(999999).then(({ data }) => {
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
    }, [slip?.id]);

  if (!isOpen || !slip) return null;

  const getRequisitionItem = (itemObj?: any) => {
    if (!itemObj) return undefined;
    const reqId = itemObj.requisitionId;
    if (!reqId) return undefined;
    const req = requisitions.find(r => r.id === reqId || r.code === reqId);
    if (!req || !req.items) return undefined;
    return req.items.find((ri: any) => (ri.id && itemObj.requisitionItemId && ri.id === itemObj.requisitionItemId) || ri.itemId === itemObj.itemId);
  };

  const getItemName = (itemId: string, itemObj?: any) => {
      console.log('getting name for', itemId, 'from items:', items.map(i => i.id));

    const rawName = itemObj?.itemName || itemObj?.item_name;
    if (rawName) return rawName;
    const byId = items.find(i => i.id === itemId);
    if (byId?.name) return byId.name;
    const rawCode = itemObj?.itemCode || itemObj?.item_code;
    if (rawCode) {
      const byCode = items.find(i => i.code === rawCode);
      if (byCode?.name) return byCode.name;
    }
    const reqItem = getRequisitionItem(itemObj);
    const reqName = reqItem?.itemName || (reqItem as any)?.item_name;
    if (reqName) return reqName;

    const reqCode = reqItem?.itemCode || (reqItem as any)?.item_code;
    if (reqCode) {
      const byReqCode = items.find(i => i.code === reqCode);
      if (byReqCode?.name) return byReqCode.name;
    }

    if (reqItem?.itemId && reqItem.itemId !== itemId) {
      const byReqId = items.find(i => i.id === reqItem.itemId);
      if (byReqId?.name) return byReqId.name;
    }

    return `[Đã xóa] ${rawCode || reqCode || itemId}`;
  };

  const getItemCode = (itemId: string, itemObj?: any) => {
    const rawCode = itemObj?.itemCode || itemObj?.item_code;
    if (rawCode) return rawCode;
    const byId = items.find(i => i.id === itemId);
    if (byId?.code) return byId.code;
    const reqItem = getRequisitionItem(itemObj);
    const reqCode = reqItem?.itemCode || (reqItem as any)?.item_code;
    if (reqCode) return reqCode;
    if (reqItem?.itemId) {
      const byReqId = items.find(i => i.id === reqItem.itemId);
      if (byReqId?.code) return byReqId.code;
    }
    return '-';
  };

  const getItemUnit = (itemId: string, itemObj?: any) => {
    const rawUnit = itemObj?.unit;
    if (rawUnit) return rawUnit;
    const byId = items.find(i => i.id === itemId);
    if (byId?.unit) return byId.unit;
    const rawCode = itemObj?.itemCode || itemObj?.item_code;
    if (rawCode) {
      const byCode = items.find(i => i.code === rawCode);
      if (byCode?.unit) return byCode.unit;
    }
    const reqItem = getRequisitionItem(itemObj);
    const reqUnit = reqItem?.unit;
    if (reqUnit) return reqUnit;
    const reqCode = reqItem?.itemCode || (reqItem as any)?.item_code;
    if (reqCode) {
      const byReqCode = items.find(i => i.code === reqCode);
      if (byReqCode?.unit) return byReqCode.unit;
    }
    return '-';
  };

  const getItemPrice = (itemId: string, itemObj?: any) => {
    const rawPrice = itemObj?.unitPrice ?? itemObj?.unit_price;
    if (rawPrice !== undefined && rawPrice !== null && rawPrice !== 0) return rawPrice;
    const byId = items.find(i => i.id === itemId);
    if (byId?.unitPrice !== undefined && byId?.unitPrice !== null) return byId.unitPrice;
    const rawCode = itemObj?.itemCode || itemObj?.item_code;
    if (rawCode) {
      const byCode = items.find(i => i.code === rawCode);
      if (byCode?.unitPrice !== undefined && byCode?.unitPrice !== null) return byCode.unitPrice;
    }
    const reqItem = getRequisitionItem(itemObj);
    const reqPrice = reqItem?.unitPrice ?? (reqItem as any)?.unit_price;
    if (reqPrice !== undefined && reqPrice !== null) return reqPrice;
    return 0;
  };

  const getRequisitionCode = (requisitionId: string) => {
    return requisitions.find(r => r.id === requisitionId)?.code || requisitionId;
  };

  const calculateTotalValue = () => {
    return slip.items.reduce((total, item) => {
      const price = getItemPrice(item.itemId, item);
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
      L: "Mã Chi Phí",
      M: !isReceipt ? "Hoàn Thành" : ""
    };
    
    // Prepare item rows
    const itemRows = slip.items.map(item => {
      const price = getItemPrice(item.itemId, item);
      const totalPrice = item.quantity * price;
      return {
        A: getItemCode(item.itemId, item),
        B: getItemName(item.itemId, item),
        C: getItemUnit(item.itemId, item),
        D: item.quantity,
        E: price,
        F: totalPrice,
        G: isReceipt ? (item.receiveDate || '-') : (item.issueDate || '-'),
        H: item.handler || '-',
        I: item.subsystem || '-',
        J: item.purpose || '-',
        K: item.method || '-',
        L: item.costCode || '-',
        M: !isReceipt ? `${item.completedQuantity || 0} / ${item.quantity}` : '-'
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
                Mở / Tải xuống Biên bản
              </a>
            </div>
          )}

          {isReceipt && slip.status === 'Đã đóng' && !slip.handoverRecordUrl && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <label className="block text-sm font-semibold text-amber-900 mb-1">Chưa có Biên bản nhận vật tư</label>
                <p className="text-sm text-amber-700">Phiếu nhập này đã ở trạng thái Đóng nhưng chưa được đính kèm link Biên bản nhận vật tư / Tài liệu chứng từ.</p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh Sách Vật Tư</h3>
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {isReceipt ? (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Vật Tư</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Đơn Vị</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Số Lượng</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Đơn Giá</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Thành Tiền</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Tờ Trình</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Ghi chú</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Vật Tư</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Số Lượng</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Hoàn Thành</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Đơn Giá</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Thành Tiền</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày Xuất</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Người Xuất</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Hệ Thống</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Mục Đích</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Phương Thức</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Mã Chi Phí</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Ghi chú</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {slip.items.map((item, index) => {
                    const price = getItemPrice(item.itemId, item);
                    const totalPrice = item.quantity * price;
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        {isReceipt ? (
                          <>
                            <td className="px-4 py-3 text-gray-900">
                                <span className="font-semibold text-base text-indigo-700 block mb-1">{getItemName(item.itemId, item)}</span>
                                <span className="text-sm text-gray-500">{getItemCode(item.itemId, item)}</span>
                              </td>
                            <td className="px-4 py-3 text-gray-600">{getItemUnit(item.itemId, item)}</td>
                            <td className="px-4 py-3 text-right text-gray-900 font-medium">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{price.toLocaleString('vi-VN')} ₫</td>
                            <td className="px-4 py-3 text-right text-indigo-600 font-semibold">{totalPrice.toLocaleString('vi-VN')} ₫</td>
                            <td className="px-4 py-3 text-gray-600 text-sm">{item.requisitionId ? `Tờ trình: ${getRequisitionCode(item.requisitionId)}` : 'Nhận ngoài'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.notes || '-'}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-gray-900">
                              <span className="font-semibold text-base text-indigo-700 block mb-1">{getItemName(item.itemId, item)}</span>
                                <span className="text-sm text-gray-500">{getItemCode(item.itemId, item)}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 font-medium">{item.quantity}</td>
                            <td className="px-4 py-3 text-center text-teal-600 font-semibold">{item.completedQuantity || 0} / {item.quantity}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{price.toLocaleString('vi-VN')} ₫</td>
                            <td className="px-4 py-3 text-right text-indigo-600 font-semibold">{totalPrice.toLocaleString('vi-VN')} ₫</td>
                            <td className="px-4 py-3 text-gray-600">{item.issueDate || '-'}</td>
                            <td className="px-4 py-3 text-gray-900">{item.handler || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.subsystem || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.purpose || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.method || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.costCode || '-'}</td>
                              <td className="px-4 py-3 text-gray-600">{item.notes || '-'}</td>
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
          {!isReceipt && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Printer size={20} /> In Phiếu Xác Nhận
            </button>
          )}
        </div>
      </div>

      <PrintCompletionReportModal
        isOpen={isPrintModalOpen}
        slip={slip}
        items={items}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
