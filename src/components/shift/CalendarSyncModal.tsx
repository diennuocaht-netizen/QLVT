import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  X,
  Smartphone,
  Globe,
  Download,
  Copy,
  Check,
  Bell,
  Clock,
  ShieldCheck,
  Info,
  ExternalLink,
  Users,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isOwner } from '../../utils/permissions';
import type { ShiftEmployee } from '../../types/shift';
import {
  OWNER_CALENDAR_TOKEN,
  buildCalendarSyncUrls,
} from '../../services/calendarSyncService';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: ShiftEmployee[];
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  employees,
}) => {
  const { profile } = useAuth();
  const isUserOwner = isOwner(profile);

  // Tìm nhân viên tương ứng với Owner (Hoàng Văn Toàn)
  const defaultOwnerEmployee = useMemo(() => {
    return employees.find(
      (e) =>
        e.full_name.toLowerCase().includes('toàn') ||
        e.full_name.toLowerCase().includes('hoàng văn toàn')
    );
  }, [employees]);

  // State cấu hình
  const [targetType, setTargetType] = useState<'owner' | 'specific' | 'all'>('owner');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    defaultOwnerEmployee?.id || (employees[0]?.id || '')
  );
  const [alarmMinutes, setAlarmMinutes] = useState<number>(60);
  const [includeOffDays, setIncludeOffDays] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'apple' | 'google' | 'file'>('apple');

  // Tính toán employeeId truyền vào URL
  const effectiveEmpId = useMemo(() => {
    if (targetType === 'all') return 'all';
    if (targetType === 'owner') return defaultOwnerEmployee?.id || selectedEmpId;
    return selectedEmpId;
  }, [targetType, defaultOwnerEmployee, selectedEmpId]);

  // Tạo URL
  const { httpsUrl, webcalUrl, googleCalendarSubscribeUrl } = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://dnct.vercel.app';
    return buildCalendarSyncUrls({
      baseUrl: origin,
      token: OWNER_CALENDAR_TOKEN,
      employeeId: effectiveEmpId,
      alarmMinutes,
      includeOffDays,
    });
  }, [effectiveEmpId, alarmMinutes, includeOffDays]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadIcs = () => {
    const link = document.createElement('a');
    link.href = httpsUrl;
    link.download = `lich-truc-${effectiveEmpId === 'all' ? 'toan-doi' : 'ca-nhan'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  // Bảo vệ: Chỉ mở cho tài khoản Owner
  if (!isUserOwner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-gray-100">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Quyền truy cập bị giới hạn</h3>
          <p className="text-sm text-gray-600 mb-6">
            Tính năng Đồng bộ Lịch trực (Google Calendar / iPhone iOS) hiện đang được mở thử nghiệm
            dành riêng cho tài khoản <strong>Chủ sở hữu (Owner)</strong>.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors"
          >
            Đã hiểu và đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold">Đồng bộ Lịch Ca Trực</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 rounded-full">
                  Chế độ Owner
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Hiển thị ca trực trên iPhone (iOS) & Google Calendar tự động cập nhật
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Cấu hình đối tượng & Nhắc nhở */}
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <span className="font-semibold text-gray-800 flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-indigo-600" />
                1. Chọn lịch muốn đồng bộ
              </span>
              <span className="text-xs text-gray-500">Tự động làm mới khi đổi ca</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                  targetType === 'owner'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium ring-1 ring-indigo-500'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="targetType"
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  checked={targetType === 'owner'}
                  onChange={() => setTargetType('owner')}
                />
                <span className="text-xs leading-snug">
                  Ca của tôi <br />
                  <span className="text-[11px] text-gray-500 font-normal">
                    {defaultOwnerEmployee?.full_name || 'Hoàng Văn Toàn'}
                  </span>
                </span>
              </label>

              <label
                className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                  targetType === 'specific'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium ring-1 ring-indigo-500'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="targetType"
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  checked={targetType === 'specific'}
                  onChange={() => setTargetType('specific')}
                />
                <span className="text-xs leading-snug">
                  Nhân sự khác <br />
                  <span className="text-[11px] text-gray-500 font-normal">Chọn trong tổ</span>
                </span>
              </label>

              <label
                className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                  targetType === 'all'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium ring-1 ring-indigo-500'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="targetType"
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  checked={targetType === 'all'}
                  onChange={() => setTargetType('all')}
                />
                <span className="text-xs leading-snug">
                  Toàn bộ đơn vị <br />
                  <span className="text-[11px] text-gray-500 font-normal">Tất cả nhân sự</span>
                </span>
              </label>
            </div>

            {targetType === 'specific' && (
              <div className="pt-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chọn nhân viên muốn theo dõi ca trực:
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} {emp.role ? `(${emp.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tùy chọn thông báo và ngày nghỉ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <Bell className="w-3.5 h-3.5 mr-1 text-gray-500" />
                  Nhắc trước khi vào ca:
                </label>
                <select
                  value={alarmMinutes}
                  onChange={(e) => setAlarmMinutes(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={0}>Không cài chuông báo</option>
                  <option value={30}>30 phút trước ca</option>
                  <option value={60}>60 phút trước ca (Khuyên dùng)</option>
                  <option value={90}>90 phút trước ca</option>
                  <option value={120}>2 tiếng trước ca</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center text-xs text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeOffDays}
                    onChange={(e) => setIncludeOffDays(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-2"
                  />
                  <span>Bao gồm cả ngày Nghỉ (OFF / Phép / Lễ)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Chọn nền tảng (Tabs) */}
          <div>
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab('apple')}
                className={`pb-3 px-4 text-xs font-semibold flex items-center border-b-2 transition-all ${
                  activeTab === 'apple'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Smartphone className="w-4 h-4 mr-1.5" />
                iPhone / iPad / Mac (Apple Calendar)
              </button>

              <button
                onClick={() => setActiveTab('google')}
                className={`pb-3 px-4 text-xs font-semibold flex items-center border-b-2 transition-all ${
                  activeTab === 'google'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Globe className="w-4 h-4 mr-1.5" />
                Google Calendar (Android / PC)
              </button>

              <button
                onClick={() => setActiveTab('file')}
                className={`pb-3 px-4 text-xs font-semibold flex items-center border-b-2 transition-all ${
                  activeTab === 'file'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Tải file .ics thủ công
              </button>
            </div>

            {/* TAB 1: APPLE CALENDAR */}
            {activeTab === 'apple' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-center gap-5 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 p-4 rounded-xl border border-indigo-100">
                  {/* QR Code */}
                  <div className="bg-white p-3 rounded-xl shadow-xs border border-gray-200 flex flex-col items-center">
                    <QRCodeSVG
                      value={webcalUrl}
                      size={135}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="text-[10px] text-gray-500 font-medium mt-2">
                      Quét bằng Camera iPhone
                    </span>
                  </div>

                  {/* Nút bấm trực tiếp */}
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        Đăng ký nhanh vào Lịch iPhone / Mac
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        • Nếu đang mở trang này trên iPhone/Mac: Bấm nút bên dưới để mở Lịch và bấm <strong>Đăng ký</strong>.<br />
                        • Nếu đang xem trên máy tính: Mở Camera điện thoại quét mã QR bên cạnh là xong!
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                      <a
                        href={webcalUrl}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center shadow-xs transition-colors"
                      >
                        <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                        Thêm vào Lịch iPhone / Apple
                      </a>

                      <button
                        onClick={() => handleCopy(webcalUrl, 'webcal')}
                        className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium rounded-lg text-xs flex items-center shadow-xs transition-colors"
                      >
                        {copiedType === 'webcal' ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Đã sao chép link
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1 text-gray-500" />
                            Sao chép link webcal
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-2">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Cơ chế tự động:</strong> Khi bạn sửa lịch trên app (và bấm <em>Lưu thay đổi</em>) hoặc khi Google Sheet đồng bộ vào hệ thống, dữ liệu mới sẽ sẵn sàng trên server ngay lập tức.
                    </p>
                  </div>
                  <div className="pl-6 space-y-1 text-blue-800 text-[11px] border-t border-blue-200/60 pt-2">
                    <p className="font-semibold text-blue-950">⚡ Cách xem ngay ca mới trên iPhone mà không cần chờ:</p>
                    <p>• <strong>Cập nhật tức thì:</strong> Mở app Lịch trên iPhone ➔ Bấm chữ <strong>"Lịch"</strong> ở cạnh dưới màn hình ➔ Dùng ngón tay <strong>kéo vuốt từ trên xuống dưới (Pull to refresh)</strong> để iPhone tải lại ngay lập tức.</p>
                    <p>• <strong>Cài đặt tự động kiểm tra nhanh:</strong> Vào <strong>Cài đặt (Settings)</strong> của iPhone ➔ <strong>Lịch (Calendar)</strong> ➔ <strong>Tài khoản (Accounts)</strong> ➔ Chọn lịch ca trực ➔ Mục <strong>Tự động làm mới (Auto-Refresh)</strong>: Chọn <strong>"Mỗi 15 phút"</strong>.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GOOGLE CALENDAR */}
            {activeTab === 'google' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-4 rounded-xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center">
                      <Globe className="w-4 h-4 mr-1.5 text-emerald-600" />
                      Đồng bộ vào Google Calendar (Gmail / Android)
                    </h4>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    Bạn có thể bấm nút mở Google Calendar để tự động thêm, hoặc sao chép đường dẫn bên dưới:
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={httpsUrl}
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-700 select-all focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopy(httpsUrl, 'google_url')}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs flex items-center shadow-xs transition-colors shrink-0"
                    >
                      {copiedType === 'google_url' ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Đã sao chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Sao chép Link
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-1 flex flex-wrap gap-2">
                    <a
                      href={googleCalendarSubscribeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex items-center shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Mở Google Calendar để Thêm Lịch
                    </a>
                  </div>
                </div>

                {/* Hướng dẫn từng bước */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2 text-xs text-gray-700">
                  <div className="font-bold text-gray-800">
                    Cách dán link thủ công trên Google Calendar (nếu cần):
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-gray-600">
                    <li>
                      Mở trang web <strong>calendar.google.com</strong> trên trình duyệt máy tính.
                    </li>
                    <li>
                      Ở cột bên trái, tìm mục <strong>"Lịch khác" (Other calendars)</strong> và bấm dấu <strong>(+)</strong>.
                    </li>
                    <li>
                      Chọn <strong>"Từ URL" (From URL)</strong> ➔ Dán đường dẫn vừa sao chép ở trên vào ➔ Bấm <strong>Thêm lịch</strong>.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* TAB 3: FILE .ICS THỦ CÔNG */}
            {activeTab === 'file' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm">Tải file .ics để lưu lịch thủ công</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Nếu bạn không muốn thiết bị tự động kết nối mạng để làm mới, bạn có thể tải trực tiếp file sự kiện lịch <strong>.ics</strong> này về máy và nhấp đúp để mở bằng Outlook hoặc ứng dụng Lịch của hệ điều hành.
                  </p>

                  <button
                    onClick={handleDownloadIcs}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Tải file lịch (.ics) về máy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chi tiết thông tin ca trực sẽ tạo */}
          <div className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-1">
            <div className="flex items-center font-semibold text-gray-700">
              <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              Khung giờ ca trực chuẩn đã cấu hình:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-gray-100 p-1.5 rounded">
                <strong>Ca M (Sáng):</strong> 06:00 - 14:00
              </div>
              <div className="bg-gray-100 p-1.5 rounded">
                <strong>Ca A (Chiều):</strong> 14:00 - 22:00
              </div>
              <div className="bg-gray-100 p-1.5 rounded">
                <strong>Ca N (Đêm):</strong> 22:00 - 06:00
              </div>
              <div className="bg-gray-100 p-1.5 rounded">
                <strong>Hành chính (AD):</strong> 08:00 - 17:00
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Bảo mật bằng Token xác thực Owner
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg text-xs transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
