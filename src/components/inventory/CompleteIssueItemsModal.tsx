import React, { useState, useEffect } from 'react';
import { X, Save, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../../supabase-client';
import { InventorySlip } from '../../types/inventory';
import { itemFromDatabase } from '../../utils/dataTransform';

interface CompleteIssueItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: InventorySlip | null;
}

export const CompleteIssueItemsModal: React.FC<CompleteIssueItemsModalProps> = ({ isOpen, onClose, slip }) => {
  const [items, setItems] = useState<any[]>([]);
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && slip) {
      loadItems();
    }
  }, [isOpen, slip]);

  const loadItems = async () => {
    if (!slip) return;
    
    // Extract unique item IDs
    const itemIds = [...new Set(slip.items.map(i => i.itemId))];
    
    if (itemIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .in('id', itemIds);

      if (error) throw error;
      setItems(data.map(itemFromDatabase));

      // Pre-fill completed items
      const initialCompleted = new Set<string>();
      slip.items.forEach((item, index) => {
        if (item.isCompleted) {
          // Use index as a unique key for the slip items since itemId can be duplicate
          initialCompleted.add(`${item.itemId}-${index}`);
        }
      });
      setCompletedItemIds(initialCompleted);

    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const getItemName = (itemId: string) => {
    return items.find(i => i.id === itemId)?.name || 'N/A';
  };
  
  const getItemCode = (itemId: string) => {
    return items.find(i => i.id === itemId)?.code || 'N/A';
  };

  const handleToggleItem = (itemKey: string) => {
    const newSet = new Set(completedItemIds);
    if (newSet.has(itemKey)) {
      newSet.delete(itemKey);
    } else {
      newSet.add(itemKey);
    }
    setCompletedItemIds(newSet);
  };

  const handleToggleAll = () => {
    if (completedItemIds.size === slip?.items.length) {
      setCompletedItemIds(new Set());
    } else {
      const allKeys = new Set(slip?.items.map((i, index) => `${i.itemId}-${index}`));
      setCompletedItemIds(allKeys);
    }
  };

  const handleSave = async () => {
    if (!slip) return;
    setSaving(true);
    try {
      // Create new items array with updated isCompleted flags
      let allCompleted = true;
      const updatedItems = slip.items.map((item, index) => {
        const itemKey = `${item.itemId}-${index}`;
        const isCompleted = completedItemIds.has(itemKey);
        if (!isCompleted) allCompleted = false;
        return { ...item, isCompleted };
      });

      const newStatus = allCompleted ? 'Đã hoàn thành' : slip.status;

      const { error } = await supabase
        .from('inventory_slips')
        .update({ 
          items: updatedItems,
          status: newStatus
        })
        .eq('id', slip.id);

      if (error) throw error;
      
      alert('Cập nhật trạng thái hoàn thành vật tư thành công!');
      onClose();
    } catch (error) {
      console.error('Error saving completion:', error);
      alert('Lỗi cập nhật: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !slip) return null;

  const isAllSelected = slip.items.length > 0 && completedItemIds.size === slip.items.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50">
              <CheckSquare className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Hoàn thành vật tư xuất kho</h2>
              <p className="text-sm text-gray-500">Mã phiếu: {slip.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600 text-sm">
              Đánh dấu các vật tư đã thi công / sử dụng xong để đóng trạng thái.
            </p>
            <button 
              onClick={handleToggleAll}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center w-12">
                    <button onClick={handleToggleAll}>
                      {isAllSelected ? (
                        <CheckSquare className="w-5 h-5 text-teal-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mã</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tên Vật Tư</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Số lượng xuất</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mục đích</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {slip.items.map((item, index) => {
                  const itemKey = `${item.itemId}-${index}`;
                  const isCompleted = completedItemIds.has(itemKey);
                  return (
                    <tr 
                      key={itemKey} 
                      className={`hover:bg-gray-50 cursor-pointer ${isCompleted ? 'bg-teal-50/30' : ''}`}
                      onClick={() => handleToggleItem(itemKey)}
                    >
                      <td className="px-4 py-3 text-center">
                        {isCompleted ? (
                          <CheckSquare className="w-5 h-5 text-teal-600 inline-block" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 inline-block" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{getItemCode(item.itemId)}</td>
                      <td className="px-4 py-3 text-gray-600">{getItemName(item.itemId)}</td>
                      <td className="px-4 py-3 text-right text-gray-900 font-semibold">{item.quantity}</td>
                      <td className="px-4 py-3 text-gray-600">{item.purpose || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? (
              'Đang lưu...'
            ) : (
              <>
                <Save size={20} />
                Lưu xác nhận
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
