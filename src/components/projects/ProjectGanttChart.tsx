import React, { useMemo } from 'react';
import { format, differenceInDays, parseISO, startOfDay, addDays, isBefore, isAfter, max, min } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ProjectGanttChartProps {
  project: any;
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ project }) => {
  const tasks = project.tasks || [];

  const { chartStart, chartEnd, totalDays, validTasks } = useMemo(() => {
    const valid = tasks.filter((t: any) => t.start_date && t.end_date);
    if (valid.length === 0) return { chartStart: null, chartEnd: null, totalDays: 0, validTasks: [] };

    let earliest = parseISO(valid[0].start_date);
    let latest = parseISO(valid[0].end_date);

    valid.forEach((t: any) => {
      const s = parseISO(t.start_date);
      const e = parseISO(t.end_date);
      if (isBefore(s, earliest)) earliest = s;
      if (isAfter(e, latest)) latest = e;
    });

    if (project.start_date) {
      const ps = parseISO(project.start_date);
      if (isBefore(ps, earliest)) earliest = ps;
    }
    
    if (project.completion_date) {
      const pe = parseISO(project.completion_date);
      if (isAfter(pe, latest)) latest = pe;
    }

    const start = startOfDay(addDays(earliest, -2));
    const end = startOfDay(addDays(latest, 2));
    const days = differenceInDays(end, start) + 1;

    return { chartStart: start, chartEnd: end, totalDays: days, validTasks: valid };
  }, [project, tasks]);

  if (validTasks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
        Không đủ dữ liệu Ngày Bắt Đầu & Kết Thúc để vẽ biểu đồ Gantt.
      </div>
    );
  }

  // Generate date headers
  const dateHeaders = [];
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(chartStart!, i);
    dateHeaders.push(
      <div key={i} className="flex-1 min-w-[40px] text-center border-r border-gray-200 text-xs py-2 text-gray-500">
        <div className="font-semibold">{format(d, 'dd')}</div>
        <div className="text-[10px]">{format(d, 'MMM', { locale: vi })}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Biểu đồ Gantt Dự án</h3>
      </div>
      
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${totalDays * 40 + 200}px` }} className="flex flex-col">
          {/* Header */}
          <div className="flex border-b border-gray-200 bg-gray-100 sticky top-0 z-10">
            <div className="w-[200px] flex-shrink-0 border-r border-gray-200 p-3 font-semibold text-sm text-gray-700">
              Hạng mục
            </div>
            <div className="flex flex-1">
              {dateHeaders}
            </div>
          </div>

          {/* Rows */}
          <div className="flex flex-col relative pb-4">
            {/* Grid lines */}
            <div className="absolute top-0 bottom-0 left-[200px] right-0 flex pointer-events-none">
              {Array.from({ length: totalDays }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-gray-100 min-w-[40px]"></div>
              ))}
            </div>
            
            {validTasks.map((t: any, idx: number) => {
              const start = parseISO(t.start_date);
              const end = parseISO(t.end_date);
              
              const offsetDays = differenceInDays(start, chartStart!);
              const durationDays = differenceInDays(end, start) + 1;
              
              const leftPercent = (offsetDays / totalDays) * 100;
              const widthPercent = (durationDays / totalDays) * 100;
              
              const isDone = t.status === 'completed';
              
              return (
                <div key={idx} className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors group relative z-0">
                  <div className="w-[200px] flex-shrink-0 border-r border-gray-200 p-3 text-sm text-gray-900 truncate bg-white group-hover:bg-gray-50 z-10" title={t.name}>
                    {t.name}
                  </div>
                  <div className="flex-1 relative py-2 px-1">
                    <div 
                      className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md shadow-sm overflow-hidden flex items-center ${isDone ? 'bg-green-100 border border-green-300' : 'bg-indigo-100 border border-indigo-300'}`}
                      style={{ 
                        left: `${leftPercent}%`, 
                        width: `${widthPercent}%`,
                        minWidth: '20px'
                      }}
                      title={`${t.name} (${t.progress}%)`}
                    >
                      <div 
                        className={`h-full ${isDone ? 'bg-green-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${t.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
