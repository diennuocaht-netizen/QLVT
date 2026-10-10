import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, FileText, Scale, Trash2 } from 'lucide-react';
import { supabase } from '../supabase-client';
import { InventoryReconciliation } from '../types/inventory';
import { ReconciliationModal } from '../components/inventory/ReconciliationModal';
import { DetailReconciliationModal } from '../components/inventory/DetailReconciliationModal';
import { useAuth } from '../contexts/AuthContext';

export const InventoryReconciliations: React.FC = () => {
  const [reconciliations, setReconciliations] = useState<InventoryReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReconId, setSelectedReconId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const fetchReconciliations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_reconciliations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReconciliations(data || []);
    } catch (error) {
      console.error('Error fetching reconciliations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa kỳ đối soát này? Dữ liệu không thể khôi phục.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_reconciliations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchReconciliations();
    } catch (error) {
      console.error('Error deleting reconciliation:', error);
      alert('Lỗi khi xóa kỳ đối soát!');
    }
  };

  const filteredReconciliations = reconciliations.filter(recon => {
    const matchesSearch = recon.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || recon.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đối Soát Bravo</h1>
          <p className="text-gray-500 mt-1">Trung tâm đối soát dữ liệu Nhập-Xuất-Tồn với kế toán</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Tạo kỳ đối soát</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm mã đối soát..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-500" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Nháp">Nháp</option>
              <option value="Đã chốt">Đã chốt</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Đang tải dữ liệu đối soát...</p>
        </div>
      ) : filteredReconciliations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scale className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có kỳ đối soát nào</h3>
          <p className="text-gray-500">Tạo kỳ đối soát mới để khớp số liệu với Bravo.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReconciliations.map((recon) => (
            <div
              key={recon.id}
              onClick={() => {
                setSelectedReconId(recon.id);
                setIsDetailModalOpen(true);
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer relative group"
            >
              {isAdmin && (
                <button
                  onClick={(e) => handleDelete(e, recon.id)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa phiếu"
                >
                  <Trash2 size={18} />
                </button>
              )}
              
              <div className="flex items-center justify-between mb-4 pr-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <Scale size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{recon.code}</h3>
                    <p className="text-xs text-gray-500">
                      Tạo bởi {recon.created_by}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  <span>Kỳ: {new Date(recon.start_date).toLocaleDateString('vi-VN')} - {new Date(recon.end_date).toLocaleDateString('vi-VN')}</span>
                </div>
                
                {recon.notes && (
                  <div className="flex items-start text-sm text-gray-600">
                    <FileText size={16} className="mr-2 text-gray-400 mt-0.5" />
                    <span className="line-clamp-2">{recon.notes}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    recon.status === 'Đã chốt' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {recon.status}
                  </span>
                  
                  <span className="text-xs text-gray-500">
                    {recon.created_at ? new Date(recon.created_at).toLocaleDateString('vi-VN') : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ReconciliationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchReconciliations}
        />
      )}

      {isDetailModalOpen && selectedReconId && (
        <DetailReconciliationModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedReconId(null);
          }}
          reconId={selectedReconId}
          onSuccess={fetchReconciliations}
        />
      )}
    </div>
  );
};
