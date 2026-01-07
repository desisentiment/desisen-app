import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFormatCurrency } from '@/hooks/use-business';

interface InvoiceStatsCardsProps {
  total: number;
  paid: number;
  unpaid: number;
  paidLabel?: string;
  unpaidLabel?: string;
}

export function InvoiceStatsCards({
  total,
  paid,
  unpaid,
  paidLabel = 'Paid',
  unpaidLabel = 'Unpaid',
}: InvoiceStatsCardsProps) {
  const formatCurrency = useFormatCurrency();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      <Card className="metric-card">
        <CardContent className="p-3 md:p-4">
          <p className="stat-label text-xs md:text-sm">Total</p>
          <p className="stat-value text-base md:text-lg">{formatCurrency(total)}</p>
        </CardContent>
      </Card>
      <Card className="metric-card">
        <CardContent className="p-3 md:p-4">
          <p className="stat-label text-xs md:text-sm">{paidLabel}</p>
          <p className="stat-value text-success text-base md:text-lg">{formatCurrency(paid)}</p>
        </CardContent>
      </Card>
      <Card className="metric-card">
        <CardContent className="p-3 md:p-4">
          <p className="stat-label text-xs md:text-sm">{unpaidLabel}</p>
          <p className="stat-value text-destructive text-base md:text-lg">{formatCurrency(unpaid)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
