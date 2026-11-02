import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Link,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Settings,
} from 'lucide-react';
import {
  loadGoogleSheetSettings,
  saveGoogleSheetSettings,
  extractSpreadsheetId,
  fetchGoogleSheetWorkbook,
  findMatchingSheetName,
  syncShiftScheduleFromGoogleSheet,
  type GoogleSheetSettings,
  type SyncResult,
} from '../../services/googleSheetShiftSync';
import type { ShiftEmployee, ShiftType } from '../../types/shift';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: number;
  currentYear: number;
  employees: ShiftEmployee[];
  shiftTypes: ShiftType[];
  onSyncSuccess: () => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  currentYear,
  employees,
  shiftTypes,
  onSyncSuccess,
}) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(15);
  const [settingsId, setSettingsId] = useState<string | undefined>();
  const [webhookSecret, setWebhookSecret] = useState('');

  const [testingConnection, setTestingConnection] = useState(false);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [matchedSheetName, setMatchedSheetName] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Load existing settings on open
  useEffect(() => {
    if (!isOpen) return;

    loadGoogleSheetSettings().then((saved) => {
      if (saved) {
        setSheetUrl(saved.sheet_url || '');
        setAutoSync(saved.auto_sync !== false);
        setSyncInterval(saved.sync_interval_minutes || 15);
        setSettingsId(saved.id);
        setWebhookSecret(saved.webhook_secret || crypto.randomUUID());
        setLastSyncedAt(saved.last_synced_at || null);
      } else {
        setWebhookSecret(crypto.randomUUID());
      }
    });

    setSyncResult(null);
    setErrorMessage(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const extractedId = extractSpreadsheetId(sheetUrl);

  const handleTestConnection = async () => {
    if (!extractedId) {
      setErrorMessage('Vui lòng nhập đường link Google Sheet hợp lệ.');
      return;
    }

    setTestingConnection(true);
    setErrorMessage(null);
    setAvailableSheets([]);
    setMatchedSheetName(null);

    try {
      const workbook = await fetchGoogleSheetWorkbook(extractedId);
      const names = workbook.SheetNames || [];
      setAvailableSheets(names);

      const matched = findMatchingSheetName(names, currentMonth, currentYear);
      setMatchedSheetName(matched);

      // Lưu cấu hình
      await saveGoogleSheetSettings({
        id: settingsId,
        sheet_url: sheetUrl.trim(),
        sheet_id: extractedId,
        auto_sync: autoSync,
        sync_interval_minutes: syncInterval,
        webhook_secret: webhookSecret,
      });
    } catch (err: any) {
      console.error('Test connection error:', err);
      setErrorMessage(
        err.message || 'Không thể kết nối với Google Sheet. Vui lòng kiểm tra quyền chia sẻ "Bất kỳ ai có đường liên kết đều có thể xem".'
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const handleExecuteSync = async () => {
    if (!extractedId) {
      setErrorMessage('Vui lòng nhập đường link Google Sheet hợp lệ.');
      return;
    }

    setSyncing(true);
    setErrorMessage(null);
    setSyncResult(null);

    try {
      // Lưu cài đặt trước khi đồng bộ
      await saveGoogleSheetSettings({
        id: settingsId,
        sheet_url: sheetUrl.trim(),
        sheet_id: extractedId,
        auto_sync: autoSync,
        sync_interval_minutes: syncInterval,
        webhook_secret: webhookSecret,
      });

      const res = await syncShiftScheduleFromGoogleSheet(
        extractedId,
        currentMonth,
        currentYear,
        {
          employees,
          shiftTypes,
        }
      );

      setSyncResult(res);
      setLastSyncedAt(new Date().toISOString());
      onSyncSuccess();
    } catch (err: any) {
      console.error('Sync error:', err);
      setErrorMessage(err.message || 'Đồng bộ thất bại. Vui lòng kiểm tra lại cấu trúc file và dữ liệu nhân sự.');
    } finally {
      setSyncing(false);
    }
  };

  const webhookUrl =
    typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
      ? `${window.location.protocol}//${window.location.hostname}/api/shift-schedule-webhook`
      : 'https://dnct.vercel.app/api/shift-schedule-webhook';

  const webhookScriptCode = `/**
 * Google Apps Script tự động kích hoạt đồng bộ lịch phân ca
 * Khi có bất kỳ ai sửa hoặc lưu Google Sheet này
 */
function onChange(e) {
  var webhookUrl = "${webhookUrl}";
  var payload = {
    sheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
    secret: "${webhookSecret || 'your-secret-key'}",
    event: "onChange",
    timestamp: new Date().toISOString()
  };
  
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    var response = UrlFetchApp.fetch(webhookUrl, options);
    Logger.log("Response: " + response.getContentText());
  } catch(err) {
    Logger.log("Webhook error: " + err);
  }
}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(webhookScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-gray-900">
                  Tự động đồng bộ Lịch phân ca từ Google Sheet
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Google Sheet Live
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Kết nối trực tiếp nguồn lịch phân ca từ trang tính Google và tự động cập nhật khi có thay đổi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Status Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Lỗi kết nối / đồng bộ</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {syncResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-sm">Đồng bộ thành công!</p>
                <p className="mt-1 text-emerald-800">{syncResult.message}</p>
                <div className="mt-2 flex items-center gap-3 font-semibold text-[11px] text-emerald-700">
                  <span>📄 Sheet: <strong>{syncResult.sheetName}</strong></span>
                  <span>👥 Nhân sự: <strong>{syncResult.matchedEmployeesCount}</strong></span>
                  <span>📅 Lượt ca: <strong>{syncResult.totalAssignmentsCount}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Google Sheet URL Input */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Link className="w-4 h-4 text-emerald-600" />
                <span>Đường link Google Sheet phân ca</span>
              </label>
              {extractedId && (
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ID: {extractedId.slice(0, 8)}...{extractedId.slice(-6)}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs.../edit"
                className="w-full pl-3.5 pr-24 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || !sheetUrl.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {testingConnection ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                ) : (
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                )}
                <span>Kiểm tra</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-1 pt-1">
              <p>
                ⚠️ Yêu cầu: Mở file Google Sheet &gt; Bấm nút <strong>Chia sẻ (Share)</strong> &gt; Chọn <strong>"Bất kỳ ai có đường liên kết đều có thể xem (Viewer)"</strong>.
              </p>
              {extractedId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${extractedId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:underline inline-flex items-center shrink-0 font-medium"
                >
                  Mở trang tính <ExternalLink size={12} className="ml-1" />
                </a>
              )}
            </div>

            {/* Available Sheets Inspection */}
            {availableSheets.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Các Sheet tìm thấy trong file ({availableSheets.length}):
                  </span>
                  {matchedSheetName && (
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                      Khớp tháng {currentMonth}/{currentYear}: {matchedSheetName}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {availableSheets.map((s) => {
                    const isCurrentMatched = s === matchedSheetName;
                    return (
                      <span
                        key={s}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          isCurrentMatched
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {s}
                        {isCurrentMatched && <Check size={11} className="ml-1" />}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Auto-Sync Settings */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  Cấu hình Tự động đồng bộ
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tự động kiểm tra và nạp lịch mới nhất từ Google Sheet
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {autoSync && (
              <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Tự động cập nhật khi mở trang hoặc chu kỳ định kỳ:</span>
                </div>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(Number(e.target.value))}
                  className="text-xs font-medium border border-gray-300 rounded-md py-1 px-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value={5}>Mỗi 5 phút</option>
                  <option value={10}>Mỗi 10 phút</option>
                  <option value={15}>Mỗi 15 phút</option>
                  <option value={30}>Mỗi 30 phút</option>
                  <option value={60}>Mỗi 1 giờ</option>
                </select>
              </div>
            )}

            {lastSyncedAt && (
              <p className="text-[11px] text-gray-500 pt-1">
                Lần đồng bộ gần nhất: <strong>{new Date(lastSyncedAt).toLocaleString('vi-VN')}</strong>
              </p>
            )}
          </div>

          {/* Section 3: Webhook on Sheet Edit (Instant Realtime) */}
          <div className="border border-indigo-200 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowWebhookGuide(!showWebhookGuide)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-indigo-100/40 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-indigo-950">
                    Cập nhật TỨC THÌ khi có người sửa Google Sheet (Apps Script Webhook)
                  </h4>
                  <p className="text-xs text-indigo-700">
                    Chỉ cần dán 1 đoạn mã nhỏ vào Google Sheet, mỗi khi ai chỉnh sửa thì web app sẽ cập nhật ngay lập tức
                  </p>
                </div>
              </div>
              {showWebhookGuide ? (
                <ChevronUp className="w-5 h-5 text-indigo-600 shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-indigo-600 shrink-0" />
              )}
            </button>

            {showWebhookGuide && (
              <div className="p-4 pt-1 border-t border-indigo-100 space-y-3 text-xs text-indigo-950">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertCircle size={14} className="text-amber-600" />
                    Lưu ý quan trọng về Webhook & localhost:
                  </p>
                  <p className="leading-relaxed">
                    Đoạn script này chạy trên <strong>máy chủ đám mây của Google</strong>. Google ở trên Internet nên <strong>không thể kết nối trực tiếp vào địa chỉ <code>localhost</code></strong> trên máy tính của bạn (sẽ báo lỗi DNS).
                  </p>
                  <p className="leading-relaxed text-amber-800">
                    💡 <strong>Bạn hoàn toàn KHÔNG CẦN Webhook:</strong> Bạn chỉ cần dùng nút <strong>"Đồng bộ ngay"</strong> hoặc bật <strong>"Tự động đồng bộ"</strong> bên trên, mỗi khi mở trang hệ thống sẽ tự động kéo lịch mới nhất từ Google Sheet về mà không cần bất kỳ cài đặt nào trên Google Sheet!
                  </p>
                </div>

                <p className="font-semibold text-indigo-950 pt-1">
                  Nếu bạn đã triển khai hệ thống lên Tên miền công khai (hoặc dùng ngrok/Cloudflare Tunnel):
                </p>

                <ol className="list-decimal list-inside space-y-1.5 font-medium leading-relaxed pl-1">
                  <li>
                    Trên file Google Sheet của bạn, vào menu <strong>Tiện ích mở rộng (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Xóa hết nội dung trong file <code>Code.gs</code> và dán đoạn mã bên dưới vào.
                  </li>
                  <li>
                    Bấm biểu tượng <strong>Đồng hồ (Trình kích hoạt / Triggers)</strong> ở thanh bên trái &gt; Bấm <strong>Thêm trình kích hoạt (Add Trigger)</strong>:
                    <ul className="list-disc list-inside pl-4 text-indigo-800 text-[11px] mt-1 space-y-0.5">
                      <li>Hàm để chạy: <strong>onChange</strong></li>
                      <li>Nguồn sự kiện: <strong>Từ bảng tính (From spreadsheet)</strong></li>
                      <li>Loại sự kiện: <strong>Khi thay đổi (On change)</strong></li>
                    </ul>
                  </li>
                  <li>Bấm Lưu (Save). Kể từ lúc này, mọi chỉnh sửa ca trực trên Sheet sẽ lập tức bắn tín hiệu cập nhật về ứng dụng!</li>
                </ol>

                <div className="relative mt-2">
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-700">
                    {webhookScriptCode}
                  </pre>
                  <button
                    type="button"
                    onClick={copyScriptToClipboard}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold backdrop-blur-xs flex items-center gap-1 transition-colors"
                  >
                    {copiedScript ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiedScript ? 'Đã sao chép!' : 'Sao chép mã'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleExecuteSync}
              disabled={syncing || !extractedId}
              className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang đồng bộ tháng {currentMonth}/{currentYear}...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Đồng bộ ngay Tháng {currentMonth}/{currentYear}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
