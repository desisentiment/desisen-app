import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { usePartyStore } from '@/store/usePartyStore';
import { useItemStore } from '@/store/useItemStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { formatCurrency, formatDate } from '@/utils/helpers';
import {
  Search,
  FileText,
  Users,
  Package,
  CreditCard,
  Receipt,
  RotateCcw,
  ArrowUpDown,
  Eye,
  Edit,
  Filter,
  Calendar,
  X,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface SearchResult {
  id: string;
  type: 'invoice' | 'party' | 'item' | 'payment' | 'expense' | 'return';
  title: string;
  subtitle: string;
  amount?: number;
  date?: Date;
  status?: string;
  category?: string;
  url: string;
  canEdit?: boolean;
}

const PAGE_SIZE = 20;

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentBusinessId } = useBusinessStore();
  const effectiveBusinessId = currentBusinessId || 'default-business-id';
  console.log('SearchPage - currentBusinessId:', currentBusinessId, 'effectiveBusinessId:', effectiveBusinessId);
  const { getInvoicesByBusiness } = useInvoiceStore();
  const { getPartiesByBusiness } = usePartyStore();
  const { getItemsByBusiness } = useItemStore();
  const { getPaymentsByBusiness } = usePaymentStore();
  const { getExpensesByBusiness } = useExpenseStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showInitialData, setShowInitialData] = useState(true);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get initial search query from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [location.search]);

  // Load initial demo data
  const loadInitialData = useCallback(async (): Promise<void> => {
    if (!effectiveBusinessId) {
      console.log('No effective business ID, waiting...');
      return;
    }

    console.log('Loading initial data for business:', effectiveBusinessId);
    setIsLoading(true);
    const initialResults: SearchResult[] = [];

    try {
      // Get recent invoices (limit to 5)
      const invoices = getInvoicesByBusiness(effectiveBusinessId);
      console.log('Found invoices:', invoices.length);
      const recentInvoices = invoices
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      recentInvoices.forEach(invoice => {
        let type: SearchResult['type'] = 'invoice';
        let url = '/sales';
        let title = `Invoice ${invoice.invoiceNo}`;

        switch (invoice.type) {
          case 'sale':
            type = 'invoice';
            url = '/sales';
            title = `Sale ${invoice.invoiceNo}`;
            break;
          case 'purchase':
            type = 'invoice';
            url = '/purchases';
            title = `Purchase ${invoice.invoiceNo}`;
            break;
          case 'sale-return':
          case 'purchase-return':
            type = 'return';
            url = '/returns';
            title = `${invoice.type === 'sale-return' ? 'Sale' : 'Purchase'} Return ${invoice.invoiceNo}`;
            break;
        }

        initialResults.push({
          id: invoice.id,
          type,
          title,
          subtitle: invoice.partyName || '',
          amount: invoice.grandTotal,
          date: invoice.date,
          status: invoice.paymentStatus,
          category: invoice.type,
          url,
        });
      });

      // Get recent parties (limit to 3)
      const parties = getPartiesByBusiness(effectiveBusinessId);
      console.log('Found parties:', parties.length);
      const recentParties = parties.slice(0, 3);

      recentParties.forEach(party => {
        initialResults.push({
          id: party.id,
          type: 'party',
          title: party.name,
          subtitle: `${party.city} • ${party.phone}`,
          category: party.type,
          url: '/parties',
          canEdit: true,
        });
      });

      // Get low stock items (limit to 3)
      const items = getItemsByBusiness(effectiveBusinessId);
      console.log('Found items:', items.length);
      const lowStockItems = items
        .filter(item => item.currentStock <= item.lowStockAlert)
        .slice(0, 3);

      lowStockItems.forEach(item => {
        initialResults.push({
          id: item.id,
          type: 'item',
          title: item.name,
          subtitle: `Stock: ${item.currentStock} (Low) • SKU: ${item.sku}`,
          amount: item.salePrice,
          category: item.category,
          url: '/items',
          canEdit: true,
        });
      });

      // Get recent expenses (limit to 3)
      const expenses = getExpensesByBusiness(effectiveBusinessId);
      console.log('Found expenses:', expenses.length);
      const recentExpenses = expenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

      // Get recent payments (limit to 3)
      const payments = getPaymentsByBusiness(effectiveBusinessId);
      console.log('Found payments for initial data:', payments.length);
      const recentPayments = payments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

      recentPayments.forEach(payment => {
        initialResults.push({
          id: payment.id,
          type: 'payment',
          title: `${payment.type === 'in' ? 'Payment Received' : 'Payment Made'}`,
          subtitle: payment.partyName,
          amount: payment.amount,
          date: payment.date,
          category: payment.reference || 'No reference',
          url: '/payments',
        });
      });

      recentExpenses.forEach(expense => {
        initialResults.push({
          id: expense.id,
          type: 'expense',
          title: expense.category,
          subtitle: expense.notes || 'No notes',
          amount: expense.amount,
          date: expense.date,
          category: expense.category,
          url: '/expenses',
        });
      });

      setResults(initialResults);
      console.log('Total initial results:', initialResults.length);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveBusinessId, getInvoicesByBusiness, getPartiesByBusiness, getItemsByBusiness, getPaymentsByBusiness, getExpensesByBusiness]);

  const performSearch = useCallback(async (query: string): Promise<void> => {
    if (!query.trim() || !effectiveBusinessId) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Fuzzy search helper
      const fuzzyMatch = (text: string, search: string) => {
        const searchLower = search.toLowerCase();
        const textLower = text.toLowerCase();
        return textLower.includes(searchLower) ||
               searchLower.split('').every(char => textLower.includes(char));
      };

      // Search invoices
      const invoices = getInvoicesByBusiness(effectiveBusinessId);
      invoices.forEach(invoice => {
        if (
          fuzzyMatch(invoice.invoiceNo, query) ||
          fuzzyMatch(invoice.partyName || '', query) ||
          fuzzyMatch(invoice.notes || '', query)
        ) {
          let type: SearchResult['type'] = 'invoice';
          let url = '/sales';
          let title = `Invoice ${invoice.invoiceNo}`;

          switch (invoice.type) {
            case 'sale':
              type = 'invoice';
              url = '/sales';
              title = `Sale ${invoice.invoiceNo}`;
              break;
            case 'purchase':
              type = 'invoice';
              url = '/purchases';
              title = `Purchase ${invoice.invoiceNo}`;
              break;
            case 'sale-return':
            case 'purchase-return':
              type = 'return';
              url = '/returns';
              title = `${invoice.type === 'sale-return' ? 'Sale' : 'Purchase'} Return ${invoice.invoiceNo}`;
              break;
            default:
              type = 'invoice';
              url = '/sales';
              title = `Invoice ${invoice.invoiceNo}`;
              break;
          }

          searchResults.push({
            id: invoice.id,
            type,
            title,
            subtitle: invoice.partyName || '',
            amount: invoice.grandTotal,
            date: invoice.date,
            status: invoice.paymentStatus,
            category: invoice.type,
            url,
          });
        }
      });

      // Search parties
      const parties = getPartiesByBusiness(effectiveBusinessId);
      parties.forEach(party => {
        if (
          fuzzyMatch(party.name, query) ||
          fuzzyMatch(party.phone || '', query) ||
          fuzzyMatch(party.city || '', query) ||
          fuzzyMatch(party.address || '', query)
        ) {
          searchResults.push({
            id: party.id,
            type: 'party',
            title: party.name,
            subtitle: `${party.city} • ${party.phone}`,
            category: party.type,
            url: '/parties',
            canEdit: true,
          });
        }
      });

      // Search items
      const items = getItemsByBusiness(effectiveBusinessId);
      items.forEach(item => {
        if (
          fuzzyMatch(item.name, query) ||
          fuzzyMatch(item.sku, query) ||
          fuzzyMatch(item.category, query)
        ) {
          searchResults.push({
            id: item.id,
            type: 'item',
            title: item.name,
            subtitle: `SKU: ${item.sku}`,
            amount: item.salePrice,
            category: item.category,
            url: '/items',
            canEdit: true,
          });
        }
      });

      // Search payments
      const payments = getPaymentsByBusiness(effectiveBusinessId);
      console.log('Found payments:', payments.length);
      payments.forEach(payment => {
        console.log('Payment:', payment);
        if (
          fuzzyMatch(payment.partyName, query) ||
          fuzzyMatch(payment.reference || '', query) ||
          fuzzyMatch(payment.notes, query)
        ) {
          searchResults.push({
            id: payment.id,
            type: 'payment',
            title: `${payment.type === 'in' ? 'Payment Received' : 'Payment Made'}`,
            subtitle: payment.partyName,
            amount: payment.amount,
            date: payment.date,
            category: payment.reference || 'No reference',
            url: '/payments',
          });
        }
      });

      // Search expenses
      const expenses = getExpensesByBusiness(effectiveBusinessId);
      expenses.forEach(expense => {
        if (
          fuzzyMatch(expense.category, query) ||
          fuzzyMatch(expense.notes, query)
        ) {
          searchResults.push({
            id: expense.id,
            type: 'expense',
            title: expense.category,
            subtitle: expense.notes || 'No notes',
            amount: expense.amount,
            date: expense.date,
            category: expense.category,
            url: '/expenses',
          });
        }
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveBusinessId, getInvoicesByBusiness, getPartiesByBusiness, getItemsByBusiness, getPaymentsByBusiness, getExpensesByBusiness]);

  // Perform search when debounced query changes or load initial data
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setShowInitialData(false);
      performSearch(debouncedQuery);
    } else {
      setShowInitialData(true);
      loadInitialData();
    }
  }, [debouncedQuery, currentBusinessId, performSearch, loadInitialData]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...results];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(r => r.category === filterCategory);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(r => r.date && r.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(r => r.date && r.date <= dateTo);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string, bVal: number | string;
      switch (sortBy) {
        case 'date':
          aVal = a.date?.getTime() || 0;
          bVal = b.date?.getTime() || 0;
          break;
        case 'amount':
          aVal = a.amount || 0;
          bVal = b.amount || 0;
          break;
        case 'title':
          aVal = a.title || '';
          bVal = b.title || '';
          break;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    setFilteredResults(filtered);
    setCurrentPage(1);
  }, [results, filterType, filterCategory, filterStatus, dateFrom, dateTo, sortBy, sortOrder]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <FileText className="h-4 w-4" />;
      case 'return': return <RotateCcw className="h-4 w-4" />;
      case 'party': return <Users className="h-4 w-4" />;
      case 'item': return <Package className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'expense': return <Receipt className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invoice': return 'bg-blue-100 text-blue-800';
      case 'return': return 'bg-pink-100 text-pink-800';
      case 'party': return 'bg-green-100 text-green-800';
      case 'item': return 'bg-purple-100 text-purple-800';
      case 'payment': return 'bg-orange-100 text-orange-800';
      case 'expense': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSort = (column: 'date' | 'amount' | 'title') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setFilterStatus('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredResults.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredResults, currentPage]);

  const totalPages = Math.ceil(filteredResults.length / PAGE_SIZE);

  const handleView = (result: SearchResult) => {
    navigate(result.url);
  };

  const handleEdit = (result: SearchResult) => {
    // For now, just navigate to the list page
    navigate(result.url);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0">
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Search</h1>
          <p className="text-muted-foreground">Search across all business data</p>
        </div>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search across all business data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-h-10 sm:min-h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="min-h-10 sm:min-h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
                  <SelectItem value="return">Returns</SelectItem>
                  <SelectItem value="party">Parties</SelectItem>
                  <SelectItem value="item">Items</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="min-h-10 sm:min-h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal min-h-10 sm:min-h-9">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? formatDate(dateFrom) : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal min-h-10 sm:min-h-9">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? formatDate(dateTo) : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 mt-3 sm:mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters} className="min-h-9 sm:min-h-8">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {filteredResults.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <p className="text-sm text-muted-foreground">
            Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for "{debouncedQuery}"
          </p>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {['invoice', 'return', 'party', 'item', 'payment', 'expense'].map(type => {
              const count = filteredResults.filter(r => r.type === type).length;
              return count > 0 ? (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}: {count}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
          <p className="text-muted-foreground">Searching...</p>
        </Card>
      )}

      {/* No Results */}
      {!isLoading && debouncedQuery && filteredResults.length === 0 && (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters
          </p>
        </Card>
      )}

      {/* Initial Data Header */}
      {!isLoading && showInitialData && filteredResults.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <p className="text-sm text-muted-foreground">
            Recent activity and important items
          </p>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {['invoice', 'return', 'party', 'item', 'expense'].map(type => {
              const count = filteredResults.filter(r => r.type === type).length;
              return count > 0 ? (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}: {count}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Results Table */}
      {!isLoading && filteredResults.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="w-20 sm:w-24">Type</TableHead>
                  <TableHead className="min-w-32">
                    <Button variant="ghost" onClick={() => handleSort('title')} className="h-auto p-0 font-semibold">
                      Title
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-24">Details</TableHead>
                  <TableHead className="w-24 sm:w-28">
                    <Button variant="ghost" onClick={() => handleSort('amount')} className="h-auto p-0 font-semibold">
                      Amount
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-20 sm:w-24">
                    <Button variant="ghost" onClick={() => handleSort('date')} className="h-auto p-0 font-semibold">
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-16 sm:w-20">Status</TableHead>
                  <TableHead className="w-20 sm:w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResults.map((result) => (
                  <TableRow key={result.id} className="table-row">
                    <TableCell>
                      <Badge className={`flex items-center gap-1 text-xs ${getTypeColor(result.type)}`}>
                        {getTypeIcon(result.type)}
                        <span className="hidden sm:inline">{result.type.charAt(0).toUpperCase() + result.type.slice(1)}</span>
                        <span className="sm:hidden">{result.type.charAt(0).toUpperCase()}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm sm:text-base">{result.title}</TableCell>
                    <TableCell className="text-muted-foreground text-xs sm:text-sm">
                      <div>{result.subtitle}</div>
                      {result.category && result.category !== result.type && (
                        <div className="text-xs">{result.category}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm sm:text-base">
                      {result.amount ? formatCurrency(result.amount) : '-'}
                    </TableCell>
                    <TableCell className="text-sm sm:text-base">
                      {result.date ? formatDate(result.date) : '-'}
                    </TableCell>
                    <TableCell>
                      {result.status ? (
                        <Badge className={`text-xs ${getStatusColor(result.status)}`}>
                          {result.status}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(result)}
                          className="min-h-8 min-w-8 p-1"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {result.canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(result)}
                            className="min-h-8 min-w-8 p-1"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 sm:p-4 border-t">
              <Pagination>
                <PaginationContent className="flex-wrap gap-1 sm:gap-0">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={`min-h-8 px-2 text-sm ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={page === currentPage}
                          className="cursor-pointer min-h-8 min-w-8 text-sm"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={`min-h-8 px-2 text-sm ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
