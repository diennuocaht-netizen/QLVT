import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, CheckSquare, Square, Zap, Filter, Star, Check, AlertTriangle } from 'lucide-react';
import { Item } from '../../types/inventory';

interface InventoryItemState {
  item: Item;
  stock: number;
  totalIssues: number;
  issues30d: number;
}

interface MonitoredItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  inventoryState: InventoryItemState[];
  monitoredIds: Set<string>;
  onSave: (newIds: Set<string>) => void;
}

export const MonitoredItemsModal: React.FC<MonitoredItemsModalProps> = ({
  isOpen,
  onClose,
  items,
  inventoryState,
  monitoredIds,
  onSave
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filterMode, setFilterMode] = useState<'all' | 'used' | 'selected' | 'unselected'>('all');

  // Map item id/code to inventory state metrics for quick lookup
  const stateMap = useMemo(() => {
    const map = new Map<string, InventoryItemState>();
    inventoryState.forEach(inv => {
      map.set(inv.item.id, inv);
      if (inv.item.code) map.set(inv.item.code, inv);
    });
    return map;
  }, [inventoryState]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // Sync selectedIds when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(monitoredIds));
      setSearchTerm('');
      setCategoryFilter('all');
      setFilterMode('all');
    }
  }, [isOpen, monitoredIds]);

  const toggleSelect = (itemId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Filter items according to search, category, and usage mode
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const codeMatch = (item.code || '').toLowerCase().includes(lower);
        const nameMatch = (item.name || '').toLowerCase().includes(lower);
        if (!codeMatch && !nameMatch) return false;
      }

      // Category
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // Filter Mode
      const isSelected = selectedIds.has(item.id) || (item.code && selectedIds.has(item.code));
      const inv = stateMap.get(item.id) || stateMap.get(item.code);
      const isUsed = inv && (inv.issues30d > 0 || inv.totalIssues > 0);

      if (filterMode === 'selected' && !isSelected) return false;
      if (filterMode === 'unselected' && isSelected) return false;
      if (filterMode === 'used' && !isUsed) return false;

      return true;
    });
  }, [items, searchTerm, categoryFilter, filterMode, selectedIds, stateMap]);

  // Quick Action: Select all active/used items
  const handleSelectUsedItems = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      items.forEach(item => {
        const inv = stateMap.get(item.id) || stateMap.get(item.code);
        if (inv && (inv.issues30d > 0 || inv.totalIssues > 0)) {
          next.add(item.id);
        }
      });
      return next;
    });
  };

  // Quick Action: Select all currently filtered
  const handleSelectFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredItems.forEach(i => next.add(i.id));
      return next;
    });
  };

  // Quick Action: Clear all
  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Star size={22} className="fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                Cài đặt vật tư theo dõi cảnh báo
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Chỉ những vật tư được tích chọn sẽ xuất hiện trong cảnh báo sắp hết khi chọn chế độ "Tôi theo dõi"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters & Actions Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên vật tư..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-0.5"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả phân loại</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Usage/Selection Filter */}
            <select
              value={filterMode}
              onChange={e => setFilterMode(e.target.value as any)}
              className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-700"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="selected">Đang được chọn ({selectedIds.size})</option>
              <option value="unselected">Chưa chọn</option>
              <option value="used">Vật tư hay sử dụng (Đã xuất)</option>
            </select>
          </div>

          {/* Quick Buttons & Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectUsedItems}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                title="Tự động chọn tất cả vật tư đã từng có phát sinh xuất kho"
              >
                <Zap size={14} className="text-emerald-600 fill-emerald-500" />
                Chọn tất cả vật tư hay dùng
              </button>
              <button
                type="button"
                onClick={handleSelectFiltered}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition-colors"
              >
                Chọn {filteredItems.length} mục đang xem
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-red-50 text-red-600 border border-gray-200 hover:border-red-200 rounded-lg transition-colors"
              >
                Bỏ chọn tất cả
              </button>
            </div>

            <div className="text-xs font-medium text-gray-600">
              Đang chọn: <span className="font-bold text-indigo-600">{selectedIds.size}</span> / {items.length} vật tư
            </div>
          </div>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Không tìm thấy vật tư nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredItems.map(item => {
                const isSelected = selectedIds.has(item.id) || (item.code && selectedIds.has(item.code));
                const inv = stateMap.get(item.id) || stateMap.get(item.code);
                const stock = inv?.stock ?? item.quantity ?? 0;
                const minThreshold = item.warningThresholdLower ?? 0;
                const isLow = stock <= minThreshold;
                const isUsed = inv && (inv.issues30d > 0 || inv.totalIssues > 0);

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div className="shrink-0 text-indigo-600">
                        {isSelected ? (
                          <CheckSquare size={20} className="fill-indigo-600 text-white" />
                        ) : (
                          <Square size={20} className="text-gray-300" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                            {item.code}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {item.name}
                          </span>
                          {item.unit && (
                            <span className="text-xs text-gray-400">({item.unit})</span>
                          )}
                          {item.category && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                          <span>
                            Tồn kho: <strong className={isLow ? 'text-red-600' : 'text-gray-800'}>{stock}</strong> {item.unit}
                          </span>
                          <span>•</span>
                          <span>
                            Ngưỡng an toàn (Min): <strong>{minThreshold}</strong>
                          </span>
                          {isUsed && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                <Zap size={11} className="fill-emerald-600 text-emerald-600" />
                                {inv.issues30d > 0 ? `Xuất ${inv.issues30d} (30 ngày)` : `Đã xuất ${inv.totalIssues}`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isLow && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                          <AlertTriangle size={12} />
                          Dưới định mức
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                        {isSelected ? 'Đang theo dõi' : 'Chọn'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {selectedIds.size === 0 ? (
              <span className="text-amber-600 font-medium">⚠️ Chưa chọn vật tư nào (sẽ không có cảnh báo ở chế độ "Tôi theo dõi")</span>
            ) : (
              <span>Sẽ hiển thị cảnh báo cho <strong>{selectedIds.size}</strong> vật tư này khi chọn chế độ "Tôi theo dõi".</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check size={16} />
              Lưu thiết lập ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
