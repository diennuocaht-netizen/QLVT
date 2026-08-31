import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

interface DeviceFormProps {
  device?: any;
  onClose: () => void;
}

export const DeviceForm: React.FC<DeviceFormProps> = ({ device, onClose }) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    specs: '',
    location: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (device) {
      setFormData({
        code: device.code || '',
        name: device.name || '',
        specs: device.specs || '',
        location: device.location || '',
        status: device.status || 'active',
      });
    }
  }, [device]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const now = new Date().toISOString();
      const dataToSave = {
        code: formData.code,
        name: formData.name,
        location: formData.location,
        status: formData.status,
        specs: formData.specs ? { description: formData.specs } : null,
      };

      if (device) {
        // Update
        const changes: string[] = [];
        if (device.name !== formData.name) changes.push(`Tên`);
        if ((device.location || '') !== (formData.location || '')) changes.push(`Vị trí`);
        if (device.status !== formData.status) changes.push(`Trạng thái`);
        
        let updatedChangeLogs = device.change_logs || [];
        if (changes.length > 0) {
          const autoLog = {
            id: Date.now().toString(),
            timestamp: now,
            action: 'Cập nhật thông tin',
            user: profile?.displayName || profile?.email || 'Hệ thống',
            details: `Thay đổi: ${changes.join(', ')}`,
          };
          updatedChangeLogs = [autoLog, ...updatedChangeLogs];
        }

        const { error } = await supabase.from('devices').update({
          ...dataToSave,
          change_logs: updatedChangeLogs,
          updated_at: now,
        }).eq('id', device.id);
        
        if (error) throw error;

        if (changes.length > 0) {
          import('../utils/activityLogger').then(m => m.logActivity({
            action: 'update_device',
            entityType: 'device',
            entityId: device.id,
            details: { name: formData.name, code: formData.code, changes: changes.join(', ') }
          })).catch(err => console.warn('Activity logger failed:', err));
        }
      } else {
        // Create
        const { error } = await supabase.from('devices').insert([{
          ...dataToSave,
          author_id: profile?.id,
          created_at: now,
          updated_at: now,
        }]);
        
        if (error) throw error;
      }
      onClose();
    } catch (err: any) {
      console.error("Error saving device:", err);
      setError(err.message || "Đã xảy ra lỗi khi lưu thiết bị.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {device ? 'Chỉnh sửa Thiết bị' : 'Thêm Thiết bị Mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã thiết bị *</label>
              <input
                type="text"
                name="code"
                required
                value={formData.code}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="active">Hoạt động</option>
                <option value="maintenance">Bảo trì</option>
                <option value="inactive">Ngưng hoạt động</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Tên thiết bị *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Vị trí / Địa chỉ line phụ tải *</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Thông số kỹ thuật</label>
              <textarea
                name="specs"
                rows={4}
                value={formData.specs}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu thiết bị'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
