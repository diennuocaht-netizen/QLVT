import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Server, Users, Clock, Edit, Trash, Plus } from 'lucide-react';
import { supabase, subscribeToTable } from '../supabase-client';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    documents: 0,
    devices: 0,
    users: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useEffect(() => {
    // Fetch initial counts
    const fetchStats = async () => {
      try {
        const [docsResponse, devicesResponse, usersResponse] = await Promise.all([
          supabase.from('documents').select('*', { count: 'exact', head: true }),
          supabase.from('devices').select('*', { count: 'exact', head: true }),
          profile?.role === 'admin' ? supabase.from('users').select('*', { count: 'exact', head: true }) : Promise.resolve({ count: 0 })
        ]);
        
        setStats({
          documents: docsResponse.count || 0,
          devices: devicesResponse.count || 0,
          users: usersResponse.count || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();

    // Subscribe to real-time changes
    const unsubDocuments = subscribeToTable('documents', () => {
      fetchStats();
    });

    const unsubDevices = subscribeToTable('devices', () => {
      fetchStats();
    });

    let unsubUsers = () => {};
    if (profile?.role === 'admin') {
      unsubUsers = subscribeToTable('users', () => {
        fetchStats();
      });
    }

    // Fetch recent activities
    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
        // Nếu bảng activity_logs chưa tồn tại, bỏ qua lỗi
      }
    };

    fetchActivities();

    // Subscribe to activity changes
    let unsubActivities = () => {};
    try {
      unsubActivities = subscribeToTable('activity_logs', () => {
        fetchActivities();
      });
    } catch (error) {
      // Bảng activity_logs có thể chưa tồn tại
    }

    return () => {
      unsubDocuments();
      unsubDevices();
      unsubUsers();
    };
  }, [profile]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
      <p className="text-gray-600">Xin chào, {profile?.displayName || profile?.email}! Chào mừng bạn đến với Hệ thống Quản lý ISO & Thiết bị.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tài liệu ISO</p>
            <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Thiết bị</p>
            <p className="text-2xl font-bold text-gray-900">{stats.devices}</p>
          </div>
        </div>
        
        {profile?.role === 'admin' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Người dùng</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Hoạt động gần đây
        </h2>
        
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có hoạt động nào được ghi nhận.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition">
                <div className={`p-2 rounded-lg mr-3 flex-shrink-0 ${
                  activity.action === 'CREATE' ? 'bg-green-100 text-green-600' :
                  activity.action === 'UPDATE' ? 'bg-blue-100 text-blue-600' :
                  activity.action === 'DELETE' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.action === 'CREATE' ? <Plus className="w-4 h-4" /> :
                   activity.action === 'UPDATE' ? <Edit className="w-4 h-4" /> :
                   activity.action === 'DELETE' ? <Trash className="w-4 h-4" /> :
                   <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.user_email} <span className="text-gray-500 font-normal">
                          {activity.action === 'CREATE' ? 'tạo' :
                           activity.action === 'UPDATE' ? 'cập nhật' :
                           activity.action === 'DELETE' ? 'xóa' :
                           'thay đổi'} {activity.entity_name || activity.entity_type}
                        </span>
                      </p>
                      {activity.description && (
                        <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                      )}
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString('vi-VN')}</p>
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedIds(prev => prev.includes(activity.id) ? prev.filter(id => id !== activity.id) : [...prev, activity.id])}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          {expandedIds.includes(activity.id) ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                        </button>
                      </div>
                    </div>
                  </div>
                  {expandedIds.includes(activity.id) && (
                    <div className="mt-3 bg-white border border-gray-100 p-3 rounded text-xs">
                      <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-48">{JSON.stringify(activity.details || activity, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
