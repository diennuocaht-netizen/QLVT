import React, { useState, useEffect } from 'react';
import { X, Wrench, Activity, Info, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../supabase-client';
import { MeasurementSessionModal } from './MeasurementSessionModal';

interface EquipmentDetailsModalProps {
  equipment: any;
  onClose: () => void;
}

export const EquipmentDetailsModal: React.FC<EquipmentDetailsModalProps> = ({ equipment, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'measurements' | 'maintenance'>('info');
  
  // Measurements
  const [measurementRecords, setMeasurementRecords] = useState<any[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);

  // Maintenance
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  
  // Add Maintenance form
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    maintenance_date: new Date().toISOString().split('T')[0],
    description: '',
    replaced_parts: '',
    performed_by: ''
  });

  useEffect(() => {
    if (activeTab === 'measurements') {
      fetchMeasurements();
    } else if (activeTab === 'maintenance') {
      fetchMaintenanceLogs();
    }
  }, [activeTab]);

  const fetchMeasurements = async () => {
    try {
      setLoadingMeasurements(true);
      // We have to fetch all records and filter in JS because JSONB array contains is tricky in PostgREST
      const { data, error } = await supabase
        .from('measurement_records')
        .select(`*, form:measurement_forms(name, measurement_fields)`)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      // Filter records that include this equipment
      const filtered = (data || []).filter((r: any) => {
        const eqs = r.record_data?.equipments || [];
        return eqs.some((e: any) => e.equipment_id === equipment.id);
      });

      setMeasurementRecords(filtered);
    } catch (err) {
      console.error('Error fetching measurements:', err);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const fetchMaintenanceLogs = async () => {
    try {
      setLoadingMaintenance(true);
      const { data, error } = await supabase
        .from('equipment_maintenance_logs')
        .select('*')
        .eq('equipment_id', equipment.id)
        .order('maintenance_date', { ascending: false });

      if (error) throw error;
      setMaintenanceLogs(data || []);
    } catch (err) {
      console.error('Error fetching maintenance logs:', err);
      // Suppress error in case table doesn't exist yet
    } finally {
      setLoadingMaintenance(false);
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('equipment_maintenance_logs')
        .insert([{ ...newMaintenance, equipment_id: equipment.id }]);
      if (error) throw error;
      setShowAddMaintenance(false);
      setNewMaintenance({ maintenance_date: new Date().toISOString().split('T')[0], description: '', replaced_parts: '', performed_by: '' });
      fetchMaintenanceLogs();
    } catch (err: any) {
      alert('Lỗi khi thêm lý lịch bảo dưỡng: ' + err.message);
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch sử này?')) return;
    try {
      const { error } = await supabase.from('equipment_maintenance_logs').delete().eq('id', id);
      if (error) throw error;
      fetchMaintenanceLogs();
    } catch (err: any) {
      alert('Lỗi khi xóa: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Chi tiết máy móc: {equipment.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center ${activeTab === 'info' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Info className="w-4 h-4 mr-2" /> Thông tin chung
          </button>
          <button
            onClick={() => setActiveTab('measurements')}
            className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center ${activeTab === 'measurements' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Activity className="w-4 h-4 mr-2" /> Lịch sử đo thông số
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center ${activeTab === 'maintenance' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Wrench className="w-4 h-4 mr-2" /> Lý lịch bảo dưỡng, thay thế
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="text-sm font-medium text-gray-500">Mã máy móc</div>
                <div className="col-span-2 text-sm text-gray-900 font-semibold">{equipment.code}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="text-sm font-medium text-gray-500">Tên máy móc</div>
                <div className="col-span-2 text-sm text-gray-900">{equipment.name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="text-sm font-medium text-gray-500">Vị trí lắp đặt</div>
                <div className="col-span-2 text-sm text-gray-900">{equipment.location}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="text-sm font-medium text-gray-500">Trạng thái</div>
                <div className="col-span-2 text-sm text-gray-900">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${equipment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {equipment.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <div className="text-sm font-medium text-gray-500">Ghi chú</div>
                <div className="col-span-2 text-sm text-gray-900 whitespace-pre-line">{equipment.notes || '-'}</div>
              </div>
            </div>
          )}

          {activeTab === 'measurements' && (
            <div>
              {loadingMeasurements ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : measurementRecords.length === 0 ? (
                <div className="text-center py-10 text-gray-500">Chưa có dữ liệu đo thông số cho máy móc này.</div>
              ) : (
                <div className="space-y-4">
                  {measurementRecords.map(record => {
                    // Find parameters for THIS equipment specifically
                    const eqData = record.record_data?.equipments?.find((e: any) => e.equipment_id === equipment.id);
                    const measurements = eqData?.measurements || {};
                    const fields = record.form?.measurement_fields || [];
                    
                    return (
                      <div key={record.id} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-indigo-600">{record.record_name}</h4>
                            <div className="text-xs text-gray-500 mt-1">Ngày đo: {new Date(record.recorded_at).toLocaleDateString('vi-VN')}</div>
                          </div>
                          <button onClick={() => setViewingRecord(record)} className="text-sm text-indigo-600 hover:underline">
                            Xem toàn bộ biên bản
                          </button>
                        </div>
                        <div className="bg-gray-50 p-3 rounded grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {fields.map((f: any) => (
                            <div key={f.id}>
                              <div className="text-xs text-gray-500">{f.label} {f.unit ? `(${f.unit})` : ''}</div>
                              <div className="font-semibold text-sm">{measurements[f.id] || '-'}</div>
                            </div>
                          ))}
                          {fields.length === 0 && <div className="text-sm text-gray-500">Không có thông số định lượng</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">Ghi nhận các lần bảo dưỡng, sửa chữa, thay thế vật tư cho máy móc này.</p>
                <button
                  onClick={() => setShowAddMaintenance(!showAddMaintenance)}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-indigo-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Thêm mới
                </button>
              </div>

              {showAddMaintenance && (
                <form onSubmit={handleAddMaintenance} className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Ngày thực hiện</label>
                      <input type="date" required value={newMaintenance.maintenance_date} onChange={e => setNewMaintenance({...newMaintenance, maintenance_date: e.target.value})} className="w-full border-gray-300 rounded text-sm p-2" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Người/Đơn vị thực hiện</label>
                      <input type="text" value={newMaintenance.performed_by} onChange={e => setNewMaintenance({...newMaintenance, performed_by: e.target.value})} className="w-full border-gray-300 rounded text-sm p-2" placeholder="VD: Đội ĐNCT" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nội dung bảo dưỡng / Tình trạng</label>
                    <textarea required value={newMaintenance.description} onChange={e => setNewMaintenance({...newMaintenance, description: e.target.value})} className="w-full border-gray-300 rounded text-sm p-2" rows={2}></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Vật tư thay thế (nếu có)</label>
                    <textarea value={newMaintenance.replaced_parts} onChange={e => setNewMaintenance({...newMaintenance, replaced_parts: e.target.value})} className="w-full border-gray-300 rounded text-sm p-2" rows={2} placeholder="VD: Thay 2 vòng bi, 1 phớt bơm..."></textarea>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button type="button" onClick={() => setShowAddMaintenance(false)} className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white">Hủy</button>
                    <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm">Lưu</button>
                  </div>
                </form>
              )}

              {loadingMaintenance ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : maintenanceLogs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">Chưa có lịch sử bảo dưỡng nào.</div>
              ) : (
                <div className="relative border-l-2 border-indigo-200 ml-3 md:ml-6 space-y-6 pb-4 mt-6">
                  {maintenanceLogs.map((log) => (
                    <div key={log.id} className="relative pl-6 md:pl-8 group">
                      <div className="absolute w-4 h-4 bg-indigo-500 rounded-full -left-[9px] top-1 border-4 border-white shadow"></div>
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-900 text-sm">Ngày: {new Date(log.maintenance_date).toLocaleDateString('vi-VN')}</div>
                          <button onClick={() => handleDeleteMaintenance(log.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="mb-2 text-sm text-gray-700">
                          <span className="font-semibold">Nội dung:</span> {log.description}
                        </div>
                        {log.replaced_parts && (
                          <div className="mb-2 text-sm text-orange-700 bg-orange-50 p-2 rounded border border-orange-100">
                            <span className="font-semibold">Thay thế:</span> {log.replaced_parts}
                          </div>
                        )}
                        {log.performed_by && (
                          <div className="text-xs text-gray-500 mt-2 border-t pt-2">
                            Thực hiện bởi: {log.performed_by}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {viewingRecord && (
        <MeasurementSessionModal
          availableEquipments={[]}
          initialRecord={viewingRecord}
          isViewOnly={true}
          onClose={() => setViewingRecord(null)}
          onSuccess={() => setViewingRecord(null)}
        />
      )}
    </div>
  );
};
