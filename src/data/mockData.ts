import { Party, Item, Expense, Invoice, Business } from '@/types';

export const mockBusinesses: Business[] = [
  {
    id: 'default-business-id',
    name: 'Karobar360 Demo',
    phone: '+92-300-1234567',
    address: '123 Main Street',
    city: 'Karachi',
    currency: 'PKR',
    createdAt: new Date('2024-01-01'),
  }
];

export const mockParties: Party[] = [
  {
    id: 'party-1',
    business_id: 'default-business-id',
    name: 'Ahmed Trading Co.',
    phone: '+92-300-1111111',
    city: 'Karachi',
    address: 'Shop #45, Main Market',
    type: 'customer',
    opening_balance: 50000,
    balance_type: 'debit',
    credit_limit: 100000,
    notes: 'Regular customer',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'party-2',
    business_id: 'default-business-id',
    name: 'Bilal Suppliers',
    phone: '+92-300-2222222',
    city: 'Lahore',
    address: 'Warehouse #12, Industrial Area',
    type: 'supplier',
    opening_balance: 75000,
    balance_type: 'credit',
    credit_limit: 200000,
    notes: 'Main supplier for electronics',
    created_at: '2024-01-10T09:00:00Z',
  },
  {
    id: 'party-3',
    business_id: 'default-business-id',
    name: 'Cafe Corner',
    phone: '+92-300-3333333',
    city: 'Islamabad',
    address: 'F-7 Markaz',
    type: 'customer',
    opening_balance: 25000,
    balance_type: 'debit',
    credit_limit: 50000,
    notes: 'Restaurant client',
    created_at: '2024-01-20T11:00:00Z',
  },
  {
    id: 'party-4',
    business_id: 'default-business-id',
    name: 'Tech Parts Inc.',
    phone: '+92-300-4444444',
    city: 'Faisalabad',
    address: 'Industrial Estate',
    type: 'supplier',
    opening_balance: 100000,
    balance_type: 'credit',
    credit_limit: 500000,
    notes: 'Computer parts supplier',
    created_at: '2024-01-05T14:00:00Z',
  },
];

export const mockItems: Item[] = [
  {
    id: 'item-1',
    businessId: 'default-business-id',
    name: 'Laptop Dell Core i5',
    sku: 'LAP-001',
    unit: 'Piece',
    category: 'Electronics',
    purchasePrice: 45000,
    salePrice: 55000,
    openingStock: 10,
    currentStock: 7,
    lowStockAlert: 3,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'item-2',
    businessId: 'default-business-id',
    name: 'Mouse Wireless',
    sku: 'ACC-001',
    unit: 'Piece',
    category: 'Electronics',
    purchasePrice: 800,
    salePrice: 1200,
    openingStock: 50,
    currentStock: 35,
    lowStockAlert: 10,
    createdAt: new Date('2024-01-02'),
  },
  {
    id: 'item-3',
    businessId: 'default-business-id',
    name: 'Keyboard USB',
    sku: 'ACC-002',
    unit: 'Piece',
    category: 'Electronics',
    purchasePrice: 1200,
    salePrice: 1800,
    openingStock: 30,
    currentStock: 22,
    lowStockAlert: 5,
    createdAt: new Date('2024-01-03'),
  },
  {
    id: 'item-4',
    businessId: 'default-business-id',
    name: 'Office Chair',
    sku: 'FUR-001',
    unit: 'Piece',
    category: 'Other',
    purchasePrice: 8000,
    salePrice: 12000,
    openingStock: 15,
    currentStock: 12,
    lowStockAlert: 3,
    createdAt: new Date('2024-01-04'),
  },
  {
    id: 'item-5',
    businessId: 'default-business-id',
    name: 'Printer Paper A4',
    sku: 'STA-001',
    unit: 'Pack',
    category: 'Stationery',
    purchasePrice: 400,
    salePrice: 600,
    openingStock: 100,
    currentStock: 85,
    lowStockAlert: 20,
    createdAt: new Date('2024-01-05'),
  },
  {
    id: 'item-6',
    businessId: 'default-business-id',
    name: 'Pens Blue',
    sku: 'STA-002',
    unit: 'Dozen',
    category: 'Stationery',
    purchasePrice: 120,
    salePrice: 180,
    openingStock: 50,
    currentStock: 45,
    lowStockAlert: 10,
    createdAt: new Date('2024-01-06'),
  },
  {
    id: 'item-7',
    businessId: 'default-business-id',
    name: 'Rice Basmati 5kg',
    sku: 'GRO-001',
    unit: 'Kg',
    category: 'Grocery',
    purchasePrice: 350,
    salePrice: 450,
    openingStock: 100,
    currentStock: 75,
    lowStockAlert: 15,
    createdAt: new Date('2024-01-07'),
  },
  {
    id: 'item-8',
    businessId: 'default-business-id',
    name: 'Cooking Oil 1L',
    sku: 'GRO-002',
    unit: 'Liter',
    category: 'Grocery',
    purchasePrice: 180,
    salePrice: 220,
    openingStock: 80,
    currentStock: 62,
    lowStockAlert: 10,
    createdAt: new Date('2024-01-08'),
  },
];

