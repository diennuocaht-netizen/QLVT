import React, { useRef, useEffect, useState } from 'react';
import { X, Printer } from 'lucide-react';
import { InventorySlip, Item } from '../../types/inventory';

interface PrintCompletionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip?: InventorySlip | null;
  items: Item[]; // All items lookup
  globalPrintItems?: any[];
  globalSourceSlipCodes?: string[];
}

export const PrintCompletionReportModal: React.FC<PrintCompletionReportModalProps> = ({
  isOpen,
  onClose,
  slip,
  items,
  globalPrintItems,
  globalSourceSlipCodes
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [reportTitle, setReportTitle] = useState('PHIẾU XÁC NHẬN HOÀN THÀNH CÔNG VIỆC');
  const [itemsToPrint, setItemsToPrint] = useState<any[]>([]);

  const isGlobalPrint = globalPrintItems && globalPrintItems.length > 0;

  useEffect(() => {
    if (isGlobalPrint) {
      setReportTitle('PHIẾU XÁC NHẬN HOÀN THÀNH CÔNG VIỆC TỔNG HỢP');
      setItemsToPrint(globalPrintItems);
    } else if (slip) {
      setReportTitle(`${slip.code} - Phiếu xác nhận hoàn thành công việc`);
      setItemsToPrint(slip.items);
    }
  }, [slip, globalPrintItems, isGlobalPrint]);

  if (!isOpen || (!slip && !isGlobalPrint)) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép popup để in phiếu.');
      return;
    }

    // Include Tailwind CSS for printing
    printWindow.document.write(`
      <html>
        <head>
          <title>${isGlobalPrint ? 'Tổng hợp' : slip?.code} - In Phiếu</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
              @page { size: A4 portrait; margin: 15mm; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              .no-print { display: none !important; }
            }
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 6px; }
            th { text-align: center; font-weight: bold; background-color: #f3f4f6 !important; }
            .subsystem-row { font-weight: bold; text-align: left !important; padding-left: 10px !important; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 1000)">
          <div style="width: 100%; max-width: 210mm; margin: auto;">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Group items by subsystem
  const groupedItems = itemsToPrint.reduce((acc, item) => {
    const subsystem = item.subsystem || 'Khác';
    if (!acc[subsystem]) acc[subsystem] = [];
    acc[subsystem].push(item);
    return acc;
  }, {} as Record<string, typeof itemsToPrint>);

  let globalRowIndex = 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-full md:h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">In Phiếu Xác Nhận {slip?.code ? `(${slip.code})` : '(Tổng hợp)'}</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Printer size={18} /> In Phiếu
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Printable Area Wrapper (Scrollable in Modal) */}
        <div className="flex-1 overflow-auto p-8 bg-gray-100 flex justify-center">
          
          {/* A4 Paper Container */}
          <div 
            ref={printRef} 
            className="bg-white shadow-sm p-[15mm] mx-auto w-full max-w-[210mm] min-h-[297mm] text-black"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Report Header */}
            <div className="text-center mb-8">
              <h1 className="text-xl font-bold uppercase mb-2">PHIẾU XÁC NHẬN HOÀN THÀNH CÔNG VIỆC</h1>
              {isGlobalPrint ? (
                <p className="text-sm font-bold italic">Từ các phiếu: {globalSourceSlipCodes?.join(', ')}</p>
              ) : (
                <p className="text-sm font-bold italic">Tuần {slip?.code.split('-')[0]?.replace('Tuần ', '') || ''}</p>
              )}
            </div>

            {/* Table */}
            <div className="mb-10">
              <table className="w-full border-collapse text-[11pt] border border-black">
                <thead>
                  <tr>
                    <th className="w-12 text-center border border-black p-2 font-bold bg-gray-50">STT</th>
                    {isGlobalPrint && <th className="w-24 text-center border border-black p-2 font-bold bg-gray-50">Nguồn</th>}
                    <th className="w-24 text-center border border-black p-2 font-bold bg-gray-50">Mã chi phí</th>
                    <th className="text-center border border-black p-2 font-bold bg-gray-50">Tên vật tư</th>
                    <th className="w-28 text-center border border-black p-2 font-bold bg-gray-50">Mã vật tư</th>
                    <th className="w-16 text-center border border-black p-2 font-bold bg-gray-50">ĐVT</th>
                    <th className="w-20 text-center border border-black p-2 font-bold bg-gray-50">Số lượng</th>
                    <th className="text-center border border-black p-2 font-bold bg-gray-50">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedItems).map(([subsystem, slipItems]) => (
                    <React.Fragment key={subsystem}>
                      {/* Group Header Row */}
                      <tr>
                        <td colSpan={isGlobalPrint ? 8 : 7} className="border border-black p-2 font-bold text-left italic">
                          {subsystem}
                        </td>
                      </tr>
                      {/* Items */}
                      {slipItems.map((slipItem, index) => {
                        const itemData = items.find(i => i.id === slipItem.itemId);
                        return (
                          <tr key={`${slipItem.itemId}-${index}`}>
                            <td className="text-center border border-black p-2">{globalRowIndex++}</td>
                            {isGlobalPrint && <td className="text-center border border-black p-2 font-medium text-indigo-700">{slipItem.sourceSlipCode || ''}</td>}
                            <td className="text-center border border-black p-2">{slipItem.costCode || ''}</td>
                            <td className="border border-black p-2">{itemData?.name || 'Không xác định'}</td>
                            <td className="border border-black p-2">{itemData?.code || ''}</td>
                            <td className="text-center border border-black p-2">{itemData?.unit || ''}</td>
                            <td className="text-center border border-black p-2 font-semibold">{slipItem.quantity}</td>
                            <td className="border border-black p-2">{slipItem.notes || slipItem.purpose || ''}</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-5 gap-4 text-center text-[10pt] font-bold mt-12">
              <div>
                <p>PHÒNG KỸ THUẬT</p>
                <div className="h-28"></div>
              </div>
              <div>
                <p>PHÒNG CHIẾN LƯỢC<br/>VÀ ĐẦU TƯ</p>
                <div className="h-28"></div>
              </div>
              <div>
                <p>PHÒNG TÀI CHÍNH<br/>KẾ TOÁN</p>
                <div className="h-28"></div>
              </div>
              <div>
                <p>Người thực hiện</p>
                <div className="h-28"></div>
                <p className="font-normal italic">{isGlobalPrint ? '' : slip?.createdBy}</p>
              </div>
              <div>
                <p>Người kiểm tra</p>
                <div className="h-28"></div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
