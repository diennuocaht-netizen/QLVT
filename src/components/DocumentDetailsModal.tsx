import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Clock, User, Calendar, MessageSquare, Send, Tag, Shield, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface DocumentDetailsModalProps {
  document: any;
  onClose: () => void;
}

export const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = ({ document, onClose }) => {
  const { profile } = useAuth();
  const [equipments, setEquipments] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    if (!document) return;

    const fetchEquipments = async () => {
      if (!document.linked_equipments || document.linked_equipments.length === 0) {
        setEquipments([]);
        return;
      }
      const { data } = await supabase
        .from('measured_equipments')
        .select('id, code, name')
        .in('id', document.linked_equipments);
      if (data) setEquipments(data);
    };

    const fetchComments = async () => {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('document_comments')
        .select('*, users(displayName, email)')
        .eq('document_id', document.id)
        .order('created_at', { ascending: true });
      if (data) setComments(data);
      setLoadingComments(false);
    };

    fetchEquipments();
    fetchComments();
  }, [document]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !profile) return;
    
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .insert([{
          document_id: document.id,
          user_id: profile.id,
          content: newComment.trim()
        }])
        .select('*, users(displayName, email)')
        .single();
        
      if (error) throw error;
      
      setComments([...comments, data]);
      setNewComment('');
    } catch (error: any) {
      toast.error('Lỗi khi gửi bình luận', { description: error.message });
    }
  };

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
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Phân quyền:</dt>
                  <dd className="text-sm col-span-2 flex items-center">
                    <Shield className="w-4 h-4 mr-1 text-gray-400" />
                    {document.access_level === 'internal' ? 'Nội bộ' : 
                     document.access_level === 'restricted' ? 'Hạn chế' : 'Công khai'}
                  </dd>
                </div>
                {document.tags && document.tags.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500 flex items-center"><Tag className="w-4 h-4 mr-1"/>Thẻ:</dt>
                    <dd className="text-sm col-span-2 flex flex-wrap gap-1">
                      {document.tags.map((tag: string, i: number) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {equipments.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500 flex items-center"><LinkIcon className="w-4 h-4 mr-1"/>Máy liên kết:</dt>
                    <dd className="text-sm text-gray-900 col-span-2 flex flex-wrap gap-1">
                      {equipments.map((eq: any, i: number) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {eq.code}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
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

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Thảo luận & Ghi chú
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              {loadingComments ? (
                <p className="text-sm text-gray-500 italic">Đang tải bình luận...</p>
              ) : comments.length > 0 ? (
                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-gray-900">
                          {comment.users?.displayName || comment.users?.email || 'Người dùng ẩn danh'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic mb-4">Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!</p>
              )}
              
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Nhập nội dung thảo luận..."
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || !profile}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Gửi
                </button>
              </form>
            </div>
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
