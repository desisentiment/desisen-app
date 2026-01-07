import React, { useMemo, useState, useEffect } from 'react';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { useItemStore } from '@/store/useItemStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useFormatCurrency } from '@/hooks/use-business';
import { usePerformanceOptimization } from '@/hooks/use-performance';
import {
  TrendingUp, TrendingDown, Wallet, Package, AlertTriangle,
  ShoppingCart, Truck, Users, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';

interface MetricCard {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  color: string;
  bgColor: string;
}

// Skeleton loader component
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title text-xl md:text-2xl">Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">Loading your business data...</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 md:h-14 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="p-3 md:p-4 bg-card rounded-lg border animate-pulse">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 bg-muted rounded-lg" />
              <div className="w-8 h-4 bg-muted rounded" />
            </div>
            <div className="space-y-1">
              <div className="w-16 h-5 bg-muted rounded" />
              <div className="w-12 h-3 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-6 bg-card rounded-lg border animate-pulse">
            <div className="w-32 h-4 bg-muted rounded mb-4" />
            <div className="w-full h-40 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Quick actions configuration
const QUICK_ACTIONS = [
  { icon: ShoppingCart, label: 'New Sale', path: '/sales/new', color: 'bg-success hover:bg-success/90' },
  { icon: Truck, label: 'New Purchase', path: '/purchases/new', color: 'bg-primary hover:bg-primary/90' },
  { icon: Users, label: 'Add Party', path: '/parties', color: 'bg-accent hover:bg-accent/90' },
  { icon: Package, label: 'Add Item', path: '/items', color: 'bg-sidebar hover:bg-sidebar/90' },
] as const;

export default React.memo(function DashboardPage() {
  const { currentBusinessId } = useBusinessStore();
  const { invoices, getTodaysSales, getTodaysPurchases, getReceivables, getPayables } = useInvoiceStore();
  const { getTodaysCashIn, getTodaysCashOut } = usePaymentStore();
  const { items, getStockValue, getLowStockItems } = useItemStore();
  const { getTodaysExpenses } = useExpenseStore();
  const formatCurrency = useFormatCurrency();
  const { componentRef } = usePerformanceOptimization(() => {});

  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsDataLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Memoized metrics calculations
  const metrics = useMemo(() => {
    const todaysSales = getTodaysSales(currentBusinessId || '') || 0;
    const todaysPurchases = getTodaysPurchases(currentBusinessId || '') || 0;
    const cashIn = getTodaysCashIn(currentBusinessId || '') || 0;
    const cashOut = getTodaysCashOut(currentBusinessId || '') || 0;
    const receivables = getReceivables(currentBusinessId || '') || 0;
    const payables = getPayables(currentBusinessId || '') || 0;
    const stockValue = getStockValue(currentBusinessId || '') || 0;
    const lowStockItems = getLowStockItems(currentBusinessId || '') || [];
    const todaysExpenses = getTodaysExpenses(currentBusinessId || '') || 0;

    const cardData: MetricCard[] = [
      { title: "Today's Sales", value: formatCurrency(todaysSales), icon: TrendingUp, trend: '+12%', trendUp: true, color: 'text-success', bgColor: 'bg-success/10' },
      { title: "Today's Purchases", value: formatCurrency(todaysPurchases), icon: TrendingDown, trend: '-5%', trendUp: false, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Cash In', value: formatCurrency(cashIn), icon: ArrowUpRight, trend: '+8%', trendUp: true, color: 'text-success', bgColor: 'bg-success/10' },
      { title: 'Cash Out', value: formatCurrency(cashOut + todaysExpenses), icon: ArrowDownRight, trend: '-3%', trendUp: false, color: 'text-destructive', bgColor: 'bg-destructive/10' },
      { title: 'Receivables', value: formatCurrency(receivables), icon: Wallet, color: 'text-warning', bgColor: 'bg-warning/10' },
      { title: 'Payables', value: formatCurrency(payables), icon: Wallet, color: 'text-destructive', bgColor: 'bg-destructive/10' },
      { title: 'Stock Value', value: formatCurrency(stockValue), icon: Package, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Low Stock Items', value: lowStockItems.length.toString(), icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10' },
    ];

    return { cardData, lowStockItems, cashOut, todaysExpenses };
  }, [currentBusinessId, getTodaysSales, getTodaysPurchases, getTodaysCashIn, getTodaysCashOut, getReceivables, getPayables, getStockValue, getLowStockItems, getTodaysExpenses, formatCurrency]);

  // Sales chart data - last 7 days
  const salesData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = days[date.getDay()];
      const daySales = invoices
        .filter(inv => inv.businessId === currentBusinessId && inv.type === 'sale')
        .filter(inv => new Date(inv.date).toDateString() === date.toDateString())
        .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      return { day: dayName, sales: daySales };
    });
  }, [invoices, currentBusinessId]);

  // Top items by stock
  const topItems = useMemo(() => {
    return items
      .filter(item => item.businessId === currentBusinessId)
      .sort((a, b) => (b.currentStock || 0) - (a.currentStock || 0))
      .slice(0, 5)
      .map(item => ({ name: item.name, sales: item.currentStock || 0 }));
  }, [items, currentBusinessId]);

  if (isDataLoading) return <DashboardSkeleton />;

  return (
    <div ref={componentRef} className="space-y-6 animate-fade-in" role="main" aria-labelledby="dashboard-heading">
      <div className="page-header">
        <div>
          <h1 id="dashboard-heading" className="page-title text-xl md:text-2xl">Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">Welcome back! Here's your business overview.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3" role="toolbar" aria-label="Quick actions">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.path} to={action.path}>
            <Button className={`w-full h-12 ${action.color} text-primary-foreground text-sm`}>
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3" role="region" aria-label="Key business metrics">
        {metrics.cardData.map((metric) => (
          <Card key={metric.title} className="metric-card" role="article" aria-label={metric.title}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className={`p-1.5 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
                {metric.trend && (
                  <span className={`text-xs font-medium ${metric.trendUp ? 'text-success' : 'text-destructive'}`}>
                    {metric.trend}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <p className="stat-value text-lg" aria-live="polite">{metric.value}</p>
                <p className="stat-label text-xs">{metric.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" role="region" aria-label="Business charts">
        <Card role="article" aria-label="Sales chart">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sales Overview (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Sales']} />
                  <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#salesGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card role="article" aria-label="Top items chart">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={80} tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {metrics.lowStockItems.length > 0 && (
        <Card className="border-warning/50 bg-warning/5" role="alert" aria-live="assertive">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="sr-only">You have {metrics.lowStockItems.length} items with low stock</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {metrics.lowStockItems.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-card rounded-lg border">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.sku}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-bold text-destructive text-sm">{item.currentStock}</p>
                    <p className="text-xs text-muted-foreground">in stock</p>
                  </div>
                </div>
              ))}
            </div>
            {metrics.lowStockItems.length > 6 && (
              <Link to="/items" className="block mt-3">
                <Button variant="outline" className="w-full h-8 text-xs">View all {metrics.lowStockItems.length} low stock items</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});
