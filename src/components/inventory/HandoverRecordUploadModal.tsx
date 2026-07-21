import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { InventorySlip } from '../../types/inventory';
import { supabase } from '../../supabase-client';
import { useAuth } from '../../contexts/AuthContext';
import { uploadToGoogleDrive } from '../../utils/googleDriveClient';

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
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTaskRef = useRef<any>(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB (giảm từ 10MB)

  // Compress ảnh trước upload
  const compressImage = async (file: File): Promise<File> => {
    // Nếu là PDF, không cần compress
    if (file.type === 'application/pdf') {
      return file;
    }

    // Nếu file nhỏ dưới 2MB, không cần compress
    if (file.size < 2 * 1024 * 1024) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Giảm kích thước nếu quá lớn
          const maxWidth = 1920;
          const maxHeight = 1440;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              file.type,
              0.85 // Quality 85%
            );
          } else {
            resolve(file);
          }
        };
      };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    let selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Chỉ hỗ trợ file ảnh (JPG, PNG, WebP) hoặc PDF');
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_SIZE) {
      setError('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Compress image if needed
    if (selectedFile.type !== 'application/pdf') {
      selectedFile = await compressImage(selectedFile);
    }

    setFile(selectedFile);
  };

  // Helper: Find API server by trying common ports
  const findApiServer = async () => {
    const portsToTry = [3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
    
    for (const port of portsToTry) {
      try {
        const response = await fetch(`http://localhost:${port}/api/drive/health`, {
          method: 'GET',
          timeout: 2000,
        });
        
        if (response.ok) {
          console.log(`✅ [HandoverRecord] Found API server on port ${port}`);
          return `http://localhost:${port}`;
        }
      } catch {
        // Try next port
      }
    }
    
    return null; // API server not found
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Vui lòng chọn file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      console.log('🚀 [HandoverRecord] Starting browser upload to Google Drive:', {
        fileName: file.name,
        fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        fileType: file.type,
      });

      // Fetch folder ID from settings
      let folderId: string | undefined;
      try {
        const { data: settings, error: settingsError } = await supabase
          .from('inventory_drive_settings')
          .select('folder_id')
          .eq('document_type', 'Nhận vật tư')
          .single();
        
        if (settingsError || !settings?.folder_id) {
          console.warn('⚠️ [HandoverRecord] Folder ID not configured, using default');
        } else {
          folderId = settings.folder_id;
          console.log('✅ [HandoverRecord] Folder ID fetched from settings:', folderId);
        }
      } catch (err) {
        console.warn('⚠️ [HandoverRecord] Error fetching folder ID:', err);
      }

      // Upload directly from browser (no backend needed!)
      const result = await uploadToGoogleDrive(file, folderId);

      setUploadProgress(100);

      if (!result.webViewLink) {
        setError('Không thể lấy link file. Vui lòng thử lại.');
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      console.log('✅ [HandoverRecord] Browser upload completed');
      console.log('📎 [HandoverRecord] Drive Link:', result.webViewLink);
      console.log('📊 [HandoverRecord] File details:', {
        fileId: result.fileId,
        fileName: result.fileName,
        size: (result.size / 1024 / 1024).toFixed(2) + ' MB',
        createdTime: result.createdTime,
      });

      // Call callback with Drive link (will be saved to Supabase)
      onUploadComplete?.(result.webViewLink);
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('❌ [HandoverRecord] Upload error:', err);
      
      if (err.message.includes('Failed to get access token')) {
        setError('❌ Xác thực Google không thành công.\n\nVui lòng chắc chắn rằng đã cho phép (tích vào ô vuông) khi Google yêu cầu quyền truy cập Drive.');
      } else if (err.message.includes('Failed to load Google Identity')) {
        setError('❌ Lỗi tải Google Identity Services.\n\nVui lòng kiểm tra kết nối Internet và thử lại.');
      } else if (err.message.includes('not configured')) {
        setError('❌ Google Client ID chưa được cấu hình.\n\nVui lòng liên hệ quản trị viên.');
      } else {
        setError(`❌ Lỗi upload: ${err.message}`);
      }
      setUploading(false);
      setUploadProgress(0);
    }
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
              Vui lòng upload Biên bản nhận vật tư (ảnh hoặc PDF) để hoàn tất đóng phiếu nhập
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 mx-auto mb-2" />
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            {file ? (
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-700">Click để chọn file</p>
                <p className="text-xs text-gray-600 mt-1">
                  hoặc kéo thả file vào đây
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG, WebP hoặc PDF (tối đa 5MB)
                </p>
              </div>
            )}
          </div>

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-blue-900">Đang upload...</p>
                <p className="text-sm font-semibold text-blue-600">{uploadProgress}%</p>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-6 flex justify-end gap-3">
          <button
            onClick={() => {
              if (uploading && uploadTaskRef.current) {
                uploadTaskRef.current.cancel();
                setUploading(false);
                setUploadProgress(0);
              } else {
                onClose();
              }
            }}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Dừng' : 'Hủy'}
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading || isLoading}
            className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {uploadProgress < 100 ? `${uploadProgress}%` : 'Hoàn tất...'}
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
