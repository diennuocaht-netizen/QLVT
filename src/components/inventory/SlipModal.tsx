import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { InventorySlip, SlipType, InventorySlipItem, Item, Requisition, RequisitionStatus, RequisitionItemStatus } from '../../types/inventory';
import { supabase } from '../../supabase-client';
import { useAuth } from '../../contexts/AuthContext';
import { slipToDatabase, requisitionToDatabase, itemFromDatabase, requisitionFromDatabase, slipFromDatabase } from '../../utils/dataTransform';
import { SelectRequisitionItemsModal } from './SelectRequisitionItemsModal';
import { QRScannerModal } from './QRScannerModal';
import { QrCode } from 'lucide-react';

interface SlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip?: InventorySlip | null;
  type: SlipType;
}

export const SlipModal: React.FC<SlipModalProps> = ({ isOpen, onClose, slip, type }) => {
  const { profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [subsystems, setSubsystems] = useState<{id: string, name: string}[]>([]);
  const [costCodes, setCostCodes] = useState<{id: string, code: string, name: string, classification: string, subsystem: string, purpose: string, method: string}[]>([]);
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [slips, setSlips] = useState<InventorySlip[]>([]);
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string>('');
  const [isSelectItemsModalOpen, setIsSelectItemsModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<InventorySlip>>({
    code: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'Đang mở',
    items: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch all required data for the form
    const loadData = async () => {
      try {
        // Fetch items
        const { data: itemsData } = await supabase
          .from('inventory_items')
          .select('*');
        if (itemsData) setItems(itemsData.map(item => itemFromDatabase(item)) as Item[]);

        // Fetch subsystems
        const { data: subsystemsData } = await supabase
          .from('inventory_subsystems')
          .select('*');
        if (subsystemsData) setSubsystems(subsystemsData);

        // Fetch cost codes
        const { data: costCodesData } = await supabase
          .from('inventory_cost_codes')
          .select('*');
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

        // Fetch users
        const { data: usersData } = await supabase
          .from('users')
          .select('*');
        if (usersData) {
          setUsers(usersData.map(doc => ({
            id: doc.id,
            name: doc.display_name || doc.email || 'Unknown'
          })));
        }

        // Fetch requisitions
        const { data: reqData } = await supabase
          .from('inventory_requisitions')
          .select('*');
        if (reqData) setRequisitions(reqData.map(req => requisitionFromDatabase(req)) as Requisition[]);

        // Fetch slips
        const { data: slipsData } = await supabase
          .from('inventory_slips')
          .select('*');
        if (slipsData) setSlips(slipsData.map(slip => slipFromDatabase(slip)) as InventorySlip[]);
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };

    loadData();

    // Subscribe to real-time changes
    const itemsChannel = supabase
      .channel(`inventory_items_changes_${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems(prev => [...prev, itemFromDatabase(payload.new) as Item]);
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(item => item.id === payload.new.id ? (itemFromDatabase(payload.new) as Item) : item));
        } else if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    // Subscribe to requisitions changes
    const reqChannel = supabase
      .channel(`inventory_requisitions_changes_${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_requisitions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRequisitions(prev => [...prev, requisitionFromDatabase(payload.new) as Requisition]);
        } else if (payload.eventType === 'UPDATE') {
          setRequisitions(prev => prev.map(req => req.id === payload.new.id ? (requisitionFromDatabase(payload.new) as Requisition) : req));
        } else if (payload.eventType === 'DELETE') {
          setRequisitions(prev => prev.filter(req => req.id !== payload.old.id));
        }
      })
      .subscribe();

    // Subscribe to slips changes
    const slipsChannel = supabase
      .channel(`inventory_slips_changes_${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_slips' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSlips(prev => [...prev, slipFromDatabase(payload.new) as InventorySlip]);
        } else if (payload.eventType === 'UPDATE') {
          setSlips(prev => prev.map(slip => slip.id === payload.new.id ? (slipFromDatabase(payload.new) as InventorySlip) : slip));
        } else if (payload.eventType === 'DELETE') {
          setSlips(prev => prev.filter(slip => slip.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(reqChannel);
      supabase.removeChannel(slipsChannel);
    };
  }, []);

  // Compute available stock for an item based on initialStock + closed receipts - all issues
  const getAvailableQty = (itemId?: string) => {
    if (!itemId) return 0;
    const dbItem = items.find(i => i.id === itemId);
    const initial = dbItem?.initialStock || 0;

    let totalReceipts = 0;
    let totalIssues = 0;

    slips.forEach(s => {
      const items_array = Array.isArray(s.items) ? s.items : [];
      const matching = items_array.filter((it: any) => {
        const idKey = it.itemId ?? it.item_id ?? it.itemId;
        return idKey === itemId;
      });
      if (matching.length === 0) return;
      const sumQty = matching.reduce((sumi: number, it: any) => sumi + (it.quantity || 0), 0);

      if (s.type === SlipType.Receipt) {
        if (s.status === 'Đã đóng' || s.status === 'Đã hoàn thành') totalReceipts += sumQty;
      } else if (s.type === SlipType.Issue) {
        totalIssues += sumQty;
      }
    });

    return initial + totalReceipts - totalIssues;
  };

  useEffect(() => {
    if (slip) {
      setFormData(slip);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        code: '',
        date: today,
        reason: '',
        status: 'Đang mở',
        items: [],
        type: type,
        createdBy: profile?.display_name || '',
        receiptType: type === SlipType.Receipt ? 'Theo tờ trình' : undefined,
      });
    }
  }, [slip, isOpen, type, profile]);

  const getWeekNumber = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { week: weekNo, year: d.getFullYear() };
  };

  const generateIssueCode = async (dateStr: string): Promise<string> => {
    const { week, year } = getWeekNumber(dateStr);
    const weekStr = week.toString().padStart(2, '0');
    const baseCode = `Tuần ${weekStr}-${year}`;
    
    // Get all slips with this week code to find the sequence number
    const { data: matchingSlips } = await supabase
      .from('inventory_slips')
      .select('*')
      .eq('type', SlipType.Issue)
      .eq('weekOfYear', baseCode);
    
    const sequenceNum = (matchingSlips?.length || 0) + 1;
    return `${baseCode}-${sequenceNum.toString().padStart(2, '0')}`;
  };

  const generateReceiptCode = async (dateStr: string): Promise<string> => {
    const date = new Date(dateStr);
    const dateStr2 = date.toISOString().split('T')[0].replace(/-/g, '');
    const baseCode = `PN_${dateStr2}`;
    
    // Get all receipts with this date to find the sequence number
    const { data: matchingSlips } = await supabase
      .from('inventory_slips')
      .select('*')
      .eq('type', SlipType.Receipt)
      .eq('date', dateStr);
    
    const sequenceNum = (matchingSlips?.length || 0) + 1;
    return `${baseCode}_${sequenceNum.toString().padStart(3, '0')}`;
  };

  const isFormDisabled = (): boolean => {
    // Allow edit if slip is still open
    if (!slip || slip.status === 'Đang mở') return false;
    
    // For closed/completed slips, only allow admin and manager to edit
    return profile?.role !== 'admin' && profile?.role !== 'manager';
  };

  useEffect(() => {
    if (!slip && formData.date && isOpen) {
      if (type === SlipType.Receipt) {
        // Auto-generate Receipt code: PN_YYYYMMDD_###
        const dateStr = formData.date.replace(/-/g, '');
        const baseCode = `PN_${dateStr}`;
        
        const existingSlips = slips.filter(s => s.type === SlipType.Receipt && s.code.startsWith(baseCode));
        if (existingSlips.length > 0) {
          let maxSuffix = 0;
          existingSlips.forEach(s => {
            const match = s.code.match(/_(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxSuffix) maxSuffix = num;
            } else if (s.code === baseCode) {
              if (maxSuffix === 0) maxSuffix = 1;
            }
          });
          
          if (maxSuffix > 0) {
            setFormData(prev => ({ ...prev, code: `${baseCode}_${(maxSuffix + 1).toString().padStart(3, '0')}` }));
          } else {
            setFormData(prev => ({ ...prev, code: `${baseCode}_001` }));
          }
        } else {
          setFormData(prev => ({ ...prev, code: `${baseCode}_001` }));
        }
      } else if (type === SlipType.Issue) {
        // Auto-generate Issue code: Tuần ##-YYYY-##
        const { week, year } = getWeekNumber(formData.date);
        const baseCode = `Tuần ${week.toString().padStart(2, '0')}-${year}`;
        
        const existingSlips = slips.filter(s => s.type === SlipType.Issue && s.code.startsWith(baseCode));
        if (existingSlips.length > 0) {
          let maxSuffix = 0;
          existingSlips.forEach(s => {
            const match = s.code.match(/-(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxSuffix) maxSuffix = num;
            } else if (s.code === baseCode) {
              if (maxSuffix === 0) maxSuffix = 1;
            }
          });
          
          if (maxSuffix > 0) {
            setFormData(prev => ({ ...prev, code: `${baseCode}-${(maxSuffix + 1).toString().padStart(2, '0')}` }));
          } else {
            setFormData(prev => ({ ...prev, code: baseCode }));
          }
        } else {
          setFormData(prev => ({ ...prev, code: baseCode }));
        }
      }
    }
  }, [formData.date, type, slip, slips, isOpen]);

  const handleQRScanSuccess = (decodedText: string) => {
    // Attempt to find item by code
    const foundItem = items.find(i => i.code.toLowerCase() === decodedText.toLowerCase());
    if (foundItem) {
      // Check if item already exists in the list
      const exists = formData.items?.find(i => i.itemId === foundItem.id);
      if (!exists) {
        handleAddItem(foundItem.id);
      } else {
        alert('Vật tư này đã có trong danh sách!');
      }
    } else {
      alert(`Không tìm thấy vật tư với mã: ${decodedText}`);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = (initialItemId: string = '') => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { 
        itemId: initialItemId, 
        quantity: 1,
        ...(type === SlipType.Issue ? { issueDate: prev.date } : {})
      }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: keyof InventorySlipItem, value: any) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };

      // Validate inventory for Issue slips when itemId is selected
      if (type === SlipType.Issue && field === 'itemId' && value) {
        const available = getAvailableQty(value);
        const selectedInventoryItem = items.find(i => i.id === value);
        if (selectedInventoryItem && (available <= 0)) {
          alert(`❌ Không thể thêm "${selectedInventoryItem.name}"\nTồn kho: ${available}\n\nVui lòng chọn vật tư khác hoặc cập nhật tồn kho.`);
          // Remove the item since it has no inventory
          newItems[index] = { ...newItems[index], itemId: '' };
          return { ...prev, items: newItems };
        }
      }

      // Validate quantity does not exceed available inventory
      if (type === SlipType.Issue && field === 'quantity' && value > 0) {
        const currentItem = newItems[index];
        if (currentItem.itemId) {
          const available = getAvailableQty(currentItem.itemId);
          const selectedInventoryItem = items.find(i => i.id === currentItem.itemId);
          if (selectedInventoryItem && value > available) {
            alert(`❌ Số lượng không được vượt quá tồn kho\n\n"${selectedInventoryItem.name}"\nYêu cầu: ${value}\nTồn kho: ${available}`);
            // Reset quantity to max available
            newItems[index] = { ...newItems[index], quantity: available || 1 };
            return { ...prev, items: newItems };
          }
        }
      }

      // Auto-match cost code for Issue slips
      if (type === SlipType.Issue && ['itemId', 'subsystem', 'purpose', 'method'].includes(field)) {
        const currentItem = newItems[index];
        if (currentItem.itemId && currentItem.subsystem && currentItem.purpose && currentItem.method) {
          const selectedInventoryItem = items.find(i => i.id === currentItem.itemId);
          if (selectedInventoryItem) {
            let bestMatch = null;
            let maxScore = -1;

            const normalize = (str?: string) => (str || '').trim().toLowerCase();

            costCodes.forEach(cc => {
              const ccClass = normalize(cc.classification);
              const itemClass = normalize(selectedInventoryItem.classification);
              const matchClass = !ccClass || ccClass === itemClass || (itemClass && ccClass.includes(itemClass)) || (ccClass && itemClass.includes(ccClass));

              const ccSub = normalize(cc.subsystem);
              const itemSub = normalize(currentItem.subsystem);
              const matchSub = !ccSub || ccSub === itemSub || (itemSub && ccSub.includes(itemSub)) || (ccSub && itemSub.includes(ccSub));

              const ccPurp = normalize(cc.purpose);
              const itemPurp = normalize(currentItem.purpose);
              const matchPurp = !ccPurp || ccPurp === itemPurp || (itemPurp && ccPurp.includes(itemPurp)) || (ccPurp && itemPurp.includes(ccPurp));

              const ccMeth = normalize(cc.method);
              const itemMeth = normalize(currentItem.method);
              const matchMeth = !ccMeth || ccMeth === itemMeth || (itemMeth && ccMeth.includes(itemMeth)) || (ccMeth && itemMeth.includes(ccMeth));

              if (matchClass && matchSub && matchPurp && matchMeth) {
                let score = 0;
                if (ccClass) score += 1;
                if (ccSub) score += 1;
                if (ccPurp) score += 1;
                if (ccMeth) score += 1;

                if (score > maxScore) {
                  maxScore = score;
                  bestMatch = cc;
                }
              }
            });

            if (!bestMatch) {
              // Fallback: ignore classification completely
              costCodes.forEach(cc => {
                const ccSub = normalize(cc.subsystem);
                const itemSub = normalize(currentItem.subsystem);
                const matchSub = !ccSub || ccSub === itemSub || (itemSub && ccSub.includes(itemSub)) || (ccSub && itemSub.includes(ccSub));

                const ccPurp = normalize(cc.purpose);
                const itemPurp = normalize(currentItem.purpose);
                const matchPurp = !ccPurp || ccPurp === itemPurp || (itemPurp && ccPurp.includes(itemPurp)) || (ccPurp && itemPurp.includes(ccPurp));

                const ccMeth = normalize(cc.method);
                const itemMeth = normalize(currentItem.method);
                const matchMeth = !ccMeth || ccMeth === itemMeth || (itemMeth && ccMeth.includes(itemMeth)) || (ccMeth && itemMeth.includes(ccMeth));

                if (matchSub && matchPurp && matchMeth) {
                  let score = 0;
                  if (ccSub) score += 1;
                  if (ccPurp) score += 1;
                  if (ccMeth) score += 1;

                  if (score > maxScore) {
                    maxScore = score;
                    bestMatch = cc;
                  }
                }
              });
            }

            if (bestMatch) {
              currentItem.costCode = (bestMatch as any).code;
            } else {
              currentItem.costCode = '';
            }
          }
        }
      }

      return { ...prev, items: newItems };
    });
  };

  const handleAddFromRequisition = () => {
    if (!selectedRequisitionId) return;
    // Open modal to let user select items
    setIsSelectItemsModalOpen(true);
  };

  const handleConfirmRequisitionItems = (selectedItems: {itemId: string, requisitionItemId: string, quantity: number}[]) => {
    const req = requisitions.find(r => r.id === selectedRequisitionId);
    if (!req) return;

    console.log(`📋 [Requisition Items] Selected ${selectedItems.length} items from ${req.code}:`, selectedItems);

    const newItems: InventorySlipItem[] = selectedItems.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      requisitionItemId: item.requisitionItemId,
      requisitionId: req.id
    }));

    console.log(`📝 [Receipt] Created ${newItems.length} slip items:`, newItems);

    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), ...newItems],
      requisitionIds: [...new Set([...(prev.requisitionIds || []), req.id])]
    }));

    setIsSelectItemsModalOpen(false);
  };

  const calculateTotalValue = () => {
    if (!formData.items || formData.items.length === 0) return 0;
    return formData.items.reduce((total, item) => {
      const inventoryItem = items.find(i => i.id === item.itemId);
      const price = inventoryItem?.unitPrice || 0;
      return total + (item.quantity * price);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.items || formData.items.length === 0) {
      alert('Vui lòng thêm ít nhất một vật tư.');
      return;
    }

    if (formData.items.some(i => !i.itemId || i.quantity <= 0)) {
      alert('Vui lòng chọn vật tư và nhập số lượng hợp lệ.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate inventory quantities for Issue slips (export)
      if (type === SlipType.Issue) {
        const invalidItems: string[] = [];
        for (const slipItem of formData.items || []) {
          const inventoryItem = items.find(i => i.id === slipItem.itemId);
          if (!inventoryItem) continue;

          const availableQty = getAvailableQty(inventoryItem.id);
          if (availableQty <= 0) {
            invalidItems.push(`${inventoryItem.name} (tồn kho: ${availableQty})`);
          } else if (slipItem.quantity > availableQty) {
            invalidItems.push(`${inventoryItem.name} (yêu cầu: ${slipItem.quantity}, tồn kho: ${availableQty})`);
          }
        }

        if (invalidItems.length > 0) {
          const message = `Không thể xuất các vật tư sau (chưa cập nhật tồn kho hoặc số lượng không đủ):\n${invalidItems.map(item => `- ${item}`).join('\n')}`;
          alert(message);
          setIsSubmitting(false);
          return;
        }
      }

      // Build clean slipData object - only include defined fields
      const slipData: Partial<InventorySlip> = {
        code: formData.code,
        date: formData.date,
        reason: formData.reason,
        status: formData.status,
        items: formData.items,
        type,
        createdBy: formData.createdBy || profile?.display_name || 'Unknown',
      };

      // Only add receiptType for Receipt slips
      if (type === SlipType.Receipt) {
        slipData.receiptType = formData.receiptType;
        slipData.requisitionIds = formData.requisitionIds;
      }

      // Auto-generate code if empty
      if (!slipData.code?.trim()) {
        if (type === SlipType.Issue) {
          slipData.code = await generateIssueCode(formData.date || new Date().toISOString().split('T')[0]);
        } else {
          slipData.code = await generateReceiptCode(formData.date || new Date().toISOString().split('T')[0]);
        }
      }

      if (type === SlipType.Issue && formData.date) {
        const { week, year } = getWeekNumber(formData.date);
        slipData.weekOfYear = `Tuần ${week.toString().padStart(2, '0')}-${year}`;
      }

      // Save or update slip
      let createdSlipId: string | undefined = undefined;
      if (slip?.id) {
        const dbData = slipToDatabase(slipData);
        const { error } = await supabase
          .from('inventory_slips')
          .update(dbData)
          .eq('id', slip.id);
        if (error) throw error;
        createdSlipId = slip.id;
      } else {
        const dbData = slipToDatabase(slipData);
        const { data: inserted, error } = await supabase
          .from('inventory_slips')
          .insert([dbData])
          .select('*')
          .single();
        if (error) throw error;
        createdSlipId = inserted?.id;
        // set the id on slipData for downstream processing
        if (createdSlipId) slipData.id = createdSlipId;
      }

      // *** Calculate Deltas for Synchronization ***
      const oldSlip = slip;
      const oldItems = oldSlip?.items || [];
      const newItems = slipData.items || [];

      // *** Update Requisitions if Receipt ***
      if (type === SlipType.Receipt) {
        console.log(`✅ [Receipt] Updating requisitions (create or edit)`);
        const reqUpdates: Record<string, { itemId: string, reqItemId: string, quantity: number, delta: number }[]> = {};
        
        // Aggregate NEW items (+ delta)
        newItems.forEach(item => {
          if (item.requisitionId && item.requisitionItemId) {
            if (!reqUpdates[item.requisitionId]) reqUpdates[item.requisitionId] = [];
            const existing = reqUpdates[item.requisitionId].find(i => i.reqItemId === item.requisitionItemId);
            if (existing) {
              existing.quantity += item.quantity;
              existing.delta += item.quantity;
            } else {
              reqUpdates[item.requisitionId].push({
                itemId: item.itemId!,
                reqItemId: item.requisitionItemId,
                quantity: item.quantity,
                delta: item.quantity
              });
            }
          }
        });

        // Aggregate OLD items (- delta) if editing
        if (slip?.id) {
          oldItems.forEach(item => {
            if (item.requisitionId && item.requisitionItemId) {
              if (!reqUpdates[item.requisitionId]) reqUpdates[item.requisitionId] = [];
              const existing = reqUpdates[item.requisitionId].find(i => i.reqItemId === item.requisitionItemId);
              if (existing) {
                existing.delta -= item.quantity;
              } else {
                reqUpdates[item.requisitionId].push({
                  itemId: item.itemId!,
                  reqItemId: item.requisitionItemId,
                  quantity: 0,
                  delta: -item.quantity
                });
              }
            }
          });
        }

        // Apply deltas to Requisitions
        for (const reqId of Object.keys(reqUpdates)) {
          const req = requisitions.find(r => r.id === reqId);
          if (req) {
            console.log(`🔄 [Receipt] Updating requisition ${req.code} with deltas:`, reqUpdates[reqId]);
            let allCompleted = true;
            let anyReceived = false;
            
            const updatedItems = req.items.map((reqItem, reqItemIdx) => {
              let updateMatch = null;
              if (reqItem.id) {
                updateMatch = reqUpdates[reqId].find(i => i.reqItemId === reqItem.id);
              }
              if (!updateMatch) {
                updateMatch = reqUpdates[reqId].find(i => {
                  const isIndexBased = /^\d+$/.test(i.reqItemId);
                  return isIndexBased && parseInt(i.reqItemId) === reqItemIdx;
                });
              }
              if (!updateMatch) {
                updateMatch = reqUpdates[reqId].find(i => i.itemId === reqItem.itemId);
              }

              if (updateMatch && updateMatch.delta !== 0) {
                const newReceived = Math.max(0, (reqItem.receivedQuantity || 0) + updateMatch.delta);
                const newStatus = newReceived >= reqItem.requestedQuantity ? RequisitionItemStatus.Completed : RequisitionItemStatus.Pending;
                if (newStatus !== RequisitionItemStatus.Completed) allCompleted = false;
                if (newReceived > 0) anyReceived = true;
                return { ...reqItem, receivedQuantity: newReceived, itemStatus: newStatus };
              }
              
              if (reqItem.itemStatus !== RequisitionItemStatus.Completed) allCompleted = false;
              if ((reqItem.receivedQuantity || 0) > 0) anyReceived = true;
              return reqItem;
            });

            let newReqStatus = RequisitionStatus.New;
            if (allCompleted) newReqStatus = RequisitionStatus.Fulfilled;
            else if (anyReceived) newReqStatus = RequisitionStatus.PartiallyFulfilled;

            const reqUpdateData = {
              items: updatedItems,
              status: newReqStatus
            };
            const dbUpdateData = requisitionToDatabase(reqUpdateData);
            const { error } = await supabase
              .from('inventory_requisitions')
              .update(dbUpdateData)
              .eq('id', reqId);
            if (error) {
              console.error(`❌ [Receipt] Error updating requisition ${reqId}:`, error);
              throw error;
            }
            console.log(`✅ [Receipt] Requisition ${req.code} updated successfully`);
          }
        }
      }

      // *** Update Inventory Quantities ***
      if (type === SlipType.Issue) {
        console.log(`📦 [Inventory] Updating item quantities for Issue slip (create or edit)`);
        
        const inventoryDeltas: Record<string, number> = {};
        
        // New items subtract from inventory (Issue)
        newItems.forEach(item => {
          if (item.itemId) {
            inventoryDeltas[item.itemId] = (inventoryDeltas[item.itemId] || 0) - item.quantity;
          }
        });
        
        // Old items add back to inventory if editing
        if (slip?.id) {
          oldItems.forEach(item => {
            if (item.itemId) {
              inventoryDeltas[item.itemId] = (inventoryDeltas[item.itemId] || 0) + item.quantity;
            }
          });
        }
        
        for (const itemId of Object.keys(inventoryDeltas)) {
          const delta = inventoryDeltas[itemId];
          if (delta === 0) continue;
          
          try {
            const { data: itemData, error: fetchError } = await supabase
              .from('inventory_items')
              .select('quantity')
              .eq('id', itemId)
              .single();
              
            if (fetchError) throw fetchError;
            
            const currentQuantity = itemData?.quantity || 0;
            const newQuantity = Math.max(0, currentQuantity + delta);
            
            const { error: updateError } = await supabase
              .from('inventory_items')
              .update({ quantity: newQuantity })
              .eq('id', itemId);
              
            if (updateError) throw updateError;
            console.log(`✅ [Inventory] Item ${itemId} quantity updated: ${currentQuantity} -> ${newQuantity} (delta: ${delta})`);
          } catch (err) {
            console.error(`❌ [Inventory] Error processing item ${itemId}:`, err);
            throw err;
          }
        }
      } else if (type === SlipType.Receipt) {
        // For Receipt slips, inventory is updated when status is 'Đã đóng'
        // We use delta to handle status changes or edits to closed slips
        if (slipData.status === 'Đã đóng' || slip?.status === 'Đã đóng') {
           console.log(`📦 [Inventory] Updating item quantities for Closed Receipt slip (edit or status change)`);
           const inventoryDeltas: Record<string, number> = {};
           
           // If slip is currently closed, new items ADD to inventory
           if (slipData.status === 'Đã đóng') {
             newItems.forEach(item => {
               if (item.itemId) {
                 inventoryDeltas[item.itemId] = (inventoryDeltas[item.itemId] || 0) + item.quantity;
               }
             });
           }
           
           // If it was already closed before, old items SUBTRACT from inventory
           if (slip?.status === 'Đã đóng') {
             oldItems.forEach(item => {
               if (item.itemId) {
                 inventoryDeltas[item.itemId] = (inventoryDeltas[item.itemId] || 0) - item.quantity;
               }
             });
           }
           
           for (const itemId of Object.keys(inventoryDeltas)) {
             const delta = inventoryDeltas[itemId];
             if (delta === 0) continue;
             
             try {
               const { data: itemData, error: fetchError } = await supabase
                 .from('inventory_items')
                 .select('quantity')
                 .eq('id', itemId)
                 .single();
                 
               if (fetchError) throw fetchError;
               
               const currentQuantity = itemData?.quantity || 0;
               const newQuantity = Math.max(0, currentQuantity + delta);
               
               const { error: updateError } = await supabase
                 .from('inventory_items')
                 .update({ quantity: newQuantity })
                 .eq('id', itemId);
                 
               if (updateError) throw updateError;
               console.log(`✅ [Inventory] Receipt Item ${itemId} quantity updated: ${currentQuantity} -> ${newQuantity} (delta: ${delta})`);
             } catch (err) {
               console.error(`❌ [Inventory] Error processing item ${itemId}:`, err);
               throw err;
             }
           }
        } else {
          console.log(`⏭️ [Inventory] Not updating inventory - Receipt slip is not closed`);
        }
      }

      // Notify other components to refresh inventory display
      try {
        window.dispatchEvent(new CustomEvent('inventory:refresh'));
      } catch (e) {
        console.warn('Could not dispatch inventory:refresh event from SlipModal', e);
      }

      // Log activity (async)
      try {
        import('../../utils/activityLogger').then(mod => mod.logActivity({
          action: type === SlipType.Issue ? 'create_issue_slip' : 'create_receipt_slip',
          entityType: 'inventory_slip',
          entityId: createdSlipId,
          details: { code: slipData.code, items: slipData.items }
        }));
      } catch (e) {
        console.warn('activity log failed (slip):', e);
      }

      onClose();
      alert(`Lưu phiếu ${type === SlipType.Issue ? 'xuất' : 'nhập'} thành công! Mã phiếu: ${slipData.code}`);
    } catch (error) {
      console.error('Save slip error:', error);
      alert(`Có lỗi xảy ra khi lưu phiếu: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueMethods = Array.from(new Set(costCodes.map(c => c.method).filter(Boolean)));
  const uniquePurposes = Array.from(new Set(costCodes.map(c => c.purpose).filter(Boolean)));

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: '38px',
      borderRadius: '0.375rem',
      borderColor: '#d1d5db',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#d1d5db'
      }
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
  };

  const itemOptions = items.map(i => ({ value: i.id, label: `${i.code} - ${i.name} (${i.unit})` }));
  const itemCodeOptions = items.map(i => ({ value: i.id, label: i.code }));
  const itemNameOptions = items.map(i => ({ value: i.id, label: i.name }));

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-[90vw] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {slip ? (type === SlipType.Receipt ? 'Cập nhật Phiếu Nhập' : 'Cập nhật Phiếu Xuất') : (type === SlipType.Receipt ? 'Tạo Phiếu Nhập mới' : 'Tạo Phiếu Xuất mới')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isFormDisabled() && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-amber-700">
                <p className="font-medium">Phiếu đã {slip?.status?.toLowerCase()}. Chỉ Admin/Manager mới có quyền chỉnh sửa.</p>
              </div>
            </div>
          )}
          <form id="slip-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã Phiếu</label>
                <input
                  type="text"
                  name="code"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  disabled={true}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-100 cursor-not-allowed text-gray-500`}
                  placeholder={type === SlipType.Receipt ? "VD: PN_20250322_001" : "VD: Tuần 12-2025"}
                />
                <p className="text-xs text-gray-500 mt-1">Mã phiếu sẽ tự động được sinh dựa trên ngày lập</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày lập</label>
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  disabled={isFormDisabled()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isFormDisabled()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                >
                  <option value="Đang mở">Đang mở</option>
                  <option value="Đã hoàn thành">Đã hoàn thành</option>
                  <option value="Đã đóng">Đã đóng</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Người lập</label>
                <select
                  name="createdBy"
                  value={formData.createdBy}
                  onChange={handleChange}
                  disabled={isFormDisabled()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                >
                  <option value="">-- Chọn người lập --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mục đích</label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  disabled={isFormDisabled()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                  placeholder="Nhập mục đích..."
                />
              </div>
              
              {type === SlipType.Receipt && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại nhập</label>
                    <select
                      name="receiptType"
                      value={formData.receiptType || 'Theo tờ trình'}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="Theo tờ trình">Theo tờ trình</option>
                      <option value="Nhận ngoài">Nhận ngoài</option>
                    </select>
                  </div>
                  
                  {formData.receiptType === 'Theo tờ trình' && (
                    <div className="col-span-2 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <label className="block text-sm font-medium text-indigo-900 mb-2">Chọn tờ trình mua sắm</label>
                      <div className="flex gap-2">
                        <select
                          value={selectedRequisitionId}
                          onChange={(e) => setSelectedRequisitionId(e.target.value)}
                          className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        >
                          <option value="">-- Chọn tờ trình chưa hoàn thành --</option>
                          {requisitions
                            .filter(r => r.status !== RequisitionStatus.Closed && r.status !== RequisitionStatus.Rejected && r.status !== RequisitionStatus.Fulfilled)
                            .map(req => (
                              <option key={req.id} value={req.id}>{req.code} - {req.purpose}</option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddFromRequisition}
                          disabled={!selectedRequisitionId || isFormDisabled()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Thêm vật tư
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Danh sách Vật tư</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQRScannerOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <QrCode size={16} />
                    <span>Quét QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={isFormDisabled()}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                    <span>Thêm dòng</span>
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {type === SlipType.Receipt ? (
                        <>
                          <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Mã vật tư</th>
                          <th className="p-3 text-sm font-medium text-gray-600 min-w-[200px]">Tên vật tư</th>
                          <th className="p-3 text-sm font-medium text-gray-600 w-24">Đơn vị</th>
                          <th className="p-3 text-sm font-medium text-gray-600 w-32">Số lượng</th>
                          <th className="p-3 text-sm font-medium text-gray-600 w-32">Đơn giá</th>
                          <th className="p-3 text-sm font-medium text-gray-600 w-32">Thành tiền</th>
                        </>
                      ) : (
                        <>
                          <th className="p-3 text-sm font-medium text-gray-600 min-w-[250px]">Vật tư</th>
                          <th className="p-3 text-sm font-medium text-gray-600 w-32">Số lượng</th>
                          <th className="p-3 text-sm font-medium text-gray-600 w-32">Đơn giá</th>
                          <th className="p-3 text-sm font-medium text-gray-600 w-32">Thành tiền</th>
                          <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Ngày xuất</th>
                          <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Người xuất</th>
                          <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Hệ thống</th>
                          <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Mục đích</th>
                          <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Phương thức</th>
                          <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Mã chi phí</th>
                          <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Ghi chú</th>
                        </>
                      )}
                      <th className="p-3 text-sm font-medium text-gray-600 w-16 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.items?.map((item, index) => {
                      const inventoryItem = items.find(i => i.id === item.itemId);
                      const unitPrice = inventoryItem?.unitPrice || 0;
                      const totalPrice = item.quantity * unitPrice;

                      return (
                      <tr key={index}>
                        {type === SlipType.Receipt ? (
                          <>
                            <td className="p-3">
                              <Select
                                options={itemCodeOptions}
                                value={itemCodeOptions.find(opt => opt.value === item.itemId) || null}
                                onChange={(selected) => handleItemChange(index, 'itemId', selected?.value || '')}
                                placeholder="-- Chọn mã --"
                                styles={selectStyles}
                                menuPortalTarget={document.body}
                                isClearable
                                required
                              />
                            </td>
                            <td className="p-3">
                              <Select
                                options={itemNameOptions}
                                value={itemNameOptions.find(opt => opt.value === item.itemId) || null}
                                onChange={(selected) => handleItemChange(index, 'itemId', selected?.value || '')}
                                placeholder="-- Chọn tên vật tư --"
                                styles={selectStyles}
                                menuPortalTarget={document.body}
                                isClearable
                                required
                              />
                            </td>
                            <td className="p-3 text-gray-600">
                              {inventoryItem?.unit || '-'}
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                              />
                            </td>
                            <td className="p-3 text-gray-600">
                              {unitPrice.toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="p-3 font-medium text-indigo-600">
                              {totalPrice.toLocaleString('vi-VN')} ₫
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3">
                              <Select
                                options={itemOptions}
                                value={itemOptions.find(opt => opt.value === item.itemId) || null}
                                onChange={(selected) => handleItemChange(index, 'itemId', selected?.value || '')}
                                placeholder="-- Chọn vật tư --"
                                styles={selectStyles}
                                menuPortalTarget={document.body}
                                isClearable
                                required
                              />
                              {/* Show computed stock beneath select, red if zero */}
                              {item.itemId && (() => {
                                const avail = getAvailableQty(item.itemId);
                                return (
                                  <p className={avail <= 0 ? 'text-sm text-red-600 mt-1' : 'text-sm text-gray-600 mt-1'}>Tồn kho: {avail}</p>
                                );
                              })()}
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                              />
                            </td>
                            <td className="p-3 text-gray-600">
                              {unitPrice.toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="p-3 font-medium text-indigo-600">
                              {totalPrice.toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="p-3">
                              <input
                                type="date"
                                value={item.issueDate || ''}
                                onChange={(e) => handleItemChange(index, 'issueDate', e.target.value)}
                                className={`w-full px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none ${
                                  item.issueDate && formData.date && 
                                  (getWeekNumber(item.issueDate).week !== getWeekNumber(formData.date).week || 
                                   getWeekNumber(item.issueDate).year !== getWeekNumber(formData.date).year)
                                    ? 'border-red-500 text-red-600'
                                    : 'border-gray-300'
                                }`}
                                required
                              />
                              {item.issueDate && formData.date && 
                               (getWeekNumber(item.issueDate).week !== getWeekNumber(formData.date).week || 
                                getWeekNumber(item.issueDate).year !== getWeekNumber(formData.date).year) && (
                                <p className="text-xs text-red-500 mt-1">Khác tuần với ngày lập phiếu</p>
                              )}
                            </td>
                            <td className="p-3">
                              <select
                                value={item.handler || ''}
                                onChange={(e) => handleItemChange(index, 'handler', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                              >
                                <option value="">-- Chọn người xuất --</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.name}>{u.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={item.subsystem || ''}
                                onChange={(e) => handleItemChange(index, 'subsystem', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                <option value="">-- Chọn phân hệ --</option>
                                {subsystems.map(sub => (
                                  <option key={sub.id} value={sub.name}>{sub.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={item.purpose || ''}
                                onChange={(e) => handleItemChange(index, 'purpose', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                <option value="">-- Mục đích --</option>
                                {uniquePurposes.map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={item.method || ''}
                                onChange={(e) => handleItemChange(index, 'method', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                <option value="">-- Phương thức --</option>
                                {uniqueMethods.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={item.costCode || ''}
                                onChange={(e) => handleItemChange(index, 'costCode', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                <option value="">-- Chọn mã --</option>
                                {costCodes.map(cc => (
                                  <option key={cc.id} value={cc.code}>{cc.code} - {cc.classification}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.notes || ''}
                                onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Ghi chú..."
                              />
                            </td>
                          </>
                        )}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={isFormDisabled()}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                    {(!formData.items || formData.items.length === 0) && (
                      <tr>
                        <td colSpan={type === SlipType.Receipt ? 7 : 12} className="p-6 text-center text-gray-500">
                          Chưa có vật tư nào. Hãy thêm vật tư.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex justify-end">
                <div className="bg-indigo-50 px-6 py-3 rounded-lg border border-indigo-100 flex items-center gap-4">
                  <span className="text-indigo-900 font-medium">
                    {type === SlipType.Receipt ? 'Tổng giá trị phiếu nhập:' : 'Tổng giá trị phiếu xuất:'}
                  </span>
                  <span className="text-xl font-bold text-indigo-700">{calculateTotalValue().toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors bg-white"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            form="slip-form"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || isFormDisabled()}
          >
            {isSubmitting ? 'Đang lưu...' : (slip ? 'Cập nhật' : 'Tạo phiếu')}
          </button>
        </div>
      </div>
    </div>

    <SelectRequisitionItemsModal
      isOpen={isSelectItemsModalOpen}
      onClose={() => setIsSelectItemsModalOpen(false)}
      requisition={requisitions.find(r => r.id === selectedRequisitionId) || null}
      items={items}
      onConfirm={handleConfirmRequisitionItems}
    />
    
    <QRScannerModal
      isOpen={isQRScannerOpen}
      onClose={() => setIsQRScannerOpen(false)}
      onScanSuccess={handleQRScanSuccess}
    />
    </>
  );
};
