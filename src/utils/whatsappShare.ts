import { Invoice } from '@/types';

interface ShareInvoiceOptions {
  invoice: Invoice;
  businessName?: string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
}

export function generateWhatsAppMessage({
  invoice,
  businessName,
  formatCurrency,
  formatDate
}: ShareInvoiceOptions): string {
  const invoiceType = invoice.type === 'sale' ? 'فروخت' : 
                      invoice.type === 'purchase' ? 'خریداری' : 
                      invoice.type === 'sale-return' ? 'واپسی فروخت' : 'واپسی خریداری';
  
  const statusText = invoice.paymentStatus === 'paid' ? '✅ ادا شدہ' : 
                     invoice.paymentStatus === 'partial' ? '⏳ جزوی ادائیگی' : '❌ غیر ادا شدہ';

  // Build items list
  const itemsList = invoice.lineItems.map((item, index) => 
    `${index + 1}. ${item.itemName} × ${item.quantity} = ${formatCurrency(item.total)}`
  ).join('\n');

  const message = `
🧾 *${businessName || 'کاروبار'}*
━━━━━━━━━━━━━━━━

📄 *${invoiceType} انوائس*
🔢 نمبر: ${invoice.invoiceNo}
📅 تاریخ: ${formatDate(invoice.date)}
${invoice.dueDate ? `⏰ آخری تاریخ: ${formatDate(invoice.dueDate)}` : ''}

👤 *${invoice.type === 'sale' ? 'کسٹمر' : 'سپلائر'}:*
${invoice.partyName || 'N/A'}

📦 *اشیاء:*
${itemsList}

━━━━━━━━━━━━━━━━
💰 ذیلی کل: ${formatCurrency(invoice.subtotal)}
${invoice.discount > 0 ? `➖ رعایت: ${formatCurrency(invoice.discount)}` : ''}
${invoice.otherCharges > 0 ? `➕ دیگر اخراجات: ${formatCurrency(invoice.otherCharges)}` : ''}
━━━━━━━━━━━━━━━━
💵 *کل رقم: ${formatCurrency(invoice.grandTotal)}*

📊 حیثیت: ${statusText}
${invoice.amountPaid > 0 ? `💳 ادا شدہ: ${formatCurrency(invoice.amountPaid)}` : ''}
${invoice.paymentStatus !== 'paid' ? `📌 باقی: ${formatCurrency(invoice.grandTotal - invoice.amountPaid)}` : ''}

${invoice.notes ? `📝 نوٹ: ${invoice.notes}` : ''}

شکریہ! 🙏
`.trim();

  return message;
}

export function shareToWhatsApp(message: string, phoneNumber?: string): void {
  const encodedMessage = encodeURIComponent(message);
  
  // If phone number provided, use direct WhatsApp link
  if (phoneNumber) {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  } else {
    // Use WhatsApp Web/App share without specific number
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }
}

export function shareInvoiceToWhatsApp(options: ShareInvoiceOptions & { phoneNumber?: string }): void {
  const message = generateWhatsAppMessage(options);
  shareToWhatsApp(message, options.phoneNumber);
}
