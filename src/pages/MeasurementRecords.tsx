import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { ClipboardList, Search, Plus, Calendar, User, Eye, Trash2, X } from 'lucide-react';
import { MeasurementRecordModal } from '../components/devices/MeasurementRecordModal';

export const MeasurementRecords: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEq, setSelectedEq] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, eqRes] = await Promise.all([
        supabase
          .from('measurement_records')
          .select(`
            *,
            form:measurement_forms(name),
            equipment:measured_equipments(code, name, location),
            user:recorded_by(email, raw_user_meta_data)
          `)
          .order('recorded_at', { ascending: false }),
        supabase
          .from('measured_equipments')
          .select('*')
          .order('name')
      ]);
      
      if (recRes.error) throw recRes.error;
      if (eqRes.error) throw eqRes.error;
      
      setRecords(recRes.data || []);
      setEquipments(eqRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    if (equipments.length === 0) {
      alert('Chưa có thiết bị nào. Vui lòng thêm máy móc/thiết bị trước khi tạo phiếu đo!');
      return;
    }
    // Default to first equipment
    setSelectedEq(equipments[0]);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu đo này?')) {
      try {
        const { error } = await supabase.from('measurement_records').delete().eq('id', id);
        if (error) throw error;
        fetchData();
      } catch (err) {
        console.error('Error deleting record:', err);
      }
    }
  };

  const filtered = records.filter(r => 
    r.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.equipment?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.form?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClipboardList className="w-6 h-6 mr-2 text-indigo-600" />
            Quản lý Phiếu đo đạc
          </h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách tất cả các phiếu đo đạc thông số thiết bị định kỳ</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm phiếu đo mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <div className="relative w-96">
            <input
              type="text"
              placeholder="Tìm theo thiết bị hoặc biểu mẫu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Không tìm thấy phiếu đo nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(record => {
                const date = new Date(record.recorded_at);
                const userName = record.user?.raw_user_meta_data?.displayName || record.user?.email || 'Người dùng';
                
                return (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition flex flex-col">
                    <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{record.form?.name || 'Phiếu đo'}</span>
                        <h3 className="font-bold text-gray-900 mt-1">{record.equipment?.name || 'Thiết bị không xác định'}</h3>
                        <p className="text-xs text-gray-500">{record.equipment?.code} • {record.equipment?.location}</p>
                      </div>
                      <button onClick={() => handleDelete(record.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        {Object.entries(record.record_data || {}).slice(0, 4).map(([key, val]: any) => (
                          <div key={key} className="bg-gray-50 px-2 py-1 rounded">
                            <span className="text-xs text-gray-500 truncate block">{key.substring(0, 15)}...</span>
                            <span className="font-medium text-gray-800">{val === true ? 'Đạt' : val === false ? 'K.Đạt' : val}</span>
                          </div>
                        ))}
                      </div>
                      {Object.keys(record.record_data || {}).length > 4 && (
                        <p className="text-xs text-gray-400 italic mb-2">+ {Object.keys(record.record_data || {}).length - 4} thông số khác</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3 mt-auto">
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {date.toLocaleDateString('vi-VN')}</span>
                      <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {userName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && equipments.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mb-4 absolute top-10">
             <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                <label className="block text-sm font-bold text-gray-700">Chọn thiết bị cần đo:</label>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-4">
                <select
                  value={selectedEq?.id || ''}
                  onChange={e => setSelectedEq(equipments.find(eq => eq.id === e.target.value))}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
                >
                  {equipments.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.code} - {eq.name}</option>
                  ))}
                </select>
             </div>
          </div>
          {selectedEq && (
            <MeasurementRecordModal
              deviceId={selectedEq.id}
              deviceName={selectedEq.name}
              onClose={() => setIsModalOpen(false)}
              onSuccess={() => {
                setIsModalOpen(false);
                fetchData();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