export const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    businessId: 'default-business-id',
    category: 'Rent',
    amount: 25000,
    date: new Date('2024-01-01'),
    paidBy: 'cash',
    notes: 'Monthly shop rent',
    createdAt: new Date('2024-01-01T09:00:00Z'),
  },
  {
    id: 'exp-2',
    businessId: 'default-business-id',
    category: 'Utilities',
    amount: 8000,
    date: new Date('2024-01-05'),
    paidBy: 'cash',
    notes: 'Electricity bill',
    createdAt: new Date('2024-01-05T10:30:00Z'),
  },
  {
    id: 'exp-3',
    businessId: 'default-business-id',
    category: 'Salary',
    amount: 45000,
    date: new Date('2024-01-10'),
    paidBy: 'cash',
    notes: 'Staff salary for January',
    createdAt: new Date('2024-01-10T11:00:00Z'),
  },
  {
    id: 'exp-4',
    businessId: 'default-business-id',
    category: 'Transport',
    amount: 3500,
    date: new Date('2024-01-12'),
    paidBy: 'cash',
    notes: 'Fuel and maintenance',
    createdAt: new Date('2024-01-12T14:20:00Z'),
  },
  {
    id: 'exp-5',
    businessId: 'default-business-id',
    category: 'Office Supplies',
    amount: 2500,
    date: new Date('2024-01-15'),
    paidBy: 'cash',
    notes: 'Stationery and office items',
    createdAt: new Date('2024-01-15T09:15:00Z'),
  },
  {
    id: 'exp-6',
    businessId: 'default-business-id',
    category: 'Marketing',
    amount: 5000,
    date: new Date('2024-01-18'),
    paidBy: 'cash',
    notes: 'Facebook ads',
    createdAt: new Date('2024-01-18T16:45:00Z'),
  },
  {
    id: 'exp-7',
    businessId: 'default-business-id',
    category: 'Maintenance',
    amount: 3000,
    date: new Date('2024-01-20'),
    paidBy: 'cash',
    notes: 'Shop maintenance',
    createdAt: new Date('2024-01-20T13:30:00Z'),
  },
  {
    id: 'exp-8',
    businessId: 'default-business-id',
    category: 'Other',
    amount: 1500,
    date: new Date('2024-01-22'),
    paidBy: 'cash',
    notes: 'Miscellaneous expenses',
    createdAt: new Date('2024-01-22T10:00:00Z'),
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    businessId: 'default-business-id',
    invoiceNo: 'SALE-001',
    type: 'sale',
    partyId: 'party-1',
    partyName: 'Ahmed Trading Co.',
    date: new Date('2024-01-15'),
    dueDate: new Date('2024-01-30'),
    lineItems: [
      {
        id: 'line-1',
        itemId: 'item-1',
        itemName: 'Laptop Dell Core i5',
        quantity: 2,
        price: 55000,
        discount: 5,
        discountType: 'percent',
        total: 104500,
      }
    ],
    subtotal: 110000,
    discount: 5000,
    otherCharges: 0,
    grandTotal: 115500,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    amountPaid: 115500,
    notes: 'Laptop bulk order',
    terms: 'Payment due within 15 days',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    status: 'converted',
    isDeleted: false,
  },
  {
    id: 'inv-2',
    businessId: 'default-business-id',
    invoiceNo: 'SALE-002',
    type: 'sale',
    partyId: 'party-3',
    partyName: 'Cafe Corner',
    date: new Date('2024-01-18'),
    dueDate: new Date('2024-02-02'),
    lineItems: [
      {
        id: 'line-2',
        itemId: 'item-5',
        itemName: 'Printer Paper A4',
        quantity: 5,
        price: 600,
        discount: 0,
        discountType: 'flat',
        total: 3000,
      }
    ],
    subtotal: 3000,
    discount: 0,
    otherCharges: 0,
    grandTotal: 3300,
    paymentStatus: 'unpaid',
    paymentMethod: 'cash',
    amountPaid: 0,
    notes: 'Office supplies for cafe',
    terms: 'Payment due within 15 days',
    createdAt: new Date('2024-01-18T14:20:00Z'),
    status: 'active',
    isDeleted: false,
  },
  {
    id: 'inv-3',
    businessId: 'default-business-id',
    invoiceNo: 'PUR-001',
    type: 'purchase',
    partyId: 'party-2',
    partyName: 'Bilal Suppliers',
    date: new Date('2024-01-10'),
    dueDate: new Date('2024-01-25'),
    lineItems: [
      {
        id: 'line-3',
        itemId: 'item-1',
        itemName: 'Laptop Dell Core i5',
        quantity: 2,
        price: 45000,
        discount: 2,
        discountType: 'percent',
        total: 88200,
      }
    ],
    subtotal: 90000,
    discount: 2000,
    otherCharges: 0,
    grandTotal: 96800,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    amountPaid: 96800,
    notes: 'Electronics stock purchase',
    terms: 'Payment due within 15 days',
    createdAt: new Date('2024-01-10T11:15:00Z'),
    status: 'converted',
    isDeleted: false,
  },
];

