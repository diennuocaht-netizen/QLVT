import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Calendar as CalendarIcon, Plus, MapPin, Clock, Users, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { logActivity } from '../utils/activityLogger';
import { EventDetailsModal } from '../components/hr/EventDetailsModal';

export const HREvents: React.FC = () => {
  const { profile } = useAuth();
  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

    const toggleExpand = (e: React.MouseEvent, eventId: string) => {
      e.stopPropagation();
      setExpandedEvents(prev => {
        const next = new Set(prev);
        if (next.has(eventId)) next.delete(eventId);
        else next.add(eventId);
        return next;
      });
    };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hr_events')
        .select('*, hr_event_tasks(*)')
        .order('start_time', { ascending: false });
        
      if (error && error.code !== '42P01') {
        console.error('Error fetching events:', error);
      }
      
      if (data) {
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(e => 
    (e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (e.location?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Bản nháp';
      case 'upcoming': return 'Sắp diễn ra';
      case 'ongoing': return 'Đang diễn ra';
      case 'completed': return 'Đã hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const openNewModal = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Sự kiện</h1>
          <p className="text-gray-500 text-sm mt-1">Lên kế hoạch, tổ chức và phân công hạng mục sự kiện nội bộ.</p>
        </div>
        {canEdit && (
          <button
            onClick={openNewModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm font-medium transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tạo sự kiện
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm tên sự kiện, địa điểm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center text-gray-700 font-medium">
            <Filter className="w-4 h-4 mr-2" />
            Lọc sự kiện
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Chưa có sự kiện nào. Hãy tạo sự kiện mới để bắt đầu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div 
                key={event.id} 
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer flex flex-col h-full"
                onClick={() => {
                  setEditingEvent(event);
                  setIsModalOpen(true);
                }}
              >
                <div className="h-2 bg-indigo-500"></div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                      {getStatusText(event.status)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                  
                  {
                    (() => {
                      const tasks = event.hr_event_tasks || [];
                      const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
                      const progress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
                      return (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hạng mục ({completedTasks}/{tasks.length})</p>
                            <span className="text-xs font-bold text-indigo-600">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                          <div className="space-y-2 mb-4">
                            {(expandedEvents.has(event.id) ? tasks : tasks.slice(0, 3)).map((t: any) => {
                              let remainingText = '';
                              if (t.deadline && t.status !== 'done') {
                                  const ms = new Date(t.deadline).getTime() - new Date().getTime();
                                  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
                                  if (days < 0) remainingText = 'Quá hạn';
                                  else if (days === 0) remainingText = 'Hôm nay';
                                  else remainingText = `Còn ${days} ngày`;
                              }
                              return (
                                <div key={t.id} className="flex flex-col text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                  <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-2 shrink-0 ${t.status === 'done' ? 'bg-green-500' : t.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                    <span className={`flex-1 truncate ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>{t.title}</span>
                                    {t.assignee_id === profile?.id && t.status !== 'done' && (
                                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ml-2 shrink-0">Của bạn</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 ml-4 mt-1 text-[11px] text-gray-500">
                                    {t.status === 'done' ? <span className="text-green-600 font-medium">Hoàn thành</span> : t.status === 'in_progress' ? <span className="text-blue-600 font-medium">Đang làm</span> : <span>Chưa làm</span>}
                                    {remainingText && <span className={`${remainingText === 'Quá hạn' ? 'text-red-500 font-bold' : remainingText === 'Hôm nay' ? 'text-orange-500 font-bold' : ''}`}>{remainingText}</span>}
                                  </div>
                                </div>
                              );
                            })}
                            {tasks.length > 3 && (
                              <button 
                                onClick={(e) => toggleExpand(e, event.id)}
                                className="flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 mt-2"
                              >
                                {expandedEvents.has(event.id) ? (
                                  <><ChevronUp className="w-3 h-3 mr-1" /> Thu gọn</>
                                ) : (
                                  <><ChevronDown className="w-3 h-3 mr-1" /> Xem tất cả {tasks.length} hạng mục</>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  }
                  <div className="space-y-2 mt-auto pt-3 border-t border-gray-100">
                    <div className="flex items-start text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                      <span>
                        {event.start_time ? new Date(event.start_time).toLocaleDateString('vi-VN') : 'Chưa xếp lịch'} 
                        {event.end_time && ` - ${new Date(event.end_time).toLocaleDateString('vi-VN')}`}
                      </span>
                    </div>
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                      <span className="line-clamp-1">{event.location || 'Chưa xác định địa điểm'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <EventDetailsModal 
          event={editingEvent} 
          onClose={() => setIsModalOpen(false)} 
          onSaved={() => {
             setIsModalOpen(false);
             fetchEvents();
          }}
        />
      )}
    </div>
  );
};
