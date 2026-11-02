import { useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  hasPermission,
  canAccessPath,
  isOwner as checkIsOwner,
  canManageTargetUser,
  type ModuleKey,
  type PermissionAction,
} from '../utils/permissions';
import type { UserProfile } from '../contexts/AuthContext';

export function usePermission() {
  const { profile } = useAuth();

  const isOwner = useMemo(() => checkIsOwner(profile), [profile]);

  const can = useCallback(
    (module: ModuleKey, action: PermissionAction): boolean => {
      return hasPermission(profile, module, action);
    },
    [profile]
  );

  const canAccess = useCallback(
    (path: string): boolean => {
      return canAccessPath(profile, path);
    },
    [profile]
  );

  const canManage = useCallback(
    (targetUser: UserProfile) => {
      return canManageTargetUser(profile, targetUser);
    },
    [profile]
  );

  return {
    profile,
    isOwner,
    can,
    canAccess,
    canManage,
  };
}
