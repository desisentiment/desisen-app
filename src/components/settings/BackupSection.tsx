import { useState } from 'react';
import { Download, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Business, Invoice, Item, Party, Payment, Expense } from '@/types';
import type { Notification } from '@/store/useNotificationStore';

interface BackupData {
  metadata: {
    version: string;
    timestamp: string;
    app: string;
    description: string;
  };
  data: Record<string, unknown>;
}

interface BackupSectionProps {
  businesses: Business[];
  invoices: Invoice[];
  items: Item[];
  parties: Party[];
  payments: Payment[];
  expenses: Expense[];
  notifications: Notification[];
  getCurrentBusiness: () => Business | null;
  clearBusinessData: () => void;
  setCurrentBusiness: (businessId: string) => void;
}

export function BackupSection({
  businesses,
  invoices,
  items,
  parties,
  payments,
  expenses,
  notifications,
  getCurrentBusiness,
  clearBusinessData,
  setCurrentBusiness,
}: BackupSectionProps) {
  const { toast } = useToast();

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isImportingBackup, setIsImportingBackup] = useState(false);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      // Get current business ID from store
      const currentBusinessId = getCurrentBusiness()?.id || null;

      // Create backup data structure
      const backupData = {
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          app: 'Karobar360',
          description: 'Complete data backup including all businesses, invoices, items, parties, payments, expenses, and notifications'
        },
        data: {
          businesses,
          currentBusinessId,
          invoices,
          items,
          parties,
          payments,
          expenses,
          notifications
        }
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `karobar360-backup-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast({
        title: 'Backup Created',
        description: 'Your complete data backup has been downloaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Backup Failed',
        description: 'Failed to create backup. Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target?.result as string);

            // Validate backup structure
            if (!importedData.metadata || !importedData.data) {
              throw new Error('Invalid backup file format');
            }

            if (!importedData.metadata.version || !importedData.metadata.timestamp) {
              throw new Error('Invalid backup metadata');
            }

            // Validate data structure contains expected keys
            const requiredKeys = ['businesses', 'invoices', 'items', 'parties', 'payments', 'expenses', 'notifications'];
            for (const key of requiredKeys) {
              if (!(key in importedData.data)) {
                throw new Error(`Backup file is missing required data: ${key}`);
              }
            }
            if (!('currentBusinessId' in importedData.data)) {
              throw new Error('Backup file is missing currentBusinessId');
            }

            // Store the validated data and show confirmation dialog
            setImportData(importedData);
            setIsImportDialogOpen(true);

          } catch (error) {
            toast({
              title: 'Import Failed',
              description: error instanceof Error ? error.message : 'Invalid file format or corrupted data.',
              variant: 'destructive',
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleConfirmImport = async () => {
    if (!importData) return;

    setIsImportingBackup(true);
    const restoreResults: { section: string; success: boolean; error?: string }[] = [];

    try {
      // Clear existing data first
      try {
        clearBusinessData();
        restoreResults.push({ section: 'Clear existing data', success: true });
      } catch (error) {
        restoreResults.push({ section: 'Clear existing data', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }

      // Set new data using store actions with error handling for each section
      const { useBusinessStore } = await import('@/store/useBusinessStore');
      const businessStore = useBusinessStore.getState();
      try {
        businessStore.businesses = (importData.data.businesses as Business[]) || [];
        if (importData.data.currentBusinessId) {
          setCurrentBusiness(importData.data.currentBusinessId as string);
        }
        restoreResults.push({ section: 'Businesses', success: true });
      } catch (error) {
        restoreResults.push({ section: 'Businesses', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }

      // Update other stores with individual error handling
      const { useInvoiceStore } = await import('@/store/useInvoiceStore');
      const invoiceStore = useInvoiceStore.getState();
      try {
        invoiceStore.invoices = (importData.data.invoices as Invoice[]) || [];
        restoreResults.push({ section: 'Invoices', success: true });
      } catch (error) {
        restoreResults.push({ section: 'Invoices', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }

      const { useItemStore } = await import('@/store/useItemStore');
      const itemStore = useItemStore.getState();
      try {
        itemStore.items = (importData.data.items as Item[]) || [];
        restoreResults.push({ section: 'Items', success: true });
      } catch (error) {
        restoreResults.push({ section: 'Items', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }

      const { usePartyStore } = await import('@/store/usePartyStore');
      const partyStore = usePartyStore.getState();
      try {
        partyStore.parties = (importData.data.parties as Party[]) || [];
        restoreResults.push({ section: 'Parties', success: true });
      } catch (error) {
        restoreResults.push({ section: 'Parties', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }

      const { usePaymentStore } = await import('@/store/usePaymentStore');
      const paymentStore = usePaymentStore.getState();
      try {
        paymentStore.payments = (importData.data.payments as Payment[]) || [];
        restoreResults.push({ section: 'Payments', success: true });
      } catch (error) {
        restoreResults.push({ section: 'Payments', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }

      const { useExpenseStore } = await import('@/store/useExpenseStore');
      const expenseStore = useExpenseStore.getState();
      try {
        expenseStore.expenses = (importData.data.expenses as Expense[]) || [];
        restoreResults.push({ section: 'Expenses', success: true });
      } catch (error) {
        restoreResults.push({ section: 'Expenses', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }

      const { useNotificationStore } = await import('@/store/useNotificationStore');
      const notificationStore = useNotificationStore.getState();
      try {
        notificationStore.notifications = (importData.data.notifications as Notification[]) || [];
        restoreResults.push({ section: 'Notifications', success: true });
      } catch (error) {
        restoreResults.push({ section: 'Notifications', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }

      // Check for partial failures
      const failedSections = restoreResults.filter(r => !r.success);
      const successfulSections = restoreResults.filter(r => r.success);

      if (failedSections.length > 0) {
        const failedList = failedSections.map(r => r.section).join(', ');
        toast({
          title: 'Partial Restore Completed',
          description: `Some sections failed to restore: ${failedList}. ${successfulSections.length} sections restored successfully.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Data Restored',
          description: 'All data has been successfully restored from backup.',
        });
      }

      setIsImportDialogOpen(false);
      setImportData(null);

    } catch (error) {
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore data from backup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImportingBackup(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create Backup</CardTitle>
          <CardDescription>Download a complete backup of all your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>What gets backed up:</strong>
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4">
              <li>• All businesses and their settings</li>
              <li>• Invoices, payments, and transactions</li>
              <li>• Items, inventory, and stock levels</li>
              <li>• Parties (customers and suppliers)</li>
              <li>• Expenses and financial records</li>
              <li>• Notifications</li>
            </ul>
          </div>
          <Button onClick={handleCreateBackup} className="w-full sm:w-auto" disabled={isCreatingBackup}>
            {isCreatingBackup ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Create Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restore from Backup</CardTitle>
          <CardDescription>Import data from a previously created backup file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Important Warning
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Restoring from backup will replace all current data. This action cannot be undone.
                  Make sure to create a backup of your current data first if you want to keep it.
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleImportBackup} className="w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            Import Backup
          </Button>
        </CardContent>
      </Card>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Data Restoration</AlertDialogTitle>
            <AlertDialogDescription>
              {importData && (
                <>
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-2">⚠️ DANGER: Irreversible Action</p>
                        <p className="text-sm text-destructive">
                          Importing this backup will <strong>permanently replace ALL your current data</strong> including businesses, invoices, items, parties, payments, expenses, and notifications. This action <strong>cannot be undone</strong> and there is no way to recover your existing data once replaced.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Backup Details:</p>
                    <p className="text-sm">Version: {importData.metadata.version}</p>
                    <p className="text-sm">Created: {new Date(importData.metadata.timestamp).toLocaleString()}</p>
                    <p className="text-sm">App: {importData.metadata.app}</p>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsImportDialogOpen(false);
              setImportData(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isImportingBackup}>
              {isImportingBackup ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                'Yes, Replace All Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}