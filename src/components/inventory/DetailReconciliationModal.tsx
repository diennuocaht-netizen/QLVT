import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, FileText, CheckCircle, Scale, Download } from 'lucide-react';
import { supabase } from '../../supabase-client';
import { InventoryReconciliation, InventoryReconciliationItem, Item } from '../../types/inventory';
import { itemFromDatabase } from '../../utils/dataTransform';
import * as XLSX from 'xlsx';

interface DetailReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reconId: string;
  onSuccess: () => void;
}

export const DetailReconciliationModal: React.FC<DetailReconciliationModalProps> = ({ isOpen, onClose, reconId, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recon, setRecon] = useState<InventoryReconciliation | null>(null);
  const [reconLines, setReconLines] = useState<InventoryReconciliationItem[]>([]);
  
  useEffect(() => {
    if (isOpen && reconId) {
      loadData();
    }
  }, [isOpen, reconId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: reconData, error: reconError } = await supabase
        .from('inventory_reconciliations')
        .select('*')
        .eq('id', reconId)
        .single();
        
      if (reconError) throw reconError;
      setRecon(reconData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('inventory_reconciliation_items')
        .select('*, inventory_items(*)')
        .eq('reconciliation_id', reconId);
        
      if (itemsError) throw itemsError;
      
      const mappedLines = itemsData.map((d: any) => ({
        id: d.id,
        reconciliation_id: d.reconciliation_id,
        item_id: d.item_id,
        bravo_receipts: Number(d.bravo_receipts),
        app_receipts: Number(d.app_receipts),
        bravo_issues: Number(d.bravo_issues),
        app_completed_issues: Number(d.app_completed_issues),
        app_wip_issues: Number(d.app_wip_issues),
        bravo_stock: Number(d.bravo_stock),
        app_stock: Number(d.app_stock),
        physical_stock: d.physical_stock !== null ? Number(d.physical_stock) : '',
        notes: d.notes || '',
        item: d.inventory_items ? itemFromDatabase(d.inventory_items) : undefined
      }));
      
      setReconLines(mappedLines);
    } catch (err) {
      console.error('Error loading detail:', err);
      alert('Không thể tải chi tiết đối soát');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!recon) return;
    try {
      setSaving(true);
      
      // Update items physical stock
      for (const line of reconLines) {
        await supabase
          .from('inventory_reconciliation_items')
          .update({
            physical_stock: line.physical_stock === '' ? null : line.physical_stock,
            notes: line.notes
          })
          .eq('id', line.id);
      }
      
      // Update status if they click "Chốt"
      alert('Đã cập nhật số liệu thực tế thành công!');
      onSuccess();
    } catch (err) {
      console.error('Error updating recon:', err);
      alert('Lỗi cập nhật số liệu!');
    } finally {
      setSaving(false);
    }
  };
  
  const handleFinalize = async () => {
    if (!window.confirm('Chốt phiếu sẽ không thể chỉnh sửa số liệu tồn thực tế nữa. Bạn có chắc chắn?')) return;
    try {
      setSaving(true);
      // first save items
      for (const line of reconLines) {
        await supabase
          .from('inventory_reconciliation_items')
          .update({
            physical_stock: line.physical_stock === '' ? null : line.physical_stock,
            notes: line.notes
          })
          .eq('id', line.id);
      }
      // update status
      const { error } = await supabase
        .from('inventory_reconciliations')
        .update({ status: 'Đã chốt' })
        .eq('id', reconId);
      if (error) throw error;
      
      alert('Đã chốt kỳ đối soát!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Lỗi chốt phiếu!');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (reconLines.length === 0 || !recon) return;
    const exportData = reconLines.map(l => {
      const lechNhap = l.bravo_receipts - l.app_receipts;
      const lechXuat = l.bravo_issues - l.app_completed_issues;
      const lechTon = l.physical_stock !== '' ? Number(l.physical_stock) - l.bravo_stock : 0;
      
      return {
        'Mã VT': l.item?.code,
        'Tên VT': l.item?.name,
        'Nhập Bravo': l.bravo_receipts,
        'Nhập App': l.app_receipts,
        'Lệch Nhập': lechNhap,
        'Xuất Bravo': l.bravo_issues,
        'Xuất App Đã Xong': l.app_completed_issues,
        'Xuất App Chưa Xong': l.app_wip_issues,
        'Lệch Xuất': lechXuat,
        'Tồn Bravo': l.bravo_stock,
        'Tồn App': l.app_stock,
        'Tồn Thực Tế': l.physical_stock !== '' ? l.physical_stock : 'Chưa nhập',
        'Lệch Tồn TT vs Bravo': lechTon
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doi Soat");
    XLSX.writeFile(wb, `DoiSoat_${recon.code}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <Scale size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Chi tiết đối soát: {recon?.code}</h2>
              {recon && (
                <p className="text-sm text-gray-500">
                  Kỳ đối soát: {new Date(recon.start_date).toLocaleDateString('vi-VN')} - {new Date(recon.end_date).toLocaleDateString('vi-VN')} 
                  <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${recon.status === 'Đã chốt' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {recon.status}
                  </span>
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <strong>Ghi chú:</strong> {recon?.notes || 'Không có ghi chú'}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
          >
            <Download size={16} />
            Xuất Excel
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-white">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                    const isClosed = recon?.status === 'Đã chốt';
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 border-r border-gray-200">
                          <div className="font-medium text-gray-900">{line.item?.code}</div>
                          <div className="text-xs text-gray-500 max-w-[200px] truncate" title={line.item?.name}>{line.item?.name}</div>
                        </td>
                        
                        {/* Nhập */}
                        <td className="p-3 border-r border-gray-200 text-center text-blue-900">{line.bravo_receipts}</td>
                        <td className="p-3 border-r border-gray-200 text-center">{line.app_receipts}</td>
                        <td className={`p-3 border-r border-gray-200 text-center font-medium ${lechNhap !== 0 ? 'text-red-600 bg-red-50' : 'text-gray-400'}`}>
                          {lechNhap !== 0 ? (lechNhap > 0 ? `+${lechNhap}` : lechNhap) : '-'}
                        </td>
                        
                        {/* Xuất */}
                        <td className="p-3 border-r border-gray-200 text-center text-orange-900">{line.bravo_issues}</td>
                        <td className="p-3 border-r border-gray-200 text-center">{line.app_completed_issues}</td>
                        <td className="p-3 border-r border-gray-200 text-center text-yellow-600 font-medium">
                          {line.app_wip_issues > 0 ? line.app_wip_issues : '-'}
                        </td>
                        <td className={`p-3 border-r border-gray-200 text-center font-medium ${lechXuat !== 0 ? 'text-red-600 bg-red-50' : 'text-gray-400'}`}>
                          {lechXuat !== 0 ? (lechXuat > 0 ? `+${lechXuat}` : lechXuat) : '-'}
                        </td>
                        
                        {/* Tồn */}
                        <td className="p-3 border-r border-gray-200 text-center font-bold text-indigo-700 bg-indigo-50/30">{line.bravo_stock}</td>
                        <td className="p-3 border-r border-gray-200 text-center">{line.app_stock}</td>
                        <td className="p-2 text-center bg-gray-50">
                          <input
                            type="number"
                            min="0"
                            value={line.physical_stock}
                            disabled={isClosed}
                            onChange={(e) => {
                              const newLines = [...reconLines];
                              newLines[idx].physical_stock = e.target.value === '' ? '' : Number(e.target.value);
                              setReconLines(newLines);
                            }}
                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
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

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {recon?.status === 'Nháp' && 'Nhập số lượng đếm tay vào cột Tồn Thực Tế.'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Đóng
            </button>
            {recon?.status === 'Nháp' && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  Lưu tạm
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <CheckCircle size={18} />
                  Chốt phiếu
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
