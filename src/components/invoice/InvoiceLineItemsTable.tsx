import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { InvoiceLineItem } from '@/types';
import { useFormatCurrency } from '@/hooks/use-business';

interface InvoiceLineItemsTableProps {
  lineItems: InvoiceLineItem[];
  onRemoveItem: (id: string) => void;
  title?: string;
}

export function InvoiceLineItemsTable({ lineItems, onRemoveItem, title = 'Items' }: InvoiceLineItemsTableProps) {
  const formatCurrency = useFormatCurrency();

  if (lineItems.length === 0) return null;

  return (
    <>
      {/* Mobile Card View */}
      <div className="mt-4 block md:hidden space-y-4">
        {lineItems.map((li) => (
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
                onClick={() => onRemoveItem(li.id)}
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
            {lineItems.map((li) => (
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
                    onClick={() => onRemoveItem(li.id)}
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
  );
}
