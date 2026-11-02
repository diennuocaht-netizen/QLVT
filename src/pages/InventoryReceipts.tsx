import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { InventorySlip, SlipType, Requisition } from '../types/inventory';
import { Plus, Search, Trash2, CheckCircle, FileText, Edit, Download, Link as LinkIcon, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SlipModal } from '../components/inventory/SlipModal';
import { DetailSlipModal } from '../components/inventory/DetailSlipModal';
import { HandoverRecordUploadModal } from '../components/inventory/HandoverRecordUploadModal';
import { useAuth } from '../contexts/AuthContext';
import { slipFromDatabase, requisitionFromDatabase } from '../utils/dataTransform';
import { deleteFromGoogleDrive } from '../utils/googleDriveClient';
import { usePermission } from '../hooks/usePermission';
import { AccessDenied } from '../components/AccessDenied';

export const InventoryReceipts: React.FC = () => {
  const { profile } = useAuth();
  const { can } = usePermission();
  const [slips, setSlips] = useState<InventorySlip[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<InventorySlip | null>(null);
  const [detailSlip, setDetailSlip] = useState<InventorySlip | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [slipToClose, setSlipToClose] = useState<InventorySlip | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Handler: Called when handover record upload is complete
  const handleUploadComplete = async (handoverRecordUrl: string) => {
    if (!slipToClose) return;

    const trimmedUrl = handoverRecordUrl?.trim();
    if (!trimmedUrl) {
      alert('Vui lòng nhập đường dẫn liên kết Biên bản nhận vật tư trước khi đóng phiếu.');
      return;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        alert('Đường dẫn không hợp lệ. Vui lòng nhập URL bắt đầu bằng http:// hoặc https://');
        return;
      }
    } catch (_) {
      alert('Đường dẫn không hợp lệ. Vui lòng nhập URL bắt đầu bằng http:// hoặc https://');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      console.log('📝 [InventoryReceipts] Updating slip status after upload:', {
        slipId: slipToClose.id,
        status: 'Đã đóng',
        handoverRecordUrl: trimmedUrl,
      });

      // Update slip in database
      const { error } = await supabase
        .from('inventory_slips')
        .update({
          status: 'Đã đóng',
          handover_record_url: trimmedUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slipToClose.id);

      if (error) throw error;

      // Update local state
      setSlips(prevSlips =>
        prevSlips.map(slip =>
          slip.id === slipToClose.id
            ? {
                ...slip,
                status: 'Đã đóng',
                handoverRecordUrl: trimmedUrl,
              }
            : slip
        )
      );

      console.log('✅ [InventoryReceipts] Slip status updated successfully');

      // Only apply inventory quantities if slip was NOT already closed
      const isFirstTimeClosing = slipToClose.status !== 'Đã đóng';
      if (isFirstTimeClosing) {
        try {
          console.log('📦 [InventoryReceipts] Applying inventory quantities for closed slip:', slipToClose.id);
          for (const slipItem of slipToClose.items || []) {
            if (!slipItem.itemId || !slipItem.quantity) continue;
            try {
              const { data: itemData, error: fetchError } = await supabase
                .from('inventory_items')
                .select('quantity')
                .eq('id', slipItem.itemId)
                .single();

              if (fetchError) {
                console.error(`❌ [InventoryReceipts] Error fetching item ${slipItem.itemId}:`, fetchError);
                throw fetchError;
              }

              const currentQuantity = itemData?.quantity || 0;
              const newQuantity = currentQuantity + slipItem.quantity;

              const { error: updateError } = await supabase
                .from('inventory_items')
                .update({ quantity: newQuantity })
                .eq('id', slipItem.itemId);

              if (updateError) {
                console.error(`❌ [InventoryReceipts] Error updating item ${slipItem.itemId}:`, updateError);
                throw updateError;
              }

              console.log(`✅ [InventoryReceipts] Item ${slipItem.itemId} quantity updated: ${currentQuantity} -> ${newQuantity}`);
            } catch (innerErr) {
              console.error('❌ [InventoryReceipts] Error applying inventory for item:', innerErr);
              // continue to next item
            }
          }
          console.log('✅ [InventoryReceipts] Applied all inventory quantities for slip');
        } catch (invErr) {
          console.error('❌ [InventoryReceipts] Failed to apply inventory quantities for slip:', invErr);
        }
      }

      // Close modal
      setIsUploadModalOpen(false);
      setSlipToClose(null);
    } catch (err) {
      console.error('❌ [InventoryReceipts] Error updating slip status:', err);
      alert('Lỗi cập nhật trạng thái phiếu. Vui lòng thử lại.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handler: Called to close the upload modal
  const handleUploadClose = () => {
    setIsUploadModalOpen(false);
    setSlipToClose(null);
  };

  // Load data and subscribe to real-time changes
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch slips with type='Receipt'
        const { data: slipsData, error: slipsError } = await supabase
          .from('inventory_slips')
          .select('*')
          .eq('type', SlipType.Receipt);

        if (slipsError) throw slipsError;

        if (isMounted && slipsData) {
          const transformedSlips = slipsData.map(slip => slipFromDatabase(slip)) as InventorySlip[];
          setSlips(transformedSlips);
          console.log('✅ [InventoryReceipts] Slips loaded:', transformedSlips.length);
        }

        // Fetch requisitions
        const { data: reqsData, error: reqsError } = await supabase
          .from('inventory_requisitions')
          .select('*');

        if (reqsError) throw reqsError;

        if (isMounted && reqsData) {
          const transformedReqs = reqsData.map(req => requisitionFromDatabase(req)) as Requisition[];
          setRequisitions(transformedReqs);
          console.log('✅ [InventoryReceipts] Requisitions loaded:', transformedReqs.length);
        }

        if (isMounted) {
          console.log('✅ [InventoryReceipts] Initial data load complete');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (isMounted) {
          alert('Lỗi tải dữ liệu: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Subscribe to real-time changes
    const slipsChannel = supabase
      .channel(`inventory_slips_receipt_changes_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_slips', filter: 'type=eq.Receipt' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            const newSlip = slipFromDatabase(payload.new) as InventorySlip;
            setSlips(prev => {
              // Check if slip already exists (deduplication)
              const exists = prev.some(slip => slip.id === newSlip.id);
              if (exists) {
                console.log('⚠️ [InventoryReceipts] Slip already exists, skipping duplicate:', newSlip.id);
                return prev;
              }
              return [...prev, newSlip];
            });
          } else if (payload.eventType === 'UPDATE') {
            setSlips(prev =>
              prev.map(slip => (slip.id === payload.new.id ? (slipFromDatabase(payload.new) as InventorySlip) : slip))
            );
          } else if (payload.eventType === 'DELETE') {
            console.log(`🗑️ [InventoryReceipts] Received DELETE event for slip ${payload.old.id}`);
            setSlips(prev => prev.filter(slip => slip.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const reqChannel = supabase
      .channel(`inventory_requisitions_changes_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_requisitions' }, (payload) => {
        if (!isMounted) return;
        if (payload.eventType === 'INSERT') {
          const newReq = requisitionFromDatabase(payload.new) as Requisition;
          setRequisitions(prev => {
            // Check if requisition already exists (deduplication)
            const exists = prev.some(req => req.id === newReq.id);
            if (exists) {
              console.log('⚠️ [InventoryReceipts] Requisition already exists, skipping duplicate:', newReq.id);
              return prev;
            }
            return [...prev, newReq];
          });
        } else if (payload.eventType === 'UPDATE') {
          setRequisitions(prev =>
            prev.map(req => (req.id === payload.new.id ? (requisitionFromDatabase(payload.new) as Requisition) : req))
          );
        } else if (payload.eventType === 'DELETE') {
          setRequisitions(prev => prev.filter(req => req.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (slipsChannel) supabase.removeChannel(slipsChannel);
      if (reqChannel) supabase.removeChannel(reqChannel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!can('inventory_receipts', 'delete')) {
      alert('Bạn không có quyền xóa phiếu nhập. Vui lòng liên hệ Quản trị viên.');
      return;
    }

    const slipToDelete = slips.find(s => s.id === id);
    const affectedRequisitions = slipToDelete?.requisition_ids
      ? requisitions.filter(r => slipToDelete.requisition_ids?.includes(r.id))
      : [];

    const affectedReqsText = affectedRequisitions.length > 0
      ? `\n\nTờ trình liên quan sẽ được cập nhật (${affectedRequisitions.length}):\n${affectedRequisitions.map(r => `- ${r.code}`).join('\n')}`
      : '';

    if (window.confirm(`Bạn có chắc chắn muốn xóa phiếu "${slipToDelete?.code}"?${affectedReqsText}`)) {
      try {
        if (!slipToDelete) return;

        console.log(`🗑️ [InventoryReceipts] Deleting slip ${slipToDelete.code}...`);

        // Step 1: Rollback receivedQuantity in affected requisitions
        if (slipToDelete.items && slipToDelete.items.length > 0) {
          console.log(`📝 [InventoryReceipts] Rolling back ${slipToDelete.items.length} items...`);
          
          for (const slipItem of slipToDelete.items) {
            if (!slipItem.requisitionId) continue;

            const requisition = requisitions.find(r => r.id === slipItem.requisitionId);
            if (!requisition) continue;

            // Find and update the requisition item
            const updatedItems = requisition.items.map(reqItem => {
              if (reqItem.id === slipItem.requisitionItemId) {
                // Decrease receivedQuantity by the quantity that was in this slip
                const newReceivedQuantity = Math.max(0, reqItem.receivedQuantity - slipItem.quantity);
                
                // Recalculate itemStatus
                let newStatus = 'Chưa nhận đủ';
                if (newReceivedQuantity >= reqItem.requestedQuantity) {
                  newStatus = 'Đã nhận đủ';
                }

                console.log(`  ↩️ Item ${reqItem.itemId}: ${reqItem.receivedQuantity} → ${newReceivedQuantity}`);

                return {
                  ...reqItem,
                  receivedQuantity: newReceivedQuantity,
                  itemStatus: newStatus,
                };
              }
              return reqItem;
            });

            // Recalculate Requisition status based on items
            let newReqStatus = 'Mới tạo';
            const allCompleted = updatedItems.every(i => i.itemStatus === 'Đã nhận đủ');
            const anyReceived = updatedItems.some(i => i.receivedQuantity > 0);

            if (allCompleted) {
              newReqStatus = 'Đã nhập đủ';
            } else if (anyReceived) {
              newReqStatus = 'Đã nhập 1 phần';
            }

            // Update requisition in database
            const { error: reqError } = await supabase
              .from('inventory_requisitions')
              .update({
                items: updatedItems,
                status: newReqStatus,
                updated_at: new Date().toISOString(),
              })
              .eq('id', slipItem.requisitionId);

            if (reqError) {
              console.error(`❌ Error updating requisition ${slipItem.requisitionId}:`, reqError);
              throw reqError;
            }

            console.log(`✅ Requisition ${requisition.code} status: ${newReqStatus}`);
          }
        }

        // Step 2: Rollback inventory quantities (only for closed Receipt slips)
        if (slipToDelete.type === 'Receipt' && slipToDelete.status === 'Đã đóng' && slipToDelete.items && slipToDelete.items.length > 0) {
          console.log(`📦 [InventoryReceipts] Rolling back warehouse quantities...`);
          
          for (const slipItem of slipToDelete.items) {
            if (slipItem.itemId && slipItem.quantity > 0) {
              try {
                console.log(`📉 [InventoryReceipts] Reducing ${slipItem.quantity} from item ${slipItem.itemId}`);
                
                // Fetch current quantity
                const { data: itemData, error: fetchError } = await supabase
                  .from('inventory_items')
                  .select('quantity')
                  .eq('id', slipItem.itemId)
                  .single();
                
                if (fetchError) {
                  console.error(`❌ [InventoryReceipts] Error fetching item ${slipItem.itemId}:`, fetchError);
                  throw fetchError;
                }
                
                // Calculate new quantity
                const currentQuantity = itemData?.quantity || 0;
                const newQuantity = Math.max(0, currentQuantity - slipItem.quantity);
                
                console.log(`   Current: ${currentQuantity}, Reducing: ${slipItem.quantity}, New: ${newQuantity}`);
                
                // Update inventory
                const { error: updateError } = await supabase
                  .from('inventory_items')
                  .update({ quantity: newQuantity })
                  .eq('id', slipItem.itemId);
                
                if (updateError) {
                  console.error(`❌ [InventoryReceipts] Error updating item ${slipItem.itemId}:`, updateError);
                  console.error(`   Error code: ${updateError.code}`);
                  console.error(`   Error message: ${updateError.message}`);
                  console.error(`   Full error:`, JSON.stringify(updateError, null, 2));
                  throw updateError;
                }
                
                // Verify the update by reading back
                const { data: verifyData, error: verifyError } = await supabase
                  .from('inventory_items')
                  .select('quantity')
                  .eq('id', slipItem.itemId)
                  .single();
                
                if (verifyError) {
                  console.warn(`⚠️ [InventoryReceipts] Could not verify item ${slipItem.itemId}:`, verifyError);
                } else {
                  console.log(`🔍 [InventoryReceipts] Verified - Item ${slipItem.itemId} now has quantity: ${verifyData?.quantity}`);
                }
                
                console.log(`✅ [InventoryReceipts] Item ${slipItem.itemId} quantity rolled back to ${newQuantity}`);
              } catch (err) {
                console.error(`❌ [InventoryReceipts] Error processing item ${slipItem.itemId}:`, err);
                throw err;
              }
            }
          }
          console.log(`✅ [InventoryReceipts] All warehouse quantities rolled back`);
        }

        // Skip deleteFromGoogleDrive since we only store links now
        // Step 3: Delete the slip
        const { error } = await supabase
          .from('inventory_slips')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Optimistic update - remove from local state immediately
        console.log(`✅ [InventoryReceipts] Slip ${slipToDelete.code} deleted, updating local state`);
        setSlips(prev => prev.filter(slip => slip.id !== id));

        // Update local requisitions state
        if (slipToDelete.requisition_ids) {
          setRequisitions(prev => 
            prev.map(req => {
              if (slipToDelete.requisition_ids?.includes(req.id)) {
                // Find the rollback versions
                const rollbackReq = affectedRequisitions.find(ar => ar.id === req.id);
                if (rollbackReq) {
                  // Recalculate status for display
                  const allCompleted = rollbackReq.items.every(i => i.itemStatus === 'Đã nhận đủ');
                  const anyReceived = rollbackReq.items.some(i => i.receivedQuantity > 0);
                  let status = 'Mới tạo';
                  if (allCompleted) status = 'Đã nhập đủ';
                  else if (anyReceived) status = 'Đã nhập 1 phần';
                  
                  return { ...rollbackReq, status };
                }
              }
              return req;
            })
          );
        }

        alert('Xóa phiếu thành công. Số lượng đã nhận trong tờ trình được cập nhật lại.');
      } catch (error) {
        console.error('Error deleting slip:', error);
        alert('Lỗi xóa phiếu: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const handleCloseSlip = (slip: InventorySlip) => {
    setSlipToClose(slip);
    setIsUploadModalOpen(true);
  };

  const handleViewDetail = (slip: InventorySlip) => {
    setDetailSlip(slip);
    setIsDetailModalOpen(true);
  };

  const handleEditSlip = (slip: InventorySlip) => {
    setEditingSlip(slip);
    setIsModalOpen(true);
  };

  type SortField = 'date' | 'code' | 'receiptType' | 'reason' | 'itemsCount' | 'status';
  type SortOrder = 'asc' | 'desc';

  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
    );
  };

  const filteredSlips = React.useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const result = slips.filter(slip =>
      slip.code.toLowerCase().includes(search) ||
      (slip.reason && slip.reason.toLowerCase().includes(search)) ||
      (slip.receiptType && slip.receiptType.toLowerCase().includes(search))
    );

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        comparison = timeA - timeB;
      } else if (sortField === 'code') {
        comparison = (a.code || '').localeCompare(b.code || '', 'vi', { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'receiptType') {
        const typeA = a.receiptType || (a as any).receipt_type || '';
        const typeB = b.receiptType || (b as any).receipt_type || '';
        comparison = typeA.localeCompare(typeB, 'vi');
      } else if (sortField === 'reason') {
        comparison = (a.reason || '').localeCompare(b.reason || '', 'vi');
      } else if (sortField === 'itemsCount') {
        const countA = (a.items as any[])?.length || 0;
        const countB = (b.items as any[])?.length || 0;
        comparison = countA - countB;
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '', 'vi');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [slips, searchTerm, sortField, sortOrder]);

  const handleExportExcel = () => {
    const dataToExport = filteredSlips.map(slip => ({
      'Mã phiếu': slip.code,
      'Ngày nhập': new Date(slip.date).toLocaleDateString('vi-VN'),
      'Loại nhập': slip.receiptType || (slip as any).receipt_type || '',
      'Lý do nhập': slip.reason || '',
      'Người yêu cầu': slip.requester || '',
      'Trạng thái': slip.status,
      'Số lượng vật tư': slip.items?.length || 0
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_phieu_nhap");
    XLSX.writeFile(wb, "Danh_sach_phieu_nhap.xlsx");
  };

  if (!can('inventory_receipts', 'view')) {
    return <AccessDenied title="Phiếu Nhập Kho" />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
        <div className="flex justify-between items-start md:items-center gap-3 mb-4 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 whitespace-nowrap">Phiếu Nhập Kho</h1>
          <div className="flex flex-wrap gap-2">
            {can('inventory_receipts', 'create') && (
              <button
                onClick={() => { setEditingSlip(null); setIsModalOpen(true); }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                <Plus size={18} /> Thêm Phiếu Nhập
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
            >
              <Download size={18} /> Xuất Excel
            </button>
          </div>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã phiếu, loại hoặc lý do..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative min-w-[210px] w-full sm:w-auto">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                value={`${sortField}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortField(field as any);
                  setSortOrder(order as any);
                }}
                className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-gray-700 shadow-xs cursor-pointer"
              >
                <option value="date_desc">Ngày: Mới nhất trước</option>
                <option value="date_asc">Ngày: Cũ nhất trước</option>
                <option value="code_asc">Mã phiếu: A → Z</option>
                <option value="code_desc">Mã phiếu: Z → A</option>
                <option value="receiptType_asc">Loại nhập: A → Z</option>
                <option value="reason_asc">Lý do nhập: A → Z</option>
                <option value="itemsCount_desc">Số mặt hàng: Nhiều nhất</option>
                <option value="itemsCount_asc">Số mặt hàng: Ít nhất</option>
                <option value="status_asc">Trạng thái: A → Z</option>
              </select>
            </div>
          </div>
        </div>

      {/* Loading */}
      {loading && <div className="text-center py-4 text-gray-600">Đang tải dữ liệu...</div>}

      {/* Table & Mobile View */}
      {!loading && (
        <>
        <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto overflow-y-auto max-h-[calc(100vh-240px)]">
          <table className="w-full relative">
            <thead className="bg-gray-100 border-b sticky top-0 z-10 shadow-sm">
              <tr>
                <th 
                  onClick={() => handleSort('code')}
                  className="px-6 py-3 text-left text-sm font-semibold cursor-pointer select-none hover:bg-gray-200/80 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Mã Phiếu</span>
                    {renderSortIcon('code')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('date')}
                  className="px-6 py-3 text-left text-sm font-semibold cursor-pointer select-none hover:bg-gray-200/80 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Ngày</span>
                    {renderSortIcon('date')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('receiptType')}
                  className="px-6 py-3 text-left text-sm font-semibold cursor-pointer select-none hover:bg-gray-200/80 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Loại Nhập</span>
                    {renderSortIcon('receiptType')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('reason')}
                  className="px-6 py-3 text-left text-sm font-semibold cursor-pointer select-none hover:bg-gray-200/80 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Lý Do</span>
                    {renderSortIcon('reason')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('itemsCount')}
                  className="px-6 py-3 text-center text-sm font-semibold cursor-pointer select-none hover:bg-gray-200/80 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Số Mặt Hàng</span>
                    {renderSortIcon('itemsCount')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-center text-sm font-semibold cursor-pointer select-none hover:bg-gray-200/80 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Trạng Thái</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Không có phiếu nhập nào
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip) => (
                  <tr key={slip.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{slip.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(slip.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{slip.receiptType || (slip as any).receipt_type || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{slip.reason || '-'}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700 font-semibold">
                      {(slip.items as any[])?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            slip.status === 'Đã đóng'
                              ? slip.handoverRecordUrl
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                              : slip.status === 'Đã hoàn thành'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {slip.status}
                        </span>
                        {slip.status === 'Đã đóng' && !slip.handoverRecordUrl && (
                          <span className="text-[10px] text-amber-600 font-medium whitespace-nowrap">
                            (Thiếu link tài liệu)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleViewDetail(slip)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Xem chi tiết"
                        >
                          <FileText size={18} />
                        </button>
                        {can('inventory_receipts', 'edit') && slip.status === 'Đang mở' && (
                          <>
                            <button
                              onClick={() => handleEditSlip(slip)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleCloseSlip(slip)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Đóng phiếu"
                            >
                              <CheckCircle size={18} />
                            </button>
                          </>
                        )}
                        {slip.status === 'Đã đóng' && !slip.handoverRecordUrl && can('inventory_receipts', 'edit') && (
                          <button
                            onClick={() => handleCloseSlip(slip)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded"
                            title="Bổ sung link tài liệu (Đang thiếu)"
                          >
                            <LinkIcon size={18} />
                          </button>
                        )}
                        {can('inventory_receipts', 'delete') && (
                          <button
                            onClick={() => handleDelete(slip.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden grid grid-cols-1 gap-4 pb-24">
          {filteredSlips.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">Không có phiếu nhập nào</div>
          ) : (
            filteredSlips.map((slip) => (
              <div key={slip.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{slip.code}</h3>
                    <p className="text-sm text-gray-500">{new Date(slip.date).toLocaleDateString('vi-VN')} - {slip.receiptType || (slip as any).receipt_type || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      slip.status === 'Đã đóng'
                        ? slip.handoverRecordUrl
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                        : slip.status === 'Đã hoàn thành'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {slip.status}
                    </span>
                    {slip.status === 'Đã đóng' && !slip.handoverRecordUrl && (
                      <span className="text-[10px] text-amber-600 font-medium">
                        (Thiếu link tài liệu)
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <span className="block text-xs text-gray-400">Lý do</span>
                  <span className="font-medium text-gray-800">{slip.reason || '-'}</span>
                </div>
                <div className="flex justify-end gap-2 border-t pt-3">
                  <button
                    onClick={() => handleViewDetail(slip)}
                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
                    title="Xem chi tiết"
                  >
                    <FileText size={18} />
                  </button>
                  {can('inventory_receipts', 'edit') && slip.status === 'Đang mở' && (
                    <>
                      <button
                        onClick={() => handleEditSlip(slip)}
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md"
                        title="Sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleCloseSlip(slip)}
                        className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-md"
                        title="Đóng phiếu"
                      >
                        <CheckCircle size={18} />
                      </button>
                    </>
                  )}
                  {slip.status === 'Đã đóng' && !slip.handoverRecordUrl && can('inventory_receipts', 'edit') && (
                    <button
                      onClick={() => handleCloseSlip(slip)}
                      className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md"
                      title="Bổ sung link tài liệu"
                    >
                      <LinkIcon size={18} />
                    </button>
                  )}
                  {can('inventory_receipts', 'delete') && (
                    <button
                      onClick={() => handleDelete(slip.id)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </>
      )}

      {/* Modals */}
      <SlipModal
        isOpen={isModalOpen}
        slip={editingSlip}
        type={SlipType.Receipt}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSlip(null);
        }}
      />

      <DetailSlipModal
        isOpen={isDetailModalOpen}
        slip={detailSlip}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailSlip(null);
        }}
      />

      <HandoverRecordUploadModal
        isOpen={isUploadModalOpen}
        slip={slipToClose}
        onUploadComplete={handleUploadComplete}
        onClose={handleUploadClose}
      />
    </div>
  );
};
