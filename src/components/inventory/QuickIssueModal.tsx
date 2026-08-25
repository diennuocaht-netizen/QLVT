import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
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
  
  const [formData, setFormData] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    handler: '',
    subsystem: '',
    purpose: '',
    method: '',
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
    if (item && formData.subsystem && formData.purpose && formData.method) {
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const autoMatchCostCode = () => {
    if (!item || !formData.subsystem || !formData.purpose || !formData.method) return;

    if (costCodes.length === 0) {
      console.warn('No cost codes available for matching');
      return;
    }

    let bestMatch: CostCode | null = null;
    let maxScore = -1;

    const normalize = (str?: string) => (str || '').trim().toLowerCase();

    console.log('Auto-matching cost code:', {
      item: item.name,
      classification: item.classification,
      subsystem: formData.subsystem,
      purpose: formData.purpose,
      method: formData.method,
      availableCostCodes: costCodes.length
    });

    // Strategy 1: Try to match classification + subsystem + purpose + method
    costCodes.forEach(cc => {
      const ccClass = normalize(cc.classification);
      const itemClass = normalize(item.classification);
      const matchClass = !ccClass || ccClass === itemClass || itemClass.includes(ccClass) || ccClass.includes(itemClass);

      const ccSub = normalize(cc.subsystem);
      const formSub = normalize(formData.subsystem);
      const matchSub = !ccSub || ccSub === formSub || formSub.includes(ccSub) || ccSub.includes(formSub);

      const ccPurp = normalize(cc.purpose);
      const formPurp = normalize(formData.purpose);
      const matchPurp = !ccPurp || ccPurp === formPurp || formPurp.includes(ccPurp) || ccPurp.includes(formPurp);

      const ccMeth = normalize(cc.method);
      const formMeth = normalize(formData.method);
      const matchMeth = !ccMeth || ccMeth === formMeth || formMeth.includes(ccMeth) || ccMeth.includes(formMeth);

      if (matchClass && matchSub && matchPurp && matchMeth) {
        let score = 0;
        if (ccClass && matchClass) score += 2;
        if (ccSub && matchSub) score += 2;
        if (ccPurp && matchPurp) score += 2;
        if (ccMeth && matchMeth) score += 2;

        if (score > maxScore) {
          maxScore = score;
          bestMatch = cc;
        }
      }
    });

    // Strategy 2: Try to match subsystem + purpose + method (ignore classification)
    if (!bestMatch) {
      costCodes.forEach(cc => {
        const ccSub = normalize(cc.subsystem);
        const formSub = normalize(formData.subsystem);
        const matchSub = !ccSub || ccSub === formSub || formSub.includes(ccSub) || ccSub.includes(formSub);

        const ccPurp = normalize(cc.purpose);
        const formPurp = normalize(formData.purpose);
        const matchPurp = !ccPurp || ccPurp === formPurp || formPurp.includes(ccPurp) || ccPurp.includes(formPurp);

        const ccMeth = normalize(cc.method);
        const formMeth = normalize(formData.method);
        const matchMeth = !ccMeth || ccMeth === formMeth || formMeth.includes(ccMeth) || ccMeth.includes(formMeth);

        if (matchSub && matchPurp && matchMeth) {
          let score = 0;
          if (ccSub && matchSub) score += 2;
          if (ccPurp && matchPurp) score += 2;
          if (ccMeth && matchMeth) score += 2;

          if (score > maxScore) {
            maxScore = score;
            bestMatch = cc;
          }
        }
      });
    }

    // Strategy 3: Match any 2 of 3 (subsystem + purpose, subsystem + method, purpose + method)
    if (!bestMatch) {
      costCodes.forEach(cc => {
        const ccSub = normalize(cc.subsystem);
        const formSub = normalize(formData.subsystem);
        const matchSub = !ccSub || ccSub === formSub || formSub.includes(ccSub) || ccSub.includes(formSub);

        const ccPurp = normalize(cc.purpose);
        const formPurp = normalize(formData.purpose);
        const matchPurp = !ccPurp || ccPurp === formPurp || formPurp.includes(ccPurp) || ccPurp.includes(formPurp);

        const ccMeth = normalize(cc.method);
        const formMeth = normalize(formData.method);
        const matchMeth = !ccMeth || ccMeth === formMeth || formMeth.includes(ccMeth) || ccMeth.includes(formMeth);

        const matchCount = (matchSub ? 1 : 0) + (matchPurp ? 1 : 0) + (matchMeth ? 1 : 0);
        
        if (matchCount >= 2) {
          let score = 0;
          if (ccSub && matchSub) score += 1;
          if (ccPurp && matchPurp) score += 1;
          if (ccMeth && matchMeth) score += 1;

          if (score > maxScore) {
            maxScore = score;
            bestMatch = cc;
          }
        }
      });
    }

    // Strategy 4: Match first available cost code (last resort)
    if (!bestMatch && costCodes.length > 0) {
      bestMatch = costCodes[0];
      console.warn('Using fallback: first available cost code');
    }

    if (bestMatch) {
      console.log('Cost code match found:', bestMatch.code);
      setFormData(prev => {
        if (prev.costCode !== bestMatch!.code) {
          return { ...prev, costCode: bestMatch!.code };
        }
        return prev;
      });
    } else {
      console.warn('No cost code match found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item || !formData.handler || !formData.subsystem || !formData.purpose || !formData.method || formData.quantity <= 0) {
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
        s.code.includes(weekCode) &&
        s.status !== 'Đã hoàn thành'
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
            quantity: formData.quantity,
            issueDate: formData.issueDate,
            handler: formData.handler,
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
            quantity: formData.quantity,
            issueDate: formData.issueDate,
            handler: formData.handler,
            subsystem: formData.subsystem,
            purpose: formData.purpose,
            method: formData.method,
            costCode: formData.costCode,
            notes: formData.notes
          }
        ];

        const updateData = { items: newItems };
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

  const uniquePurposes = Array.from(new Set(costCodes.map(c => c.purpose).filter(Boolean)));
  const uniqueMethods = Array.from(new Set(costCodes.map(c => c.method).filter(Boolean)));

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
            <div className="grid grid-cols-2 gap-6">
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
                <select
                  name="handler"
                  value={formData.handler}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                >
                  <option value="">-- Chọn người xuất --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
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

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã chi phí (tự động)</label>
                <input
                  type="text"
                  name="costCode"
                  value={formData.costCode}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-not-allowed text-gray-700 font-medium"
                  placeholder="Sẽ tự động điền khi chọn hệ thống, mục đích và phương thức"
                />
                <p className="text-xs text-gray-500 mt-1">Trường này sẽ tự động điền dựa vào hệ thống, mục đích và phương thức</p>
              </div>

              <div className="col-span-2">
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
