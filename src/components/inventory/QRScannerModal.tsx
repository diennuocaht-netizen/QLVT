import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Layers } from 'lucide-react';
import { supabase } from '../../supabase-client';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = "qr-reader";
  const [multiVariants, setMultiVariants] = useState<any[] | null>(null);
  const [loadingMulti, setLoadingMulti] = useState(false);
  const [debugText, setDebugText] = useState("");
  const [debugError, setDebugError] = useState("");

  const startScanner = async () => {
    try {
      setError('');
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerRegionId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" }, // Prefer back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Success callback
          if (scannerRef.current) {
            scannerRef.current.stop().then(async () => {
              if (decodedText.startsWith('MULTI:')) {
                const codes = decodedText.substring(6).split(',').map(c => c.trim());
                setLoadingMulti(true);
                setMultiVariants([]); // trigger UI change
                try {
                    setDebugText(decodedText);
                    const { data, error } = await supabase
                      .from('inventory_items')
                      .select('id, code, name, unit, category, notes')
                      .in('code', codes);
                    if (error) {
                      setDebugError(JSON.stringify(error));
                      console.error(error);
                    }
                    if (data) {
                      setMultiVariants(data);
                    }
                  } catch (e: any) {
                    setDebugError(e.message || String(e));
                    console.error(e);
                  } finally {
                  setLoadingMulti(false);
                }
              } else {
                onScanSuccess(decodedText);
                onClose();
              }
            }).catch(console.error);
          }
        },
        (errorMessage) => {
          // Ignore frequent scan errors
        }
      );
      setHasPermission(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setHasPermission(false);
      setError('Vui lòng cấp quyền truy cập Camera để quét mã QR.');
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Start scanner with a slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 md:p-4 backdrop-blur-sm">
      <div className="bg-white md:rounded-2xl shadow-2xl w-full h-full md:h-auto md:max-w-md flex flex-col overflow-hidden relative">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white flex-shrink-0 z-10 relative shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Camera className="text-indigo-600" size={20} />
            Quét Mã Vật Tư
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 p-0 bg-black flex flex-col items-center justify-center relative">
          <div id={scannerRegionId} className="w-full max-w-sm mx-auto"></div>
          
          {hasPermission === false && (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <Camera className="text-red-500" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Cần quyền Camera</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <button 
                onClick={startScanner}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-95"
              >
                Cấp quyền & Thử lại
              </button>
            </div>
          )}
        </div>
        
        <div className="p-5 bg-white border-t border-gray-100 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
          <p className="text-center text-sm text-gray-600 font-medium">
            Đưa mã QR của vật tư vào khung ngắm để hệ thống tự động quét.
          </p>
        </div>
      
      {multiVariants !== null && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50 flex-shrink-0 shadow-sm">
            <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <Layers className="text-indigo-600" size={20} />
              Chọn vật tư từ Mã Gộp
            </h2>
            <button onClick={() => { setMultiVariants(null); startScanner(); }} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-500 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {loadingMulti ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : multiVariants.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <p>Không tìm thấy dữ liệu vật tư nào trong mã này.</p>
                <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left overflow-auto break-all">
                  <strong>Chuỗi quét được:</strong> {debugText}<br/>
                  <strong>Mã trích xuất:</strong> {debugText.substring(6).split(',').map(c => c.trim()).join(' | ')}<br/>
                  {debugError && <strong className="text-red-500">Lỗi: {debugError}</strong>}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4 text-center">Hệ thống phát hiện {multiVariants.length} loại vật tư trong mã QR này. Vui lòng chọn một loại:</p>
                {multiVariants.map(variant => (
                  <button 
                    key={variant.code}
                    onClick={() => {
                      onScanSuccess(variant.code);
                      onClose();
                    }}
                    className="w-full text-left bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col gap-1 active:scale-95"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-900">{variant.name}</span>
                      <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">{variant.code}</span>
                    </div>
                    {variant.notes && (
                      <span className="text-sm text-gray-500 line-clamp-1">{variant.notes}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
</div>
    </div>
  );
};
