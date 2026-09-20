import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Item } from '../../types/inventory';
import { useReactToPrint } from 'react-to-print';

interface BulkPrintQRModalProps {
  isOpen: boolean;
  items: Item[];
  onClose: () => void;
}

export const BulkPrintQRModal: React.FC<BulkPrintQRModalProps> = ({ isOpen, items, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'In_Tem_QR_Hang_Loat',
  });

  if (!isOpen || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">In Tem Nhãn QR Hàng Loạt ({items.length} tem)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto bg-gray-100">
          <div className="flex justify-center">
            {/* Content to print */}
            <div className="bg-white shadow-sm border border-gray-200 p-4" style={{ minHeight: '297mm', width: '210mm' }}>
              <div ref={printRef} className="print-container">
                <style>
                  {`
                    @media print {
                      @page { size: A4; margin: 10mm; }
                      body { margin: 0; background: #fff; -webkit-print-color-adjust: exact; }
                      .print-container { 
                        display: flex !important; 
                        flex-wrap: wrap !important; 
                        gap: 10mm !important; 
                        justify-content: flex-start !important;
                        align-content: flex-start !important;
                      }
                      .label-item {
                        width: 53mm !important;
                        height: 70mm !important;
                        border: 1px dashed #ccc !important;
                        padding: 3mm !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        page-break-inside: avoid !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                      }
                      .item-name { font-size: 11pt !important; text-align: center !important; line-height: 1.2 !important; max-height: 26pt !important; overflow: hidden !important; }
                      .item-code { font-size: 10pt !important; margin-top: 5mm !important; }
                    }
                    
                    /* Screen display styles */
                    .print-container {
                      display: flex;
                      flex-wrap: wrap;
                      gap: 20px;
                      justify-content: flex-start;
                    }
                    .label-item {
                      width: 180px;
                      height: 240px;
                      border: 1px dashed #ccc;
                      padding: 10px;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      box-sizing: border-box;
                    }
                    .item-name {
                      font-weight: bold;
                      font-size: 0.9rem;
                      margin-bottom: 0.5rem;
                      font-family: sans-serif;
                      color: #000;
                      text-align: center;
                      display: -webkit-box;
                      -webkit-line-clamp: 2;
                      -webkit-box-orient: vertical;
                      overflow: hidden;
                    }
                    .item-code {
                      font-size: 0.85rem;
                      color: #4b5563;
                      font-family: monospace;
                      margin-top: 0.5rem;
                    }
                  `}
                </style>
                {items.map((item, idx) => (
                  <div key={idx} className="label-item">
                    <div className="item-name" title={item.name}>{item.name}</div>
                    <div className="qr-code">
                      <QRCodeSVG value={item.code} size={110} level="H" includeMargin={true} />
                    </div>
                    <div className="item-code">{item.code}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors bg-white font-medium"
          >
            Đóng
          </button>
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Printer size={18} />
            In {items.length} Tem A4
          </button>
        </div>
      </div>
    </div>
  );
};
