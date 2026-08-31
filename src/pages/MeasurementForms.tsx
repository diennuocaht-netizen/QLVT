import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { MeasurementForm, MeasurementField, ChecklistItem } from '../types/measurement';
import { Plus, Edit, Trash2, Save, X, PlusCircle, Settings, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const MeasurementForms: React.FC = () => {
  const { profile } = useAuth();
  const [forms, setForms] = useState<MeasurementForm[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<MeasurementForm | null>(null);
  const [formData, setFormData] = useState<{name: string, description: string, checklist_items: ChecklistItem[], measurement_fields: MeasurementField[]}>({
    name: '',
    description: '',
    checklist_items: [],
    measurement_fields: []
  });

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('measurement_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (form?: MeasurementForm) => {
    if (form) {
      setEditingForm(form);
      setFormData({
        name: form.name,
        description: form.description || '',
        checklist_items: JSON.parse(JSON.stringify(form.checklist_items || [])),
        measurement_fields: JSON.parse(JSON.stringify(form.measurement_fields || []))
      });
    } else {
      setEditingForm(null);
      setFormData({
        name: '',
        description: '',
        checklist_items: [],
        measurement_fields: []
      });
    }
    setIsModalOpen(true);
  };

  const handleAddField = (type: 'checklist' | 'measurement') => {
    if (type === 'checklist') {
      const newField: ChecklistItem = {
        id: `check_${Date.now()}`,
        label: ''
      };
      setFormData(prev => ({
        ...prev,
        checklist_items: [...prev.checklist_items, newField]
      }));
    } else {
      const newField: MeasurementField = {
        id: `field_${Date.now()}`,
        label: '',
        type: 'number',
        required: true,
        unit: '',
        group: ''
      };
      setFormData(prev => ({
        ...prev,
        measurement_fields: [...prev.measurement_fields, newField]
      }));
    }
  };

  const handleRemoveField = (id: string, type: 'checklist' | 'measurement') => {
    if (type === 'checklist') {
      setFormData(prev => ({
        ...prev,
        checklist_items: prev.checklist_items.filter(f => f.id !== id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        measurement_fields: prev.measurement_fields.filter(f => f.id !== id)
      }));
    }
  };

  const handleUpdateChecklist = (id: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      checklist_items: prev.checklist_items.map(f => f.id === id ? { ...f, label } : f)
    }));
  };

  const handleUpdateMeasurement = (id: string, updates: Partial<MeasurementField>) => {
    setFormData(prev => ({
      ...prev,
      measurement_fields: prev.measurement_fields.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên biểu mẫu');
      return;
    }

    try {
      const formPayload = {
        name: formData.name,
        description: formData.description,
        checklist_items: formData.checklist_items,
        measurement_fields: formData.measurement_fields,
        updated_at: new Date().toISOString()
      };

      if (editingForm) {
        const { error } = await supabase
          .from('measurement_forms')
          .update(formPayload)
          .eq('id', editingForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('measurement_forms')
          .insert([{ ...formPayload, created_by: profile?.id }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchForms();
    } catch (err) {
      console.error('Error saving form:', err);
      alert('Lỗi khi lưu biểu mẫu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa biểu mẫu này? Chú ý: Các phiếu đo đạc đã tạo từ biểu mẫu này có thể bị ảnh hưởng.')) {
      try {
        const { error } = await supabase.from('measurement_forms').delete().eq('id', id);
        if (error) throw error;
        fetchForms();
      } catch (err) {
        console.error('Error deleting form:', err);
        alert('Lỗi khi xóa biểu mẫu.');
      }
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClipboardList className="w-6 h-6 mr-2 text-indigo-600" />
            Biểu mẫu đo đạc & kiểm tra
          </h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình các mẫu biên bản đo đạc định kỳ cho thiết bị (VD: Bơm, Tủ điện...)</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tạo biểu mẫu mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : forms.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-lg border border-gray-200">
            Chưa có biểu mẫu nào. Hãy tạo biểu mẫu đầu tiên!
          </div>
        ) : (
          forms.map((form) => (
            <div key={form.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition">
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-lg text-gray-900">{form.name}</h3>
                {form.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{form.description}</p>}
              </div>
              <div className="p-5 flex-1 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Nội dung kiểm tra (Checklist)</h4>
                  {form.checklist_items && form.checklist_items.length > 0 ? (
                    <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                      {form.checklist_items.slice(0, 3).map(f => <li key={f.id} className="truncate">{f.label}</li>)}
                      {form.checklist_items.length > 3 && <li className="text-gray-400 italic">+{form.checklist_items.length - 3} mục khác</li>}
                    </ul>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Không có</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Thông số đo đạc</h4>
                  {form.measurement_fields && form.measurement_fields.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {form.measurement_fields.slice(0, 5).map(f => (
                        <span key={f.id} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100">
                          {f.label} {f.unit && `(${f.unit})`}
                        </span>
                      ))}
                      {form.measurement_fields.length > 5 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded border border-gray-200">
                          +{form.measurement_fields.length - 5}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Không có</span>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(form.updated_at).toLocaleDateString('vi-VN')}
                </span>
                <div className="flex space-x-2">
                  <button onClick={() => handleOpenModal(form)} className="text-indigo-600 hover:text-indigo-900 p-1">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(form.id)} className="text-red-600 hover:text-red-900 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-indigo-600" />
                {editingForm ? 'Chỉnh sửa biểu mẫu' : 'Tạo biểu mẫu mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form id="formBuilder" onSubmit={handleSave} className="space-y-8">
                {/* Basic Info */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tên biểu mẫu <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="VD: Biên bản kiểm tra hệ thống bơm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả thêm (Tùy chọn)</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Thông tin hướng dẫn..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Checklist Items */}
                  <div>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h4 className="text-lg font-semibold text-gray-900">1. Nội dung kiểm tra chung</h4>
                      <button
                        type="button"
                        onClick={() => handleAddField('checklist')}
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium"
                      >
                        <PlusCircle className="w-4 h-4 mr-1" /> Thêm mục
                      </button>
                    </div>
                    
                    {formData.checklist_items.length === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
                        Chưa có nội dung kiểm tra. Thêm để tạo các mục đánh giá Đạt/Không đạt.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.checklist_items.map((item, index) => (
                          <div key={item.id} className="flex items-center space-x-2 bg-white p-3 border border-gray-200 rounded shadow-sm">
                            <span className="text-sm font-bold text-gray-400 w-6">{index + 1}.</span>
                            <input
                              type="text"
                              required
                              value={item.label}
                              onChange={e => handleUpdateChecklist(item.id, e.target.value)}
                              placeholder="VD: Kiểm tra tình trạng rò rỉ"
                              className="flex-1 border-0 border-b border-gray-200 focus:ring-0 focus:border-indigo-500 text-sm"
                            />
                            <button type="button" onClick={() => handleRemoveField(item.id, 'checklist')} className="text-red-400 hover:text-red-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Measurement Fields */}
                  <div>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h4 className="text-lg font-semibold text-gray-900">2. Cột thông số đo đạc</h4>
                      <button
                        type="button"
                        onClick={() => handleAddField('measurement')}
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium"
                      >
                        <PlusCircle className="w-4 h-4 mr-1" /> Thêm cột
                      </button>
                    </div>

                    {formData.measurement_fields.length === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
                        Chưa có cột thông số. Thêm để tạo bảng ghi thông số.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.measurement_fields.map((field, index) => (
                          <div key={field.id} className="bg-white p-4 border border-gray-200 rounded shadow-sm relative">
                            <button 
                              type="button" 
                              onClick={() => handleRemoveField(field.id, 'measurement')} 
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Tên cột <span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  required
                                  value={field.label}
                                  onChange={e => handleUpdateMeasurement(field.id, { label: e.target.value })}
                                  className="w-full border-gray-300 rounded text-sm focus:ring-indigo-500"
                                  placeholder="VD: Uab"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Nhóm cột (Tuỳ chọn)</label>
                                <input
                                  type="text"
                                  value={field.group || ''}
                                  onChange={e => handleUpdateMeasurement(field.id, { group: e.target.value })}
                                  className="w-full border-gray-300 rounded text-sm focus:ring-indigo-500"
                                  placeholder="VD: Điện áp (V)"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Loại dữ liệu</label>
                                <select
                                  value={field.type}
                                  onChange={e => handleUpdateMeasurement(field.id, { type: e.target.value as any })}
                                  className="w-full border-gray-300 rounded text-sm focus:ring-indigo-500"
                                >
                                  <option value="number">Số</option>
                                  <option value="text">Văn bản</option>
                                  <option value="boolean">Đạt/Không Đạt</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Đơn vị (Tuỳ chọn)</label>
                                <input
                                  type="text"
                                  value={field.unit || ''}
                                  onChange={e => handleUpdateMeasurement(field.id, { unit: e.target.value })}
                                  className="w-full border-gray-300 rounded text-sm focus:ring-indigo-500"
                                  placeholder="V, A, Ohm"
                                  disabled={field.type === 'boolean'}
                                />
                              </div>
                              <div className="flex items-center justify-center pt-5">
                                <label className="flex items-center text-sm text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={e => handleUpdateMeasurement(field.id, { required: e.target.checked })}
                                    className="mr-2 text-indigo-600 focus:ring-indigo-500 rounded"
                                  />
                                  Bắt buộc
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="formBuilder"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
              >
                <Save className="w-5 h-5 mr-2" />
                Lưu Biểu Mẫu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
