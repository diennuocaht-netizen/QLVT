import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { formatRelativeTime } from '../utils/notificationService';
import {
  isPushSupported,
  getActivePushSubscription,
  subscribeToPushNotifications,
  sendLocalTestNotification
} from '../utils/pushNotification';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Trash2,
  BellOff,
  ExternalLink,
  Smartphone,
  Check,
  BellRing
} from 'lucide-react';
import clsx from 'clsx';

export const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loading
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [isPushActive, setIsPushActive] = useState<boolean>(false);
  const [pushLoading, setPushLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Check current device push subscription status
      if (isPushSupported()) {
        getActivePushSubscription().then((sub) => setIsPushActive(!!sub));
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const displayedNotifications = notifications.filter((n) => {
    if (filterTab === 'unread') return !n.is_read;
    return true;
  });

  const handleItemClick = (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleEnablePush = async () => {
    setPushLoading(true);
    const res = await subscribeToPushNotifications();
    setPushLoading(false);
    if (res.success) {
      setIsPushActive(true);
      await sendLocalTestNotification();
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleTestPush = async () => {
    await sendLocalTestNotification();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} />
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle size={16} />
          </div>
        );
      case 'success':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Info size={16} />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "relative p-2 rounded-lg transition-colors focus:outline-none",
          isOpen
            ? "bg-indigo-50 text-indigo-700"
            : "text-gray-600 hover:text-indigo-600 hover:bg-gray-100"
        )}
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors hover:underline"
              >
                <CheckCheck size={14} /> Đã đọc tất cả
              </button>
            )}
          </div>

          {/* Web Push Subscription Banner (PWA Mobile & Desktop) */}
          {isPushSupported() && (
            <div className="border-b border-gray-100">
              {!isPushActive ? (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 px-4 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-indigo-900 font-medium">
                    <Smartphone size={16} className="text-indigo-600 shrink-0" />
                    <span>Nhận thông báo khi khóa máy / tắt màn hình</span>
                  </div>
                  <button
                    onClick={handleEnablePush}
                    disabled={pushLoading}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-lg text-[11px] shadow-sm transition-all whitespace-nowrap"
                  >
                    {pushLoading ? 'Đang bật...' : 'Bật ngay'}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50/70 p-2.5 px-4 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-medium flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đã bật thông báo đẩy trên thiết bị này
                  </span>
                  <button
                    onClick={handleTestPush}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                  >
                    Thử nghiệm
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-100 px-4 pt-2 gap-4 text-xs font-semibold text-gray-500">
            <button
              onClick={() => setFilterTab('all')}
              className={clsx(
                "pb-2 border-b-2 transition-colors",
                filterTab === 'all'
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent hover:text-gray-700"
              )}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={clsx(
                "pb-2 border-b-2 transition-colors",
                filterTab === 'unread'
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent hover:text-gray-700"
              )}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Đang tải thông báo...
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <BellOff size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">Không có thông báo nào</p>
                <p className="text-xs text-gray-400 mt-1">
                  {filterTab === 'unread' ? 'Bạn đã đọc hết tất cả thông báo!' : 'Chưa có thông báo nào được gửi.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={clsx(
                    "p-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer group relative",
                    !n.is_read ? "bg-indigo-50/40" : "bg-white"
                  )}
                >
                  {/* Type Icon */}
                  {getTypeIcon(n.type)}

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className={clsx("text-sm truncate", !n.is_read ? "font-bold text-gray-900" : "font-medium text-gray-700")}>
                        {n.title}
                      </p>
                      {n.link && <ExternalLink size={12} className="text-gray-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[11px] text-gray-400 font-normal mt-1 block">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>

                  {/* Unread indicator */}
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                  )}

                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    className="absolute right-2 top-2 p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa thông báo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
