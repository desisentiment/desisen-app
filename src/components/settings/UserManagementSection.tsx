import { useState } from 'react';
import { Shield, History, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string | Date;
  performedBy: string;
}

interface UserManagementSectionProps {
  users: User[];
  auditLogs: AuditLog[];
  currentUser: User | null;
  canManageUsers: boolean;
  canView: (section: string) => boolean;
  updateUserRole: (userId: string, role: 'admin' | 'manager' | 'user') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export function UserManagementSection({
  users,
  auditLogs,
  currentUser,
  canManageUsers,
  canView,
  updateUserRole,
  deleteUser,
}: UserManagementSectionProps) {
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isUpdatingUserRole, setIsUpdatingUserRole] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    // Prevent deleting self
    if (userToDelete.id === currentUser?.id) {
      toast({
        title: 'Deletion Failed',
        description: 'You cannot delete your own account.',
        variant: 'destructive',
      });
      return;
    }

    // Prevent deleting last admin
    if (userToDelete.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        toast({
          title: 'Deletion Failed',
          description: 'Cannot delete the last admin user.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsDeletingUser(true);
    try {
      await deleteUser(userToDelete.id);
      toast({
        title: 'User Deleted',
        description: `${userToDelete.email} has been removed successfully.`,
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete user. Please check permissions and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingUser(false);
    }
  };

  if (!canView('settings')) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">You don't have permission to view settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="p-3 md:p-4 border rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Role: <span className="capitalize">{user.role}</span> • Created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={async (newRole: 'admin' | 'manager' | 'user') => {
                        if (!canManageUsers) return;
                        setIsUpdatingUserRole(user.id);
                        try {
                          await updateUserRole(user.id, newRole);
                          toast({
                            title: 'Role Updated',
                            description: `${user.email}'s role has been changed to ${newRole} successfully.`,
                          });
                        } catch (error) {
                          toast({
                            title: 'Update Failed',
                            description: 'Failed to update user role. Please check permissions and try again.',
                            variant: 'destructive',
                          });
                        } finally {
                          setIsUpdatingUserRole(null);
                        }
                      }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SelectTrigger disabled={!canManageUsers || isUpdatingUserRole === user.id} className="w-full sm:w-32">
                            {isUpdatingUserRole === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                        </TooltipTrigger>
                        {!canManageUsers && <TooltipContent>Only admins can manage user roles</TooltipContent>}
                      </Tooltip>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto min-h-[44px]"
                          disabled={!canManageUsers}
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </TooltipTrigger>
                      {!canManageUsers && <TooltipContent>Only admins can delete users</TooltipContent>}
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Log
          </CardTitle>
          <CardDescription>Recent user management activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No audit logs yet</p>
            ) : (
              auditLogs
                .sort((a, b) => {
                  const getTime = (timestamp: unknown) => {
                    if (timestamp instanceof Date) return timestamp.getTime();
                    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
                      const date = new Date(timestamp);
                      return isNaN(date.getTime()) ? 0 : date.getTime();
                    }
                    return 0;
                  };
                  return getTime(b.timestamp) - getTime(a.timestamp);
                })
                .map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-2 md:gap-3 p-2 md:p-3 border rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0 mx-auto sm:mx-0" />
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm font-medium">{log.action.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()} by {log.performedBy}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setUserToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeletingUser}>
              {isDeletingUser ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}