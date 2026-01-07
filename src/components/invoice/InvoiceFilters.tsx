import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search } from 'lucide-react';

interface InvoiceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'paid' | 'unpaid' | 'overdue';
  onStatusFilterChange: (value: 'all' | 'paid' | 'unpaid' | 'overdue') => void;
  sortBy: 'date' | 'dueDate';
  onSortByChange: (value: 'date' | 'dueDate') => void;
  showDeleted?: boolean;
  onShowDeletedChange?: (value: boolean) => void;
  searchPlaceholder?: string;
  showDeletedOption?: boolean;
}

export function InvoiceFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  showDeleted = false,
  onShowDeletedChange,
  searchPlaceholder = 'Search by invoice number or customer...',
  showDeletedOption = false,
}: InvoiceFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(value: 'all' | 'paid' | 'unpaid' | 'overdue') => onStatusFilterChange(value)}>
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
        <Select value={sortBy} onValueChange={(value: 'date' | 'dueDate') => onSortByChange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="dueDate">Sort by Due Date</SelectItem>
          </SelectContent>
        </Select>
        {showDeletedOption && onShowDeletedChange && (
          <div className="flex items-center gap-2">
            <Label htmlFor="show-deleted" className="text-sm">Show Deleted</Label>
            <Switch
              id="show-deleted"
              checked={showDeleted}
              onCheckedChange={onShowDeletedChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
