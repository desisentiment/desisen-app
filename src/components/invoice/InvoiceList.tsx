import { useState } from 'react';
import { Eye, Trash2, MoreVertical, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Invoice } from '@/types';
import { formatDate, getOverdueStatusColor } from '@/utils/helpers';
import { useFormatCurrency } from '@/hooks/use-business';

interface InvoiceListProps {
  invoices: Invoice[];
  searchPlaceholder: string;
  partyLabel: string;
  emptyIcon: React.ComponentType<{ className?: string }>;
  emptyTitle: string;
  emptyDescription: string;
  onView: (invoice: Invoice) => void;
  onDelete: (id: string, invoiceNo: string) => void;
  onRecover?: (id: string, invoiceNo: string) => void;
  onDownloadPDF?: (invoice: Invoice) => void;
  statusColors?: {
    paid?: string;
    unpaid?: string;
    partial?: string;
  };
  showDeleted?: boolean;
}

export function InvoiceList({
  invoices,
  searchPlaceholder,
  partyLabel,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  onView,
  onDelete,
  onRecover,
  onDownloadPDF,
  showDeleted = false,
}: InvoiceListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'dueDate'>('date');
  const formatCurrency = useFormatCurrency();

  const filteredInvoices = invoices
    .filter((inv) => {
      const matchesSearch =
        inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        (inv.partyName || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && inv.paymentStatus === 'paid') ||
        (statusFilter === 'unpaid' && inv.paymentStatus !== 'paid') ||
        (statusFilter === 'overdue' && inv.dueDate && new Date(inv.dueDate) < new Date() && inv.paymentStatus !== 'paid');
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  if (invoices.length === 0) {
    return (
      <Card className="p-8 text-center">
        <EmptyIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground mb-4">{emptyDescription}</p>
      </Card>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={(v: 'all' | 'paid' | 'unpaid' | 'overdue') => setStatusFilter(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: 'date' | 'dueDate') => setSortBy(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="dueDate">Sort by Due Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{invoice.invoiceNo}</h3>
                <p className="text-sm text-muted-foreground">{invoice.partyName || ''}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(invoice)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  {onDownloadPDF && (
                    <DropdownMenuItem onClick={() => onDownloadPDF(invoice)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                  )}
                  {invoice.isDeleted && onRecover ? (
                    <DropdownMenuItem onClick={() => onRecover(invoice.id, invoice.invoiceNo)}>
                      Recover
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(invoice.id, invoice.invoiceNo)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {formatDate(invoice.date)} • Due: <span className={getOverdueStatusColor(invoice.dueDate || new Date(), invoice.paymentStatus).includes('text-destructive') ? 'text-destructive font-medium' : ''}>{formatDate(invoice.dueDate || new Date())}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">{formatCurrency(invoice.grandTotal)}</div>
                <Badge className={getOverdueStatusColor(invoice.dueDate || new Date(), invoice.paymentStatus)} variant="secondary">
                  {invoice.paymentStatus}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Invoice #</TableHead>
                <TableHead>{partyLabel}</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="table-row">
                  <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                  <TableCell>{invoice.partyName || ''}</TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>
                    <span className={getOverdueStatusColor(invoice.dueDate || new Date(), invoice.paymentStatus).includes('text-destructive') ? 'text-destructive font-medium' : ''}>
                      {formatDate(invoice.dueDate || new Date())}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(invoice.grandTotal)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getOverdueStatusColor(invoice.dueDate || new Date(), invoice.paymentStatus)}>
                      {invoice.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(invoice)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {onDownloadPDF && (
                          <DropdownMenuItem onClick={() => onDownloadPDF(invoice)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                        )}
                        {invoice.isDeleted && onRecover ? (
                          <DropdownMenuItem onClick={() => onRecover(invoice.id, invoice.invoiceNo)}>
                            Recover
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(invoice.id, invoice.invoiceNo)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
