import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Item } from '../../types/inventory';
import { useReactToPrint } from 'react-to-print';

interface PrintQRModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
}

export const PrintQRModal: React.FC<PrintQRModalProps> = ({ isOpen, item, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: item ? `Tem_QR_${item.code}` : 'Tem_QR',
  });

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">In Tem Nhãn QR</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center bg-gray-50">
          {/* Content to print */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
            {/* The printable area */}
            <div ref={printRef} className="label-container" style={{ textAlign: 'center', padding: '20px', width: '300px', margin: '0 auto', background: '#fff' }}>
              <style>
                {`
                  @media print {
                    @page { size: auto; margin: 0mm; }
                    body { margin: 1cm; display: flex; justify-content: center; align-items: center; }
                  }
                `}
              </style>
              <div className="item-name" style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'sans-serif', color: '#000' }}>{item.name}</div>
              <div className="qr-code flex justify-center" style={{ margin: '1rem 0' }}>
                <QRCodeSVG value={item.code} size={150} level="H" includeMargin={true} />
              </div>
              <div className="item-code" style={{ fontSize: '1rem', color: '#4b5563', fontFamily: 'sans-serif' }}>Mã VT: {item.code}</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors bg-white"
          >
            Đóng
          </button>
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Printer size={18} />
            In Tem
          </button>
        </div>
      </div>
    </div>
  );
};
