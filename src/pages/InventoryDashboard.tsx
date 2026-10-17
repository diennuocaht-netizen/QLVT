import React, { useState, useEffect } from 'react';
import { supabase, subscribeToTable } from '../supabase-client';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Item, InventorySlip, SlipType, Requisition, RequisitionStatus } from '../types/inventory';
import { generateRestockSuggestion } from '../services/geminiService';
import { Box, FileText, AlertTriangle, TrendingUp, TrendingDown, Clock, Zap, BarChart2, PieChart as PieChartIcon, Activity, ShoppingCart, Star, SlidersHorizontal, Check } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { MonitoredItemsModal } from '../components/inventory/MonitoredItemsModal';
import { toast } from 'sonner';

type TabType = 'overview' | 'analytics';
export type WarningScope = 'frequently_used' | 'custom_selected' | 'all';

export const InventoryDashboard: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [slips, setSlips] = useState<InventorySlip[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [suggestion, setSuggestion] = useState<string>('');
  const [loadingSuggestion, setLoadingSuggestion] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const [warningScope, setWarningScope] = useState<WarningScope>(() => {
    const saved = localStorage.getItem('inventory_warning_scope');
    return (saved as WarningScope) || 'frequently_used';
  });

  const [monitoredItemIds, setMonitoredItemIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('inventory_monitored_items');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [isMonitoredModalOpen, setIsMonitoredModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsData, slipsData, requisitionsData] = await Promise.all([
          supabase.from('inventory_items').select('*').order('created_at', { ascending: false }).limit(999999),
          supabase.from('inventory_slips').select('*'),
          supabase.from('inventory_requisitions').select('*')
        ]);

        if (itemsData.data) setItems(itemsData.data as Item[]);
        if (slipsData.data) setSlips(slipsData.data as InventorySlip[]);
        if (requisitionsData.data) setRequisitions(requisitionsData.data as Requisition[]);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'inventory_items');
      }
    };

    fetchData();

    const unsubItems = subscribeToTable('inventory_items', fetchData);
    const unsubSlips = subscribeToTable('inventory_slips', fetchData);
    const unsubReqs = subscribeToTable('inventory_requisitions', fetchData);

    return () => {
      unsubItems();
      unsubSlips();
      unsubReqs();
    };
  }, []);

  // Compute inventory state
  const inventoryState = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return items.map(item => {
      let stock = item.initialStock || 0;
      let totalReceipts = 0;
      let totalIssues = 0;
      let issues30d = 0;
      let receipts30d = 0;
      let lastIssueDate: Date | null = null;

      slips.forEach(slip => {
        if (slip.status !== 'Đã đóng' && slip.status !== 'Đã hoàn thành') return;
        
        const slipItem = slip.items.find(i => i.itemId === item.id || (item.code && i.itemCode === item.code));
        if (slipItem) {
          const slipDate = new Date(slip.date);
          if (slip.type === SlipType.Receipt) {
            stock += slipItem.quantity;
            totalReceipts += slipItem.quantity;
            if (slipDate >= thirtyDaysAgo) {
              receipts30d += slipItem.quantity;
            }
          } else if (slip.type === SlipType.Issue) {
            stock -= slipItem.quantity;
            totalIssues += slipItem.quantity;
            if (slipDate >= thirtyDaysAgo) {
              issues30d += slipItem.quantity;
            }
            if (!lastIssueDate || slipDate > lastIssueDate) {
              lastIssueDate = slipDate;
            }
          }
        }
      });

      const velocityPerDay = issues30d / 30;
      const daysToDeplete = velocityPerDay > 0 ? stock / velocityPerDay : Infinity;
      const totalValue = stock * (item.unitPrice || 0);

      // Dead stock logic: Stock > 0 and no issues in the last 90 days
      const isDeadStock = stock > 0 && (!lastIssueDate || lastIssueDate < ninetyDaysAgo);

      return { 
        item, 
        stock, 
        totalReceipts, 
        totalIssues, 
        issues30d, 
        receipts30d,
        velocityPerDay, 
        daysToDeplete,
        totalValue,
        isDeadStock,
        lastIssueDate
      };
    });
  }, [items, slips]);

  const isItemInScope = React.useCallback((inv: typeof inventoryState[0]) => {
    if (warningScope === 'all') return true;
    if (warningScope === 'custom_selected') {
      return monitoredItemIds.has(inv.item.id) || (Boolean(inv.item.code) && monitoredItemIds.has(inv.item.code));
    }
    if (warningScope === 'frequently_used') {
      return inv.issues30d > 0 || inv.totalIssues > 0;
    }
    return true;
  }, [warningScope, monitoredItemIds]);

  const allLowStockItems = React.useMemo(() => {
    return inventoryState.filter(i => i.stock <= (i.item.warningThresholdLower || 0));
  }, [inventoryState]);

  const frequentlyUsedLowStockCount = React.useMemo(() => {
    return allLowStockItems.filter(i => i.issues30d > 0 || i.totalIssues > 0).length;
  }, [allLowStockItems]);

  const monitoredLowStockCount = React.useMemo(() => {
    return allLowStockItems.filter(i => monitoredItemIds.has(i.item.id) || (Boolean(i.item.code) && monitoredItemIds.has(i.item.code))).length;
  }, [allLowStockItems, monitoredItemIds]);

  const lowStockItems = React.useMemo(() => {
    return allLowStockItems.filter(isItemInScope);
  }, [allLowStockItems, isItemInScope]);

  const overStockItems = React.useMemo(() => inventoryState.filter(i => i.stock >= (i.item.warningThresholdUpper || Infinity)), [inventoryState]);

  const depletionWarningItems = React.useMemo(() => {
    return inventoryState
      .filter(i => i.stock > 0 && i.daysToDeplete <= 7 && isItemInScope(i))
      .sort((a, b) => a.daysToDeplete - b.daysToDeplete);
  }, [inventoryState, isItemInScope]);

  const deadStockItems = React.useMemo(() => inventoryState.filter(i => i.isDeadStock).sort((a, b) => b.totalValue - a.totalValue), [inventoryState]);
  const activeItems = React.useMemo(() => inventoryState.filter(i => i.issues30d > 0 || i.receipts30d > 0).sort((a, b) => (b.issues30d + b.receipts30d) - (a.issues30d + a.receipts30d)), [inventoryState]);

  const handleToggleMonitor = (itemId: string, itemCode?: string) => {
    setMonitoredItemIds(prev => {
      const next = new Set(prev);
      const isAlready = next.has(itemId) || (Boolean(itemCode) && next.has(itemCode!));
      if (isAlready) {
        next.delete(itemId);
        if (itemCode) next.delete(itemCode);
        toast.info(`Đã bỏ theo dõi cảnh báo cho vật tư ${itemCode || ''}`);
      } else {
        next.add(itemId);
        toast.success(`Đã thêm vật tư ${itemCode || ''} vào danh sách theo dõi`);
      }
      localStorage.setItem('inventory_monitored_items', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleSaveMonitoredIds = (newIds: Set<string>) => {
    setMonitoredItemIds(newIds);
    localStorage.setItem('inventory_monitored_items', JSON.stringify(Array.from(newIds)));
    toast.success(`Đã lưu ${newIds.size} vật tư vào danh sách theo dõi cảnh báo`);
  };

  const handleScopeChange = (newScope: WarningScope) => {
    setWarningScope(newScope);
    localStorage.setItem('inventory_warning_scope', newScope);
  };
  
  const pendingRequisitions = React.useMemo(() => requisitions.filter(req => {
    const completedItems = req.items?.filter(item => (item.receivedQuantity || 0) >= item.requestedQuantity).length || 0;
    return completedItems < (req.items?.length || 0);
  }).length, [requisitions]);
  const recentSlips = React.useMemo(() => [...slips].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5), [slips]);

  // Analytics Data Preparations
  const totalInventoryValue = inventoryState.reduce((sum, inv) => sum + inv.totalValue, 0);

  const categoryDataMap = new Map<string, number>();
  inventoryState.forEach(inv => {
    const cat = inv.item.category || 'Khác';
    categoryDataMap.set(cat, (categoryDataMap.get(cat) || 0) + inv.totalValue);
  });
  const categoryData = Array.from(categoryDataMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  useEffect(() => {
    const fetchSuggestion = async () => {
      if (lowStockItems.length > 0) {
        setLoadingSuggestion(true);
        const lowItems = lowStockItems.map(i => ({ ...i.item, initialStock: i.stock }));
        const text = await generateRestockSuggestion(lowItems);
        setSuggestion(text);
        setLoadingSuggestion(false);
      }
    };
    fetchSuggestion();
  }, [lowStockItems]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan Vật tư</h1>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <BarChart2 size={16} /> Báo cáo nâng cao
          </button>
        </div>
      </div>
      
      {activeTab === 'overview' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Tổng số loại vật tư</h3>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Box size={24} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{items.length}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 font-medium">Sắp hết hàng</h3>
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <AlertTriangle size={24} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">{lowStockItems.length}</p>
                  {warningScope !== 'all' && (
                    <span className="text-xs text-gray-400 font-normal">
                      / {allLowStockItems.length} mã toàn kho
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between text-xs">
                <span className="text-gray-500 truncate mr-2">
                  {warningScope === 'frequently_used' && '⚡ Vật tư hay sử dụng'}
                  {warningScope === 'custom_selected' && `⭐ Đang theo dõi (${monitoredItemIds.size})`}
                  {warningScope === 'all' && '📦 Toàn bộ kho'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMonitoredModalOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold shrink-0 cursor-pointer"
                >
                  Tùy chọn
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Vượt định mức</h3>
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <TrendingUp size={24} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{overStockItems.length}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Tờ trình chưa hoàn thành</h3>
                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                  <FileText size={24} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{pendingRequisitions}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {depletionWarningItems.length > 0 && (
                <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 overflow-hidden">
                  <div className="p-4 border-b border-red-100 bg-red-100/50 flex items-center gap-2 text-red-800">
                    <Zap size={20} className="text-red-600" />
                    <h2 className="text-lg font-bold">Cảnh báo: Sắp cạn kho (dưới 7 ngày)</h2>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-red-700 mb-4">Dựa trên tốc độ tiêu thụ 30 ngày qua, các vật tư này sẽ cạn kiệt trong vòng chưa tới 7 ngày. Hãy lên Tờ trình mua sắm ngay.</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-red-800 text-sm border-b border-red-200">
                            <th className="p-2 font-medium">Mã</th>
                            <th className="p-2 font-medium">Tên vật tư</th>
                            <th className="p-2 font-medium">Tồn hiện tại</th>
                            <th className="p-2 font-medium">Tốc độ tiêu thụ</th>
                            <th className="p-2 font-medium">Dự kiến hết sau</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {depletionWarningItems.map((inv) => (
                            <tr key={inv.item.id} className="hover:bg-red-100/50">
                              <td className="p-2 text-sm font-medium text-gray-900">{inv.item.code}</td>
                              <td className="p-2 text-sm text-gray-800">{inv.item.name}</td>
                              <td className="p-2 text-sm font-bold text-red-700">{inv.stock} {inv.item.unit}</td>
                              <td className="p-2 text-sm text-gray-700">{inv.velocityPerDay.toFixed(1)} / ngày</td>
                              <td className="p-2 text-sm font-bold text-red-600">{Math.ceil(inv.daysToDeplete)} ngày</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      Vật tư dưới định mức an toàn
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
                        {lowStockItems.length}
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {warningScope === 'frequently_used' && 'Đang hiển thị các vật tư có phát sinh xuất kho trong vận hành'}
                      {warningScope === 'custom_selected' && `Đang lọc theo ${monitoredItemIds.size} vật tư do bạn chọn theo dõi`}
                      {warningScope === 'all' && 'Đang hiển thị toàn bộ vật tư trong kho dưới định mức'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Scope Selector Pills */}
                    <div className="inline-flex bg-gray-100 p-1 rounded-lg text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => handleScopeChange('frequently_used')}
                        className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          warningScope === 'frequently_used'
                            ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Chỉ hiển thị các vật tư có phát sinh xuất kho sử dụng"
                      >
                        <Zap size={13} className={warningScope === 'frequently_used' ? 'fill-emerald-600 text-emerald-600' : ''} />
                        Hay dùng ({frequentlyUsedLowStockCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScopeChange('custom_selected')}
                        className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          warningScope === 'custom_selected'
                            ? 'bg-white text-amber-700 shadow-xs font-semibold'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Chỉ hiển thị các vật tư bạn đã chọn vào danh sách theo dõi"
                      >
                        <Star size={13} className={warningScope === 'custom_selected' ? 'fill-amber-500 text-amber-500' : ''} />
                        Tôi chọn ({monitoredLowStockCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScopeChange('all')}
                        className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          warningScope === 'all'
                            ? 'bg-white text-blue-700 shadow-xs font-semibold'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Hiển thị toàn bộ vật tư trong kho"
                      >
                        Toàn bộ ({allLowStockItems.length})
                      </button>
                    </div>

                    {/* Settings Button */}
                    <button
                      type="button"
                      onClick={() => setIsMonitoredModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                      title="Cài đặt danh sách vật tư theo dõi"
                    >
                      <SlidersHorizontal size={14} />
                      <span className="hidden sm:inline">Cài đặt theo dõi</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-sm">
                        <th className="p-3 font-medium w-12 text-center" title="Theo dõi trọng điểm">⭐</th>
                        <th className="p-4 font-medium">Mã</th>
                        <th className="p-4 font-medium">Tên vật tư</th>
                        <th className="p-4 font-medium">Tồn kho</th>
                        <th className="p-4 font-medium">Ngưỡng dưới</th>
                        <th className="p-4 font-medium">Mức độ dùng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lowStockItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            {warningScope === 'custom_selected' && monitoredItemIds.size === 0 ? (
                              <div className="space-y-2">
                                <p className="font-medium text-gray-700">Bạn chưa chọn vật tư nào vào danh sách theo dõi.</p>
                                <p className="text-xs text-gray-400">Hãy bấm "Cài đặt theo dõi" để tích chọn các vật tư bạn hay sử dụng.</p>
                                <button
                                  type="button"
                                  onClick={() => setIsMonitoredModalOpen(true)}
                                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                                >
                                  <SlidersHorizontal size={13} />
                                  Chọn vật tư theo dõi ngay
                                </button>
                              </div>
                            ) : (
                              <span>Không có vật tư nào dưới định mức an toàn trong phạm vi đã chọn.</span>
                            )}
                          </td>
                        </tr>
                      ) : (
                        lowStockItems.map((inv) => {
                          const isMonitored = monitoredItemIds.has(inv.item.id) || (Boolean(inv.item.code) && monitoredItemIds.has(inv.item.code));
                          return (
                            <tr key={inv.item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleMonitor(inv.item.id, inv.item.code)}
                                  className="p-1 rounded-md hover:bg-amber-50 text-gray-300 hover:text-amber-500 transition-colors cursor-pointer"
                                  title={isMonitored ? "Đang theo dõi - Bấm để bỏ theo dõi" : "Bấm để thêm vào danh sách theo dõi"}
                                >
                                  <Star size={16} className={isMonitored ? "text-amber-500 fill-amber-500" : ""} />
                                </button>
                              </td>
                              <td className="p-4 text-sm font-semibold text-gray-900">
                                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                                  {inv.item.code}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-gray-700 font-medium">
                                <div>{inv.item.name}</div>
                                {inv.item.category && (
                                  <span className="text-[10px] text-gray-400">{inv.item.category}</span>
                                )}
                              </td>
                              <td className="p-4 text-sm font-bold text-red-600">{inv.stock} {inv.item.unit}</td>
                              <td className="p-4 text-sm text-gray-500">{inv.item.warningThresholdLower}</td>
                              <td className="p-4 text-xs">
                                {inv.issues30d > 0 ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    <Zap size={11} className="fill-emerald-600 text-emerald-600" />
                                    Xuất {inv.issues30d} (30 ngày)
                                  </span>
                                ) : inv.totalIssues > 0 ? (
                                  <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                    Đã xuất {inv.totalIssues}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Chưa xuất</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {lowStockItems.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm border border-indigo-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Zap size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-indigo-900">AI Gợi ý Nhập hàng</h2>
                  </div>
                  {loadingSuggestion ? (
                    <div className="flex items-center gap-2 text-indigo-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                      <span>Đang phân tích dữ liệu tồn kho...</span>
                    </div>
                  ) : (
                    <div className="text-indigo-800 whitespace-pre-wrap text-sm leading-relaxed">
                      {suggestion}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Hoạt động gần đây</h2>
                <div className="space-y-4">
                  {recentSlips.map(slip => (
                    <div key={slip.id} className="flex items-start gap-4">
                      <div className={`p-2 rounded-full mt-1 ${slip.type === SlipType.Receipt ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {slip.type === SlipType.Receipt ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {slip.type === SlipType.Receipt ? 'Nhập kho' : 'Xuất kho'} <span className="text-gray-500 font-normal">({slip.code})</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{slip.reason}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <Clock size={12} />
                          <span>{new Date(slip.date).toLocaleDateString('vi-VN')}</span>
                          <span>•</span>
                          <span>{slip.createdBy}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentSlips.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Chưa có hoạt động nào.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Analytics Tab */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-sm p-6 text-white col-span-1 lg:col-span-1">
              <h3 className="text-blue-100 font-medium mb-2">Tổng giá trị tồn kho hiện tại</h3>
              <p className="text-4xl font-bold">{totalInventoryValue.toLocaleString('vi-VN')} đ</p>
              <div className="mt-6 flex items-center gap-2 text-sm text-blue-100 bg-white/10 p-3 rounded-lg">
                <PieChartIcon size={18} />
                <span>Giá trị được tính dựa trên đơn giá và tồn kho hiện thời.</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 col-span-1 lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Cơ cấu giá trị kho theo danh mục</h3>
              <div className="h-[250px] w-full flex items-center justify-center">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => value.toLocaleString('vi-VN') + ' đ'} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500">Chưa có dữ liệu</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={20} />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Báo cáo Vật tư đọng vốn (Dead Stock)</h2>
                <p className="text-sm text-gray-500">Vật tư có số lượng tồn nhưng KHÔNG có bất kỳ phát sinh xuất kho nào trong 90 ngày qua.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-gray-500 text-sm">
                    <th className="p-4 font-medium border-b border-gray-100">Mã</th>
                    <th className="p-4 font-medium border-b border-gray-100">Tên vật tư</th>
                    <th className="p-4 font-medium border-b border-gray-100 text-right">Tồn kho</th>
                    <th className="p-4 font-medium border-b border-gray-100 text-right">Giá trị đọng (VND)</th>
                    <th className="p-4 font-medium border-b border-gray-100 text-right">Ngày xuất cuối</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {deadStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Tuyệt vời! Không có vật tư nào đọng vốn quá 90 ngày.
                      </td>
                    </tr>
                  ) : (
                    deadStockItems.map((inv) => (
                      <tr key={inv.item.id} className="hover:bg-orange-50/50 transition-colors">
                        <td className="p-4 text-sm font-medium text-gray-900">{inv.item.code}</td>
                        <td className="p-4 text-sm text-gray-600">{inv.item.name}</td>
                        <td className="p-4 text-sm font-bold text-gray-700 text-right">{inv.stock} {inv.item.unit}</td>
                        <td className="p-4 text-sm font-bold text-orange-600 text-right">{inv.totalValue.toLocaleString('vi-VN')}</td>
                        <td className="p-4 text-sm text-gray-500 text-right">
                          {inv.lastIssueDate ? inv.lastIssueDate.toLocaleDateString('vi-VN') : 'Chưa từng xuất'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Báo cáo tình hình biến động kho (30 ngày qua)</h2>
                <p className="text-sm text-gray-500">Thống kê lượng xuất nhập của các vật tư có phát sinh giao dịch trong tháng.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-gray-500 text-sm">
                    <th className="p-4 font-medium border-b border-gray-100">Mã</th>
                    <th className="p-4 font-medium border-b border-gray-100">Tên vật tư</th>
                    <th className="p-4 font-medium border-b border-gray-100 text-right">Tồn đầu kỳ</th>
                    <th className="p-4 font-medium border-b border-gray-100 text-right text-green-600">Nhập trong kỳ</th>
                    <th className="p-4 font-medium border-b border-gray-100 text-right text-blue-600">Xuất trong kỳ</th>
                    <th className="p-4 font-medium border-b border-gray-100 text-right">Tồn hiện tại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        Chưa có giao dịch xuất/nhập nào trong 30 ngày qua.
                      </td>
                    </tr>
                  ) : (
                    activeItems.map((inv) => {
                      const initialStock = inv.stock - inv.receipts30d + inv.issues30d;
                      return (
                        <tr key={inv.item.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="p-4 text-sm font-medium text-gray-900">{inv.item.code}</td>
                          <td className="p-4 text-sm text-gray-600">{inv.item.name}</td>
                          <td className="p-4 text-sm text-gray-500 text-right">{initialStock} {inv.item.unit}</td>
                          <td className="p-4 text-sm font-medium text-green-600 text-right">+{inv.receipts30d}</td>
                          <td className="p-4 text-sm font-medium text-blue-600 text-right">-{inv.issues30d}</td>
                          <td className="p-4 text-sm font-bold text-gray-700 text-right">{inv.stock} {inv.item.unit}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-purple-500 shrink-0" size={20} />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Đề xuất mua sắm (Dự trù vật tư)</h2>
                  <p className="text-sm text-gray-500">
                    Danh sách các vật tư dưới mức tồn kho tối thiểu và số lượng cần mua thêm
                    <span className="font-medium text-purple-700 ml-1">
                      ({warningScope === 'frequently_used' ? 'Theo vật tư hay sử dụng' : warningScope === 'custom_selected' ? `Theo ${monitoredItemIds.size} vật tư tôi chọn` : 'Toàn bộ kho'})
                    </span>
                    .
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMonitoredModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                Cài đặt vật tư theo dõi
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-gray-500 text-sm">
                    <th className="p-4 font-medium border-b border-gray-100">Mã</th>
                    <th className="p-4 font-medium border-b border-gray-100">Tên vật tư</th>
                    <th className="p-4 font-medium border-b border-gray-100 text-right text-red-500">Tồn kho hiện tại</th>
                    <th className="p-4 font-medium border-b border-gray-100 text-right">Mức tối thiểu</th>
                    <th className="p-4 font-medium border-b border-gray-100 text-right">Mức tối đa</th>
                    <th className="p-4 font-medium border-b border-gray-100 text-right text-purple-600">Đề xuất mua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        Kho đang ở trạng thái an toàn, không có vật tư nào cần mua sắm thêm.
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.map((inv) => {
                      const suggestBuy = Math.max(0, (inv.item.warningThresholdUpper || inv.item.warningThresholdLower || 0) - inv.stock);
                      return (
                        <tr key={inv.item.id} className="hover:bg-purple-50/50 transition-colors">
                          <td className="p-4 text-sm font-medium text-gray-900">{inv.item.code}</td>
                          <td className="p-4 text-sm text-gray-600">{inv.item.name}</td>
                          <td className="p-4 text-sm font-bold text-red-500 text-right">{inv.stock} {inv.item.unit}</td>
                          <td className="p-4 text-sm text-gray-500 text-right">{inv.item.warningThresholdLower || 0}</td>
                          <td className="p-4 text-sm text-gray-500 text-right">{inv.item.warningThresholdUpper || '-'}</td>
                          <td className="p-4 text-sm font-bold text-purple-600 text-right">+{suggestBuy} {inv.item.unit}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cài đặt vật tư theo dõi cảnh báo */}
      <MonitoredItemsModal
        isOpen={isMonitoredModalOpen}
        onClose={() => setIsMonitoredModalOpen(false)}
        items={items}
        inventoryState={inventoryState}
        monitoredIds={monitoredItemIds}
        onSave={handleSaveMonitoredIds}
      />
    </div>
  );
};
