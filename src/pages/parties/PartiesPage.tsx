import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useUnifiedParties, useUnifiedCreateParty, useUnifiedUpdateParty, useUnifiedDeleteParty } from '@/hooks/useUnifiedData';
import { getInitials } from '@/utils/helpers';
import { useFormatCurrency } from '@/hooks/use-business';
import { usePermissions } from '@/hooks/usePermissions';
import { Party } from '@/types';
import { Plus, Search, Filter, MoreVertical, Phone, MapPin, User, Building2, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PartiesPage() {
  const navigate = useNavigate();
  const { currentBusinessId } = useBusinessStore();
  const { canView, canCreate, canEdit, canDelete } = usePermissions();
  const formatCurrency = useFormatCurrency();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [partyType, setPartyType] = useState<'customer' | 'supplier'>('customer');

  // React Query hooks with unified data
  const { data: parties = [], isLoading: isLoadingParties, error: partiesError } = useUnifiedParties(currentBusinessId || 'default-business-id');
  const createPartyMutation = useUnifiedCreateParty();
  const updatePartyMutation = useUnifiedUpdateParty();
  const deletePartyMutation = useUnifiedDeleteParty();

  // Filter parties by type
  const customers = parties.filter((p: Party) => p.type === 'customer');
  const suppliers = parties.filter((p: Party) => p.type === 'supplier');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    address: '',
    openingBalance: "",
    balanceType: 'credit' as 'debit' | 'credit',
    creditLimit: "",
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const processedData = {
      ...formData,
      opening_balance: Number(formData.openingBalance) || 0,
      credit_limit: Number(formData.creditLimit) || 0,
      balance_type: formData.balanceType,
    };

    if (editingParty) {
      await updatePartyMutation.mutateAsync({
        id: editingParty.id,
        ...processedData,
        type: partyType,
      });
    } else {
      await createPartyMutation.mutateAsync({
        ...processedData,
        business_id: currentBusinessId || 'default-business-id',
        type: partyType,
      });
    }

    setFormData({
      name: '',
      phone: '',
      city: '',
      address: '',
      openingBalance: "",
      balanceType: 'credit',
      creditLimit: "",
      notes: '',
    });
    setEditingParty(null);
    setPartyType('customer');
    setIsDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deletePartyMutation.mutateAsync(id);
  };

  const filteredCustomers = customers.filter(
    (p: Party) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.city?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(
    (p: Party) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.city?.toLowerCase().includes(search.toLowerCase())
  );

  const PartyCard = ({ party }: { party: Party }) => (
    <Card className="metric-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-semibold">{getInitials(party.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{party.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Phone className="h-3 w-3" />
                  <span>{party.phone}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{party.city}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  {canEdit('parties') && (
                    <DropdownMenuItem onClick={() => {
                      setEditingParty(party);
                      setPartyType(party.type);
                      setFormData({
                        name: party.name,
                        phone: party.phone || '',
                        city: party.city || '',
                        address: party.address || '',
                        openingBalance: party.opening_balance?.toString() || '',
                        balanceType: party.balance_type || 'credit',
                        creditLimit: party.credit_limit?.toString() || '',
                        notes: party.notes || '',
                      });
                      setIsEditDialogOpen(true);
                    }}>Edit</DropdownMenuItem>
                  )}
                  {party.type === 'customer' ? (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/sales', { state: { selectedParty: party } })}>
                        New Sale
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/payments', { state: { selectedParty: party, type: 'in' } })}>
                        Payment In
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/purchases', { state: { selectedParty: party } })}>
                        New Purchase
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/payments', { state: { selectedParty: party, type: 'out' } })}>
                        Payment Out
                      </DropdownMenuItem>
                    </>
                  )}
                  {canDelete('parties') && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(party.id)}
                      disabled={deletePartyMutation.isPending}
                    >
                      {deletePartyMutation.isPending ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Balance</span>
                <span
                  className={`font-semibold ${
                    party.balance_type === 'debit' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {formatCurrency(party.opening_balance || 0)}{' '}
                  <span className="text-xs">({party.balance_type === 'debit' ? 'Dr' : 'Cr'})</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!canView('parties')) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view parties.</p>
        </Card>
      </div>
    );
  }

  // Error display
  if (partiesError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Error Loading Parties</h3>
          <Alert className="mt-4">
            <AlertDescription>
              Unable to load parties data. Please check your internet connection and try again.
            </AlertDescription>
          </Alert>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Parties</h1>
          <p className="text-muted-foreground">Manage your customers and suppliers</p>
        </div>
        {canCreate('parties') && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Party
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen || isEditDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); setIsEditDialogOpen(false); setEditingParty(null); } }}>
          <DialogContent className="max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingParty ? 'Edit Party' : 'Add New Party'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={partyType === 'customer' ? 'default' : 'outline'}
                  onClick={() => setPartyType('customer')}
                  className="flex-1"
                >
                  <User className="h-4 w-4 mr-2" />
                  Customer
                </Button>
                <Button
                  type="button"
                  variant={partyType === 'supplier' ? 'default' : 'outline'}
                  onClick={() => setPartyType('supplier')}
                  className="flex-1"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Supplier
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Party Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter party name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0300-1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Karachi"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openingBalance">Opening Balance</Label>
                  <Input
                    id="openingBalance"
                    type="number"
                    value={formData.openingBalance}
                    onChange={(e) =>
                      setFormData({ ...formData, openingBalance: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balanceType">Balance Type</Label>
                  <Select
                    value={formData.balanceType}
                    onValueChange={(value: 'debit' | 'credit') =>
                      setFormData({ ...formData, balanceType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Debit (To Receive)</SelectItem>
                      <SelectItem value="credit">Credit (To Pay)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, creditLimit: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1"
                  disabled={createPartyMutation.isPending || updatePartyMutation.isPending}
                >
                  {(createPartyMutation.isPending || updatePartyMutation.isPending) ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      {editingParty ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingParty ? 'Update Party' : 'Add Party'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="customers">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="customers">
            {isLoadingParties ? 'Loading...' : `Customers (${filteredCustomers.length})`}
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            {isLoadingParties ? 'Loading...' : `Suppliers (${filteredSuppliers.length})`}
          </TabsTrigger>
        </TabsList>

        {isLoadingParties ? (
          <div className="mt-6">
            <Card className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading parties...</p>
            </Card>
          </div>
        ) : (
          <>
            <TabsContent value="customers" className="mt-6">
              {filteredCustomers.length === 0 ? (
                <Card className="p-8 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No customers yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first customer to get started</p>
                  <Button onClick={() => { setPartyType('customer'); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredCustomers.map((party) => (
                    <PartyCard key={party.id} party={party} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="suppliers" className="mt-6">
              {filteredSuppliers.length === 0 ? (
                <Card className="p-8 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No suppliers yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first supplier to get started</p>
                  <Button onClick={() => { setPartyType('supplier'); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredSuppliers.map((party) => (
                    <PartyCard key={party.id} party={party} />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
