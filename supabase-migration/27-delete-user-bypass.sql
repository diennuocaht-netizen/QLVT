-- Create function to strictly delete user from auth.users (which cascades to public.users and others)
CREATE OR REPLACE FUNCTION public.admin_delete_user_bypass(p_user_id UUID)
RETURNS json AS $body
DECLARE
  v_current_role TEXT;
  v_current_id UUID;
BEGIN
  -- Get current user and their role
  v_current_id := auth.uid();
  
  -- Only admin can delete users
  SELECT role INTO v_current_role FROM public.users WHERE id = v_current_id;
  
  IF v_current_role != 'admin' AND auth.email() != 'hoang.toan2409@gmail.com' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Chỉ có Admin mới có quyền xóa người dùng'
    );
  END IF;
  
  -- Prevent self-deletion
  IF p_user_id = v_current_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Không thể tự xóa chính mình'
    );
  END IF;

  -- Xóa người dùng từ auth.users. 
  -- Việc này sẽ tự động xóa bản ghi bên public.users nếu có thiết lập CASCADE.
  -- Nhưng để chắc chắn, ta xóa thủ công bên public.users trước (nếu cần).
  
  DELETE FROM public.users WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Đã xóa hoàn toàn người dùng khỏi hệ thống'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$body LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_user_bypass TO authenticated;
