import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/useUiStore';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Settings,
  Receipt,
  BarChart,
  CreditCard,
  Wallet,
  BookOpen,
  ArrowLeft,
  Search,
} from 'lucide-react';

const bottomNavItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: ShoppingCart, label: 'Sales', path: '/sales' },
  { icon: Receipt, label: 'Purchases', path: '/purchases' },
  { icon: Package, label: 'Items', path: '/items' },
  { icon: Users, label: 'Parties', path: '/parties' },
];

const moreNavItems = [
  { icon: BarChart, label: 'Reports', path: '/reports' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: Wallet, label: 'Expenses', path: '/expenses' },
  { icon: BookOpen, label: 'Ledger', path: '/ledger' },
  { icon: ArrowLeft, label: 'Returns', path: '/returns' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];


export function BottomNav() {
  const location = useLocation();
  const { setSidebarOpen } = useUiStore();

  // Simplified bottom nav items - focus on most used features
  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/' },
    { icon: ShoppingCart, label: 'Sales', path: '/sales' },
    { icon: Package, label: 'Items', path: '/items' },
    { icon: Users, label: 'Parties', path: '/parties' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-all hover:scale-105',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-1", isActive && "scale-110")} />
              <span className={cn("text-xs font-medium", isActive && "font-semibold")}>{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-6 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}

        <button
          onClick={() => setSidebarOpen(true)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-all hover:scale-105 text-muted-foreground hover:bg-muted/50',
            (location.pathname === '/settings' || location.pathname.startsWith('/settings')) && 'bg-primary/10 text-primary'
          )}
        >
          <Settings className={cn("h-5 w-5 mb-1", (location.pathname === '/settings' || location.pathname.startsWith('/settings')) && "scale-110")} />
          <span className={cn("text-xs font-medium", (location.pathname === '/settings' || location.pathname.startsWith('/settings')) && "font-semibold")}>More</span>
          {(location.pathname === '/settings' || location.pathname.startsWith('/settings')) && (
            <div className="absolute bottom-1 w-6 h-1 bg-primary rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
}
