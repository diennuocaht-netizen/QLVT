import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Item, CalculatedInventoryItem, SlipType, InventorySlip } from '../types/inventory';
import { Plus, Search, Edit, Trash2, Download, Upload, ZapOff, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ItemModal } from '../components/inventory/ItemModal';
import { QuickIssueModal } from '../components/inventory/QuickIssueModal';
import { ItemTraceabilityModal } from '../components/inventory/ItemTraceabilityModal';
import { PrintQRModal } from '../components/inventory/PrintQRModal';
import { QRScannerModal } from '../components/inventory/QRScannerModal';
import { itemFromDatabase, slipFromDatabase, itemToDatabase } from '../utils/dataTransform';
import { QrCode, ScanLine, X, ArrowUpFromLine, FileText } from 'lucide-react';

export const InventoryItems: React.FC = () => {
  const { profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [slips, setSlips] = useState<InventorySlip[]>([]);
  const [locations, setLocations] = useState<{id: string, code: string, name: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [quickIssueOpen, setQuickIssueOpen] = useState(false);
  const [quickIssueItem, setQuickIssueItem] = useState<Item | null>(null);
  const [isGlobalQRScannerOpen, setIsGlobalQRScannerOpen] = useState(false);
  const [scannedItemAction, setScannedItemAction] = useState<Item | null>(null);
  
  const hasAccess = profile?.role === 'admin' || profile?.role === 'manager';
  const [traceabilityOpen, setTraceabilityOpen] = useState(false);
  const [traceabilityItem, setTraceabilityItem] = useState<Item | null>(null);
  const [printQROpen, setPrintQROpen] = useState(false);
  const [printQRItem, setPrintQRItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data and subscribe to changes
  useEffect(() => {
    let isMounted = true;
    let isInitialLoadComplete = false;

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
          .from('inventory_items')
          .select('*');

        if (itemsError) throw itemsError;
        if (isMounted) {
          setItems((itemsData || []).map(item => itemFromDatabase(item)) as Item[]);
        }

        // Fetch locations
        const { data: locationsData } = await supabase.from('inventory_locations').select('*');
        if (isMounted && locationsData) {
          setLocations(locationsData);
        }

        // Fetch slips
        const { data: slipsData, error: slipsError } = await supabase
          .from('inventory_slips')
          .select('*');

        if (slipsError) throw slipsError;
        if (isMounted) {
          setSlips((slipsData || []).map(slip => slipFromDatabase(slip)) as InventorySlip[]);
          isInitialLoadComplete = true;
          console.log('✅ [InventoryItems] Initial data load complete');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Lỗi tải dữ liệu: ' + (error instanceof Error ? error.message : 'Unknown error'));
        if (isMounted) {
          isInitialLoadComplete = true;
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Start loading
    loadData();

    // Subscribe to real-time changes AFTER initial load (helps prevent duplicates)
    const subscribeToChanges = async () => {
      // Wait a bit for initial load to complete
      let attempts = 0;
      while (!isInitialLoadComplete && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!isMounted) return;
      
      const itemsChannel = supabase
        .channel(`inventory_items_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'inventory_items' },
          (payload) => {
            console.log('📡 [InventoryItems] Received event:', payload.eventType, payload.new?.id);
            if (!isMounted) return;
            
            if (payload.eventType === 'INSERT') {
              console.log('➕ New item inserted, updating state...');
              const newItem = itemFromDatabase(payload.new) as Item;
              setItems(prev => {
                // Check if item already exists (deduplication)
                const exists = prev.some(item => item.id === newItem.id);
                if (exists) {
                  console.log('⚠️ [InventoryItems] Item already exists, skipping duplicate:', newItem.id);
                  return prev;
                }
                return [...prev, newItem];
              });
            } else if (payload.eventType === 'UPDATE') {
              console.log('✏️ Item updated, updating state...');
              setItems(prev =>
                prev.map(item => (item.id === payload.new.id ? (itemFromDatabase(payload.new) as Item) : item))
              );
            } else if (payload.eventType === 'DELETE') {
              console.log('🗑️ Item deleted, updating state...');
              setItems(prev => prev.filter(item => item.id !== payload.old.id));
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 [InventoryItems] Items subscription status:', status);
        });

      const slipsChannel = supabase
        .channel(`inventory_slips_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'inventory_slips' },
          (payload) => {
            if (!isMounted) return;
            if (payload.eventType === 'INSERT') {
              const newSlip = slipFromDatabase(payload.new) as InventorySlip;
              setSlips(prev => {
                // Check if slip already exists (deduplication)
                const exists = prev.some(slip => slip.id === newSlip.id);
                if (exists) {
                  console.log('⚠️ [InventoryItems] Slip already exists, skipping duplicate:', newSlip.id);
                  return prev;
                }
                return [...prev, newSlip];
              });
            } else if (payload.eventType === 'UPDATE') {
              setSlips(prev =>
                prev.map(slip => (slip.id === payload.new.id ? (slipFromDatabase(payload.new) as InventorySlip) : slip))
              );
            } else if (payload.eventType === 'DELETE') {
              setSlips(prev => prev.filter(slip => slip.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        if (itemsChannel) supabase.removeChannel(itemsChannel);
        if (slipsChannel) supabase.removeChannel(slipsChannel);
      };
    };

    // Start subscription
    let unsubscribe: (() => void) | null = null;
    subscribeToChanges().then(fn => {
      if (isMounted) unsubscribe = fn || null;
    });

    // Listen for manual refresh events (helpful when real-time channels close)
    const handleRefresh = async () => {
      console.log('📣 [InventoryItems] Received inventory:refresh, reloading data...');
      try {
        const { data: itemsData, error: itemsError } = await supabase.from('inventory_items').select('*');
        if (itemsError) throw itemsError;
        setItems((itemsData || []).map(item => itemFromDatabase(item)) as Item[]);

        const { data: slipsData, error: slipsError } = await supabase.from('inventory_slips').select('*');
        if (slipsError) throw slipsError;
        setSlips((slipsData || []).map(slip => slipFromDatabase(slip)) as InventorySlip[]);
        console.log('✅ [InventoryItems] Manual refresh complete');
      } catch (err) {
        console.error('Error during manual inventory refresh:', err);
      }
    };

    window.addEventListener('inventory:refresh', handleRefresh);

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      window.removeEventListener('inventory:refresh', handleRefresh);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vật tư này?')) {
      try {
        const { error } = await supabase
          .from('inventory_items')
          .delete()
          .eq('id', id);

        if (error) throw error;
        alert('Xóa thành công');
        // Log delete
        try {
          const { data: deletedItem } = await supabase.from('inventory_items').select('code,name').eq('id', id).maybeSingle();
          // deletedItem may be null since it's already deleted; log minimal info
        } catch (e) {
          // ignore
        }
        import('../utils/activityLogger').then(mod => mod.logActivity({ action: 'delete_item', entityType: 'inventory_item', entityId: id }));
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Lỗi xóa vật tư: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const inventory = React.useMemo(() => {
    return items.map(item => {
      let totalReceipts = 0;
      let totalIssues = 0;

      // First gather totals from slips according to rules:
      // - Receipts: only closed/finished count
      // - Issues: count immediately (open or closed)
      slips.forEach(slip => {
        const items_array = Array.isArray(slip.items) ? slip.items : [];
        const matchingItems = items_array.filter((i: any) => {
          const idKey = i.itemId ?? i.item_id ?? i.itemId;
          return idKey === item.id;
        });
        if (matchingItems.length === 0) return;

        const sumQty = matchingItems.reduce((s: number, it: any) => s + (it.quantity || 0), 0);

        if (slip.type === SlipType.Receipt) {
          if (slip.status === 'Đã đóng' || slip.status === 'Đã hoàn thành') {
            totalReceipts += sumQty;
          }
        } else if (slip.type === SlipType.Issue) {
          totalIssues += sumQty;
        }
      });

      // Always compute stock from initial + receipts - issues to show transparent flow
      const stock = (item.initialStock || 0) + totalReceipts - totalIssues;

      return { item, stock, totalReceipts, totalIssues };
    });
  }, [items, slips]);

  const filteredInventory = React.useMemo(() => {
    return inventory.filter(inv => {
      const q = searchTerm.toLowerCase();
      const matchesQuery = inv.item.name.toLowerCase().includes(q) ||
        inv.item.code.toLowerCase().includes(q) ||
        (inv.item.category && inv.item.category.toLowerCase().includes(q));

      if (!matchesQuery) return false;

      if (stockFilter === 'in') return inv.stock > 0;
      if (stockFilter === 'out') return inv.stock <= 0;
      return true;
    });
  }, [inventory, searchTerm, stockFilter]);


  const handleExportExcel = () => {
    const dataToExport = filteredInventory.map(inv => ({
      'Mã VT': inv.item.code,
      'Tên Vật tư': inv.item.name,
      'Đơn vị': inv.item.unit,
      'Danh mục': inv.item.category,
      'Tồn đầu kỳ': inv.item.initialStock,
      'Tổng Nhập': inv.totalReceipts,
      'Tổng Xuất': inv.totalIssues,
      'Tồn hiện tại': inv.stock,
      'Đơn giá': inv.item.unitPrice,
      'Thành tiền': inv.stock * (inv.item.unitPrice || 0),
      'Ngưỡng dưới': inv.item.warningThresholdLower,
      'Ngưỡng trên': inv.item.warningThresholdUpper,
      'Ghi chú': inv.item.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    XLSX.writeFile(wb, 'inventory-items.xlsx');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.warn('❌ No file selected');
      return;
    }

    console.log('📁 [Import Items] File:', file.name, 'Type:', file.type, 'Size:', file.size);
    setImporting(true);
    
    try {
      let data: any[] = [];
      let headers: string[] = [];
      const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv';

      if (isCSV) {
        // Parse CSV using Papa.parse
        console.log('📊 [Import Items] Parsing as CSV with Papa.parse...');
        const csvData = await new Promise<any[]>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy',
            complete: (results) => {
              console.log('✅ [Import Items] CSV parsed, rows:', results.data.length);
              resolve(results.data as any[]);
            },
            error: (error) => {
              reject(new Error('CSV parse error: ' + error.message));
            }
          });
        });

        data = csvData;
        if (data.length > 0) {
          // Get headers from first row keys
          headers = Object.keys(data[0] || {});
          console.log('📋 [Import Items] Headers:', headers);
        }
      } else {
        // Parse as XLSX
        console.log('📊 [Import Items] Parsing as XLSX...');
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
        console.log('📊 [Import Items] Sheets:', wb.SheetNames);
        
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        console.log('🔍 [Import Items] Sheet!ref:', ws['!ref']);
        
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
        
        console.log('🔍 [Import Items] Total rows:', rows.length);
        if (rows.length > 0) {
          headers = rows[0].map((h: any) => String(h).trim());
          console.log('📋 [Import Items] Headers:', headers);
          
          data = rows.slice(1).map((row: any) => {
            const obj: any = {};
            headers.forEach((header, idx) => {
              if (header) {
                obj[header] = row[idx] || '';
              }
            });
            return obj;
          });
          
          console.log('📋 [Import Items] Data rows:', data.length);
        }
      }

      if (data.length === 0) {
        console.error('❌ [Import Items] No data rows found');
        alert('❌ Import thất bại!\n\nKhông có dữ liệu trong file.');
        setImporting(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        try {
          // Find headers dynamically - using actual header names
          const codeHeader = headers.find(h => h.toLowerCase().includes('mã'));
          const nameHeader = headers.find(h => h.toLowerCase().includes('tên'));
          const unitHeader = headers.find(h => h.toLowerCase().includes('đơn vị'));
          const categoryHeader = headers.find(h => {
            const l = h.toLowerCase();
            return l.includes('danh') || l.includes('loại') || l.includes('category');
          });
          const initialStockHeader = headers.find(h => {
            const l = h.toLowerCase();
            return (l.includes('tồn') && l.includes('đầu')) || l.includes('initial');
          });
          const unitPriceHeader = headers.find(h => {
            const l = h.toLowerCase();
            return (l.includes('đơn') && l.includes('giá')) || l.includes('price');
          });
          const warningLowerHeader = headers.find(h => {
            const l = h.toLowerCase();
            return (l.includes('ngưỡng') && l.includes('dưới')) || l.includes('lower');
          });
          const warningUpperHeader = headers.find(h => {
            const l = h.toLowerCase();
            return (l.includes('ngưỡng') && l.includes('trên')) || l.includes('upper');
          });
          const notesHeader = headers.find(h => {
            const l = h.toLowerCase();
            return l.includes('ghi') || l.includes('chú') || l.includes('notes');
          });

          console.log(`📊 Row ${rowIndex + 2} headers found:`, {
            codeHeader, nameHeader, unitHeader, categoryHeader
          });

          // Get row values using header names
          const code = String(row[codeHeader || ''] || '').trim();
          const name = String(row[nameHeader || ''] || '').trim();
          
          console.log(`📋 Row ${rowIndex + 2}:`, { code, name });
          
          if (!code || !name) {
            console.warn(`⚠️ Row ${rowIndex + 2}: Empty code or name, skipped`);
            errorCount++;
            continue;
          }

          const unit = String(row[unitHeader || ''] || '').trim();
          const category = String(row[categoryHeader || ''] || '').trim();
          const initialStock = parseInt(String(row[initialStockHeader || ''] || '0')) || 0;
          const unitPrice = parseFloat(String(row[unitPriceHeader || ''] || '0')) || 0;
          const warningLower = parseInt(String(row[warningLowerHeader || ''] || '0')) || 0;
          const warningUpper = parseInt(String(row[warningUpperHeader || ''] || '0')) || 0;
          const notes = String(row[notesHeader || ''] || '').trim();

          const itemData = {
            code,
            name,
            unit: unit || null,
            category: category || null,
            initial_stock: initialStock,
            unit_price: unitPrice,
            warning_threshold_lower: warningLower,
            warning_threshold_upper: warningUpper,
            notes: notes || null,
          };

          console.log(`📋 Row ${rowIndex + 2}:`, itemData);

          // Check if item already exists
          const { data: existingItem, error: existingError } = await supabase
            .from('inventory_items')
            .select('id')
            .eq('code', code)
            .maybeSingle();

          if (existingError) throw existingError;

          if (existingItem) {
            // Update existing
            const { error: updateError } = await supabase
              .from('inventory_items')
              .update(itemData)
              .eq('id', existingItem.id);
            if (updateError) throw updateError;
          } else {
            // Insert new
            const { error: insertError } = await supabase
              .from('inventory_items')
              .insert([itemData]);
            if (insertError) throw insertError;
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
      alert(`✅ Nhập thành công ${successCount}/${successCount + errorCount} vật tư.`);
      // Log import activity
      import('../utils/activityLogger').then(mod => mod.logActivity({
        action: 'import_items',
        entityType: 'inventory_items_bulk',
        details: { success: successCount, failed: errorCount }
      }));
    } catch (error) {
      console.error('❌ [Import Items] Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Không thể đọc file';
      alert('❌ Có lỗi xảy ra: ' + errorMsg);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGlobalQRScanSuccess = (decodedText: string) => {
    const foundItem = items.find(i => i.code.toLowerCase() === decodedText.toLowerCase());
    if (foundItem) {
      setScannedItemAction(foundItem);
    } else {
      alert(`Không tìm thấy vật tư với mã: ${decodedText}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Quản Lý Vật Tư</h1>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsGlobalQRScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
          >
            <ScanLine size={20} /> Quét mã QR
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} /> Thêm Vật Tư
          </button>
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400"
          >
            <Upload size={20} /> {importing ? 'Đang nhập...' : 'Nhập Excel'}
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={20} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.CSV,.XLSX,.XLS"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, tên hoặc danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="w-48">
          <label className="block text-xs text-gray-500 mb-1">Lọc tồn kho</label>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">Tất cả</option>
            <option value="in">Còn hàng</option>
            <option value="out">Hết hàng</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && <div className="text-center py-4 text-gray-600">Đang tải dữ liệu...</div>}

      {/* Table */}
      {/* Desktop Table & Mobile Cards */}
      {!loading && (
        <>
          <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto overflow-y-auto max-h-[calc(100vh-240px)]">
            <table className="w-full relative">
              <thead className="bg-gray-100 border-b sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mã VT</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tên Vật Tư</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vị Trí</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Đơn Vị</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Danh Mục</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Tồn Đầu Kỳ</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Nhập</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Xuất</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Tồn Hiện Tại</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Đơn Giá</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((inv) => (
                    <tr key={inv.item.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.item.code}</td>
                      <td className={`px-6 py-4 text-sm ${inv.stock <= 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>{inv.item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {inv.item.locationId ? locations.find(l => l.id === inv.item.locationId)?.code || '' : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.item.unit}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.item.category}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700 font-semibold">
                        {inv.item.initialStock}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600 font-semibold">
                        {inv.totalReceipts}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600 font-semibold">
                        {inv.totalIssues}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm text-right font-bold ${
                          inv.stock <= 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {inv.stock}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {(inv.item.unitPrice || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(inv.item);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Chỉnh sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setTraceabilityItem(inv.item);
                              setTraceabilityOpen(true);
                            }}
                            className="p-2 text-gray-700 hover:bg-gray-50 rounded"
                            title="Truy xuất"
                          >
                            <Layers size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setPrintQRItem(inv.item);
                              setPrintQROpen(true);
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="In mã QR"
                          >
                            <QrCode size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setQuickIssueItem(inv.item);
                              setQuickIssueOpen(true);
                            }}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Xuất nhanh"
                          >
                            <ZapOff size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredInventory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">Không có dữ liệu</div>
            ) : (
              filteredInventory.map((inv) => (
                <div key={inv.item.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-2">
                      <h3 className={`font-semibold text-lg ${inv.stock <= 0 ? 'text-red-600' : 'text-gray-900'}`}>{inv.item.name}</h3>
                      <p className="text-sm text-gray-500 font-mono mt-1">{inv.item.code}</p>
                    </div>
                    <div className={`flex flex-col items-end px-3 py-1.5 rounded-lg border ${inv.stock <= 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <span className="text-xs text-gray-500 mb-0.5">Tồn kho</span>
                      <span className={`text-lg font-bold ${inv.stock <= 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {inv.stock}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-md">
                    <div>
                      <span className="block text-xs text-gray-400">Vị trí</span>
                      <span className="font-medium text-gray-800">{inv.item.locationId ? locations.find(l => l.id === inv.item.locationId)?.code || '-' : '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400">Danh mục</span>
                      <span className="font-medium text-gray-800">{inv.item.category}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400">Nhập</span>
                      <span className="font-medium text-green-600">{inv.totalReceipts} {inv.item.unit}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400">Xuất</span>
                      <span className="font-medium text-red-600">{inv.totalIssues} {inv.item.unit}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between gap-1 border-t pt-3">
                    <button onClick={() => { setQuickIssueItem(inv.item); setQuickIssueOpen(true); }} className="flex-1 flex justify-center items-center gap-1 py-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-md font-medium text-sm">
                      <ZapOff size={16} /> Xuất
                    </button>
                    <button onClick={() => { setPrintQRItem(inv.item); setPrintQROpen(true); }} className="flex-1 flex justify-center items-center py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md text-sm">
                      <QrCode size={16} />
                    </button>
                    <button onClick={() => { setTraceabilityItem(inv.item); setTraceabilityOpen(true); }} className="flex-1 flex justify-center items-center py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">
                      <Layers size={16} />
                    </button>
                    <button onClick={() => { setEditingItem(inv.item); setIsModalOpen(true); }} className="flex-1 flex justify-center items-center py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md text-sm">
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <ItemModal
        isOpen={isModalOpen}
        item={editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={(savedItem) => {
          console.log('✅ [InventoryItems] Item saved, updating state:', savedItem);
          setItems(prev => {
            // If item already exists (editing), replace it
            const existing = prev.findIndex(i => i.id === savedItem.id);
            if (existing > -1) {
              const updated = [...prev];
              updated[existing] = savedItem;
              return updated;
            }
            // Otherwise add new item
            return [...prev, savedItem];
          });
        }}
      />

      <QuickIssueModal
        isOpen={quickIssueOpen}
        item={quickIssueItem}
        currentStock={
          quickIssueItem
            ? inventory.find(inv => inv.item.id === quickIssueItem.id)?.stock || 0
            : 0
        }
        onClose={() => {
          setQuickIssueOpen(false);
          setQuickIssueItem(null);
        }}
      />

      <ItemTraceabilityModal
        isOpen={traceabilityOpen}
        item={traceabilityItem}
        onClose={() => {
          setTraceabilityOpen(false);
          setTraceabilityItem(null);
        }}
      />

      <PrintQRModal
        isOpen={printQROpen}
        item={printQRItem}
        onClose={() => {
          setPrintQROpen(false);
          setPrintQRItem(null);
        }}
      />

      <QRScannerModal
        isOpen={isGlobalQRScannerOpen}
        onClose={() => setIsGlobalQRScannerOpen(false)}
        onScanSuccess={handleGlobalQRScanSuccess}
      />

      {scannedItemAction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Chọn hành động</h3>
              <button onClick={() => setScannedItemAction(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
               <p className="text-sm text-gray-600 mb-4">Bạn muốn thực hiện thao tác gì với vật tư <strong className="text-gray-900">{scannedItemAction.name}</strong>?</p>
               <button 
                 onClick={() => { 
                   setQuickIssueItem(scannedItemAction); 
                   setQuickIssueOpen(true); 
                   setScannedItemAction(null); 
                 }} 
                 className="w-full flex items-center gap-3 p-4 border border-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-50 font-medium transition-colors"
               >
                  <ArrowUpFromLine size={20} /> Xuất vật tư (Xuất nhanh)
               </button>
               <button 
                 onClick={() => { 
                   setTraceabilityItem(scannedItemAction); 
                   setTraceabilityOpen(true); 
                   setScannedItemAction(null); 
                 }} 
                 className="w-full flex items-center gap-3 p-4 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50 font-medium transition-colors"
               >
                  <FileText size={20} /> Xem chi tiết / Truy xuất
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
