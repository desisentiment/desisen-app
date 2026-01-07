import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Invoice } from '@/types';

interface InvoiceState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;

  // CRUD operations
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  editInvoice: (id: string, data: Omit<Invoice, 'id' | 'createdAt'>) => void;
  deleteInvoice: (id: string) => void;
  recoverInvoice: (id: string) => void;
  getInvoiceById: (id: string) => Invoice | undefined;

  // Business-specific operations
  getInvoicesByBusiness: (businessId: string) => Invoice[];
  getInvoicesByType: (businessId: string, type: Invoice['type'], includeDeleted?: boolean) => Invoice[];
  getInvoicesByParty: (partyId: string) => Invoice[];
  getNextInvoiceNo: (businessId: string, type: Invoice['type']) => string;
  
  // Dashboard statistics
  getTodaysSales: (businessId: string) => number;
  getTodaysPurchases: (businessId: string) => number;
  getReceivables: (businessId: string) => number;
  getPayables: (businessId: string) => number;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoices: [],
      isLoading: false,
      error: null,

      addInvoice: (invoiceData) => {
        console.log('📝 InvoiceStore: Adding invoice', invoiceData);
        
        // Validation
        if (!invoiceData.businessId) {
          console.error('❌ InvoiceStore: Missing businessId');
          throw new Error('Business ID is required');
        }
        
        if (!invoiceData.partyId) {
          console.error('❌ InvoiceStore: Missing partyId');
          throw new Error('Party ID is required');
        }
        
        if (!invoiceData.invoiceNo) {
          console.error('❌ InvoiceStore: Missing invoice number');
          throw new Error('Invoice number is required');
        }
        
        if (!invoiceData.type || !['sale', 'purchase', 'sale-return', 'purchase-return'].includes(invoiceData.type)) {
          console.error('❌ InvoiceStore: Invalid invoice type', invoiceData.type);
          throw new Error('Invoice type must be valid');
        }
        
        if (!invoiceData.date) {
          console.error('❌ InvoiceStore: Missing date');
          throw new Error('Invoice date is required');
        }

        const newInvoice: Invoice = {
          ...invoiceData,
          id: `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };

        console.log('✅ InvoiceStore: Invoice created successfully', { 
          invoiceId: newInvoice.id,
          invoiceNo: newInvoice.invoiceNo,
          type: newInvoice.type,
          grandTotal: newInvoice.grandTotal
        });

        set((state) => ({
          invoices: [...state.invoices, newInvoice],
        }));

        return newInvoice;
      },

      updateInvoice: (id: string, data: Partial<Invoice>) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id ? { ...invoice, ...data } : invoice
          ),
        }));
      },

      editInvoice: (id: string, data: Omit<Invoice, 'id' | 'createdAt'>) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id ? { ...invoice, ...data } : invoice
          ),
        }));
      },

      deleteInvoice: (id: string) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id ? { ...invoice, isDeleted: true } : invoice
          ),
        }));
      },

      recoverInvoice: (id: string) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id ? { ...invoice, isDeleted: false } : invoice
          ),
        }));
      },

      getInvoiceById: (id: string) => {
        return get().invoices.find((invoice) => invoice.id === id);
      },

      getInvoicesByBusiness: (businessId: string) => {
        console.log('📊 InvoiceStore: Getting invoices for business', { businessId });
        
        if (!businessId) {
          console.error('❌ InvoiceStore: Missing businessId in getInvoicesByBusiness');
          return [];
        }
        
        const invoices = get().invoices.filter((invoice) => invoice.businessId === businessId);
        console.log(`📋 InvoiceStore: Found ${invoices.length} invoices for business ${businessId}`);
        
        // Ensure dates are properly converted from strings
        const processedInvoices = invoices.map(invoice => {
          try {
            return {
              ...invoice,
              date: new Date(invoice.date),
              dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
              createdAt: new Date(invoice.createdAt)
            };
          } catch (error) {
            console.error('❌ InvoiceStore: Error processing invoice dates:', { 
              invoiceId: invoice.id, 
              error,
              date: invoice.date,
              dueDate: invoice.dueDate,
              createdAt: invoice.createdAt
            });
            return invoice; // Return original if date conversion fails
          }
        });
        
        return processedInvoices;
      },

      getInvoicesByType: (businessId: string, type: Invoice['type'], includeDeleted: boolean = false) => {
        return get().invoices.filter((invoice) => 
          invoice.businessId === businessId &&
          invoice.type === type &&
          (includeDeleted || !invoice.isDeleted)
        );
      },

      getInvoicesByParty: (partyId: string) => {
        const invoices = get().invoices.filter((invoice) => invoice.partyId === partyId);
        // Ensure dates are properly converted from strings
        return invoices.map(invoice => ({
          ...invoice,
          date: new Date(invoice.date),
          dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
          createdAt: new Date(invoice.createdAt)
        }));
      },

      getNextInvoiceNo: (businessId: string, type: Invoice['type']) => {
        const businessInvoices = get().invoices.filter((invoice) => 
          invoice.businessId === businessId && invoice.type === type
        );
        
        const prefix = type === 'sale' ? 'INV' : 
                     type === 'purchase' ? 'PUR' : 
                     type === 'sale-return' ? 'SR' : 
                     type === 'purchase-return' ? 'PR' : 'INV';
        
        const maxNumber = businessInvoices.reduce((max, invoice) => {
          const match = invoice.invoiceNo.match(new RegExp(`${prefix}(\\d+)`));
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        
        return `${prefix}${String(maxNumber + 1).padStart(3, '0')}`;
      },

      getTodaysSales: (businessId: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysSales = get().invoices.filter((invoice) => 
          invoice.businessId === businessId &&
          invoice.type === 'sale' &&
          invoice.createdAt >= today &&
          invoice.createdAt < tomorrow
        );

        return todaysSales.reduce((total, invoice) => total + invoice.grandTotal, 0);
      },

      getTodaysPurchases: (businessId: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysPurchases = get().invoices.filter((invoice) => 
          invoice.businessId === businessId &&
          invoice.type === 'purchase' &&
          invoice.createdAt >= today &&
          invoice.createdAt < tomorrow
        );

        return todaysPurchases.reduce((total, invoice) => total + invoice.grandTotal, 0);
      },

      getReceivables: (businessId: string) => {
        const salesInvoices = get().invoices.filter((invoice) => 
          invoice.businessId === businessId &&
          invoice.type === 'sale' &&
          invoice.paymentStatus !== 'paid'
        );

        return salesInvoices.reduce((total, invoice) => {
          return total + (invoice.grandTotal - invoice.amountPaid);
        }, 0);
      },

      getPayables: (businessId: string) => {
        const purchaseInvoices = get().invoices.filter((invoice) => 
          invoice.businessId === businessId &&
          invoice.type === 'purchase' &&
          invoice.paymentStatus !== 'paid'
        );

        return purchaseInvoices.reduce((total, invoice) => {
          return total + (invoice.grandTotal - invoice.amountPaid);
        }, 0);
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'invoice-storage',
      partialize: (state) => ({
        invoices: state.invoices,
      }),
    }
  )
);
