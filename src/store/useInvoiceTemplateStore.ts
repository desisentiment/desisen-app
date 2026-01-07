import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TemplateSettings {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  layoutStyle: 'compact' | 'spacious';
  showLogo: boolean;
  showSignature: boolean;
  showTerms: boolean;
  showBankDetails: boolean;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

interface InvoiceTemplateState {
  settings: TemplateSettings;
  updateSettings: (settings: Partial<TemplateSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: TemplateSettings = {
  primaryColor: '#2980b9',
  secondaryColor: '#95a5a6',
  fontFamily: 'helvetica',
  fontSize: 12,
  layoutStyle: 'spacious',
  showLogo: true,
  showSignature: true,
  showTerms: true,
  showBankDetails: false,
};

export const useInvoiceTemplateStore = create<InvoiceTemplateState>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: 'invoice-template-storage',
    }
  )
);
