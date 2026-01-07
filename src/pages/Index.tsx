import React, { useState, useMemo, useCallback } from 'react';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { useItemStore } from '@/store/useItemStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useFormatCurrency } from '@/hooks/use-business';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  AlertTriangle,
  Plus,
  ShoppingCart,
  Truck,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock chart data
const salesData = [
  { day: 'Mon', sales: 45000 },
  { day: 'Tue', sales: 52000 },
  { day: 'Wed', sales: 38000 },
  { day: 'Thu', sales: 67000 },
  { day: 'Fri', sales: 89000 },
  { day: 'Sat', sales: 123000 },
  { day: 'Sun', sales: 78000 },
];

const topItems = [
  { name: 'Samsung Galaxy A54', sales: 15 },
  { name: 'iPhone 14 Pro', sales: 8 },
  { name: 'USB-C Cable', sales: 45 },
  { name: 'Wireless Earbuds', sales: 22 },
  { name: 'Power Bank', sales: 18 },
];

const categoryData = [
  { name: 'Electronics', value: 35, color: '#8884d8' },
  { name: 'Clothing', value: 25, color: '#82ca9d' },
  { name: 'Food', value: 20, color: '#ffc658' },
  { name: 'Other', value: 20, color: '#ff7c7c' },
];

const recentTransactions = [
  { id: '1', type: 'Sale', customer: 'John Doe', amount: 25000, date: '2024-01-15', status: 'Completed' },
  { id: '2', type: 'Purchase', supplier: 'ABC Corp', amount: 15000, date: '2024-01-14', status: 'Pending' },
  { id: '3', type: 'Sale', customer: 'Jane Smith', amount: 32000, date: '2024-01-13', status: 'Completed' },
  { id: '4', type: 'Expense', description: 'Office Supplies', amount: 5000, date: '2024-01-12', status: 'Completed' },
  { id: '5', type: 'Sale', customer: 'Bob Johnson', amount: 18000, date: '2024-01-11', status: 'Completed' },
];

const Index = React.memo(() => {
  const { currentBusinessId } = useBusinessStore();
  const { getTodaysSales, getTodaysPurchases, getReceivables, getPayables } = useInvoiceStore();
  const { getTodaysCashIn, getTodaysCashOut } = usePaymentStore();
  const { getStockValue, getLowStockItems } = useItemStore();
  const { getTodaysExpenses } = useExpenseStore();
  const formatCurrency = useFormatCurrency();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    category: 'general',
  });

  const todaysSales = getTodaysSales(currentBusinessId || '') || 0;
  const todaysPurchases = getTodaysPurchases(currentBusinessId || '') || 0;
  const cashIn = getTodaysCashIn(currentBusinessId || '') || 0;
  const cashOut = getTodaysCashOut(currentBusinessId || '') || 0;
  const receivables = getReceivables(currentBusinessId || '') || 0;
  const payables = getPayables(currentBusinessId || '') || 0;
  const stockValue = getStockValue(currentBusinessId || '') || 0;
  const lowStockItems = getLowStockItems(currentBusinessId || '') || [];
  const todaysExpenses = getTodaysExpenses(currentBusinessId || '') || 0;

  const metrics = useMemo(() => [
    {
      title: "Today's Sales",
      value: formatCurrency(todaysSales),
      icon: TrendingUp,
      trend: '+12%',
      trendUp: true,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: "Today's Purchases",
      value: formatCurrency(todaysPurchases),
      icon: TrendingDown,
      trend: '-5%',
      trendUp: false,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Cash In',
      value: formatCurrency(cashIn),
      icon: ArrowUpRight,
      trend: '+8%',
      trendUp: true,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Cash Out',
      value: formatCurrency(cashOut + todaysExpenses),
      icon: ArrowDownRight,
      trend: '-3%',
      trendUp: false,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Receivables',
      value: formatCurrency(receivables),
      icon: Wallet,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Payables',
      value: formatCurrency(payables),
      icon: Wallet,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Stock Value',
      value: formatCurrency(stockValue),
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems.length.toString(),
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ], [formatCurrency, todaysSales, todaysPurchases, cashIn, cashOut, todaysExpenses, receivables, payables, stockValue, lowStockItems.length]);

  const quickActions = useMemo(() => [
    { icon: ShoppingCart, label: 'New Sale', path: '/sales/new', color: 'bg-success hover:bg-success/90' },
    { icon: Truck, label: 'New Purchase', path: '/purchases/new', color: 'bg-primary hover:bg-primary/90' },
    { icon: Users, label: 'Add Party', path: '/parties', color: 'bg-accent hover:bg-accent/90' },
    { icon: Package, label: 'Add Item', path: '/items', color: 'bg-sidebar hover:bg-sidebar/90' },
  ], []);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    setIsFormOpen(false);
    setFormData({ name: '', email: '', message: '', category: 'general' });
  }, [formData]);

  const filteredTransactions = useMemo(() => recentTransactions.filter(transaction =>
    transaction.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
  ), [searchTerm]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-4 sm:p-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-lg sm:text-xl md:text-2xl">Dashboard</h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base">Welcome back! Here's your business overview.</p>
        </div>
      </div>

      {/* Quick Actions - Simplified */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {quickActions.slice(0, 4).map((action) => (
          <Link key={action.path} to={action.path}>
            <Button className={`w-full h-12 ${action.color} text-primary-foreground text-sm`}>
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Metrics Grid - Reduced to 4 key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {metrics.slice(0, 4).map((metric) => (
          <Card key={metric.title} className="metric-card">
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
                <p className="stat-value text-lg">{metric.value}</p>
                <p className="stat-label text-xs">{metric.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section - Simplified */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Chart */}
        <Card>
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
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Sales']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#salesGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Items Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    className="text-xs"
                    width={80}
                    tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert - Simplified */}
      {lowStockItems.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {lowStockItems.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-card rounded-lg border border-border"
                >
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
            {lowStockItems.length > 6 && (
              <Link to="/items" className="block mt-3">
                <Button variant="outline" className="w-full h-8 text-xs">
                  View all {lowStockItems.length} low stock items
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export default Index;
