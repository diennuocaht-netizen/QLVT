import React, { useState, useEffect, useRef } from 'react';
import { supabase, subscribeToTable } from '../supabase-client';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Plus, Edit, Trash2, Save, X, Upload, Link2, AlertCircle } from 'lucide-react';
import { CostCode, DriveSettings } from '../types/inventory';
import * as XLSX from 'xlsx';

export const InventorySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subsystems' | 'requisitionTypes' | 'costCodes' | 'driveSettings' | 'locations'>('locations');

  // Subsystems State
  const [subsystems, setSubsystems] = useState<{ id: string; name: string }[]>([]);
  const [newSubsystem, setNewSubsystem] = useState('');
  const [editingSubsystem, setEditingSubsystem] = useState<{ id: string; name: string } | null>(null);

  // Requisition Types State
  const [reqTypes, setReqTypes] = useState<{ id: string; name: string }[]>([]);
  const [newReqType, setNewReqType] = useState('');
  const [editingReqType, setEditingReqType] = useState<{ id: string; name: string } | null>(null);

  // Locations State
  const [locations, setLocations] = useState<{ id: string; code: string; name: string; description: string }[]>([]);
  const [newLocation, setNewLocation] = useState({ code: '', name: '', description: '' });
  const [editingLocation, setEditingLocation] = useState<{ id: string; code: string; name: string; description: string } | null>(null);

  // Cost Codes State
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [newCostCode, setNewCostCode] = useState<Partial<CostCode>>({});
  const [editingCostCode, setEditingCostCode] = useState<CostCode | null>(null);
  const [isAddingCostCode, setIsAddingCostCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Drive Settings State
  const [driveSettings, setDriveSettings] = useState<DriveSettings[]>([]);
  const [editingDriveSetting, setEditingDriveSetting] = useState<DriveSettings | null>(null);

  useEffect(() => {
    let isMounted = true;
    const unsubscribeFns: (() => void)[] = [];

    const loadData = async () => {
      try {
        console.log('📥 [InventorySettings] Loading initial data...');
        
        const [subsystemsRes, reqTypesRes, costCodesRes, driveSettingsRes, locationsRes] = await Promise.all([
          supabase.from('inventory_subsystems').select('*'),
          supabase.from('inventory_requisition_types').select('*'),
          supabase.from('inventory_cost_codes').select('*'),
          supabase.from('inventory_drive_settings').select('*'),
          supabase.from('inventory_locations').select('*'),
        ]);

        if (!isMounted) return;

        if (subsystemsRes.data) {
          setSubsystems(subsystemsRes.data.map(d => ({ id: d.id, name: d.name })));
        }
        if (subsystemsRes.error) throw subsystemsRes.error;

        if (reqTypesRes.data) {
          setReqTypes(reqTypesRes.data.map(d => ({ id: d.id, name: d.name })));
        }
        if (reqTypesRes.error) throw reqTypesRes.error;

        if (costCodesRes.data) {
          setCostCodes(costCodesRes.data as CostCode[]);
        }
        if (costCodesRes.error) throw costCodesRes.error;

        if (driveSettingsRes.data) {
          setDriveSettings(driveSettingsRes.data as DriveSettings[]);
        }
        if (driveSettingsRes.error) throw driveSettingsRes.error;

        if (locationsRes.data) {
          setLocations(locationsRes.data.map(d => ({ id: d.id, code: d.code, name: d.name, description: d.description || '' })));
        }
        if (locationsRes.error) throw locationsRes.error;

        console.log('✅ [InventorySettings] Initial data loaded successfully');

        // Setup subscriptions AFTER initial load completes
        if (isMounted) {
          const unsubSubsystems = subscribeToTable('inventory_subsystems', (payload) => {
            if (!isMounted) return;
            console.log('📡 [InventorySettings] Subsystem event:', payload.eventType);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setSubsystems(prev => {
                const existing = prev.find(s => s.id === payload.new.id);
                if (existing) {
                  return prev.map(s => s.id === payload.new.id ? { id: payload.new.id, name: payload.new.name } : s);
                }
                return [...prev, { id: payload.new.id, name: payload.new.name }];
              });
            } else if (payload.eventType === 'DELETE') {
              setSubsystems(prev => prev.filter(s => s.id !== payload.old.id));
            }
          });
          unsubscribeFns.push(unsubSubsystems);

          const unsubReqTypes = subscribeToTable('inventory_requisition_types', (payload) => {
            if (!isMounted) return;
            console.log('📡 [InventorySettings] ReqType event:', payload.eventType);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setReqTypes(prev => {
                const existing = prev.find(r => r.id === payload.new.id);
                if (existing) {
                  return prev.map(r => r.id === payload.new.id ? { id: payload.new.id, name: payload.new.name } : r);
                }
                return [...prev, { id: payload.new.id, name: payload.new.name }];
              });
            } else if (payload.eventType === 'DELETE') {
              setReqTypes(prev => prev.filter(r => r.id !== payload.old.id));
            }
          });
          unsubscribeFns.push(unsubReqTypes);

          const unsubCostCodes = subscribeToTable('inventory_cost_codes', (payload) => {
            if (!isMounted) return;
            console.log('📡 [InventorySettings] CostCode event:', payload.eventType);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setCostCodes(prev => {
                const existing = prev.find(c => c.id === payload.new.id);
                if (existing) {
                  return prev.map(c => c.id === payload.new.id ? { id: payload.new.id, ...payload.new } as CostCode : c);
                }
                return [...prev, { id: payload.new.id, ...payload.new } as CostCode];
              });
            } else if (payload.eventType === 'DELETE') {
              setCostCodes(prev => prev.filter(c => c.id !== payload.old.id));
            }
          });
          unsubscribeFns.push(unsubCostCodes);

          const unsubDriveSettings = subscribeToTable('inventory_drive_settings', (payload) => {
            if (!isMounted) return;
            console.log('📡 [InventorySettings] DriveSettings event:', payload.eventType);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setDriveSettings(prev => {
                const existing = prev.find(d => d.id === payload.new.id);
                if (existing) {
                  return prev.map(d => d.id === payload.new.id ? { id: payload.new.id, ...payload.new } as DriveSettings : d);
                }
                return [...prev, { id: payload.new.id, ...payload.new } as DriveSettings];
              });
            } else if (payload.eventType === 'DELETE') {
              setDriveSettings(prev => prev.filter(d => d.id !== payload.old.id));
            }
          });
          unsubscribeFns.push(unsubDriveSettings);

          const unsubLocations = subscribeToTable('inventory_locations', (payload) => {
            if (!isMounted) return;
            console.log('📡 [InventorySettings] Locations event:', payload.eventType);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setLocations(prev => {
                const existing = prev.find(l => l.id === payload.new.id);
                const locData = { id: payload.new.id, code: payload.new.code, name: payload.new.name, description: payload.new.description || '' };
                if (existing) {
                  return prev.map(l => l.id === payload.new.id ? locData : l);
                }
                return [...prev, locData];
              });
            } else if (payload.eventType === 'DELETE') {
              setLocations(prev => prev.filter(l => l.id !== payload.old.id));
            }
          });
          unsubscribeFns.push(unsubLocations);
        }
      } catch (err) {
        if (isMounted) {
          console.error('❌ [InventorySettings] Error loading data:', err);
          handleFirestoreError(err, OperationType.LIST, 'inventory_subsystems');
        }
      }
    };

    // Start loading data and setup subscriptions
    loadData();

    return () => {
      console.log('🧹 [InventorySettings] Cleaning up subscriptions');
      isMounted = false;
      unsubscribeFns.forEach(fn => fn());
    };
  }, []);

  // --- Subsystem Handlers ---
  const handleAddSubsystem = async () => {
    if (!newSubsystem.trim()) return;
    try {
      const { error } = await supabase.from('inventory_subsystems').insert([
        { name: newSubsystem.trim() }
      ]);
      if (error) throw error;
      setNewSubsystem('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'inventory_subsystems');
    }
  };

  const handleUpdateSubsystem = async () => {
    if (!editingSubsystem || !editingSubsystem.name.trim()) return;
    try {
      const { error } = await supabase.from('inventory_subsystems').update({ name: editingSubsystem.name.trim() }).eq('id', editingSubsystem.id);
      if (error) throw error;
      setEditingSubsystem(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'inventory_subsystems');
    }
  };

  const handleDeleteSubsystem = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phân hệ này?')) return;
    try {
      const { error } = await supabase.from('inventory_subsystems').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'inventory_subsystems');
    }
  };

  // --- Requisition Type Handlers ---
  const handleAddReqType = async () => {
    if (!newReqType.trim()) return;
    try {
      const { error } = await supabase.from('inventory_requisition_types').insert([
        { name: newReqType.trim() }
      ]);
      if (error) throw error;
      setNewReqType('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'inventory_requisition_types');
    }
  };

  const handleUpdateReqType = async () => {
    if (!editingReqType || !editingReqType.name.trim()) return;
    try {
      const { error } = await supabase.from('inventory_requisition_types').update({ name: editingReqType.name.trim() }).eq('id', editingReqType.id);
      if (error) throw error;
      setEditingReqType(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'inventory_requisition_types');
    }
  };

  const handleDeleteReqType = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa loại tờ trình này?')) return;
    try {
      const { error } = await supabase.from('inventory_requisition_types').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'inventory_requisition_types');
    }
  };

  // --- Location Handlers ---
  const handleAddLocation = async () => {
    if (!newLocation.code.trim() || !newLocation.name.trim()) return;
    try {
      const { error } = await supabase.from('inventory_locations').insert([{
        code: newLocation.code.trim(),
        name: newLocation.name.trim(),
        description: newLocation.description.trim()
      }]);
      if (error) throw error;
      setNewLocation({ code: '', name: '', description: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'inventory_locations');
    }
  };

  const handleUpdateLocation = async () => {
    if (!editingLocation || !editingLocation.code.trim() || !editingLocation.name.trim()) return;
    try {
      const { error } = await supabase.from('inventory_locations').update({
        code: editingLocation.code.trim(),
        name: editingLocation.name.trim(),
        description: editingLocation.description.trim()
      }).eq('id', editingLocation.id);
      if (error) throw error;
      setEditingLocation(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'inventory_locations');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vị trí này?')) return;
    try {
      const { error } = await supabase.from('inventory_locations').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'inventory_locations');
    }
  };

  // --- Cost Code Handlers ---
  const handleAddCostCode = async () => {
    if (!newCostCode.code || !newCostCode.classification || !newCostCode.subsystem) return;
    try {
      const { error } = await supabase.from('inventory_cost_codes').insert([newCostCode]);
      if (error) throw error;
      setNewCostCode({});
      setIsAddingCostCode(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'inventory_cost_codes');
    }
  };

  const handleUpdateCostCode = async () => {
    if (!editingCostCode || !editingCostCode.code) return;
    try {
      const { id, ...data } = editingCostCode;
      const { error } = await supabase.from('inventory_cost_codes').update(data).eq('id', id);
      if (error) throw error;
      setEditingCostCode(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'inventory_cost_codes');
    }
  };

  const handleDeleteCostCode = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã chi phí này?')) return;
    try {
      const { error } = await supabase.from('inventory_cost_codes').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'inventory_cost_codes');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.warn('❌ No file selected');
      return;
    }

    console.log('📁 [Import] File:', file.name, 'Type:', file.type, 'Size:', file.size);
    setIsImporting(true);
    
    try {
      let data: any[] = [];
      let headers: string[] = [];
      const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv';

      if (isCSV) {
        // Parse CSV as text
        console.log('📊 [Import] Parsing as CSV...');
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const result = evt.target?.result;
            if (typeof result === 'string') {
              resolve(result);
            } else {
              reject(new Error('Invalid file'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file, 'utf-8');
        });

        console.log('📖 [Import] File read, size:', text.length);
        
        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) throw new Error('Empty file');
        
        headers = lines[0].split(',').map(h => h.trim().replace(/^["'\s]+|["'\s]+$/g, ''));
        console.log('📋 [Import] Headers:', headers);
        
        data = lines.slice(1).map((line, idx) => {
          const values = line.split(',').map(v => v.trim().replace(/^["'\s]+|["'\s]+$/g, ''));
          const obj: any = {};
          headers.forEach((header, colIdx) => {
            if (header) {
              obj[header] = values[colIdx] || '';
            }
          });
          return obj;
        });
        
        console.log('📋 [Import] Data rows:', data.length, 'First row:', data[0]);
      } else {
        // Parse XLSX
        console.log('📊 [Import] Parsing as XLSX...');
        const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const result = evt.target?.result;
            if (result instanceof ArrayBuffer) {
              resolve(result);
            } else {
              reject(new Error('Invalid file'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsArrayBuffer(file);
        });

        const wb = XLSX.read(buffer, { type: 'array', defval: '' });
        console.log('📊 [Import] Sheets:', wb.SheetNames);
        
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        console.log('🔍 [Import] Sheet!ref:', ws['!ref']);
        
        // Cell-by-cell parsing
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const rows: any[] = [];
        
        for (let row = range.s.r; row <= range.e.r; row++) {
          const rowData: any[] = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = ws[cellAddress];
            const value = cell ? cell.v : '';
            rowData.push(value || '');
          }
          if (rowData.some(v => v && String(v).trim())) {
            rows.push(rowData);
          }
        }
        
        console.log('🔍 [Import] Total rows:', rows.length);
        if (rows.length > 0) {
          headers = rows[0].map((h: any) => String(h).trim());
          console.log('📋 [Import] Headers:', headers);
          
          data = rows.slice(1).map((row: any) => {
            const obj: any = {};
            headers.forEach((header, idx) => {
              if (header) {
                obj[header] = row[idx] || '';
              }
            });
            return obj;
          });
          
          console.log('📋 [Import] Data rows:', data.length);
        }
      }

      if (data.length === 0) {
        console.error('❌ [Import] No data rows found');
        alert('❌ Import thất bại!\n\nKhông có dữ liệu trong file.');
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        try {
          // Find headers dynamically
          const codeHeader = headers.find(h => h && (h.includes('Mã') || h.includes('code')));
          const subsystemHeader = headers.find(h => h && (h.includes('Phân') || h.includes('subsystem')));
          const classificationHeader = headers.find(h => h && (h.includes('loại') || h.includes('classification')));
          const purposeHeader = headers.find(h => h && (h.includes('Mục') || h.includes('purpose')));
          const methodHeader = headers.find(h => h && (h.includes('Phương') || h.includes('method')));
          
          const code = String(row[codeHeader || ''] || '').trim();
          const subsystem = String(row[subsystemHeader || ''] || '').trim();
          const classification = String(row[classificationHeader || ''] || '').trim();
          const purpose = String(row[purposeHeader || ''] || '').trim();
          const method = String(row[methodHeader || ''] || '').trim();

          if (!code) {
            console.warn(`📋 Row ${rowIndex + 2}: Empty code, skipped`);
            errorCount++;
            continue;
          }

          const costCodeData = {
            code: code,
            subsystem: subsystem || null,
            classification: classification || null,
            purpose: purpose || null,
            method: method || null,
          };

          console.log(`📋 Row ${rowIndex + 2}:`, costCodeData);

          const existingCode = costCodes.find(c => c.code === costCodeData.code);

          if (existingCode) {
            const { error } = await supabase.from('inventory_cost_codes').update(costCodeData).eq('id', existingCode.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('inventory_cost_codes').insert([costCodeData]);
            if (error) throw error;
          }
          successCount++;
          console.log(`✅ Row ${rowIndex + 2}: OK`);
        } catch (err) {
          errorCount++;
          errors.push(`Dòng ${rowIndex + 2}: ${err instanceof Error ? err.message : String(err)}`);
          console.error('❌ Error:', err);
        }
      }

      console.log(`📊 Final: ${successCount}/${successCount + errorCount}`);
      alert(`✅ Import thành công ${successCount}/${successCount + errorCount} mã chi phí.`);
    } catch (error) {
      console.error('❌ [Import] Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Không thể đọc file';
      alert('❌ Có lỗi xảy ra: ' + errorMsg);      
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // --- Drive Settings Handlers ---
  const handleUpdateDriveSetting = async () => {
    if (!editingDriveSetting || !editingDriveSetting.folder_id.trim()) {
      alert('Vui lòng nhập Folder ID');
      return;
    }
    try {
      const { id, ...data } = editingDriveSetting;
      const { error } = await supabase.from('inventory_drive_settings').update(data).eq('id', id);
      if (error) throw error;
      setEditingDriveSetting(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'inventory_drive_settings');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cài đặt Vật tư</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'subsystems' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('subsystems')}
          >
            Quản lý Phân hệ
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'requisitionTypes' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('requisitionTypes')}
          >
            Quản lý Loại tờ trình
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'costCodes' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('costCodes')}
          >
            Mã Dự Án / Chi Phí
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'locations'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Vị trí Kho
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'driveSettings' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('driveSettings')}
          >
            Quản lý Folder Google Drive
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'subsystems' && (
            <div>
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Tên phân hệ mới..."
                  value={newSubsystem}
                  onChange={(e) => setNewSubsystem(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button onClick={handleAddSubsystem} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Plus size={20} /> Thêm
                </button>
              </div>
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {subsystems.map(sub => (
                  <li key={sub.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    {editingSubsystem?.id === sub.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingSubsystem.name}
                          onChange={(e) => setEditingSubsystem({ ...editingSubsystem, name: e.target.value })}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button onClick={handleUpdateSubsystem} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={18} /></button>
                        <button onClick={() => setEditingSubsystem(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={18} /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-gray-900">{sub.name}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingSubsystem(sub)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit size={18} /></button>
                          <button onClick={() => handleDeleteSubsystem(sub.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
                {subsystems.length === 0 && <li className="p-4 text-center text-gray-500">Chưa có phân hệ nào.</li>}
              </ul>
            </div>
          )}

          {activeTab === 'requisitionTypes' && (
            <div>
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Loại tờ trình mới..."
                  value={newReqType}
                  onChange={(e) => setNewReqType(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button onClick={handleAddReqType} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Plus size={20} /> Thêm
                </button>
              </div>
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {reqTypes.map(type => (
                  <li key={type.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    {editingReqType?.id === type.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingReqType.name}
                          onChange={(e) => setEditingReqType({ ...editingReqType, name: e.target.value })}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button onClick={handleUpdateReqType} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={18} /></button>
                        <button onClick={() => setEditingReqType(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={18} /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-gray-900">{type.name}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingReqType(type)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit size={18} /></button>
                          <button onClick={() => handleDeleteReqType(type.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
                {reqTypes.length === 0 && <li className="p-4 text-center text-gray-500">Chưa có loại tờ trình nào.</li>}
              </ul>
            </div>
          )}

          {activeTab === 'costCodes' && (
            <div>
              {!isAddingCostCode ? (
                <div className="mb-6 flex gap-2">
                  <button onClick={() => setIsAddingCostCode(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <Plus size={20} /> Thêm Mã chi phí
                  </button>
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Upload size={20} /> {isImporting ? 'Đang import...' : 'Import CSV/Excel'}
                  </button>
                </div>
              ) : (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="font-medium mb-4">Thêm Mã chi phí mới</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input type="text" placeholder="Mã chi phí (VD: A-XDCB-VT-01)" value={newCostCode.code || ''} onChange={e => setNewCostCode({...newCostCode, code: e.target.value})} className="px-3 py-2 border rounded" />
                    <input type="text" placeholder="Phân loại (VD: Vật liệu thô)" value={newCostCode.classification || ''} onChange={e => setNewCostCode({...newCostCode, classification: e.target.value})} className="px-3 py-2 border rounded" />
                    <input type="text" placeholder="Phân hệ (VD: Xây dựng cơ bản)" value={newCostCode.subsystem || ''} onChange={e => setNewCostCode({...newCostCode, subsystem: e.target.value})} className="px-3 py-2 border rounded" />
                    <input type="text" placeholder="Mục đích (VD: Dự án A)" value={newCostCode.purpose || ''} onChange={e => setNewCostCode({...newCostCode, purpose: e.target.value})} className="px-3 py-2 border rounded" />
                    <input type="text" placeholder="Cách thực hiện (VD: Mua mới)" value={newCostCode.method || ''} onChange={e => setNewCostCode({...newCostCode, method: e.target.value})} className="px-3 py-2 border rounded" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setIsAddingCostCode(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                    <button onClick={handleAddCostCode} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Lưu</button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                      <th className="p-4 font-medium">Mã chi phí</th>
                      <th className="p-4 font-medium">Phân loại</th>
                      <th className="p-4 font-medium">Phân hệ</th>
                      <th className="p-4 font-medium">Mục đích</th>
                      <th className="p-4 font-medium">Cách thực hiện</th>
                      <th className="p-4 font-medium text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {costCodes.map(code => (
                      <tr key={code.id} className="hover:bg-gray-50">
                        {editingCostCode?.id === code.id ? (
                          <>
                            <td className="p-2"><input type="text" value={editingCostCode.code} onChange={e => setEditingCostCode({...editingCostCode, code: e.target.value})} className="w-full px-2 py-1 border rounded" /></td>
                            <td className="p-2"><input type="text" value={editingCostCode.classification} onChange={e => setEditingCostCode({...editingCostCode, classification: e.target.value})} className="w-full px-2 py-1 border rounded" /></td>
                            <td className="p-2"><input type="text" value={editingCostCode.subsystem} onChange={e => setEditingCostCode({...editingCostCode, subsystem: e.target.value})} className="w-full px-2 py-1 border rounded" /></td>
                            <td className="p-2"><input type="text" value={editingCostCode.purpose} onChange={e => setEditingCostCode({...editingCostCode, purpose: e.target.value})} className="w-full px-2 py-1 border rounded" /></td>
                            <td className="p-2"><input type="text" value={editingCostCode.method} onChange={e => setEditingCostCode({...editingCostCode, method: e.target.value})} className="w-full px-2 py-1 border rounded" /></td>
                            <td className="p-2 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={handleUpdateCostCode} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={18} /></button>
                                <button onClick={() => setEditingCostCode(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={18} /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 text-sm font-medium">{code.code}</td>
                            <td className="p-4 text-sm text-gray-600">{code.classification}</td>
                            <td className="p-4 text-sm text-gray-600">{code.subsystem}</td>
                            <td className="p-4 text-sm text-gray-600">{code.purpose}</td>
                            <td className="p-4 text-sm text-gray-600">{code.method}</td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => setEditingCostCode(code)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit size={18} /></button>
                                <button onClick={() => handleDeleteCostCode(code.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {costCodes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">Chưa có mã chi phí nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'locations' && (
            <div>
              <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <input
                  type="text"
                  placeholder="Mã vị trí (VD: K01)..."
                  value={newLocation.code}
                  onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })}
                  className="w-1/4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Tên vị trí (VD: Kho Chính)..."
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Mô tả..."
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button onClick={handleAddLocation} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap">
                  <Plus size={20} /> Thêm vị trí
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                      <th className="p-4 font-medium w-32">Mã Vị Trí</th>
                      <th className="p-4 font-medium">Tên Vị Trí</th>
                      <th className="p-4 font-medium">Mô tả</th>
                      <th className="p-4 font-medium text-center w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {locations.map(loc => (
                      <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                        {editingLocation?.id === loc.id ? (
                          <>
                            <td className="p-4">
                              <input
                                type="text"
                                value={editingLocation.code}
                                onChange={(e) => setEditingLocation({ ...editingLocation, code: e.target.value })}
                                className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="text"
                                value={editingLocation.name}
                                onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                                className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="text"
                                value={editingLocation.description}
                                onChange={(e) => setEditingLocation({ ...editingLocation, description: e.target.value })}
                                className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={handleUpdateLocation} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={18} /></button>
                                <button onClick={() => setEditingLocation(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={18} /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 font-medium text-gray-900">{loc.code}</td>
                            <td className="p-4 text-gray-700">{loc.name}</td>
                            <td className="p-4 text-gray-500">{loc.description || '-'}</td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => setEditingLocation(loc)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit size={18} /></button>
                                <button onClick={() => handleDeleteLocation(loc.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {locations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">Chưa có vị trí nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'driveSettings' && (
            <div>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>💡 Hướng dẫn:</strong> Nhập Folder ID của Google Drive folder mà bạn muốn lưu các tài liệu. 
                  Khi upload biên bản, hệ thống sẽ tự động lưu vào folder tương ứng.
                </p>
              </div>
              {driveSettings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                        <th className="p-4 font-medium">Loại Tài liệu</th>
                        <th className="p-4 font-medium">Folder ID</th>
                        <th className="p-4 font-medium">Tên Folder</th>
                        <th className="p-4 font-medium text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {driveSettings.map(setting => (
                        <tr key={setting.id} className="hover:bg-gray-50">
                          {editingDriveSetting?.id === setting.id ? (
                            <>
                              <td className="p-4 text-sm font-medium">{setting.document_type}</td>
                              <td className="p-4">
                                <input
                                  type="text"
                                  value={editingDriveSetting.folder_id}
                                  onChange={(e) => setEditingDriveSetting({ ...editingDriveSetting, folder_id: e.target.value })}
                                  placeholder="Nhập Folder ID"
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                                />
                              </td>
                              <td className="p-4">
                                <input
                                  type="text"
                                  value={editingDriveSetting.folder_name || ''}
                                  onChange={(e) => setEditingDriveSetting({ ...editingDriveSetting, folder_name: e.target.value })}
                                  placeholder="Tên folder (tùy chọn)"
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button onClick={handleUpdateDriveSetting} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={18} /></button>
                                  <button onClick={() => setEditingDriveSetting(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={18} /></button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-4 text-sm font-medium">{setting.document_type}</td>
                              <td className="p-4">
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-700">
                                  {setting.folder_id || '(chưa cấu hình)'}
                                </code>
                              </td>
                              <td className="p-4 text-sm text-gray-600">{setting.folder_name || '-'}</td>
                              <td className="p-4 text-center">
                                <button onClick={() => setEditingDriveSetting(setting)} className="p-1 text-gray-400 hover:text-indigo-600">
                                  <Edit size={18} />
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <AlertCircle size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-2">
                    <strong>Chưa có dữ liệu cấu hình Folder Google Drive</strong>
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Vui lòng chạy SQL migration trong Supabase:
                  </p>
                  <code className="bg-white px-3 py-2 rounded border border-gray-300 text-xs font-mono text-gray-700 inline-block">
                    supabase-migration/11-create-drive-settings.sql
                  </code>
                  <p className="text-sm text-gray-500 mt-4">
                    Sau đó, refresh trang này để xem dữ liệu.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