// Function to initialize mock data in localStorage
export const initializeMockData = () => {
  if (typeof window === 'undefined') return;

  console.log('Initializing mock data...');

  // Initialize businesses
  if (!localStorage.getItem('business-storage')) {
    console.log('Setting up business storage...');
    localStorage.setItem('business-storage', JSON.stringify({
      state: {
        businesses: mockBusinesses,
        currentBusiness: mockBusinesses[0],
      },
      version: 0
    }));
  }

  // Initialize parties
  if (!localStorage.getItem('party-storage')) {
    console.log('Setting up party storage...');
    localStorage.setItem('party-storage', JSON.stringify({
      state: {
        parties: mockParties,
      },
      version: 0
    }));
  }

  // Initialize items
  if (!localStorage.getItem('item-storage')) {
    console.log('Setting up item storage...');
    localStorage.setItem('item-storage', JSON.stringify({
      state: {
        items: mockItems,
      },
      version: 0
    }));
  }

  // Initialize expenses
  if (!localStorage.getItem('expense-storage')) {
    console.log('Setting up expense storage...');
    localStorage.setItem('expense-storage', JSON.stringify({
      state: {
        expenses: mockExpenses,
      },
      version: 0
    }));
  }

  // Initialize invoices
  if (!localStorage.getItem('invoice-storage')) {
    console.log('Setting up invoice storage...');
    localStorage.setItem('invoice-storage', JSON.stringify({
      state: {
        invoices: mockInvoices,
      },
      version: 0
    }));
  }

  // Initialize notifications
  if (!localStorage.getItem('notifications-data')) {
    const notifications = [
      {
        id: 'notif-1',
        title: 'Low Stock Alert',
        message: 'Laptop Dell Core i5 is running low on stock (7 remaining)',
        type: 'warning',
        read: false,
        actionUrl: '/items',
        createdAt: new Date(),
      },
      {
        id: 'notif-2',
        title: 'Payment Due',
        message: 'Cafe Corner payment of PKR 3,300 is due soon',
        type: 'info',
        read: false,
        actionUrl: '/sales',
        createdAt: new Date(),
      },
      {
        id: 'notif-3',
        title: 'New Sale',
        message: 'Ahmed Trading Co. placed a new order',
        type: 'success',
        read: true,
        actionUrl: '/sales',
        createdAt: new Date(Date.now() - 86400000),
      },
    ];
    localStorage.setItem('notifications-data', JSON.stringify(notifications));
  }

  // Initialize payments
  if (!localStorage.getItem('payment-storage')) {
    console.log('Setting up payment storage...');
    const payments = [
      {
        id: 'payment-1',
        businessId: 'default-business-id',
        type: 'in',
        partyId: 'party-1',
        partyName: 'Ahmed Trading Co.',
        amount: 115500,
        date: new Date('2024-01-15'),
        reference: 'SALE-001',
        notes: 'Full payment for laptop order',
        paymentMethod: 'cash',
        invoiceId: 'inv-1',
        createdAt: new Date('2024-01-15T10:30:00Z'),
      },
      {
        id: 'payment-2',
        businessId: 'default-business-id',
        type: 'out',
        partyId: 'party-2',
        partyName: 'Bilal Suppliers',
        amount: 96800,
        date: new Date('2024-01-10'),
        reference: 'PUR-001',
        notes: 'Payment for electronics purchase',
        paymentMethod: 'cash',
        invoiceId: 'inv-3',
        createdAt: new Date('2024-01-10T11:15:00Z'),
      },
    ];
    localStorage.setItem('payment-storage', JSON.stringify({
      state: {
        payments: payments,
      },
      version: 0
    }));
  }
};
