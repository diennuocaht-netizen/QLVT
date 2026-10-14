import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Edit2 } from 'lucide-react';
import { findBestCostCode, DEFAULT_PURPOSE, DEFAULT_METHOD } from '../../utils/costCodeMatcher';
import { Item, InventorySlip, SlipType, RequisitionStatus, Requisition } from '../../types/inventory';
import { supabase } from '../../supabase-client';
import { useAuth } from '../../contexts/AuthContext';
import { slipToDatabase, slipFromDatabase, requisitionFromDatabase } from '../../utils/dataTransform';

interface QuickIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  currentStock: number;
}

interface CostCode {
  id: string;
  code: string;
  name: string;
  classification: string;
  subsystem: string;
  purpose: string;
  method: string;
}

export const QuickIssueModal: React.FC<QuickIssueModalProps> = ({ isOpen, onClose, item, currentStock }) => {
  const { profile } = useAuth();
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [subsystems, setSubsystems] = useState<{id: string, name: string}[]>([]);
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  const [slips, setSlips] = useState<InventorySlip[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [showCostCodeDetails, setShowCostCodeDetails] = useState(false);
  
  const [formData, setFormData] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    handler: '',
    subsystem: '',
    purpose: DEFAULT_PURPOSE,
    method: DEFAULT_METHOD,
    costCode: '',
    quantity: 1,
    notes: ''
  });

  const [slipWarning, setSlipWarning] = useState<{ status: SlipStatus; code: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  type SlipStatus = 'open' | 'closed' | 'none';

  useEffect(() => {
    const channels: any[] = [];
    const loadAndSubscribe = async () => {
      try {
        // Fetch cost codes
        const { data: costCodesData } = await supabase.from('inventory_cost_codes').select('*');
        if (costCodesData) {
          setCostCodes(costCodesData.map(doc => ({
            id: doc.id,
            code: doc.code,
            name: `${doc.code} - ${doc.purpose}`,
            classification: doc.classification,
            subsystem: doc.subsystem,
            purpose: doc.purpose,
            method: doc.method
          })));
        }

        // Fetch subsystems
        const { data: subsystemsData } = await supabase.from('inventory_subsystems').select('*');
        if (subsystemsData) setSubsystems(subsystemsData);

        // Fetch users
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) {
          setUsers(usersData.map(doc => ({
            id: doc.id,
            name: doc.display_name || doc.email || 'Unknown'
          })));
        }

        // Subscribe to slips
        const slipsChannel = supabase
          .channel(`inventory_slips_changes_${Math.random()}`)
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'inventory_slips' },
            () => {
              supabase.from('inventory_slips').select('*').then(({ data }) => {
                if (data) setSlips((data || []).map(s => slipFromDatabase(s) as InventorySlip));
              });
            }
          )
          .subscribe();
        channels.push(slipsChannel);

        // Subscribe to requisitions
        const reqsChannel = supabase
          .channel(`inventory_requisitions_changes_${Math.random()}`)
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'inventory_requisitions' },
            () => {
              supabase.from('inventory_requisitions').select('*').then(({ data }) => {
                if (data) setRequisitions((data || []).map(r => requisitionFromDatabase(r) as Requisition));
              });
            }
          )
          .subscribe();
        channels.push(reqsChannel);

        // Initial load of slips and requisitions
        const { data: slipsData } = await supabase.from('inventory_slips').select('*');
        if (slipsData) setSlips((slipsData || []).map(s => slipFromDatabase(s) as InventorySlip));

        const { data: reqsData } = await supabase.from('inventory_requisitions').select('*');
        if (reqsData) setRequisitions((reqsData || []).map(r => requisitionFromDatabase(r) as Requisition));
      } catch (error) {
        console.error('Error loading QuickIssueModal data:', error);
      }
    };

    loadAndSubscribe();

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  useEffect(() => {
    if (formData.issueDate && isOpen) {
      const { week, year } = getWeekNumber(formData.issueDate);
      const weekCode = `Tuần ${week.toString().padStart(2, '0')}-${year}`;
      
      const existingSlip = slips.find(s => 
        s.type === SlipType.Issue && 
        s.code.includes(weekCode) &&
        s.status !== 'Đã hoàn thành'
      );

      if (existingSlip) {
        if (existingSlip.status === 'Đã đóng') {
          setSlipWarning({ status: 'closed', code: existingSlip.code });
        } else {
          setSlipWarning({ status: 'open', code: existingSlip.code });
        }
      } else {
        setSlipWarning({ status: 'none', code: '' });
      }
    }
  }, [formData.issueDate, isOpen, slips]);

  // Auto-match cost code when subsystem, purpose, or method changes
  useEffect(() => {
    if (item) {
      autoMatchCostCode();
    } else {
      // Clear cost code if any required field is empty
      setFormData(prev => ({ ...prev, costCode: '' }));
    }
  }, [formData.subsystem, formData.purpose, formData.method, item?.id, costCodes.length]);

  const getWeekNumber = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { week: weekNo, year: d.getFullYear() };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { 
        ...prev, 
        [name]: name === 'quantity' ? Number(value) : value 
      };

      if (name === 'subsystem' && value) {
        if (!updated.purpose) updated.purpose = DEFAULT_PURPOSE;
        if (!updated.method) updated.method = DEFAULT_METHOD;
        const matched = findBestCostCode(
          value,
          updated.purpose,
          updated.method,
          item?.classification,
          costCodes
        );
        if (matched) updated.costCode = matched;
      }

      if (name === 'costCode' && value) {
        const selectedCc = costCodes.find(cc => cc.code === value);
        if (selectedCc) {
          if (selectedCc.subsystem) updated.subsystem = selectedCc.subsystem;
          if (selectedCc.purpose) updated.purpose = selectedCc.purpose;
          if (selectedCc.method) updated.method = selectedCc.method;
        }
      }

      return updated;
    });
  };

  const autoMatchCostCode = () => {
    if (!item || !formData.subsystem) return;
    const matched = findBestCostCode(
      formData.subsystem,
      formData.purpose || DEFAULT_PURPOSE,
      formData.method || DEFAULT_METHOD,
      item.classification,
      costCodes
    );
    if (matched) {
      setFormData(prev => (prev.costCode === matched ? prev : { ...prev, costCode: matched }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const handlerName = profile?.display_name || 'Unknown';

    if (!item || !handlerName || !formData.subsystem || !formData.purpose || !formData.method || formData.quantity <= 0) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    if (formData.quantity > currentStock) {
      alert(`Số lượng xuất không được vượt quá tồn kho (${currentStock}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { week, year } = getWeekNumber(formData.issueDate);
      const weekCode = `Tuần ${week.toString().padStart(2, '0')}-${year}`;

      let existingSlip = slips.find(s => 
        s.type === SlipType.Issue && 
        s.code.startsWith(weekCode)
      );

      if (!existingSlip) {
        // Create new issue slip
        const newSlipCode = `${weekCode}-01`;
        const baseCode = weekCode;
        const existingSlipsForWeek = slips.filter(s => s.type === SlipType.Issue && s.code.startsWith(baseCode));
        let maxSuffix = 0;
        existingSlipsForWeek.forEach(s => {
          const match = s.code.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxSuffix) maxSuffix = num;
          }
        });

        const newSlipData = {
          code: maxSuffix > 0 ? `${weekCode}-${(maxSuffix + 1).toString().padStart(2, '0')}` : newSlipCode,
          type: SlipType.Issue,
          date: formData.issueDate,
          createdBy: profile?.display_name || 'Unknown',
          reason: '',
          status: 'Đang mở',
          items: [{
            itemId: item.id,
            itemCode: item.code,
            itemName: item.name,
            unit: item.unit,
            unitPrice: item.unitPrice,
            quantity: formData.quantity,
            issueDate: formData.issueDate,
            handler: handlerName,
            subsystem: formData.subsystem,
            purpose: formData.purpose,
            method: formData.method,
            costCode: formData.costCode,
            notes: formData.notes
          }],
          weekOfYear: weekCode
        };

        const dbData = slipToDatabase(newSlipData);
        const { data: newSlip, error: insertError } = await supabase.from('inventory_slips').insert([dbData]).select();
        if (insertError) throw insertError;

        if (newSlip && newSlip.length > 0) {
          existingSlip = newSlip[0] as InventorySlip;
        }
      } else {
        // Add to existing slip
        const newItems = [
          ...existingSlip.items,
          {
            itemId: item.id,
            itemCode: item.code,
            itemName: item.name,
            unit: item.unit,
            unitPrice: item.unitPrice,
            quantity: formData.quantity,
            issueDate: formData.issueDate,
            handler: handlerName,
            subsystem: formData.subsystem,
            purpose: formData.purpose,
            method: formData.method,
            costCode: formData.costCode,
            notes: formData.notes
          }
        ];

        const updateData = { 
          items: newItems,
          status: 'Đang mở' // Luôn mở lại phiếu nếu có thêm vật tư mới
        };
        const dbUpdateData = slipToDatabase(updateData);
        const { error: updateError } = await supabase.from('inventory_slips').update(dbUpdateData).eq('id', existingSlip.id);
        if (updateError) throw updateError;
      }

      // Apply immediate inventory decrement for issue (user expects immediate effect)
      try {
        const qtyToDeduct = formData.quantity;
        const { data: currentRow, error: selectErr } = await supabase
          .from('inventory_items')
          .select('quantity')
          .eq('id', item.id)
          .maybeSingle();

        if (selectErr) {
          console.warn('Could not read current quantity for item', item.id, selectErr);
        } else {
          const currentQty = (currentRow && typeof currentRow.quantity === 'number') ? currentRow.quantity : 0;
          const newQty = Math.max(0, currentQty - qtyToDeduct);

          const { error: updateQtyErr } = await supabase
            .from('inventory_items')
            .update({ quantity: newQty })
            .eq('id', item.id);

          if (updateQtyErr) {
            console.error('Error updating inventory quantity:', updateQtyErr);
            // don't throw — we still want the slip to be created, but inform user
            alert('Phiếu đã lưu nhưng không thể cập nhật tồn kho. Vui lòng kiểm tra quyền RLS.');
          } else {
            // verify
            const { data: verify, error: verifyErr } = await supabase
              .from('inventory_items')
              .select('quantity')
              .eq('id', item.id)
              .maybeSingle();
            if (!verifyErr) {
              console.log(`Verified - Item ${item.code} now has quantity: ${verify?.quantity}`);
            }
          }
        }
      } catch (invErr) {
        console.error('Inventory apply error (quick issue):', invErr);
      }

      // Notify other components to refresh data (help when realtime subscriptions close)
      try {
        window.dispatchEvent(new CustomEvent('inventory:refresh'));
      } catch (e) {
        console.warn('Could not dispatch inventory:refresh event', e);
      }

      alert(`Đã thêm vật tư vào phiếu xuất ${existingSlip!.code}`);
      try {
        import('../../utils/activityLogger').then(m => m.logActivity({
          action: 'quick_issue',
          entityType: 'inventory_slip',
          entityId: existingSlip!.id,
          details: { itemId: item.id, quantity: formData.quantity }
        }));
      } catch (e) {
        console.warn('activity log failed', e);
      }
      onClose();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu phiếu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  const uniquePurposes = Array.from(new Set([DEFAULT_PURPOSE, ...costCodes.map(c => c.purpose).filter(Boolean)]));
  const combinedSubsystems = Array.from(new Set([...subsystems.map(s => s.name), ...costCodes.map(c => c.subsystem)].filter(Boolean)));
  const uniqueMethods = Array.from(new Set([DEFAULT_METHOD, ...costCodes.map(c => c.method).filter(Boolean)]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Xuất nhanh vật tư</h2>
            <p className={currentStock <= 0 ? 'text-sm text-red-600 mt-1' : 'text-sm text-gray-600 mt-1'}>{item.code} - {item.name} (Tồn kho: {currentStock})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {slipWarning?.status === 'closed' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-medium text-red-800">⚠ Cảnh báo: Phiếu xuất đã đóng</p>
                <p className="text-sm text-red-700">Phiếu xuất của tuần này ({slipWarning.code}) đã ở trạng thái đã đóng. Không thể thêm vật tư vào phiếu này.</p>
              </div>
            </div>
          )}

          <form id="quick-issue-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày xuất *</label>
                <input
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng xuất *</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  max={currentStock}
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Người xuất *</label>
                <input
                  type="text"
                  name="handler"
                  value={profile?.display_name || ''}
                  disabled={true}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hệ thống *</label>
                <select
                  name="subsystem"
                  value={formData.subsystem}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                >
                  <option value="">-- Chọn hệ thống --</option>
                  {subsystems.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {showCostCodeDetails && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mục đích *</label>
                    <select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      required
                    >
                      <option value="">-- Chọn mục đích --</option>
                      {uniquePurposes.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức *</label>
                    <select
                      name="method"
                      value={formData.method}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      required
                    >
                      <option value="">-- Chọn phương thức --</option>
                      {uniqueMethods.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="col-span-1 sm:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Mã chi phí</label>
                  <button
                    type="button"
                    onClick={() => setShowCostCodeDetails(!showCostCodeDetails)}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    <Edit2 size={13} />
                    <span>{showCostCodeDetails ? 'Ẩn chi tiết' : 'Sửa mã chi phí (chọn Mục đích & Phương thức)'}</span>
                  </button>
                </div>
                <select
                  name="costCode"
                  value={formData.costCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-gray-800"
                >
                  <option value="">-- Chọn mã chi phí --</option>
                  {costCodes.map(cc => (
                    <option key={cc.id} value={cc.code}>{cc.code} - {cc.classification || cc.purpose}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hệ thống tự động điền theo Hệ thống, Mục đích ("Sửa chữa") và Phương thức ("Tự thực hiện").</p>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Ghi chú thêm cho phiếu xuất..."
                />
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors bg-white"
            disabled={isSubmitting || slipWarning?.status === 'closed'}
          >
            Hủy
          </button>
          <button
            type="submit"
            form="quick-issue-form"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            disabled={isSubmitting || slipWarning?.status === 'closed'}
          >
            {isSubmitting ? 'Đang lưu...' : 'Xuất vật tư'}
          </button>
        </div>
      </div>
    </div>
  );
};
