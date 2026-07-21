import React from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  code: string;
  devices: any[];
  onClose: () => void;
  onSelect: (device: any) => void;
}

export const SiblingDevicesModal: React.FC<Props> = ({ isOpen, code, devices, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-900">Thiết bị cùng mã: {code}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {devices.length === 0 ? (
            <div className="text-sm text-gray-500">Không có thiết bị khác cùng mã.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {devices.map(d => (
                <li key={d.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{d.name}</div>
                    <div className="text-xs text-gray-500">Vị trí: {d.location || 'Chưa xác định'}</div>
                  </div>
                  <div>
                    <button
                      onClick={() => { onSelect(d); onClose(); }}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Mở
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default SiblingDevicesModal;
