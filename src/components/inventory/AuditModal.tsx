import React, { useState, useEffect } from 'react';
import { X, Save, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabase-client';
import { useAuth } from '../../contexts/AuthContext';
import { Item, InventorySlip, SlipType } from '../../types/inventory';
import { itemFromDatabase, slipFromDatabase } from '../../utils/dataTransform';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AuditItemLine {
  item: Partial<Item>;
  systemStock: number;
  actualStock: number | '';
  difference: number;
  notes: string;
  isNotFound?: boolean;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [auditLines, setAuditLines] = useState<AuditItemLine[]>([]);
  const [notes, setNotes] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const { data: itemsData, error: itemsError } = await supabase.from('inventory_items').select('*');
        if (itemsError) throw itemsError;
        
        const { data: slipsData, error: slipsError } = await supabase.from('inventory_slips').select('*');
        if (slipsError) throw slipsError;

        const items = (itemsData || []).map(item => itemFromDatabase(item)) as Item[];
        const slips = (slipsData || []).map(slip => slipFromDatabase(slip)) as InventorySlip[];

        // Calculate system stock
        const lines: AuditItemLine[] = items.map(item => {
          let totalReceipts = 0;
          let totalIssues = 0;

          slips.forEach(slip => {
            const items_array = Array.isArray(slip.items) ? slip.items : [];
            const matchingItems = items_array.filter((i: any) => {
              const idKey = i.itemId ?? i.item_id ?? i.itemId;
              return idKey === item.id;
            });
            if (matchingItems.length === 0) return;

            const sumQty = matchingItems.reduce((s: number, it: any) => s + (it.quantity || 0), 0);

            if (slip.type === SlipType.Receipt && (slip.status === 'Đã đóng' || slip.status === 'Đã hoàn thành')) {
              totalReceipts += sumQty;
            } else if (slip.type === SlipType.Issue) {
              totalIssues += sumQty;
            }
          });

          const stock = (item.initialStock || 0) + totalReceipts - totalIssues;

          return {
            item,
            systemStock: stock,
            actualStock: stock, // Default to system stock
            difference: 0,
            notes: ''
          };
        });

        setAuditLines(lines);
      } catch (err) {
        console.error('Error calculating stock for audit:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  const handleActualStockChange = (index: number, value: string) => {
    const newLines = [...auditLines];
    const actual = value === '' ? '' : parseInt(value, 10);
    newLines[index].actualStock = actual;
    
    if (typeof actual === 'number') {
      newLines[index].difference = actual - newLines[index].systemStock;
    } else {
      newLines[index].difference = 0;
    }
    
    setAuditLines(newLines);
  };

  const handleNotesChange = (index: number, value: string) => {
    const newLines = [...auditLines];
    newLines[index].notes = value;
    setAuditLines(newLines);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('File Excel trống!');
          return;
        }

        const newLines = [...auditLines];
        let matchedCount = 0;
        let notFoundCount = 0;

        data.forEach((row: any) => {
          // Flexible key matching
          const code = row['Mã VT'] || row['Mã vật tư'] || row['Mã Vật Tư'] || row['code'] || row['Code'];
          const actualText = row['Tồn thực tế'] || row['Tồn Thực Tế'] || row['Tồn kho'] || row['actualStock'] || row['Actual Stock'];
          const name = row['Tên VT'] || row['Tên vật tư'] || row['Tên Vật Tư'] || row['name'] || row['Name'];

          if (!code) return; // Skip rows without code

          const actual = actualText !== undefined && actualText !== '' ? Number(actualText) : '';
          
          const existingIndex = newLines.findIndex(line => 
            line.item.code?.toString().toLowerCase() === code.toString().toLowerCase()
          );

          if (existingIndex >= 0) {
            // Update existing
            newLines[existingIndex].actualStock = actual;
            if (typeof actual === 'number') {
              newLines[existingIndex].difference = actual - newLines[existingIndex].systemStock;
            } else {
              newLines[existingIndex].difference = 0;
            }
            matchedCount++;
          } else {
            // Not found in system
            newLines.push({
              item: { id: '', code: code.toString(), name: name || 'Không xác định' },
              systemStock: 0,
              actualStock: actual,
              difference: typeof actual === 'number' ? actual : 0,
              notes: 'Không tồn tại trên app',
              isNotFound: true
            });
            notFoundCount++;
          }
        });

        setAuditLines(newLines);
        alert(`✅ Đã nhập xong!\n- Khớp: ${matchedCount} vật tư\n- Không tồn tại trên app: ${notFoundCount} vật tư`);
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
    try {
      setSaving(true);
      const code = `KK-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      const { data: audit, error: auditError } = await supabase
        .from('inventory_audits')
        .insert({
          code,
          date: new Date().toISOString().split('T')[0],
          created_by: profile?.displayName || profile?.email || 'Unknown',
          status: 'Hoàn thành',
          notes: notes
        })
        .select()
        .single();

      if (auditError) throw auditError;

      // Only save items that exist in the system
      const validLines = auditLines.filter(line => !line.isNotFound && line.item.id);
      
      const auditItemsToInsert = validLines.map(line => ({
        audit_id: audit.id,
        item_id: line.item.id,
        system_stock: line.systemStock,
        actual_stock: line.actualStock === '' ? 0 : line.actualStock,
        difference: line.difference,
        notes: line.notes
      }));

      const { error: itemsError } = await supabase
        .from('inventory_audit_items')
        .insert(auditItemsToInsert);

      if (itemsError) throw itemsError;

      const notFoundItems = auditLines.filter(line => line.isNotFound);
      if (notFoundItems.length > 0) {
        alert(`✅ Lưu phiếu kiểm kê thành công!\n⚠️ Đã bỏ qua ${notFoundItems.length} vật tư không tồn tại trên app.`);
      } else {
        alert('✅ Lưu phiếu kiểm kê thành công!');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving audit:', error);
      alert('❌ Có lỗi xảy ra khi lưu phiếu kiểm kê');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Tạo Phiếu Kiểm Kê Mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú đợt kiểm kê</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Kiểm kê định kỳ tháng 10..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="w-48 flex items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Upload size={18} />
                Nhập từ Excel
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">Đang tải dữ liệu tồn kho hệ thống...</div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã VT</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên Vật Tư</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Tồn Hệ Thống</th>
                    <th className="px-4 py-3 text-center font-semibold text-indigo-700 w-32">Tồn Thực Tế</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Chênh Lệch</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLines.map((line, index) => (
                    <tr key={line.item.id || index} className={`border-b hover:bg-gray-50 ${line.isNotFound ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{line.item.code}</td>
                      <td className={`px-4 py-3 ${line.isNotFound ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                        {line.item.name}
                        {line.isNotFound && <span className="block text-xs text-red-500">Chưa tạo mã</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 font-medium">
                        {line.isNotFound ? '-' : line.systemStock}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="w-full text-center px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                          value={line.actualStock}
                          onChange={(e) => handleActualStockChange(index, e.target.value)}
                        />
                      </td>
                      <td className={`px-4 py-3 text-center font-bold ${
                        line.difference > 0 ? 'text-green-600' : line.difference < 0 ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {line.difference > 0 ? `+${line.difference}` : line.difference}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          className={`w-full px-2 py-1 border rounded ${line.isNotFound ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200'}`}
                          placeholder="Lý do chênh lệch..."
                          value={line.notes}
                          onChange={(e) => handleNotesChange(index, e.target.value)}
                          readOnly={line.isNotFound}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 bg-white"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Lưu Phiếu Kiểm Kê'}
          </button>
        </div>
      </div>
    </div>
  );
};
