import { UserRole, Permission, ModuleName, PermissionAction } from '@/types';

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Admin has all permissions for all modules
    { module: 'dashboard', actions: ['view'] },
    { module: 'search', actions: ['view'] },
    { module: 'parties', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'items', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'sales', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'purchases', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'returns', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'ledger', actions: ['view', 'export'] },
    { module: 'payments', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'expenses', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'reports', actions: ['view', 'export'] },
    { module: 'settings', actions: ['view', 'manage'] },
  ],
  manager: [
    // Manager has most permissions except managing settings/users
    { module: 'dashboard', actions: ['view'] },
    { module: 'search', actions: ['view'] },
    { module: 'parties', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'items', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'sales', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'purchases', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'returns', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'ledger', actions: ['view', 'export'] },
    { module: 'payments', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'expenses', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'reports', actions: ['view', 'export'] },
    { module: 'settings', actions: ['view'] }, // Can view but not manage
  ],
  user: [
    // User has basic permissions for daily operations
    { module: 'dashboard', actions: ['view'] },
    { module: 'search', actions: ['view'] },
    { module: 'parties', actions: ['view', 'create', 'edit'] }, // Can view and create/edit but not delete
    { module: 'items', actions: ['view'] }, // Only view items
    { module: 'sales', actions: ['view', 'create', 'edit'] },
    { module: 'purchases', actions: ['view', 'create', 'edit'] },
    { module: 'returns', actions: ['view', 'create'] },
    { module: 'ledger', actions: ['view'] },
    { module: 'payments', actions: ['view', 'create'] },
    { module: 'expenses', actions: ['view', 'create'] },
    { module: 'reports', actions: ['view'] },
    { module: 'settings', actions: ['view'] },
  ],
};

// Utility function to check if a user has a specific permission
export function hasPermission(
  userRole: UserRole | null,
  module: ModuleName,
  action: PermissionAction
): boolean {
  if (!userRole) return false;

  const permissions = ROLE_PERMISSIONS[userRole];
  const modulePermission = permissions.find(p => p.module === module);

  return modulePermission ? modulePermission.actions.includes(action) : false;
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Check if user can access a module (has at least view permission)
export function canAccessModule(userRole: UserRole | null, module: ModuleName): boolean {
  return hasPermission(userRole, module, 'view');
}
