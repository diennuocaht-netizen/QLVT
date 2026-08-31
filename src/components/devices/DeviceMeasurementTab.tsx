import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase-client';
import { MeasurementRecord, MeasurementForm } from '../../types/measurement';
import { Plus, ClipboardList, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { MeasurementRecordModal } from './MeasurementRecordModal';

interface DeviceMeasurementTabProps {
  deviceId: string;
  deviceName: string;
}

export const DeviceMeasurementTab: React.FC<DeviceMeasurementTabProps> = ({ deviceId, deviceName }) => {
  const [records, setRecords] = useState<(MeasurementRecord & { form: MeasurementForm, user: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, [deviceId]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('measurement_records')
        .select(`
          *,
          form:measurement_forms(*),
          user:recorded_by(email, raw_user_meta_data)
        `)
        .eq('device_id', deviceId)
        .order('recorded_at', { ascending: false });
        
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching measurement records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchRecords();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ClipboardList className="w-5 h-5 mr-2 text-indigo-600" />
          Phiếu thông số đo định kỳ
        </h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 flex items-center text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-1" /> Thêm phiếu đo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-2">Chưa có phiếu đo đạc nào cho thiết bị này.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map(record => {
            const date = new Date(record.recorded_at);
            const userName = record.user?.raw_user_meta_data?.displayName || record.user?.email || 'Người dùng';
            const isExpanded = expandedId === record.id;
            
            return (
              <div key={record.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div 
                  className="px-4 py-3 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleExpand(record.id)}
                >
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{record.form?.name || 'Phiếu đo'}</h4>
                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-4">
                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {date.toLocaleDateString('vi-VN')} {date.toLocaleTimeString('vi-VN')}</span>
                      <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {userName}</span>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-4 border-t border-gray-200">
                    {record.form?.description && (
                      <p className="text-sm text-gray-600 mb-4 italic">{record.form.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      {record.form?.fields?.map(field => {
                        const value = record.record_data?.[field.id];
                        let displayValue = value;
                        if (field.type === 'boolean') {
                          displayValue = value ? 'Đạt' : 'Không đạt';
                        }
                        
                        return (
                          <div key={field.id} className="flex flex-col border-b border-gray-100 pb-2">
                            <span className="text-xs text-gray-500">{field.label}</span>
                            <span className="text-sm font-medium text-gray-900 mt-1">
                              {displayValue !== undefined ? displayValue : '-'} {field.unit && displayValue !== undefined ? field.unit : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {record.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500 block mb-1">Ghi chú:</span>
                        <p className="text-sm text-gray-800">{record.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <MeasurementRecordModal
          deviceId={deviceId}
          deviceName={deviceName}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
