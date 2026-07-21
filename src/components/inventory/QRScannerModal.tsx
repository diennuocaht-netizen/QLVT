import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const [error, setError] = useState<string>('');
  
  // Create a stable ID for this scanner instance
  const scannerRegionId = "qr-reader";

  useEffect(() => {
    if (!isOpen) return;

    let html5QrcodeScanner: Html5QrcodeScanner | null = null;
    setError('');

    // Small delay to ensure the DOM is ready for the scanner
    const timer = setTimeout(() => {
      try {
        html5QrcodeScanner = new Html5QrcodeScanner(
          scannerRegionId,
          { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
          /* verbose= */ false
        );

        html5QrcodeScanner.render(
          (decodedText) => {
            // Stop scanning and close on success
            if (html5QrcodeScanner) {
              html5QrcodeScanner.clear().catch(console.error);
            }
            onScanSuccess(decodedText);
            onClose();
          },
          (errorMessage) => {
            // Ignore scan errors, as they are continuously thrown when no QR code is in view
          }
        );
      } catch (err) {
        console.error("Error initializing scanner", err);
        setError('Không thể khởi tạo máy ảnh. Vui lòng kiểm tra quyền truy cập.');
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (html5QrcodeScanner) {
        try {
          html5QrcodeScanner.clear().catch(console.error);
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [isOpen, onScanSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 md:p-4">
      <div className="bg-white md:rounded-xl shadow-xl w-full h-full md:h-auto md:max-w-md flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Quét Mã QR Vật Tư</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 p-4 bg-white overflow-y-auto flex flex-col items-center justify-center">
          {error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center w-full">
              {error}
            </div>
          ) : (
            <div id={scannerRegionId} className="w-full max-w-sm mx-auto"></div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500 flex-shrink-0">
          Đưa mã QR của vật tư vào khung ngắm để tự động quét.
        </div>
      </div>
    </div>
  );
};
