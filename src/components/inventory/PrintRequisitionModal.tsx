import React, { useRef, useEffect, useState } from 'react';
import { X, Printer } from 'lucide-react';
import { Requisition, Item, InventorySlip, SlipType, RequisitionType } from '../../types/inventory';
import { supabase } from '../../supabase-client';
import { itemFromDatabase, slipFromDatabase } from '../../utils/dataTransform';

interface PrintRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: Requisition | null;
}

export const PrintRequisitionModal: React.FC<PrintRequisitionModalProps> = ({
  isOpen,
  onClose,
  requisition
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [slips, setSlips] = useState<InventorySlip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !requisition) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const { data: itemsData } = await supabase.from('inventory_items').select('*');
        if (itemsData) setItems(itemsData.map(item => itemFromDatabase(item) as Item));

        const { data: slipsData } = await supabase.from('inventory_slips').select('*');
        if (slipsData) setSlips(slipsData.map(slip => slipFromDatabase(slip) as InventorySlip));
      } catch (error) {
        console.error('Error loading data for print:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, requisition]);

  if (!isOpen || !requisition) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép popup để in tờ trình.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${requisition.code} - In Tờ Trình Mua Sắm</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
              @page { size: A4 landscape; margin: 15mm; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              .no-print { display: none !important; }
            }
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 6px; }
            th { text-align: center; font-weight: bold; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 1000)">
          <div style="width: 100%; max-width: 297mm; margin: auto;">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Compute current stock for an item
  const getCurrentStock = (itemId: string, itemData?: Item) => {
    if (!itemData) return 0;
    const receipts = slips.filter(s => s.type === SlipType.Receipt);
    const issues = slips.filter(s => s.type === SlipType.Issue);

    const totalReceived = receipts.reduce((sum, s) => {
      const si = s.items.find(i => i.itemId === itemId);
      return sum + (si?.quantity || 0);
    }, 0);

    const totalIssued = issues.reduce((sum, s) => {
      const si = s.items.find(i => i.itemId === itemId);
      return sum + (si?.quantity || 0);
    }, 0);

    return (itemData.initialStock || 0) + totalReceived - totalIssued;
  };

  // Group items by costCode + subsystem
  const groupedItems = requisition.items.reduce((acc, reqItem) => {
    const key = `${reqItem.costCode || 'Không mã'}: ${reqItem.subsystem || 'Không phân hệ'}`;
    if (!acc[key]) acc[key] = { costCode: reqItem.costCode, subsystem: reqItem.subsystem, items: [] };
    acc[key].items.push(reqItem);
    return acc;
  }, {} as Record<string, { costCode: string; subsystem: string; items: typeof requisition.items }>);

  // Roman numeral generator for group headers
  const toRoman = (num: number): string => {
    const roman: Record<string, number> = {
      M: 1000, CM: 900, D: 500, CD: 400,
      C: 100, XC: 90, L: 50, XL: 40,
      X: 10, IX: 9, V: 5, IV: 4, I: 1
    };
    let str = '';
    for (const i of Object.keys(roman)) {
      const q = Math.floor(num / roman[i]);
      num -= q * roman[i];
      str += i.repeat(q);
    }
    return str;
  };

  const isUrgent = requisition.type === RequisitionType.Urgent;
  let globalRowIndex = 1;
  let groupIndex = 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-full md:h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">In Tờ Trình Mua Sắm ({requisition.code})</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Printer size={18} /> {loading ? 'Đang tải...' : 'In Tờ Trình'}
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Printable Area Wrapper (Scrollable in Modal) */}
        <div className="flex-1 overflow-auto p-8 bg-gray-100 flex justify-center">
          
          {/* A4 Landscape Container */}
          <div 
            ref={printRef} 
            className="bg-white shadow-sm p-[15mm] mx-auto w-full max-w-[297mm] min-h-[210mm] text-black"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Template Header block */}
            <div className="mb-6 border border-black p-4 text-[11pt]">
              <table className="w-full border-none">
                <tbody>
                  <tr>
                    <td className="w-48 font-bold align-top border-none p-1">Hạng mục kế hoạch</td>
                    <td className="border-none p-1">
                      Chi phí OPEX {new Date().getFullYear()}:
                      <ul className="list-none m-0 p-0 pl-2">
                        {Object.values(groupedItems).map((group, idx) => (
                          <li key={idx}>- {group.costCode}: {group.subsystem}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table Title */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold uppercase mb-1">KHỐI LƯỢNG VẬT TƯ</h1>
              <p className="text-sm font-bold">(Đính kèm Tờ trình số {requisition.code} ngày {new Date(requisition.date).toLocaleDateString('vi-VN')})</p>
            </div>

            {/* Main Table */}
            <div className="mb-10">
              <table className="w-full border-collapse text-[11pt] border border-black">
                <thead>
                  <tr>
                    <th className="w-12 text-center border border-black p-2 font-bold">TT</th>
                    <th className="w-24 text-center border border-black p-2 font-bold">Mã chi phí</th>
                    <th className="w-24 text-center border border-black p-2 font-bold">Mã vật tư<br/>(nếu có)</th>
                    <th className="text-center border border-black p-2 font-bold">Mô tả chung về hàng hóa hoặc dịch vụ</th>
                    <th className="w-16 text-center border border-black p-2 font-bold">Đơn vị tính</th>
                    <th className="w-16 text-center border border-black p-2 font-bold">Số lượng dự kiến</th>
                    <th className="w-16 text-center border border-black p-2 font-bold">Số lượng tồn kho hiện tại</th>
                    <th className="w-48 text-center border border-black p-2 font-bold">Phạm vi công việc, Thông số sản phẩm</th>
                    <th className="w-32 text-center border border-black p-2 font-bold">Ghi chú, hình ảnh (nếu có)</th>
                    <th className="w-24 text-center border border-black p-2 font-bold">Kế hoạch/Phát sinh hạng mục</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedItems).map(([key, group]) => (
                    <React.Fragment key={key}>
                      {/* Group Header Row */}
                      <tr className="bg-gray-100">
                        <td className="text-center border border-black p-2 font-bold">
                          {toRoman(groupIndex++)}
                        </td>
                        <td colSpan={9} className="border border-black p-2 font-bold text-left uppercase">
                          {group.subsystem}
                        </td>
                      </tr>
                      {/* Items */}
                      {group.items.map((reqItem, index) => {
                        const itemData = items.find(i => i.id === reqItem.itemId);
                        const stock = getCurrentStock(reqItem.itemId, itemData);
                        return (
                          <tr key={`${reqItem.id}-${index}`}>
                            <td className="text-center border border-black p-2">{globalRowIndex++}</td>
                            <td className="text-center border border-black p-2">{reqItem.costCode || ''}</td>
                            <td className="text-center border border-black p-2">{itemData?.code || ''}</td>
                            <td className="border border-black p-2">{itemData?.name || 'Không xác định'}</td>
                            <td className="text-center border border-black p-2">{itemData?.unit || ''}</td>
                            <td className="text-center border border-black p-2">{reqItem.requestedQuantity}</td>
                            <td className="text-center border border-black p-2">{stock}</td>
                            <td className="border border-black p-2">{reqItem.purpose || ''}</td>
                            <td className="border border-black p-2">{reqItem.notes || ''}</td>
                            <td className="text-center border border-black p-2">{isUrgent ? 'Phát sinh' : 'Kế hoạch'}</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
