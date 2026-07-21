import { useState } from 'react';
import Papa from 'papaparse';
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
    const loadingToast = toast.loading('Đang xử lý file CSV...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: async (results) => {
        try {
          let count = 0;
          for (const row of results.data as any[]) {
            // Normalize row keys
            const normalizedRow: any = {};
            for (const key in row) {
              if (row.hasOwnProperty(key)) {
                const cleanKey = key.replace(/^\uFEFF/, '').trim().toLowerCase();
                normalizedRow[cleanKey] = row[key];
              }
            }

            const convertDateFormat = (dateStr: string): string => {
              if (!dateStr || !dateStr.trim()) return '';
              const parts = dateStr.trim().split('/');
              if (parts.length === 3) {
                const [day, month, year] = parts;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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
              issue_date: convertDateFormat(String(normalizedRow['ngày ban hành'] || normalizedRow['issuedate'] || '').trim()),
              update_date: convertDateFormat(String(normalizedRow['ngày cập nhật'] || normalizedRow['updatedate'] || '').trim()),
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
            toast.warning('Không có dữ liệu nào được import', {
              description: 'Vui lòng kiểm tra lại cấu trúc file CSV.',
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
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        toast.error("Lỗi khi đọc file CSV", { id: loadingToast });
        setImporting(false);
      }
    });
  };

  return { importDocuments, importing };
};
