import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { useUnifiedCustomers, useUnifiedItems, usePartyDropdownData, useItemDropdownData } from '@/hooks/useUnifiedData';
import { usePaymentStore } from '@/store/usePaymentStore';
import { formatDate, getPaymentStatusColor, generateId, isInvoiceOverdue, getOverdueStatusColor } from '@/utils/helpers';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { shareInvoiceToWhatsApp } from '@/utils/whatsappShare';
import { useFormatCurrency } from '@/hooks/use-business';
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  X,
  ShoppingCart,
  Download,
  Edit,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

export default function SalesPage() {
  const location = useLocation();
  const { currentBusinessId, businesses } = useBusinessStore();
  const { getInvoicesByType, addInvoice, editInvoice, deleteInvoice, recoverInvoice, getNextInvoiceNo, getInvoiceById } = useInvoiceStore();
  const { data: unifiedCustomers = [], isLoading: isLoadingCustomers } = useUnifiedCustomers(currentBusinessId || '');
  const { data: unifiedItems = [], isLoading: isLoadingItems } = useUnifiedItems(currentBusinessId || '');
  const { customerOptions } = usePartyDropdownData(currentBusinessId || '');
  const { itemOptions } = useItemDropdownData(currentBusinessId || '');
  const { getPaymentsByBusiness } = usePaymentStore();
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();

  // Mock adjustStock function (temporary fix)
  const adjustStock = (itemId: string, quantity: number, operation: 'add' | 'subtract') => {
    console.log(`📦 Stock ${operation}:`, { itemId, quantity });
    // This will be replaced with proper stock management later
  };

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'dueDate'>('date');

  const sales = getInvoicesByType(currentBusinessId || '', 'sale', showDeleted);
  const business = businesses.find(b => b.id === currentBusinessId);

  // Console logging for debugging
  useEffect(() => {
    console.log('🔍 SalesPage data loaded:', {
      currentBusinessId,
      customersCount: unifiedCustomers.length,
      customers: unifiedCustomers.map((c: any) => ({ id: c.id, name: c.name, type: c.type })),
      itemsCount: unifiedItems.length,
      salesCount: sales.length,
      isLoadingCustomers,
      isLoadingItems,
      customerOptions: customerOptions.length,
      itemOptions: itemOptions.length
    });
  }, [currentBusinessId, unifiedCustomers, unifiedItems, sales.length, isLoadingCustomers, isLoadingItems, customerOptions.length, itemOptions.length]);

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
    if (open && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        invoiceNo: getNextInvoiceNo(currentBusinessId || '', 'sale'),
      }));
    } else if (!open) {
      resetForm();
      setIsEditMode(false);
    }
    setIsDialogOpen(open);
  };

  const handleEdit = (invoice: Invoice) => {
    setFormData({
      partyId: invoice.partyId || '',
      invoiceNo: invoice.invoiceNo,
      date: invoice.date?.toISOString().split('T')[0] || '',
      dueDate: invoice.dueDate?.toISOString().split('T')[0] || '',
      lineItems: invoice.lineItems,
      discount: invoice.discount.toString(),
      otherCharges: invoice.otherCharges.toString(),
      paymentAmount: invoice.amountPaid.toString(),
      paymentMethod: invoice.paymentMethod,
      notes: invoice.notes,
      terms: invoice.terms,
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
    setIsViewDialogOpen(false);
  };

  const addLineItem = () => {
    const item = unifiedItems.find((i) => i.id === selectedItem);
    if (!item) return;

    if (itemQty > (Number(item.currentStock) || 0)) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${Number(item.currentStock) || 0} units available for ${item.name}.`,
        variant: 'destructive',
      });
      return;
    }

    const baseAmount = itemQty * (Number(itemPrice) || item.salePrice);
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
      price: Number(itemPrice) || item.salePrice,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Form data being submitted:', formData);
    console.log('Current business ID:', currentBusinessId);

    try {
      if (!formData.partyId || formData.lineItems.length === 0 || !currentBusinessId) {
        toast({
          title: 'Validation Error',
          description: 'Please select a customer and add at least one item.',
          variant: 'destructive',
        });
        return;
      }

    const party = unifiedCustomers.find((c) => c.id === formData.partyId);

    if (isEditMode && viewingInvoice) {
      // Handle edit mode
      const existingInvoice = viewingInvoice;

      // Calculate stock adjustments
      const oldQuantities = existingInvoice.lineItems.reduce((acc, li) => {
        const itemId = li.itemId;
        if (itemId) {
          acc[itemId] = (acc[itemId] || 0) + li.quantity;
        }
        return acc;
      }, {} as Record<string, number>);

      const newQuantities = formData.lineItems.reduce((acc, li) => {
        const itemId = li.itemId;
        if (itemId) {
          acc[itemId] = (acc[itemId] || 0) + li.quantity;
        }
        return acc;
      }, {} as Record<string, number>);

      // Validate stock availability for new quantities
      const stockErrors: string[] = [];
      Object.entries(newQuantities).forEach(([itemId, totalQty]) => {
        const item = unifiedItems.find(i => i.id === itemId);
        const oldQty = oldQuantities[itemId] || 0;
        const adjustedStock = item ? (Number(item.currentStock) || 0) + oldQty : 0; // Add back old quantity to check availability
        if (item && totalQty > adjustedStock) {
          stockErrors.push(`${item.name}: requested ${totalQty}, available ${adjustedStock}`);
        }
      });

      if (stockErrors.length > 0) {
        toast({
          title: 'Insufficient Stock',
          description: `Cannot update sale:\n${stockErrors.join('\n')}`,
          variant: 'destructive',
        });
        return;
      }

      // Adjust stock based on differences
      Object.keys({ ...oldQuantities, ...newQuantities }).forEach(itemId => {
        const oldQty = oldQuantities[itemId] || 0;
        const newQty = newQuantities[itemId] || 0;
        const difference = newQty - oldQty;

        if (difference > 0) {
          // Selling more, subtract from stock
          adjustStock(itemId, difference, 'subtract');
        } else if (difference < 0) {
          // Selling less, add back to stock
          adjustStock(itemId, Math.abs(difference), 'add');
        }
      });

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

      editInvoice(existingInvoice.id, {
        businessId: currentBusinessId,
        invoiceNo: formData.invoiceNo,
        type: 'sale',
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
        paymentMethod: 'cash',
        amountPaid,
        notes: formData.notes,
        terms: formData.terms,
        isDeleted: false,
      });

      toast({
        title: 'Sale Updated',
        description: `Invoice ${formData.invoiceNo} has been updated successfully.`,
      });
    } else {
      // Handle create mode
      // Validate stock availability for all items
      const stockErrors: string[] = [];
      const itemQuantities = formData.lineItems.reduce((acc, li) => {
        const itemId = li.itemId;
        if (itemId) {
          acc[itemId] = (acc[itemId] || 0) + li.quantity;
        }
        return acc;
      }, {} as Record<string, number>);

      Object.entries(itemQuantities).forEach(([itemId, totalQty]) => {
        const item = unifiedItems.find(i => i.id === itemId);
        if (item && totalQty > (Number(item.currentStock) || 0)) {
          stockErrors.push(`${item.name}: requested ${totalQty}, available ${Number(item.currentStock) || 0}`);
        }
      });

      if (stockErrors.length > 0) {
        toast({
          title: 'Insufficient Stock',
          description: `Cannot complete sale:\n${stockErrors.join('\n')}`,
          variant: 'destructive',
        });
        return;
      }

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
        type: 'sale',
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
        isDeleted: false,
      });

      // Adjust stock for each item
      formData.lineItems.forEach((li) => {
        if (li.itemId) {
          adjustStock(li.itemId, li.quantity, 'subtract');
        }
      });


      toast({
        title: 'Sale Created',
        description: `Invoice ${formData.invoiceNo} has been created successfully.`,
      });

    }

    handleDialogOpen(false);
  } catch (error) {
    console.error('Error creating/updating sale:', error);
    toast({
      title: 'Error',
      description: 'An error occurred while processing the sale. Please try again.',
      variant: 'destructive',
    });
  }
};

  const handleDelete = (id: string, invoiceNo: string) => {
    const invoice = getInvoiceById(id);
    if (invoice) {
      // Restore stock for each item
      invoice.lineItems.forEach((li) => {
        if (li.itemId) {
          adjustStock(li.itemId, li.quantity, 'add');
        }
      });
    }
    deleteInvoice(id);
    toast({
      title: 'Invoice Deleted',
      description: `Invoice ${invoiceNo} has been deleted.`,
      variant: 'destructive',
    });
  };

  const handleRecover = (id: string, invoiceNo: string) => {
    recoverInvoice(id);
    toast({
      title: 'Invoice Recovered',
      description: `Invoice ${invoiceNo} has been recovered.`,
    });
  };

  const filteredSales = sales
    .filter((inv) => {
      const matchesSearch =
        inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        (inv.partyName || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && inv.paymentStatus === 'paid') ||
        (statusFilter === 'unpaid' && inv.paymentStatus !== 'paid') ||
        (statusFilter === 'overdue' && isInvoiceOverdue(inv.dueDate || new Date()) && inv.paymentStatus !== 'paid');

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate || new Date()).getTime() - new Date(b.dueDate || new Date()).getTime();
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime(); // Default: newest first
    });

  const totalSales = sales.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const paidSales = sales.filter((inv) => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + inv.grandTotal, 0);
  const unpaidSales = totalSales - paidSales;

  // Get payments linked to the viewing invoice
  const invoicePayments = viewingInvoice ? getPaymentsByBusiness(currentBusinessId || '').filter(p => p.invoiceId === viewingInvoice.id) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="text-muted-foreground">{sales.length} invoices • Total: {formatCurrency(totalSales)}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-[98vw] sm:w-[95vw] md:w-[90vw] lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">
                {isEditMode ? 'Edit Sale Invoice' : 'Create Sale Invoice'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 mt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="party" className="text-sm md:text-base">Customer *</Label>
                  <Select
                    value={formData.partyId}
                    onValueChange={(value) => setFormData({ ...formData, partyId: value })}
                  >
                    <SelectTrigger className="h-10 md:h-11">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {unifiedCustomers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
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

              {/* Add Item */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 sm:gap-2 md:gap-3">
                    <Select value={selectedItem} onValueChange={(value) => {
                      setSelectedItem(value);
                      const item = unifiedItems.find((i) => i.id === value);
                      if (item) setItemPrice(item.salePrice.toString());
                    }}>
                      <SelectTrigger className="w-full h-10 md:h-11">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {unifiedItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({Number(item.currentStock) || 0} in stock)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          className="w-full sm:w-20 h-10 md:h-11"
                          value={itemQty}
                          onChange={(e) => setItemQty(Number(e.target.value))}
                          min={1}
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          className="w-full sm:w-28 h-10 md:h-11"
                          value={itemPrice}
                          onChange={(e) => setItemPrice(e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Item Discount"
                          className="w-full sm:w-24 h-10 md:h-11"
                          value={itemDiscount}
                          onChange={(e) => setItemDiscount(e.target.value)}
                          min={0}
                          title="Discount for this specific item"
                        />
                        <Select value={itemDiscountType} onValueChange={(value: 'flat' | 'percent') => setItemDiscountType(value)}>
                          <SelectTrigger className="w-full sm:w-20 h-10 md:h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">₹</SelectItem>
                            <SelectItem value="percent">%</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" onClick={addLineItem} disabled={!selectedItem} className="w-full sm:w-auto h-10 md:h-11 px-3 sm:px-3">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {formData.lineItems.length > 0 && (
                    <>
                      {/* Mobile Card View */}
                      <div className="mt-4 block md:hidden space-y-4">
                        {formData.lineItems.map((li) => (
                          <Card key={li.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{li.itemName}</h4>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Qty: {li.quantity} • Price: {formatCurrency(li.price)}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 flex-shrink-0"
                                onClick={() => removeLineItem(li.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <div>
                                {li.discount > 0 ? (
                                  <span className="text-muted-foreground">
                                    Discount: {formatCurrency(li.discount)}
                                    {li.discountType === 'percent' ? '%' : ''}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">No discount</span>
                                )}
                              </div>
                              <div className="font-semibold text-primary">
                                {formatCurrency(li.total)}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="mt-4 hidden md:block overflow-x-auto">
                        <Table className="min-w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[120px]">Item</TableHead>
                              <TableHead className="text-right min-w-[60px]">Qty</TableHead>
                              <TableHead className="text-right min-w-[80px]">Price</TableHead>
                              <TableHead className="text-right min-w-[80px]">Discount</TableHead>
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
                                <TableCell className="text-right">
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
                                    className="h-10 w-10"
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
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm md:text-base">Overall Discount (₹)</Label>
                      <Input
                        type="number"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData({ ...formData, discount: e.target.value })
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
                          setFormData({ ...formData, otherCharges: e.target.value })
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
                      onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
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
                  className="flex-1"
                  onClick={() => handleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {isEditMode ? 'Update Invoice' : 'Create Invoice'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-[98vw] sm:w-[95vw] md:w-[90vw] lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Invoice {viewingInvoice?.invoiceNo}</DialogTitle>
            </DialogHeader>
            {viewingInvoice && (
              <div className="space-y-6 mt-4 print-invoice">
                {/* Invoice Header */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Customer</Label>
                    <p className="text-sm md:text-base">{viewingInvoice.partyName || ''}</p>
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
                    <p className="text-sm md:text-base">{formatDate(viewingInvoice.dueDate || new Date())}</p>
                  </div>
                </div>

                {/* Items Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-4">
                      {viewingInvoice.lineItems.map((li) => (
                        <Card key={li.id} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{li.itemName}</h4>
                              <div className="text-xs text-muted-foreground mt-1">
                                Qty: {li.quantity} • Price: {formatCurrency(li.price)}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <div>
                              {li.discount > 0 ? (
                                <span className="text-muted-foreground">
                                  Discount: {formatCurrency(li.discount)}
                                  {li.discountType === 'percent' ? '%' : ''}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">No discount</span>
                              )}
                            </div>
                            <div className="font-semibold text-primary">
                              {formatCurrency(li.total)}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Item</TableHead>
                            <TableHead className="text-right min-w-[60px]">Qty</TableHead>
                            <TableHead className="text-right min-w-[80px]">Price</TableHead>
                            <TableHead className="text-right min-w-[80px]">Discount</TableHead>
                            <TableHead className="text-right min-w-[80px]">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewingInvoice.lineItems.map((li) => (
                            <TableRow key={li.id}>
                              <TableCell className="font-medium">{li.itemName}</TableCell>
                              <TableCell className="text-right">{li.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(li.price)}</TableCell>
                              <TableCell className="text-right">
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

                {/* Payment History */}
                {invoicePayments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base md:text-lg">Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Mobile Card View */}
                      <div className="block md:hidden space-y-4">
                        {invoicePayments.map((payment) => (
                          <Card key={payment.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="text-sm font-medium">{formatDate(payment.date)}</div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {payment.paymentMethod.replace('_', ' ')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-success text-sm">
                                  +{formatCurrency(payment.amount)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {payment.reference || 'No reference'}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table className="min-w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[100px]">Date</TableHead>
                              <TableHead className="min-w-[80px]">Amount</TableHead>
                              <TableHead className="min-w-[100px]">Method</TableHead>
                              <TableHead className="min-w-[120px]">Reference</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoicePayments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell className="font-medium">{formatDate(payment.date)}</TableCell>
                                <TableCell className="text-right font-semibold text-success">
                                  +{formatCurrency(payment.amount)}
                                </TableCell>
                                <TableCell className="capitalize">{payment.paymentMethod.replace('_', ' ')}</TableCell>
                                <TableCell className="text-muted-foreground">{payment.reference || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 min-w-[100px]"
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
                        const customer = unifiedCustomers.find(c => c.id === viewingInvoice.partyId);
                        shareInvoiceToWhatsApp({
                          invoice: viewingInvoice,
                          businessName: business?.name,
                          formatCurrency,
                          formatDate,
                          phoneNumber: customer?.phone || undefined,
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
                  {viewingInvoice && viewingInvoice.paymentStatus !== 'paid' && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 min-w-[100px]"
                      onClick={() => handleEdit(viewingInvoice)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="metric-card">
          <CardContent className="p-3 md:p-4">
            <p className="stat-label text-xs md:text-sm">Total Sales</p>
            <p className="stat-value text-base md:text-lg">{formatCurrency(totalSales)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-3 md:p-4">
            <p className="stat-label text-xs md:text-sm">Paid</p>
            <p className="stat-value text-success text-base md:text-lg">{formatCurrency(paidSales)}</p>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-3 md:p-4">
            <p className="stat-label text-xs md:text-sm">Unpaid</p>
            <p className="stat-value text-destructive text-base md:text-lg">{formatCurrency(unpaidSales)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or customer..."
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
          <div className="flex items-center gap-2">
            <Label htmlFor="show-deleted" className="text-sm">Show Deleted</Label>
            <Switch
              id="show-deleted"
              checked={showDeleted}
              onCheckedChange={setShowDeleted}
            />
          </div>
        </div>
      </div>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <Card className="p-8 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No sales yet</h3>
          <p className="text-muted-foreground mb-4">Create your first sale invoice</p>
          <Button onClick={() => handleDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {filteredSales.map((invoice) => (
              <Card key={invoice.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{invoice.invoiceNo}</h3>
                    <p className="text-sm text-muted-foreground">{invoice.partyName || ''}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10">
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
                      <DropdownMenuItem onClick={() => generateInvoicePDF(invoice, business)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      {invoice.isDeleted ? (
                        <DropdownMenuItem
                          onClick={() => handleRecover(invoice.id, invoice.invoiceNo)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Recover
                        </DropdownMenuItem>
                      ) : (
                        <>
                          {invoice.isDeleted ? (
                            <DropdownMenuItem
                              onClick={() => handleRecover(invoice.id, invoice.invoiceNo)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Recover
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(invoice.id, invoice.invoiceNo)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {formatDate(invoice.date)} • Due: <span className={isInvoiceOverdue(invoice.dueDate || new Date()) && invoice.paymentStatus !== 'paid' ? 'text-destructive font-medium' : ''}>{formatDate(invoice.dueDate || new Date())}</span>
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((invoice) => (
                    <TableRow key={invoice.id} className="table-row">
                      <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                      <TableCell>{invoice.partyName || ''}</TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>
                        <span className={isInvoiceOverdue(invoice.dueDate || new Date()) && invoice.paymentStatus !== 'paid' ? 'text-destructive font-medium' : ''}>
                          {formatDate(invoice.dueDate || new Date())}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10">
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
                            <DropdownMenuItem onClick={() => generateInvoicePDF(invoice, business)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
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
          </div>
        </>
      )}
    </div>
  );
}
