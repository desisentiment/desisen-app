import { Settings, DollarSign, Moon, Sun, Paintbrush, Percent, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsSection } from '@/hooks/useSettingsSection';
import type { BusinessSettings } from '@/store/useBusinessSettingsStore';

interface GeneralSettings extends BusinessSettings {
  currency: string;
  theme: string;
  defaultTemplate: string;
  showDiscount: boolean;
  showOtherCharges: boolean;
  invoicePrefix: string;
  startingInvoiceNo: number;
}

const CURRENCIES = [
  { id: 'PKR', name: 'Pakistani Rupee (PKR)', symbol: '₨' },
  { id: 'USD', name: 'US Dollar (USD)', symbol: '$' },
  { id: 'EUR', name: 'Euro (EUR)', symbol: '€' },
  { id: 'GBP', name: 'British Pound (GBP)', symbol: '£' },
  { id: 'AED', name: 'UAE Dirham (AED)', symbol: 'د.إ' },
  { id: 'SAR', name: 'Saudi Riyal (SAR)', symbol: '﷼' },
];

const INVOICE_TEMPLATES = [
  { id: 'classic', name: 'Classic Template' },
  { id: 'modern', name: 'Modern Template' },
  { id: 'minimal', name: 'Minimal Template' },
];

export function GeneralSettingsSection() {
  const {
    settings,
    setSettings,
    isLoading,
    isUpdating,
    handleSave,
    updateSetting,
  } = useSettingsSection<GeneralSettings>({
    mapToLocal: (s) => ({
      currency: s.currency || 'PKR',
      theme: s.theme || 'light',
      defaultTemplate: s.defaultTemplate || 'classic',
      showDiscount: s.showDiscount ?? true,
      showOtherCharges: s.showOtherCharges ?? true,
      invoicePrefix: s.invoicePrefix || 'INV-',
      startingInvoiceNo: s.startingInvoiceNo || 1,
    }),
    mapToStore: (local) => ({
      currency: local.currency,
      theme: local.theme,
      defaultTemplate: local.defaultTemplate,
      showDiscount: local.showDiscount,
      showOtherCharges: local.showOtherCharges,
      invoicePrefix: local.invoicePrefix,
      startingInvoiceNo: local.startingInvoiceNo,
    }),
    sectionName: 'General Settings',
  });

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-sm border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            General Settings
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Configure your general business preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          General Settings
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Configure your general business preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Currency Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Currency
          </Label>
          <Select
            value={settings.currency}
            onValueChange={(value) => updateSetting('currency', value)}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.id} value={currency.id}>
                  <div className="flex items-center gap-2">
                    <span>{currency.symbol}</span>
                    <span>{currency.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
    
        {/* Invoice Prefix */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoice Prefix
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              value={settings.invoicePrefix}
              onChange={(e) => updateSetting('invoicePrefix', e.target.value)}
              placeholder="e.g., INV-"
              className="h-11"
            />
            <span className="text-sm text-muted-foreground">Example: {settings.invoicePrefix}1001</span>
          </div>
        </div>
    
        {/* Starting Invoice Number */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Starting Invoice Number
          </Label>
          <Input
            type="number"
            value={settings.startingInvoiceNo}
            onChange={(e) => updateSetting('startingInvoiceNo', parseInt(e.target.value) || 1)}
            min="1"
            className="h-11"
          />
        </div>
    
        {/* Theme Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Paintbrush className="h-4 w-4" />
            Application Theme
          </Label>
          <div className="flex gap-2">
            <Button
              variant={settings.theme === 'light' ? 'default' : 'outline'}
              onClick={() => updateSetting('theme', 'light')}
              className="flex-1 gap-2"
            >
              <Sun className="h-4 w-4" />
              Light
            </Button>
            <Button
              variant={settings.theme === 'dark' ? 'default' : 'outline'}
              onClick={() => updateSetting('theme', 'dark')}
              className="flex-1 gap-2"
            >
              <Moon className="h-4 w-4" />
              Dark
            </Button>
          </div>
        </div>

        {/* Default Invoice Template */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Default Invoice Template
          </Label>
          <Select
            value={settings.defaultTemplate}
            onValueChange={(value) => updateSetting('defaultTemplate', value)}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_TEMPLATES.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invoice Features */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Invoice Display Options</Label>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Show Discount Column
              </Label>
              <p className="text-xs text-muted-foreground">Display discount column on invoices</p>
            </div>
            <Switch
              checked={settings.showDiscount}
              onCheckedChange={(checked) => updateSetting('showDiscount', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Show Other Charges
              </Label>
              <p className="text-xs text-muted-foreground">Display additional charges section</p>
            </div>
            <Switch
              checked={settings.showOtherCharges}
              onCheckedChange={(checked) => updateSetting('showOtherCharges', checked)}
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full h-11"
          disabled={isUpdating}
        >
          {isUpdating ? 'Saving...' : 'Save General Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
