import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase-client';
import { MeasurementForm, MeasurementField, MeasurementRecord } from '../../types/measurement';
import { X, Save, ClipboardList } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MeasurementRecordModalProps {
  deviceId: string;
  deviceName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const MeasurementRecordModal: React.FC<MeasurementRecordModalProps> = ({ deviceId, deviceName, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [forms, setForms] = useState<MeasurementForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingForms, setFetchingForms] = useState(true);
  
  const [recordData, setRecordData] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setFetchingForms(true);
      const { data, error } = await supabase
        .from('measurement_forms')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setForms(data || []);
      if (data && data.length > 0) {
        setSelectedFormId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching forms:', err);
    } finally {
      setFetchingForms(false);
    }
  };

  const selectedForm = forms.find(f => f.id === selectedFormId);

  const handleFieldChange = (fieldId: string, value: any) => {
    setRecordData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    // Validate required fields
    for (const field of selectedForm.fields) {
      if (field.required && (recordData[field.id] === undefined || recordData[field.id] === '')) {
        alert(`Vui lòng nhập giá trị cho trường: ${field.label}`);
        return;
      }
    }

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const newRecord = {
        device_id: deviceId,
        form_id: selectedFormId,
        record_data: recordData,
        recorded_by: profile?.id,
        notes: notes,
        recorded_at: now,
        created_at: now,
        updated_at: now
      };

      const { error } = await supabase
        .from('measurement_records')
        .insert([newRecord]);

      if (error) throw error;
      
      // Log activity
      import('../../utils/activityLogger').then(m => m.logActivity({
        action: 'add_measurement',
        entityType: 'device',
        entityId: deviceId,
        details: { deviceName, formName: selectedForm.name }
      })).catch(err => console.warn('Activity logger failed:', err));

      alert('Đã lưu phiếu đo đạc thành công!');
      onSuccess();
    } catch (err) {
      console.error('Error saving measurement record:', err);
      alert('Đã xảy ra lỗi khi lưu phiếu đo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ClipboardList className="w-6 h-6 mr-2 text-indigo-600" />
            Tạo phiếu đo đạc: {deviceName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {fetchingForms ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có biểu mẫu đo đạc nào được cấu hình.
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn biểu mẫu</label>
                <select
                  value={selectedFormId}
                  onChange={e => {
                    setSelectedFormId(e.target.value);
                    setRecordData({}); // reset data when changing form
                  }}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {forms.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                {selectedForm?.description && (
                  <p className="mt-2 text-sm text-gray-500">{selectedForm.description}</p>
                )}
              </div>

              {selectedForm && (
                <div className="border-t border-gray-200 pt-6 space-y-5">
                  <h3 className="text-base font-medium text-gray-900">Điền thông số</h3>
                  
                  {selectedForm.fields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.unit && `(${field.unit})`} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      
                      {field.type === 'number' ? (
                        <input
                          type="number"
                          step="any"
                          required={field.required}
                          value={recordData[field.id] || ''}
                          onChange={e => handleFieldChange(field.id, parseFloat(e.target.value))}
                          className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : field.type === 'boolean' ? (
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            checked={!!recordData[field.id]}
                            onChange={e => handleFieldChange(field.id, e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Đạt / Đồng ý</span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          required={field.required}
                          value={recordData[field.id] || ''}
                          onChange={e => handleFieldChange(field.id, e.target.value)}
                          className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      )}
                    </div>
                  ))}

                  <div className="pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú thêm</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ghi chú về tình trạng thiết bị..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || forms.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center disabled:bg-indigo-400"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Lưu Phiếu Đo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
