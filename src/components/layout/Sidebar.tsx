import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/useUiStore';
import { ModuleName } from '@/types';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Truck,
  RotateCcw,
  BookOpen,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  module: ModuleName;
  group: string;
  children?: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
  }[];
}

const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/',
    module: 'dashboard' as ModuleName,
    group: 'Overview'
  },
  {
    icon: ShoppingCart,
    label: 'Sales',
    path: '/sales',
    module: 'sales' as ModuleName,
    group: 'Transactions'
  },
  {
    icon: Truck,
    label: 'Purchases',
    path: '/purchases',
    module: 'purchases' as ModuleName,
    group: 'Transactions'
  },
  {
    icon: RotateCcw,
    label: 'Returns',
    path: '/returns',
    module: 'returns' as ModuleName,
    group: 'Transactions'
  },
  {
    icon: Package,
    label: 'Items',
    path: '/items',
    module: 'items' as ModuleName,
    group: 'Inventory'
  },
  {
    icon: Users,
    label: 'Parties',
    path: '/parties',
    module: 'parties' as ModuleName,
    group: 'Contacts'
  },
  {
    icon: CreditCard,
    label: 'Payments',
    path: '/payments',
    module: 'payments' as ModuleName,
    group: 'Financials'
  },
  {
    icon: Receipt,
    label: 'Expenses',
    path: '/expenses',
    module: 'expenses' as ModuleName,
    group: 'Financials'
  },
  {
    icon: BookOpen,
    label: 'Ledger',
    path: '/ledger',
    module: 'ledger' as ModuleName,
    group: 'Financials'
  },
  {
    icon: BarChart3,
    label: 'Reports',
    path: '/reports',
    module: 'reports' as ModuleName,
    group: 'Analytics'
  },
  {
    icon: Settings,
    label: 'Settings',
    path: '/settings',
    module: 'settings' as ModuleName,
    group: 'Admin'
  },
];

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();
  // const { checkModuleAccess } = usePermissions();

  // Filter nav items based on user permissions
  // const accessibleNavItems = navItems.filter(item => checkModuleAccess(item.module));
  const accessibleNavItems = navItems;

  // Group items by their category
  const groupedNavItems = accessibleNavItems.reduce((groups, item) => {
    const group = item.group || 'Other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, typeof navItems>);

  // Check if a nav item is active (including child routes)
  const isNavItemActive = (item: NavItem): boolean => {
    if (item.path === location.pathname) return true;
    if (item.children) {
      return item.children.some(child => child.path === location.pathname);
    }
    return false;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-base">KC</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">
              Karobar360
            </h1>
            <p className="text-muted-foreground text-xs font-medium">Business Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {Object.entries(groupedNavItems).map(([groupName, groupItems]) => (
          <div key={groupName} className="mb-2">
            <div className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {groupName}
            </div>
            {groupItems.map((item) => {
              const isActive = isNavItemActive(item);
              return (
                <div key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onItemClick}
                    className={cn(
                      'group flex items-center gap-3 px-4 py-2 rounded-lg text-foreground/80 hover:text-foreground transition-all duration-200 hover:bg-muted/50 border border-transparent hover:border-border',
                      isActive && 'bg-primary/10 text-primary border-primary/30'
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0 transition-all duration-200",
                      isActive ? "text-primary" : "group-hover:scale-110"
                    )} />
                    <span className={cn(
                      "text-sm font-medium transition-all duration-200",
                      isActive && "font-semibold"
                    )}>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                  {/* Child items for grouped navigation */}
                  {item.children && isActive && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const childIsActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={onItemClick}
                            className={cn(
                              'group flex items-center gap-3 px-3 py-1.5 rounded text-sm text-foreground/70 hover:text-foreground transition-all duration-200 hover:bg-muted/30',
                              childIsActive && 'bg-primary/15 text-primary'
                            )}
                          >
                            <child.icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  const handleMobileItemClick = () => {
    setSidebarOpen(false); // Close mobile sidebar when item is clicked
  };

  return (
    <>
      {/* Desktop Sidebar - Simplified to always show full width */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 hidden lg:block border-r border-border/50 bg-background">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-full sm:w-64 border-r border-border/50 bg-background">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent onItemClick={handleMobileItemClick} />
        </SheetContent>
      </Sheet>
    </>
  );
}
