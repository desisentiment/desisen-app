import { useFallbackAuthStore } from '@/store/useFallbackAuthStore';
import { hasPermission, canAccessModule } from '@/lib/permissions';
import { ModuleName, PermissionAction } from '@/types';

export function usePermissions() {
  const { user } = useFallbackAuthStore();

  const checkPermission = (module: ModuleName, action: PermissionAction): boolean => {
    return hasPermission(user?.role || null, module, action);
  };

  const checkModuleAccess = (module: ModuleName): boolean => {
    return canAccessModule(user?.role || null, module);
  };

  const userRole = user?.role || null;

  return {
    userRole,
    user,
    checkPermission,
    checkModuleAccess,
    // Convenience methods
    canView: (module: ModuleName) => checkPermission(module, 'view'),
    canCreate: (module: ModuleName) => checkPermission(module, 'create'),
    canEdit: (module: ModuleName) => checkPermission(module, 'edit'),
    canDelete: (module: ModuleName) => checkPermission(module, 'delete'),
    canExport: (module: ModuleName) => checkPermission(module, 'export'),
    canManage: (module: ModuleName) => checkPermission(module, 'manage'),
  };
}