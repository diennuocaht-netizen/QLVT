const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/ReconciliationModal.tsx', 'utf8');

const createFromTemplateButton = `
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  onClick={async () => {
                    if (!selectedTemplateIds || selectedTemplateIds.length === 0) {
                      alert('Vui lòng chọn danh sách mẫu trước!');
                      return;
                    }
                    if (!startDate || !endDate) {
                      alert('Vui lòng chọn khoảng thời gian đối soát trước!');
                      return;
                    }
                    setLoading(true);
                    try {
                      const items = allItems.filter(i => selectedTemplateIds.includes(i.id));
                      const slips = await loadAppSlips(startDate, endDate);
                      
                      const newLines = items.map(item => {
                        let appReceipts = 0;
                        let appCompletedIssues = 0;
                        let appPendingIssues = 0;
                        
                        slips.forEach(slip => {
                          const items_array = Array.isArray(slip.items) ? slip.items : [];
                          const slipItem = items_array.find((i: any) => {
                            const idKey = i.itemId ?? i.item_id ?? i.itemId;
                            return idKey === item.id;
                          });
                          
                          if (slipItem) {
                            if (slip.type === SlipType.Receipt && (slip.status === 'Đã hoàn thành' || slip.status === 'Đã đóng')) {
                              appReceipts += (slipItem.quantity || 0);
                            } else if (slip.type === SlipType.Issue) {
                              const completedQty = slipItem.completedQuantity || 0;
                              const isFullyCompleted = slip.isCompleted;
                              if (isFullyCompleted) {
                                appCompletedIssues += (slipItem.quantity || 0);
                              } else {
                                appCompletedIssues += completedQty;
                                appPendingIssues += Math.max(0, (slipItem.quantity || 0) - completedQty);
                              }
                            }
                          }
                        });
                        
                        return {
                          id: crypto.randomUUID(),
                          reconciliation_id: '',
                          item_id: item.id,
                          item: item,
                          bravo_receipts: 0,
                          bravo_issues: 0,
                          bravo_stock: 0,
                          app_receipts: appReceipts,
                          app_completed_issues: appCompletedIssues,
                          app_pending_issues: appPendingIssues,
                          app_stock: 0,
                          physical_stock: 0,
                          notes: 'Từ danh sách mẫu'
                        } as InventoryReconciliationItem;
                      });
                      
                      setReconLines(newLines);
                    } catch(err) {
                      console.error(err);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !selectedTemplateIds}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <FileText size={18} />
                  Tạo phiếu từ Mẫu (Không Excel)
                </button>
              </div>
`;

content = content.replace(
  /<\/div>\s*<div className="flex flex-col space-y-2">/,
  createFromTemplateButton + "\n              <div className=\"flex flex-col space-y-2\">\n"
);

fs.writeFileSync('src/components/inventory/ReconciliationModal.tsx', content, 'utf8');
