import React from 'react';
import { InvoiceLineItem } from '@/types';
import { useFormatCurrency } from '@/hooks/use-business';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X } from 'lucide-react';

interface LineItemsTableProps {
  lineItems: InvoiceLineItem[];
  onRemoveItem: (id: string) => void;
  readOnly?: boolean;
}

export function LineItemsTable({ lineItems, onRemoveItem, readOnly = false }: LineItemsTableProps) {
  const formatCurrency = useFormatCurrency();

  if (lineItems.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No items added yet
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4 mt-4">
        {lineItems.map((li) => (
          <div key={li.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{li.itemName}</h4>
                <div className="text-xs text-muted-foreground mt-1">
                  Qty: {li.quantity} • Price: {formatCurrency(li.price)}
                </div>
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemoveItem(li.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
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
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto mt-4">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Item</TableHead>
              <TableHead className="text-right min-w-[60px]">Qty</TableHead>
              <TableHead className="text-right min-w-[80px]">Price</TableHead>
              <TableHead className="text-right min-w-[80px]">Discount</TableHead>
              <TableHead className="text-right min-w-[80px]">Total</TableHead>
              {!readOnly && <TableHead className="w-[50px]"></TableHead>}
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
                {!readOnly && (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRemoveItem(li.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
