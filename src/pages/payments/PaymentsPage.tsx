import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBusinessStore } from '@/store/useBusinessStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { usePartyStore } from '@/store/usePartyStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { formatDate } from '@/utils/helpers';
import { useFormatCurrency } from '@/hooks/use-business';
import { Invoice } from '@/types';
import {
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  MoreVertical,
  Trash2,
  CreditCard,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function PaymentsPage() {
  const location = useLocation();
  const { currentBusinessId } = useBusinessStore();
  const { getPaymentsByBusiness, addPayment, deletePayment, getTodaysCashIn, getTodaysCashOut } = usePaymentStore();
  const { getCustomers, getSuppliers } = usePartyStore();
  const { getInvoicesByParty } = useInvoiceStore();
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'in' | 'out'>('in');

  const payments = getPaymentsByBusiness(currentBusinessId || '');
  const customers = getCustomers(currentBusinessId || '');
  const suppliers = getSuppliers(currentBusinessId || '');
  const todaysCashIn = getTodaysCashIn(currentBusinessId || '') || 0;
  const todaysCashOut = getTodaysCashOut(currentBusinessId || '') || 0;

  // Console logging for debugging
  useEffect(() => {
    console.log('📊 PaymentsPage data loaded:', {
      currentBusinessId,
      paymentsCount: payments.length,
      customersCount: customers.length,
      suppliersCount: suppliers.length,
      todaysCashIn,
      todaysCashOut,
      paymentsIn: payments.filter(p => p.type === 'in').length,
      paymentsOut: payments.filter(p => p.type === 'out').length
    });
  }, [currentBusinessId, payments, customers, suppliers, todaysCashIn, todaysCashOut]);

  const [formData, setFormData] = useState<{
    partyId: string;
    invoiceId: string;
    amount: number;
    date: string;
    reference: string;
    notes: string;
    paymentMethods: { method: 'cash' | 'bank_transfer' | 'card'; amount: number }[];
  }>({
    partyId: '',
    invoiceId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
    paymentMethods: [{ method: 'cash', amount: 0 }],
  });

  // Get available invoices for selected party (unpaid or partial)
  const availableInvoices = formData.partyId ? getInvoicesByParty(formData.partyId).filter((invoice: Invoice) =>
    invoice.type === (paymentType === 'in' ? 'sale' : 'purchase') &&
    (invoice.paymentStatus === 'unpaid' || invoice.paymentStatus === 'partial')
  ) : [];

  const paymentsIn = payments.filter((p) => p.type === 'in');
  const paymentsOut = payments.filter((p) => p.type === 'out');

  useEffect(() => {
    if (location.state?.selectedParty) {
      setFormData((prev) => ({ ...prev, partyId: location.state.selectedParty.id }));
      if (location.state.type) {
        setPaymentType(location.state.type);
      }
      setIsDialogOpen(true);
    }
  }, [location.state]);

  const resetForm = () => {
    setFormData({
      partyId: '',
      invoiceId: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
      paymentMethods: [{ method: 'cash', amount: 0 }],
    });
  };

  const addPaymentMethod = () => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: [...prev.paymentMethods, { method: 'cash', amount: 0 }]
    }));
  };

  const removePaymentMethod = (index: number) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((_, i) => i !== index)
    }));
  };

  const updatePaymentMethod = (index: number, field: 'method' | 'amount', value: string | number) => {
    setFormData(prev => {
      const newMethods = [...prev.paymentMethods];
      newMethods[index] = { ...newMethods[index], [field]: value };
      const totalAmount = newMethods.reduce((sum, pm) => sum + (typeof pm.amount === 'number' ? pm.amount : 0), 0);
      return {
        ...prev,
        paymentMethods: newMethods,
        amount: totalAmount
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 Payment form submission started', { formData, currentBusinessId });
    
    if (!formData.partyId || !formData.amount || !currentBusinessId) {
      console.error('❌ Validation failed:', { 
        hasPartyId: !!formData.partyId, 
        hasAmount: !!formData.amount, 
        hasBusinessId: !!currentBusinessId 
      });
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Validate that payment methods sum to total amount
    const methodsTotal = formData.paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
    if (Math.abs(methodsTotal - formData.amount) > 0.01) {
      console.error('❌ Payment method validation failed:', { 
        methodsTotal, 
        totalAmount: formData.amount,
        difference: Math.abs(methodsTotal - formData.amount)
      });
      toast({
        title: 'Error',
        description: 'Payment method amounts must sum to the total amount.',
        variant: 'destructive',
      });
      return;
    }

    const parties = paymentType === 'in' ? customers : suppliers;
    const party = parties.find((p) => p.id === formData.partyId);
    
    if (!party) {
      console.error('❌ Party not found:', { partyId: formData.partyId, paymentType });
      toast({
        title: 'Error',
        description: `Selected ${paymentType === 'in' ? 'customer' : 'supplier'} not found.`,
        variant: 'destructive',
      });
      return;
    }

    console.log('📝 Creating payment records...', { 
      paymentCount: formData.paymentMethods.length,
      totalAmount: formData.amount 
    });

    // Create separate payment records for each payment method
    let successCount = 0;
    formData.paymentMethods.forEach((paymentMethod, index) => {
      if (paymentMethod.amount > 0) {
        try {
          console.log(`💳 Processing payment method ${index + 1}:`, paymentMethod);
          
          addPayment({
            businessId: currentBusinessId,
            type: paymentType,
            partyId: formData.partyId,
            partyName: party.name,
            amount: paymentMethod.amount,
            date: new Date(formData.date),
            reference: formData.reference,
            notes: formData.notes,
            paymentMethod: paymentMethod.method,
            invoiceId: formData.invoiceId || undefined,
          });
          
          successCount++;
          console.log(`✅ Payment method ${index + 1} processed successfully`);
        } catch (error) {
          console.error(`❌ Error processing payment method ${index + 1}:`, error);
        }
      }
    });

    if (successCount === 0) {
      console.error('❌ No payment methods were processed successfully');
      toast({
        title: 'Error',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    console.log(`✅ Payment completed successfully. ${successCount} payment methods processed.`);

    toast({
      title: 'Payment Added',
      description: `Payment ${paymentType === 'in' ? 'received' : 'made'} of ${formatCurrency(formData.amount)}.`,
    });

    resetForm();
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    console.log('🗑️ Deleting payment:', { paymentId: id });
    
    try {
      deletePayment(id);
      console.log('✅ Payment deleted successfully:', { paymentId: id });
      
      toast({
        title: 'Payment Deleted',
        description: 'Payment has been removed.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('❌ Error deleting payment:', { paymentId: id, error });
      toast({
        title: 'Error',
        description: 'Failed to delete payment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredPaymentsIn = paymentsIn.filter(
    (p) =>
      p.partyName.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPaymentsOut = paymentsOut.filter(
    (p) =>
      p.partyName.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase())
  );

  const totalCashIn = paymentsIn.reduce((sum, p) => sum + p.amount, 0);
  const totalCashOut = paymentsOut.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="text-muted-foreground">Cash payments in & out</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={paymentType === 'in' ? 'default' : 'outline'}
                  onClick={() => { setPaymentType('in'); setFormData({ ...formData, partyId: '' }); }}
                  className="flex-1"
                >
                  <ArrowDownLeft className="h-4 w-4 mr-2" />
                  Payment In
                </Button>
                <Button
                  type="button"
                  variant={paymentType === 'out' ? 'default' : 'outline'}
                  onClick={() => { setPaymentType('out'); setFormData({ ...formData, partyId: '' }); }}
                  className="flex-1"
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Payment Out
                </Button>
              </div>

              <div className="space-y-2">
                <Label>{paymentType === 'in' ? 'Customer' : 'Supplier'} *</Label>
                <Select
                  value={formData.partyId}
                  onValueChange={(value) => setFormData({ ...formData, partyId: value, invoiceId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${paymentType === 'in' ? 'customer' : 'supplier'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(paymentType === 'in' ? customers : suppliers).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.partyId && availableInvoices.length > 0 && (
                <div className="space-y-2">
                  <Label>Link to Invoice (Optional)</Label>
                  <Select
                    value={formData.invoiceId}
                    onValueChange={(value) => setFormData({ ...formData, invoiceId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice to link payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No invoice (General payment)</SelectItem>
                      {availableInvoices.map((invoice: Invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNo} - {formatCurrency(invoice.grandTotal - invoice.amountPaid)} pending
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reference</Label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Payment reference"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Payment Methods *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPaymentMethod}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Method
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.paymentMethods.map((pm, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select
                          value={pm.method}
                          onValueChange={(value) => updatePaymentMethod(index, 'method', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={pm.amount}
                          onChange={(e) => updatePaymentMethod(index, 'amount', Number(e.target.value))}
                          placeholder="0"
                          min={0}
                          step={0.01}
                        />
                      </div>
                      {formData.paymentMethods.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removePaymentMethod(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: {formatCurrency(formData.amount)}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Payment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardContent className="p-4">
            <p className="stat-label">Today's Cash In</p>
            <p className="stat-value text-success">{formatCurrency(todaysCashIn)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4">
            <p className="stat-label">Today's Cash Out</p>
            <p className="stat-value text-destructive">{formatCurrency(todaysCashOut)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4">
            <p className="stat-label">Total Received</p>
            <p className="stat-value text-success">{formatCurrency(totalCashIn)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4">
            <p className="stat-label">Total Paid</p>
            <p className="stat-value text-destructive">{formatCurrency(totalCashOut)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="in">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="in">
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            Payment In ({filteredPaymentsIn.length})
          </TabsTrigger>
          <TabsTrigger value="out">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Payment Out ({filteredPaymentsOut.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in" className="mt-6">
          {filteredPaymentsIn.length === 0 ? (
            <Card className="p-8 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No payments received</h3>
              <p className="text-muted-foreground mb-4">Record customer payments here</p>
              <Button onClick={() => { setPaymentType('in'); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment In
              </Button>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPaymentsIn.map((payment) => (
                      <TableRow key={payment.id} className="table-row">
                        <TableCell className="font-medium">{payment.partyName}</TableCell>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="text-muted-foreground">{payment.reference || '-'}</TableCell>
                        <TableCell className="text-right font-semibold text-success">
                          +{formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(payment.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="out" className="mt-6">
          {filteredPaymentsOut.length === 0 ? (
            <Card className="p-8 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No payments made</h3>
              <p className="text-muted-foreground mb-4">Record supplier payments here</p>
              <Button onClick={() => { setPaymentType('out'); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Out
              </Button>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPaymentsOut.map((payment) => (
                      <TableRow key={payment.id} className="table-row">
                        <TableCell className="font-medium">{payment.partyName}</TableCell>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="text-muted-foreground">{payment.reference || '-'}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          -{formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(payment.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
