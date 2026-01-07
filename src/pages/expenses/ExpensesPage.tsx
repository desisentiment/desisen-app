import { useState, useEffect } from 'react';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { formatDate } from '@/utils/helpers';
import { useFormatCurrency } from '@/hooks/use-business';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExpenseCategory } from '@/types';

const categories: ExpenseCategory[] = [
  'Rent',
  'Utilities',
  'Salary',
  'Transport',
  'Office Supplies',
  'Maintenance',
  'Marketing',
  'Other',
];

export default function ExpensesPage() {
  const { currentBusinessId } = useBusinessStore();
  const effectiveBusinessId = currentBusinessId || 'default-business-id';
  const { getExpensesByBusiness, addExpense, deleteExpense, getTotalExpenses, getTodaysExpenses } = useExpenseStore();
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();
  const isMobile = useIsMobile();

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [outerRadius, setOuterRadius] = useState(80);

  useEffect(() => {
    const updateRadius = () => {
      const width = window.innerWidth;
      if (width < 640) setOuterRadius(50);
      else if (width < 768) setOuterRadius(60);
      else if (width < 1024) setOuterRadius(80);
      else setOuterRadius(100);
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  const expenses = getExpensesByBusiness(effectiveBusinessId);
  const totalExpenses = getTotalExpenses(effectiveBusinessId) || 0;
  const todaysExpenses = getTodaysExpenses(effectiveBusinessId) || 0;

  const [formData, setFormData] = useState({
    category: 'Other' as ExpenseCategory,
    amount: "",
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      category: 'Other',
      amount: "",
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid expense amount.',
        variant: 'destructive',
      });
      return;
    }
    if (Number(formData.amount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Expense amount must be greater than zero.',
        variant: 'destructive',
      });
      return;
    }

    addExpense({
      businessId: effectiveBusinessId,
      category: formData.category,
      amount: Number(formData.amount) || 0,
      date: new Date(formData.date),
      paidBy: 'cash',
      notes: formData.notes,
    });

    toast({
      title: 'Expense Added',
      description: `${formData.category} expense of ${formatCurrency(Number(formData.amount) || 0)} recorded.`,
    });

    resetForm();
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    toast({
      title: 'Expense Deleted',
      description: 'Expense has been removed.',
      variant: 'destructive',
    });
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.category.toLowerCase().includes(search.toLowerCase()) ||
      exp.notes.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate category-wise totals
  const categoryTotals = categories.map((cat) => ({
    category: cat,
    total: expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  })).filter((c) => c.total > 0);

  // Chart data
  const chartData = categoryTotals.map((cat, index) => ({
    name: cat.category,
    value: cat.total,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`,
  }));

  const chartConfig = categoryTotals.reduce((config, cat, index) => {
    config[cat.category.toLowerCase()] = {
      label: cat.category,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return config;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title text-xl md:text-2xl">Expenses</h1>
          <p className="text-muted-foreground text-sm md:text-base">Track your business expenses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: ExpenseCategory) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder=""
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="What was this expense for?"
                  rows={3}
                  className="min-h-[44px]"
                />
              </div>

              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Paid By</p>
                <p className="font-semibold">Cash</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Expense
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="metric-card md:col-span-2">
          <CardContent className="p-4">
            <p className="stat-label">Total Expenses</p>
            <p className="stat-value text-destructive">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4">
            <p className="stat-label">Today</p>
            <p className="stat-value">{formatCurrency(todaysExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4">
            <p className="stat-label">Categories</p>
            <p className="stat-value">{categoryTotals.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categoryTotals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="h-64 sm:h-72 md:h-80"
              >
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={outerRadius}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {categoryTotals.map((cat) => (
                  <div key={cat.category} className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{cat.category}</p>
                    <p className="font-semibold text-destructive">{formatCurrency(cat.total)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-40 min-h-[44px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredExpenses.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No expenses recorded</h3>
          <p className="text-muted-foreground mb-4">Track your business expenses here</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </Card>
      ) : (
        <Card>
          {isMobile ? (
            <div className="space-y-4 p-4">
              {filteredExpenses.map((expense) => (
                <Card key={expense.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{expense.category}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
                    <p className="text-sm">{expense.notes || 'No notes'}</p>
                    <p className="font-semibold text-destructive">{formatCurrency(expense.amount)}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="table-row">
                      <TableCell>
                        <Badge variant="secondary">{expense.category}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {expense.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
