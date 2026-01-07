import { useState, useMemo, useCallback, useEffect } from 'react';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useUnifiedParties, useUnifiedItems } from '@/hooks/useUnifiedData';
import { formatDate } from '@/utils/helpers';
import { useFormatCurrency } from '@/hooks/use-business';
import { useIsMobile } from '@/hooks/use-mobile';
import { Invoice, Payment, Expense } from '@/types';
import { generateInvoiceFromHTML } from '@/utils/pdfGenerator';

// CSV Export Utility Functions
const convertToCSV = (data: Record<string, unknown>[], headers: string[]) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  return csvContent;
};

const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Functions (defined inside component to access state)
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie } from 'recharts';

export default function ReportsPage() {
  const { currentBusinessId } = useBusinessStore();
  const effectiveBusinessId = currentBusinessId || 'default-business-id';
  const { getInvoicesByBusiness } = useInvoiceStore();
  const { getPaymentsByBusiness } = usePaymentStore();
  const { getExpensesByBusiness } = useExpenseStore();
  const { data: items = [] } = useUnifiedItems(effectiveBusinessId);
  const { data: parties = [] } = useUnifiedParties(effectiveBusinessId);
  const formatCurrency = useFormatCurrency();
  const isMobile = useIsMobile();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedReport, setSelectedReport] = useState('sales');
  const [periodType, setPeriodType] = useState('custom'); // 'custom', 'monthly', 'yearly'
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
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

  const invoices = getInvoicesByBusiness(effectiveBusinessId);
  const payments = getPaymentsByBusiness(effectiveBusinessId);
  const expenses = getExpensesByBusiness(effectiveBusinessId);
  // const items = getItemsByBusiness(effectiveBusinessId); // Now using unifiedItems
  // const parties = getPartiesByBusiness(effectiveBusinessId); // Now using unifiedParties

  // Filter data by date range
  const filterInvoicesByDate = useCallback((invoices: Invoice[], from?: string, to?: string) => {
    const fromDate = from || dateFrom;
    const toDate = to || dateTo;
    if (!fromDate && !toDate) return invoices;
    return invoices.filter(inv => {
      const itemDate = inv.date instanceof Date ? inv.date : new Date(inv.date);
      const fromCheck = !fromDate || itemDate >= new Date(fromDate);
      const toCheck = !toDate || itemDate <= new Date(toDate + 'T23:59:59');
      return fromCheck && toCheck;
    });
  }, [dateFrom, dateTo]);

  const filterPaymentsByDate = useCallback((payments: Payment[], from?: string, to?: string) => {
    const fromDate = from || dateFrom;
    const toDate = to || dateTo;
    if (!fromDate && !toDate) return payments;
    return payments.filter(payment => {
      const itemDate = payment.date instanceof Date ? payment.date : new Date(payment.date);
      const fromCheck = !fromDate || itemDate >= new Date(fromDate);
      const toCheck = !toDate || itemDate <= new Date(toDate + 'T23:59:59');
      return fromCheck && toCheck;
    });
  }, [dateFrom, dateTo]);

  const filterExpensesByDate = useCallback((expenses: Expense[], from?: string, to?: string) => {
    const fromDate = from || dateFrom;
    const toDate = to || dateTo;
    if (!fromDate && !toDate) return expenses;
    return expenses.filter(expense => {
      const itemDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
      const fromCheck = !fromDate || itemDate >= new Date(fromDate);
      const toCheck = !toDate || itemDate <= new Date(toDate + 'T23:59:59');
      return fromCheck && toCheck;
    });
  }, [dateFrom, dateTo]);

  // Sales Report Data
  const salesReport = useMemo(() => {
    const salesInvoices = invoices.filter(inv => inv.type === 'sale');
    const filteredSales = filterInvoicesByDate(salesInvoices);

    const totalSales = filteredSales.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaid = filteredSales.filter(inv => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalUnpaid = totalSales - totalPaid;

    // Sales by customer
    const salesByCustomer: Record<string, { total: number; count: number; paid: number; unpaid: number }> = {};
    filteredSales.forEach(inv => {
      const customer = parties.find(p => p.id === inv.partyId);
      const customerName = customer?.name || 'Unknown Customer';
      if (!salesByCustomer[customerName]) {
        salesByCustomer[customerName] = { total: 0, count: 0, paid: 0, unpaid: 0 };
      }
      salesByCustomer[customerName].total += inv.grandTotal;
      salesByCustomer[customerName].count += 1;
      if (inv.paymentStatus === 'paid') {
        salesByCustomer[customerName].paid += inv.grandTotal;
      } else {
        salesByCustomer[customerName].unpaid += inv.grandTotal;
      }
    });

    // Comparison calculation
    let previousTotalSales = 0;
    let salesChangePercent = 0;
    if (periodType === 'monthly' && selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      const prevMonth = month - 1;
      const prevYear = prevMonth === 0 ? year - 1 : year;
      const prevMonthNum = prevMonth === 0 ? 12 : prevMonth;
      const prevStart = new Date(prevYear, prevMonthNum - 1, 1).toISOString().split('T')[0];
      const prevEnd = new Date(prevYear, prevMonthNum, 0).toISOString().split('T')[0];
      const prevFiltered = filterInvoicesByDate(salesInvoices, prevStart, prevEnd);
      previousTotalSales = prevFiltered.reduce((sum, inv) => sum + inv.grandTotal, 0);
      if (previousTotalSales > 0) {
        salesChangePercent = ((totalSales - previousTotalSales) / previousTotalSales) * 100;
      }
    } else if (periodType === 'yearly' && selectedYear) {
      const prevYear = parseInt(selectedYear) - 1;
      const prevStart = new Date(prevYear, 0, 1).toISOString().split('T')[0];
      const prevEnd = new Date(prevYear, 11, 31).toISOString().split('T')[0];
      const prevFiltered = filterInvoicesByDate(salesInvoices, prevStart, prevEnd);
      previousTotalSales = prevFiltered.reduce((sum, inv) => sum + inv.grandTotal, 0);
      if (previousTotalSales > 0) {
        salesChangePercent = ((totalSales - previousTotalSales) / previousTotalSales) * 100;
      }
    }

    return {
      totalSales,
      totalPaid,
      totalUnpaid,
      invoiceCount: filteredSales.length,
      salesByCustomer: Object.entries(salesByCustomer)
        .map(([customer, data]) => ({
          customer,
          total: data.total,
          count: data.count,
          paid: data.paid,
          unpaid: data.unpaid,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10), // Top 10 customers
      previousTotalSales,
      salesChangePercent,
    };
  }, [invoices, parties, periodType, selectedMonth, selectedYear, filterInvoicesByDate]);

  // Purchase Report Data
  const purchaseReport = useMemo(() => {
    const purchaseInvoices = invoices.filter(inv => inv.type === 'purchase');
    const filteredPurchases = filterInvoicesByDate(purchaseInvoices);

    const totalPurchases = filteredPurchases.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaid = filteredPurchases.filter(inv => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalUnpaid = totalPurchases - totalPaid;

    // Purchases by supplier
    const purchasesBySupplier: Record<string, { total: number; count: number; paid: number; unpaid: number }> = {};
    filteredPurchases.forEach(inv => {
      const supplier = parties.find(p => p.id === inv.partyId);
      const supplierName = supplier?.name || 'Unknown Supplier';
      if (!purchasesBySupplier[supplierName]) {
        purchasesBySupplier[supplierName] = { total: 0, count: 0, paid: 0, unpaid: 0 };
      }
      purchasesBySupplier[supplierName].total += inv.grandTotal;
      purchasesBySupplier[supplierName].count += 1;
      if (inv.paymentStatus === 'paid') {
        purchasesBySupplier[supplierName].paid += inv.grandTotal;
      } else {
        purchasesBySupplier[supplierName].unpaid += inv.grandTotal;
      }
    });

    return {
      totalPurchases,
      totalPaid,
      totalUnpaid,
      invoiceCount: filteredPurchases.length,
      purchasesBySupplier: Object.entries(purchasesBySupplier)
        .map(([supplier, data]) => ({
          supplier,
          total: data.total,
          count: data.count,
          paid: data.paid,
          unpaid: data.unpaid,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10), // Top 10 suppliers
    };
  }, [invoices, parties, filterInvoicesByDate]);

  // Stock Report Data
  const stockReport = useMemo(() => {
    const lowStockItems = items.filter(item => item.currentStock <= item.lowStockAlert);
    const outOfStockItems = items.filter(item => item.currentStock === 0);
    const totalStockValue = items.reduce((sum, item) => sum + (item.currentStock * item.salePrice), 0);

    // Stock by category
    const stockByCategory = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { totalItems: 0, totalStock: 0, totalValue: 0 };
      }
      acc[item.category].totalItems += 1;
      acc[item.category].totalStock += item.currentStock;
      acc[item.category].totalValue += item.currentStock * item.salePrice;
      return acc;
    }, {} as Record<string, { totalItems: number; totalStock: number; totalValue: number }>);

    return {
      totalItems: items.length,
      totalStockValue,
      lowStockItems,
      outOfStockItems,
      stockByCategory: Object.entries(stockByCategory).map(([category, data]) => ({
        category,
        ...data,
      })),
    };
  }, [items]);

  // Profit & Loss Report Data
  const profitLossReport = useMemo(() => {
    const salesInvoices = filterInvoicesByDate(invoices.filter(inv => inv.type === 'sale'));
    const purchaseInvoices = filterInvoicesByDate(invoices.filter(inv => inv.type === 'purchase'));
    const filteredExpenses = filterExpensesByDate(expenses);

    const totalRevenue = salesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalCostOfGoods = purchaseInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const grossProfit = totalRevenue - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;

    // Monthly breakdown (simplified)
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
    salesInvoices.forEach(inv => {
      const month = formatDate(inv.date).substring(3); // MM/YYYY format
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 };
      }
      monthlyData[month].revenue += inv.grandTotal;
    });

    filteredExpenses.forEach(exp => {
      const month = formatDate(exp.date).substring(3);
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 };
      }
      monthlyData[month].expenses += exp.amount;
    });

    // Comparison calculation
    let previousNetProfit = 0;
    let profitChangePercent = 0;
    if (periodType === 'monthly' && selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      const prevMonth = month - 1;
      const prevYear = prevMonth === 0 ? year - 1 : year;
      const prevMonthNum = prevMonth === 0 ? 12 : prevMonth;
      const prevStart = new Date(prevYear, prevMonthNum - 1, 1).toISOString().split('T')[0];
      const prevEnd = new Date(prevYear, prevMonthNum, 0).toISOString().split('T')[0];
      const prevSales = filterInvoicesByDate(invoices.filter(inv => inv.type === 'sale'), prevStart, prevEnd);
      const prevPurchases = filterInvoicesByDate(invoices.filter(inv => inv.type === 'purchase'), prevStart, prevEnd);
      const prevExpenses = filterExpensesByDate(expenses, prevStart, prevEnd);
      const prevRevenue = prevSales.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const prevCostOfGoods = prevPurchases.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const prevTotalExpenses = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      previousNetProfit = prevRevenue - prevCostOfGoods - prevTotalExpenses;
      if (previousNetProfit !== 0) {
        profitChangePercent = ((netProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100;
      }
    } else if (periodType === 'yearly' && selectedYear) {
      const prevYear = parseInt(selectedYear) - 1;
      const prevStart = new Date(prevYear, 0, 1).toISOString().split('T')[0];
      const prevEnd = new Date(prevYear, 11, 31).toISOString().split('T')[0];
      const prevSales = filterInvoicesByDate(invoices.filter(inv => inv.type === 'sale'), prevStart, prevEnd);
      const prevPurchases = filterInvoicesByDate(invoices.filter(inv => inv.type === 'purchase'), prevStart, prevEnd);
      const prevExpenses = filterExpensesByDate(expenses, prevStart, prevEnd);
      const prevRevenue = prevSales.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const prevCostOfGoods = prevPurchases.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const prevTotalExpenses = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      previousNetProfit = prevRevenue - prevCostOfGoods - prevTotalExpenses;
      if (previousNetProfit !== 0) {
        profitChangePercent = ((netProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100;
      }
    }

    return {
      totalRevenue,
      totalCostOfGoods,
      grossProfit,
      totalExpenses,
      netProfit,
      monthlyBreakdown: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      })),
      previousNetProfit,
      profitChangePercent,
    };
  }, [invoices, expenses, periodType, selectedMonth, selectedYear, filterInvoicesByDate, filterExpensesByDate]);

  // Payment Report Data
  const paymentReport = useMemo(() => {
    const filteredPayments = filterPaymentsByDate(payments);

    const paymentsIn = filteredPayments.filter(p => p.type === 'in');
    const paymentsOut = filteredPayments.filter(p => p.type === 'out');

    const totalReceived = paymentsIn.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = paymentsOut.reduce((sum, p) => sum + p.amount, 0);

    // Payments by party
    const paymentsByParty: Record<string, { received: number; paid: number; partyType: string }> = {};
    filteredPayments.forEach(payment => {
      const party = parties.find(p => p.id === payment.partyId);
      const partyName = party?.name || 'Unknown Party';
      const partyType = party?.type || 'unknown';

      if (!paymentsByParty[partyName]) {
        paymentsByParty[partyName] = { received: 0, paid: 0, partyType };
      }

      if (payment.type === 'in') {
        paymentsByParty[partyName].received += payment.amount;
      } else {
        paymentsByParty[partyName].paid += payment.amount;
      }
    });

    // Payment method breakdown
    const paymentMethodBreakdown: Record<string, { received: number; paid: number }> = {};
    filteredPayments.forEach(payment => {
      const method = payment.paymentMethod;
      if (!paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method] = { received: 0, paid: 0 };
      }
      if (payment.type === 'in') {
        paymentMethodBreakdown[method].received += payment.amount;
      } else {
        paymentMethodBreakdown[method].paid += payment.amount;
      }
    });

    return {
      totalReceived,
      totalPaid,
      netCashFlow: totalReceived - totalPaid,
      paymentCount: filteredPayments.length,
      paymentsByParty: Object.entries(paymentsByParty).map(([party, data]) => ({
        party,
        received: data.received,
        paid: data.paid,
        partyType: data.partyType,
      })),
      paymentMethodBreakdown: Object.entries(paymentMethodBreakdown).map(([method, data]) => ({
        method,
        received: data.received,
        paid: data.paid,
      })),
    };
  }, [payments, parties, filterPaymentsByDate]);

  // Expense Report Data
  const expenseReport = useMemo(() => {
    const filteredExpenses = filterExpensesByDate(expenses);

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Expenses by category
    const expensesByCategory: Record<string, { total: number; count: number }> = {};
    filteredExpenses.forEach(exp => {
      if (!expensesByCategory[exp.category]) {
        expensesByCategory[exp.category] = { total: 0, count: 0 };
      }
      expensesByCategory[exp.category].total += exp.amount;
      expensesByCategory[exp.category].count += 1;
    });

    // Monthly expense trend
    const monthlyExpenses: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      const month = formatDate(exp.date).substring(3);
      monthlyExpenses[month] = (monthlyExpenses[month] || 0) + exp.amount;
    });

    return {
      totalExpenses,
      expenseCount: filteredExpenses.length,
      expensesByCategory: Object.entries(expensesByCategory).map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
      })),
      monthlyTrend: Object.entries(monthlyExpenses).map(([month, amount]) => ({
        month,
        amount,
      })),
    };
  }, [expenses, filterExpensesByDate]);

  // Cash Flow Report Data
  const cashFlowReport = useMemo(() => {
    const filteredPayments = filterPaymentsByDate(payments);
    const filteredExpenses = filterExpensesByDate(expenses);

    // Cash inflows (payments received)
    const cashInflows = filteredPayments.filter(p => p.type === 'in').reduce((sum, p) => sum + p.amount, 0);

    // Cash outflows (payments made + expenses)
    const cashOutflowsPayments = filteredPayments.filter(p => p.type === 'out').reduce((sum, p) => sum + p.amount, 0);
    const cashOutflowsExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalCashOutflows = cashOutflowsPayments + cashOutflowsExpenses;

    const netCashFlow = cashInflows - totalCashOutflows;

    // Monthly cash flow
    const monthlyCashFlow: Record<string, { inflows: number; outflows: number; net: number }> = {};

    filteredPayments.forEach(payment => {
      const month = formatDate(payment.date).substring(3);
      if (!monthlyCashFlow[month]) {
        monthlyCashFlow[month] = { inflows: 0, outflows: 0, net: 0 };
      }
      if (payment.type === 'in') {
        monthlyCashFlow[month].inflows += payment.amount;
      } else {
        monthlyCashFlow[month].outflows += payment.amount;
      }
    });

    filteredExpenses.forEach(expense => {
      const month = formatDate(expense.date).substring(3);
      if (!monthlyCashFlow[month]) {
        monthlyCashFlow[month] = { inflows: 0, outflows: 0, net: 0 };
      }
      monthlyCashFlow[month].outflows += expense.amount;
    });

    Object.keys(monthlyCashFlow).forEach(month => {
      monthlyCashFlow[month].net = monthlyCashFlow[month].inflows - monthlyCashFlow[month].outflows;
    });

    return {
      cashInflows,
      cashOutflowsPayments,
      cashOutflowsExpenses,
      totalCashOutflows,
      netCashFlow,
      monthlyCashFlow: Object.entries(monthlyCashFlow).map(([month, data]) => ({
        month,
        inflows: data.inflows,
        outflows: data.outflows,
        net: data.net,
      })),
    };
  }, [payments, expenses, filterExpensesByDate, filterPaymentsByDate]);

  // Export Functions
  const exportSalesReport = () => {
    const periodInfo = periodType === 'custom' ? `${dateFrom || 'All'} to ${dateTo || 'All'}` : periodType === 'monthly' ? selectedMonth : selectedYear;
    const csvData = [
      {
        'Report Type': 'Sales Report',
        'Period Type': periodType,
        'Period': periodInfo,
        'Total Sales': salesReport.totalSales,
        'Paid Amount': salesReport.totalPaid,
        'Outstanding': salesReport.totalUnpaid,
        'Invoice Count': salesReport.invoiceCount,
        'Change %': periodType !== 'custom' ? `${salesReport.salesChangePercent.toFixed(2)}%` : 'N/A',
      },
      {}, // Empty row
      { 'Customer': 'Customer', 'Invoices': 'Invoices', 'Total Sales': 'Total Sales', 'Paid': 'Paid', 'Outstanding': 'Outstanding' },
      ...salesReport.salesByCustomer.map((item) => ({
        'Customer': item.customer,
        'Invoices': item.count,
        'Total Sales': item.total,
        'Paid': item.paid,
        'Outstanding': item.unpaid,
      }))
    ];

    const csvContent = convertToCSV(csvData, ['Report Type', 'Period Type', 'Period', 'Total Sales', 'Paid Amount', 'Outstanding', 'Invoice Count', 'Change %', 'Customer', 'Invoices', 'Paid']);
    const periodSuffix = periodType === 'monthly' ? selectedMonth : periodType === 'yearly' ? selectedYear : 'custom';
    downloadCSV(csvContent, `sales-report-${periodType}-${periodSuffix}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportPurchaseReport = () => {
    const csvData = [
      {
        'Report Type': 'Purchase Report',
        'Date Range': `${dateFrom || 'All'} to ${dateTo || 'All'}`,
        'Total Purchases': purchaseReport.totalPurchases,
        'Paid Amount': purchaseReport.totalPaid,
        'Outstanding': purchaseReport.totalUnpaid,
        'Invoice Count': purchaseReport.invoiceCount,
      },
      {}, // Empty row
      { 'Supplier': 'Supplier', 'Invoices': 'Invoices', 'Total Purchases': 'Total Purchases', 'Paid': 'Paid', 'Outstanding': 'Outstanding' },
      ...purchaseReport.purchasesBySupplier.map((item) => ({
        'Supplier': item.supplier,
        'Invoices': item.count,
        'Total Purchases': item.total,
        'Paid': item.paid,
        'Outstanding': item.unpaid,
      }))
    ];

    const csvContent = convertToCSV(csvData, ['Report Type', 'Date Range', 'Total Purchases', 'Paid Amount', 'Outstanding', 'Invoice Count', 'Supplier', 'Invoices', 'Paid']);
    downloadCSV(csvContent, `purchase-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportStockReport = () => {
    const csvData = [
      {
        'Report Type': 'Stock Report',
        'Total Items': stockReport.totalItems,
        'Total Stock Value': stockReport.totalStockValue,
        'Low Stock Items': stockReport.lowStockItems.length,
        'Out of Stock Items': stockReport.outOfStockItems.length,
      },
      {}, // Empty row
      { 'Category': 'Category', 'Items': 'Items', 'Total Stock': 'Total Stock', 'Value': 'Value' },
      ...stockReport.stockByCategory.map((item) => ({
        'Category': item.category,
        'Items': item.totalItems,
        'Total Stock': item.totalStock,
        'Value': item.totalValue,
      }))
    ];

    const csvContent = convertToCSV(csvData, ['Report Type', 'Total Items', 'Total Stock Value', 'Low Stock Items', 'Out of Stock Items', 'Category', 'Items', 'Total Stock', 'Value']);
    downloadCSV(csvContent, `stock-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportProfitLossReport = () => {
    const csvData = [
      {
        'Report Type': 'Profit & Loss Report',
        'Date Range': `${dateFrom || 'All'} to ${dateTo || 'All'}`,
        'Total Revenue': profitLossReport.totalRevenue,
        'Cost of Goods': profitLossReport.totalCostOfGoods,
        'Gross Profit': profitLossReport.grossProfit,
        'Total Expenses': profitLossReport.totalExpenses,
        'Net Profit': profitLossReport.netProfit,
      },
      {}, // Empty row
      { 'Month': 'Month', 'Revenue': 'Revenue', 'Expenses': 'Expenses', 'Profit': 'Profit' },
      ...profitLossReport.monthlyBreakdown.map((item) => ({
        'Month': item.month,
        'Revenue': item.revenue,
        'Expenses': item.expenses,
        'Profit': item.profit,
      }))
    ];

    const csvContent = convertToCSV(csvData, ['Report Type', 'Date Range', 'Total Revenue', 'Cost of Goods', 'Gross Profit', 'Total Expenses', 'Net Profit', 'Month', 'Revenue', 'Expenses', 'Profit']);
    downloadCSV(csvContent, `profit-loss-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportPaymentReport = () => {
    const csvData = [
      {
        'Report Type': 'Payment Report',
        'Date Range': `${dateFrom || 'All'} to ${dateTo || 'All'}`,
        'Total Received': paymentReport.totalReceived,
        'Total Paid': paymentReport.totalPaid,
        'Net Cash Flow': paymentReport.netCashFlow,
        'Transaction Count': paymentReport.paymentCount,
      },
      {}, // Empty row
      { 'Party': 'Party', 'Type': 'Type', 'Received': 'Received', 'Paid': 'Paid', 'Net': 'Net' },
      ...paymentReport.paymentsByParty.map((item) => ({
        'Party': item.party,
        'Type': item.partyType,
        'Received': item.received,
        'Paid': item.paid,
        'Net': item.received - item.paid,
      }))
    ];

    const csvContent = convertToCSV(csvData, ['Report Type', 'Date Range', 'Total Received', 'Total Paid', 'Net Cash Flow', 'Transaction Count', 'Party', 'Type', 'Received', 'Paid', 'Net']);
    downloadCSV(csvContent, `payment-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportExpenseReport = () => {
    const csvData = [
      {
        'Report Type': 'Expense Report',
        'Date Range': `${dateFrom || 'All'} to ${dateTo || 'All'}`,
        'Total Expenses': expenseReport.totalExpenses,
        'Expense Count': expenseReport.expenseCount,
      },
      {}, // Empty row
      { 'Category': 'Category', 'Count': 'Count', 'Total': 'Total', 'Average': 'Average' },
      ...expenseReport.expensesByCategory.map((item) => ({
        'Category': item.category,
        'Count': item.count,
        'Total': item.total,
        'Average': item.total / item.count,
      })),
      {}, // Empty row
      { 'Month': 'Month', 'Amount': 'Amount' },
      ...expenseReport.monthlyTrend.map((item) => ({
        'Month': item.month,
        'Amount': item.amount,
      }))
    ];

    const csvContent = convertToCSV(csvData, ['Report Type', 'Date Range', 'Total Expenses', 'Expense Count', 'Category', 'Count', 'Total', 'Average', 'Month', 'Amount']);
    downloadCSV(csvContent, `expense-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportCashFlowReport = () => {
    const csvData = [
      {
        'Report Type': 'Cash Flow Report',
        'Date Range': `${dateFrom || 'All'} to ${dateTo || 'All'}`,
        'Cash Inflows': cashFlowReport.cashInflows,
        'Cash Outflows (Payments)': cashFlowReport.cashOutflowsPayments,
        'Cash Outflows (Expenses)': cashFlowReport.cashOutflowsExpenses,
        'Total Cash Outflows': cashFlowReport.totalCashOutflows,
        'Net Cash Flow': cashFlowReport.netCashFlow,
      },
      {}, // Empty row
      { 'Month': 'Month', 'Inflows': 'Inflows', 'Outflows': 'Outflows', 'Net': 'Net' },
      ...cashFlowReport.monthlyCashFlow.map((item) => ({
        'Month': item.month,
        'Inflows': item.inflows,
        'Outflows': item.outflows,
        'Net': item.net,
      }))
    ];

    const csvContent = convertToCSV(csvData, ['Report Type', 'Date Range', 'Cash Inflows', 'Cash Outflows (Payments)', 'Cash Outflows (Expenses)', 'Total Cash Outflows', 'Net Cash Flow', 'Month', 'Inflows', 'Outflows', 'Net']);
    downloadCSV(csvContent, `cash-flow-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-muted-foreground">Business analytics and comprehensive reports</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Report</SelectItem>
                    <SelectItem value="purchases">Purchase Report</SelectItem>
                    <SelectItem value="stock">Stock Report</SelectItem>
                    <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                    <SelectItem value="payments">Payment Report</SelectItem>
                    <SelectItem value="expenses">Expense Report</SelectItem>
                    <SelectItem value="cash-flow">Cash Flow Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period Type</Label>
                <Select value={periodType} onValueChange={(value) => {
                  setPeriodType(value);
                  if (value === 'custom') {
                    setDateFrom('');
                    setDateTo('');
                  } else if (value === 'monthly') {
                    const now = new Date();
                    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    setSelectedMonth(month);
                  } else if (value === 'yearly') {
                    const now = new Date();
                    setSelectedYear(now.getFullYear().toString());
                  }
                }}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Date Range</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row items-end gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    switch (selectedReport) {
                      case 'sales':
                        exportSalesReport();
                        break;
                      case 'purchases':
                        exportPurchaseReport();
                        break;
                      case 'stock':
                        exportStockReport();
                        break;
                      case 'profit-loss':
                        exportProfitLossReport();
                        break;
                      case 'payments':
                        exportPaymentReport();
                        break;
                      case 'expenses':
                        exportExpenseReport();
                        break;
                      case 'cash-flow':
                        exportCashFlowReport();
                        break;
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    const reportElement = document.getElementById(`report-${selectedReport}`);
                    if (reportElement) {
                      const fileName = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.pdf`;
                      await generateInvoiceFromHTML(`report-${selectedReport}`, fileName);
                    }
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

            {periodType === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>
              </div>
            )}

            {periodType === 'monthly' && (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Select Month</Label>
                  <Select value={selectedMonth} onValueChange={(value) => {
                    setSelectedMonth(value);
                    const [year, month] = value.split('-');
                    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                    const endDate = new Date(parseInt(year), parseInt(month), 0);
                    setDateFrom(startDate.toISOString().split('T')[0]);
                    setDateTo(endDate.toISOString().split('T')[0]);
                  }}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const year = date.getFullYear();
                        const month = date.getMonth() + 1;
                        const value = `${year}-${String(month).padStart(2, '0')}`;
                        const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                        return <SelectItem key={value} value={value}>{label}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {periodType === 'yearly' && (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Select Year</Label>
                  <Select value={selectedYear} onValueChange={(value) => {
                    setSelectedYear(value);
                    const startDate = new Date(parseInt(value), 0, 1);
                    const endDate = new Date(parseInt(value), 11, 31);
                    setDateFrom(startDate.toISOString().split('T')[0]);
                    setDateTo(endDate.toISOString().split('T')[0]);
                  }}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <SelectItem key={year} value={year.toString()}>{year}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <div className="overflow-x-auto">
          <TabsList className="flex w-max gap-1">
            <TabsTrigger value="sales" className="flex-shrink-0 px-3 py-1.5">Sales</TabsTrigger>
            <TabsTrigger value="purchases" className="flex-shrink-0 px-3 py-1.5">Purchases</TabsTrigger>
            <TabsTrigger value="stock" className="flex-shrink-0 px-3 py-1.5">Stock</TabsTrigger>
            <TabsTrigger value="profit-loss" className="flex-shrink-0 px-3 py-1.5">P&L</TabsTrigger>
            <TabsTrigger value="payments" className="flex-shrink-0 px-3 py-1.5">Payments</TabsTrigger>
            <TabsTrigger value="expenses" className="flex-shrink-0 px-3 py-1.5">Expenses</TabsTrigger>
            <TabsTrigger value="cash-flow" className="flex-shrink-0 px-3 py-1.5">Cash Flow</TabsTrigger>
          </TabsList>
        </div>

        {/* Sales Report */}
        <TabsContent value="sales" id="report-sales" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Total Sales</p>
                <p className="stat-value text-success text-sm sm:text-base">
                  {formatCurrency(salesReport.totalSales)}
                  {periodType !== 'custom' && salesReport.previousTotalSales > 0 && (
                    <span className={`ml-2 text-sm ${salesReport.salesChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesReport.salesChangePercent >= 0 ? <TrendingUp className="inline h-3 w-3 mr-1" /> : <TrendingDown className="inline h-3 w-3 mr-1" />}
                      {Math.abs(salesReport.salesChangePercent).toFixed(1)}%
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-2 sm:p-4">
                <p className="stat-label text-sm sm:text-base">Paid Amount</p>
                <p className="stat-value text-success text-sm sm:text-base">{formatCurrency(salesReport.totalPaid)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-2 sm:p-4">
                <p className="stat-label text-sm sm:text-base">Outstanding</p>
                <p className="stat-value text-destructive text-sm sm:text-base">{formatCurrency(salesReport.totalUnpaid)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-2 sm:p-4">
                <p className="stat-label text-sm sm:text-base">Invoices</p>
                <p className="stat-value text-sm sm:text-base">{salesReport.invoiceCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Customers by Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-4">
                  {salesReport.salesByCustomer.map((customer) => (
                    <Card key={customer.customer} className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{customer.customer}</span>
                        <span className="text-right font-semibold">{formatCurrency(customer.total)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Invoices: {customer.count}</span>
                        <span>Paid: {formatCurrency(customer.paid)}</span>
                      </div>
                      <div className="text-right text-sm text-destructive mt-1">
                        Outstanding: {formatCurrency(customer.unpaid)}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Customer</TableHead>
                        <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Invoices</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Total Sales</TableHead>
                        <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Paid</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Outstanding</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReport.salesByCustomer.map((customer) => (
                        <TableRow key={customer.customer}>
                          <TableCell className="font-medium text-xs sm:text-sm">{customer.customer}</TableCell>
                          <TableCell className="hidden sm:table-cell text-right text-xs sm:text-sm">{customer.count}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(customer.total)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-right text-success text-xs sm:text-sm">{formatCurrency(customer.paid)}</TableCell>
                          <TableCell className="text-right text-destructive text-xs sm:text-sm">{formatCurrency(customer.unpaid)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Report */}
        <TabsContent value="purchases" id="report-purchases" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Total Purchases</p>
                <p className="stat-value text-destructive text-sm sm:text-base">{formatCurrency(purchaseReport.totalPurchases)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Paid Amount</p>
                <p className="stat-value text-success text-sm sm:text-base">{formatCurrency(purchaseReport.totalPaid)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Outstanding</p>
                <p className="stat-value text-destructive text-sm sm:text-base">{formatCurrency(purchaseReport.totalUnpaid)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Invoices</p>
                <p className="stat-value text-sm sm:text-base">{purchaseReport.invoiceCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Suppliers by Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-4">
                  {purchaseReport.purchasesBySupplier.map((supplier) => (
                    <Card key={supplier.supplier} className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{supplier.supplier}</span>
                        <span className="text-right font-semibold">{formatCurrency(supplier.total)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Invoices: {supplier.count}</span>
                        <span>Paid: {formatCurrency(supplier.paid)}</span>
                      </div>
                      <div className="text-right text-sm text-destructive mt-1">
                        Outstanding: {formatCurrency(supplier.unpaid)}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Supplier</TableHead>
                        <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Invoices</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Total Purchases</TableHead>
                        <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Paid</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Outstanding</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseReport.purchasesBySupplier.map((supplier) => (
                        <TableRow key={supplier.supplier}>
                          <TableCell className="font-medium text-xs sm:text-sm">{supplier.supplier}</TableCell>
                          <TableCell className="hidden sm:table-cell text-right text-xs sm:text-sm">{supplier.count}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(supplier.total)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-right text-success text-xs sm:text-sm">{formatCurrency(supplier.paid)}</TableCell>
                          <TableCell className="text-right text-destructive text-xs sm:text-sm">{formatCurrency(supplier.unpaid)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Report */}
        <TabsContent value="stock" id="report-stock" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Total Items</p>
                <p className="stat-value text-sm sm:text-base">{stockReport.totalItems}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Stock Value</p>
                <p className="stat-value text-primary text-sm sm:text-base">{formatCurrency(stockReport.totalStockValue)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Low Stock</p>
                <p className="stat-value text-orange-600 text-sm sm:text-base">{stockReport.lowStockItems.length}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Out of Stock</p>
                <p className="stat-value text-destructive text-sm sm:text-base">{stockReport.outOfStockItems.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stockReport.lowStockItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline" className="text-orange-600">
                        {item.currentStock} / {item.lowStockAlert}
                      </Badge>
                    </div>
                  ))}
                  {stockReport.lowStockItems.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No low stock items</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <div className="space-y-4">
                    {stockReport.stockByCategory.map((category) => (
                      <Card key={category.category} className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.category}</span>
                          <span className="text-right font-semibold">{formatCurrency(category.totalValue)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                          <span>Items: {category.totalItems}</span>
                          <span>Stock: {category.totalStock}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Category</TableHead>
                          <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Items</TableHead>
                          <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Total Stock</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockReport.stockByCategory.map((category) => (
                          <TableRow key={category.category}>
                            <TableCell className="font-medium text-xs sm:text-sm">{category.category}</TableCell>
                            <TableCell className="hidden sm:table-cell text-right text-xs sm:text-sm">{category.totalItems}</TableCell>
                            <TableCell className="hidden sm:table-cell text-right text-xs sm:text-sm">{category.totalStock}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(category.totalValue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profit & Loss Report */}
        <TabsContent value="profit-loss" id="report-profit-loss" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Total Revenue</p>
                <p className="stat-value text-success text-sm sm:text-base">{formatCurrency(profitLossReport.totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Cost of Goods</p>
                <p className="stat-value text-destructive text-sm sm:text-base">{formatCurrency(profitLossReport.totalCostOfGoods)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Gross Profit</p>
                <p className={`stat-value ${profitLossReport.grossProfit >= 0 ? 'text-success' : 'text-destructive'} text-sm sm:text-base`}>
                  {formatCurrency(profitLossReport.grossProfit)}
                </p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Net Profit</p>
                <p className={`stat-value ${profitLossReport.netProfit >= 0 ? 'text-success' : 'text-destructive'} text-sm sm:text-base`}>
                  {formatCurrency(profitLossReport.netProfit)}
                  {periodType !== 'custom' && profitLossReport.previousNetProfit !== 0 && (
                    <span className={`ml-2 text-sm ${profitLossReport.profitChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitLossReport.profitChangePercent >= 0 ? <TrendingUp className="inline h-3 w-3 mr-1" /> : <TrendingDown className="inline h-3 w-3 mr-1" />}
                      {Math.abs(profitLossReport.profitChangePercent).toFixed(1)}%
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-4">
                  {profitLossReport.monthlyBreakdown.map((month) => (
                    <Card key={month.month} className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{month.month}</span>
                        <span className={`text-right font-semibold ${month.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(month.profit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Revenue: {formatCurrency(month.revenue)}</span>
                        <span>Expenses: {formatCurrency(month.expenses)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Month</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Revenue</TableHead>
                        <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Expenses</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profitLossReport.monthlyBreakdown.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium text-xs sm:text-sm">{month.month}</TableCell>
                          <TableCell className="text-right text-success text-xs sm:text-sm">{formatCurrency(month.revenue)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-right text-destructive text-xs sm:text-sm">{formatCurrency(month.expenses)}</TableCell>
                          <TableCell className={`text-right font-semibold ${month.profit >= 0 ? 'text-success' : 'text-destructive'} text-xs sm:text-sm`}>
                            {formatCurrency(month.profit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: { label: 'Revenue', color: 'hsl(var(--chart-1))' },
                  expenses: { label: 'Expenses', color: 'hsl(var(--chart-2))' },
                }}
                className="h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px]"
              >
                <BarChart data={profitLossReport.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Report */}
        <TabsContent value="payments" id="report-payments" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Total Received</p>
                <p className="stat-value text-success text-sm sm:text-base">{formatCurrency(paymentReport.totalReceived)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Total Paid</p>
                <p className="stat-value text-destructive text-sm sm:text-base">{formatCurrency(paymentReport.totalPaid)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Net Cash Flow</p>
                <p className={`stat-value ${paymentReport.netCashFlow >= 0 ? 'text-success' : 'text-destructive'} text-sm sm:text-base`}>
                  {formatCurrency(paymentReport.netCashFlow)}
                </p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Transactions</p>
                <p className="stat-value text-sm sm:text-base">{paymentReport.paymentCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payments by Party</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-4">
                  {paymentReport.paymentsByParty.map((party) => (
                    <Card key={party.party} className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{party.party}</span>
                        <Badge variant="outline" className="ml-2">{party.partyType}</Badge>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Received: {formatCurrency(party.received)}</span>
                        <span>Paid: {formatCurrency(party.paid)}</span>
                      </div>
                      <div className={`text-right font-semibold mt-1 ${party.received - party.paid >= 0 ? 'text-success' : 'text-destructive'}`}>
                        Net: {formatCurrency(party.received - party.paid)}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Party</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Type</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Received</TableHead>
                        <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Paid</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentReport.paymentsByParty.map((party) => (
                        <TableRow key={party.party}>
                          <TableCell className="font-medium text-xs sm:text-sm">{party.party}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                            <Badge variant="outline">{party.partyType}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-success text-xs sm:text-sm">{formatCurrency(party.received)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-right text-destructive text-xs sm:text-sm">{formatCurrency(party.paid)}</TableCell>
                          <TableCell className={`text-right font-semibold ${party.received - party.paid >= 0 ? 'text-success' : 'text-destructive'} text-xs sm:text-sm`}>
                            {formatCurrency(party.received - party.paid)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <div className="space-y-4">
                    {paymentReport.paymentMethodBreakdown.map((method) => (
                      <Card key={method.method} className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{method.method.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                          <span>Received: {formatCurrency(method.received)}</span>
                          <span>Paid: {formatCurrency(method.paid)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Method</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm">Received</TableHead>
                          <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentReport.paymentMethodBreakdown.map((method) => (
                          <TableRow key={method.method}>
                            <TableCell className="font-medium text-xs sm:text-sm">{method.method.replace('_', ' ').toUpperCase()}</TableCell>
                            <TableCell className="text-right text-success text-xs sm:text-sm">{formatCurrency(method.received)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-right text-destructive text-xs sm:text-sm">{formatCurrency(method.paid)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    received: { label: 'Received', color: 'hsl(var(--chart-1))' },
                    paid: { label: 'Paid', color: 'hsl(var(--chart-2))' },
                  }}
                  className="h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px]"
                >
                  <PieChart>
                    <Pie
                      data={paymentReport.paymentMethodBreakdown.flatMap(method => [
                        { name: `${method.method} Received`, value: method.received, fill: 'var(--color-received)' },
                        { name: `${method.method} Paid`, value: method.paid, fill: 'var(--color-paid)' },
                      ])}
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
          </div>
        </TabsContent>

        {/* Expense Report */}
        <TabsContent value="expenses" id="report-expenses" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Total Expenses</p>
                <p className="stat-value text-destructive text-sm sm:text-base">{formatCurrency(expenseReport.totalExpenses)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Categories</p>
                <p className="stat-value text-sm sm:text-base">{expenseReport.expensesByCategory.length}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Transactions</p>
                <p className="stat-value text-sm sm:text-base">{expenseReport.expenseCount}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Avg/Month</p>
                <p className="stat-value text-orange-600 text-sm sm:text-base">
                  {expenseReport.monthlyTrend.length > 0
                    ? formatCurrency(expenseReport.totalExpenses / expenseReport.monthlyTrend.length)
                    : formatCurrency(0)
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <div className="space-y-4">
                    {expenseReport.expensesByCategory.map((category) => (
                      <Card key={category.category} className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.category}</span>
                          <span className="text-right font-semibold text-destructive">{formatCurrency(category.total)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                          <span>Count: {category.count}</span>
                          <span>Avg: {formatCurrency(category.total / category.count)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Category</TableHead>
                          <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Count</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm">Total</TableHead>
                          <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Avg</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenseReport.expensesByCategory.map((category) => (
                          <TableRow key={category.category}>
                            <TableCell className="font-medium text-xs sm:text-sm">{category.category}</TableCell>
                            <TableCell className="hidden sm:table-cell text-right text-xs sm:text-sm">{category.count}</TableCell>
                            <TableCell className="text-right text-destructive text-xs sm:text-sm">{formatCurrency(category.total)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-right text-xs sm:text-sm">{formatCurrency(category.total / category.count)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Expense Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <div className="space-y-4">
                    {expenseReport.monthlyTrend.map((month) => (
                      <Card key={month.month} className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{month.month}</span>
                          <span className="text-right font-semibold text-destructive">{formatCurrency(month.amount)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Month</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenseReport.monthlyTrend.map((month) => (
                          <TableRow key={month.month}>
                            <TableCell className="font-medium text-xs sm:text-sm">{month.month}</TableCell>
                            <TableCell className="text-right text-destructive text-xs sm:text-sm">{formatCurrency(month.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cash Flow Report */}
        <TabsContent value="cash-flow" id="report-cash-flow" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Cash Inflows</p>
                <p className="stat-value text-success text-sm sm:text-base">{formatCurrency(cashFlowReport.cashInflows)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Cash Outflows</p>
                <p className="stat-value text-destructive text-sm sm:text-base">{formatCurrency(cashFlowReport.totalCashOutflows)}</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Net Cash Flow</p>
                <p className={`stat-value ${cashFlowReport.netCashFlow >= 0 ? 'text-success' : 'text-destructive'} text-sm sm:text-base`}>
                  {formatCurrency(cashFlowReport.netCashFlow)}
                </p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="stat-label text-sm sm:text-base">Operating Activities</p>
                <p className="stat-value text-sm sm:text-base">{cashFlowReport.monthlyCashFlow.length} months</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded">
                  <span className="font-medium">Cash Flows from Operating Activities</span>
                </div>
                <div className="ml-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Cash received from customers</span>
                    <span className="text-success">{formatCurrency(cashFlowReport.cashInflows)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash paid to suppliers and expenses</span>
                    <span className="text-destructive">({formatCurrency(cashFlowReport.totalCashOutflows)})</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Net cash from operating activities</span>
                    <span className={cashFlowReport.netCashFlow >= 0 ? 'text-success' : 'text-destructive'}>
                      {formatCurrency(cashFlowReport.netCashFlow)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-4">
                  {cashFlowReport.monthlyCashFlow.map((month) => (
                    <Card key={month.month} className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{month.month}</span>
                        <span className={`text-right font-semibold ${month.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(month.net)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Inflows: {formatCurrency(month.inflows)}</span>
                        <span>Outflows: {formatCurrency(month.outflows)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Month</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Inflows</TableHead>
                        <TableHead className="hidden sm:table-cell text-right text-xs sm:text-sm">Outflows</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Net Flow</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashFlowReport.monthlyCashFlow.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium text-xs sm:text-sm">{month.month}</TableCell>
                          <TableCell className="text-right text-success text-xs sm:text-sm">{formatCurrency(month.inflows)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-right text-destructive text-xs sm:text-sm">{formatCurrency(month.outflows)}</TableCell>
                          <TableCell className={`text-right font-semibold ${month.net >= 0 ? 'text-success' : 'text-destructive'} text-xs sm:text-sm`}>
                            {formatCurrency(month.net)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}