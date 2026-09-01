import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { X, Info } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';

const documentSchema = z.object({
  code: z.string().min(1, 'Mã tài liệu là bắt buộc'),
  system_code: z.string().min(1, 'Kí hiệu hệ là bắt buộc'),
  system: z.string().min(1, 'Hệ là bắt buộc'),
  document_type: z.string().min(1, 'Loại tài liệu là bắt buộc'),
  title: z.string().min(1, 'Tên tài liệu là bắt buộc'),
  version: z.string().min(1, 'Lần ban hành là bắt buộc'),
  author_name: z.string().min(1, 'Người biên soạn là bắt buộc'),
  issue_date: z.string().min(1, 'Ngày ban hành là bắt buộc'), // Should be a valid date, but keeping it as string for now to match old behavior
  update_date: z.string().min(1, 'Ngày cập nhật là bắt buộc'),
  file_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  status: z.enum(['active', 'pending', 'draft', 'archived']),
  isNewVersion: z.boolean().optional(),
  tags: z.array(z.string()).optional().default([]),
  linked_equipments: z.array(z.string()).optional().default([]),
  linked_projects: z.array(z.string()).optional().default([]),
  access_level: z.enum(['public', 'internal', 'restricted']).optional().default('public'),
  allowed_users: z.array(z.string()).optional().default([]),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface DocumentFormProps {
  document?: any;
  onClose: () => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({ document, onClose }) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const canApprove = profile?.role === 'admin' || profile?.role === 'manager';
  const [users, setUsers] = useState<any[]>([]);

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      code: document?.code || '',
      system_code: document?.system_code || '',
      system: document?.system || '',
      document_type: document?.document_type || '',
      title: document?.title || '',
      version: document?.version || '',
      issue_date: document?.issue_date || '',
      update_date: document?.update_date || '',
      file_url: document?.file_url || '',
      author_name: document?.author_name || '',
      status: document?.status || (canApprove ? 'active' : 'pending'),
      isNewVersion: false,
      tags: document?.tags || [],
      linked_equipments: document?.linked_equipments || [],
      linked_projects: document?.linked_projects || [],
      access_level: document?.access_level || 'public',
      allowed_users: document?.allowed_users || [],
    }
  });

  const isNewVersion = watch('isNewVersion');
  const watchAccessLevel = watch('access_level');
  
  const [equipments, setEquipments] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsersAndEquips = async () => {
      try {
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) setUsers(usersData);
        
        const { data: equipData } = await supabase.from('measured_equipments').select('id, code, name');
        if (equipData) setEquipments(equipData);

        const { data: projData } = await supabase.from('projects').select('id, code, name');
        if (projData) setProjectsList(projData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchUsersAndEquips();
  }, []);

  const onSubmit = async (data: DocumentFormValues) => {
    try {
      const now = new Date().toISOString();
      const finalStatus = (!canApprove && data.status === 'active') ? 'pending' : data.status;
      
      const docData = {
        code: data.code,
        system_code: data.system_code,
        system: data.system,
        document_type: data.document_type,
        title: data.title,
        version: data.version,
        issue_date: data.issue_date,
        update_date: data.update_date,
        file_url: data.file_url,
        author_name: data.author_name,
        status: finalStatus,
        tags: data.tags,
        linked_equipments: data.linked_equipments,
        linked_projects: data.linked_projects,
        access_level: data.access_level,
        allowed_users: data.allowed_users,
      };

      if (document) {
        let history = document.history || [];
        if (data.isNewVersion) {
          const oldVersion = {
            version: document.version,
            issue_date: document.issue_date,
            update_date: document.update_date,
            file_url: document.file_url,
            author_name: document.author_name,
            status: document.status,
            tags: document.tags,
            linked_equipments: document.linked_equipments,
            linked_projects: document.linked_projects,
            access_level: document.access_level,
            allowed_users: document.allowed_users,
            archived_at: now,
            archived_by: profile?.id
          };
          history = [oldVersion, ...history];
        }

        const { error } = await supabase.from('documents').update({
          ...docData,
          history,
          updated_at: now,
          updated_by: profile?.id
        }).eq('id', document.id);

        if (error) throw error;
        toast.success('Đã cập nhật tài liệu thành công!');
      } else {
        const { data: existingDocs } = await supabase.from('documents').select('*').eq('code', docData.code);
        
        if (existingDocs && existingDocs.length > 0) {
          const existingDoc = existingDocs[0];
          let history = existingDoc.history || [];
          const oldVersion = {
            version: existingDoc.version,
            issue_date: existingDoc.issue_date,
            update_date: existingDoc.update_date,
            file_url: existingDoc.file_url,
            author_name: existingDoc.author_name,
            status: existingDoc.status,
            tags: existingDoc.tags,
            linked_equipments: existingDoc.linked_equipments,
            access_level: existingDoc.access_level,
            allowed_users: existingDoc.allowed_users,
            archived_at: now,
            archived_by: profile?.id
          };
          history = [oldVersion, ...history];

          const { error } = await supabase.from('documents').update({
            ...docData,
            history,
            updated_at: now,
            updated_by: profile?.id
          }).eq('id', existingDoc.id);

          if (error) throw error;
          toast.success('Đã cập nhật phiên bản mới cho tài liệu!');
        } else {
          const { error } = await supabase.from('documents').insert([{
            ...docData,
            history: [],
            author_id: profile?.id,
            created_at: now,
            updated_at: now,
          }]);

          if (error) throw error;
          toast.success('Đã thêm tài liệu mới thành công!');
        }
      }
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onClose();
    } catch (err: any) {
      console.error("Error saving document:", err);
      toast.error('Có lỗi xảy ra khi lưu tài liệu', { description: err.message });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {document ? 'Chỉnh sửa Tài liệu' : 'Thêm Tài liệu Mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!document && (
              <div className="md:col-span-2">
                <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-md flex items-start">
                  <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Nếu bạn nhập <strong>Mã tài liệu</strong> đã tồn tại, hệ thống sẽ cập nhật thành phiên bản mới.</span>
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã tài liệu *</label>
              <input
                {...register('code')}
                className={`mt-1 block w-full border ${errors.code ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kí hiệu hệ *</label>
              <input
                {...register('system_code')}
                className={`mt-1 block w-full border ${errors.system_code ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.system_code && <p className="mt-1 text-xs text-red-600">{errors.system_code.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hệ *</label>
              <input
                {...register('system')}
                className={`mt-1 block w-full border ${errors.system ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.system && <p className="mt-1 text-xs text-red-600">{errors.system.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Loại tài liệu *</label>
              <input
                {...register('document_type')}
                className={`mt-1 block w-full border ${errors.document_type ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.document_type && <p className="mt-1 text-xs text-red-600">{errors.document_type.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Tên tài liệu *</label>
              <input
                {...register('title')}
                className={`mt-1 block w-full border ${errors.title ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Lần ban hành *</label>
              <input
                {...register('version')}
                className={`mt-1 block w-full border ${errors.version ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.version && <p className="mt-1 text-xs text-red-600">{errors.version.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Người biên soạn *</label>
              <select
                {...register('author_name')}
                className={`mt-1 block w-full border ${errors.author_name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              >
                <option value="">-- Chọn người biên soạn --</option>
                {users.map(user => (
                  <option key={user.id} value={user.displayName || user.email}>
                    {user.displayName || user.email}
                  </option>
                ))}
                {/* Fallback for existing author_name not in users table */}
                {document?.author_name && !users.find(u => (u.displayName || u.email) === document.author_name) && (
                  <option value={document.author_name}>{document.author_name}</option>
                )}
              </select>
              {errors.author_name && <p className="mt-1 text-xs text-red-600">{errors.author_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ngày ban hành *</label>
              <input
                {...register('issue_date')}
                placeholder="YYYY-MM-DD"
                className={`mt-1 block w-full border ${errors.issue_date ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.issue_date && <p className="mt-1 text-xs text-red-600">{errors.issue_date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ngày cập nhật *</label>
              <input
                {...register('update_date')}
                placeholder="YYYY-MM-DD"
                className={`mt-1 block w-full border ${errors.update_date ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.update_date && <p className="mt-1 text-xs text-red-600">{errors.update_date.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">File đính kèm (URL)</label>
              <input
                type="url"
                {...register('file_url')}
                className={`mt-1 block w-full border ${errors.file_url ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.file_url && <p className="mt-1 text-xs text-red-600">{errors.file_url.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Thẻ (Tags)</label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <CreatableSelect
                    isMulti
                    value={field.value.map((tag: string) => ({ value: tag, label: tag }))}
                    onChange={(newValue) => field.onChange(newValue ? newValue.map(v => v.value) : [])}
                    placeholder="Nhập thẻ và ấn Enter..."
                    className="mt-1 block w-full"
                  />
                )}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Máy móc liên kết</label>
              <Controller
                name="linked_equipments"
                control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    options={equipments.map(e => ({ value: e.id, label: `${e.code} - ${e.name}` }))}
                    value={equipments.filter(e => field.value.includes(e.id)).map(e => ({ value: e.id, label: `${e.code} - ${e.name}` }))}
                    onChange={(newValue) => field.onChange(newValue ? newValue.map(v => v.value) : [])}
                    placeholder="Chọn máy móc..."
                    className="mt-1 block w-full"
                  />
                )}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Dự án liên kết</label>
              <Controller
                name="linked_projects"
                control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    options={projectsList.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
                    value={projectsList.filter(p => field.value.includes(p.id)).map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
                    onChange={(newValue) => field.onChange(newValue ? newValue.map(v => v.value) : [])}
                    placeholder="Chọn dự án..."
                    className="mt-1 block w-full"
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quyền truy cập</label>
              <select
                {...register('access_level')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="public">Công khai (Tất cả)</option>
                <option value="internal">Nội bộ (Quản lý/Admin)</option>
                <option value="restricted">Hạn chế (Chỉ định)</option>
              </select>
            </div>

            {watchAccessLevel === 'restricted' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Người được phép truy cập</label>
                <Controller
                  name="allowed_users"
                  control={control}
                  render={({ field }) => (
                    <Select
                      isMulti
                      options={users.map(u => ({ value: u.id, label: u.displayName || u.email }))}
                      value={users.filter(u => field.value.includes(u.id)).map(u => ({ value: u.id, label: u.displayName || u.email }))}
                      onChange={(newValue) => field.onChange(newValue ? newValue.map(v => v.value) : [])}
                      placeholder="Chọn người dùng..."
                      className="mt-1 block w-full"
                    />
                  )}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                {...register('status')}
                disabled={!canApprove}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="active">Hiệu lực</option>
                <option value="pending">Chờ duyệt</option>
                <option value="draft">Bản nháp</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>
          </div>

          {document && (
            <div className="flex items-center mt-4">
              <input
                id="isNewVersion"
                type="checkbox"
                {...register('isNewVersion')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isNewVersion" className="ml-2 block text-sm text-gray-900">
                Lưu thành phiên bản mới (Phiên bản cũ sẽ được lưu vào lịch sử)
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu tài liệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
