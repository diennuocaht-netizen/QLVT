import React, { useState, useEffect, useRef } from 'react';
import { supabase, subscribeToTable } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Server, Edit, Trash2, Upload, Eye, Zap, X } from 'lucide-react';
import { DeviceProfileModal } from '../components/DeviceProfileModal';
import { DeviceDetailsModal } from '../components/DeviceDetailsModal';
import { SiblingDevicesModal } from '../components/SiblingDevicesModal';
import { ConfirmModal } from '../components/ConfirmModal';
import Papa from 'papaparse';

export const Devices: React.FC = () => {
  const { profile } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [quickFilters, setQuickFilters] = useState<{id: string, field: string, value: string}[]>([]);
  const [quickSearchResults, setQuickSearchResults] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [selectedDeviceForDetails, setSelectedDeviceForDetails] = useState<any>(null);
  const [selectedComponentLabel, setSelectedComponentLabel] = useState<string | null>(null);
  const [siblingModalOpen, setSiblingModalOpen] = useState(false);
  const [siblingModalDevices, setSiblingModalDevices] = useState<any[]>([]);
  const [siblingModalCode, setSiblingModalCode] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';
  const canDelete = profile?.role === 'admin';

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data, error } = await supabase.from('devices').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setDevices(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching devices:', error);
        setLoading(false);
      }
    };

    fetchDevices();

    // Subscribe to real-time changes
    const unsubscribe = subscribeToTable('devices', () => {
      fetchDevices();
    });

    return () => unsubscribe();
  }, []);

  const addQuickFilter = () => {
    setQuickFilters([...quickFilters, { id: Date.now().toString(), field: 'deviceCode', value: '' }]);
  };

  const updateQuickFilter = (id: string, key: 'field' | 'value', newValue: string) => {
    setQuickFilters(quickFilters.map(f => f.id === id ? { ...f, [key]: newValue } : f));
  };

  const removeQuickFilter = (id: string) => {
    setQuickFilters(quickFilters.filter(f => f.id !== id));
  };

  const getSuggestions = (field: string) => {
    const suggestions = new Set<string>();
    devices.forEach(device => {
      if (field === 'deviceCode' && device.code) suggestions.add(device.code);
      if (field === 'deviceName' && device.name) suggestions.add(device.name);
      if (field === 'powersTo' && device.powersTo) suggestions.add(device.powersTo);
      
      if (device.sub_components && Array.isArray(device.sub_components)) {
        device.sub_components.forEach((comp: any) => {
          if (field === 'componentLabel') {
            if (comp.label) suggestions.add(comp.label);
            if (comp.name) suggestions.add(comp.name);
          }
          if (field === 'powersTo' && comp.powersTo) suggestions.add(comp.powersTo);
        });
      }
    });
    return Array.from(suggestions).filter(Boolean).sort();
  };

  useEffect(() => {
    const hasFilters = quickFilters.some(f => f.value.trim() !== '');
    const hasTerm = quickSearchTerm.trim() !== '';

    if (!hasFilters && !hasTerm) {
      setQuickSearchResults([]);
      return;
    }

    const term = quickSearchTerm.toLowerCase();
    const results: any[] = [];

    // Parse syntax search: allow separators '-' or '+' or ':' or '|', e.g. "Label - Device" or "Label + Device"
    let syntaxLabel = '';
    let syntaxDevice = '';
    const sepMatch = term.match(/\s*[-+:\|]\s*/);
    if (sepMatch) {
      const parts = term.split(/\s*[-+:\|]\s*/);
      syntaxLabel = (parts[0] || '').trim();
      syntaxDevice = (parts.slice(1).join(' ').trim()) || '';
    }

    devices.forEach(device => {
      // Search in sub_components
      if (device.sub_components && Array.isArray(device.sub_components)) {
        device.sub_components.forEach((comp: any) => {
          let match = true;

          // Check quick filters
          for (const filter of quickFilters) {
            if (!filter.value.trim()) continue;
            const fVal = filter.value.toLowerCase();
            if (filter.field === 'deviceCode' && !device.code?.toLowerCase().includes(fVal)) match = false;
            if (filter.field === 'deviceName' && !device.name?.toLowerCase().includes(fVal)) match = false;
            if (filter.field === 'componentLabel' && !(comp.name?.toLowerCase().includes(fVal) || comp.label?.toLowerCase().includes(fVal))) match = false;
            if (filter.field === 'powersTo' && !(comp.powersTo?.toLowerCase().includes(fVal) || device.powersTo?.toLowerCase().includes(fVal))) match = false;
          }

          // Check quick search term
          if (match && hasTerm) {
            if (syntaxLabel || syntaxDevice) {
               const labelMatch = !syntaxLabel || comp.name?.toLowerCase().includes(syntaxLabel) || comp.label?.toLowerCase().includes(syntaxLabel);
               const deviceMatch = !syntaxDevice || device.code?.toLowerCase().includes(syntaxDevice) || device.name?.toLowerCase().includes(syntaxDevice);
               if (!labelMatch || !deviceMatch) match = false;
            } else {
               const termMatch = comp.name?.toLowerCase().includes(term) ||
                      comp.label?.toLowerCase().includes(term) ||
                      comp.powersTo?.toLowerCase().includes(term) ||
                      device.code?.toLowerCase().includes(term) ||
                      device.name?.toLowerCase().includes(term);
               if (!termMatch) match = false;
            }
          }

          if (match) {
            results.push({
              type: 'component',
              deviceCode: device.code,
              deviceName: device.name,
              componentName: comp.name,
              componentLabel: comp.label,
              powersTo: comp.powersTo,
              location: comp.location || device.location,
              model: comp.model,
              deviceId: device.id
            });
          }
        });
      }
      
      // Search in device itself if it matches
      let deviceMatch = true;
      
      // Check quick filters
      for (const filter of quickFilters) {
        if (!filter.value.trim()) continue;
        const fVal = filter.value.toLowerCase();
        if (filter.field === 'deviceCode' && !device.code?.toLowerCase().includes(fVal)) deviceMatch = false;
        if (filter.field === 'deviceName' && !device.name?.toLowerCase().includes(fVal)) deviceMatch = false;
        if (filter.field === 'componentLabel') deviceMatch = false; // Devices don't have component labels
        if (filter.field === 'powersTo' && !device.powersTo?.toLowerCase().includes(fVal)) deviceMatch = false;
      }

      // Check quick search term
      if (deviceMatch && hasTerm) {
        if (syntaxLabel || syntaxDevice) {
           deviceMatch = false;
        } else {
           const termMatch = device.code?.toLowerCase().includes(term) ||
                  device.name?.toLowerCase().includes(term) ||
                  device.powersTo?.toLowerCase().includes(term);
           if (!termMatch) deviceMatch = false;
        }
      }

      if (deviceMatch) {
        // Only add if not already added via component to avoid duplicates
        if (!results.some(r => r.deviceId === device.id && r.type === 'device')) {
           results.push({
             type: 'device',
             deviceCode: device.code,
             deviceName: device.name,
             powersTo: device.powersTo,
             location: device.location,
             deviceId: device.id
           });
        }
      }
    });

    setQuickSearchResults(results);
  }, [quickSearchTerm, quickFilters, devices]);

  const handleEdit = (device: any) => {
    setEditingDevice(device);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingDevice(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const { error } = await supabase.from('devices').delete().eq('id', deleteConfirmId);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting device:", error);
    } finally {
      setDeleteConfirmId(null);
    }
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
      complete: async (results) => {
        try {
          let count = 0;
          for (const row of results.data as any[]) {
            // Normalize row keys to lowercase for easier matching and remove BOM if present
            const normalizedRow: any = {};
            for (const key in row) {
              if (row.hasOwnProperty(key)) {
                const cleanKey = key.replace(/^\uFEFF/, '').trim().toLowerCase();
                normalizedRow[cleanKey] = row[key];
              }
            }

            // Expected CSV columns: Mã thiết bị, Tên thiết bị, Loại thiết bị, Xuất xứ, Vị trí lắp đặt, Trạng thái
            let code = normalizedRow['mã thiết bị'] || normalizedRow['mã thiết bị *'] || normalizedRow['code'] || '';
            let name = normalizedRow['tên thiết bị'] || normalizedRow['tên thiết bị *'] || normalizedRow['name'] || '';
            
            // Fallback: if one is missing, use the other
            if (!code && name) code = name;
            if (!name && code) name = code;

            if (!code || !name) continue; // Skip rows without code or name

            const now = new Date().toISOString();

            // Build specs JSON with all extra fields
            const specs = {
              type: normalizedRow['loại thiết bị'] || normalizedRow['kind'] || '',
              origin: normalizedRow['xuất xứ'] || normalizedRow['origin'] || '',
              manager: normalizedRow['nhân viên quản lý'] || normalizedRow['manager'] || '',
              contactInfo: normalizedRow['thông tin liên hệ'] || normalizedRow['contact'] || '',
              measuringElement: normalizedRow['phần tử đo lường'] || '',
              protectionElement: normalizedRow['phần tử bảo vệ'] || '',
              poweredFrom: normalizedRow['cấp nguồn từ'] || '',
              powersTo: normalizedRow['cấp nguồn cho (phụ tải)'] || normalizedRow['cấp nguồn cho'] || '',
              installationDate: normalizedRow['ngày lắp đặt'] || '',
              usageDate: normalizedRow['ngày sử dụng'] || '',
            };
            
            console.log(`📋 Importing device: ${code} - ${name}`);

            await supabase.from('devices').insert([{
              code: String(code).trim().substring(0, 99),
              name: String(name).trim().substring(0, 299),
              location: String(normalizedRow['vị trí lắp đặt'] || normalizedRow['vị trí lắp đặt *'] || normalizedRow['vị trí'] || normalizedRow['location'] || 'Chưa xác định').trim().substring(0, 499),
              specs: specs,
              status: normalizedRow['trạng thái'] === 'Bảo trì' ? 'maintenance' : (normalizedRow['trạng thái'] === 'Ngưng hoạt động' ? 'inactive' : 'active'),
              author_id: profile?.id || null,
            }]);
            count++;
            console.log(`✅ Device imported: ${code}`);
          }
          
          if (count === 0) {
            alert('Không có dữ liệu nào được import. Vui lòng kiểm tra lại:\n1. File phải có cột "Mã thiết bị" hoặc "Tên thiết bị"\n2. File phải được lưu ở định dạng "CSV UTF-8 (Comma delimited)".');
          } else {
            alert(`✅ Đã import thành công ${count} thiết bị!`);
            // Reload devices after import
            const { data, error } = await supabase.from('devices').select('*').order('created_at', { ascending: false });
            if (data && !error) setDevices(data);
          }
        } catch (error: any) {
          console.error("Error importing devices:", error);
          alert(`❌ Có lỗi xảy ra khi import dữ liệu: ${error.message || 'Lỗi không xác định'}`);
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

  const filteredDevices = React.useMemo(() => {
    return devices.filter(device => 
      device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [devices, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Thiết bị</h1>
        {canEdit && (
          <div className="flex space-x-3">
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls,.CSV,.XLSX,.XLS" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <button 
              onClick={handleImportClick}
              disabled={importing}
              className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center text-sm font-medium disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'Đang import...' : 'Import CSV'}
            </button>
            <button 
              onClick={handleAddNew}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm thiết bị
            </button>
          </div>
        )}
      </div>

      {/* Quick Search Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow-sm border border-indigo-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Zap className="w-6 h-6 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Tra cứu nhanh (Line / Phụ tải)</h2>
          </div>
          <button onClick={addQuickFilter} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium">
            <Plus className="w-4 h-4 mr-1" /> Thêm bộ lọc
          </button>
        </div>

        {quickFilters.length > 0 && (
          <div className="space-y-3 mb-4">
            {quickFilters.map(filter => (
              <div key={filter.id} className="flex flex-col sm:flex-row gap-3 max-w-3xl">
                <div className="w-full sm:w-1/3">
                  <select
                    value={filter.field}
                    onChange={(e) => updateQuickFilter(filter.id, 'field', e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                  >
                    <option value="deviceCode">Mã thiết bị</option>
                    <option value="deviceName">Tên thiết bị</option>
                    <option value="componentLabel">Nhãn/Tên phụ tải</option>
                    <option value="powersTo">Cấp nguồn cho</option>
                  </select>
                </div>
                <div className="relative w-full sm:w-2/3 flex items-center gap-2">
                  <input
                    list={`suggestions-${filter.id}`}
                    type="text"
                    className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                    placeholder="Nhập giá trị lọc..."
                    value={filter.value}
                    onChange={(e) => updateQuickFilter(filter.id, 'value', e.target.value)}
                  />
                  <datalist id={`suggestions-${filter.id}`}>
                    {getSuggestions(filter.field).map(s => <option key={s} value={s} />)}
                  </datalist>
                  <button onClick={() => removeQuickFilter(filter.id)} className="text-red-500 hover:text-red-700 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="relative max-w-3xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
            placeholder="Tìm kiếm tự do hoặc theo cú pháp: Nhãn - Mã TB (VD: Q1 - Tủ chính)..."
            value={quickSearchTerm}
            onChange={(e) => setQuickSearchTerm(e.target.value)}
          />
        </div>

        {(quickSearchTerm.trim() || quickFilters.some(f => f.value.trim())) && (
          <div className="mt-4 bg-white rounded-md shadow-sm border border-gray-200 max-h-60 overflow-y-auto">
            {quickSearchResults.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">Không tìm thấy kết quả phù hợp.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {quickSearchResults.map((result, idx) => (
                  <li key={idx} className="p-4 hover:bg-gray-50 flex items-start">
                    <div className="flex-1">
                      {result.type === 'component' ? (
                        <>
                          <div className="flex items-center">
                            <span className="font-semibold text-indigo-600 mr-2">{result.componentLabel ? `${result.componentLabel} - ${result.componentName}` : result.componentName}</span>
                            <span className="text-sm text-gray-500">thuộc tủ</span>
                            <span className="font-medium text-gray-900 ml-2">{result.deviceCode}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Cấp nguồn cho:</span> {result.powersTo || 'Chưa xác định'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Vị trí: {result.location || 'Chưa xác định'}
                          </div>
                          {/* Links to other devices with same code */}
                          <div className="text-xs text-gray-500 mt-2">
                            <span className="font-medium">Thiết bị cùng mã:</span>{' '}
                            {devices.filter(d => d.code === result.deviceCode && d.id !== result.deviceId).length === 0 ? (
                              <span className="ml-1 text-gray-400">Không có</span>
                            ) : (
                              <button
                                onClick={() => {
                                  const list = devices.filter(d => d.code === result.deviceCode && d.id !== result.deviceId);
                                  setSiblingModalDevices(list);
                                  setSiblingModalCode(result.deviceCode);
                                  setSiblingModalOpen(true);
                                }}
                                className="ml-2 text-indigo-600 hover:underline text-xs"
                              >
                                Xem {devices.filter(d => d.code === result.deviceCode && d.id !== result.deviceId).length} thiết bị
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center">
                            <span className="font-semibold text-indigo-600 mr-2">{result.deviceCode}</span>
                            <span className="text-sm text-gray-500">({result.deviceName})</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Cấp nguồn cho:</span> {result.powersTo || 'Chưa xác định'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Vị trí: {result.location || 'Chưa xác định'}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            <span className="font-medium">Thiết bị cùng mã:</span>{' '}
                            {devices.filter(d => d.code === result.deviceCode && d.id !== result.deviceId).length === 0 ? (
                              <span className="ml-1 text-gray-400">Không có</span>
                            ) : (
                              <button
                                onClick={() => {
                                  const list = devices.filter(d => d.code === result.deviceCode && d.id !== result.deviceId);
                                  setSiblingModalDevices(list);
                                  setSiblingModalCode(result.deviceCode);
                                  setSiblingModalOpen(true);
                                }}
                                className="ml-2 text-indigo-600 hover:underline text-xs"
                              >
                                Xem {devices.filter(d => d.code === result.deviceCode && d.id !== result.deviceId).length} thiết bị
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        const device = devices.find(d => d.id === result.deviceId);
                        if (device) {
                          // If this quick result is a component, open device details and focus that component
                          setSelectedDeviceForDetails(device);
                          if (result.type === 'component') {
                            setSelectedComponentLabel(result.componentLabel || result.componentName || null);
                          } else {
                            setSelectedComponentLabel(null);
                          }
                        }
                      }}
                      className="ml-4 text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" /> Chi tiết
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Tìm kiếm theo mã, tên hoặc vị trí..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : filteredDevices.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Server className="w-12 h-12 text-gray-300 mb-4" />
            <p>Không tìm thấy thiết bị nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã TB</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên thiết bị</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vị trí / Line</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${device.status === 'active' ? 'bg-green-100 text-green-800' : 
                          device.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {device.status === 'active' ? 'Hoạt động' : device.status === 'maintenance' ? 'Bảo trì' : 'Ngưng HĐ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button onClick={() => setSelectedDeviceForDetails(device)} className="text-indigo-600 hover:text-indigo-900" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button onClick={() => handleEdit(device)} className="text-blue-600 hover:text-blue-900" title="Sửa">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDeleteClick(device.id)} className="text-red-600 hover:text-red-900" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <DeviceProfileModal 
          device={editingDevice} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      {selectedDeviceForDetails && (
        <DeviceDetailsModal
          device={selectedDeviceForDetails}
          focusComponentLabel={selectedComponentLabel || undefined}
          onClose={() => { setSelectedDeviceForDetails(null); setSelectedComponentLabel(null); }}
        />
      )}

      <SiblingDevicesModal
        isOpen={siblingModalOpen}
        code={siblingModalCode}
        devices={siblingModalDevices}
        onClose={() => setSiblingModalOpen(false)}
        onSelect={(d) => { setSelectedDeviceForDetails(d); setSelectedComponentLabel(null); }}
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa thiết bị này? Hành động này không thể hoàn tác."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
