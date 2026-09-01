import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, UserPlus, Trash2, Plus, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../supabase-client';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const contactSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên người liên hệ'),
  role: z.string().min(1, 'Vui lòng nhập chức vụ/vai trò'),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').or(z.literal('')).optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

const projectSchema = z.object({
  code: z.string().min(1, 'Vui lòng nhập mã dự án'),
  name: z.string().min(1, 'Vui lòng nhập tên dự án'),
  description: z.string().optional(),
  completion_date: z.string().min(1, 'Vui lòng chọn ngày hoàn thành'),
  warranty_date: z.string().min(1, 'Vui lòng chọn ngày hết hạn bảo hành'),
  status: z.enum(['active', 'completed', 'archived']),
  contacts: z.array(contactSchema).default([]),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: any | null;
  onClose: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onClose }) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [contacts, setContacts] = useState<any[]>(project?.contacts || []);
  const [attachments, setAttachments] = useState<any[]>(project?.attachments || []);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      code: project?.code || '',
      name: project?.name || '',
      description: project?.description || '',
      completion_date: project?.completion_date || '',
      warranty_date: project?.warranty_date || '',
      status: project?.status || 'active',
      contacts: project?.contacts || [],
    }
  });

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      const payload: any = {
        ...data,
        contacts, // use state
        attachments, // use state
      };

      if (project?.id) {
        payload.updated_by = profile?.id;
        payload.updated_at = new Date().toISOString();

        const { error } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', project.id);

        if (error) throw error;
        toast.success('Đã cập nhật dự án thành công');
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([{
            ...payload,
            created_by: profile?.id,
          }]);

        if (error) throw error;
        toast.success('Đã thêm dự án thành công');
      }

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    } catch (error: any) {
      toast.error('Có lỗi xảy ra', { description: error.message });
    }
  };

  const addContact = () => {
    setContacts([...contacts, { name: '', role: '', phone: '', email: '', company: '', notes: '' }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: string, value: string) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setContacts(newContacts);
  };

  const addAttachment = () => {
    setAttachments([...attachments, { name: '', url: '' }]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const updateAttachment = (index: number, field: string, value: string) => {
    const newAttachments = [...attachments];
    newAttachments[index] = { ...newAttachments[index], [field]: value };
    setAttachments(newAttachments);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {project ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mã dự án *</label>
                <input
                  type="text"
                  {...register('code')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="VD: DA-2023-01"
                />
                {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tên dự án *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Nhập tên dự án"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Nhập thông tin mô tả dự án..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày hoàn thành *</label>
                <input
                  type="date"
                  {...register('completion_date')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.completion_date && <p className="mt-1 text-xs text-red-600">{errors.completion_date.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày hết hạn bảo hành *</label>
                <input
                  type="date"
                  {...register('warranty_date')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.warranty_date && <p className="mt-1 text-xs text-red-600">{errors.warranty_date.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <select
                  {...register('status')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="completed">Đã kết thúc</option>
                  <option value="archived">Đã lưu trữ</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Thông tin liên hệ</h3>
                <button
                  type="button"
                  onClick={addContact}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <UserPlus className="w-4 h-4 mr-1" /> Thêm liên hệ
                </button>
              </div>

              {contacts.length === 0 ? (
                <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-md text-center">Chưa có thông tin liên hệ nào.</p>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md border border-gray-200 relative">
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Tên người liên hệ *</label>
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => updateContact(index, 'name', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Vai trò / Đơn vị *</label>
                          <input
                            type="text"
                            value={contact.role}
                            onChange={(e) => updateContact(index, 'role', e.target.value)}
                            placeholder="VD: Chỉ huy trưởng, NCC..."
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Số điện thoại</label>
                          <input
                            type="text"
                            value={contact.phone}
                            onChange={(e) => updateContact(index, 'phone', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateContact(index, 'email', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700">Công ty</label>
                          <input
                            type="text"
                            value={contact.company}
                            onChange={(e) => updateContact(index, 'company', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Tài liệu đính kèm (Links)</h3>
                <button
                  type="button"
                  onClick={addAttachment}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="w-4 h-4 mr-1" /> Thêm link
                </button>
              </div>

              {attachments.length === 0 ? (
                <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-md text-center">Chưa có link tài liệu nào đính kèm trực tiếp.</p>
              ) : (
                <div className="space-y-4">
                  {attachments.map((att, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md border border-gray-200 relative flex flex-col md:flex-row gap-4 items-start md:items-center">
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-gray-700">Tên tài liệu *</label>
                        <input
                          type="text"
                          value={att.name}
                          onChange={(e) => updateAttachment(index, 'name', e.target.value)}
                          placeholder="VD: Bản vẽ hoàn công..."
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-gray-700">Đường dẫn (URL) *</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LinkIcon className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="url"
                            value={att.url}
                            onChange={(e) => updateAttachment(index, 'url', e.target.value)}
                            placeholder="https://..."
                            className="block w-full pl-9 border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-gray-400 hover:text-red-500 p-1 md:mt-5"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="project-form"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang xử lý...' : (project ? 'Cập nhật' : 'Thêm mới')}
          </button>
        </div>
      </div>
    </div>
  );
};
