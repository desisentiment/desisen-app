import { Building2, FileText, Package, HelpCircle, Info, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BusinessProfileSection } from '@/components/settings/BusinessProfileSection';
import { BillingSettingsSection } from '@/components/settings/BillingSettingsSection';
import { InventorySettingsSection } from '@/components/settings/InventorySettingsSection';
import { GeneralSettingsSection } from '@/components/settings/GeneralSettingsSection';
import { HelpSupportSection } from '@/components/settings/HelpSupportSection';
import { AboutAppSection } from '@/components/settings/AboutAppSection';

export default function SettingsPage() {
  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-muted-foreground">Configure your business</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-3 sm:space-y-4 md:space-y-6">
        <TabsList className="grid w-full max-w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 overflow-x-auto pb-2">
          <TabsTrigger value="general" className="text-xs flex-shrink-0 px-2 py-1.5">
            <Settings className="h-4 w-4 mr-1" />
            General
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-xs flex-shrink-0 px-2 py-1.5">
            <Building2 className="h-4 w-4 mr-1" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs flex-shrink-0 px-2 py-1.5">
            <FileText className="h-4 w-4 mr-1" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs flex-shrink-0 px-2 py-1.5">
            <Package className="h-4 w-4 mr-1" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="help" className="text-xs flex-shrink-0 px-2 py-1.5">
            <HelpCircle className="h-4 w-4 mr-1" />
            Help
          </TabsTrigger>
          <TabsTrigger value="about" className="text-xs flex-shrink-0 px-2 py-1.5">
            <Info className="h-4 w-4 mr-1" />
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-3 sm:space-y-4 md:space-y-6">
          <GeneralSettingsSection />
        </TabsContent>

        <TabsContent value="profile" className="space-y-3 sm:space-y-4 md:space-y-6">
          <BusinessProfileSection />
        </TabsContent>

        <TabsContent value="billing" className="space-y-3 sm:space-y-4 md:space-y-6">
          <BillingSettingsSection />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-3 sm:space-y-4 md:space-y-6">
          <InventorySettingsSection />
        </TabsContent>

        <TabsContent value="help" className="space-y-3 sm:space-y-4 md:space-y-6">
          <HelpSupportSection />
        </TabsContent>

        <TabsContent value="about" className="space-y-3 sm:space-y-4 md:space-y-6">
          <AboutAppSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
