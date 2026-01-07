import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useBusinessSettingsStore, type BusinessSettings } from '@/store/useBusinessSettingsStore';

interface UseSettingsSectionOptions<T extends BusinessSettings> {
  /**
   * Map store settings to local state
   */
  mapToLocal: (settings: BusinessSettings) => T;
  /**
   * Map local state to store update
   */
  mapToStore: (local: T) => Partial<BusinessSettings>;
  /**
   * Settings section title for toasts
   */
  sectionName: string;
}

interface UseSettingsSectionReturn<T> {
  settings: T;
  setSettings: React.Dispatch<React.SetStateAction<T>>;
  isLoading: boolean;
  isUpdating: boolean;
  handleSave: () => Promise<void>;
  updateSetting: (key: keyof T, value: unknown) => void;
}

/**
 * Reusable hook for settings sections to reduce code duplication
 *
 * Usage:
 * const { settings, setSettings, isLoading, isUpdating, handleSave, updateSetting } =
 *   useSettingsSection<MySettings>({
 *     mapToLocal: (s) => ({
 *       theme: s.invoiceTheme || 'classic',
 *       prefix: s.invoicePrefix || 'INV-',
 *       // ...
 *     }),
 *     mapToStore: (local) => ({
 *       invoiceTheme: local.theme,
 *       invoicePrefix: local.prefix,
 *       // ...
 *     }),
 *     sectionName: 'Billing Settings',
 *   });
 */
export function useSettingsSection<T extends BusinessSettings>(
  options: UseSettingsSectionOptions<T>
): UseSettingsSectionReturn<T> {
  const { toast } = useToast();
  const { getCurrentBusiness } = useBusinessStore();
  const { settings: businessSettings, loadSettings, updateSettings, loading } = useBusinessSettingsStore();

  const [settings, setSettings] = useState<T>(options.mapToLocal({} as BusinessSettings));
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load settings when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentBusiness = getCurrentBusiness();
        if (currentBusiness) {
          await loadSettings(currentBusiness.id);
        }
      } catch (error) {
        console.error(`Failed to load ${options.sectionName}:`, error);
        toast({
          title: 'Error',
          description: `Failed to load ${options.sectionName}. Using default values.`,
          variant: 'destructive',
        });
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadData();
  }, [getCurrentBusiness, loadSettings, toast, options.sectionName]);

  // Sync with business settings when they change
  useEffect(() => {
    if (businessSettings && Object.keys(businessSettings).length > 0) {
      setSettings(options.mapToLocal(businessSettings));
    }
  }, [businessSettings, options.mapToLocal]);

  const handleSave = useCallback(async () => {
    setIsUpdating(true);
    try {
      const currentBusiness = getCurrentBusiness();
      if (!currentBusiness) {
        throw new Error('No business selected');
      }

      await updateSettings(options.mapToStore(settings));

      toast({
        title: `${options.sectionName} Updated`,
        description: `Your ${options.sectionName.toLowerCase()} preferences have been saved.`,
      });
    } catch (error) {
      console.error(`Failed to save ${options.sectionName}:`, error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : `Failed to update ${options.sectionName.toLowerCase()}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [settings, getCurrentBusiness, updateSettings, options, toast]);

  const updateSetting = useCallback((key: keyof T, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }) as T);
  }, []);

  return {
    settings,
    setSettings,
    isLoading: isInitialLoad || loading,
    isUpdating,
    handleSave,
    updateSetting,
  };
}
