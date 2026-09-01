import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { Box, Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EquipmentDetailsModal } from '../components/devices/EquipmentDetailsModal';
import CreatableSelect from 'react-select/creatable';

export const MeasuredEquipments: React.FC = () => {
  const { profile } = useAuth();
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterSubsystem, setFilterSubsystem] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Unique options for dropdowns
  const uniqueSubsystems = Array.from(new Set(equipments.map(e => e.subsystem).filter(Boolean)));
  const subsystemOptions = [
    { value: 'Hệ hạ thế', label: 'Hệ hạ thế' },
    { value: 'Hệ trung thế', label: 'Hệ trung thế' },
    { value: 'Máy phát', label: 'Máy phát' },
    { value: 'UPS', label: 'UPS' },
    { value: 'Xử lý nước thải', label: 'Xử lý nước thải' },
    { value: 'Hệ thống bơm', label: 'Hệ thống bơm' }
  ];
  // Merge with existing from DB
  uniqueSubsystems.forEach(sub => {
    if (!subsystemOptions.find(o => o.value === sub)) {
      subsystemOptions.push({ value: sub as string, label: sub as string });
    }
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [viewingDetailsItem, setViewingDetailsItem] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    status: 'active',
    subsystem: '',
    manufacturer: '',
    specifications: '',
    notes: ''
  });

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('measured_equipments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEquipments(data || []);
    } catch (err) {
      console.error('Error fetching equipments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        location: item.location || '',
        status: item.status || 'active',
        subsystem: item.subsystem || '',
        manufacturer: item.manufacturer || '',
        specifications: item.specifications || '',
        notes: item.notes || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        code: '',
        name: '',
        location: '',
        status: 'active',
        subsystem: '',
        manufacturer: '',
        specifications: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert('Vui lòng nhập mã và tên thiết bị');
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('measured_equipments')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('measured_equipments')
          .insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchEquipments();
    } catch (err) {
      console.error('Error saving equipment:', err);
      alert('Lỗi khi lưu thông tin máy móc.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa máy móc này? Các phiếu đo đạc liên quan cũng sẽ bị xóa.')) {
      try {
        const { error } = await supabase.from('measured_equipments').delete().eq('id', id);
        if (error) throw error;
        fetchEquipments();
      } catch (err) {
        console.error('Error deleting equipment:', err);
        alert('Lỗi khi xóa máy móc.');
      }
    }
  };

  const filtered = equipments.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        e.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubsystem = filterSubsystem ? e.subsystem === filterSubsystem : true;
    const matchManufacturer = filterManufacturer ? (e.manufacturer || '').toLowerCase().includes(filterManufacturer.toLowerCase()) : true;
    const matchStatus = filterStatus ? e.status === filterStatus : true;
    
    return matchSearch && matchSubsystem && matchManufacturer && matchStatus;
  });

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Box className="w-6 h-6 mr-2 text-indigo-600" />
            Quản lý Máy móc & Thiết bị
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý danh sách các máy móc cần ghi nhận thông số đo đạc</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm máy móc
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="relative w-96">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hoặc tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Bộ lọc
          </button>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-indigo-50/50 flex space-x-4">
            <div className="w-64">
              <label className="block text-xs font-medium text-gray-700 mb-1">Phân hệ</label>
              <select
                value={filterSubsystem}
                onChange={(e) => setFilterSubsystem(e.target.value)}
                className="w-full border-gray-300 rounded-md text-sm py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tất cả phân hệ</option>
                {subsystemOptions.map(sub => (
                  <option key={sub.value} value={sub.value}>{sub.label}</option>
                ))}
              </select>
            </div>
            
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-700 mb-1">Hãng sản xuất</label>
              <input
                type="text"
                placeholder="Lọc theo hãng..."
                value={filterManufacturer}
                onChange={(e) => setFilterManufacturer(e.target.value)}
                className="w-full border-gray-300 rounded-md text-sm py-1.5 px-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border-gray-300 rounded-md text-sm py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => { setFilterSubsystem(''); setFilterManufacturer(''); setFilterStatus(''); setSearchTerm(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 underline pb-1.5"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã TB</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên máy móc</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vị trí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Không tìm thấy máy móc nào.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => setViewingDetailsItem(item)} className="text-blue-600 hover:text-blue-900 mr-3" title="Chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Sửa">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Sửa thông tin máy móc' : 'Thêm máy móc mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã thiết bị <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên máy móc <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phân hệ</label>
                  <CreatableSelect
                    isClearable
                    placeholder="Chọn hoặc nhập mới..."
                    options={subsystemOptions}
                    value={formData.subsystem ? { label: formData.subsystem, value: formData.subsystem } : null}
                    onChange={(newValue) => setFormData({...formData, subsystem: newValue ? newValue.value : ''})}
                    className="mt-1"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#d1d5db',
                        '&:hover': { borderColor: '#9ca3af' },
                        boxShadow: 'none',
                        paddingTop: '2px',
                        paddingBottom: '2px'
                      })
                    }}
                    formatCreateLabel={(inputValue) => `Thêm phân hệ mới: "${inputValue}"`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hãng sản xuất</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={e => setFormData({...formData, manufacturer: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="VD: Schneider, ABB..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Vị trí lắp đặt</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thông số định mức</label>
                  <textarea
                    value={formData.specifications}
                    onChange={e => setFormData({...formData, specifications: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    placeholder="VD: Công suất: 55kW, Điện áp: 380V..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingDetailsItem && (
        <EquipmentDetailsModal
          equipment={viewingDetailsItem}
          onClose={() => setViewingDetailsItem(null)}
        />
      )}
    </div>
  );
};
