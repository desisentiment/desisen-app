import { useState, useMemo, useCallback } from 'react';
import { Invoice } from '@/types';
import { isInvoiceOverdue } from '@/utils/helpers';

export type StatusFilter = 'all' | 'paid' | 'unpaid' | 'overdue';
export type SortBy = 'date' | 'dueDate';

export interface UseInvoiceListOptions {
  invoices: Invoice[];
}

export interface UseInvoiceListReturn {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  sortBy: SortBy;
  setSortBy: (value: SortBy) => void;
  filteredInvoices: Invoice[];
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export function useInvoiceList({ invoices }: UseInvoiceListOptions): UseInvoiceListReturn {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesSearch =
          inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
          (inv.partyName || '').toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'paid' && inv.paymentStatus === 'paid') ||
          (statusFilter === 'unpaid' && inv.paymentStatus !== 'paid') ||
          (statusFilter === 'overdue' && inv.dueDate && isInvoiceOverdue(inv.dueDate) && inv.paymentStatus !== 'paid');

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [invoices, search, statusFilter, sortBy]);

  const totalAmount = useMemo(() => invoices.reduce((sum, inv) => sum + inv.grandTotal, 0), [invoices]);
  const paidAmount = useMemo(() => invoices.filter((inv) => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + inv.grandTotal, 0), [invoices]);
  const unpaidAmount = useMemo(() => totalAmount - paidAmount, [totalAmount, paidAmount]);

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredInvoices,
    totalAmount,
    paidAmount,
    unpaidAmount,
  };
}
