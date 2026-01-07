import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { usePartyStore } from '@/store/usePartyStore';
import { useItemStore } from '@/store/useItemStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDate, generateId } from '@/utils/helpers';
import { useFormatCurrency } from '@/hooks/use-business';
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Eye,
  Trash2,
  X,
  RotateCcw,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Invoice, InvoiceLineItem } from '@/types';

export default function ReturnsPage() {
  const location = useLocation();
  const { currentBusinessId } = useBusinessStore();
  const effectiveBusinessId = currentBusinessId || 'default-business-id';
  const { getInvoicesByType, addInvoice, deleteInvoice, getNextInvoiceNo, getInvoiceById } = useInvoiceStore();
  const { getCustomers, getSuppliers } = usePartyStore();
  const { getItemsByBusiness, adjustStock } = useItemStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const formatCurrency = useFormatCurrency();

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [returnType, setReturnType] = useState<'sale-return' | 'purchase-return'>('sale-return');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const saleReturns = getInvoicesByType(effectiveBusinessId, 'sale-return');
  const purchaseReturns = getInvoicesByType(effectiveBusinessId, 'purchase-return');
  const customers = getCustomers(effectiveBusinessId);
  const suppliers = getSuppliers(effectiveBusinessId);
  const items = getItemsByBusiness(effectiveBusinessId);
  const originalSales = getInvoicesByType(effectiveBusinessId, 'sale');
  const originalPurchases = getInvoicesByType(effectiveBusinessId, 'purchase');

  const [formData, setFormData] = useState({
    originalInvoiceId: '',
    partyId: '',
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    lineItems: [] as InvoiceLineItem[],
    discount: "",
    otherCharges: "",
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'card',
    notes: '',
  });

  const [selectedItem, setSelectedItem] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState("");

  useEffect(() => {
    if (location.state?.selectedParty) {
      setFormData((prev) => ({ ...prev, partyId: location.state.selectedParty.id }));
      setIsDialogOpen(true);
    }
  }, [location.state]);

  const resetForm = () => {
    setFormData({
      originalInvoiceId: '',
      partyId: '',
      invoiceNo: '',
      date: new Date().toISOString().split('T')[0],
      lineItems: [],
      discount: "",
      otherCharges: "",
      paymentMethod: 'cash',
      notes: '',
    });
    setSelectedItem('');
    setItemQty(1);
    setItemPrice("");
  };

  const handleDialogOpen = (open: boolean) => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        invoiceNo: getNextInvoiceNo(currentBusinessId || '', returnType),
      }));
    } else {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const handleOriginalInvoiceChange = (invoiceId: string) => {
    const originalInvoices = returnType === 'sale-return' ? originalSales : originalPurchases;
    const originalInvoice = originalInvoices.find(inv => inv.id === invoiceId);

    if (originalInvoice) {
      setFormData(prev => ({
        ...prev,
        originalInvoiceId: invoiceId,
        partyId: originalInvoice.partyId || '',
        lineItems: originalInvoice.lineItems.map(item => ({
          ...item,
          quantity: 0, // Start with 0, user can adjust
        })),
      }));
    }
  };

  const addLineItem = () => {
    const item = items.find((i) => i.id === selectedItem);
    if (!item) return;

    const lineItem: InvoiceLineItem = {
      id: generateId(),
      itemId: item.id,
      itemName: item.name,
      quantity: itemQty,
      price: Number(itemPrice) || (returnType === 'sale-return' ? item.salePrice : item.purchasePrice),
      discount: 0,
      discountType: 'flat',
      total: itemQty * (Number(itemPrice) || (returnType === 'sale-return' ? item.salePrice : item.purchasePrice)),
    };

    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, lineItem],
    }));

    setSelectedItem('');
    setItemQty(1);
    setItemPrice("");
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
        description: 'Please select an original invoice and add at least one item to return.',
        variant: 'destructive',
      });
      return;
    }

    const parties = returnType === 'sale-return' ? customers : suppliers;
    const party = parties.find((p) => p.id === formData.partyId);

    addInvoice({
      businessId: effectiveBusinessId,
      invoiceNo: formData.invoiceNo,
      type: returnType,
      partyId: formData.partyId,
      partyName: party?.name || '',
      date: new Date(formData.date),
      dueDate: new Date(formData.date), // Returns typically have same due date as transaction date
      lineItems: formData.lineItems,
      subtotal,
      discount: Number(formData.discount) || 0,
      otherCharges: Number(formData.otherCharges) || 0,
      grandTotal,
      paymentStatus: 'paid', // Returns are typically processed immediately
      paymentMethod: formData.paymentMethod,
      amountPaid: grandTotal,
      notes: formData.notes,
      terms: '', // Returns typically don't have payment terms
      convertedFrom: formData.originalInvoiceId,
      isDeleted: false,
    });

    // Adjust stock: add back for sale returns, subtract for purchase returns
    const stockAdjustment = returnType === 'sale-return' ? 'add' : 'subtract';
    formData.lineItems.forEach((li) => {
      adjustStock(li.itemId || '', li.quantity || 0, stockAdjustment);
    });

    toast({
      title: 'Return Created',
      description: `${returnType === 'sale-return' ? 'Sale' : 'Purchase'} return ${formData.invoiceNo} has been created successfully.`,
    });

    handleDialogOpen(false);
  };

  const handleDelete = (id: string, invoiceNo: string) => {
    const invoice = getInvoiceById(id);
    if (invoice) {
      // Reverse the stock adjustment
      const stockAdjustment = invoice.type === 'sale-return' ? 'subtract' : 'add';
      invoice.lineItems.forEach((li) => {
        adjustStock(li.itemId || '', li.quantity || 0, stockAdjustment);
      });
    }
    deleteInvoice(id);
    toast({
      title: 'Return Deleted',
      description: `Return ${invoiceNo} has been deleted.`,
      variant: 'destructive',
    });
  };

  const filteredSaleReturns = saleReturns.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.partyName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPurchaseReturns = purchaseReturns.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.partyName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalSaleReturns = saleReturns.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPurchaseReturns = purchaseReturns.reduce((sum, inv) => sum + inv.grandTotal, 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Returns</h1>
          <p className="text-muted-foreground">Manage sale and purchase returns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Return
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full sm:max-w-3xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create {returnType === 'sale-return' ? 'Sale' : 'Purchase'} Return</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Return Type Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={returnType === 'sale-return' ? 'default' : 'outline'}
                  onClick={() => { setReturnType('sale-return'); resetForm(); }}
                  className="flex-1"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Sale Return
                </Button>
                <Button
                  type="button"
                  variant={returnType === 'purchase-return' ? 'default' : 'outline'}
                  onClick={() => { setReturnType('purchase-return'); resetForm(); }}
                  className="flex-1"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Purchase Return
                </Button>
              </div>

              {/* Original Invoice Selection */}
              <div className="space-y-2">
                <Label htmlFor="originalInvoice">Original Invoice *</Label>
                <Select
                  value={formData.originalInvoiceId}
                  onValueChange={handleOriginalInvoiceChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select original ${returnType === 'sale-return' ? 'sale' : 'purchase'} invoice`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(returnType === 'sale-return' ? originalSales : originalPurchases).map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoiceNo} - {inv.partyName} ({formatCurrency(inv.grandTotal)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="party">{returnType === 'sale-return' ? 'Customer' : 'Supplier'}</Label>
                  <Input
                    id="party"
                    value={returnType === 'sale-return'
                      ? customers.find(c => c.id === formData.partyId)?.name || ''
                      : suppliers.find(s => s.id === formData.partyId)?.name || ''
                    }
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNo">Return No</Label>
                  <Input
                    id="invoiceNo"
                    value={formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Return Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Items to Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-3">
                    <Select value={selectedItem} onValueChange={(value) => {
                      setSelectedItem(value);
                      const item = items.find((i) => i.id === value);
                      if (item) setItemPrice((returnType === 'sale-return' ? item.salePrice : item.purchasePrice).toString());
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select item to return" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.currentStock} in stock)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Qty"
                      className="w-20"
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      min={1}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      className="w-28"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value || "")}
                    />
                    <Button type="button" onClick={addLineItem} disabled={!selectedItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {formData.lineItems.length > 0 && (
                    <Table className="mt-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-2 sm:px-4">Item</TableHead>
                          <TableHead className="text-right px-2 sm:px-4">Qty</TableHead>
                          <TableHead className="text-right px-2 sm:px-4">Price</TableHead>
                          <TableHead className="text-right px-2 sm:px-4">Total</TableHead>
                          <TableHead className="px-2 sm:px-4"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.lineItems.map((li) => (
                          <TableRow key={li.id}>
                            <TableCell className="px-2 sm:px-4">{li.itemName}</TableCell>
                            <TableCell className="text-right px-2 sm:px-4">{li.quantity}</TableCell>
                            <TableCell className="text-right px-2 sm:px-4">{formatCurrency(li.price)}</TableCell>
                            <TableCell className="text-right font-semibold px-2 sm:px-4">
                              {formatCurrency(li.total)}
                            </TableCell>
                            <TableCell className="px-2 sm:px-4">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeLineItem(li.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Overall Discount (₹)</Label>
                      <Input
                        type="number"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData({ ...formData, discount: e.target.value || "" })
                        }
                        title="Discount applied to the entire return subtotal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Other Charges</Label>
                      <Input
                        type="number"
                        value={formData.otherCharges}
                        onChange={(e) =>
                          setFormData({ ...formData, otherCharges: e.target.value || "" })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as 'cash' | 'bank_transfer' | 'card' })}
                    >
                      <SelectTrigger>
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

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create Return
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4">
            <p className="stat-label">Sale Returns</p>
            <p className="stat-value">{saleReturns.length}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4">
            <p className="stat-label">Purchase Returns</p>
            <p className="stat-value">{purchaseReturns.length}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4">
            <p className="stat-label">Total Sale Returns</p>
            <p className="stat-value text-destructive">{formatCurrency(totalSaleReturns)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4">
            <p className="stat-label">Total Purchase Returns</p>
            <p className="stat-value text-destructive">{formatCurrency(totalPurchaseReturns)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search returns by invoice number or party..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sale-returns">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sale-returns">
            Sale Returns ({filteredSaleReturns.length})
          </TabsTrigger>
          <TabsTrigger value="purchase-returns">
            Purchase Returns ({filteredPurchaseReturns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sale-returns" className="mt-6">
          {filteredSaleReturns.length === 0 ? (
            <Card className="p-8 text-center">
              <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No sale returns yet</h3>
              <p className="text-muted-foreground mb-4">Create your first sale return</p>
              <Button onClick={() => { setReturnType('sale-return'); handleDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                New Sale Return
              </Button>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead className="px-2 sm:px-4">Return #</TableHead>
                    <TableHead className="px-2 sm:px-4">Customer</TableHead>
                    {!isMobile && <TableHead className="px-2 sm:px-4">Date</TableHead>}
                    <TableHead className="text-right px-2 sm:px-4">Amount</TableHead>
                    <TableHead className="px-2 sm:px-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSaleReturns.map((invoice) => (
                    <TableRow key={invoice.id} className="table-row">
                      <TableCell className="font-medium px-2 sm:px-4">{invoice.invoiceNo}</TableCell>
                      <TableCell className="px-2 sm:px-4">{invoice.partyName}</TableCell>
                      {!isMobile && <TableCell className="px-2 sm:px-4">{formatDate(invoice.date)}</TableCell>}
                      <TableCell className="text-right font-semibold px-2 sm:px-4">
                        {formatCurrency(invoice.grandTotal)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setViewingInvoice(invoice);
                              setIsViewDialogOpen(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setViewingInvoice(invoice);
                              setTimeout(() => window.print(), 100);
                            }}>
                              <FileText className="h-4 w-4 mr-2" />
                              Print
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(invoice.id, invoice.invoiceNo)}
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
            </Card>
          )}
        </TabsContent>

        <TabsContent value="purchase-returns" className="mt-6">
          {filteredPurchaseReturns.length === 0 ? (
            <Card className="p-8 text-center">
              <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No purchase returns yet</h3>
              <p className="text-muted-foreground mb-4">Create your first purchase return</p>
              <Button onClick={() => { setReturnType('purchase-return'); handleDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                New Purchase Return
              </Button>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead className="px-2 sm:px-4">Return #</TableHead>
                    <TableHead className="px-2 sm:px-4">Supplier</TableHead>
                    {!isMobile && <TableHead className="px-2 sm:px-4">Date</TableHead>}
                    <TableHead className="text-right px-2 sm:px-4">Amount</TableHead>
                    <TableHead className="px-2 sm:px-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchaseReturns.map((invoice) => (
                    <TableRow key={invoice.id} className="table-row">
                      <TableCell className="font-medium px-2 sm:px-4">{invoice.invoiceNo}</TableCell>
                      <TableCell className="px-2 sm:px-4">{invoice.partyName}</TableCell>
                      {!isMobile && <TableCell className="px-2 sm:px-4">{formatDate(invoice.date)}</TableCell>}
                      <TableCell className="text-right font-semibold px-2 sm:px-4">
                        {formatCurrency(invoice.grandTotal)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setViewingInvoice(invoice);
                              setIsViewDialogOpen(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setViewingInvoice(invoice);
                              setTimeout(() => window.print(), 100);
                            }}>
                              <FileText className="h-4 w-4 mr-2" />
                              Print
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(invoice.id, invoice.invoiceNo)}
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
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Return Invoice {viewingInvoice?.invoiceNo}</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-6 mt-4">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">{viewingInvoice.type === 'sale-return' ? 'Customer' : 'Supplier'}</Label>
                  <p className="text-sm">{viewingInvoice.partyName}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Return No</Label>
                  <p className="text-sm">{viewingInvoice.invoiceNo}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Date</Label>
                  <p className="text-sm">{formatDate(viewingInvoice.date)}</p>
                </div>
              </div>

              {/* Items Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Returned Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-2 sm:px-4">Item</TableHead>
                        <TableHead className="text-right px-2 sm:px-4">Qty</TableHead>
                        <TableHead className="text-right px-2 sm:px-4">Price</TableHead>
                        <TableHead className="text-right px-2 sm:px-4">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingInvoice.lineItems.map((li) => (
                        <TableRow key={li.id}>
                          <TableCell className="px-2 sm:px-4">{li.itemName}</TableCell>
                          <TableCell className="text-right px-2 sm:px-4">{li.quantity}</TableCell>
                          <TableCell className="text-right px-2 sm:px-4">{formatCurrency(li.price)}</TableCell>
                          <TableCell className="text-right font-semibold px-2 sm:px-4">
                            {formatCurrency(li.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Return Type:</span>
                    <Badge>{viewingInvoice.type === 'sale-return' ? 'Sale Return' : 'Purchase Return'}</Badge>
                  </div>
                  {viewingInvoice.notes && (
                    <div>
                      <Label className="text-sm font-semibold">Notes</Label>
                      <p className="text-sm">{viewingInvoice.notes}</p>
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

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="flex-1"
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
  );
}

