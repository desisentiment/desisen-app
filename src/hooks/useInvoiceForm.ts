import { useState, useCallback, useMemo } from 'react';
import type { Item, Party } from '@/types';

// Match the existing InvoiceLineItem structure from types
export interface LineItem {
  id: string;
  itemId?: string;
  itemName: string;
  quantity: number;
  price: number;
  discount: number;
  discountType: 'flat' | 'percent';
  total: number;
}

export interface InvoiceFormData {
  partyId: string;
  date: Date;
  dueDate: Date | null;
  lineItems: LineItem[];
  discount: number;
  otherCharges: number;
  paymentAmount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'card';
  notes: string;
  terms: string;
  subtotal: number;
  grandTotal: number;
}

export interface UseInvoiceFormOptions {
  items: Item[];
  parties: Party[];
  onSubmit: (data: InvoiceFormData) => void;
  initialData?: Partial<InvoiceFormData>;
  priceField?: 'salePrice' | 'purchasePrice';
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const createEmptyLineItem = (): LineItem => ({
  id: generateId(),
  itemName: '',
  quantity: 1,
  price: 0,
  discount: 0,
  discountType: 'flat',
  total: 0,
});

export function useInvoiceForm({ 
  items, 
  parties, 
  onSubmit, 
  initialData,
  priceField = 'salePrice',
}: UseInvoiceFormOptions) {
  const [partyId, setPartyId] = useState(initialData?.partyId || '');
  const [date, setDate] = useState(initialData?.date || new Date());
  const [dueDate, setDueDate] = useState(initialData?.dueDate || null);
  const [discount, setDiscount] = useState(initialData?.discount || 0);
  const [otherCharges, setOtherCharges] = useState(initialData?.otherCharges || 0);
  const [paymentAmount, setPaymentAmount] = useState(initialData?.paymentAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'cash');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [terms, setTerms] = useState(initialData?.terms || '');
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.lineItems?.length ? initialData.lineItems : [createEmptyLineItem()]
  );

  const selectedParty = useMemo(
    () => parties.find((p) => p.id === partyId),
    [parties, partyId]
  );

  const calculateLineItem = useCallback((item: LineItem): LineItem => {
    const quantity = item.quantity || 1;
    const rate = item.price || 0;
    const amount = quantity * rate;
    const discountAmount = item.discountType === 'flat'
      ? item.discount || 0
      : (amount * (item.discount || 0)) / 100;
    const total = Math.max(0, amount - discountAmount);

    return { ...item, total };
  }, []);

  const updateLineItem = useCallback((id: string, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return calculateLineItem({ ...item, ...updates });
      })
    );
  }, [calculateLineItem]);

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, createEmptyLineItem()]);
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setLineItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const selectItem = useCallback((lineItemId: string, itemId: string) => {
    const selectedItem = items.find((i) => i.id === itemId);
    if (!selectedItem) return;
    updateLineItem(lineItemId, {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      price: selectedItem[priceField] || 0,
    });
  }, [items, priceField, updateLineItem]);

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + calculateLineItem(item).total, 0);
    const grandTotal = subtotal - discount + otherCharges;
    return { subtotal, grandTotal };
  }, [lineItems, discount, otherCharges, calculateLineItem]);

  const reset = useCallback(() => {
    setPartyId('');
    setDate(new Date());
    setDueDate(null);
    setDiscount(0);
    setOtherCharges(0);
    setPaymentAmount(0);
    setPaymentMethod('cash');
    setNotes('');
    setTerms('');
    setLineItems([createEmptyLineItem()]);
  }, []);

  const getFormData = useCallback((): InvoiceFormData => ({
    partyId,
    date,
    dueDate,
    lineItems: lineItems.map(calculateLineItem),
    discount,
    otherCharges,
    paymentAmount,
    paymentMethod,
    notes,
    terms,
    subtotal: totals.subtotal,
    grandTotal: totals.grandTotal,
  }), [partyId, date, dueDate, lineItems, discount, otherCharges, paymentAmount, paymentMethod, notes, terms, totals, calculateLineItem]);

  return {
    // State
    partyId, setPartyId,
    date, setDate,
    dueDate, setDueDate,
    discount, setDiscount,
    otherCharges, setOtherCharges,
    paymentAmount, setPaymentAmount,
    paymentMethod, setPaymentMethod,
    notes, setNotes,
    terms, setTerms,
    lineItems,
    selectedParty,
    totals,
    // Line item operations
    updateLineItem,
    addLineItem,
    removeLineItem,
    selectItem,
    // Form operations
    reset,
    getFormData,
    submit: () => onSubmit(getFormData()),
  };
}
