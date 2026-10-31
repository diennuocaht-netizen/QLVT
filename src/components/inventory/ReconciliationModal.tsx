import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Save, AlertCircle, Trash2, Calendar, FileText, CheckCircle, Scale, Search, Filter, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import { supabase } from '../../supabase-client';
import { InventoryReconciliationItem, Item, InventorySlip, SlipType } from '../../types/inventory';
import { useAuth } from '../../contexts/AuthContext';
import { itemFromDatabase, slipFromDatabase } from '../../utils/dataTransform';
import { fetchAllItems } from '../../utils/fetchHelpers';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BravoParsedItem {
  code: string;
  name: string;
  receipts: number;
  issues: number;
  stock: number;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // Selected templates
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[] | null>(null);
  const [selectedTemplateNames, setSelectedTemplateNames] = useState<string[]>([]);
  const [templateSelectValue, setTemplateSelectValue] = useState<any>(null);
  
  // Cache parsed Bravo data in memory to dynamically filter when templates change
  const [importedBravoData, setImportedBravoData] = useState<Map<string, BravoParsedItem> | null>(null);
  const [bravoFileName, setBravoFileName] = useState<string>('');

  const [reconLines, setReconLines] = useState<InventoryReconciliationItem[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [appSlips, setAppSlips] = useState<InventorySlip[]>([]);
  
  // Table search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiffOnly, setFilterDiffOnly] = useState(false);
  
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
      setSelectedTemplateIds(null);
      setSelectedTemplateNames([]);
      setTemplateSelectValue(null);
      setImportedBravoData(null);
      setBravoFileName('');
      setSearchTerm('');
      setFilterDiffOnly(false);
      
      // Pre-load items and templates
      const loadData = async () => {
        const { data } = await fetchAllItems(supabase);
        if (data) setAllItems(data.map(itemFromDatabase));
        const { data: tData } = await supabase.from('inventory_audit_templates').select('*');
        if (tData) setTemplates(tData);
      };
      loadData();
    }
  }, [isOpen]);

  const loadAppSlips = async (start: string, end: string): Promise<InventorySlip[]> => {
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
      loadAppSlips(startDate, endDate).then(slips => {
        if (selectedTemplateIds || importedBravoData) {
          const updated = generateReconLines(selectedTemplateIds, importedBravoData, slips, allItems, reconLines);
          setReconLines(updated);
        }
      });
    }
  }, [startDate, endDate]);

  // Helper to compute App metrics for a single item based on slips
  const computeAppMetrics = (item: Item, slips: InventorySlip[]) => {
    let appReceipts = 0;
    let appCompletedIssues = 0;
    let appWipIssues = 0;

    slips.forEach(slip => {
      const slipItems = Array.isArray(slip.items) ? slip.items : [];
      const matchingItems = slipItems.filter(si => (si.itemId || (si as any).item_id) === item.id);
      if (matchingItems.length === 0) return;

      matchingItems.forEach(si => {
        const qty = Number(si.quantity || 0);
        const completedQty = Number(si.completedQuantity || 0);

        if (slip.type === SlipType.Receipt && (slip.status === 'Đã đóng' || slip.status === 'Đã hoàn thành' || String(slip.status).includes('ng'))) {
          appReceipts += qty;
        } else if (slip.type === SlipType.Issue) {
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

    const appStock = (item.initialStock || 0) + appReceipts - appCompletedIssues - appWipIssues;
    return { appReceipts, appCompletedIssues, appWipIssues, appStock };
  };

  /**
   * CORE RECONCILIATION BUILDER:
   * Nếu có danh sách mẫu đã chọn -> CHỦ ĐỘNG LẤY DANH SÁCH MẪU LÀM GỐC để đối soát,
   * sau đó tra cứu số liệu tương ứng từ file Bravo (loại bỏ hoàn toàn các vật tư thừa không thuộc mẫu).
   * Nếu không chọn mẫu -> lấy toàn bộ các dòng từ file Bravo như chế độ tự do.
   */
  const generateReconLines = (
    templateIds: string[] | null,
    bravoMap: Map<string, BravoParsedItem> | null,
    slips: InventorySlip[],
    items: Item[],
    prevLines?: InventoryReconciliationItem[]
  ): InventoryReconciliationItem[] => {
    // Preserve any existing physical_stock entered by user
    const physicalStockMap = new Map<string, any>();
    if (prevLines) {
      prevLines.forEach(l => {
        if (l.item_id && l.physical_stock !== '') {
          physicalStockMap.set(l.item_id, l.physical_stock);
        }
      });
    }

    // 1. TRƯỜNG HỢP CÓ CHỌN MẪU DANH SÁCH (HỆ THỐNG ĐIỆN, NƯỚC, ĐỊNH KỲ...)
    if (templateIds && templateIds.length > 0) {
      const targetItems = items.filter(i => templateIds.includes(i.id));

      return targetItems.map(item => {
        const { appReceipts, appCompletedIssues, appWipIssues, appStock } = computeAppMetrics(item, slips);
        const normCode = item.code ? item.code.trim().toLowerCase() : '';
        const bData = bravoMap ? bravoMap.get(normCode) : null;

        let note = '';
        if (!bravoMap) {
          note = 'Chưa nạp file Bravo';
        } else if (!bData) {
          note = 'Không có trong file Bravo';
        }

        return {
          id: crypto.randomUUID(),
          reconciliation_id: '',
          item_id: item.id,
          item: item,
          bravo_receipts: bData ? bData.receipts : 0,
          app_receipts: appReceipts,
          bravo_issues: bData ? bData.issues : 0,
          app_completed_issues: appCompletedIssues,
          app_wip_issues: appWipIssues,
          bravo_stock: bData ? bData.stock : 0,
          app_stock: appStock,
          physical_stock: physicalStockMap.get(item.id) ?? '',
          notes: note
        };
      });
    }

    // 2. TRƯỜNG HỢP KHÔNG CHỌN MẪU -> LẤY TẤT CẢ VẬT TƯ TỪ FILE BRAVO
    if (bravoMap && bravoMap.size > 0) {
      const lines: InventoryReconciliationItem[] = [];
      bravoMap.forEach((bData, normCode) => {
        const item = items.find(it => it.code && it.code.trim().toLowerCase() === normCode);
        if (item) {
          const { appReceipts, appCompletedIssues, appWipIssues, appStock } = computeAppMetrics(item, slips);
          lines.push({
            id: crypto.randomUUID(),
            reconciliation_id: '',
            item_id: item.id,
            item: item,
            bravo_receipts: bData.receipts,
            app_receipts: appReceipts,
            bravo_issues: bData.issues,
            app_completed_issues: appCompletedIssues,
            app_wip_issues: appWipIssues,
            bravo_stock: bData.stock,
            app_stock: appStock,
            physical_stock: physicalStockMap.get(item.id) ?? '',
            notes: ''
          });
        } else {
          lines.push({
            id: crypto.randomUUID(),
            reconciliation_id: '',
            item_id: '',
            item: { id: '', code: bData.code, name: bData.name || 'Không xác định' } as any,
            bravo_receipts: bData.receipts,
            app_receipts: 0,
            bravo_issues: bData.issues,
            app_completed_issues: 0,
            app_wip_issues: 0,
            bravo_stock: bData.stock,
            app_stock: 0,
            physical_stock: '',
            notes: 'Không tồn tại trên app'
          });
        }
      });
      return lines;
    }

    return [];
  };

  const handleTemplateChange = (selected: any) => {
    setTemplateSelectValue(selected);
    if (selected && Array.isArray(selected) && selected.length > 0) {
      const combinedIds = Array.from(new Set(selected.flatMap((s: any) => s.value || []))) as string[];
      const names = selected.map((s: any) => s.label);
      setSelectedTemplateIds(combinedIds);
      setSelectedTemplateNames(names);

      const lines = generateReconLines(combinedIds, importedBravoData, appSlips, allItems, reconLines);
      setReconLines(lines);
    } else {
      setSelectedTemplateIds(null);
      setSelectedTemplateNames([]);
      const lines = generateReconLines(null, importedBravoData, appSlips, allItems, reconLines);
      setReconLines(lines);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!startDate || !endDate) {
      alert('Vui lòng chọn khoảng thời gian đối soát trước khi import file!');
      return;
    }

    setBravoFileName(file.name);

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

        // Find header row (look for "Mã số", "Mã VT", "Mã vật tư", "Mã hàng")
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(25, rawData.length); i++) {
          const row = rawData[i];
          if (row.some(cell => typeof cell === 'string' && (
            cell.toLowerCase().includes('mã số') || 
            cell.toLowerCase().includes('mã vt') ||
            cell.toLowerCase().includes('mã vật tư') ||
            cell.toLowerCase().includes('mã hàng')
          ))) {
            headerRowIdx = i;
            break;
          }
        }
        
        if (headerRowIdx === -1) {
          alert('Không tìm thấy dòng tiêu đề có cột "Mã số" hoặc "Mã VT"!');
          return;
        }

        // We assume Bravo format: Mã số (0), Mặt hàng (1), ĐVT (2), Đầu kỳ SL (3), Đầu kỳ GT (4), Nhập SL (5), Nhập GT (6), Xuất SL (7), Xuất GT (8), Cuối kỳ SL (9)
        let colMaSo = 0;
        let colNhap = 5;
        let colXuat = 7;
        let colTon = 9;

        // Try to refine columns if header row is standard
        const headerRow = rawData[headerRowIdx];
        const subHeaderRow = rawData.length > headerRowIdx + 1 ? rawData[headerRowIdx + 1] : [];
        
        headerRow.forEach((cell, idx) => {
          if (!cell) return;
          const text = String(cell).toLowerCase();
          if (text.includes('mã')) colMaSo = idx;
        });
        
        // If they have sub-headers (Số lượng / Giá trị)
        const hasSubHeaders = subHeaderRow.some(cell => typeof cell === 'string' && cell.toLowerCase().includes('số lượng'));
        
        if (!hasSubHeaders) {
          headerRow.forEach((cell, idx) => {
            if (!cell) return;
            const text = String(cell).toLowerCase();
            if (text.includes('nhập') && !text.includes('giá')) colNhap = idx;
            if (text.includes('xuất') && !text.includes('giá')) colXuat = idx;
            if (text.includes('cuối kỳ') || text.includes('tồn')) colTon = idx;
          });
        }
        
        // Start from data rows
        const startDataIdx = hasSubHeaders ? headerRowIdx + 2 : headerRowIdx + 1;
        const bravoMap = new Map<string, BravoParsedItem>();

        for (let i = startDataIdx; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;
          
          const code = row[colMaSo];
          if (!code || String(code).trim() === '') continue; // Skip group rows or empty rows
          
          const bravoReceipts = Number(row[colNhap]) || 0;
          const bravoIssues = Number(row[colXuat]) || 0;
          const bravoStock = Number(row[colTon]) || 0;
          const rawName = String(row[1] || '').trim();

          const normCode = String(code).trim().toLowerCase();
          bravoMap.set(normCode, {
            code: String(code).trim(),
            name: rawName,
            receipts: bravoReceipts,
            issues: bravoIssues,
            stock: bravoStock
          });
        }

        setImportedBravoData(bravoMap);

        // Fetch slips if needed
        const currentSlips = appSlips.length > 0 ? appSlips : await loadAppSlips(startDate, endDate);
        
        // Generate reconciliation lines strictly respecting selected template
        const newLines = generateReconLines(selectedTemplateIds, bravoMap, currentSlips, allItems, reconLines);
        setReconLines(newLines);

        // Feedback alert
        if (selectedTemplateIds && selectedTemplateIds.length > 0) {
          const targetItems = allItems.filter(i => selectedTemplateIds.includes(i.id));
          const matched = targetItems.filter(i => bravoMap.has(i.code?.trim().toLowerCase())).length;
          const notInBravo = targetItems.length - matched;
          const totalBravo = bravoMap.size;
          const extraIgnored = Math.max(0, totalBravo - matched);

          alert(
            `✅ Đã đối chiếu thành công theo danh sách mẫu (${targetItems.length} vật tư)!\n` +
            `• Khớp với số liệu file Bravo: ${matched} vật tư\n` +
            `• Không có trong file Bravo: ${notInBravo} vật tư\n` +
            `• Đã tự động loại bỏ: ${extraIgnored} vật tư thừa trong file Bravo không thuộc mẫu đã chọn.`
          );
        } else {
          const matched = newLines.filter(l => l.item_id).length;
          const notFound = newLines.length - matched;
          alert(`✅ Đã nhập xong toàn bộ file Bravo (${newLines.length} vật tư)!\n• Khớp trên App: ${matched} vật tư\n• Không tồn tại trên App: ${notFound} vật tư`);
        }

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
          created_by: profile?.displayName || profile?.name || profile?.email || 'Unknown',
          status: 'Nháp',
          notes: notes + (selectedTemplateNames.length > 0 ? ` [Mẫu: ${selectedTemplateNames.join(', ')}]` : '')
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

  // Filter lines for table display
  const filteredLines = reconLines.filter(line => {
    const matchesSearch = !searchTerm || 
      (line.item?.code && line.item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (line.item?.name && line.item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (!matchesSearch) return false;

    if (filterDiffOnly) {
      const lechNhap = line.bravo_receipts - line.app_receipts;
      const lechXuat = line.bravo_issues - line.app_completed_issues;
      const lechTon = line.bravo_stock - line.app_stock;
      return lechNhap !== 0 || lechXuat !== 0 || lechTon !== 0;
    }

    return true;
  });

  const diffCount = reconLines.filter(l => 
    (l.bravo_receipts - l.app_receipts !== 0) || 
    (l.bravo_issues - l.app_completed_issues !== 0) || 
    (l.bravo_stock - l.app_stock !== 0)
  ).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Scale size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tạo Kỳ Đối Soát (Bravo vs App)</h2>
              <p className="text-xs text-gray-500">Đối chiếu Nhập - Xuất - Tồn giữa hệ thống phần mềm và kế toán Bravo theo danh sách mẫu.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="p-5 border-b border-gray-200 bg-white grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Left: Dates & Notes */}
          <div className="md:col-span-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Từ ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Đến ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú đợt đối soát</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="VD: Đối soát định kỳ tháng 10/2026, đối soát hệ thống điện..."
              />
            </div>
          </div>
          
          {/* Right: Template Picker & Bravo File Import */}
          <div className="md:col-span-6 space-y-3">
            <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-lg">
              <label className="block text-xs font-bold text-indigo-950 mb-1 flex items-center justify-between">
                <span>1. Chọn danh sách mẫu đối soát (Khuyến nghị)</span>
                {selectedTemplateIds && (
                  <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {selectedTemplateIds.length} vật tư trong mẫu
                  </span>
                )}
              </label>
              <Select
                isMulti
                value={templateSelectValue}
                options={templates.map(t => ({ 
                  value: t.item_ids, 
                  label: `${t.name} (${(t.item_ids || []).length} VT)` + (t.description ? ` - ${t.description}` : '') 
                }))}
                onChange={handleTemplateChange}
                placeholder="-- Chọn mẫu danh sách vật tư (Điện, Nước, Định kỳ...) --"
                isClearable
                className="text-xs"
                noOptionsMessage={() => 'Không có danh sách mẫu nào'}
              />
              <p className="text-[11px] text-indigo-700/80 mt-1.5 leading-snug">
                💡 Hệ thống sẽ <strong>lấy mẫu danh sách đã chọn làm gốc</strong> để đối chiếu và <strong>tự động loại bỏ các vật tư thừa ngoài mẫu</strong> từ file Bravo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-semibold text-xs disabled:opacity-50"
              >
                <Upload size={16} />
                <span>{importedBravoData ? 'Import Lại File Bravo' : '2. Import File Kiểm Kê Bravo (.xlsx)'}</span>
              </button>

              {importedBravoData && (
                <button
                  type="button"
                  onClick={() => {
                    setImportedBravoData(null);
                    setBravoFileName('');
                    const updated = generateReconLines(selectedTemplateIds, null, appSlips, allItems, reconLines);
                    setReconLines(updated);
                  }}
                  title="Xóa dữ liệu file Bravo vừa tải lên"
                  className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 border border-gray-200"
                >
                  <RotateCcw size={14} />
                  <span>Xóa Bravo</span>
                </button>
              )}
            </div>

            {bravoFileName && (
              <div className="text-[11px] text-green-700 font-medium flex items-center gap-1">
                <CheckCircle size={13} className="text-green-600" />
                <span>File đã nạp: {bravoFileName} ({importedBravoData?.size || 0} dòng)</span>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar: Search, Filter & Quick Stats */}
        {reconLines.length > 0 && (
          <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã hoặc tên VT..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white border border-gray-300 rounded-md w-52 md:w-64 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <label className="flex items-center gap-1.5 text-gray-700 cursor-pointer select-none font-medium">
                <input
                  type="checkbox"
                  checked={filterDiffOnly}
                  onChange={e => setFilterDiffOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Chỉ hiện dòng có lệch ({diffCount})</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {selectedTemplateIds ? (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded border border-indigo-200">
                  Lọc theo mẫu: {selectedTemplateIds.length} VT
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 font-medium rounded">
                  Toàn bộ file Bravo ({reconLines.length} VT)
                </span>
              )}

              <span className="px-2 py-0.5 bg-white text-gray-600 font-medium rounded border border-gray-200">
                Hiển thị: <strong>{filteredLines.length}</strong> / {reconLines.length} vật tư
              </span>
            </div>
          </div>
        )}

        {/* Table Body */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-white">
          {reconLines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16 space-y-3">
              <FileText size={48} className="opacity-40 text-indigo-500" />
              <p className="text-sm font-medium text-gray-600">Chưa có dữ liệu đối soát.</p>
              <p className="text-xs text-gray-400 max-w-md text-center">
                Vui lòng chọn <strong>1. Danh sách mẫu đối soát</strong> (ví dụ: vật tư điện, nước...) hoặc bấm <strong>2. Import File Kiểm Kê Bravo</strong> để bắt đầu.
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-100 sticky top-0 z-10 text-xs">
                  <tr>
                    <th rowSpan={2} className="p-3 font-semibold text-gray-900 border-b border-r border-gray-200">Mã / Tên Vật Tư</th>
                    <th colSpan={3} className="p-2.5 font-bold text-gray-900 border-b border-r border-gray-200 text-center bg-blue-50/70">NHẬP TRONG KỲ</th>
                    <th colSpan={4} className="p-2.5 font-bold text-gray-900 border-b border-r border-gray-200 text-center bg-orange-50/70">XUẤT TRONG KỲ</th>
                    <th colSpan={3} className="p-2.5 font-bold text-gray-900 border-b border-r border-gray-200 text-center bg-green-50/70">TỒN CUỐI KỲ</th>
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
                    <th className="p-2 font-medium text-gray-600 border-b border-r border-gray-200 text-center bg-green-100/50">Tồn Thực Tế</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredLines.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-400">
                        Không tìm thấy vật tư phù hợp với điều kiện tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredLines.map((line) => {
                      const lechNhap = line.bravo_receipts - line.app_receipts;
                      const lechXuat = line.bravo_issues - line.app_completed_issues;
                      const lechTon = line.bravo_stock - line.app_stock;
                      
                      return (
                        <tr key={line.item_id || line.id} className={`hover:bg-gray-50/80 transition-colors ${line.item_id ? '' : 'bg-red-50/60'}`}>
                          {/* Item Code & Name & Notes */}
                          <td className="p-3 border-r border-gray-200 max-w-[280px]">
                            <div className="font-bold text-gray-900">{line.item?.code || '-'}</div>
                            <div className="text-xs text-gray-600 truncate" title={line.item?.name}>{line.item?.name}</div>
                            {!line.item_id && <span className="text-[11px] text-red-600 font-semibold block mt-0.5">Không tồn tại trên App</span>}
                            {line.notes && (
                              <div className={`text-[11px] font-medium mt-0.5 ${
                                line.notes.includes('Không có trong file Bravo') ? 'text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded w-max border border-amber-200' : 
                                line.notes.includes('Chưa nạp') ? 'text-gray-400 italic' : 'text-gray-500'
                              }`}>
                                {line.notes}
                              </div>
                            )}
                          </td>
                          
                          {/* Nhập */}
                          <td className="p-2.5 border-r border-gray-200 text-center text-blue-900 font-semibold">{line.bravo_receipts}</td>
                          <td className="p-2.5 border-r border-gray-200 text-center font-medium text-gray-700">{line.app_receipts}</td>
                          <td className={`p-2.5 border-r border-gray-200 text-center font-bold ${lechNhap !== 0 ? 'text-red-600 bg-red-50/70' : 'text-gray-400'}`}>
                            {lechNhap !== 0 ? (lechNhap > 0 ? `+${lechNhap}` : lechNhap) : '-'}
                          </td>
                          
                          {/* Xuất */}
                          <td className="p-2.5 border-r border-gray-200 text-center text-orange-900 font-semibold">{line.bravo_issues}</td>
                          <td className="p-2.5 border-r border-gray-200 text-center font-medium text-gray-700">{line.app_completed_issues}</td>
                          <td className="p-2.5 border-r border-gray-200 text-center text-yellow-700 font-medium">
                            {line.app_wip_issues > 0 ? line.app_wip_issues : '-'}
                          </td>
                          <td className={`p-2.5 border-r border-gray-200 text-center font-bold ${lechXuat !== 0 ? 'text-red-600 bg-red-50/70' : 'text-gray-400'}`}>
                            {lechXuat !== 0 ? (lechXuat > 0 ? `+${lechXuat}` : lechXuat) : '-'}
                          </td>
                          
                          {/* Tồn */}
                          <td className="p-2.5 border-r border-gray-200 text-center font-bold text-indigo-700 bg-indigo-50/40">{line.bravo_stock}</td>
                          <td className="p-2.5 border-r border-gray-200 text-center font-medium text-gray-700">{line.app_stock}</td>
                          <td className="p-2 text-center bg-green-50/20">
                            <input
                              type="number"
                              min="0"
                              value={line.physical_stock}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                setReconLines(prev => prev.map(l => (l.item_id === line.item_id && l.id === line.id) ? { ...l, physical_stock: val } : l));
                              }}
                              className="w-20 px-2 py-1 text-center font-bold text-green-800 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                              placeholder="---"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {reconLines.length > 0 && (
              <span>
                Tổng số <strong>{reconLines.length}</strong> vật tư đối soát • Có <strong>{diffCount}</strong> vật tư chênh lệch số liệu.
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving || reconLines.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-xs font-bold disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>Lưu Kỳ Đối Soát</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
