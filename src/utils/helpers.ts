export const formatCurrency = (amount: number, currency: string = 'PKR'): string => {
  // Handle NaN, undefined, null, or non-numeric values
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    amount = 0;
  }
  
  // Get locale based on currency
  const getLocaleForCurrency = (curr: string): string => {
    const localeMap: Record<string, string> = {
      'PKR': 'en-PK',
    };
    return localeMap[curr] || 'en-PK';
  };

  return new Intl.NumberFormat(getLocaleForCurrency(currency), {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Currency options for selection
export const CURRENCY_OPTIONS = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
];

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-PK').format(num);
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const calculateLineTotal = (
  quantity: number,
  price: number,
  discount: number,
  discountType: 'flat' | 'percent'
): number => {
  const subtotal = quantity * price;
  if (discountType === 'percent') {
    return subtotal - (subtotal * discount) / 100;
  }
  return subtotal - discount;
};

export const getPaymentStatusColor = (status: 'paid' | 'unpaid' | 'partial'): string => {
  switch (status) {
    case 'paid':
      return 'bg-success/10 text-success';
    case 'unpaid':
      return 'bg-destructive/10 text-destructive';
    case 'partial':
      return 'bg-warning/10 text-warning';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getStockStatusColor = (current: number, alert: number): string => {
  if (current <= 0) return 'bg-destructive/10 text-destructive';
  if (current <= alert) return 'bg-warning/10 text-warning';
  return 'bg-success/10 text-success';
};

export const isInvoiceOverdue = (dueDate: Date | string): boolean => {
  const due = new Date(dueDate);
  const now = new Date();
  // Set time to start of day for comparison
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return due < now;
};

export const getOverdueStatusColor = (dueDate: Date | string, paymentStatus: 'paid' | 'unpaid' | 'partial'): string => {
  if (paymentStatus === 'paid') return 'bg-success/10 text-success';
  if (isInvoiceOverdue(dueDate)) return 'bg-destructive/10 text-destructive';
  return 'bg-muted text-muted-foreground';
};

