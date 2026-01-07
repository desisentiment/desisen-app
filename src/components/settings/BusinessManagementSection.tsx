import { useState } from 'react';
import { Plus, Save, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import type { Business } from '@/types';

interface BusinessManagementSectionProps {
  businesses: Business[];
  currentBusiness: Business | null;
  setCurrentBusiness: (businessId: string) => void;
  addBusiness: (business: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBusiness: (id: string, updates: Partial<Business>) => Promise<void>;
  deleteBusiness: (id: string) => Promise<void>;
}

export function BusinessManagementSection({
  businesses,
  currentBusiness,
  setCurrentBusiness,
  addBusiness,
  updateBusiness,
  deleteBusiness,
}: BusinessManagementSectionProps) {
  const { toast } = useToast();

  const [isAddBusinessOpen, setIsAddBusinessOpen] = useState(false);
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    currency: 'PKR',
  });

  const [businessForm, setBusinessForm] = useState({
    name: currentBusiness?.name || '',
    phone: currentBusiness?.phone || '',
    address: currentBusiness?.address || '',
    city: currentBusiness?.city || '',
  });

  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  const [isDeleteBusinessDialogOpen, setIsDeleteBusinessDialogOpen] = useState(false);

  // Loading states
  const [isUpdatingBusiness, setIsUpdatingBusiness] = useState(false);
  const [isAddingBusiness, setIsAddingBusiness] = useState(false);
  const [isDeletingBusiness, setIsDeletingBusiness] = useState(false);

  const validateBusinessForm = (form: typeof businessForm) => {
    const errors: string[] = [];

    if (!form.name.trim()) {
      errors.push('Business name is required');
    }

    if (form.phone && !/^(\+92|0)?[3][0-4][0-9]{8}$/.test(form.phone.replace(/\s|-/g, ''))) {
      errors.push('Please enter a valid Pakistani phone number (e.g., 0300-1234567)');
    }

    if (!form.address.trim()) {
      errors.push('Address is required');
    } else if (form.address.trim().length < 10) {
      errors.push('Address must be at least 10 characters long');
    }

    if (!form.city.trim()) {
      errors.push('City is required');
    } else if (form.city.trim().length < 2) {
      errors.push('City name must be at least 2 characters long');
    }

    return errors;
  };

  const handleBusinessUpdate = async () => {
    if (!currentBusiness) return;

    const validationErrors = validateBusinessForm(businessForm);
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors.join('. '),
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingBusiness(true);
    try {
      await updateBusiness(currentBusiness.id, businessForm);
      toast({
        title: 'Business Updated',
        description: 'Your business details have been saved successfully.',
      });
      // Reset form to current business data
      setBusinessForm({
        name: currentBusiness.name || '',
        phone: currentBusiness.phone || '',
        address: currentBusiness.address || '',
        city: currentBusiness.city || '',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update business details. Please check your input and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingBusiness(false);
    }
  };

  const validateNewBusinessForm = (form: typeof newBusiness) => {
    const errors: string[] = [];

    if (!form.name.trim()) {
      errors.push('Business name is required');
    }

    if (form.phone && !/^(\+92|0)?[3][0-4][0-9]{8}$/.test(form.phone.replace(/\s|-/g, ''))) {
      errors.push('Please enter a valid Pakistani phone number (e.g., 0300-1234567)');
    }

    if (form.address && form.address.trim().length < 10) {
      errors.push('Address must be at least 10 characters long');
    }

    if (form.city && form.city.trim().length < 2) {
      errors.push('City name must be at least 2 characters long');
    }

    return errors;
  };

  const handleAddBusiness = async () => {
    const validationErrors = validateNewBusinessForm(newBusiness);
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors.join('. '),
        variant: 'destructive',
      });
      return;
    }

    setIsAddingBusiness(true);
    try {
      await addBusiness({
        name: newBusiness.name,
        phone: newBusiness.phone,
        address: newBusiness.address,
        city: newBusiness.city,
        currency: newBusiness.currency,
      });

      toast({
        title: 'Business Added',
        description: `${newBusiness.name} has been created successfully.`,
      });

      // Reset form after successful operation
      setNewBusiness({ name: '', phone: '', address: '', city: '', currency: 'PKR' });
      setIsAddBusinessOpen(false);
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create new business. Please check your input and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingBusiness(false);
    }
  };

  const handleDeleteBusiness = async () => {
    if (!businessToDelete) return;

    // Prevent deleting the current business
    if (businessToDelete.id === currentBusiness?.id) {
      toast({
        title: 'Deletion Failed',
        description: 'You cannot delete the currently active business. Please switch to another business first.',
        variant: 'destructive',
      });
      return;
    }

    // Prevent deleting the last business
    if (businesses.length <= 1) {
      toast({
        title: 'Deletion Failed',
        description: 'You must have at least one business. Cannot delete the last remaining business.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeletingBusiness(true);
    try {
      await deleteBusiness(businessToDelete.id);
      toast({
        title: 'Business Deleted',
        description: `${businessToDelete.name} has been removed successfully.`,
      });
      setIsDeleteBusinessDialogOpen(false);
      setBusinessToDelete(null);
    } catch (error) {
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete business. Please check permissions and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingBusiness(false);
    }
  };

  return (
    <>
      {/* Business Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Your Businesses</CardTitle>
          <CardDescription>Manage multiple businesses from one account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((business) => (
              <Card
                key={business.id}
                className={`cursor-pointer transition-all ${
                  business.id === currentBusiness?.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setCurrentBusiness(business.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{business.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{business.name}</p>
                      <p className="text-sm text-muted-foreground">{business.city}</p>
                    </div>
                    {businesses.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBusinessToDelete(business);
                          setIsDeleteBusinessDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={isAddBusinessOpen} onOpenChange={setIsAddBusinessOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add New Business
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Business</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Business Name *</Label>
                  <Input
                    value={newBusiness.name}
                    onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={newBusiness.phone}
                      onChange={(e) => setNewBusiness({ ...newBusiness, phone: e.target.value })}
                      placeholder="0300-1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={newBusiness.city}
                      onChange={(e) => setNewBusiness({ ...newBusiness, city: e.target.value })}
                      placeholder="Karachi"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={newBusiness.address}
                    onChange={(e) => setNewBusiness({ ...newBusiness, address: e.target.value })}
                    placeholder="Enter address"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={newBusiness.currency}
                    onValueChange={(value) => setNewBusiness({ ...newBusiness, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddBusinessOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleAddBusiness} disabled={isAddingBusiness}>
                    {isAddingBusiness ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Business'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Current Business Details */}
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>Update your business information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input
                value={businessForm.name}
                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                placeholder="Enter business name"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={businessForm.phone}
                onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                placeholder="0300-1234567"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={businessForm.city}
                onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                placeholder="Karachi"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={businessForm.address}
              onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
              placeholder="Enter business address"
              rows={2}
            />
          </div>
          <Button onClick={handleBusinessUpdate} disabled={isUpdatingBusiness}>
            {isUpdatingBusiness ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Business Dialog */}
      <AlertDialog open={isDeleteBusinessDialogOpen} onOpenChange={setIsDeleteBusinessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {businessToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteBusinessDialogOpen(false);
              setBusinessToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBusiness} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeletingBusiness}>
              {isDeletingBusiness ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Business'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}