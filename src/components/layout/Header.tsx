import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useUiStore } from '@/store/useUiStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useFallbackAuthStore } from '@/store/useFallbackAuthStore';
import { Bell, Sun, Moon, Check, Trash2, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const navigate = useNavigate();
  const { setSidebarOpen, theme, setTheme } = useUiStore();
  const { getCurrentBusiness } = useBusinessStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, generateBusinessNotifications } = useNotificationStore();
  const { user, logout } = useFallbackAuthStore();
  const currentBusiness = getCurrentBusiness();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Generate notifications on component mount and when business changes
  useEffect(() => {
    if (currentBusiness?.id) {
      generateBusinessNotifications(currentBusiness.id);
    }
  }, [currentBusiness?.id, generateBusinessNotifications]);

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden h-10 w-10 rounded-lg hover:bg-muted transition-all"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-sm">KC</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">
                Karobar360
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-lg hover:bg-muted transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-lg hover:bg-muted transition-all"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center font-medium shadow-sm border border-background">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2 shadow-lg">
              <div className="px-3 py-2 rounded-lg bg-muted/50 mb-2 flex justify-between items-center">
                <span className="text-sm font-semibold">Notifications</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">({unreadCount} unread)</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-7 px-2 text-xs rounded-md hover:bg-background"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors group"
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        navigate(notification.actionUrl);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-medium truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">{formatTimeAgo(notification.createdAt)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <DropdownMenuItem
                  className="text-center text-sm text-muted-foreground cursor-pointer rounded-lg hover:bg-muted transition-colors justify-center"
                  onClick={() => markAllAsRead()}
                >
                  Mark all as read
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-muted transition-all border border-border hover:border-border"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                  <span className="text-primary-foreground font-semibold text-sm">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium truncate max-w-24">{user?.email || 'User'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Role'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 shadow-lg">
              <div className="px-3 py-2 rounded-lg bg-muted/50 mb-2">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role} Account</p>
              </div>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <User className="mr-3 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-lg cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
