import { useBusinessStore } from '@/store/useBusinessStore';
import { formatCurrency as baseFormatCurrency } from '@/utils/helpers';

export const useCurrentBusiness = () => {
  const { getCurrentBusiness } = useBusinessStore();
  return getCurrentBusiness();
};

export const useCurrentCurrency = () => {
  const currentBusiness = useCurrentBusiness();
  return currentBusiness?.currency || 'PKR';
};

export const useFormatCurrency = () => {
  const currency = useCurrentCurrency();
  return (amount: number) => baseFormatCurrency(amount, currency);
};