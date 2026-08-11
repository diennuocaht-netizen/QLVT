import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { InventoryAudit, InventoryLocation, Item, CalculatedInventoryItem, SlipType, InventorySlip } from '../types/inventory';
import { Plus, Search, FileText } from 'lucide-react';
import { AuditModal } from '../components/inventory/AuditModal';

export const InventoryAudits: React.FC = () => {
  const { profile } = useAuth();
  const [audits, setAudits] = useState<InventoryAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Future feature: create audit modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('inventory_audits')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        if (isMounted && data) {
          // Transform if needed
          setAudits(data.map(d => ({
            id: d.id,
            code: d.code,
            date: d.date,
            createdBy: d.created_by,
            status: d.status,
            notes: d.notes,
          })));
        }
      } catch (err) {
        console.error('Error fetching audits:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [isModalOpen]); // Reload audits when modal closes

  const filteredAudits = audits.filter(a => 
    a.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Kiểm Kê Kho</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Tạo Phiếu Kiểm Kê
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã phiếu, ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading && <div className="text-center py-4 text-gray-600">Đang tải dữ liệu...</div>}

      {!loading && (
        <>
        <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto overflow-y-auto max-h-[calc(100vh-240px)]">
          <table className="w-full relative">
            <thead className="bg-gray-100 border-b sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mã Phiếu</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ngày Tạo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Người Tạo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ghi Chú</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Không có phiếu kiểm kê nào
                  </td>
                </tr>
              ) : (
                filteredAudits.map((audit) => (
                  <tr key={audit.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{audit.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(audit.date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{audit.createdBy}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        audit.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {audit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{audit.notes}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Chi tiết">
                        <FileText size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {filteredAudits.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">Không có phiếu kiểm kê nào</div>
          ) : (
            filteredAudits.map((audit) => (
              <div key={audit.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{audit.code}</h3>
                    <p className="text-sm text-gray-500">{new Date(audit.date).toLocaleDateString('vi-VN')} - {audit.createdBy}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    audit.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {audit.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <span className="block text-xs text-gray-400">Ghi chú</span>
                  <span className="font-medium text-gray-800">{audit.notes || '-'}</span>
                </div>
                <div className="flex justify-end gap-2 border-t pt-3">
                  <button className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md" title="Chi tiết">
                    <FileText size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </>
      )}

      <AuditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // data will be reloaded due to useEffect dependency
        }}
      />
    </div>
  );
};
