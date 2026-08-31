import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { X, Plus, Trash2, Edit2, Check, Save, Upload } from 'lucide-react';
import Papa from 'papaparse';

interface DeviceProfileModalProps {
  device?: any;
  onClose: () => void;
}

export const DeviceProfileModal: React.FC<DeviceProfileModalProps> = ({ device, onClose }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'components' | 'history'>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // General Info State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '',
    origin: '',
    location: '',
    manager: '',
    contactInfo: '',
    measuringElement: '',
    protectionElement: '',
    poweredFrom: '',
    powersTo: '',
    installationDate: '',
    usageDate: '',
    status: 'active',
  });

  // Sub-components State
  const [subComponents, setSubComponents] = useState<any[]>([]);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
  const [editComponentData, setEditComponentData] = useState<any>({});

  // History State
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [newLog, setNewLog] = useState({ date: '', action: '', details: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';

  useEffect(() => {
    if (device) {
      // Extract specs if it's an object
      const specs = typeof device.specs === 'object' ? device.specs : {};
      
      setFormData({
        code: device.code || '',
        name: device.name || '',
        type: specs.type || device.type || '',
        origin: specs.origin || device.origin || '',
        location: device.location || '',
        manager: specs.manager || device.manager || '',
        contactInfo: specs.contactInfo || device.contactInfo || '',
        measuringElement: specs.measuringElement || device.measuringElement || '',
        protectionElement: specs.protectionElement || device.protectionElement || '',
        poweredFrom: specs.poweredFrom || device.poweredFrom || '',
        powersTo: specs.powersTo || device.powersTo || '',
        installationDate: specs.installationDate || device.installationDate || '',
        usageDate: specs.usageDate || device.usageDate || '',
        status: device.status || 'active',
      });
      setSubComponents(device.sub_components || []);
      setHistoryLogs(device.history_logs || []);
    }
  }, [device]);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setLoading(true);
    setError('');

    try {
      const now = new Date().toISOString();
      
      // Build specs JSON with optional fields
      const specs = {
        type: formData.type || '',
        origin: formData.origin || '',
        manager: formData.manager || '',
        contactInfo: formData.contactInfo || '',
        measuringElement: formData.measuringElement || '',
        protectionElement: formData.protectionElement || '',
        poweredFrom: formData.poweredFrom || '',
        powersTo: formData.powersTo || '',
        installationDate: formData.installationDate || '',
        usageDate: formData.usageDate || '',
      };

      let updatedChangeLogs = device ? [...(device.change_logs || [])] : [];
      if (device) {
        const changes: string[] = [];
        
        if (device.name !== formData.name) changes.push(`Tên: ${device.name} -> ${formData.name}`);
        if ((device.location || '') !== (formData.location || '')) changes.push(`Vị trí: ${device.location} -> ${formData.location}`);
        if (device.status !== formData.status) changes.push(`Trạng thái: ${device.status} -> ${formData.status}`);
        
        const oldSpecs = device.specs || {};
        if ((oldSpecs.type || '') !== (formData.type || '')) changes.push(`Loại`);
        if ((oldSpecs.origin || '') !== (formData.origin || '')) changes.push(`Xuất xứ`);
        if ((oldSpecs.manager || '') !== (formData.manager || '')) changes.push(`Người quản lý`);
        if ((oldSpecs.contactInfo || '') !== (formData.contactInfo || '')) changes.push(`SĐT`);
        if ((oldSpecs.measuringElement || '') !== (formData.measuringElement || '')) changes.push(`Phần tử đo đếm`);
        if ((oldSpecs.protectionElement || '') !== (formData.protectionElement || '')) changes.push(`Phần tử bảo vệ`);
        
        if (changes.length > 0) {
          const autoLog = {
            id: Date.now().toString(),
            timestamp: now,
            action: 'Cập nhật thông tin',
            user: profile?.displayName || profile?.email || 'Hệ thống',
            details: `Thay đổi: ${changes.join(', ')}`,
          };
          updatedChangeLogs = [autoLog, ...updatedChangeLogs];
        }
      }

      // Only include schema columns
      const finalData = {
        code: formData.code,
        name: formData.name,
        location: formData.location || null,
        specs: specs,
        status: formData.status,
        author_id: profile?.id || null,
        sub_components: subComponents,
        history_logs: historyLogs,
        change_logs: updatedChangeLogs,
        updated_at: now,
      };

      if (device) {
        const { error } = await supabase.from('devices').update(finalData).eq('id', device.id);
        if (error) throw error;
        
        // Let's use the local 'changes' array here but it was scoped inside the earlier block.
        // I will re-calculate changes or check updatedChangeLogs length difference
        if (updatedChangeLogs.length > (device.change_logs?.length || 0)) {
          import('../utils/activityLogger').then(m => m.logActivity({
            action: 'update_device',
            entityType: 'device',
            entityId: device.id,
            details: { name: formData.name, code: formData.code }
          })).catch(err => console.warn('Activity logger failed:', err));
        }
      } else {
        const { error } = await supabase.from('devices').insert([{
          ...finalData,
          created_at: now,
        }]);
        if (error) throw error;
      }
      onClose();
    } catch (err: any) {
      console.error("Error saving device:", err);
      setError(err.message || "Đã xảy ra lỗi khi lưu thiết bị.");
    } finally {
      setLoading(false);
    }
  };

  // --- Sub-components Logic ---
  const handleAddComponent = () => {
    const newId = `C_${Date.now()}`;
    setSubComponents([...subComponents, {
      id: newId,
      name: '',
      model: '',
      poles: '',
      current: '',
      icu: '',
      voltage: '',
      poweredFrom: '',
      powersTo: '',
      location: ''
    }]);
    setEditingComponentId(newId);
    setEditComponentData({
      id: newId,
      name: '',
      model: '',
      poles: '',
      current: '',
      icu: '',
      voltage: '',
      poweredFrom: '',
      powersTo: '',
      location: ''
    });
  };

  const handleSaveComponent = () => {
    setSubComponents(subComponents.map(c => c.id === editingComponentId ? editComponentData : c));
    setEditingComponentId(null);
  };

  const handleRemoveComponent = (id: string) => {
    setSubComponents(subComponents.filter(c => c.id !== id));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          const newComponents: any[] = [];
          for (const row of results.data as any[]) {
            // Normalize row keys to lowercase for easier matching and remove BOM
            const normalizedRow: any = {};
            for (const key in row) {
              if (row.hasOwnProperty(key)) {
                const cleanKey = key.replace(/^\uFEFF/, '').trim().toLowerCase();
                normalizedRow[cleanKey] = row[key];
              }
            }

            // Expected CSV columns based on the image:
            // (Empty header or 'Nhãn') -> Q1, Q2
            // Tên MCB: -> NDB-1ST-01-L/01
            // Hãng sản xuất/Model: -> Schneider / iC60H
            // Số pha / số cực: -> 1 pha / 1 cực
            // Dòng định mức: -> 50A
            // Icu/ Ics: -> 10/10kA
            // Điện áp định mức: -> 240V
            // Cấp nguồn từ: -> MCCB 4P 250A
            // Cấp nguồn cho: -> Tủ NDB-1ST-01-L/01
            // Vị trí: -> Chiếu sáng khu vực Gate 4

            const label = String(normalizedRow[''] || normalizedRow['nhãn'] || normalizedRow['stt'] || '').trim();
            const name = String(normalizedRow['tên mcb:'] || normalizedRow['tên mcb'] || normalizedRow['name'] || '').trim();
            const model = String(normalizedRow['hãng sản xuất/model:'] || normalizedRow['hãng sản xuất/model'] || normalizedRow['hãng/model'] || '').trim();
            const poles = String(normalizedRow['số pha / số cực:'] || normalizedRow['số pha / số cực'] || normalizedRow['pha/cực'] || '').trim();
            const current = String(normalizedRow['dòng định mức:'] || normalizedRow['dòng định mức'] || normalizedRow['dòng đm'] || '').trim();
            const icu = String(normalizedRow['icu/ ics:'] || normalizedRow['icu/ ics'] || normalizedRow['icu/ics'] || '').trim();
            const voltage = String(normalizedRow['điện áp định mức:'] || normalizedRow['điện áp định mức'] || normalizedRow['điện áp'] || '').trim();
            const poweredFrom = String(normalizedRow['cấp nguồn từ:'] || normalizedRow['cấp nguồn từ'] || normalizedRow['cấp nguồn'] || '').trim();
            const powersTo = String(normalizedRow['cấp nguồn cho:'] || normalizedRow['cấp nguồn cho'] || '').trim();
            const location = String(normalizedRow['vị trí:'] || normalizedRow['vị trí'] || normalizedRow['location'] || '').trim();

            if (!name && !label) continue; // Skip empty rows

            newComponents.push({
              id: `C_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              label,
              name,
              model,
              poles,
              current,
              icu,
              voltage,
              poweredFrom,
              powersTo,
              location
            });
          }

          if (newComponents.length === 0) {
            alert('Không có dữ liệu nào được import. Vui lòng kiểm tra lại định dạng file CSV.');
          } else {
            setSubComponents(prev => [...prev, ...newComponents]);
            alert(`Đã import thành công ${newComponents.length} thành phần!`);
          }
        } catch (error: any) {
          console.error("Error importing components:", error);
          alert(`Có lỗi xảy ra khi import dữ liệu: ${error.message || 'Lỗi không xác định'}`);
        } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Lỗi khi đọc file CSV.");
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  // --- History Logic ---
  const handleAddLog = () => {
    if (!newLog.date || !newLog.action) return;
    setHistoryLogs([{ ...newLog, id: Date.now().toString() }, ...historyLogs]);
    setNewLog({ date: '', action: '', details: '' });
  };

  const handleRemoveLog = (id: string) => {
    setHistoryLogs(historyLogs.filter(l => l.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {device ? `Hồ sơ thiết bị: ${device.code}` : 'Thêm Thiết bị Mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            className={`py-3 px-4 font-medium text-sm border-b-2 ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('general')}
          >
            1. Thông tin chung
          </button>
          <button
            className={`py-3 px-4 font-medium text-sm border-b-2 ${activeTab === 'components' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('components')}
          >
            2. Các thành phần cơ bản
          </button>
          <button
            className={`py-3 px-4 font-medium text-sm border-b-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('history')}
          >
            3. Lịch sử thiết bị
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'general' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã thiết bị *</label>
                  <input type="text" name="code" required value={formData.code} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên thiết bị *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Loại thiết bị</label>
                  <input type="text" name="type" value={formData.type} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Xuất xứ</label>
                  <input type="text" name="origin" value={formData.origin} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vị trí lắp đặt *</label>
                  <input type="text" name="location" required value={formData.location} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100">
                    <option value="active">Hoạt động</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="inactive">Ngưng hoạt động</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nhân viên quản lý</label>
                  <input type="text" name="manager" value={formData.manager} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thông tin liên hệ</label>
                  <input type="text" name="contactInfo" value={formData.contactInfo} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông số kỹ thuật</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phần tử đo lường</label>
                    <input type="text" name="measuringElement" value={formData.measuringElement} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phần tử bảo vệ</label>
                    <input type="text" name="protectionElement" value={formData.protectionElement} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cấp nguồn từ</label>
                    <input type="text" name="poweredFrom" value={formData.poweredFrom} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Cấp nguồn cho (Phụ tải)</label>
                    <textarea name="powersTo" rows={3} value={formData.powersTo} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUB-COMPONENTS */}
          {activeTab === 'components' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Danh sách MCB / Line phụ tải</h3>
                {canEdit && (
                  <div className="flex space-x-2">
                    <input 
                      type="file" 
                      accept=".csv" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                    <button 
                      onClick={handleImportClick}
                      disabled={importing}
                      className="bg-white text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 flex items-center text-sm font-medium disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 mr-1" /> {importing ? 'Đang import...' : 'Import CSV'}
                    </button>
                    <button onClick={handleAddComponent} className="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 flex items-center text-sm font-medium">
                      <Plus className="w-4 h-4 mr-1" /> Thêm Line
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhãn</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên MCB</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hãng/Model</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pha/Cực</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dòng ĐM</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cấp nguồn cho</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vị trí phụ tải</th>
                      {canEdit && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subComponents.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chưa có thành phần nào.</td></tr>
                    ) : subComponents.map((comp) => (
                      <tr key={comp.id} className={editingComponentId === comp.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}>
                        {editingComponentId === comp.id ? (
                          <>
                            <td className="px-2 py-2"><input type="text" value={editComponentData.label} onChange={e => setEditComponentData({...editComponentData, label: e.target.value})} className="w-full border-gray-300 rounded-md text-sm p-1" placeholder="Q1" /></td>
                            <td className="px-2 py-2"><input type="text" value={editComponentData.name} onChange={e => setEditComponentData({...editComponentData, name: e.target.value})} className="w-full border-gray-300 rounded-md text-sm p-1" placeholder="NDB-1ST..." /></td>
                            <td className="px-2 py-2"><input type="text" value={editComponentData.model} onChange={e => setEditComponentData({...editComponentData, model: e.target.value})} className="w-full border-gray-300 rounded-md text-sm p-1" /></td>
                            <td className="px-2 py-2"><input type="text" value={editComponentData.poles} onChange={e => setEditComponentData({...editComponentData, poles: e.target.value})} className="w-full border-gray-300 rounded-md text-sm p-1" /></td>
                            <td className="px-2 py-2"><input type="text" value={editComponentData.current} onChange={e => setEditComponentData({...editComponentData, current: e.target.value})} className="w-full border-gray-300 rounded-md text-sm p-1" /></td>
                            <td className="px-2 py-2"><input type="text" value={editComponentData.powersTo} onChange={e => setEditComponentData({...editComponentData, powersTo: e.target.value})} className="w-full border-gray-300 rounded-md text-sm p-1" /></td>
                            <td className="px-2 py-2"><input type="text" value={editComponentData.location} onChange={e => setEditComponentData({...editComponentData, location: e.target.value})} className="w-full border-gray-300 rounded-md text-sm p-1" /></td>
                            <td className="px-2 py-2 text-right whitespace-nowrap">
                              <button onClick={handleSaveComponent} className="text-green-600 hover:text-green-900 mr-2"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingComponentId(null)} className="text-gray-600 hover:text-gray-900"><X className="w-4 h-4" /></button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{comp.label}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{comp.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{comp.model}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{comp.poles}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{comp.current}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{comp.powersTo}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{comp.location}</td>
                            {canEdit && (
                              <td className="px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                                <button onClick={() => { setEditingComponentId(comp.id); setEditComponentData(comp); }} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleRemoveComponent(comp.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thời điểm hoàn thành lắp đặt</label>
                  <input type="date" name="installationDate" value={formData.installationDate} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thời điểm đưa vào sử dụng</label>
                  <input type="date" name="usageDate" value={formData.usageDate} onChange={handleGeneralChange} disabled={!canEdit} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900">Nhật ký bảo trì / Di chuyển</h3>
                </div>
                
                {canEdit && (
                  <div className="p-4 border-b border-gray-200 bg-white flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Ngày</label>
                      <input type="date" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Hành động (Bảo trì, Sửa chữa...)</label>
                      <input type="text" value={newLog.action} onChange={e => setNewLog({...newLog, action: e.target.value})} className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="flex-[3]">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Chi tiết</label>
                      <input type="text" value={newLog.details} onChange={e => setNewLog({...newLog, details: e.target.value})} className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <button onClick={handleAddLog} className="bg-gray-800 text-white px-3 py-1.5 rounded-md hover:bg-gray-900 text-sm font-medium h-[34px]">
                      Thêm
                    </button>
                  </div>
                )}

                <div className="p-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chi tiết</th>
                        {canEdit && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Xóa</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {historyLogs.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Chưa có nhật ký nào.</td></tr>
                      ) : historyLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{log.date}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.action}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{log.details}</td>
                          {canEdit && (
                            <td className="px-4 py-3 text-right text-sm font-medium">
                              <button onClick={() => handleRemoveLog(log.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Đóng
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Đang lưu...' : 'Lưu Hồ sơ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
