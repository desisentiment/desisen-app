import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Payment } from '@/types';

interface PaymentState {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;

  // CRUD operations
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Payment;
  updatePayment: (id: string, data: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  getPaymentById: (id: string) => Payment | undefined;

  // Business-specific operations
  getPaymentsByBusiness: (businessId: string) => Payment[];
  
  // Dashboard statistics
  getTodaysCashIn: (businessId: string) => number;
  getTodaysCashOut: (businessId: string) => number;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      payments: [],
      isLoading: false,
      error: null,

      addPayment: (paymentData) => {
        console.log('📝 PaymentStore: Adding payment', paymentData);
        
        // Validation
        if (!paymentData.businessId) {
          console.error('❌ PaymentStore: Missing businessId');
          throw new Error('Business ID is required');
        }
        
        if (!paymentData.partyId) {
          console.error('❌ PaymentStore: Missing partyId');
          throw new Error('Party ID is required');
        }
        
        if (!paymentData.amount || paymentData.amount <= 0) {
          console.error('❌ PaymentStore: Invalid amount', paymentData.amount);
          throw new Error('Amount must be greater than 0');
        }
        
        if (!paymentData.type || !['in', 'out'].includes(paymentData.type)) {
          console.error('❌ PaymentStore: Invalid payment type', paymentData.type);
          throw new Error('Payment type must be "in" or "out"');
        }

        const newPayment: Payment = {
          ...paymentData,
          id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };

        console.log('✅ PaymentStore: Payment created successfully', { 
          paymentId: newPayment.id,
          amount: newPayment.amount,
          type: newPayment.type
        });

        set((state) => ({
          payments: [...state.payments, newPayment],
        }));

        return newPayment;
      },

      updatePayment: (id: string, data: Partial<Payment>) => {
        set((state) => ({
          payments: state.payments.map((payment) =>
            payment.id === id ? { ...payment, ...data } : payment
          ),
        }));
      },

      deletePayment: (id: string) => {
        console.log('🗑️ PaymentStore: Deleting payment', { paymentId: id });
        
        if (!id) {
          console.error('❌ PaymentStore: Missing payment ID');
          throw new Error('Payment ID is required');
        }
        
        const existingPayment = get().payments.find(p => p.id === id);
        if (!existingPayment) {
          console.error('❌ PaymentStore: Payment not found', { paymentId: id });
          throw new Error('Payment not found');
        }
        
        set((state) => ({
          payments: state.payments.filter((payment) => payment.id !== id),
        }));
        
        console.log('✅ PaymentStore: Payment deleted successfully', { paymentId: id });
      },

      getPaymentById: (id: string) => {
        return get().payments.find((payment) => payment.id === id);
      },

      getPaymentsByBusiness: (businessId: string) => {
        const payments = get().payments.filter((payment) => payment.businessId === businessId);
        // Ensure dates are properly converted from strings
        return payments.map(payment => ({
          ...payment,
          date: new Date(payment.date),
          createdAt: new Date(payment.createdAt)
        }));
      },

      getTodaysCashIn: (businessId: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysCashIn = get().payments.filter((payment) => 
          payment.businessId === businessId &&
          payment.type === 'in' &&
          payment.createdAt >= today &&
          payment.createdAt < tomorrow
        );

        return todaysCashIn.reduce((total, payment) => total + payment.amount, 0);
      },

      getTodaysCashOut: (businessId: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysCashOut = get().payments.filter((payment) => 
          payment.businessId === businessId &&
          payment.type === 'out' &&
          payment.createdAt >= today &&
          payment.createdAt < tomorrow
        );

        return todaysCashOut.reduce((total, payment) => total + payment.amount, 0);
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'payment-storage',
      partialize: (state) => ({
        payments: state.payments,
      }),
    }
  )
);
