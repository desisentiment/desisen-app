import { Info, FileText, Shield, Star, ExternalLink, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function AboutAppSection() {
  const appVersion = '1.2.3';
  const lastUpdated = 'December 2024';

  const handleOpenTerms = () => {
    window.open('/terms-of-service', '_blank');
  };

  const handleOpenPrivacy = () => {
    window.open('/privacy-policy', '_blank');
  };

  const handleRateApp = () => {
    // For mobile apps, this would open app store
    // For web, could open a feedback form
    window.open('https://play.google.com/store/apps/details?id=com.karobar360', '_blank');
  };

  const handleShareApp = () => {
    const shareData = {
      title: 'Karobar360 - Business Management App',
      text: 'Manage your business easily with Karobar360. Download now!',
      url: 'https://karobar360.com'
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      // Show toast notification
    }
  };

  return (
    <div className="space-y-6">
      {/* App Info */}
      <Card className="rounded-xl shadow-sm border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            About Karobar360
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Business management made simple for Pakistani entrepreneurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm font-medium">Version</Label>
            <Badge variant="secondary">{appVersion}</Badge>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-sm font-medium">Last Updated</Label>
            <span className="text-sm text-muted-foreground">{lastUpdated}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-sm font-medium">Platform</Label>
            <span className="text-sm text-muted-foreground">Web & Mobile</span>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">What's New in {appVersion}</Label>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Enhanced inventory management with batch tracking</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Improved WhatsApp invoice sharing</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Multi-business support</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Bug fixes and performance improvements</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal & Support */}
      <Card className="rounded-xl shadow-sm border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Legal & Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleOpenTerms}
            className="w-full h-11 justify-start"
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-3" />
            Terms & Conditions
            <ExternalLink className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            onClick={handleOpenPrivacy}
            className="w-full h-11 justify-start"
            variant="outline"
          >
            <Shield className="h-4 w-4 mr-3" />
            Privacy Policy
            <ExternalLink className="h-4 w-4 ml-auto" />
          </Button>
        </CardContent>
      </Card>

      {/* App Rating & Sharing */}
      <Card className="rounded-xl shadow-sm border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Support Us
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Help us grow by rating and sharing the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleRateApp}
            className="w-full h-11 justify-start"
            variant="outline"
          >
            <Star className="h-4 w-4 mr-3" />
            Rate on Google Play
            <ExternalLink className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            onClick={handleShareApp}
            className="w-full h-11 justify-start"
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-3" />
            Share Karobar360
          </Button>
        </CardContent>
      </Card>

      {/* Developer Info */}
      <Card className="rounded-xl shadow-sm border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Developer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Karobar360</p>
            <p className="text-xs text-muted-foreground">
              Made with ❤️ for Pakistani businesses
            </p>
            <p className="text-xs text-muted-foreground">
              © 2024 Karobar360. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}