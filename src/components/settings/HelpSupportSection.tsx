import { HelpCircle, Play, MessageCircle, Phone, Users, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const TUTORIAL_VIDEOS = [
  {
    id: 1,
    title: 'Getting Started with Karobar360',
    duration: '5:30',
    thumbnail: '/api/placeholder/160/90',
    category: 'Basics'
  },
  {
    id: 2,
    title: 'Creating Your First Invoice',
    duration: '4:15',
    thumbnail: '/api/placeholder/160/90',
    category: 'Billing'
  },
  {
    id: 3,
    title: 'Inventory Management',
    duration: '6:45',
    thumbnail: '/api/placeholder/160/90',
    category: 'Inventory'
  },
  {
    id: 4,
    title: 'Managing Customers & Parties',
    duration: '5:20',
    thumbnail: '/api/placeholder/160/90',
    category: 'Parties'
  }
];

const FAQ_ITEMS = [
  {
    id: 'backup',
    question: 'How do I backup my data?',
    answer: 'Go to Settings > Data Backup > Create Backup. Your data will be downloaded as a JSON file that you can save securely.'
  },
  {
    id: 'invoice',
    question: 'How to customize invoice templates?',
    answer: 'Navigate to Settings > Billing & Invoice Settings. You can change themes, add your logo, and customize prefixes and notes.'
  },
  {
    id: 'multi-business',
    question: 'Can I manage multiple businesses?',
    answer: 'Yes! Add multiple businesses from Settings > Business. Switch between them anytime from the business selector.'
  },
  {
    id: 'whatsapp',
    question: 'How to share invoices via WhatsApp?',
    answer: 'When creating an invoice, tap the WhatsApp share button. The app will format and send the bill directly to your customer.'
  },
  {
    id: 'low-stock',
    question: 'How do low stock alerts work?',
    answer: 'Set your alert threshold in Settings > Items & Inventory. You\'ll get notifications when items fall below this level.'
  }
];

export function HelpSupportSection() {
  const handleWhatsAppSupport = () => {
    const phoneNumber = '+923001234567'; // Replace with actual support number
    const message = 'Hi, I need help with Karobar360 app';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallSupport = () => {
    const phoneNumber = '+923001234567'; // Replace with actual support number
    window.open(`tel:${phoneNumber}`, '_blank');
  };

  const handleJoinCommunity = () => {
    const communityUrl = 'https://chat.whatsapp.com/your-community-group'; // Replace with actual group
    window.open(communityUrl, '_blank');
  };

  const handleReportBug = () => {
    const email = 'support@karobar360.com';
    const subject = 'Bug Report - Karobar360';
    const body = `Please describe the issue you're facing:

App Version: 
Device: 
Steps to reproduce:
Expected behavior:
Actual behavior:`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Tutorial Videos */}
      <Card className="rounded-xl shadow-sm border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Tutorial Videos
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Learn how to use Karobar360 with our video guides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TUTORIAL_VIDEOS.map((video) => (
              <div
                key={video.id}
                className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  // Handle video play
                  console.log('Play video:', video.id);
                }}
              >
                <div className="w-20 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <Play className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{video.title}</h4>
                  <p className="text-xs text-muted-foreground">{video.category} • {video.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Frequently Asked Questions */}
      <Card className="rounded-xl shadow-sm border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Find answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="rounded-xl shadow-sm border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Contact Support</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Get help from our support team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleWhatsAppSupport}
            className="w-full h-11 justify-start"
            variant="outline"
          >
            <MessageCircle className="h-4 w-4 mr-3" />
            WhatsApp Support
            <ExternalLink className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            onClick={handleCallSupport}
            className="w-full h-11 justify-start"
            variant="outline"
          >
            <Phone className="h-4 w-4 mr-3" />
            Call Support
            <ExternalLink className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            onClick={handleJoinCommunity}
            className="w-full h-11 justify-start"
            variant="outline"
          >
            <Users className="h-4 w-4 mr-3" />
            Join Community Group
            <ExternalLink className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            onClick={handleReportBug}
            className="w-full h-11 justify-start"
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-3" />
            Report a Problem
            <ExternalLink className="h-4 w-4 ml-auto" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}