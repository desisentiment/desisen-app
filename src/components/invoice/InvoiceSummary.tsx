import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFormatCurrency } from '@/hooks/use-business';

interface InvoiceSummaryProps {
  subtotal: number;
  discount: number;
  otherCharges: number;
  grandTotal: number;
  className?: string;
}

export function InvoiceSummary({ subtotal, discount, otherCharges, grandTotal, className }: InvoiceSummaryProps) {
  const formatCurrency = useFormatCurrency();

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Discount</span>
          <span>-{formatCurrency(discount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Other Charges</span>
          <span>+{formatCurrency(otherCharges)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Grand Total</span>
          <span className="text-primary">{formatCurrency(grandTotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
