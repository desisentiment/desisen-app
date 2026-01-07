import { supabase } from '@/integrations/supabase/client';
import { Invoice, Payment, Expense } from '@/types';

export class FinancialService {
  // Invoice operations
  static async loadInvoices(businessId: string): Promise<Invoice[]> {
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_line_items(*)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (invoicesError) throw invoicesError;

    return invoicesData.map(invoice => ({
      id: invoice.id,
      businessId: invoice.business_id,
      invoiceNo: invoice.invoice_no,
      type: invoice.type,
      partyId: invoice.party_id,
      partyName: invoice.party_name,
      date: new Date(invoice.date),
      dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
      lineItems: invoice.invoice_line_items?.map((li: Record<string, unknown>) => ({
        id: li.id as string,
        itemId: (li.item_id as string) || undefined,
        itemName: li.item_name as string,
        quantity: li.quantity as number,
        price: li.price as number,
        discount: (li.discount as number) || 0,
        discountType: li.discount_type as 'flat' | 'percent',
        total: li.total as number,
      })) || [],
      subtotal: invoice.subtotal || 0,
      discount: invoice.discount || 0,
      otherCharges: invoice.other_charges || 0,
      grandTotal: invoice.grand_total || 0,
      paymentStatus: invoice.payment_status as 'paid' | 'unpaid' | 'partial',
      paymentMethod: invoice.payment_method as 'cash' | 'bank_transfer' | 'card',
      amountPaid: invoice.amount_paid || 0,
      notes: invoice.notes || '',
      terms: invoice.terms || '',
      convertedFrom: invoice.converted_from || undefined,
      status: invoice.status as 'active' | 'converted' | 'cancelled' || 'active',
      isDeleted: invoice.is_deleted || false,
      createdAt: new Date(invoice.created_at),
    }));
  }

  static async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'paymentMethod' | 'isDeleted'> & { paymentMethod?: Invoice['paymentMethod'] }): Promise<Invoice> {
    const normalizedInvoiceData = {
      ...invoiceData,
      subtotal: Number(invoiceData.subtotal) || 0,
      discount: Number(invoiceData.discount) || 0,
      otherCharges: Number(invoiceData.otherCharges) || 0,
      grandTotal: Number(invoiceData.grandTotal) || 0,
      amountPaid: Number(invoiceData.amountPaid) || 0,
    };

    const { data: invoiceResult, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        business_id: normalizedInvoiceData.businessId,
        invoice_no: normalizedInvoiceData.invoiceNo,
        type: normalizedInvoiceData.type,
        party_id: normalizedInvoiceData.partyId,
        party_name: normalizedInvoiceData.partyName,
        date: normalizedInvoiceData.date.toISOString().split('T')[0],
        due_date: normalizedInvoiceData.dueDate?.toISOString().split('T')[0],
        subtotal: normalizedInvoiceData.subtotal,
        discount: normalizedInvoiceData.discount,
        other_charges: normalizedInvoiceData.otherCharges,
        grand_total: normalizedInvoiceData.grandTotal,
        payment_status: normalizedInvoiceData.paymentStatus,
        payment_method: normalizedInvoiceData.paymentMethod || 'cash',
        amount_paid: normalizedInvoiceData.amountPaid,
        notes: normalizedInvoiceData.notes,
        terms: normalizedInvoiceData.terms,
        converted_from: normalizedInvoiceData.convertedFrom,
        status: normalizedInvoiceData.status || 'active',
        is_deleted: false,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    if (invoiceData.lineItems.length > 0) {
      const lineItemsData = invoiceData.lineItems.map(li => ({
        invoice_id: invoiceResult.id,
        item_id: li.itemId,
        item_name: li.itemName,
        quantity: li.quantity,
        price: li.price,
        discount: li.discount,
        discount_type: li.discountType,
        total: li.total,
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;
    }

    return {
      ...invoiceData,
      paymentMethod: invoiceData.paymentMethod || 'cash',
      id: invoiceResult.id,
      createdAt: new Date(invoiceResult.created_at),
      isDeleted: false,
    };
  }

  static async updateInvoice(id: string, data: Partial<Invoice>): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.amountPaid !== undefined) updateData.amount_paid = data.amountPaid;
    if (data.paymentStatus !== undefined) updateData.payment_status = data.paymentStatus;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    }
  }

  static async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
  }

  static async recoverInvoice(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .update({ is_deleted: false })
      .eq('id', id);

    if (error) throw error;
  }

  // Payment operations
  static async loadPayments(businessId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(payment => ({
      id: payment.id,
      businessId: payment.business_id,
      type: payment.type as 'in' | 'out',
      partyId: payment.party_id || '',
      partyName: payment.party_name || '',
      amount: payment.amount,
      date: new Date(payment.date),
      reference: payment.reference || '',
      notes: payment.notes || '',
      paymentMethod: payment.payment_method || 'cash',
      invoiceId: payment.invoice_id || undefined,
      createdAt: new Date(payment.created_at),
    }));
  }

  static async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt' | 'paymentMethod'> & { paymentMethod?: Payment['paymentMethod'] }): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        business_id: paymentData.businessId,
        type: paymentData.type,
        party_id: paymentData.partyId,
        party_name: paymentData.partyName,
        amount: paymentData.amount,
        date: paymentData.date.toISOString().split('T')[0],
        reference: paymentData.reference,
        notes: paymentData.notes,
        payment_method: paymentData.paymentMethod || 'cash',
        invoice_id: paymentData.invoiceId,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      businessId: data.business_id,
      type: data.type as 'in' | 'out',
      partyId: data.party_id || '',
      partyName: data.party_name || '',
      amount: data.amount,
      date: new Date(data.date),
      reference: data.reference || '',
      notes: data.notes || '',
      paymentMethod: data.payment_method || 'cash',
      invoiceId: data.invoice_id || undefined,
      createdAt: new Date(data.created_at),
    };
  }

  static async updatePayment(id: string, data: Partial<Payment>): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.partyId !== undefined) updateData.party_id = data.partyId;
    if (data.partyName !== undefined) updateData.party_name = data.partyName;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.date !== undefined) updateData.date = data.date.toISOString().split('T')[0];
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
    if (data.invoiceId !== undefined) updateData.invoice_id = data.invoiceId;

    const { error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  static async deletePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Expense operations
  static async loadExpenses(businessId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(expense => ({
      id: expense.id,
      businessId: expense.business_id,
      category: expense.category,
      amount: expense.amount,
      date: new Date(expense.date),
      paidBy: expense.paid_by as 'cash',
      notes: expense.notes || '',
      createdAt: new Date(expense.created_at),
    }));
  }

  static async createExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        business_id: expenseData.businessId,
        category: expenseData.category,
        amount: expenseData.amount,
        date: expenseData.date.toISOString().split('T')[0],
        paid_by: expenseData.paidBy,
        notes: expenseData.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      businessId: data.business_id,
      category: data.category,
      amount: data.amount,
      date: new Date(data.date),
      paidBy: data.paid_by as 'cash',
      notes: data.notes || '',
      createdAt: new Date(data.created_at),
    };
  }

  static async updateExpense(id: string, data: Partial<Expense>): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.category !== undefined) updateData.category = data.category;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.date !== undefined) updateData.date = data.date.toISOString().split('T')[0];
    if (data.paidBy !== undefined) updateData.paid_by = data.paidBy;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}