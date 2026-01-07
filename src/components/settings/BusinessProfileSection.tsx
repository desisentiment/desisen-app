import { useState, useEffect } from 'react';
import { Building2, User, MapPin, Phone, CreditCard, Upload, FileText, Camera } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useBusinessStore } from '@/store/useBusinessStore';

const BUSINESS_CATEGORIES = [
  'General Store', 'Wholesale', 'Mobile Shop', 'Pharmacy', 'Electronics',
  'Clothing', 'Restaurant', 'Medical', 'Hardware', 'Stationery', 'Cosmetics',
  'Grocery', 'Bakery', 'Butcher', 'Vegetables', 'Fruits', 'Other'
];

interface BusinessProfile {
  name: string;
  ownerName: string;
  category: string;
  address: string;
  city: string;
  phone: string;
  logo: string | null;
}

export function BusinessProfileSection() {
  const { toast } = useToast();
  const { getCurrentBusiness, updateBusiness } = useBusinessStore();

  const [profile, setProfile] = useState<BusinessProfile>({
    name: '',
    ownerName: '',
    category: '',
    address: '',
    city: '',
    phone: '',
    logo: null,
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load business data on component mount
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        const currentBusiness = getCurrentBusiness();
        if (currentBusiness) {
          setProfile({
            name: currentBusiness.name || '',
            ownerName: '',
            category: '',
            address: currentBusiness.address || '',
            city: currentBusiness.city || '',
            phone: currentBusiness.phone || '',
            logo: null,
          });
        }
      } catch (error) {
        console.error('Failed to load business data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load business data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadBusinessData();
  }, [getCurrentBusiness, toast]);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const currentBusiness = getCurrentBusiness();
      if (!currentBusiness) {
        throw new Error('No business selected');
      }

      await updateBusiness(currentBusiness.id, {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
      });

      toast({
        title: 'Business Profile Updated',
        description: 'Your business information has been saved.',
      });
    } catch (error) {
      console.error('Failed to update business:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update business profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateProfile = (key: keyof BusinessProfile, value: string | null) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          updateProfile('logo', base64);
          toast({
            title: 'Logo Uploaded',
            description: 'Business logo has been updated.',
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\s|-/g, '');
    return /^(\+92|0)?[3][0-4][0-9]{8}$/.test(cleanPhone);
  };

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-sm border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Business Profile
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Update your business information and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading business data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Business Profile
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Update your business information and branding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Logo */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Business Logo</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt="Business logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <Button
                onClick={handleLogoUpload}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {profile.logo ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 512x512px, PNG or JPG
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Name *
            </Label>
            <Input
              value={profile.name}
              onChange={(e) => updateProfile('name', e.target.value)}
              placeholder="Enter business name"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Owner/Shopkeeper Name
            </Label>
            <Input
              value={profile.ownerName}
              onChange={(e) => updateProfile('ownerName', e.target.value)}
              placeholder="Enter owner name"
              className="h-11"
            />
          </div>
        </div>

        {/* Business Category */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Business Category</Label>
          <Select
            value={profile.category}
            onValueChange={(value) => updateProfile('category', value)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select business category" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Address & City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              City
            </Label>
            <Input
              value={profile.city}
              onChange={(e) => updateProfile('city', e.target.value)}
              placeholder="Karachi"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Number
            </Label>
            <Input
              value={profile.phone}
              onChange={(e) => updateProfile('phone', e.target.value)}
              placeholder="0300-1234567"
              className={`h-11 ${profile.phone && !validatePhone(profile.phone) ? 'border-destructive' : ''}`}
            />
            {profile.phone && !validatePhone(profile.phone) && (
              <p className="text-xs text-destructive">Please enter a valid Pakistani phone number</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Address</Label>
          <Textarea
            value={profile.address}
            onChange={(e) => updateProfile('address', e.target.value)}
            placeholder="Enter complete business address"
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full h-11"
          disabled={isUpdating}
        >
          {isUpdating ? 'Saving...' : 'Save Business Profile'}
        </Button>
      </CardContent>
    </Card>
  );
}
