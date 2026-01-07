import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Expense } from '@/types';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;

  // CRUD operations
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpenseById: (id: string) => Expense | undefined;

  // Business-specific operations
  getExpensesByBusiness: (businessId: string) => Expense[];
  
  // Dashboard statistics
  getTodaysExpenses: (businessId: string) => number;
  getTotalExpenses: (businessId: string) => number;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      isLoading: false,
      error: null,

      addExpense: (expenseData) => {
        const newExpense: Expense = {
          ...expenseData,
          id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };

        set((state) => ({
          expenses: [...state.expenses, newExpense],
        }));

        return newExpense;
      },

      updateExpense: (id: string, data: Partial<Expense>) => {
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...data } : expense
          ),
        }));
      },

      deleteExpense: (id: string) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }));
      },

      getExpenseById: (id: string) => {
        return get().expenses.find((expense) => expense.id === id);
      },

      getExpensesByBusiness: (businessId: string) => {
        const expenses = get().expenses.filter((expense) => expense.businessId === businessId);
        // Ensure dates are properly converted from strings
        return expenses.map(expense => ({
          ...expense,
          date: new Date(expense.date),
          createdAt: new Date(expense.createdAt)
        }));
      },

      getTodaysExpenses: (businessId: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysExpenses = get().expenses.filter((expense) => 
          expense.businessId === businessId &&
          expense.createdAt >= today &&
          expense.createdAt < tomorrow
        );

        return todaysExpenses.reduce((total, expense) => total + expense.amount, 0);
      },

      getTotalExpenses: (businessId: string) => {
        const businessExpenses = get().expenses.filter((expense) => 
          expense.businessId === businessId
        );

        return businessExpenses.reduce((total, expense) => total + expense.amount, 0);
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'expense-storage',
      partialize: (state) => ({
        expenses: state.expenses,
      }),
    }
  )
);
