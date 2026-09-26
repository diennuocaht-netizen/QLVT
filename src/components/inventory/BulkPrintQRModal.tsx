import React, { useRef, useState } from 'react';
import { X, Printer, Layers } from 'lucide-react';
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
  const [isGrouped, setIsGrouped] = useState(false);
  const [groupName, setGroupName] = useState('Nhóm vật tư gộp');

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: isGrouped ? 'In_Tem_QR_Gop' : 'In_Tem_QR_Hang_Loat',
  });

  if (!isOpen || items.length === 0) return null;

  const groupedCodes = items.map(i => i.code).join(',');
  const multiQrValue = `MULTI:${groupedCodes}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">
            {isGrouped ? 'Tạo Mã QR Gộp' : `In Tem Nhãn QR Hàng Loạt (${items.length} tem)`}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {isGrouped && (
          <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-indigo-900 mb-1">Tên nhóm vật tư (hiển thị trên tem in)</label>
              <input 
                type="text" 
                value={groupName} 
                onChange={e => setGroupName(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="VD: Keo Silicon các màu..."
              />
            </div>
            <div className="text-sm text-indigo-700 bg-white p-3 rounded shadow-sm border border-indigo-100">
              Mã gộp này chứa <strong>{items.length}</strong> vật tư.<br/>
              Khi quét, người dùng sẽ được chọn 1 trong {items.length} vật tư này.
            </div>
          </div>
        )}

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
                      .item-name { font-size: 11pt !important; text-align: center !important; line-height: 1.2 !important; max-height: 26pt !important; overflow: hidden !important; font-weight: bold !important; font-family: sans-serif !important; }
                      .item-code { font-size: 8pt !important; margin-top: 5mm !important; text-align: center !important; max-width: 100% !important; overflow-wrap: break-word !important; }
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
                      font-size: 0.65rem;
                      color: #4b5563;
                      font-family: monospace;
                      margin-top: 0.5rem;
                      text-align: center;
                      word-break: break-all;
                    }
                  `}
                </style>
                
                {isGrouped ? (
                  <div className="label-item border-2 border-indigo-400!">
                    <div className="item-name" title={groupName}>{groupName}</div>
                    <div className="qr-code">
                      <QRCodeSVG value={multiQrValue} size={110} level="M" includeMargin={true} />
                    </div>
                    <div className="item-code text-indigo-600 font-bold">MÃ GỘP ({items.length} VT)</div>
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div key={idx} className="label-item">
                      <div className="item-name" title={item.name}>{item.name}</div>
                      <div className="qr-code">
                        <QRCodeSVG value={item.code} size={110} level="H" includeMargin={true} />
                      </div>
                      <div className="item-code">{item.code}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between gap-3 flex-shrink-0">
          <button
            onClick={() => setIsGrouped(!isGrouped)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors font-medium ${isGrouped ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <Layers size={18} />
            {isGrouped ? 'Hủy gộp mã (In rời)' : 'Gộp thành 1 Mã QR'}
          </button>
          
          <div className="flex gap-2">
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
              {isGrouped ? 'In 1 Tem Gộp' : `In ${items.length} Tem A4`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
