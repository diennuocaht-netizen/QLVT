import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Phone, Mail, Building, User, FileText, Upload, AlertTriangle, Paperclip, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../supabase-client';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentDetailsModal } from '../DocumentDetailsModal';

interface ProjectDetailsModalProps {
  project: any;
  onClose: () => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ project, onClose }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'documents'>('info');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab]);

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .contains('linked_projects', `["${project.id}"]`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  if (!project) return null;

  // Calculate days remaining for warranty
  const calculateWarrantyDays = () => {
    if (!project.warranty_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const warrantyDate = new Date(project.warranty_date);
    const diffTime = warrantyDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const warrantyDays = calculateWarrantyDays();
  const isWarrantyExpired = warrantyDays !== null && warrantyDays < 0;
  const isWarrantyWarning = warrantyDays !== null && warrantyDays >= 0 && warrantyDays <= 30;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
            <p className="text-sm text-gray-500">Mã: {project.code}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center ${activeTab === 'info' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Clock className="w-4 h-4 mr-2" /> Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center ${activeTab === 'contacts' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <User className="w-4 h-4 mr-2" /> Liên hệ ({project.contacts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center ${activeTab === 'documents' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <FileText className="w-4 h-4 mr-2" /> Tài liệu ISO
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 border-b pb-2">Tiến độ & Bảo hành</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ngày hoàn thành</p>
                      <p className="text-base text-gray-900 font-semibold">{project.completion_date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Hết hạn bảo hành</p>
                      <div className="flex items-center">
                        <p className="text-base text-gray-900 font-semibold mr-2">{project.warranty_date}</p>
                        {isWarrantyExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Đã hết hạn
                          </span>
                        ) : isWarrantyWarning ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Còn {warrantyDays} ngày
                          </span>
                        ) : warrantyDays !== null ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Còn {warrantyDays} ngày
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 border-b pb-2">Mô tả dự án</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {project.description || <span className="text-gray-400 italic">Không có mô tả</span>}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-4">
              {project.contacts && project.contacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.contacts.map((contact: any, index: number) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-base font-bold text-gray-900">{contact.name}</h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {contact.role}
                        </span>
                      </div>
                      
                      <div className="mt-2 space-y-2 text-sm text-gray-600 flex-1">
                        {contact.company && (
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2 text-gray-400" />
                            {contact.company}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            <a href={`tel:${contact.phone}`} className="hover:text-indigo-600">{contact.phone}</a>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <a href={`mailto:${contact.email}`} className="hover:text-indigo-600">{contact.email}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Không có thông tin liên hệ cho dự án này.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-8">
              {/* Direct Links (Attachments) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Link tài liệu đính kèm</h3>
                {!project.attachments || project.attachments.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <LinkIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Chưa có link tài liệu nào được thêm trực tiếp vào dự án này.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.attachments.map((att: any, index: number) => (
                      <a 
                        key={index} 
                        href={att.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-indigo-300 transition-all bg-white group"
                      >
                        <div className="p-2 bg-indigo-50 rounded-lg mr-3 group-hover:bg-indigo-100">
                          <LinkIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{att.name}</h4>
                          <p className="text-xs text-gray-500 truncate mt-1">{att.url}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* ISO Documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Tài liệu ISO liên kết</h3>
                {loadingDocs ? (
                  <div className="text-center py-4 text-gray-500">Đang tải tài liệu...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Không có tài liệu ISO nào được liên kết với dự án này.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc: any) => (
                      <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center cursor-pointer hover:text-indigo-600" onClick={() => setViewingDoc(doc)}>
                            <FileText className="w-5 h-5 text-indigo-500 mr-2" />
                            <h4 className="font-semibold text-gray-900">{doc.code}</h4>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 font-medium mb-3 flex-1">{doc.title}</p>
                        
                        <div className="text-xs text-gray-500 space-y-1 mb-4">
                          <p>Hệ: {doc.system}</p>
                          <p>Loại: {doc.document_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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

      {viewingDoc && (
        <DocumentDetailsModal
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
};
