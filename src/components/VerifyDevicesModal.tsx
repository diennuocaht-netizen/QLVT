import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';

interface VerifyDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: any[];
  onVerified: () => void;
}

export const VerifyDevicesModal: React.FC<VerifyDevicesModalProps> = ({ isOpen, onClose, devices, onVerified }) => {
  const { profile } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Group devices by location base for easier viewing
  const getBaseLocation = (loc: string) => {
    if (!loc) return 'Khác';
    if (loc.startsWith('LC7_2ND')) return 'LC7 2ND';
    if (loc.startsWith('LC7_1ST')) return 'LC7 1ST';
    if (loc.startsWith('LC7_GND')) return 'LC7 GND';
    if (loc.startsWith('LC7_RFT')) return 'LC7 RFT';
    return loc;
  };

  const filteredDevices = devices.filter(d => 
    (d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (d.code?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (d.location?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  const groupedDevices = filteredDevices.reduce((acc, device) => {
    const loc = getBaseLocation(device.location);
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(device);
    return acc;
  }, {} as Record<string, any[]>);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredDevices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDevices.map(d => d.id)));
    }
  };

  const handleVerify = async () => {
    if (selectedIds.size === 0) {
      alert('Vui lòng chọn ít nhất một tủ điện để xác nhận');
      return;
    }
    
    const pwd = window.prompt('Vui lòng nhập mật khẩu xác nhận:');
    if (pwd !== 'dnct@123') {
      alert('Mật khẩu không đúng!');
      return;
    }


    if (!profile) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('devices')
        .update({
          last_verified_at: now,
          last_verified_by: profile.id
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      
      // Log activity
      try {
        const { logActivity } = await import('../utils/activityLogger');
        await logActivity({
          action: 'verify_devices',
          entityType: 'device',
          details: { count: selectedIds.size }
        });
      } catch (e) {}

      alert('Đã xác nhận kiểm tra thành công!');
      onVerified();
      onClose();
    } catch (error) {
      console.error('Error verifying devices:', error);
      alert('Lỗi khi xác nhận: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <CheckCircle2 className="w-6 h-6 mr-2 text-green-600" />
              Xác nhận kiểm tra tủ điện hàng tháng
            </h2>
            <p className="text-sm text-gray-500 mt-1">Đánh dấu các tủ điện đã được kiểm tra thực tế trong tháng này.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 flex gap-4 items-center bg-white">
          <input
            type="text"
            placeholder="Tìm kiếm tủ điện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <button
            onClick={toggleAll}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center shrink-0"
          >
            {selectedIds.size === filteredDevices.length && filteredDevices.length > 0 ? (
              <><CheckSquare className="w-4 h-4 mr-2 text-blue-600" /> Bỏ chọn tất cả</>
            ) : (
              <><Square className="w-4 h-4 mr-2" /> Chọn tất cả ({filteredDevices.length})</>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {Object.entries(groupedDevices).map(([loc, locDevices]) => (
            <div key={loc} className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 border-b border-gray-200 flex justify-between items-center">
                <span>Vị trí: {loc}</span>
                <span className="text-sm text-gray-500 font-normal">{locDevices.length} tủ điện</span>
              </div>
              <div className="divide-y divide-gray-100">
                {locDevices.map(device => {
                  const isSelected = selectedIds.has(device.id);
                  const isRecentlyVerified = device.last_verified_at && new Date().getTime() - new Date(device.last_verified_at).getTime() < 30 * 24 * 60 * 60 * 1000;
                  
                  return (
                    <label key={device.id} className={`flex items-start p-4 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                      <div className="flex items-center h-5 mt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(device.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                      <div className="ml-3 flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{device.code}</p>
                          <p className="text-xs text-gray-500">{device.name}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs">{device.location}</span>
                        </div>
                        <div className="text-right flex flex-col items-end justify-center">
                          {isRecentlyVerified ? (
                            <span className="inline-flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Đã KT: {new Date(device.last_verified_at).toLocaleDateString('vi-VN')}
                            </span>
                          ) : (
                            <span className="text-xs text-orange-500 italic">Cần kiểm tra</span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          {filteredDevices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy tủ điện nào phù hợp.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Đã chọn: <span className="font-bold text-blue-600">{selectedIds.size}</span> tủ điện
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Hủy
            </button>
            <button
              onClick={handleVerify}
              disabled={isSubmitting || selectedIds.size === 0}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>Đang xử lý...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Xác nhận đã kiểm tra</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
