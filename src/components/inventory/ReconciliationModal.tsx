import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Save, AlertCircle, Trash2, Calendar, FileText, CheckCircle, Scale } from 'lucide-react';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import { supabase } from '../../supabase-client';
import { InventoryReconciliationItem, Item, InventorySlip, SlipType } from '../../types/inventory';
import { useAuth } from '../../contexts/AuthContext';
import { itemFromDatabase, slipFromDatabase } from '../../utils/dataTransform';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[] | null>(null);
  
  const [reconLines, setReconLines] = useState<InventoryReconciliationItem[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [appSlips, setAppSlips] = useState<InventorySlip[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();

  useEffect(() => {
    if (isOpen) {
      // Set default dates to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
      
      setReconLines([]);
      setNotes('');
      
      // Pre-load items
      const loadItems = async () => {
        const { data } = await supabase.from('inventory_items').select('*').limit(10000);
        if (data) setAllItems(data.map(itemFromDatabase));
        const { data: tData } = await supabase.from('inventory_audit_templates').select('*');
        if (tData) setTemplates(tData);
      };
      loadItems();
    }
  }, [isOpen]);

  const loadAppSlips = async (start: string, end: string) => {
    if (!start || !end) return [];
    
    setLoading(true);
    try {
      const startDateTime = `${start}T00:00:00.000Z`;
      const endDateTime = `${end}T23:59:59.999Z`;
      
      const { data, error } = await supabase
        .from('inventory_slips')
        .select('*')
        .gte('date', startDateTime)
        .lte('date', endDateTime)
        .order('date', { ascending: true });
        
      if (error) throw error;
      const slips = (data || []).map(slipFromDatabase);
      setAppSlips(slips);
      return slips;
    } catch (err) {
      console.error('Error fetching slips:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Run when dates change
  useEffect(() => {
    if (startDate && endDate) {
      loadAppSlips(startDate, endDate);
    }
  }, [startDate, endDate]);

  
  const handleSelectTemplate = async (selected: any) => {
    if (!selected || !selected.value) return;
    if (!startDate || !endDate) {
      alert('Vui lòng chọn khoảng thời gian đối soát trước!');
      return;
    }
    
    const ids = selected.value as string[];
    const items = allItems.filter(i => ids.includes(i.id));
    
    const slips = await loadAppSlips(startDate, endDate);
    
    const newLines = items.map(item => {
      let appReceipts = 0;
      let appCompletedIssues = 0;
      let appPendingIssues = 0;
      
      slips.forEach(slip => {
        if (selectedTemplateIds && !selectedTemplateIds.includes(item.id)) return null;
            const items_array = Array.isArray(slip.items) ? slip.items : [];
        const slipItem = items_array.find((i: any) => {
          const idKey = i.itemId ?? i.item_id ?? i.itemId;
          return idKey === item.id;
        });
        
        if (slipItem) {
          if (slip.type === SlipType.Receipt && (slip.status === 'Đã hoàn thành' || slip.status === 'Đã đóng')) {
            appReceipts += (slipItem.quantity || 0);
          } else if (slip.type === SlipType.Issue) {
            const completedQty = slipItem.completedQuantity || 0;
            const isFullyCompleted = slip.isCompleted;
            if (isFullyCompleted) {
              appCompletedIssues += (slipItem.quantity || 0);
            } else {
              appCompletedIssues += completedQty;
              appPendingIssues += Math.max(0, (slipItem.quantity || 0) - completedQty);
            }
          }
        }
      });
      
      return {
        id: crypto.randomUUID(),
        reconciliation_id: '',
        item_id: item.id,
        item: item,
        bravo_receipts: 0,
        bravo_issues: 0,
        bravo_stock: 0,
        app_receipts: appReceipts,
        app_completed_issues: appCompletedIssues,
        app_pending_issues: appPendingIssues,
        app_stock: 0, // usually calculated based on opening balance, here simplified
        physical_stock: 0,
        notes: 'Từ danh sách mẫu'
      } as InventoryReconciliationItem;
    });
    
    setReconLines(newLines);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!startDate || !endDate) {
      alert('Vui lòng chọn khoảng thời gian đối soát trước khi import file!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Read raw array to find header
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        if (rawData.length === 0) {
          alert('File Excel trống!');
          return;
        }

        // Find header row (look for "Mã số" or "Mã VT")
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
          const row = rawData[i];
          if (row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('mã số') || cell.toLowerCase().includes('mã vt')))) {
            headerRowIdx = i;
            break;
          }
        }
        
        if (headerRowIdx === -1) {
          alert('Không tìm thấy dòng tiêu đề có cột "Mã số" hoặc "Mã VT"!');
          return;
        }

        // We assume Bravo format: Mã số (0), Mặt hàng (1), ĐVT (2), Đầu kỳ SL (3), Đầu kỳ GT (4), Nhập SL (5), Nhập GT (6), Xuất SL (7), Xuất GT (8), Cuối kỳ SL (9)
        // If it's dynamically structured, we can search for column indexes. But let's use a simpler heuristic for typical Bravo 'Nhập Xuất Tồn'.
        let colMaSo = 0;
        let colNhap = 5;
        let colXuat = 7;
        let colTon = 9;

        // Try to refine columns if header row 7 is standard
        const headerRow = rawData[headerRowIdx];
        const subHeaderRow = rawData.length > headerRowIdx + 1 ? rawData[headerRowIdx + 1] : [];
        
        headerRow.forEach((cell, idx) => {
          if (!cell) return;
          const text = String(cell).toLowerCase();
          if (text.includes('mã')) colMaSo = idx;
        });
        
        // If they have sub-headers (Số lượng / Giá trị)
        let hasSubHeaders = subHeaderRow.some(cell => typeof cell === 'string' && cell.toLowerCase().includes('số lượng'));
        
        if (!hasSubHeaders) {
          // Standard flat format mapping
          headerRow.forEach((cell, idx) => {
            if (!cell) return;
            const text = String(cell).toLowerCase();
            if (text.includes('nhập') && !text.includes('giá')) colNhap = idx;
            if (text.includes('xuất') && !text.includes('giá')) colXuat = idx;
            if (text.includes('cuối kỳ') || text.includes('tồn')) colTon = idx;
          });
        }
        
        const parsedLines: InventoryReconciliationItem[] = [];
        let matched = 0;
        let notFound = 0;

        // Start from data rows
        const startDataIdx = hasSubHeaders ? headerRowIdx + 2 : headerRowIdx + 1;
        
        for (let i = startDataIdx; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;
          
          const code = row[colMaSo];
          if (!code || String(code).trim() === '') continue; // Skip group rows or empty rows
          
          const bravoReceipts = Number(row[colNhap]) || 0;
          const bravoIssues = Number(row[colXuat]) || 0;
          const bravoStock = Number(row[colTon]) || 0;
          
          // Match with App items
          const item = allItems.find(it => it.code?.toLowerCase() === String(code).trim().toLowerCase());
          
          if (!item) {
            notFound++;
            parsedLines.push({
              item_id: '',
              item: { id: '', code: String(code), name: String(row[1] || 'Không xác định') },
              bravo_receipts: bravoReceipts,
              app_receipts: 0,
              bravo_issues: bravoIssues,
              app_completed_issues: 0,
              app_wip_issues: 0,
              bravo_stock: bravoStock,
              app_stock: 0,
              physical_stock: '',
              notes: 'Không tồn tại trên app'
            });
            continue;
          }

          // Calculate App Metrics for this item from appSlips
          let appReceipts = 0;
          let appCompletedIssues = 0;
          let appWipIssues = 0;

          appSlips.forEach(slip => {
            const slipItems = Array.isArray(slip.items) ? slip.items : [];
            const matchingItems = slipItems.filter(si => (si.itemId || (si as any).item_id) === item.id);
            if (matchingItems.length === 0) return;

            matchingItems.forEach(si => {
              const qty = Number(si.quantity || 0);
              const completedQty = Number(si.completedQuantity || 0);

              if (slip.type === SlipType.Receipt && (slip.status === 'Đã đóng' || slip.status === 'Đã hoàn thành' || String(slip.status).includes('ng'))) {
                appReceipts += qty;
              } else if (slip.type === SlipType.Issue) {
                // If it's fully completed or has completion data
                if (si.isCompleted || completedQty >= qty) {
                  appCompletedIssues += qty;
                } else if (completedQty > 0) {
                  appCompletedIssues += completedQty;
                  appWipIssues += (qty - completedQty);
                } else {
                  appWipIssues += qty;
                }
              }
            });
          });

          // Compute appStock loosely (for display, though Bravo stock is the truth)
          const appStock = (item.initialStock || 0) + appReceipts - appCompletedIssues - appWipIssues;

          matched++;
          parsedLines.push({
            item_id: item.id,
            item: item,
            bravo_receipts: bravoReceipts,
            app_receipts: appReceipts,
            bravo_issues: bravoIssues,
            app_completed_issues: appCompletedIssues,
            app_wip_issues: appWipIssues,
            bravo_stock: bravoStock,
            app_stock: appStock,
            physical_stock: '', // Leave blank for manual entry
            notes: ''
          });
        }

        setReconLines(parsedLines);
        alert(`✓ Đã nhập xong!\n- Khớp: ${matched} vật tư\n- Không tồn tại: ${notFound} vật tư`);

      } catch (err) {
        console.error('Error parsing excel:', err);
        alert('❌ Lỗi đọc file Excel!');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async () => {
    if (reconLines.length === 0) {
      alert('Chưa có dữ liệu đối soát!');
      return;
    }
    
    try {
      setSaving(true);
      
      const code = `RECON-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // Insert Reconciliation
      const { data: reconData, error: reconError } = await supabase
        .from('inventory_reconciliations')
        .insert([{
          code,
          start_date: startDate,
          end_date: endDate,
          created_by: profile?.name || 'Unknown',
          status: 'Nháp',
          notes
        }])
        .select()
        .single();
        
      if (reconError) throw reconError;
      
      // Insert Items
      const validLines = reconLines.filter(line => line.item_id);
      
      const itemsToInsert = validLines.map(line => ({
        reconciliation_id: reconData.id,
        item_id: line.item_id,
        bravo_receipts: line.bravo_receipts,
        app_receipts: line.app_receipts,
        bravo_issues: line.bravo_issues,
        app_completed_issues: line.app_completed_issues,
        app_wip_issues: line.app_wip_issues,
        bravo_stock: line.bravo_stock,
        app_stock: line.app_stock,
        physical_stock: line.physical_stock === '' ? null : line.physical_stock,
        notes: line.notes
      }));
      
      const { error: itemsError } = await supabase
        .from('inventory_reconciliation_items')
        .insert(itemsToInsert);
        
      if (itemsError) throw itemsError;
      
      alert('✓ Đã tạo kỳ đối soát thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving reconciliation:', error);
      alert('❌ Lỗi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Scale className="text-indigo-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Tạo Kỳ Đối Soát (Bravo vs App)</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú kỳ đối soát</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={2}
                placeholder="Ví dụ: Đối soát dữ liệu kho tháng 9/2024..."
              />
            </div>
          </div>
          
          
            <div className="w-full md:w-80 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
                <label className="block text-sm font-medium text-indigo-900 mb-1">1. Lọc theo danh sách mẫu (Tùy chọn)</label>
                <Select
                  options={templates.map(t => ({ value: t.item_ids, label: t.name + (t.description ? ` - ${t.description}` : '') }))}
                  onChange={(selected: any) => {
                    if (selected && selected.value) {
                      setSelectedTemplateIds(selected.value); // Store globally for file upload reference
                    } else {
                      setSelectedTemplateIds(null);
                    }
                  }}
                  placeholder="Chọn mẫu để lọc..."
                  isClearable
                />
              
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  onClick={async () => {
                    if (!selectedTemplateIds || selectedTemplateIds.length === 0) {
                      alert('Vui lòng chọn danh sách mẫu trước!');
                      return;
                    }
                    if (!startDate || !endDate) {
                      alert('Vui lòng chọn khoảng thời gian đối soát trước!');
                      return;
                    }
                    setLoading(true);
                    try {
                      const items = allItems.filter(i => selectedTemplateIds.includes(i.id));
                      const slips = await loadAppSlips(startDate, endDate);
                      
                      const newLines = items.map(item => {
                        let appReceipts = 0;
                        let appCompletedIssues = 0;
                        let appPendingIssues = 0;
                        
                        slips.forEach(slip => {
                          const items_array = Array.isArray(slip.items) ? slip.items : [];
                          const slipItem = items_array.find((i: any) => {
                            const idKey = i.itemId ?? i.item_id ?? i.itemId;
                            return idKey === item.id;
                          });
                          
                          if (slipItem) {
                            if (slip.type === SlipType.Receipt && (slip.status === 'Đã hoàn thành' || slip.status === 'Đã đóng')) {
                              appReceipts += (slipItem.quantity || 0);
                            } else if (slip.type === SlipType.Issue) {
                              const completedQty = slipItem.completedQuantity || 0;
                              const isFullyCompleted = slip.isCompleted;
                              if (isFullyCompleted) {
                                appCompletedIssues += (slipItem.quantity || 0);
                              } else {
                                appCompletedIssues += completedQty;
                                appPendingIssues += Math.max(0, (slipItem.quantity || 0) - completedQty);
                              }
                            }
                          }
                        });
                        
                        return {
                          id: crypto.randomUUID(),
                          reconciliation_id: '',
                          item_id: item.id,
                          item: item,
                          bravo_receipts: 0,
                          bravo_issues: 0,
                          bravo_stock: 0,
                          app_receipts: appReceipts,
                          app_completed_issues: appCompletedIssues,
                          app_pending_issues: appPendingIssues,
                          app_stock: 0,
                          physical_stock: 0,
                          notes: 'Từ danh sách mẫu'
                        } as InventoryReconciliationItem;
                      });
                      
                      setReconLines(newLines);
                    } catch(err) {
                      console.error(err);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !selectedTemplateIds}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <FileText size={18} />
                  Tạo phiếu từ Mẫu (Không Excel)
                </button>
              </div>

              <div className="flex flex-col space-y-2">

                <label className="block text-sm font-medium text-gray-700">2. Import số liệu từ Bravo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Upload size={18} />
                  Import File Bravo
                </button>
              </div>
            </div>
          </div>



        <div className="flex-1 overflow-auto p-6 bg-white">
          {reconLines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <FileText size={48} className="opacity-50" />
              <p>Chưa có dữ liệu đối soát. Vui lòng import file Bravo.</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-100">
                  <tr>
                    <th rowSpan={2} className="p-3 font-semibold text-gray-900 border-b border-r border-gray-200">Mã / Tên VT</th>
                    <th colSpan={3} className="p-3 font-semibold text-gray-900 border-b border-r border-gray-200 text-center bg-blue-50/50">NHẬP</th>
                    <th colSpan={4} className="p-3 font-semibold text-gray-900 border-b border-r border-gray-200 text-center bg-orange-50/50">XUẤT</th>
                    <th colSpan={3} className="p-3 font-semibold text-gray-900 border-b border-gray-200 text-center bg-green-50/50">TỒN</th>
                  </tr>
                  <tr>
                    <th className="p-2 font-medium text-gray-600 border-b border-r border-gray-200 text-center">Bravo</th>
                    <th className="p-2 font-medium text-gray-600 border-b border-r border-gray-200 text-center">App</th>
                    <th className="p-2 font-medium text-gray-600 border-b border-r border-gray-200 text-center">Lệch</th>
                    
                    <th className="p-2 font-medium text-gray-600 border-b border-r border-gray-200 text-center">Bravo</th>
                    <th className="p-2 font-medium text-gray-600 border-b border-r border-gray-200 text-center">App (Xong)</th>
                    <th className="p-2 font-medium text-gray-600 border-b border-r border-gray-200 text-center">App (Chưa)</th>
                    <th className="p-2 font-medium text-gray-600 border-b border-r border-gray-200 text-center">Lệch</th>
                    
                    <th className="p-2 font-medium text-gray-600 border-b border-r border-gray-200 text-center">Bravo</th>
                    <th className="p-2 font-medium text-gray-600 border-b border-r border-gray-200 text-center">App</th>
                    <th className="p-2 font-medium text-gray-600 border-b border-gray-200 text-center">Thực Tế</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reconLines.map((line, idx) => {
                    const lechNhap = line.bravo_receipts - line.app_receipts;
                    const lechXuat = line.bravo_issues - line.app_completed_issues;
                    
                    return (
                      <tr key={idx} className={`hover:bg-gray-50 ${line.item_id ? '' : 'bg-red-50'}`}>
                        <td className="p-3 border-r border-gray-200">
                          <div className="font-medium text-gray-900">{line.item?.code}</div>
                          <div className="text-xs text-gray-500 max-w-[200px] truncate" title={line.item?.name}>{line.item?.name}</div>
                          {!line.item_id && <span className="text-xs text-red-600">Không có trên App</span>}
                        </td>
                        
                        {/* Nhập */}
                        <td className="p-3 border-r border-gray-200 text-center text-blue-900">{line.bravo_receipts}</td>
                        <td className="p-3 border-r border-gray-200 text-center">{line.app_receipts}</td>
                        <td className={`p-3 border-r border-gray-200 text-center font-medium ${lechNhap !== 0 ? 'text-red-600 bg-red-50' : 'text-gray-400'}`}>
                          {lechNhap !== 0 ? lechNhap : '-'}
                        </td>
                        
                        {/* Xuất */}
                        <td className="p-3 border-r border-gray-200 text-center text-orange-900">{line.bravo_issues}</td>
                        <td className="p-3 border-r border-gray-200 text-center">{line.app_completed_issues}</td>
                        <td className="p-3 border-r border-gray-200 text-center text-yellow-600">{line.app_wip_issues > 0 ? line.app_wip_issues : '-'}</td>
                        <td className={`p-3 border-r border-gray-200 text-center font-medium ${lechXuat !== 0 ? 'text-red-600 bg-red-50' : 'text-gray-400'}`}>
                          {lechXuat !== 0 ? lechXuat : '-'}
                        </td>
                        
                        {/* Tồn */}
                        <td className="p-3 border-r border-gray-200 text-center font-bold text-indigo-700 bg-indigo-50/30">{line.bravo_stock}</td>
                        <td className="p-3 border-r border-gray-200 text-center">{line.app_stock}</td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={line.physical_stock}
                            onChange={(e) => {
                              const newLines = [...reconLines];
                              newLines[idx].physical_stock = e.target.value === '' ? '' : Number(e.target.value);
                              setReconLines(newLines);
                            }}
                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="---"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving || reconLines.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            <span>Lưu kỳ đối soát</span>
          </button>
        </div>
      </div>
    </div>
  );
};
