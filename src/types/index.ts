// Core Types for Karobar360

export interface Business {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  logoUrl?: string;
  currency: string;
  createdAt: Date;
}

export interface Party {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  type: 'customer' | 'supplier';
  opening_balance: number;
  balance_type: 'debit' | 'credit' | null;
  credit_limit: number;
  notes: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  unit: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  openingStock: number;
  currentStock: number;
  lowStockAlert: number;
  createdAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  itemId?: string;
  itemName: string;
  quantity: number;
  price: number;
  discount: number;
  discountType: 'flat' | 'percent';
  total: number;
}

export interface Invoice {
   id: string;
   businessId: string;
   invoiceNo: string;
   type: 'sale' | 'purchase' | 'sale-return' | 'purchase-return' | 'quotation' | 'challan';
   partyId: string | null;
   partyName: string | null;
   date: Date;
   dueDate?: Date;
   lineItems: InvoiceLineItem[];
   subtotal: number;
   discount: number;
   otherCharges: number;
   grandTotal: number;
   paymentStatus: 'paid' | 'unpaid' | 'partial';
   paymentMethod: PaymentMethod;
   amountPaid: number;
   notes: string;
   terms: string;
   createdAt: Date;
   convertedFrom?: string;
   status?: 'active' | 'converted' | 'cancelled';
   isDeleted: boolean;
}

export interface Payment {
  id: string;
  businessId: string;
  type: 'in' | 'out';
  partyId: string;
  partyName: string;
  amount: number;
  date: Date;
  reference: string;
  notes: string;
  paymentMethod: PaymentMethod;
  invoiceId?: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  businessId: string;
  category: string;
  amount: number;
  date: Date;
  paidBy: 'cash';
  notes: string;
  createdAt: Date;
}

export interface LedgerEntry {
  id: string;
  businessId: string;
  partyId?: string;
  date: Date;
  type: 'sale' | 'purchase' | 'payment-in' | 'payment-out' | 'expense' | 'sale-return' | 'purchase-return' | 'opening';
  voucherNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface Settings {
  businessId: string;
  invoicePrefix: string;
  startingInvoiceNo: number;
  defaultTemplate: 'classic' | 'modern';
  showDiscount: boolean;
  showOtherCharges: boolean;
  currency: string;
  theme: 'light' | 'dark';
}

export type ExpenseCategory = 
  | 'Rent'
  | 'Utilities'
  | 'Salary'
  | 'Transport'
  | 'Office Supplies'
  | 'Maintenance'
  | 'Marketing'
  | 'Other';

export type ItemUnit = 
  | 'Piece'
  | 'Kg'
  | 'Gram'
  | 'Liter'
  | 'Meter'
  | 'Box'
  | 'Dozen'
  | 'Pack';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card';

export type ItemCategory =
  | 'Electronics'
  | 'Clothing'
  | 'Food'
  | 'Grocery'
  | 'Stationery'
  | 'Hardware'
  | 'Cosmetics'
  | 'Medicine'
  | 'Other';

// Authentication and Permissions Types
export type UserRole = 'admin' | 'manager' | 'user';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'manage';

export type ModuleName =
  | 'dashboard'
  | 'search'
  | 'parties'
  | 'items'
  | 'sales'
  | 'purchases'
  | 'returns'
  | 'ledger'
  | 'payments'
  | 'expenses'
  | 'reports'
  | 'settings';

export interface Permission {
  module: ModuleName;
  actions: PermissionAction[];
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  businessId?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
}
