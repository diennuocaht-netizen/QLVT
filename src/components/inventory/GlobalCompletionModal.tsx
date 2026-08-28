import React, { useState, useEffect } from 'react';
import { X, Save, CheckSquare } from 'lucide-react';
import { supabase } from '../../supabase-client';
import { InventorySlip, InventorySlipItem } from '../../types/inventory';
import { itemFromDatabase, slipFromDatabase } from '../../utils/dataTransform';

interface GlobalCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintReport: (itemsToPrint: any[], sourceSlips: string[]) => void;
}

export const GlobalCompletionModal: React.FC<GlobalCompletionModalProps> = ({ isOpen, onClose, onPrintReport }) => {
  const [slips, setSlips] = useState<InventorySlip[]>([]);
  const [itemsRef, setItemsRef] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Trạng thái lưu trữ số lượng hoàn thành đợt này của người dùng
  const [completionInputs, setCompletionInputs] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      setCompletionInputs({});
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      // Tải các phiếu xuất chưa hoàn thành
      const { data: slipsData, error: slipsError } = await supabase
        .from('inventory_slips')
        .select('*')
        .eq('type', 'Issue')
        .neq('status', 'Đã hoàn thành');

      if (slipsError) throw slipsError;
      
      const loadedSlips = slipsData.map(slipFromDatabase) as InventorySlip[];
      setSlips(loadedSlips);

      // Lấy danh sách ID vật tư để tải tên/mã
      const itemIds = new Set<string>();
      loadedSlips.forEach(slip => {
        slip.items.forEach(item => {
          if ((item.completedQuantity || 0) < item.quantity) {
            itemIds.add(item.itemId);
          }
        });
      });

      if (itemIds.size > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('inventory_items')
          .select('*')
          .in('id', Array.from(itemIds));

        if (itemsError) throw itemsError;
        setItemsRef(itemsData.map(itemFromDatabase));
      }

    } catch (error) {
      console.error('Error loading data:', error);
      alert('Lỗi tải dữ liệu: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getItemName = (itemId: string) => {
    return itemsRef.find(i => i.id === itemId)?.name || 'N/A';
  };
  
  const getItemCode = (itemId: string) => {
    return itemsRef.find(i => i.id === itemId)?.code || 'N/A';
  };

  // Tập hợp tất cả các vật tư chưa hoàn thành từ các phiếu
  const pendingItems = slips.flatMap((slip) => {
    return slip.items
      .map((item, index) => ({
        ...item,
        slipId: slip.id,
        slipCode: slip.code,
        itemIndex: index,
        remainingQty: item.quantity - (item.completedQuantity || 0),
        uniqueKey: `${slip.id}-${index}`
      }))
      .filter(item => item.remainingQty > 0);
  });

  const handleInputChange = (uniqueKey: string, value: string, max: number) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) return;
    
    setCompletionInputs(prev => ({
      ...prev,
      [uniqueKey]: Math.min(numValue, max)
    }));
  };

  const handleToggleMax = (uniqueKey: string, max: number) => {
    setCompletionInputs(prev => {
      const current = prev[uniqueKey] || 0;
      if (current === max) {
        const next = { ...prev };
        delete next[uniqueKey];
        return next;
      }
      return { ...prev, [uniqueKey]: max };
    });
  };

  const handleSave = async () => {
    const keysWithInput = Object.keys(completionInputs).filter(k => completionInputs[k] > 0);
    if (keysWithInput.length === 0) {
      alert('Vui lòng nhập số lượng hoàn thành cho ít nhất một vật tư.');
      return;
    }

    setSaving(true);
    try {
      // Gom nhóm cập nhật theo slipId
      const updatesBySlip: Record<string, InventorySlipItem[]> = {};
      const printItems: any[] = [];
      const sourceSlipCodes = new Set<string>();

      slips.forEach(slip => {
        let hasChangesInSlip = false;
        const updatedItems = [...slip.items];

        updatedItems.forEach((item, index) => {
          const key = `${slip.id}-${index}`;
          if (completionInputs[key] > 0) {
            hasChangesInSlip = true;
            const completedQtyInThisBatch = completionInputs[key];
            item.completedQuantity = (item.completedQuantity || 0) + completedQtyInThisBatch;
            
            // Chuẩn bị dữ liệu để in
            printItems.push({
              ...item,
              quantity: completedQtyInThisBatch, // Số lượng in ra là số lượng vừa hoàn thành
              sourceSlipCode: slip.code
            });
            sourceSlipCodes.add(slip.code);
          }
        });

        if (hasChangesInSlip) {
          updatesBySlip[slip.id] = updatedItems;
        }
      });

      // Gửi request cập nhật lên database
      for (const [slipId, updatedItems] of Object.entries(updatesBySlip)) {
        // Kiểm tra xem phiếu này đã hoàn thành toàn bộ chưa
        const isAllCompleted = updatedItems.every(i => (i.completedQuantity || 0) >= i.quantity);
        const newStatus = isAllCompleted ? 'Đã hoàn thành' : undefined;

        const updateData: any = { items: updatedItems };
        if (newStatus) {
          updateData.status = newStatus;
        }

        const { error } = await supabase
          .from('inventory_slips')
          .update(updateData)
          .eq('id', slipId);

        if (error) throw error;
      }
      
      alert('Cập nhật trạng thái hoàn thành vật tư thành công!');
      onPrintReport(printItems, Array.from(sourceSlipCodes));
      onClose();
    } catch (error) {
      console.error('Error saving completion:', error);
      alert('Lỗi cập nhật: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50">
              <CheckSquare className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tạo Biên Bản Hoàn Thành Tổng Hợp</h2>
              <p className="text-sm text-gray-500">Chọn khối lượng vật tư đã thi công xong từ các phiếu xuất</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {pendingItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Không có vật tư nào đang chờ hoàn thành.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Nguồn (Mã Phiếu)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Mã VT</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Tên Vật Tư</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">SL Xuất</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Đã HT</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Còn lại</th>
                    <th className="px-4 py-3 text-center font-medium text-teal-700 bg-teal-50">Hoàn thành đợt này</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingItems.map((item) => {
                    const inputValue = completionInputs[item.uniqueKey] || '';
                    return (
                      <tr key={item.uniqueKey} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-indigo-600 font-medium">{item.slipCode}</td>
                        <td className="px-4 py-3 text-gray-900">{getItemCode(item.itemId)}</td>
                        <td className="px-4 py-3 text-gray-600">{getItemName(item.itemId)}</td>
                        <td className="px-4 py-3 text-center text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{item.completedQuantity || 0}</td>
                        <td className="px-4 py-3 text-center text-orange-600 font-semibold">{item.remainingQty}</td>
                        <td className="px-4 py-3 text-center bg-teal-50/30">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={item.remainingQty}
                              value={inputValue}
                              onChange={(e) => handleInputChange(item.uniqueKey, e.target.value, item.remainingQty)}
                              className="w-20 px-2 py-1 border border-teal-300 rounded focus:ring-2 focus:ring-teal-500 outline-none text-center font-semibold text-teal-800 bg-white"
                              placeholder="0"
                            />
                            <button
                              onClick={() => handleToggleMax(item.uniqueKey, item.remainingQty)}
                              className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 font-medium"
                              title="Hoàn thành tất cả phần còn lại"
                            >
                              Tối đa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
            disabled={saving || pendingItems.length === 0}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? (
              'Đang xử lý...'
            ) : (
              <>
                <Save size={20} />
                Lưu & In Biên Bản
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
