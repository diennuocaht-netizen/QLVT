import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabase-client';
import { toast } from 'sonner';

interface UseDocumentImportProps {
  documents: any[];
  profile: any;
  onSuccess?: () => void;
}

export const useDocumentImport = ({ documents, profile, onSuccess }: UseDocumentImportProps) => {
  const [importing, setImporting] = useState(false);

  const importDocuments = (file: File) => {
    setImporting(true);
    const loadingToast = toast.loading('Đang xử lý file Excel...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.warning('Không có dữ liệu nào được import', {
            description: 'Vui lòng kiểm tra lại file Excel (đảm bảo Sheet 1 có dữ liệu).',
            id: loadingToast
          });
          setImporting(false);
          return;
        }

        let count = 0;
        for (const row of data as any[]) {
          // Normalize row keys
          const normalizedRow: any = {};
          for (const key in row) {
            if (row.hasOwnProperty(key)) {
              const cleanKey = key.replace(/^\uFEFF/, '').trim().toLowerCase();
              normalizedRow[cleanKey] = row[key];
            }
          }

          const convertDateFormat = (val: any): string => {
            if (!val) return '';
            
            // Excel dates are often numbers
            if (typeof val === 'number') {
              const date = new Date((val - (25567 + 2)) * 86400 * 1000); // Excel epoch conversion
              // Ensure we aren't creating invalid dates if number is not an excel date
              if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
                return date.toISOString().split('T')[0];
              }
            }
            
            const dateStr = String(val).trim();
            if (!dateStr) return '';
            
            const parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
              const [part1, part2, part3] = parts;
              // Detect format DD/MM/YYYY vs YYYY/MM/DD
              if (part1.length === 4) {
                 return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
              } else {
                 return `${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
              }
            }
            return dateStr;
          };

          const code = String(normalizedRow['mã tài liệu'] || normalizedRow['code'] || '').trim();
          const title = String(normalizedRow['tên tài liệu'] || normalizedRow['title'] || '').trim();
          
          if (!code || !title) continue;

          const now = new Date().toISOString();
          const existingDoc = documents.find((d: any) => d.code === code);
          
          const docData = {
            code: code.substring(0, 99),
            system_code: String(normalizedRow['kí hiệu hệ'] || normalizedRow['systemcode'] || '').trim(),
            system: String(normalizedRow['hệ'] || normalizedRow['system'] || '').trim(),
            document_type: String(normalizedRow['loại tài liệu'] || normalizedRow['documenttype'] || '').trim(),
            title: title.substring(0, 299),
            version: String(normalizedRow['lần ban hành'] || normalizedRow['version'] || '').trim(),
            issue_date: convertDateFormat(normalizedRow['ngày ban hành'] || normalizedRow['issuedate']),
            update_date: convertDateFormat(normalizedRow['ngày cập nhật'] || normalizedRow['updatedate']),
            author_name: String(normalizedRow['người biên soạn'] || normalizedRow['authorname'] || '').trim(),
            file_url: String(normalizedRow['file đính kèm'] || normalizedRow['fileurl'] || '').trim(),
            status: 'active',
            updated_at: now,
          };

          if (existingDoc) {
            const isDifferent = existingDoc.version !== docData.version || existingDoc.update_date !== docData.update_date;
            if (isDifferent) {
              let history = existingDoc.history || [];
              const oldVersion = {
                version: existingDoc.version,
                issue_date: existingDoc.issue_date,
                update_date: existingDoc.update_date,
                file_url: existingDoc.file_url,
                author_name: existingDoc.author_name,
                status: existingDoc.status,
                archived_at: now,
                archived_by: profile?.id || null
              };
              history = [oldVersion, ...history];
              
              const { error: updateError } = await supabase.from('documents').update({
                ...docData,
                history,
                updated_by: profile?.id || null
              }).eq('id', existingDoc.id);
              if (updateError) throw updateError;
              count++;
            }
          } else {
            const { error } = await supabase.from('documents').insert([{
              ...docData,
              history: [],
              author_id: profile?.id || null,
              created_at: now,
            }]);
            if (error) throw error;
            count++;
          }
        }
        
        if (count === 0) {
          toast.warning('Không có tài liệu mới nào được import', {
            description: 'Các tài liệu đã tồn tại hoặc file không đúng định dạng.',
            id: loadingToast
          });
        } else {
          toast.success(`Đã import thành công ${count} tài liệu!`, { id: loadingToast });
          if (onSuccess) onSuccess();
        }
      } catch (error: any) {
        console.error("Error importing documents:", error);
        toast.error('Có lỗi xảy ra khi import dữ liệu', {
          description: error.message || 'Lỗi không xác định',
          id: loadingToast
        });
      } finally {
        setImporting(false);
      }
    };
    
    reader.onerror = () => {
      toast.error("Lỗi khi đọc file Excel", { id: loadingToast });
      setImporting(false);
    };

    reader.readAsBinaryString(file);
  };

  return { importDocuments, importing };
};
