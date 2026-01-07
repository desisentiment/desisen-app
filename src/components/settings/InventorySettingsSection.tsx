import { useState } from 'react';
import { Package, Tag, AlertTriangle, Barcode, Settings, Factory, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsSection } from '@/hooks/useSettingsSection';
import type { BusinessSettings } from '@/store/useBusinessSettingsStore';

interface InventorySettings extends BusinessSettings {
  categories: string[];
  units: string[];
  lowStockAlert: number;
  batchExpiry: boolean;
  barcode: boolean;
  purchasePrice: boolean;
  salePrice: boolean;
  wholesalePrice: boolean;
  bom: boolean;
}

const PAKISTANI_UNITS = [
  'piece', 'box', 'carton', 'kg', 'gram', 'litre', 'ml', 'packet',
  'bundle', 'dozen', 'meter', 'foot', 'inch', 'ton', 'quintal'
];

const BUSINESS_CATEGORIES = [
  'General Store', 'Wholesale', 'Mobile Shop', 'Pharmacy', 'Electronics',
  'Clothing', 'Restaurant', 'Medical', 'Hardware', 'Stationery', 'Cosmetics'
];

export function InventorySettingsSection() {
  const {
    settings,
    setSettings,
    isLoading,
    isUpdating,
    handleSave,
    updateSetting,
  } = useSettingsSection<InventorySettings>({
    mapToLocal: (s) => ({
      categories: s.categories || ['General Store'],
      units: s.units || ['piece', 'kg', 'litre'],
      lowStockAlert: s.lowStockAlert || 5,
      batchExpiry: s.batchExpiry ?? false,
      barcode: s.barcode ?? true,
      purchasePrice: s.purchasePrice ?? true,
      salePrice: s.salePrice ?? true,
      wholesalePrice: s.wholesalePrice ?? false,
      bom: s.bom ?? false,
    }),
    mapToStore: (local) => ({
      categories: local.categories,
      units: local.units,
      lowStockAlert: local.lowStockAlert,
      batchExpiry: local.batchExpiry,
      barcode: local.barcode,
      purchasePrice: local.purchasePrice,
      salePrice: local.salePrice,
      wholesalePrice: local.wholesalePrice,
      bom: local.bom,
    }),
    sectionName: 'Inventory Settings',
  });

  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('');

  const addCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      updateSetting('categories', [...settings.categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    updateSetting('categories', settings.categories.filter(c => c !== category));
  };

  const addUnit = () => {
    if (newUnit.trim() && !settings.units.includes(newUnit.trim())) {
      updateSetting('units', [...settings.units, newUnit.trim()]);
      setNewUnit('');
    }
  };

  const removeUnit = (unit: string) => {
    updateSetting('units', settings.units.filter(u => u !== unit));
  };

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-sm border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Items & Inventory Settings
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Configure your inventory management and item settings
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
          <Package className="h-5 w-5 text-primary" />
          Items & Inventory Settings
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Configure your inventory management and item settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Item Categories */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Item Categories
          </Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {settings.categories.map((category) => (
              <Badge key={category} variant="secondary" className="flex items-center gap-1">
                {category}
                <button
                  onClick={() => removeCategory(category)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add new category"
              className="h-9 flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            />
            <Button onClick={addCategory} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {BUSINESS_CATEGORIES.filter(cat => !settings.categories.includes(cat)).map((category) => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                onClick={() => updateSetting('categories', [...settings.categories, category])}
                className="justify-start h-8 text-xs"
              >
                + {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Units
          </Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {settings.units.map((unit) => (
              <Badge key={unit} variant="outline" className="flex items-center gap-1">
                {unit}
                <button
                  onClick={() => removeUnit(unit)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="Add custom unit"
              className="h-9 flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addUnit()}
            />
            <Button onClick={addUnit} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {PAKISTANI_UNITS.filter(unit => !settings.units.includes(unit)).slice(0, 10).map((unit) => (
              <Button
                key={unit}
                variant="ghost"
                size="sm"
                onClick={() => updateSetting('units', [...settings.units, unit])}
                className="justify-start h-8 text-xs"
              >
                + {unit}
              </Button>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Low Stock Alert Threshold
          </Label>
          <Input
            type="number"
            value={settings.lowStockAlert}
            onChange={(e) => updateSetting('lowStockAlert', parseInt(e.target.value) || 0)}
            min="0"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            Get notified when item stock falls below this number
          </p>
        </div>

        {/* Inventory Features */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Inventory Features</Label>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Barcode className="h-4 w-4" />
                Barcode Scanning
              </Label>
              <p className="text-xs text-muted-foreground">Enable barcode scanning for items</p>
            </div>
            <Switch
              checked={settings.barcode}
              onCheckedChange={(checked) => updateSetting('barcode', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Purchase Price Tracking</Label>
              <p className="text-xs text-muted-foreground">Track item purchase costs</p>
            </div>
            <Switch
              checked={settings.purchasePrice}
              onCheckedChange={(checked) => updateSetting('purchasePrice', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Sale Price Management</Label>
              <p className="text-xs text-muted-foreground">Set and manage selling prices</p>
            </div>
            <Switch
              checked={settings.salePrice}
              onCheckedChange={(checked) => updateSetting('salePrice', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Wholesale Pricing</Label>
              <p className="text-xs text-muted-foreground">Enable bulk/wholesale pricing</p>
            </div>
            <Switch
              checked={settings.wholesalePrice}
              onCheckedChange={(checked) => updateSetting('wholesalePrice', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Factory className="h-4 w-4" />
                Manufacturing/BOM
              </Label>
              <p className="text-xs text-muted-foreground">Bill of Materials for production</p>
            </div>
            <Switch
              checked={settings.bom}
              onCheckedChange={(checked) => updateSetting('bom', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Batch & Expiry Tracking</Label>
              <p className="text-xs text-muted-foreground">Track batch numbers and expiry dates</p>
            </div>
            <Switch
              checked={settings.batchExpiry}
              onCheckedChange={(checked) => updateSetting('batchExpiry', checked)}
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full h-11"
          disabled={isUpdating}
        >
          {isUpdating ? 'Saving...' : 'Save Inventory Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
