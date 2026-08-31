import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, User, Calendar, MapPin, Tag, Info, Activity, Zap, Shield, FileText } from 'lucide-react';
import { Wrench, Settings, Trash2, Edit, Save, Plus, ArrowLeft, PenTool, CheckCircle2, History, AlertCircle, ShieldAlert, Cpu, Layers, Search, Maximize2, Layout, CheckSquare } from 'lucide-react';
import QRCode from 'qrcode.react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { DeviceProfileModal } from './DeviceProfileModal';

interface DeviceDetailsModalProps {
  device: any;
  onClose: () => void;
  focusComponentLabel?: string;
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({ device, onClose, focusComponentLabel }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'components' | 'history' | 'changelog' | 'measurements'>('general');
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  if (!device) return null;

  const subComponents = device.sub_components || [];
  const historyLogs = device.history_logs || [];
  const changeLogs = device.change_logs || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Chi tiết Thiết bị: {device.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 px-6 pt-2">
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 ${activeTab === 'general' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('general')}
          >
            Thông tin chung
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 ${activeTab === 'components' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('components')}
          >
            Thành phần cơ bản / Phụ tải
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('history')}
          >
            Lịch sử bảo trì
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 ${activeTab === 'changelog' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('changelog')}
          >
            Logfile (Lịch sử thay đổi)
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* If a focusComponentLabel was provided, switch to components tab and scroll to it */}
          {focusComponentLabel && (
            <React.Fragment>
              {useEffect(() => {
                setActiveTab('components');
                // Wait for DOM to render
                setTimeout(() => {
                  const key = (focusComponentLabel || '').toString();
                  const el = rowRefs.current[key];
                  if (el && typeof el.scrollIntoView === 'function') {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Flash background
                    el.classList.add('bg-yellow-50');
                    setTimeout(() => el.classList.remove('bg-yellow-50'), 2500);
                  }
                }, 150);
              }, [focusComponentLabel])}
            </React.Fragment>
          )}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center"><Info className="w-5 h-5 mr-2" /> Thông tin cơ bản</h3>
                <dl className="space-y-3">
                  {(() => {
                    const specs = typeof device.specs === 'object' ? device.specs : {};
                    return (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Mã thiết bị:</dt>
                          <dd className="text-sm text-gray-900 col-span-2 font-semibold">{device.code}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Tên thiết bị:</dt>
                          <dd className="text-sm text-gray-900 col-span-2">{device.name}</dd>
                        </div>
                        {specs.type && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Loại thiết bị:</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{specs.type}</dd>
                          </div>
                        )}
                        {specs.origin && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Xuất xứ:</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{specs.origin}</dd>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Vị trí lắp đặt:</dt>
                          <dd className="text-sm text-gray-900 col-span-2 flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400"/> {device.location}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Trạng thái:</dt>
                          <dd className="text-sm col-span-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${device.status === 'active' ? 'bg-green-100 text-green-800' : 
                                device.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}`}>
                              {device.status === 'active' ? 'Hoạt động' : device.status === 'maintenance' ? 'Bảo trì' : 'Ngưng hoạt động'}
                            </span>
                          </dd>
                        </div>
                      </>
                    );
                  })()}
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center"><Activity className="w-5 h-5 mr-2" /> Thông số kỹ thuật & Quản lý</h3>
                <dl className="space-y-3">
                  {(() => {
                    // Extract specs if exists
                    const specs = typeof device.specs === 'object' ? device.specs : {};
                    
                    return (
                      <>
                        {specs.type && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Loại thiết bị:</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{specs.type}</dd>
                          </div>
                        )}
                        {specs.origin && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Xuất xứ:</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{specs.origin}</dd>
                          </div>
                        )}
                        {specs.manager && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Nhân viên quản lý:</dt>
                            <dd className="text-sm text-gray-900 col-span-2 flex items-center"><User className="w-4 h-4 mr-1 text-gray-400"/> {specs.manager}</dd>
                          </div>
                        )}
                        {specs.contactInfo && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Thông tin liên hệ:</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{specs.contactInfo}</dd>
                          </div>
                        )}
                        {specs.measuringElement && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Phần tử đo lường:</dt>
                            <dd className="text-sm text-gray-900 col-span-2 flex items-center"><Activity className="w-4 h-4 mr-1 text-gray-400"/> {specs.measuringElement}</dd>
                          </div>
                        )}
                        {specs.protectionElement && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Phần tử bảo vệ:</dt>
                            <dd className="text-sm text-gray-900 col-span-2 flex items-center"><Shield className="w-4 h-4 mr-1 text-gray-400"/> {specs.protectionElement}</dd>
                          </div>
                        )}
                        {specs.poweredFrom && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Cấp nguồn từ:</dt>
                            <dd className="text-sm text-gray-900 col-span-2 flex items-center"><Zap className="w-4 h-4 mr-1 text-yellow-500"/> {specs.poweredFrom}</dd>
                          </div>
                        )}
                        {specs.powersTo && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Cấp nguồn cho:</dt>
                            <dd className="text-sm text-gray-900 col-span-2 flex items-center"><Zap className="w-4 h-4 mr-1 text-blue-500"/> {specs.powersTo}</dd>
                          </div>
                        )}
                        {specs.installationDate && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Ngày lắp đặt:</dt>
                            <dd className="text-sm text-gray-900 col-span-2 flex items-center"><Calendar className="w-4 h-4 mr-1 text-gray-400"/> {specs.installationDate}</dd>
                          </div>
                        )}
                        {specs.usageDate && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Ngày sử dụng:</dt>
                            <dd className="text-sm text-gray-900 col-span-2 flex items-center"><Calendar className="w-4 h-4 mr-1 text-gray-400"/> {specs.usageDate}</dd>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </dl>
              </div>

              <div className="col-span-1 md:col-span-2 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center"><FileText className="w-5 h-5 mr-2" /> Thông số kỹ thuật chi tiết</h3>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  {!device.specs || (typeof device.specs === 'object' && Object.keys(device.specs).length === 0) ? (
                    <p className="text-sm text-gray-500">Không có thông tin</p>
                  ) : typeof device.specs === 'string' ? (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{device.specs}</p>
                  ) : (
                    <pre className="text-sm text-gray-800 bg-white p-2 rounded border border-gray-300 overflow-auto max-h-64">
                      {JSON.stringify(device.specs, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'components' && (
            <div>
              {subComponents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhãn</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên MCB</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hãng/Model</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pha/Cực</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dòng ĐM</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icu/Ics</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điện áp</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cấp nguồn từ</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cấp nguồn cho</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vị trí</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subComponents.map((comp: any) => (
                        <tr
                          key={comp.id}
                          ref={(el) => { if (comp.label) rowRefs.current[comp.label] = el; }}
                          className={`hover:bg-gray-50 ${focusComponentLabel && (focusComponentLabel === comp.label || focusComponentLabel === comp.name) ? 'ring-2 ring-yellow-200' : ''}`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{comp.label}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{comp.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{comp.model}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{comp.poles}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{comp.current}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{comp.icu}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{comp.voltage}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{comp.poweredFrom}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{comp.powersTo}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{comp.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Không có thành phần cơ bản / phụ tải nào.
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {historyLogs.length > 0 ? (
                <div className="space-y-4">
                  {historyLogs.map((log: any) => (
                    <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                          {log.date}
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{log.details}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Không có lịch sử bảo trì/thay đổi nào.
                </div>
              )}
            </div>
          )}

          {activeTab === 'changelog' && (
            <div>
              {changeLogs.length > 0 ? (
                <div className="overflow-hidden relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <ul className="space-y-6 relative">
                    {changeLogs.map((log: any, index: number) => {
                      const dateObj = new Date(log.timestamp);
                      const formattedDate = dateObj.toLocaleDateString('vi-VN');
                      const formattedTime = dateObj.toLocaleTimeString('vi-VN');
                      
                      return (
                        <li key={log.id || index} className="relative pl-10">
                          <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="text-sm font-bold text-gray-900">{log.action}</h4>
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formattedTime} - {formattedDate}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mb-2">
                              <User className="w-3 h-3 mr-1" />
                              Bởi: <span className="font-medium text-gray-700 ml-1">{log.user}</span>
                            </div>
                            {log.details && (
                              <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chưa có dữ liệu logfile.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
