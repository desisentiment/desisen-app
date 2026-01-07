import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from '@/types';

interface BusinessSettingsState {
  // Settings data
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;

  // General settings
  setInvoicePrefix: (prefix: string) => void;
  setStartingInvoiceNo: (no: number) => void;
  setDefaultTemplate: (template: 'classic' | 'modern') => void;
  setShowDiscount: (show: boolean) => void;
  setShowOtherCharges: (show: boolean) => void;
  setCurrency: (currency: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Inventory settings
  lowStockAlert: number;
  setLowStockAlert: (alert: number) => void;
  defaultUnit: string;
  setDefaultUnit: (unit: string) => void;
  autoGenerateSku: boolean;
  setAutoGenerateSku: (auto: boolean) => void;

  // Billing settings
  invoiceNotes: string;
  setInvoiceNotes: (notes: string) => void;
  termsAndConditions: string;
  setTermsAndConditions: (terms: string) => void;
  showLogoOnInvoice: boolean;
  setShowLogoOnInvoice: (show: boolean) => void;
  companyNameOnInvoice: string;
  setCompanyNameOnInvoice: (name: string) => void;

  // Actions
  loadSettings: (businessId: string) => Promise<void>;
  saveSettings: (settings: Partial<Settings>) => Promise<void>;
  resetSettings: () => void;
  getSettings: () => Settings | null;
}

// Default settings factory
const createDefaultSettings = (businessId: string): Settings => ({
  businessId,
  invoicePrefix: 'INV',
  startingInvoiceNo: 1,
  defaultTemplate: 'modern',
  showDiscount: true,
  showOtherCharges: true,
  currency: 'PKR',
  theme: 'light',
});

export const useBusinessSettingsStore = create<BusinessSettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: null,
      isLoading: false,
      error: null,

      // Inventory defaults
      lowStockAlert: 10,
      setLowStockAlert: (alert) => set({ lowStockAlert: alert }),
      defaultUnit: 'Piece',
      setDefaultUnit: (unit) => set({ defaultUnit: unit }),
      autoGenerateSku: true,
      setAutoGenerateSku: (auto) => set({ autoGenerateSku: auto }),

      // Billing defaults
      invoiceNotes: 'Thank you for your business!',
      setInvoiceNotes: (notes) => set({ invoiceNotes: notes }),
      termsAndConditions: '',
      setTermsAndConditions: (terms) => set({ termsAndConditions: terms }),
      showLogoOnInvoice: true,
      setShowLogoOnInvoice: (show) => set({ showLogoOnInvoice: show }),
      companyNameOnInvoice: '',
      setCompanyNameOnInvoice: (name) => set({ companyNameOnInvoice: name }),

      // General settings
      setInvoicePrefix: (prefix) => {
        const current = get().settings;
        if (current) {
          set({ settings: { ...current, invoicePrefix: prefix } });
        }
      },
      setStartingInvoiceNo: (no) => {
        const current = get().settings;
        if (current) {
          set({ settings: { ...current, startingInvoiceNo: no } });
        }
      },
      setDefaultTemplate: (template) => {
        const current = get().settings;
        if (current) {
          set({ settings: { ...current, defaultTemplate: template } });
        }
      },
      setShowDiscount: (show) => {
        const current = get().settings;
        if (current) {
          set({ settings: { ...current, showDiscount: show } });
        }
      },
      setShowOtherCharges: (show) => {
        const current = get().settings;
        if (current) {
          set({ settings: { ...current, showOtherCharges: show } });
        }
      },
      setCurrency: (currency) => {
        const current = get().settings;
        if (current) {
          set({ settings: { ...current, currency } });
        }
      },
      setTheme: (theme) => {
        const current = get().settings;
        if (current) {
          set({ settings: { ...current, theme } });
        }
      },

      // Actions
      loadSettings: async (businessId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call - replace with actual API
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          const defaultSettings = createDefaultSettings(businessId);
          set({
            settings: defaultSettings,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: 'Failed to load settings',
            isLoading: false,
          });
        }
      },

      saveSettings: async (newSettings: Partial<Settings>) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call - replace with actual API
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          const current = get().settings;
          if (current) {
            set({
              settings: { ...current, ...newSettings },
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: 'Failed to save settings',
            isLoading: false,
          });
        }
      },

      resetSettings: () => {
        const current = get().settings;
        if (current) {
          set({
            settings: createDefaultSettings(current.businessId),
          });
        }
      },

      getSettings: () => {
        return get().settings;
      },
    }),
    {
      name: 'business-settings-storage',
      partialize: (state) => ({
        settings: state.settings,
        lowStockAlert: state.lowStockAlert,
        defaultUnit: state.defaultUnit,
        autoGenerateSku: state.autoGenerateSku,
        invoiceNotes: state.invoiceNotes,
        termsAndConditions: state.termsAndConditions,
        showLogoOnInvoice: state.showLogoOnInvoice,
        companyNameOnInvoice: state.companyNameOnInvoice,
      }),
    }
  )
);
