import React from 'react';
import { X, ExternalLink, Clock, User, Calendar } from 'lucide-react';

interface DocumentDetailsModalProps {
  document: any;
  onClose: () => void;
}

export const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = ({ document, onClose }) => {
  if (!document) return null;

  const history = document.history || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Chi tiết Tài liệu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Thông tin chung</h3>
              <dl className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Mã tài liệu:</dt>
                  <dd className="text-sm text-gray-900 col-span-2 font-semibold">{document.code}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Tên tài liệu:</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{document.title}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Hệ:</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{document.system} ({document.system_code})</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Loại tài liệu:</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{document.document_type}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Trạng thái:</dt>
                  <dd className="text-sm col-span-2">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${document.status === 'active' ? 'bg-green-100 text-green-800' : 
                        document.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                        document.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {document.status === 'active' ? 'Hiệu lực' : 
                       document.status === 'pending' ? 'Chờ duyệt' :
                       document.status === 'draft' ? 'Bản nháp' : 'Lưu trữ'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Phiên bản hiện tại</h3>
              <dl className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500 flex items-center"><Clock className="w-4 h-4 mr-1"/> Lần ban hành:</dt>
                  <dd className="text-sm text-gray-900 col-span-2 font-semibold">{document.version}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500 flex items-center"><Calendar className="w-4 h-4 mr-1"/> Ngày ban hành:</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{document.issue_date}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500 flex items-center"><Calendar className="w-4 h-4 mr-1"/> Ngày cập nhật:</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{document.update_date}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500 flex items-center"><User className="w-4 h-4 mr-1"/> Người biên soạn:</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{document.author_name}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500 flex items-center"><ExternalLink className="w-4 h-4 mr-1"/> File đính kèm:</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {document.file_url ? (
                      <a href={document.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 underline">
                        Xem tài liệu
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Không có file</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Lịch sử phiên bản</h3>
            {history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phiên bản</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày ban hành</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày cập nhật</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người biên soạn</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((ver: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{ver.version}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{ver.issue_date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{ver.update_date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{ver.author_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {ver.file_url ? (
                            <a href={ver.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-md border border-gray-100">Chưa có lịch sử phiên bản nào cho tài liệu này.</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
