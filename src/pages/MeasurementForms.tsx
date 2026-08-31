import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { MeasurementForm, MeasurementField, MeasurementFieldType } from '../types/measurement';
import { Plus, Edit, Trash2, Save, X, PlusCircle, Settings, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const MeasurementForms: React.FC = () => {
  const { profile } = useAuth();
  const [forms, setForms] = useState<MeasurementForm[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<MeasurementForm | null>(null);
  const [formData, setFormData] = useState<{name: string, description: string, fields: MeasurementField[]}>({
    name: '',
    description: '',
    fields: []
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
        fields: JSON.parse(JSON.stringify(form.fields)) // deep copy
      });
    } else {
      setEditingForm(null);
      setFormData({
        name: '',
        description: '',
        fields: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingForm(null);
  };

  const handleAddField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: `field_${Date.now()}`,
          label: '',
          type: 'number',
          unit: '',
          required: true
        }
      ]
    }));
  };

  const handleRemoveField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }));
  };

  const handleUpdateField = (id: string, key: keyof MeasurementField, value: any) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, [key]: value } : f)
    }));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Vui lòng nhập tên biểu mẫu');
      return;
    }
    if (formData.fields.length === 0) {
      alert('Vui lòng thêm ít nhất một trường đo đạc');
      return;
    }

    // Validate fields
    for (const field of formData.fields) {
      if (!field.label) {
        alert('Vui lòng nhập tên cho tất cả các trường');
        return;
      }
    }

    try {
      if (editingForm) {
        const { error } = await supabase
          .from('measurement_forms')
          .update({
            name: formData.name,
            description: formData.description,
            fields: formData.fields,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingForm.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('measurement_forms')
          .insert([{
            name: formData.name,
            description: formData.description,
            fields: formData.fields,
            created_by: profile?.id
          }]);
        
        if (error) throw error;
      }
      
      handleCloseModal();
      fetchForms();
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Lỗi khi lưu biểu mẫu!');
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa biểu mẫu này? Các phiếu đo liên quan cũng sẽ bị xóa.')) {
      try {
        const { error } = await supabase.from('measurement_forms').delete().eq('id', id);
        if (error) throw error;
        fetchForms();
      } catch (error) {
        console.error('Error deleting form:', error);
        alert('Lỗi khi xóa biểu mẫu!');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClipboardList className="w-6 h-6 mr-2 text-indigo-600" />
            Quản lý Biểu mẫu đo đạc
          </h1>
          <p className="text-gray-500 text-sm mt-1">Tạo và quản lý các form đo đạc định kỳ cho thiết bị</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-1" /> Thêm Biểu mẫu
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
          <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Chưa có biểu mẫu nào</h3>
          <p className="text-gray-500 mt-1">Hãy tạo biểu mẫu đầu tiên để ghi nhận thông số thiết bị.</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Thêm Biểu mẫu ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <div key={form.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{form.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
                  {form.description || 'Không có mô tả'}
                </p>
                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <p className="text-xs font-medium text-gray-700 uppercase mb-2">Các thông số đo ({form.fields.length}):</p>
                  <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                    {form.fields.map(f => (
                      <li key={f.id} className="flex items-center">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                        <span className="truncate">{f.label} {f.unit ? `(${f.unit})` : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end space-x-3">
                <button 
                  onClick={() => handleOpenModal(form)}
                  className="text-indigo-600 hover:text-indigo-900 flex items-center text-sm font-medium"
                >
                  <Edit className="w-4 h-4 mr-1" /> Sửa
                </button>
                <button 
                  onClick={() => handleDeleteForm(form.id)}
                  className="text-red-600 hover:text-red-900 flex items-center text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm/Sửa Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingForm ? 'Chỉnh sửa Biểu mẫu' : 'Thêm Biểu mẫu Mới'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên biểu mẫu <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: Phiếu đo điện trở cách điện..."
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả biểu mẫu</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Mô tả mục đích của biểu mẫu đo đạc..."
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-base font-semibold text-gray-900">Cấu hình các trường đo đạc</label>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-100 flex items-center font-medium"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" /> Thêm trường
                    </button>
                  </div>

                  {formData.fields.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                      Chưa có trường nào. Bấm "Thêm trường" để bắt đầu cấu hình.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.fields.map((field, index) => (
                        <div key={field.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleRemoveField(field.id)}
                              className="text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-4">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Tên thông số (Label)</label>
                              <input
                                type="text"
                                required
                                value={field.label}
                                onChange={e => handleUpdateField(field.id, 'label', e.target.value)}
                                placeholder="VD: Nhiệt độ pha A..."
                                className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div className="col-span-6 md:col-span-3">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Kiểu dữ liệu</label>
                              <select
                                value={field.type}
                                onChange={e => handleUpdateField(field.id, 'type', e.target.value as MeasurementFieldType)}
                                className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="number">Số (Number)</option>
                                <option value="text">Văn bản (Text)</option>
                                <option value="boolean">Đúng/Sai (Checkbox)</option>
                              </select>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Đơn vị (Unit)</label>
                              <input
                                type="text"
                                value={field.unit || ''}
                                onChange={e => handleUpdateField(field.id, 'unit', e.target.value)}
                                placeholder="VD: °C, V, A..."
                                disabled={field.type === 'boolean'}
                                className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                              />
                            </div>
                            <div className="col-span-12 md:col-span-2 flex items-end pb-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={e => handleUpdateField(field.id, 'required', e.target.checked)}
                                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">Bắt buộc</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3 border-t border-gray-200 pt-4 pb-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Lưu Biểu mẫu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
