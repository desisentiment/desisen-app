import { FileText, Palette, Hash, PenTool, Plus, Truck, Percent, Eye, CheckCircle, MessageCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSettingsSection } from '@/hooks/useSettingsSection';
import type { BusinessSettings } from '@/store/useBusinessSettingsStore';

interface BillingSettings extends BusinessSettings {
  theme: string;
  addLogo: boolean;
  prefix: string;
  notes: string;
  signature: boolean;
  additionalCharges: boolean;
  deliveryCharges: boolean;
  itemDiscount: boolean;
  showBalance: boolean;
  paymentStamp: boolean;
  whatsappFormat: string;
}

const INVOICE_THEMES = [
  { id: 'classic', name: 'Classic', color: 'bg-blue-500' },
  { id: 'modern', name: 'Modern', color: 'bg-green-500' },
  { id: 'minimal', name: 'Minimal', color: 'bg-gray-500' },
  { id: 'colorful', name: 'Colorful', color: 'bg-purple-500' },
];

export function BillingSettingsSection() {
  const {
    settings,
    setSettings,
    isLoading,
    isUpdating,
    handleSave,
    updateSetting,
  } = useSettingsSection<BillingSettings>({
    mapToLocal: (s) => ({
      theme: s.invoiceTheme || 'classic',
      addLogo: s.addLogo ?? true,
      prefix: s.invoicePrefix || 'INV-',
      notes: '',
      signature: s.signature ?? false,
      additionalCharges: s.additionalCharges ?? false,
      deliveryCharges: s.deliveryCharges ?? false,
      itemDiscount: s.itemDiscount ?? true,
      showBalance: s.showBalance ?? true,
      paymentStamp: s.paymentStamp ?? true,
      whatsappFormat: s.whatsappFormat || 'detailed',
    }),
    mapToStore: (local) => ({
      invoiceTheme: local.theme,
      addLogo: local.addLogo,
      invoicePrefix: local.prefix,
      signature: local.signature,
      additionalCharges: local.additionalCharges,
      deliveryCharges: local.deliveryCharges,
      itemDiscount: local.itemDiscount,
      showBalance: local.showBalance,
      paymentStamp: local.paymentStamp,
      whatsappFormat: local.whatsappFormat,
    }),
    sectionName: 'Billing Settings',
  });

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-sm border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Billing & Invoice Settings
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Customize your invoices and billing preferences
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
          <FileText className="h-5 w-5 text-primary" />
          Billing & Invoice Settings
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Customize your invoices and billing preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Theme Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Invoice Theme
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {INVOICE_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateSetting('theme', theme.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  settings.theme === theme.id
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className={`w-full h-8 rounded mb-2 ${theme.color}`} />
                <p className="text-sm font-medium">{theme.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Logo Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Add Logo to Invoice
            </Label>
            <p className="text-xs text-muted-foreground">Include business logo on invoices</p>
          </div>
          <Switch
            checked={settings.addLogo}
            onCheckedChange={(checked) => updateSetting('addLogo', checked)}
          />
        </div>

        {/* Custom Invoice Prefix */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Custom Invoice Prefix
          </Label>
          <div className="flex gap-2">
            <Input
              value={settings.prefix}
              onChange={(e) => updateSetting('prefix', e.target.value)}
              placeholder="INV-"
              className="h-11 flex-1"
              maxLength={10}
            />
            <Badge variant="outline" className="px-3 py-2">
              Preview: {settings.prefix}001
            </Badge>
          </div>
        </div>

        {/* Default Invoice Notes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Default Invoice Notes</Label>
          <Textarea
            value={settings.notes}
            onChange={(e) => updateSetting('notes', e.target.value)}
            placeholder="Thank you for your business!"
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Invoice Features */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Invoice Features</Label>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <PenTool className="h-4 w-4" />
                Digital Signature
              </Label>
              <p className="text-xs text-muted-foreground">Add signature field to invoices</p>
            </div>
            <Switch
              checked={settings.signature}
              onCheckedChange={(checked) => updateSetting('signature', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Additional Charges
              </Label>
              <p className="text-xs text-muted-foreground">Allow adding extra charges</p>
            </div>
            <Switch
              checked={settings.additionalCharges}
              onCheckedChange={(checked) => updateSetting('additionalCharges', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Delivery Charges
              </Label>
              <p className="text-xs text-muted-foreground">Include delivery cost option</p>
            </div>
            <Switch
              checked={settings.deliveryCharges}
              onCheckedChange={(checked) => updateSetting('deliveryCharges', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Item Discount
              </Label>
              <p className="text-xs text-muted-foreground">Enable per-item discounts</p>
            </div>
            <Switch
              checked={settings.itemDiscount}
              onCheckedChange={(checked) => updateSetting('itemDiscount', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Show Previous Balance
              </Label>
              <p className="text-xs text-muted-foreground">Display outstanding balance on bills</p>
            </div>
            <Switch
              checked={settings.showBalance}
              onCheckedChange={(checked) => updateSetting('showBalance', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Payment Status Stamp
              </Label>
              <p className="text-xs text-muted-foreground">Show PAID/UNPAID stamps</p>
            </div>
            <Switch
              checked={settings.paymentStamp}
              onCheckedChange={(checked) => updateSetting('paymentStamp', checked)}
            />
          </div>
        </div>

        {/* WhatsApp Bill Sharing */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp Bill Sharing Format
          </Label>
          <Select
            value={settings.whatsappFormat}
            onValueChange={(value) => updateSetting('whatsappFormat', value)}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="detailed">Detailed Format</SelectItem>
              <SelectItem value="compact">Compact Format</SelectItem>
              <SelectItem value="minimal">Minimal Format</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full h-11"
          disabled={isUpdating}
        >
          {isUpdating ? 'Saving...' : 'Save Billing Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
