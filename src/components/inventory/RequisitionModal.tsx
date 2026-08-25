import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { Requisition, RequisitionType, RequisitionStatus, RequisitionItem, RequisitionItemStatus, Item } from '../../types/inventory';
import { supabase } from '../../supabase-client';
import { useAuth } from '../../contexts/AuthContext';
import { requisitionToDatabase } from '../../utils/dataTransform';
import { QRScannerModal } from './QRScannerModal';
import { QrCode } from 'lucide-react';

interface RequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition?: Requisition | null;
}

export const RequisitionModal: React.FC<RequisitionModalProps> = ({ isOpen, onClose, requisition }) => {
  const { profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [subsystems, setSubsystems] = useState<{id: string, name: string}[]>([]);
  const [reqTypes, setReqTypes] = useState<{id: string, name: string}[]>([]);
  const [costCodes, setCostCodes] = useState<{id: string, code: string, name: string, classification: string, subsystem: string, purpose: string, method: string}[]>([]);
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  const [formData, setFormData] = useState<Partial<Requisition>>({
    code: '',
    date: new Date().toISOString().split('T')[0],
    purpose: '',
    status: RequisitionStatus.New,
    type: '',
    notes: '',
    items: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Generate next requisition code
  const generateNextCode = async (): Promise<string> => {
    try {
      const { data } = await supabase
        .from('inventory_requisitions')
        .select('code')
        .order('code', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const lastCode = data[0].code;
        const match = lastCode.match(/^TT-(\d+)$/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          return `TT-${nextNum.toString().padStart(3, '0')}`;
        }
      }
      return 'TT-001';
    } catch (error) {
      console.error('Error generating code:', error);
      return `TT-${Date.now()}`;
    }
  };

  useEffect(() => {
    // Fetch all required data for the form
    const loadData = async () => {
      try {
        // Fetch items
        const { data: itemsData } = await supabase
          .from('inventory_items')
          .select('*');
        if (itemsData) setItems(itemsData as Item[]);

        // Fetch subsystems
        const { data: subsystemsData } = await supabase
          .from('inventory_subsystems')
          .select('*');
        if (subsystemsData) setSubsystems(subsystemsData);

        // Fetch requisition types
        const { data: typesData } = await supabase
          .from('inventory_requisition_types')
          .select('*');
        if (typesData) setReqTypes(typesData);

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
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };

    loadData();

    // Subscribe to real-time changes for inventory items
    const itemsChannel = supabase
      .channel(`inventory_items_changes_${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems(prev => [...prev, payload.new as Item]);
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(item => item.id === payload.new.id ? (payload.new as Item) : item));
        } else if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
    };
  }, []);

  useEffect(() => {
    const initForm = async () => {
      if (requisition) {
        // When editing, ensure all items have required fields
        const normalizedRequisition = {
          ...requisition,
          items: (requisition.items || []).map((item: any) => ({
            id: item.id || Date.now().toString(),
            itemId: item.itemId || '',
            requestedQuantity: item.requestedQuantity || 0,
            receivedQuantity: item.receivedQuantity || 0,
            itemStatus: item.itemStatus || RequisitionItemStatus.Pending,
            subsystem: item.subsystem || '',
            method: item.method || '',
            purpose: item.purpose || '',
            costCode: item.costCode || '',
            notes: item.notes || ''
          }))
        };
        setFormData(normalizedRequisition);
      } else {
        // Auto-generate code for new requisition
        const nextCode = await generateNextCode();
        setFormData({
          code: nextCode,
          date: new Date().toISOString().split('T')[0],
          purpose: '',
          status: RequisitionStatus.New,
          type: '',
          notes: '',
          items: [],
          createdBy: '', // Empty - user MUST select from dropdown
        });
      }
    };
    
    if (isOpen) {
      initForm();
    }
  }, [requisition, isOpen, profile]);

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
        id: Date.now().toString(), 
        itemId: initialItemId, 
        requestedQuantity: 1, 
        receivedQuantity: 0, 
        itemStatus: RequisitionItemStatus.Pending,
        subsystem: '',
        method: '',
        purpose: '',
        costCode: '',
        notes: ''
      }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: keyof RequisitionItem, value: any) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Auto-match cost code
      const currentItem = newItems[index];
      if (['itemId', 'subsystem', 'purpose', 'method'].includes(field)) {
        if (currentItem.itemId && currentItem.subsystem && currentItem.purpose && currentItem.method) {
          const selectedInventoryItem = items.find(i => i.id === currentItem.itemId);
          if (selectedInventoryItem) {
            let bestMatch = null;
            let maxScore = -1;

            const normalize = (str?: string) => (str || '').trim().toLowerCase();

            costCodes.forEach(cc => {
              const ccClass = normalize(cc.classification);
              const itemClass = normalize(selectedInventoryItem.category);
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

  const calculateTotalValue = () => {
    if (!formData.items || formData.items.length === 0) return 0;
    return formData.items.reduce((total, item) => {
      const inventoryItem = items.find(i => i.id === item.itemId);
      const price = inventoryItem?.unitPrice || 0;
      return total + (item.requestedQuantity * price);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.type || formData.type.trim() === '') {
      alert('Vui lòng chọn loại tờ trình');
      return;
    }

    if (!formData.items || formData.items.length === 0) {
      alert('Vui lòng thêm ít nhất một vật tư.');
      return;
    }

    const itemErrors = formData.items.map((i, idx) => {
      const errors = [];
      if (!i.itemId) errors.push(`Item ${idx + 1}: Không chọn vật tư`);
      if (i.requestedQuantity <= 0) errors.push(`Item ${idx + 1}: Số lượng phải > 0`);
      return errors;
    }).flat();

    if (itemErrors.length > 0) {
      alert('Lỗi dữ liệu item:\n' + itemErrors.join('\n'));
      console.error('Item validation errors:', itemErrors, 'Data:', formData.items);
      return;
    }

    if (!formData.code?.trim()) {
      alert('Mã tờ trình không được để trống');
      return;
    }

    if (!formData.date) {
      alert('Ngày lập không được để trống');
      return;
    }

    if (!formData.purpose?.trim()) {
      alert('Mục đích không được để trống');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine createdBy value - prefer explicitly selected, fallback to current user
      let createdByValue = formData.createdBy?.trim();
      
      // If not explicitly selected, try current user's display name
      if (!createdByValue && profile?.displayName) {
        createdByValue = profile.displayName;
        console.log('⚠️ Using current user displayName as createdBy:', createdByValue);
      }
      
      // If still no value, try to find matching user in the dropdown list
      if (!createdByValue && profile?.email && users.length > 0) {
        const matchingUser = users.find(u => 
          u.name === profile.displayName || 
          u.name === profile.email ||
          u.name.includes(profile.displayName || '')
        );
        if (matchingUser) {
          createdByValue = matchingUser.name;
          console.log('✅ Found matching user in dropdown:', createdByValue);
        }
      }
      
      if (!createdByValue) {
        throw new Error(
          'Không xác định được người tạo (createdBy).\n' +
          'Vui lòng:\n' +
          '1. Chọn người lập từ dropdown "Người lập"\n' +
          'HOẶC\n' +
          '2. Đăng xuất và đăng nhập lại để cập nhật thông tin'
        );
      }

      const reqData = {
        ...formData,
        createdBy: createdByValue,
      };

      // Convert camelCase to snake_case for database
      const dbData = requisitionToDatabase(reqData);

      console.log('📝 Form data (camelCase):', reqData);
      console.log('📝 Database data (snake_case):', dbData);
      console.log('📝 Data to insert:', JSON.stringify(dbData, null, 2));

      if (requisition?.id) {
        console.log('🔄 Updating requisition:', requisition.id);
        const { error } = await supabase
          .from('inventory_requisitions')
          .update(dbData)
          .eq('id', requisition.id);
        if (error) throw error;
      } else {
        console.log('➕ Creating new requisition');
        const { error, data } = await supabase
          .from('inventory_requisitions')
          .insert([dbData])
          .select();
        
        console.log('📊 Insert response:', { error, data });
        if (error) throw error;
      }
      onClose();
      alert(`Lưu tờ trình thành công!`);
    } catch (error) {
      console.error('❌ Save requisition error:', error);
      
      let errorMessage = 'Unknown error';
      let errorDetails = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || '';
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error, null, 2);
        errorDetails = JSON.stringify(error);
      }
      
      // Extract Supabase-specific error details
      if (typeof error === 'object' && error !== null && 'details' in error) {
        errorMessage += `\n\nDetails: ${(error as any).details}`;
      }
      if (typeof error === 'object' && error !== null && 'hint' in error) {
        errorMessage += `\n\nHint: ${(error as any).hint}`;
      }
      if (typeof error === 'object' && error !== null && 'code' in error) {
        errorMessage += `\n\nCode: ${(error as any).code}`;
      }
      
      console.error('📋 Full error details:', errorDetails);
      alert(`❌ Có lỗi xảy ra khi lưu tờ trình:\n\n${errorMessage}`);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[90vw] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {requisition ? 'Cập nhật Tờ Trình' : 'Tạo Tờ Trình mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="req-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã Tờ Trình</label>
                <input
                  type="text"
                  name="code"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  readOnly={!!requisition}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${requisition ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="VD: TT-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày lập</label>
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại Tờ Trình</label>
                <select
                  name="type"
                  value={formData.type || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">-- Chọn loại tờ trình --</option>
                  {reqTypes && reqTypes.length > 0 ? (
                    reqTypes.map(rt => (
                      <option key={rt.id} value={rt.name}>{rt.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="Thường">Thường</option>
                      <option value="Khẩn cấp">Khẩn cấp</option>
                      <option value="Dự án">Dự án</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value={RequisitionStatus.New}>Mới</option>
                  <option value={RequisitionStatus.Approved}>Đã duyệt</option>
                  <option value={RequisitionStatus.Rejected}>Từ chối</option>
                  <option value={RequisitionStatus.PartiallyFulfilled}>Đã nhập 1 phần</option>
                  <option value={RequisitionStatus.Fulfilled}>Đã nhập đủ</option>
                  <option value={RequisitionStatus.Closed}>Đã đóng</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Người lập</label>
                <select
                  name="createdBy"
                  value={formData.createdBy}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
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
                  name="purpose"
                  required
                  value={formData.purpose}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Nhập mục đích..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú chung</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Ghi chú..."
                  rows={2}
                />
              </div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Danh sách vật tư</h3>
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
                    onClick={() => handleAddItem()}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
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
                      <th className="p-3 text-sm font-medium text-gray-600 min-w-[250px]">Vật tư</th>
                      <th className="p-3 text-sm font-medium text-gray-600 w-24">SL Yêu cầu</th>
                      <th className="p-3 text-sm font-medium text-gray-600 w-32">Đơn giá</th>
                      <th className="p-3 text-sm font-medium text-gray-600 w-32">Thành tiền</th>
                      <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Hệ thống</th>
                      <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Mục đích</th>
                      <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Phương thức</th>
                      <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Mã chi phí</th>
                      <th className="p-3 text-sm font-medium text-gray-600 min-w-[150px]">Ghi chú</th>
                      <th className="p-3 text-sm font-medium text-gray-600 w-16 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.items?.map((item, index) => {
                      const inventoryItem = items.find(i => i.id === item.itemId);
                      const unitPrice = inventoryItem?.unitPrice || 0;
                      const totalPrice = item.requestedQuantity * unitPrice;

                      return (
                      <tr key={item.id || index}>
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
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="1"
                            value={item.requestedQuantity}
                            onChange={(e) => handleItemChange(index, 'requestedQuantity', Number(e.target.value))}
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
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                    {(!formData.items || formData.items.length === 0) && (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-gray-500">
                          Chưa có vật tư nào. Hãy thêm vật tư.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex justify-end">
                <div className="bg-indigo-50 px-6 py-3 rounded-lg border border-indigo-100 flex items-center gap-4">
                  <span className="text-indigo-900 font-medium">Tổng giá trị tờ trình:</span>
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
            form="req-form"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang lưu...' : (requisition ? 'Cập nhật' : 'Tạo Tờ Trình')}
          </button>
        </div>
      </div>
      
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
};
