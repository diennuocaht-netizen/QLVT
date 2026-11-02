import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  title?: string;
  message?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Truy cập bị từ chối',
  message = 'Bạn không có quyền truy cập vào tính năng này. Vui lòng liên hệ Quản trị viên nếu bạn cần được cấp quyền.',
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-2xl shadow-xs border border-gray-100 my-4">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 ring-8 ring-red-50/50">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>
      <p className="text-gray-500 mt-2 max-w-md text-sm sm:text-base">{message}</p>
      <button
        onClick={() => navigate('/')}
        className="mt-6 inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay về Tổng quan</span>
      </button>
    </div>
  );
};
