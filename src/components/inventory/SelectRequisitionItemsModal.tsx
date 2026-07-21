import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Requisition, RequisitionItem, RequisitionItemStatus } from '../../types/inventory';
import { Item } from '../../types/inventory';

interface SelectRequisitionItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: Requisition | null;
  items: Item[];
  onConfirm: (selectedItems: {itemId: string, requisitionItemId: string, quantity: number}[]) => void;
}

export const SelectRequisitionItemsModal: React.FC<SelectRequisitionItemsModalProps> = ({
  isOpen,
  onClose,
  requisition,
  items,
  onConfirm
}) => {
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: {
      originalId: string; // original requisition item id if present
      itemId: string;
      isSelected: boolean;
      quantity: number;
      maxQuantity: number;
    }
  }>({});

  // Initialize selected items when modal opens
  React.useEffect(() => {
    if (isOpen && requisition) {
      const initial: {[key: string]: {originalId: string; itemId: string; isSelected: boolean; quantity: number; maxQuantity: number}} = {};
      requisition.items.forEach((reqItem, idx) => {
        const remainingQuantity = reqItem.requestedQuantity - (reqItem.receivedQuantity || 0);
        // Only include items that actually have remaining quantity to receive
        if (remainingQuantity > 0) {
          // Use index-based key as primary identifier (since item.id may not exist)
          const key = `${requisition.id}-item-${idx}`;
          console.log(`🔑 [SelectRequisitionItemsModal] Item ${idx}: id="${reqItem.id}" -> using key="${key}"`);
          initial[key] = {
            originalId: reqItem.id || `${idx}`, // Use index if id is missing
            itemId: reqItem.itemId,
            isSelected: false,
            quantity: remainingQuantity,
            maxQuantity: remainingQuantity
          };
        }
      });
      setSelectedItems(initial);
    }
  }, [isOpen, requisition]);

  const handleToggleItem = (reqItemId: string) => {
    setSelectedItems(prev => {
      const existing = prev[reqItemId] || { originalId: '', itemId: '', isSelected: false, quantity: 0, maxQuantity: 0 };
      return {
        ...prev,
        [reqItemId]: {
          ...existing,
          isSelected: !existing.isSelected
        }
      };
    });
  };

  const handleQuantityChange = (reqItemId: string, quantity: number) => {
    setSelectedItems(prev => {
      const existing = prev[reqItemId] || { originalId: '', itemId: '', isSelected: false, quantity: 0, maxQuantity: quantity };
      const maxQ = existing.maxQuantity || quantity;
      return {
        ...prev,
        [reqItemId]: {
          ...existing,
          quantity: Math.min(Math.max(0, quantity), maxQ)
        }
      };
    });
  };

  const handleConfirm = () => {
    if (!requisition) return;

    const itemsToAdd = Object.entries(selectedItems)
      .filter(([_, data]) => data.isSelected && data.quantity > 0)
      .map(([key, data]) => {
        console.log(`✅ [SelectRequisitionItemsModal] Confirmed item: key=${key}, originalId=${data.originalId}, itemId=${data.itemId}, quantity=${data.quantity}`);
        return {
          itemId: data.itemId,
          requisitionItemId: data.originalId, // This is either the real id or the index
          quantity: data.quantity
        };
      })
      .filter(item => item.itemId);

    if (itemsToAdd.length === 0) {
      alert('Vui lòng chọn ít nhất một vật tư.');
      return;
    }

    console.log(`📦 [SelectRequisitionItemsModal] Final items to add:`, itemsToAdd);
    onConfirm(itemsToAdd);
    onClose();
  };

  if (!isOpen || !requisition) return null;

  const itemsToDisplay = requisition.items.filter(reqItem => {
    const remainingQuantity = reqItem.requestedQuantity - (reqItem.receivedQuantity || 0);
    return remainingQuantity > 0;
  });

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item ? `${item.code} - ${item.name}` : itemId;
  };

  const getItemUnit = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item?.unit || '-';
  };

  const getItemPrice = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item?.unitPrice || 0;
  };

  const totalValue = itemsToDisplay.reduce((sum, reqItem, idx) => {
    const key = `${requisition.id}-item-${idx}`;
    const entry = selectedItems[key];
    if (entry?.isSelected) {
      return sum + (entry.quantity * getItemPrice(reqItem.itemId));
    }
    return sum;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[90vw] max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chọn Vật tư Nhận</h2>
            <p className="text-sm text-gray-600 mt-1">Tờ trình: {requisition.code} - {requisition.purpose}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {itemsToDisplay.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Tờ trình này không còn vật tư nào cần nhập.</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-sm font-medium text-gray-600 w-12 text-center">
                      <input type="checkbox" disabled className="opacity-50" />
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Mã/Tên Vật tư</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600 w-20">Đơn vị</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right w-24">Yêu cầu</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right w-24">Đã nhập</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right w-32">Còn lại</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right w-32">Nhập lần này</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right w-24">Đơn giá</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right w-28">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {itemsToDisplay.map((reqItem, idx) => {
                    const remainingQuantity = reqItem.requestedQuantity - (reqItem.receivedQuantity || 0);
                    const key = `${requisition.id}-item-${idx}`;
                    const currentQuantity = selectedItems[key]?.quantity || 0;
                    const isSelected = selectedItems[key]?.isSelected || false;
                    const unitPrice = getItemPrice(reqItem.itemId);
                    const totalPrice = isSelected ? currentQuantity * unitPrice : 0;

                    return (
                      <tr key={key} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleItem(key)}
                            className="w-4 h-4 cursor-pointer accent-indigo-600 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {getItemName(reqItem.itemId)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getItemUnit(reqItem.itemId)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                          {reqItem.requestedQuantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {reqItem.receivedQuantity || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">
                          {remainingQuantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <input
                            type="number"
                            min="0"
                            max={remainingQuantity}
                            value={currentQuantity}
                            onChange={(e) => handleQuantityChange(key, Number(e.target.value))}
                            disabled={!isSelected}
                            className={`w-full px-3 py-1.5 border rounded-md text-right font-medium ${
                              isSelected
                                ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none'
                                : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                            }`}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {unitPrice.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-indigo-600">
                          {totalPrice.toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {itemsToDisplay.length > 0 && (
            <div className="mt-6 flex justify-end">
              <div className="bg-indigo-50 px-6 py-3 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-4">
                  <span className="text-indigo-900 font-medium">Tổng giá trị nhập:</span>
                  <span className="text-2xl font-bold text-indigo-700">
                    {totalValue.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors bg-white"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            disabled={!Object.values(selectedItems).some(s => s.isSelected && s.quantity > 0)}
          >
            <Check size={18} />
            <span>Thêm vật tư</span>
          </button>
        </div>
      </div>
    </div>
  );
};
