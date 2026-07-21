import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { InventorySlip, SlipType, Requisition } from '../types/inventory';
import { Plus, Search, Trash2, CheckCircle, FileText, Edit, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SlipModal } from '../components/inventory/SlipModal';
import { DetailSlipModal } from '../components/inventory/DetailSlipModal';
import { HandoverRecordUploadModal } from '../components/inventory/HandoverRecordUploadModal';
import { useAuth } from '../contexts/AuthContext';
import { slipFromDatabase, requisitionFromDatabase } from '../utils/dataTransform';
import { deleteFromGoogleDrive } from '../utils/googleDriveClient';
export const InventoryReceipts: React.FC = () => {
  const { profile } = useAuth();
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

  // Handler: Called when handover record upload is complete
  const handleUploadComplete = async (handoverRecordUrl: string) => {
    if (!slipToClose) return;

    try {
      console.log('📝 [InventoryReceipts] Updating slip status after upload:', {
        slipId: slipToClose.id,
        status: 'Đã đóng',
        handoverRecordUrl,
      });

      // Update slip in database
      const { error } = await supabase
        .from('inventory_slips')
        .update({
          status: 'Đã đóng',
          handover_record_url: handoverRecordUrl,
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
                handoverRecordUrl,
              }
            : slip
        )
      );

      console.log('✅ [InventoryReceipts] Slip status updated successfully');

      // Apply inventory quantities now that slip is closed
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

      // Close modal
      setIsUploadModalOpen(false);
      setSlipToClose(null);
    } catch (err) {
      console.error('❌ [InventoryReceipts] Error updating slip status:', err);
      alert('Lỗi cập nhật trạng thái phiếu. Vui lòng thử lại.');
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
    if (profile?.role !== 'admin') {
      alert('Chỉ Admin mới có quyền xóa phiếu. Vui lòng liên hệ quản trị viên.');
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

        // Delete from Google Drive if exists
        if (slipToDelete.handover_record_url) {
          try {
            console.log(`🗑️ [InventoryReceipts] Found attached file, attempting to delete from Google Drive...`);
            // Extract fileId from URL like https://drive.google.com/file/d/12345abcde/view?usp=drivesdk
            const match = slipToDelete.handover_record_url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              const fileId = match[1];
              // Fire and forget, don't await. This prevents slip deletion from hanging if Google API hangs/blocks
              deleteFromGoogleDrive(fileId)
                .then(() => console.log(`✅ [InventoryReceipts] Successfully deleted file from Google Drive`))
                .catch(err => console.warn(`⚠️ [InventoryReceipts] Background file deletion failed (safe to ignore):`, err));
              console.log(`✅ [InventoryReceipts] Delete request sent to background`);
            } else {
              console.warn(`⚠️ [InventoryReceipts] Could not extract file ID from URL: ${slipToDelete.handover_record_url}`);
            }
          } catch (err) {
            console.error(`❌ [InventoryReceipts] Error deleting file from Google Drive:`, err);
            // Don't block slip deletion if file deletion fails
          }
        }

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

  const filteredSlips = React.useMemo(() => {
    return slips.filter(slip =>
      slip.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [slips, searchTerm]);

  const handleExportExcel = () => {
    const dataToExport = filteredSlips.map(slip => ({
      'Mã phiếu': slip.code,
      'Ngày nhập': new Date(slip.date).toLocaleDateString('vi-VN'),
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Phiếu Nhập Kho</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingSlip(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} /> Thêm Phiếu Nhập
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={20} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Tìm kiếm theo mã hoặc lý do..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading */}
      {loading && <div className="text-center py-4 text-gray-600">Đang tải dữ liệu...</div>}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Mã Phiếu</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Ngày</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Loại Nhập</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Lý Do</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Số Mặt Hàng</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Trạng Thái</th>
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
                    <td className="px-6 py-4 text-sm text-gray-600">{slip.receipt_type || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{slip.reason || '-'}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700 font-semibold">
                      {(slip.items as any[])?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          slip.status === 'Đã đóng'
                            ? 'bg-green-100 text-green-800'
                            : slip.status === 'Đã hoàn thành'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {slip.status}
                      </span>
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
                        {slip.status === 'Đang mở' && (
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
                        {profile?.role === 'admin' && (
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
