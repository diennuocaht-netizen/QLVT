import React, { useState, useRef, useMemo, useEffect } from 'react';
import { supabase, subscribeToTable } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, FileText, ExternalLink, Edit, Trash2, Upload, CheckCircle, Eye, Filter, ArrowUpDown, ChevronRight, ChevronDown, FolderOpen } from 'lucide-react';
import { DocumentForm } from '../components/DocumentForm';
import { ConfirmModal } from '../components/ConfirmModal';
import { DocumentDetailsModal } from '../components/DocumentDetailsModal';
import { toast } from 'sonner';
import { useDocumentImport } from '../hooks/useDocumentImport';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

const fetchDocuments = async () => {
  const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const Documents: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Filters
  const [filterSystem, setFilterSystem] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';
  const canDelete = profile?.role === 'admin';
  const canApprove = profile?.role === 'admin' || profile?.role === 'manager';

  // React Query
  const { data: documents = [], isLoading: loading } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
  });

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToTable('documents', () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from('documents').update({
        status: 'active',
        updated_at: new Date().toISOString(),
        updated_by: profile?.id
      }).eq('id', docId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã duyệt tài liệu thành công');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) => {
      toast.error('Có lỗi xảy ra khi duyệt tài liệu', { description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã xóa tài liệu');
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) => {
      toast.error('Lỗi khi xóa tài liệu', { description: error.message });
      setDeleteConfirmId(null);
    }
  });

  const { importDocuments, importing } = useDocumentImport({
    documents,
    profile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importDocuments(file);
  };

  const [filterTag, setFilterTag] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Filtered data
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      // Access Control
      const isPublic = !doc.access_level || doc.access_level === 'public';
      const isManagerOrAdmin = profile?.role === 'admin' || profile?.role === 'manager';
      const isAllowedUser = doc.allowed_users?.includes(profile?.id);
      const isAuthor = doc.author_id === profile?.id;
      
      if (!isPublic && !isManagerOrAdmin && !isAllowedUser && !isAuthor) {
        return false;
      }

      const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.system?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_type?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesSystem = filterSystem ? doc.system === filterSystem : true;
      const matchesType = filterType ? doc.document_type === filterType : true;
      const matchesStatus = filterStatus ? doc.status === filterStatus : true;
      const matchesTag = filterTag ? doc.tags?.includes(filterTag) : true;

      return matchesSearch && matchesSystem && matchesType && matchesStatus && matchesTag;
    });
  }, [documents, searchTerm, filterSystem, filterType, filterStatus, filterTag, profile]);

  // Unique values for filters
  const uniqueSystems = useMemo(() => Array.from(new Set(documents.map(d => d.system).filter(Boolean))), [documents]);
  const uniqueTypes = useMemo(() => Array.from(new Set(documents.map(d => d.document_type).filter(Boolean))), [documents]);
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    documents.forEach(d => {
      if (d.tags && Array.isArray(d.tags)) {
        d.tags.forEach(t => tags.add(t));
      }
    });
    return Array.from(tags);
  }, [documents]);

  const treeData = useMemo(() => {
    const tree: Record<string, Record<string, any[]>> = {};
    filteredDocs.forEach(doc => {
      const sys = doc.system || 'Khác';
      const type = doc.document_type || 'Khác';
      if (!tree[sys]) tree[sys] = {};
      if (!tree[sys][type]) tree[sys][type] = [];
      tree[sys][type].push(doc);
    });
    return tree;
  }, [filteredDocs]);

  // TanStack Table columns
  const columnHelper = createColumnHelper<any>();
  const columns = useMemo(() => [
    columnHelper.accessor('code', {
      header: 'Mã TL',
      cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor('system_code', {
      header: 'Kí Hiệu Hệ',
    }),
    columnHelper.accessor('system', {
      header: 'Hệ',
    }),
    columnHelper.accessor('document_type', {
      header: 'Loại Tài Liệu',
    }),
    columnHelper.accessor('title', {
      header: 'Tên Tài Liệu',
      cell: info => <div className="max-w-xs truncate" title={info.getValue()}>{info.getValue()}</div>,
    }),
    columnHelper.accessor('version', {
      header: 'Lần BH',
    }),
    columnHelper.accessor('issue_date', {
      header: 'Ngày BH',
    }),
    columnHelper.accessor('update_date', {
      header: 'Ngày Cập Nhật',
    }),
    columnHelper.accessor('author_name', {
      header: 'Người Biên Soạn',
    }),
    columnHelper.accessor('status', {
      header: 'Trạng Thái',
      cell: info => {
        const status = info.getValue();
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${status === 'active' ? 'bg-green-100 text-green-800' : 
              status === 'pending' ? 'bg-blue-100 text-blue-800' :
              status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {status === 'active' ? 'Hiệu lực' : 
             status === 'pending' ? 'Chờ duyệt' :
             status === 'draft' ? 'Bản nháp' : 'Lưu trữ'}
          </span>
        );
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Thao Tác</div>,
      cell: info => {
        const doc = info.row.original;
        return (
          <div className="flex justify-end space-x-3">
            <button onClick={() => { setViewingDoc(doc); setIsDetailsOpen(true); }} className="text-gray-600 hover:text-gray-900" title="Xem chi tiết">
              <Eye className="w-4 h-4" />
            </button>
            {canApprove && doc.status === 'pending' && (
              <button onClick={() => approveMutation.mutate(doc.id)} className="text-green-600 hover:text-green-900" title="Duyệt tài liệu">
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            {doc.file_url && (
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900" title="Xem file">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {canEdit && (
              <button onClick={() => { setEditingDoc(doc); setIsFormOpen(true); }} className="text-blue-600 hover:text-blue-900" title="Sửa">
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button onClick={() => setDeleteConfirmId(doc.id)} className="text-red-600 hover:text-red-900" title="Xóa">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    })
  ], [canApprove, canEdit, canDelete]);

  const table = useReactTable({
    data: filteredDocs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tài liệu ISO</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-md flex items-center text-sm font-medium border ${showFilters ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Bộ lọc
          </button>
          
          {canEdit && (
            <>
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center text-sm font-medium disabled:opacity-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                {importing ? 'Đang import...' : 'Import CSV'}
              </button>
              <button 
                onClick={() => { setEditingDoc(null); setIsFormOpen(true); }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm tài liệu
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col space-y-4">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Tìm kiếm theo mã, tên, hệ, loại tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hệ</label>
                <select
                  value={filterSystem}
                  onChange={(e) => setFilterSystem(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Tất cả</option>
                  {uniqueSystems.map((sys: any, i: number) => (
                    <option key={i} value={sys}>{sys}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Loại tài liệu</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Tất cả</option>
                  {uniqueTypes.map((type: any, i: number) => (
                    <option key={i} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Tất cả</option>
                  <option value="active">Hiệu lực</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="draft">Bản nháp</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Thẻ (Tag)</label>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Tất cả</option>
                  {uniqueTags.map((tag: any, i: number) => (
                    <option key={i} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div className="flex justify-end border-t border-gray-100 pt-3">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-indigo-500 ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-900'}`}
              >
                Dạng bảng
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`px-4 py-2 text-sm font-medium border border-l-0 border-gray-200 rounded-r-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-indigo-500 ${viewMode === 'tree' ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-900'}`}
              >
                Cây thư mục
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-300 mb-4" />
            <p>Không tìm thấy tài liệu nào.</p>
          </div>
        ) : (
          <div>
            {viewMode === 'list' ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th 
                              key={header.id} 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <div className="flex items-center gap-1">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {{
                                  asc: <ArrowUpDown className="w-3 h-3 text-indigo-500" />,
                                  desc: <ArrowUpDown className="w-3 h-3 text-indigo-500 transform rotate-180" />,
                                }[header.column.getIsSorted() as string] ?? null}
                              </div>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center text-sm text-gray-500">
                    Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 bg-white min-h-[400px]">
                {Object.keys(treeData).sort().map(sys => (
                  <div key={sys} className="mb-2">
                    <div 
                      className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-md text-indigo-900 font-semibold text-lg"
                      onClick={() => toggleNode(sys)}
                    >
                      {expandedNodes[sys] ? <ChevronDown className="w-5 h-5 mr-2 text-indigo-500" /> : <ChevronRight className="w-5 h-5 mr-2 text-indigo-500" />}
                      <FolderOpen className="w-5 h-5 mr-2 text-indigo-400" />
                      {sys} ({Object.values(treeData[sys]).flat().length} tài liệu)
                    </div>
                    
                    {expandedNodes[sys] && (
                      <div className="ml-8 border-l-2 border-indigo-100 pl-4 mt-1 space-y-2">
                        {Object.keys(treeData[sys]).sort().map(type => {
                          const typeNodeId = `${sys}-${type}`;
                          return (
                            <div key={type} className="mb-1">
                              <div 
                                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-md text-gray-800 font-medium"
                                onClick={() => toggleNode(typeNodeId)}
                              >
                                {expandedNodes[typeNodeId] ? <ChevronDown className="w-4 h-4 mr-2 text-gray-400" /> : <ChevronRight className="w-4 h-4 mr-2 text-gray-400" />}
                                <FolderOpen className="w-4 h-4 mr-2 text-blue-400" />
                                {type} ({treeData[sys][type].length})
                              </div>
                              
                              {expandedNodes[typeNodeId] && (
                                <div className="ml-8 mt-1 space-y-1">
                                  {treeData[sys][type].map((doc: any) => (
                                    <div 
                                      key={doc.id} 
                                      className="flex justify-between items-center p-2 hover:bg-blue-50 cursor-pointer rounded-md border border-transparent hover:border-blue-100 group"
                                    >
                                      <div className="flex items-center flex-1" onClick={() => setViewingDoc(doc)}>
                                        <FileText className="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-500" />
                                        <div>
                                          <span className="font-medium text-gray-900 mr-2">{doc.code}</span>
                                          <span className="text-gray-600">{doc.title}</span>
                                          {doc.access_level === 'internal' && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Nội bộ</span>}
                                          {doc.access_level === 'restricted' && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Bảo mật</span>}
                                        </div>
                                      </div>
                                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setViewingDoc(doc)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        {canEdit && (
                                          <button onClick={() => { setEditingDoc(doc); setIsFormOpen(true); }} className="p-1 text-gray-400 hover:text-indigo-600 rounded">
                                            <Edit className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isFormOpen && (
        <DocumentForm 
          document={editingDoc} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      {isDetailsOpen && viewingDoc && (
        <DocumentDetailsModal
          document={viewingDoc}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác."
        onConfirm={() => {
          if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId);
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
