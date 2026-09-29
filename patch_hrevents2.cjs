const fs = require('fs');
const file = 'src/pages/HREvents.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldModal = `{isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
              <h2 className="text-xl font-bold mb-4">Tính năng đang xây dựng</h2>
              <p className="text-gray-600 mb-6">Giao diện chi tiết Sự kiện (Modal) sẽ được triển khai ở Giai đoạn 2.</p>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 px-4 py-2 rounded-md font-medium text-gray-800"
              >
                Đóng
              </button>
            </div>
        </div>
      )}`;

const oldModalFallbackRegex = /\{isModalOpen && \([\s\S]*?\}\)\}/;

const newModal = `{isModalOpen && (
        <EventDetailsModal 
          event={editingEvent} 
          onClose={() => setIsModalOpen(false)} 
          onSaved={() => {
             setIsModalOpen(false);
             fetchEvents();
          }}
        />
      )}`;

if (content.includes("Tính năng đang xây dựng")) {
    // let's just find the start of {isModalOpen && ( and replace to the end of the file except the closing div
    const startIndex = content.indexOf("{isModalOpen && (");
    const endIndex = content.lastIndexOf("</div>");
    if (startIndex !== -1 && endIndex !== -1) {
        content = content.substring(0, startIndex) + newModal + "\n    " + content.substring(endIndex);
        fs.writeFileSync(file, content, 'utf8');
        console.log("Successfully replaced modal placeholder!");
    } else {
        console.log("Could not find start/end indices.");
    }
} else {
    console.log("Could not find placeholder string.");
}
