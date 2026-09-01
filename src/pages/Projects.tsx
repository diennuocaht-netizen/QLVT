import React, { useState, useMemo, useEffect } from 'react';
import { supabase, subscribeToTable } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Building2, ExternalLink, Edit, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import { ProjectForm } from '../components/projects/ProjectForm';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProjectDetailsModal } from '../components/projects/ProjectDetailsModal';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const fetchProjects = async () => {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const Projects: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [viewingProject, setViewingProject] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';
  const canDelete = profile?.role === 'admin';

  // React Query
  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToTable('projects', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã xóa dự án');
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('Lỗi khi xóa dự án', { description: error.message });
      setDeleteConfirmId(null);
    }
  });

  const filteredProjects = useMemo(() => {
    return projects.filter((project: any) => {
      const matchesSearch = project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus ? project.status === filterStatus : true;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, filterStatus]);

  const calculateWarrantyDays = (dateStr: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const warrantyDate = new Date(dateStr);
    const diffTime = warrantyDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Dự án</h1>
        <div className="flex space-x-3">
          {canEdit && (
            <button 
              onClick={() => { setEditingProject(null); setIsFormOpen(true); }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm dự án
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Tìm kiếm theo mã, tên dự án..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full md:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="completed">Đã kết thúc</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Building2 className="w-12 h-12 text-gray-300 mb-4" />
            <p>Không tìm thấy dự án nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredProjects.map((project: any) => {
              const warrantyDays = calculateWarrantyDays(project.warranty_date);
              const isExpired = warrantyDays !== null && warrantyDays < 0;
              const isWarning = warrantyDays !== null && warrantyDays >= 0 && warrantyDays <= 30;

              return (
                <div key={project.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2
                          ${project.status === 'active' ? 'bg-green-100 text-green-800' : 
                            project.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {project.status === 'active' ? 'Hoạt động' : project.status === 'completed' ? 'Kết thúc' : 'Lưu trữ'}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 border border-gray-200 px-2 py-0.5 rounded bg-gray-50">{project.code}</span>
                      </div>
                    </div>
                    
                    <h3 
                      className="text-lg font-bold text-gray-900 mb-1 cursor-pointer hover:text-indigo-600 line-clamp-2"
                      onClick={() => { setViewingProject(project); setIsDetailsOpen(true); }}
                    >
                      {project.name}
                    </h3>
                    
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Hoàn thành: {project.completion_date}</span>
                      </div>
                      <div className="flex items-center">
                        <ShieldAlert className={`w-4 h-4 mr-2 ${isExpired ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-gray-400'}`} />
                        <span className={`${isExpired ? 'text-red-600 font-medium' : isWarning ? 'text-yellow-600 font-medium' : ''}`}>
                          Bảo hành: {project.warranty_date}
                          {isExpired ? ' (Hết hạn)' : isWarning ? ` (Còn ${warrantyDays} ngày)` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center rounded-b-lg">
                    <div className="text-sm text-gray-500 flex items-center">
                      <Building2 className="w-4 h-4 mr-1" />
                      {project.contacts?.length || 0} Liên hệ
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => { setViewingProject(project); setIsDetailsOpen(true); }}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-md hover:bg-white border border-transparent hover:border-gray-200"
                        title="Xem chi tiết"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button 
                          onClick={() => { setEditingProject(project); setIsFormOpen(true); }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md hover:bg-white border border-transparent hover:border-gray-200"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button 
                          onClick={() => setDeleteConfirmId(project.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-white border border-transparent hover:border-gray-200"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isFormOpen && (
        <ProjectForm 
          project={editingProject} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      {isDetailsOpen && viewingProject && (
        <ProjectDetailsModal
          project={viewingProject}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Xóa dự án"
        message="Bạn có chắc chắn muốn xóa dự án này? Thao tác này không thể hoàn tác."
        onConfirm={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
