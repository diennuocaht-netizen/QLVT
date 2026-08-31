import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { ClipboardList, Search, Plus, Calendar, User, Eye, Trash2, X } from 'lucide-react';
import { MeasurementSessionModal } from '../components/devices/MeasurementSessionModal';
import { MeasurementRecord } from '../types/measurement';

export const MeasurementRecords: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);

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
            form:measurement_forms(name)
          `)
          .order('recorded_at', { ascending: false }),
        supabase
          .from('measured_equipments')
          .select('*')
          .order('name')
      ]);
      
      if (recRes.error) {
        console.error('Error fetching records:', recRes.error);
        setErrorMsg('Lỗi tải danh sách biên bản: ' + recRes.error.message);
      } else {
        setRecords(recRes.data || []);
      }

      if (eqRes.error) {
        console.error('Error fetching equipments:', eqRes.error);
        if (!errorMsg) setErrorMsg('Lỗi tải danh sách máy móc: ' + eqRes.error.message);
      } else {
        setEquipments(eqRes.data || []);
      }
    } catch (err: any) {
      console.error('Error in fetchData:', err);
      setErrorMsg(err.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa biên bản đo đạc này?')) {
      try {
        const { error } = await supabase.from('measurement_records').delete().eq('id', id);
        if (error) throw error;
        fetchData();
      } catch (err) {
        console.error('Error deleting record:', err);
        alert('Lỗi khi xóa biên bản.');
      }
    }
  };

  const filteredRecords = records.filter(r => 
    r.record_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.form?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClipboardList className="w-6 h-6 mr-2 text-indigo-600" />
            Biên bản đo đạc định kỳ
          </h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách các biên bản kiểm tra tổng hợp hệ thống thiết bị</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên biên bản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Thêm biên bản mới
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700">{errorMsg}</p>
              <p className="text-sm text-red-600 mt-1">Gợi ý: Nếu đây là lỗi liên kết bảng, có thể bộ đệm Supabase chưa kịp cập nhật. Vui lòng tải lại trang hoặc chạy lệnh <code>NOTIFY pgrst, 'reload schema';</code></p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Không tìm thấy biên bản nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecords.map((record) => {
                const eqs = record.record_data?.equipments || [];
                return (
                  <div key={record.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                    <div className="p-4 bg-indigo-50 border-b border-gray-200">
                      <h3 className="font-bold text-indigo-900 line-clamp-2" title={record.record_name}>
                        {record.record_name || 'Biên bản không tên'}
                      </h3>
                      <div className="inline-block mt-2 px-2 py-1 bg-white border border-indigo-100 text-indigo-700 text-xs rounded shadow-sm">
                        Mẫu: {record.form?.name || 'Không xác định'}
                      </div>
                    </div>
                    <div className="p-4 flex-1 space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(record.recorded_at).toLocaleString('vi-VN')}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        {record.user?.raw_user_meta_data?.full_name || record.user?.email || 'Không rõ'}
                      </div>
                      <div className="mt-4 border-t pt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          Bao gồm {eqs.length} thiết bị:
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {eqs.map((e: any) => e.equipment_name).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center"
                        onClick={() => {
                          setViewingRecord(record);
                          setIsModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Chi tiết
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id)} 
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <MeasurementSessionModal
          availableEquipments={equipments}
          initialRecord={viewingRecord}
          isViewOnly={!!viewingRecord}
          onClose={() => {
            setIsModalOpen(false);
            setViewingRecord(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setViewingRecord(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};
