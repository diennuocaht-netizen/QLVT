import React, { useState } from 'react';
import { X, Link as LinkIcon, FileText, AlertCircle } from 'lucide-react';
import { InventorySlip } from '../../types/inventory';

interface HandoverRecordUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip?: InventorySlip | null;
  onUploadComplete?: (url: string) => void;
  isLoading?: boolean;
}

export const HandoverRecordUploadModal: React.FC<HandoverRecordUploadModalProps> = ({
  isOpen,
  onClose,
  slip,
  onUploadComplete,
  isLoading = false
}) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!linkUrl.trim()) {
      setError('Vui lòng nhập đường dẫn liên kết');
      return;
    }
    
    // Kiểm tra định dạng URL (cơ bản)
    try {
      new URL(linkUrl);
    } catch (_) {
      setError('Đường dẫn không hợp lệ. Vui lòng nhập URL bắt đầu bằng http:// hoặc https://');
      return;
    }

    onUploadComplete?.(linkUrl.trim());
    setLinkUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Biên bản nhận vật tư
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              Vui lòng dán đường dẫn (link) tới Biên bản nhận vật tư để hoàn tất đóng phiếu nhập.
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Đường dẫn liên kết (URL)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  setError('');
                }}
                placeholder="https://docs.google.com/..."
                className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!linkUrl.trim() || isLoading}
            className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu lại'}
          </button>
        </div>
      </div>
    </div>
  );
};
