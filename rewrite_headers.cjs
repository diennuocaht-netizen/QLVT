const fs = require('fs');

function fixHeader(filename, title, newButton1, newButton2) {
  let content = fs.readFileSync(filename, 'utf8');
  
  // Find the header block. It starts with {/* Header */} and ends before {/* Search */}
  const headerStart = content.indexOf('{/* Header */}');
  const searchStart = content.indexOf('{/* Search */}');
  
  if (headerStart === -1 || searchStart === -1) {
    console.log('Could not find header or search block in ' + filename);
    return;
  }
  
  const beforeHeader = content.substring(0, headerStart);
  const afterHeader = content.substring(searchStart);
  
  let newHeader = `{/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 whitespace-nowrap">${title}</h1>
          <div className="flex gap-2 w-full md:w-auto">
            ${newButton1}
            ${newButton2}
          </div>
        </div>\n\n        `;
        
  fs.writeFileSync(filename, beforeHeader + newHeader + afterHeader, 'utf8');
  console.log('Fixed header in ' + filename);
}

const reqBtn = `<button
              onClick={() => { setEditingRequisition(null); setIsModalOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
            >
              <Plus size={18} /> Tờ Trình Mới
            </button>`;
const exportReqBtn = `<button
              onClick={handleExportExcel}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
            >
              <Download size={18} /> Xuất Excel
            </button>`;
fixHeader('src/pages/InventoryRequisitions.tsx', 'Tờ Trình Xin Cấp Vật Tư', reqBtn, exportReqBtn);

const issueCompleteBtn = `{(profile?.role === 'admin' || profile?.role === 'manager') && (
              <button
                onClick={() => setIsGlobalCompleteModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm"
              >
                <CheckCircle size={18} /> Hoàn Thành
              </button>
            )}`;
const issueNewBtn = `<button
              onClick={() => { setEditingSlip(null); setIsModalOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
            >
              <Plus size={18} /> Thêm Phiếu
            </button>
            <button
              onClick={handleExportExcel}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
            >
              <Download size={18} /> Xuất Excel
            </button>`;
fixHeader('src/pages/InventoryIssues.tsx', 'Phiếu Xuất Kho', issueCompleteBtn, issueNewBtn);

const receiptNewBtn = `<button
              onClick={() => { setEditingSlip(null); setIsModalOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
            >
              <Plus size={18} /> Thêm Phiếu Nhập
            </button>`;
const receiptExportBtn = `<button
              onClick={handleExportExcel}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
            >
              <Download size={18} /> Xuất Excel
            </button>`;
fixHeader('src/pages/InventoryReceipts.tsx', 'Phiếu Nhập Kho', receiptNewBtn, receiptExportBtn);

const auditNewBtn = `<button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
            >
              <Plus size={18} /> Tạo Kiểm Kê
            </button>`;
fixHeader('src/pages/InventoryAudits.tsx', 'Kiểm Kê Kho', auditNewBtn, '');

