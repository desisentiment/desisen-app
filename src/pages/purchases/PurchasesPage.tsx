import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { usePartyStore } from '@/store/usePartyStore';
import { useItemStore } from '@/store/useItemStore';
import { formatDate, getPaymentStatusColor, generateId, isInvoiceOverdue, getOverdueStatusColor } from '@/utils/helpers';
import { shareInvoiceToWhatsApp } from '@/utils/whatsappShare';
import { useFormatCurrency } from '@/hooks/use-business';
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Eye,
  Trash2,
  X,
  Truck,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { PieChart, Pie } from 'recharts';
import { Invoice, InvoiceLineItem } from '@/types';

export default function PurchasesPage() {
  const location = useLocation();
  const { currentBusinessId } = useBusinessStore();
  const { getInvoicesByType, addInvoice, deleteInvoice, getNextInvoiceNo, getInvoiceById } = useInvoiceStore();
  const { getSuppliers } = usePartyStore();
  const { getItemsByBusiness, adjustStock } = useItemStore();
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'dueDate'>('date');

  const purchases = getInvoicesByType(currentBusinessId || '', 'purchase');
  const suppliers = getSuppliers(currentBusinessId || '');
  const items = getItemsByBusiness(currentBusinessId || '');

  const [formData, setFormData] = useState({
    partyId: '',
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    lineItems: [] as InvoiceLineItem[],
    discount: "",
    otherCharges: "",
    paymentAmount: "",
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'card',
    notes: '',
    terms: '',
  });

  const [selectedItem, setSelectedItem] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState("");
  const [itemDiscount, setItemDiscount] = useState("");
  const [itemDiscountType, setItemDiscountType] = useState<'flat' | 'percent'>('flat');

  useEffect(() => {
    if (location.state?.selectedParty) {
      setFormData((prev) => ({ ...prev, partyId: location.state.selectedParty.id }));
      setIsDialogOpen(true);
    }
  }, [location.state]);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        const menus = document.querySelectorAll('.absolute.right-0.top-8') as NodeListOf<HTMLElement>;
        menus.forEach(menu => {
          menu.style.display = 'none';
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const resetForm = () => {
    setFormData({
      partyId: '',
      invoiceNo: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      lineItems: [],
      discount: "",
      otherCharges: "",
      paymentAmount: "",
      paymentMethod: 'cash',
      notes: '',
      terms: '',
    });
    setSelectedItem('');
    setItemQty(1);
    setItemPrice("");
    setItemDiscount("");
    setItemDiscountType('flat');
  };

  const handleDialogOpen = (open: boolean) => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        invoiceNo: getNextInvoiceNo(currentBusinessId || '', 'purchase'),
      }));
    } else {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const addLineItem = () => {
    const item = items.find((i) => i.id === selectedItem);
    if (!item) return;

    const baseAmount = itemQty * (Number(itemPrice) || item.purchasePrice);
    let discountAmount = 0;

    if (itemDiscountType === 'flat') {
      discountAmount = Number(itemDiscount);
    } else {
      discountAmount = baseAmount * (Number(itemDiscount) / 100);
    }

    const total = Math.max(0, baseAmount - discountAmount); // Ensure total doesn't go negative

    const lineItem: InvoiceLineItem = {
      id: generateId(),
      itemId: item.id,
      itemName: item.name,
      quantity: itemQty,
      price: Number(itemPrice) || item.purchasePrice,
      discount: Number(itemDiscount),
      discountType: itemDiscountType,
      total,
    };

    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, lineItem],
    }));

    setSelectedItem('');
    setItemQty(1);
    setItemPrice("");
    setItemDiscount("");
    setItemDiscountType('flat');
  };

  const removeLineItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((li) => li.id !== id),
    }));
  };

  const subtotal = formData.lineItems.reduce((sum, li) => sum + li.total, 0);
  const grandTotal = subtotal - (Number(formData.discount) || 0) + (Number(formData.otherCharges) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyId || formData.lineItems.length === 0 || !currentBusinessId) {
      toast({
        title: 'Error',
        description: 'Please select a supplier and add at least one item.',
        variant: 'destructive',
      });
      return;
    }

    const party = suppliers.find((c) => c.id === formData.partyId);

    // Determine payment status based on payment amount
    let paymentStatus: 'paid' | 'unpaid' | 'partial';
    let amountPaid: number;

    if (Number(formData.paymentAmount) === 0) {
      paymentStatus = 'unpaid';
      amountPaid = 0;
    } else if (Number(formData.paymentAmount) >= grandTotal) {
      paymentStatus = 'paid';
      amountPaid = grandTotal;
    } else {
      paymentStatus = 'partial';
      amountPaid = Number(formData.paymentAmount);
    }

    addInvoice({
      businessId: currentBusinessId,
      invoiceNo: formData.invoiceNo,
      type: 'purchase',
      partyId: formData.partyId,
      partyName: party?.name || '',
      date: new Date(formData.date),
      dueDate: new Date(formData.dueDate),
      lineItems: formData.lineItems,
      subtotal,
      discount: Number(formData.discount) || 0,
      otherCharges: Number(formData.otherCharges) || 0,
      grandTotal,
      paymentStatus,
      paymentMethod: formData.paymentMethod,
      amountPaid,
      notes: formData.notes,
      terms: formData.terms,
    });

    // Adjust stock for each item (add stock for purchase)
    formData.lineItems.forEach((li) => {
      if (li.itemId) adjustStock(li.itemId, li.quantity || 0, 'add');
    });

    toast({
      title: 'Purchase Created',
      description: `Invoice ${formData.invoiceNo} has been created successfully.`,
    });

    handleDialogOpen(false);
  };

  const handleDelete = (id: string, invoiceNo: string) => {
    const invoice = getInvoiceById(id);
    if (invoice) {
      // Remove stock for each item (reverse of purchase)
      invoice.lineItems.forEach((li) => {
        if (li.itemId) adjustStock(li.itemId, li.quantity || 0, 'subtract');
      });
    }
    deleteInvoice(id);
    toast({
      title: 'Invoice Deleted',
      description: `Invoice ${invoiceNo} has been deleted.`,
      variant: 'destructive',
    });
  };

  const filteredPurchases = purchases
    .filter((inv) => {
      const matchesSearch =
        inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        (inv.partyName?.toLowerCase()?.includes(search.toLowerCase()) ?? false);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && inv.paymentStatus === 'paid') ||
        (statusFilter === 'unpaid' && inv.paymentStatus !== 'paid') ||
        (statusFilter === 'overdue' && inv.dueDate && isInvoiceOverdue(inv.dueDate) && inv.paymentStatus !== 'paid');

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime(); // Default: newest first
    });

  const totalPurchases = purchases.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const paidPurchases = purchases.filter((inv) => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + inv.grandTotal, 0);
  const unpaidPurchases = totalPurchases - paidPurchases;

  const supplierTotals = suppliers.map(supplier => {
    const total = purchases.filter(p => p.partyId === supplier.id).reduce((sum, p) => sum + p.grandTotal, 0);
    return { name: supplier.name, value: total };
  }).filter(s => s.value > 0);

  const chartConfig = supplierTotals.reduce((config, item) => {
    config[item.name] = {
      label: item.name,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
    };
    return config;
  }, {} as ChartConfig);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="text-muted-foreground">{purchases.length} invoices • Total: {formatCurrency(totalPurchases)}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hover:bg-primary/90 active:bg-primary/80 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              New Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-[98vw] sm:w-[95vw] md:w-[90vw] lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Create Purchase Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="party" className="text-sm md:text-base">Supplier *</Label>
                  <Select
                    value={formData.partyId}
                    onValueChange={(value) => setFormData({ ...formData, partyId: value })}
                  >
                    <SelectTrigger className="h-10 md:h-11">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNo" className="text-sm md:text-base">Invoice No</Label>
                  <Input
                    id="invoiceNo"
                    value={formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                    className="h-10 md:h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm md:text-base">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const invoiceDate = new Date(newDate);
                      const defaultDueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                      setFormData({
                        ...formData,
                        date: newDate,
                        dueDate: defaultDueDate.toISOString().split('T')[0]
                      });
                    }}
                    className="h-10 md:h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm md:text-base">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="h-10 md:h-11"
                  />
                </div>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Select value={selectedItem} onValueChange={(value) => {
                      setSelectedItem(value);
                      const item = items.find((i) => i.id === value);
                      if (item) setItemPrice(item.purchasePrice.toString());
                    }}>
                      <SelectTrigger className="w-full h-10 md:h-11">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        className="h-10 md:h-11"
                        value={itemQty}
                        onChange={(e) => setItemQty(Number(e.target.value))}
                        min={1}
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        className="h-10 md:h-11"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value || "")}
                      />
                      <Input
                        type="number"
                        placeholder="Item Discount"
                        className="h-10 md:h-11"
                        value={itemDiscount}
                        onChange={(e) => setItemDiscount(e.target.value || "")}
                        min={0}
                        title="Discount for this specific item"
                      />
                      <Select value={itemDiscountType} onValueChange={(value: 'flat' | 'percent') => setItemDiscountType(value)}>
                        <SelectTrigger className="h-10 md:h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">₹</SelectItem>
                          <SelectItem value="percent">%</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={addLineItem} disabled={!selectedItem} className="h-10 md:h-11 px-3 hover:bg-primary/90 active:bg-primary/80 transition-colors">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {formData.lineItems.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Item</TableHead>
                            <TableHead className="text-right min-w-[60px]">Qty</TableHead>
                            <TableHead className="text-right min-w-[80px]">Price</TableHead>
                            <TableHead className="text-right min-w-[80px] hidden sm:table-cell">Discount</TableHead>
                            <TableHead className="text-right min-w-[80px]">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.lineItems.map((li) => (
                            <TableRow key={li.id}>
                              <TableCell className="font-medium">{li.itemName}</TableCell>
                              <TableCell className="text-right">{li.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(li.price)}</TableCell>
                              <TableCell className="text-right hidden sm:table-cell">
                                {li.discount > 0 ? (
                                  <>
                                    {formatCurrency(li.discount)}
                                    {li.discountType === 'percent' ? '%' : ''}
                                  </>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(li.total)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-destructive/10 active:bg-destructive/20 transition-colors"
                                  onClick={() => removeLineItem(li.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm md:text-base">Overall Discount (₹)</Label>
                      <Input
                        type="number"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData({ ...formData, discount: e.target.value || "" })
                        }
                        className="h-10 md:h-11"
                        title="Discount applied to the entire invoice subtotal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm md:text-base">Other Charges</Label>
                      <Input
                        type="number"
                        value={formData.otherCharges}
                        onChange={(e) =>
                          setFormData({ ...formData, otherCharges: e.target.value || "" })
                        }
                        className="h-10 md:h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentAmount" className="text-sm md:text-base">Payment Amount</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      value={formData.paymentAmount}
                      onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value || "" })}
                      placeholder="Enter payment amount"
                      min={0}
                      step={0.01}
                      className="h-10 md:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm md:text-base">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as 'cash' | 'bank_transfer' | 'card' })}
                    >
                      <SelectTrigger className="h-10 md:h-11">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Discount</span>
                      <span>-{formatCurrency(Number(formData.discount) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Other Charges</span>
                      <span>+{formatCurrency(Number(formData.otherCharges) || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Grand Total</span>
                      <span className="text-primary">{formatCurrency(grandTotal)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-2">
                <Label htmlFor="terms" className="text-sm md:text-base">Terms and Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Enter terms and conditions..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 hover:bg-accent/80 active:bg-accent transition-colors"
                  onClick={() => handleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 hover:bg-primary/90 active:bg-primary/80 transition-colors">
                  Create Purchase
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-[98vw] sm:w-[95vw] md:w-[90vw] lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Purchase Invoice {viewingInvoice?.invoiceNo}</DialogTitle>
            </DialogHeader>
            {viewingInvoice && (
              <div className="space-y-6 mt-4">
                {/* Invoice Header */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Supplier</Label>
                    <p className="text-sm md:text-base">{viewingInvoice.partyName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Invoice No</Label>
                    <p className="text-sm md:text-base">{viewingInvoice.invoiceNo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Date</Label>
                    <p className="text-sm md:text-base">{formatDate(viewingInvoice.date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Due Date</Label>
                    <p className="text-sm md:text-base">{viewingInvoice.dueDate ? formatDate(viewingInvoice.dueDate) : 'N/A'}</p>
                  </div>
                </div>

                {/* Items Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Item</TableHead>
                            <TableHead className="text-right min-w-[60px]">Qty</TableHead>
                            <TableHead className="text-right min-w-[80px]">Price</TableHead>
                            <TableHead className="text-right min-w-[80px] hidden sm:table-cell">Discount</TableHead>
                            <TableHead className="text-right min-w-[80px]">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewingInvoice.lineItems.map((li) => (
                            <TableRow key={li.id}>
                              <TableCell className="font-medium">{li.itemName}</TableCell>
                              <TableCell className="text-right">{li.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(li.price)}</TableCell>
                              <TableCell className="text-right hidden sm:table-cell">
                                {li.discount > 0 ? (
                                  <>
                                    {formatCurrency(li.discount)}
                                    {li.discountType === 'percent' ? '%' : ''}
                                  </>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(li.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Payment Status:</span>
                      <Badge className={getPaymentStatusColor(viewingInvoice.paymentStatus)}>
                        {viewingInvoice.paymentStatus}
                      </Badge>
                    </div>
                    {viewingInvoice.notes && (
                      <div>
                        <Label className="text-sm font-semibold">Notes</Label>
                        <p className="text-sm">{viewingInvoice.notes}</p>
                      </div>
                    )}
                    {viewingInvoice.terms && (
                      <div>
                        <Label className="text-sm font-semibold">Terms and Conditions</Label>
                        <p className="text-sm whitespace-pre-wrap">{viewingInvoice.terms}</p>
                      </div>
                    )}
                  </div>

                  <Card className="bg-muted/50">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatCurrency(viewingInvoice.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Discount</span>
                        <span>-{formatCurrency(viewingInvoice.discount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Other Charges</span>
                        <span>+{formatCurrency(viewingInvoice.otherCharges)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Grand Total</span>
                        <span className="text-primary">{formatCurrency(viewingInvoice.grandTotal)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 min-w-[100px] hover:bg-accent/80 active:bg-accent transition-colors"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700 text-white border-green-600"
                    onClick={() => {
                      if (viewingInvoice) {
                        const supplier = suppliers.find(s => s.id === viewingInvoice.partyId);
                        shareInvoiceToWhatsApp({
                          invoice: viewingInvoice,
                          businessName: undefined,
                          formatCurrency,
                          formatDate,
                          phoneNumber: supplier?.phone || undefined,
                        });
                        toast({
                          title: 'WhatsApp کھل رہا ہے',
                          description: 'انوائس شیئر کرنے کے لیے WhatsApp کھل رہا ہے۔',
                        });
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 min-w-[100px] hover:bg-primary/90 active:bg-primary/80 transition-colors"
                    onClick={() => window.print()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="metric-card">
          <CardContent className="p-3 md:p-4">
            <p className="stat-label text-xs md:text-sm">Total Purchases</p>
            <p className="stat-value text-base md:text-lg">{formatCurrency(totalPurchases)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-3 md:p-4">
            <p className="stat-label text-xs md:text-sm">Paid</p>
            <p className="stat-value text-success text-base md:text-lg">{formatCurrency(paidPurchases)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-3 md:p-4">
            <p className="stat-label text-xs md:text-sm">Payable</p>
            <p className="stat-value text-destructive text-base md:text-lg">{formatCurrency(unpaidPurchases)}</p>
          </CardContent>
        </Card>
      </div>

      {supplierTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Purchases by Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="h-[300px]"
            >
              <PieChart>
                <Pie
                  data={supplierTotals}
                  cx="50%"
                  cy="50%"
                  outerRadius="60%"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(value: 'all' | 'paid' | 'unpaid' | 'overdue') => setStatusFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: 'date' | 'dueDate') => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="dueDate">Sort by Due Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredPurchases.length === 0 ? (
        <Card className="p-8 text-center">
          <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No purchases yet</h3>
          <p className="text-muted-foreground mb-4">Create your first purchase invoice</p>
          <Button onClick={() => handleDialogOpen(true)} className="hover:bg-primary/90 active:bg-primary/80 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            New Purchase
          </Button>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {filteredPurchases.map((invoice) => (
              <Card key={invoice.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{invoice.invoiceNo}</h3>
                    <p className="text-sm text-muted-foreground">{invoice.partyName}</p>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const menu = e.currentTarget.nextElementSibling as HTMLElement;
                        if (menu) {
                          menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                        }
                      }}
                      className="h-8 w-8 hover:bg-accent/80 active:bg-accent transition-colors rounded-md flex items-center justify-center"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <div className="absolute right-0 top-8 bg-popover border rounded-md shadow-md p-1 min-w-[8rem] hidden z-50">
                      <button
                        type="button"
                        onClick={() => {
                          console.log('View button clicked');
                          setViewingInvoice(invoice);
                          setIsViewDialogOpen(true);
                          // Hide menu
                          const menu = document.querySelector('.absolute.right-0.top-8') as HTMLElement;
                          if (menu) menu.style.display = 'none';
                        }}
                        className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/80 rounded transition-colors w-full text-left"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Print button clicked');
                          setViewingInvoice(invoice);
                          setTimeout(() => window.print(), 100);
                          // Hide menu
                          const menu = document.querySelector('.absolute.right-0.top-8') as HTMLElement;
                          if (menu) menu.style.display = 'none';
                        }}
                        className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/80 rounded transition-colors w-full text-left"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Print
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Delete button clicked');
                          handleDelete(invoice.id, invoice.invoiceNo);
                          // Hide menu
                          const menu = document.querySelector('.absolute.right-0.top-8') as HTMLElement;
                          if (menu) menu.style.display = 'none';
                        }}
                        className="flex items-center px-2 py-1.5 text-sm text-destructive cursor-pointer hover:bg-destructive/10 rounded transition-colors w-full text-left"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {formatDate(invoice.date)} • Due: <span className={invoice.dueDate && isInvoiceOverdue(invoice.dueDate) && invoice.paymentStatus !== 'paid' ? 'text-destructive font-medium' : ''}>{invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">{formatCurrency(invoice.grandTotal)}</div>
                    <Badge className={getOverdueStatusColor(invoice.dueDate || new Date(), invoice.paymentStatus)} variant="secondary">
                      {invoice.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((invoice) => (
                    <TableRow key={invoice.id} className="table-row">
                      <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                      <TableCell>{invoice.partyName}</TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>
                        <span className={invoice.dueDate && isInvoiceOverdue(invoice.dueDate) && invoice.paymentStatus !== 'paid' ? 'text-destructive font-medium' : ''}>
                          {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(invoice.grandTotal)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getOverdueStatusColor(invoice.dueDate || new Date(), invoice.paymentStatus)}>
                          {invoice.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const menu = e.currentTarget.nextElementSibling as HTMLElement;
                              if (menu) {
                                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                              }
                            }}
                            className="h-8 w-8 hover:bg-accent/80 active:bg-accent transition-colors rounded-md flex items-center justify-center"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-8 bg-popover border rounded-md shadow-md p-1 min-w-[8rem] hidden z-50">
                            <button
                              type="button"
                              onClick={() => {
                                console.log('View button clicked');
                                setViewingInvoice(invoice);
                                setIsViewDialogOpen(true);
                                // Hide menu
                                const menus = document.querySelectorAll('.absolute.right-0.top-8') as NodeListOf<HTMLElement>;
                                menus.forEach(menu => menu.style.display = 'none');
                              }}
                              className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/80 rounded transition-colors w-full text-left"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                console.log('Print button clicked');
                                setViewingInvoice(invoice);
                                setTimeout(() => window.print(), 100);
                                // Hide menu
                                const menus = document.querySelectorAll('.absolute.right-0.top-8') as NodeListOf<HTMLElement>;
                                menus.forEach(menu => menu.style.display = 'none');
                              }}
                              className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent/80 rounded transition-colors w-full text-left"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Print
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                console.log('Delete button clicked');
                                handleDelete(invoice.id, invoice.invoiceNo);
                                // Hide menu
                                const menus = document.querySelectorAll('.absolute.right-0.top-8') as NodeListOf<HTMLElement>;
                                menus.forEach(menu => menu.style.display = 'none');
                              }}
                              className="flex items-center px-2 py-1.5 text-sm text-destructive cursor-pointer hover:bg-destructive/10 rounded transition-colors w-full text-left"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
