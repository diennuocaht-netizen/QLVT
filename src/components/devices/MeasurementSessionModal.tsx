import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase-client';
import { MeasurementForm, MeasurementField, ChecklistItem } from '../../types/measurement';
import { X, Save, ClipboardList, CheckSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MeasurementSessionModalProps {
  onClose: () => void;
  onSuccess: () => void;
  availableEquipments: any[];
}

export const MeasurementSessionModal: React.FC<MeasurementSessionModalProps> = ({ onClose, onSuccess, availableEquipments }) => {
  const { profile } = useAuth();
  const [forms, setForms] = useState<MeasurementForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingForms, setFetchingForms] = useState(true);

  // Step 1 data
  const [recordName, setRecordName] = useState('');
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  
  // Step 2 data
  const [step, setStep] = useState<1 | 2>(1);
  const [checklistData, setChecklistData] = useState<Record<string, { status: string, note: string }>>({});
  const [equipmentsData, setEquipmentsData] = useState<Record<string, Record<string, any>>>({}); // equipmentId -> { fieldId: value }
  const [postMaintenanceNote, setPostMaintenanceNote] = useState('');

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

  const selectedForm = useMemo(() => forms.find(f => f.id === selectedFormId), [forms, selectedFormId]);

  const handleNextStep = () => {
    if (!recordName.trim()) {
      alert('Vui lòng nhập tên biên bản!');
      return;
    }
    if (!selectedFormId) {
      alert('Vui lòng chọn biểu mẫu!');
      return;
    }
    if (selectedEquipmentIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thiết bị/máy móc!');
      return;
    }
    setStep(2);
  };

  const handleToggleEquipment = (id: string) => {
    setSelectedEquipmentIds(prev => 
      prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
    );
  };

  const handleSelectAllEq = () => {
    if (selectedEquipmentIds.length === availableEquipments.length) {
      setSelectedEquipmentIds([]);
    } else {
      setSelectedEquipmentIds(availableEquipments.map(e => e.id));
    }
  };

  const handleChecklistChange = (checkId: string, field: 'status' | 'note', value: string) => {
    setChecklistData(prev => ({
      ...prev,
      [checkId]: {
        ...prev[checkId],
        [field]: value
      }
    }));
  };

  const handleMeasurementChange = (eqId: string, fieldId: string, value: any) => {
    setEquipmentsData(prev => ({
      ...prev,
      [eqId]: {
        ...(prev[eqId] || {}),
        [fieldId]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();
      
      const equipmentsArray = selectedEquipmentIds.map(eqId => {
        const eq = availableEquipments.find(e => e.id === eqId);
        return {
          equipment_id: eqId,
          equipment_name: eq?.name,
          equipment_code: eq?.code,
          measurements: equipmentsData[eqId] || {}
        };
      });

      const newRecord = {
        record_name: recordName,
        form_id: selectedFormId,
        recorded_by: profile?.id,
        recorded_at: now,
        created_at: now,
        updated_at: now,
        record_data: {
          checklist: checklistData,
          equipments: equipmentsArray,
          post_maintenance_note: postMaintenanceNote
        }
      };

      const { error } = await supabase
        .from('measurement_records')
        .insert([newRecord]);

      if (error) throw error;

      alert('Đã lưu biên bản thành công!');
      onSuccess();
    } catch (err) {
      console.error('Error saving measurement record:', err);
      alert('Đã xảy ra lỗi khi lưu biên bản.');
    } finally {
      setLoading(false);
    }
  };

  // Group columns for table header
  const groupedColumns = useMemo(() => {
    if (!selectedForm) return [];
    const groups: { name: string, fields: MeasurementField[] }[] = [];
    selectedForm.measurement_fields.forEach(f => {
      const gName = f.group || '';
      const existing = groups.find(g => g.name === gName);
      if (existing) {
        existing.fields.push(f);
      } else {
        groups.push({ name: gName, fields: [f] });
      }
    });
    return groups;
  }, [selectedForm]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ClipboardList className="w-6 h-6 mr-2 text-indigo-600" />
            {step === 1 ? 'Khởi tạo Biên bản' : `Điền số liệu: ${recordName}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {fetchingForms ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : step === 1 ? (
            <div className="space-y-6 max-w-2xl mx-auto bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên biên bản <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={recordName}
                  onChange={e => setRecordName(e.target.value)}
                  className="w-full border-gray-300 rounded-md focus:ring-indigo-500"
                  placeholder="VD: Biên bản kiểm tra hệ thống bơm tiểu cảnh định kỳ"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mẫu áp dụng <span className="text-red-500">*</span></label>
                <select
                  value={selectedFormId}
                  onChange={e => setSelectedFormId(e.target.value)}
                  className="w-full border-gray-300 rounded-md focus:ring-indigo-500"
                >
                  {forms.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Thiết bị/Máy móc cần kiểm tra <span className="text-red-500">*</span></label>
                  <button type="button" onClick={handleSelectAllEq} className="text-xs text-indigo-600 hover:underline">
                    {selectedEquipmentIds.length === availableEquipments.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto bg-white divide-y divide-gray-100">
                  {availableEquipments.map(eq => (
                    <label key={eq.id} className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEquipmentIds.includes(eq.id)}
                        onChange={() => handleToggleEquipment(eq.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded border-gray-300 mr-3"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{eq.name}</span>
                        <span className="text-xs text-gray-500">{eq.code} - {eq.location}</span>
                      </div>
                    </label>
                  ))}
                  {availableEquipments.length === 0 && (
                    <div className="p-4 text-sm text-gray-500 text-center">Chưa có thiết bị nào.</div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Đã chọn {selectedEquipmentIds.length} thiết bị.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Checklist Section */}
              {selectedForm?.checklist_items && selectedForm.checklist_items.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2 text-indigo-600" />
                    BẢNG 1: NỘI DUNG KIỂM TRA CHUNG
                  </h3>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 border border-gray-300">
                        <th className="border border-gray-300 p-2 w-12 text-center">STT</th>
                        <th className="border border-gray-300 p-2 text-left">Nội dung kiểm tra</th>
                        <th className="border border-gray-300 p-2 w-24 text-center">Đạt</th>
                        <th className="border border-gray-300 p-2 w-24 text-center">Không đạt</th>
                        <th className="border border-gray-300 p-2 w-48 text-left">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedForm.checklist_items.map((item, index) => {
                        const val = checklistData[item.id]?.status;
                        return (
                          <tr key={item.id} className="border border-gray-300 hover:bg-gray-50">
                            <td className="border border-gray-300 p-2 text-center text-gray-600">{index + 1}</td>
                            <td className="border border-gray-300 p-2 font-medium text-gray-900">{item.label}</td>
                            <td className="border border-gray-300 p-2 text-center">
                              <input
                                type="radio"
                                name={`check_${item.id}`}
                                checked={val === 'Đạt'}
                                onChange={() => handleChecklistChange(item.id, 'status', 'Đạt')}
                                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                              />
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              <input
                                type="radio"
                                name={`check_${item.id}`}
                                checked={val === 'Không đạt'}
                                onChange={() => handleChecklistChange(item.id, 'status', 'Không đạt')}
                                className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                              />
                            </td>
                            <td className="border border-gray-300 p-0">
                              <input
                                type="text"
                                value={checklistData[item.id]?.note || ''}
                                onChange={e => handleChecklistChange(item.id, 'note', e.target.value)}
                                className="w-full h-full border-0 focus:ring-0 p-2 text-sm bg-transparent"
                                placeholder="Ghi chú..."
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Parameters Table Section */}
              {selectedForm?.measurement_fields && selectedForm.measurement_fields.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">BẢNG 2: BẢNG THÔNG SỐ ĐO ĐẠC</h3>
                  <table className="w-full border-collapse text-sm min-w-max">
                    <thead>
                      <tr className="bg-gray-100 border border-gray-300">
                        <th rowSpan={2} className="border border-gray-300 p-2 text-center w-12">STT</th>
                        <th rowSpan={2} className="border border-gray-300 p-2 text-left w-48">Tên thiết bị</th>
                        {groupedColumns.map((g, i) => (
                          <th key={i} colSpan={g.fields.length} className="border border-gray-300 p-2 text-center font-bold">
                            {g.name || 'Thông số khác'}
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-gray-50 border border-gray-300 text-xs">
                        {groupedColumns.flatMap(g => g.fields).map(f => (
                          <th key={f.id} className="border border-gray-300 p-2 text-center font-medium">
                            {f.label}
                            {f.unit && <span className="block text-gray-500 font-normal">({f.unit})</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEquipmentIds.map((eqId, index) => {
                        const eq = availableEquipments.find(e => e.id === eqId);
                        return (
                          <tr key={eqId} className="border border-gray-300 hover:bg-gray-50">
                            <td className="border border-gray-300 p-2 text-center text-gray-600">{index + 1}</td>
                            <td className="border border-gray-300 p-2 font-medium text-gray-900">{eq?.name}</td>
                            {groupedColumns.flatMap(g => g.fields).map(f => {
                              const val = equipmentsData[eqId]?.[f.id] || '';
                              return (
                                <td key={f.id} className="border border-gray-300 p-0 text-center">
                                  {f.type === 'boolean' ? (
                                    <select
                                      value={val}
                                      onChange={e => handleMeasurementChange(eqId, f.id, e.target.value)}
                                      className="w-full h-full border-0 focus:ring-0 p-2 text-sm bg-transparent text-center"
                                    >
                                      <option value=""></option>
                                      <option value="Đạt">Đạt</option>
                                      <option value="Không đạt">Không đạt</option>
                                    </select>
                                  ) : (
                                    <input
                                      type={f.type === 'number' ? 'number' : 'text'}
                                      step={f.type === 'number' ? 'any' : undefined}
                                      value={val}
                                      onChange={e => handleMeasurementChange(eqId, f.id, e.target.value)}
                                      className="w-full h-full border-0 focus:ring-0 p-2 text-sm text-center bg-transparent"
                                    />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Post Maintenance Notes */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">ĐÁNH GIÁ SAU BẢO TRÌ</h3>
                <textarea
                  value={postMaintenanceNote}
                  onChange={e => setPostMaintenanceNote(e.target.value)}
                  rows={4}
                  className="w-full border-gray-300 rounded-md focus:ring-indigo-500 p-3 text-sm"
                  placeholder="Ghi chú tổng quan, tình trạng thiết bị không đạt, kế hoạch sửa chữa..."
                ></textarea>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-white rounded-b-lg">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-auto"
            >
              Quay lại
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Hủy
          </button>
          
          {step === 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center disabled:bg-green-400"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Save className="w-4 h-4 mr-2" />}
              Lưu Biên Bản
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
