import { useState, useEffect, useMemo } from 'react';
import { useUnifiedItems, useUnifiedCreateItem, useUnifiedUpdateItem, useUnifiedDeleteItem } from '@/hooks/useUnifiedData';
import { useBusinessStore } from '@/store/useBusinessStore';
import { getStockStatusColor } from '@/utils/helpers';
import { useFormatCurrency } from '@/hooks/use-business';
import { Plus, Search, Filter, MoreVertical, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Item, ItemCategory, ItemUnit } from '@/types';
import { ITEM_CATEGORIES, ITEM_UNITS, DEFAULT_FORM_STATE } from '@/constants/items';

export default function ItemsPage() {
  const { currentBusinessId } = useBusinessStore();
  const { data: items = [], isLoading, error } = useUnifiedItems(currentBusinessId || '');
  const createItemMutation = useUnifiedCreateItem();
  const updateItemMutation = useUnifiedUpdateItem();
  const deleteItemMutation = useUnifiedDeleteItem();
  const { toast } = useToast();
  const formatCurrency = useFormatCurrency();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({ itemId: '', quantity: '', type: 'add' as 'add' | 'subtract' });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { currentBusinessId } = useBusinessStore();
  const effectiveBusinessId = currentBusinessId || 'default-business-id';

  useEffect(() => {
    loadItems(effectiveBusinessId);
  }, [loadItems, effectiveBusinessId]);

  const items = getItemsByBusiness(effectiveBusinessId);
  const stockValue = getStockValue(effectiveBusinessId) || 0;

  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const itemData = {
      ...formData,
      purchasePrice: Number(formData.purchasePrice) || 0,
      salePrice: Number(formData.salePrice) || 0,
      openingStock: Number(formData.openingStock) || 0,
      lowStockAlert: Number(formData.lowStockAlert) || 0,
    };

    if (editingItem) {
      updateItem(editingItem.id, itemData);
      toast({ title: 'Item Updated', description: `${formData.name} has been updated.` });
    } else {
      addItem({ ...itemData, businessId: effectiveBusinessId });
      toast({ title: 'Item Added', description: `${formData.name} has been added to inventory.` });
    }

    setFormData(DEFAULT_FORM_STATE);
    setEditingItem(null);
    setIsDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    deleteItem(id);
    toast({ title: 'Item Deleted', description: `${name} has been removed from inventory.`, variant: 'destructive' });
  };

  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustment.itemId || !stockAdjustment.quantity.trim()) return;

    adjustStock(stockAdjustment.itemId, Number(stockAdjustment.quantity) || 0, stockAdjustment.type);
    const item = items.find(i => i.id === stockAdjustment.itemId);
    toast({
      title: 'Stock Adjusted',
      description: `${Number(stockAdjustment.quantity) || 0} ${item?.unit} ${stockAdjustment.type === 'add' ? 'added to' : 'removed from'} ${item?.name}.`,
    });

    setStockAdjustment({ itemId: '', quantity: '', type: 'add' });
    setIsStockDialogOpen(false);
  };

  const filteredItems = useMemo(() =>
    items.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    ),
    [items, search]
  );

  const openEditDialog = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      unit: item.unit as ItemUnit,
      category: item.category as ItemCategory,
      purchasePrice: item.purchasePrice.toString(),
      salePrice: item.salePrice.toString(),
      openingStock: item.currentStock.toString(),
      lowStockAlert: item.lowStockAlert,
    });
    setIsEditDialogOpen(true);
  };

  const openStockDialog = (itemId: string) => {
    setStockAdjustment({ itemId, quantity: '', type: 'add' });
    setIsStockDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="p-8 text-center border-destructive">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="font-semibold text-lg mb-2">Error Loading Items</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => loadItems(effectiveBusinessId)} className="mt-4">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Items & Inventory</h1>
          <p className="text-muted-foreground">
            {items.length} items • Stock Value: {formatCurrency(stockValue)}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Dialog open={isDialogOpen || isEditDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); setIsEditDialogOpen(false); setEditingItem(null); } }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SKU-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value: ItemUnit) =>
                      setFormData({ ...formData, unit: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: ItemCategory) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: e.target.value })
                    }
                    placeholder=""
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Sale Price</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, salePrice: e.target.value })
                    }
                    placeholder=""
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openingStock">Opening Stock</Label>
                  <Input
                    id="openingStock"
                    type="number"
                    value={formData.openingStock}
                    onChange={(e) =>
                      setFormData({ ...formData, openingStock: e.target.value })
                    }
                    placeholder=""
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    value={formData.lowStockAlert}
                    onChange={(e) =>
                      setFormData({ ...formData, lowStockAlert: Number(e.target.value) })
                    }
                    placeholder="5"
                  />
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
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adjust Stock</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleStockAdjustment} className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={stockAdjustment.type === 'add' ? 'default' : 'outline'}
                  onClick={() => setStockAdjustment(prev => ({ ...prev, type: 'add' }))}
                  className="flex-1"
                >
                  Add Stock
                </Button>
                <Button
                  type="button"
                  variant={stockAdjustment.type === 'subtract' ? 'default' : 'outline'}
                  onClick={() => setStockAdjustment(prev => ({ ...prev, type: 'subtract' }))}
                  className="flex-1"
                >
                  Remove Stock
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={stockAdjustment.quantity}
                  onChange={(e) => setStockAdjustment(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity"
                  min={1}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsStockDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Adjust Stock
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Search & Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items by name, SKU or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="flex-1 sm:flex-none"
          >
            <Package className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('table')}
            className="flex-1 sm:flex-none"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Items Display */}
      {filteredItems.length === 0 ? (
        <Card className="p-4 sm:p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No items yet</h3>
          <p className="text-muted-foreground mb-4">Add your first item to start managing inventory</p>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="metric-card">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(item)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openStockDialog(item.id)}>Adjust Stock</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id, item.name)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-semibold mb-1 line-clamp-2">{item.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{item.sku}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Purchase</span>
                    <span>{formatCurrency(item.purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sale</span>
                    <span className="font-semibold text-primary">
                      {formatCurrency(item.salePrice)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stock</span>
                    <Badge
                      className={getStockStatusColor(item.currentStock, item.lowStockAlert)}
                    >
                      {item.currentStock <= item.lowStockAlert && (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {item.currentStock} {item.unit}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Item</TableHead>
                <TableHead className="hidden sm:table-cell">SKU</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="text-right">Purchase</TableHead>
                <TableHead className="text-right">Sale</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="table-row">
                  <TableCell className="font-medium">
                    <div>
                      {item.name}
                      <div className="sm:hidden text-xs text-muted-foreground mt-1">
                        {item.sku} • {item.category}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">{item.sku}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.purchasePrice)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.salePrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      className={getStockStatusColor(item.currentStock, item.lowStockAlert)}
                    >
                      {item.currentStock} {item.unit}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(item)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openStockDialog(item.id)}>Adjust Stock</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(item.id, item.name)}
                        >
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
    </div>
  );
}
