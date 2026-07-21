import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Item } from '../../types/inventory';
import { supabase } from '../../supabase-client';
import { itemToDatabase, itemFromDatabase } from '../../utils/dataTransform';
import { logActivity } from '../../utils/activityLogger';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: Item | null;
  onSuccess?: (savedItem: Item) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, item, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Item>>({
    code: '',
    name: '',
    unit: '',
    category: '',
    initialStock: 0,
    unitPrice: 0,
    warningThresholdLower: 0,
    warningThresholdUpper: 0,
    priceUpdateDate: '',
    notes: '',
    locationId: '',
  });
  const [locations, setLocations] = useState<{id: string, name: string, code: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        code: '',
        name: '',
        unit: '',
        category: '',
        initialStock: 0,
        unitPrice: 0,
        warningThresholdLower: 0,
        warningThresholdUpper: 0,
        priceUpdateDate: '',
        notes: '',
        locationId: '',
      });
    }

    // Fetch locations
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase.from('inventory_locations').select('*');
        if (!error && data) {
          setLocations(data);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    };
    
    if (isOpen) {
      fetchLocations();
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['initialStock', 'unitPrice', 'warningThresholdLower', 'warningThresholdUpper'].includes(name)
        ? Number(value)
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.code?.trim()) {
        alert('❌ Mã vật tư là bắt buộc');
        setIsSubmitting(false);
        return;
      }
      if (!formData.name?.trim()) {
        alert('❌ Tên vật tư là bắt buộc');
        setIsSubmitting(false);
        return;
      }
      if (!formData.unit?.trim()) {
        alert('❌ Đơn vị tính là bắt buộc');
        setIsSubmitting(false);
        return;
      }
      if (!formData.category?.trim()) {
        alert('❌ Danh mục là bắt buộc');
        setIsSubmitting(false);
        return;
      }

      // Convert camelCase to snake_case for database
      const dbData = itemToDatabase(formData);
      
      console.log('📤 [ItemModal] Saving item data:', { 
        original: formData, 
        transformed: dbData,
        userId: (await supabase.auth.getUser()).data?.user?.id
      });
      
      if (item?.id) {
        console.log('📝 [ItemModal] Updating existing item:', item.id);
        const { data, error } = await supabase
          .from('inventory_items')
          .update(dbData)
          .eq('id', item.id)
          .select();
        
        if (error) {
          console.error('❌ [ItemModal] Update failed with error:', { 
            code: error.code, 
            message: error.message, 
            details: error.details, 
            hint: error.hint,
            status: (error as any).status
          });
          throw error;
        }
        console.log('✅ [ItemModal] Update successful:', data);
        if (data && data.length > 0) {
          const savedItem = itemFromDatabase(data[0]) as Item;
          onSuccess?.(savedItem);
          // Log activity
          logActivity({
            action: 'update_item',
            entityType: 'inventory_item',
            entityId: savedItem.id,
            details: { code: savedItem.code, name: savedItem.name }
          });
        }
      } else {
        console.log('✨ [ItemModal] Creating new item');
        const { data, error } = await supabase
          .from('inventory_items')
          .insert([dbData])
          .select();
        
        if (error) {
          console.error('❌ [ItemModal] Insert failed with error:', { 
            code: error.code, 
            message: error.message, 
            details: error.details, 
            hint: error.hint,
            status: (error as any).status
          });
          throw error;
        }
        console.log('✅ [ItemModal] Insert successful:', data);
        if (data && data.length > 0) {
          const savedItem = itemFromDatabase(data[0]) as Item;
          onSuccess?.(savedItem);
          // Log activity
          logActivity({
            action: 'create_item',
            entityType: 'inventory_item',
            entityId: savedItem.id,
            details: { code: savedItem.code, name: savedItem.name }
          });
        }
      }
      alert('✅ Lưu vật tư thành công!');
      onClose();
    } catch (error) {
      console.error('❌ [ItemModal] Error saving item:', error);
      
      let errorMessage = 'Không biết lỗi gì';
      let errorCode = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorCode = (error as any).code || '';
        
        console.error('❌ [ItemModal] Full error object:', {
          name: error.name,
          message: error.message,
          code: errorCode,
          stack: error.stack
        });
        
        // Add more details for common errors
        if (errorCode === 'PGRST116' || errorMessage.includes('PGRST116')) {
          errorMessage += '\n\n💡 Gợi ý: User profile không tìm thấy. Bạn cần tạo user profile trong Supabase trước. Xem DEBUG_GUIDE.md';
        } else if (errorCode === 'PGRST301' || errorMessage.includes('PGRST301')) {
          errorMessage += '\n\n💡 Gợi ý: RLS policy không cho phép. Hãy chạy SQL script 06-quick-rls-fix.sql';
        } else if (errorMessage.includes('permission denied')) {
          errorMessage += '\n\n💡 Gợi ý: Bạn không có quyền thêm vật tư. Kiểm tra role của user trong Supabase.';
        } else if (errorMessage.includes('invalid syntax')) {
          errorMessage += '\n\n💡 Gợi ý: Dữ liệu không đúng format. Kiểm tra DevTools Console để xem chi tiết.';
        }
      }
      
      alert(`❌ Lỗi lưu vật tu:\n${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {item ? 'Cập nhật Vật tư' : 'Thêm Vật tư mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mã Vật tư</label>
              <input
                type="text"
                name="code"
                required
                value={formData.code}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="VD: VT001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên Vật tư</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="VD: Ống nhựa PVC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đơn vị tính</label>
              <input
                type="text"
                name="unit"
                required
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="VD: Cái, Mét, Hộp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
              <input
                type="text"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="VD: Vật tư nước"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí lưu trữ</label>
              <select
                name="locationId"
                value={formData.locationId || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              >
                <option value="">-- Chọn vị trí (Không bắt buộc) --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.code} - {loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tồn đầu kỳ</label>
              <input
                type="number"
                name="initialStock"
                required
                min="0"
                value={formData.initialStock}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đơn giá (VNĐ)</label>
              <input
                type="number"
                name="unitPrice"
                required
                min="0"
                value={formData.unitPrice}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngưỡng cảnh báo dưới</label>
              <input
                type="number"
                name="warningThresholdLower"
                required
                min="0"
                value={formData.warningThresholdLower}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngưỡng cảnh báo trên</label>
              <input
                type="number"
                name="warningThresholdUpper"
                required
                min="0"
                value={formData.warningThresholdUpper}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày update giá</label>
              <input
                type="date"
                name="priceUpdateDate"
                value={formData.priceUpdateDate || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
              <input
                type="text"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Nhập ghi chú (nếu có)"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Vật tư'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
