import { useState, useMemo } from 'react';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { usePartyStore } from '@/store/usePartyStore';
import { formatCurrency, formatDate } from '@/utils/helpers';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LedgerEntry } from '@/types';

export default function LedgerPage() {
  const { currentBusinessId } = useBusinessStore();
  const effectiveBusinessId = currentBusinessId || 'default-business-id';
  const { getInvoicesByBusiness } = useInvoiceStore();
  const { getPaymentsByBusiness } = usePaymentStore();
  const { getExpensesByBusiness } = useExpenseStore();
  const { getPartiesByBusiness } = usePartyStore();

  const [selectedPartyId, setSelectedPartyId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ledgerType, setLedgerType] = useState<'party' | 'global'>('party');

  const invoices = getInvoicesByBusiness(effectiveBusinessId);
  const payments = getPaymentsByBusiness(effectiveBusinessId);
  const expenses = getExpensesByBusiness(effectiveBusinessId);
  const parties = getPartiesByBusiness(effectiveBusinessId);

  // Generate ledger entries from all transactions
  const ledgerEntries = useMemo(() => {
    const entries: LedgerEntry[] = [];
    
    // Add opening balances for parties
    if (ledgerType === 'party' && selectedPartyId !== 'all') {
      const party = parties.find(p => p.id === selectedPartyId);
      if (party && party.opening_balance > 0) {
        entries.push({
          id: `opening-${party.id}`,
          businessId: effectiveBusinessId,
          partyId: party.id,
          date: new Date(party.created_at),
          type: 'opening',
          voucherNo: 'OPENING',
          description: `Opening Balance - ${party.name}`,
          debit: party.balance_type === 'debit' ? party.opening_balance : 0,
          credit: party.balance_type === 'credit' ? party.opening_balance : 0,
          balance: party.balance_type === 'debit' ? party.opening_balance : -party.opening_balance,
        });
      }
    } else if (ledgerType === 'global') {
      // Add opening balances for all parties in global ledger
      parties.forEach(party => {
        if (party.opening_balance > 0) {
          entries.push({
            id: `opening-${party.id}`,
            businessId: effectiveBusinessId,
            partyId: party.id,
            date: new Date(party.created_at),
            type: 'opening',
            voucherNo: 'OPENING',
            description: `Opening Balance - ${party.name}`,
            debit: party.balance_type === 'debit' ? party.opening_balance : 0,
            credit: party.balance_type === 'credit' ? party.opening_balance : 0,
            balance: party.balance_type === 'debit' ? party.opening_balance : -party.opening_balance,
          });
        }
      });
    }

    // Add invoice entries
    invoices.forEach(invoice => {
      if (ledgerType === 'global' || invoice.partyId === selectedPartyId) {
        let debit = 0;
        let credit = 0;
        let description = '';

        switch (invoice.type) {
          case 'sale':
            debit = invoice.grandTotal; // Money coming in
            description = `Sale Invoice ${invoice.invoiceNo} - ${invoice.partyName}`;
            break;
          case 'purchase':
            credit = invoice.grandTotal; // Money going out
            description = `Purchase Invoice ${invoice.invoiceNo} - ${invoice.partyName}`;
            break;
          case 'sale-return':
            credit = invoice.grandTotal; // Money going out (refund)
            description = `Sale Return ${invoice.invoiceNo} - ${invoice.partyName}`;
            break;
          case 'purchase-return':
            debit = invoice.grandTotal; // Money coming in (return)
            description = `Purchase Return ${invoice.invoiceNo} - ${invoice.partyName}`;
            break;
          default:
            debit = 0;
            credit = 0;
            description = `Invoice ${invoice.invoiceNo} - ${invoice.partyName}`;
            break;
        }

        entries.push({
          id: invoice.id,
          businessId: invoice.businessId,
          partyId: invoice.partyId ?? undefined,
          date: invoice.date,
          type: invoice.type as 'sale' | 'purchase' | 'sale-return' | 'purchase-return',
          voucherNo: invoice.invoiceNo,
          description,
          debit,
          credit,
          balance: 0, // Will be calculated later
        });
      }
    });

    // Add payment entries
    payments.forEach(payment => {
      if (ledgerType === 'global' || payment.partyId === selectedPartyId) {
        const debit = payment.type === 'in' ? payment.amount : 0;
        const credit = payment.type === 'out' ? payment.amount : 0;
        const description = `${payment.type === 'in' ? 'Payment Received' : 'Payment Made'} - ${payment.partyName} (${payment.reference || 'N/A'})`;

        entries.push({
          id: payment.id,
          businessId: payment.businessId,
          partyId: payment.partyId,
          date: payment.date,
          type: payment.type === 'in' ? 'payment-in' : 'payment-out',
          voucherNo: payment.reference || 'PAY',
          description,
          debit,
          credit,
          balance: 0, // Will be calculated later
        });
      }
    });

    // Add expense entries (only for global ledger)
    if (ledgerType === 'global') {
      expenses.forEach(expense => {
        entries.push({
          id: expense.id,
          businessId: expense.businessId,
          date: expense.date,
          type: 'expense',
          voucherNo: 'EXP',
          description: `${expense.category} - ${expense.notes || 'Expense'}`,
          debit: 0,
          credit: expense.amount,
          balance: 0, // Will be calculated later
        });
      });
    }

    // Sort by date (ensure dates are Date objects)
    entries.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    // Calculate running balance
    let runningBalance = 0;
    entries.forEach(entry => {
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    });

    return entries;
  }, [invoices, payments, expenses, parties, selectedPartyId, ledgerType, effectiveBusinessId]);

  // Filter entries based on search and date range
  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter(entry => {
      const matchesSearch = !search ||
        entry.description.toLowerCase().includes(search.toLowerCase()) ||
        entry.voucherNo.toLowerCase().includes(search.toLowerCase());

      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      const matchesDateFrom = !dateFrom || entryDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || entryDate <= new Date(dateTo + 'T23:59:59');

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [ledgerEntries, search, dateFrom, dateTo]);

  const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
  const netBalance = totalDebit - totalCredit;

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'sale':
      case 'sale-return':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'purchase':
      case 'purchase-return':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'payment-in':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'payment-out':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'expense':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'opening':
        return <BookOpen className="h-4 w-4 text-muted-foreground" />;
      default:
        return <BookOpen className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEntryBadgeColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-success/10 text-success';
      case 'purchase':
        return 'bg-destructive/10 text-destructive';
      case 'sale-return':
        return 'bg-orange/10 text-orange-600';
      case 'purchase-return':
        return 'bg-blue/10 text-blue-600';
      case 'payment-in':
        return 'bg-success/10 text-success';
      case 'payment-out':
        return 'bg-destructive/10 text-destructive';
      case 'expense':
        return 'bg-destructive/10 text-destructive';
      case 'opening':
        return 'bg-muted/50 text-muted-foreground';
      default:
        return 'bg-muted/50 text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ledger</h1>
          <p className="text-muted-foreground">Party-wise and global transaction ledger</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Ledger Type</Label>
              <Select value={ledgerType} onValueChange={(value: 'party' | 'global') => setLedgerType(value)}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="party">Party-wise Ledger</SelectItem>
                  <SelectItem value="global">Global Ledger</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ledgerType === 'party' && (
              <div className="space-y-2">
                <Label>Select Party</Label>
                <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select party" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parties</SelectItem>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name} ({party.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by description or voucher number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardContent className="p-4">
            <p className="stat-label">Total Debit</p>
            <p className="stat-value text-success">{formatCurrency(totalDebit)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4">
            <p className="stat-label">Total Credit</p>
            <p className="stat-value text-destructive">{formatCurrency(totalCredit)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4">
            <p className="stat-label">Net Balance</p>
            <p className={`stat-value ${netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(Math.abs(netBalance))}
            </p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4">
            <p className="stat-label">Transactions</p>
            <p className="stat-value">{filteredEntries.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {ledgerType === 'party'
              ? (selectedPartyId === 'all' ? 'All Parties Ledger' : `${parties.find(p => p.id === selectedPartyId)?.name || 'Party'} Ledger`)
              : 'Global Ledger'
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No ledger entries found</h3>
              <p className="text-muted-foreground">
                {ledgerType === 'party' && selectedPartyId === 'all'
                  ? 'No transactions found for any party'
                  : 'No transactions found for the selected criteria'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Date</TableHead>
                    <TableHead>Voucher #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="table-row">
                      <TableCell className="font-medium">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell>{entry.voucherNo}</TableCell>
                      <TableCell className="max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className={`flex items-center gap-1 ${getEntryBadgeColor(entry.type)}`}>
                          {getEntryIcon(entry.type)}
                          {entry.type.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        entry.balance >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {formatCurrency(Math.abs(entry.balance))}
                        <span className="text-xs ml-1">
                          ({entry.balance >= 0 ? 'Dr' : 'Cr'})
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}