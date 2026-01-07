import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { Invoice, Business } from '@/types';
import { formatCurrency, formatDate } from './helpers';
import { useInvoiceTemplateStore } from '@/store/useInvoiceTemplateStore';

export const generateInvoicePDF = async (invoice: Invoice, business?: Business) => {
  // Get template settings from store
  const templateSettings = useInvoiceTemplateStore.getState().settings;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = templateSettings.layoutStyle === 'compact' ? 15 : 20;
  let yPosition = margin;

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [41, 128, 185]; // fallback to blue
  };

  // Colors from settings
  const primaryColor: [number, number, number] = hexToRgb(templateSettings.primaryColor);
  const secondaryColor: [number, number, number] = [149, 165, 166]; // Gray
  const textColor: [number, number, number] = [44, 62, 80]; // Dark blue

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4);
  };

  // Header
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 0, pageWidth, 40, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const documentType = 'INVOICE';
  pdf.text(documentType, margin, 25);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const subTitle = `${invoice.type.toUpperCase()} INVOICE`;
  pdf.text(subTitle, margin, 32);

  // Business and Invoice Info
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  yPosition = 55;

  const businessName = templateSettings.branding.companyName || business?.name || 'Business';

  // Left side - Business Info
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(businessName, margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(business?.address || 'Business Address', margin, yPosition);
  yPosition += 5;
  pdf.text(business?.city || 'City, State, ZIP Code', margin, yPosition);
  yPosition += 5;
  pdf.text(business?.phone ? `Phone: ${business.phone}` : 'Phone: (123) 456-7890', margin, yPosition);
  yPosition += 5;
  pdf.text('Email: business@example.com', margin, yPosition);

  // Right side - Invoice Details
  const rightX = pageWidth - margin - 60;
  yPosition = 55;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Invoice #:', rightX, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.invoiceNo, rightX + 25, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Date:', rightX, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDate(invoice.date), rightX + 25, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'bold');
  const statusLabel = 'Status:';
  pdf.text(statusLabel, rightX, yPosition);
  pdf.setFont('helvetica', 'normal');
  const statusValue = invoice.paymentStatus.toUpperCase();
  pdf.text(statusValue, rightX + 25, yPosition);

  // Bill To section
  yPosition = 100;
  pdf.setFillColor(248, 249, 250);
  pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'F');

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bill To:', margin + 5, yPosition + 5);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.partyName, margin + 5, yPosition + 15);

  // Items table
  yPosition = 140;

  // Table header
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');

  const colWidths = [80, 20, 25, 25]; // Description, Qty, Price, Total
  let xPos = margin + 5;

  pdf.text('Description', xPos, yPosition + 7);
  xPos += colWidths[0];

  pdf.text('Qty', xPos, yPosition + 7);
  xPos += colWidths[1];

  pdf.text('Price', xPos, yPosition + 7);
  xPos += colWidths[2];

  pdf.text('Total', xPos, yPosition + 7);

  // Table rows
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  pdf.setFont('helvetica', 'normal');

  yPosition += 15;

  invoice.lineItems.forEach((item, index) => {
    const rowY = yPosition + (index * 12);

    // Alternate row colors
    if (index % 2 === 0) {
      pdf.setFillColor(248, 249, 250);
      pdf.rect(margin, rowY - 3, pageWidth - 2 * margin, 10, 'F');
    }

    xPos = margin + 5;
    pdf.setFontSize(8);

    // Description (truncate if too long)
    const desc = item.itemName.length > 25 ? item.itemName.substring(0, 22) + '...' : item.itemName;
    pdf.text(desc, xPos, rowY + 5);
    xPos += colWidths[0];

    pdf.text(item.quantity.toString(), xPos, rowY + 5);
    xPos += colWidths[1];

    pdf.text(formatCurrency(item.price), xPos, rowY + 5);
    xPos += colWidths[2];

    pdf.text(formatCurrency(item.total), xPos, rowY + 5);
  });

  // Totals section
  yPosition += invoice.lineItems.length * 12 + 20;
  const totalsX = pageWidth - margin - 80;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  pdf.text('Subtotal:', totalsX, yPosition);
  pdf.text(formatCurrency(invoice.subtotal), totalsX + 50, yPosition);
  yPosition += 8;

  if (invoice.discount > 0) {
    pdf.text('Discount:', totalsX, yPosition);
    pdf.text(`-${formatCurrency(invoice.discount)}`, totalsX + 50, yPosition);
    yPosition += 8;
  }

  if (invoice.otherCharges > 0) {
    pdf.text('Other Charges:', totalsX, yPosition);
    pdf.text(`+${formatCurrency(invoice.otherCharges)}`, totalsX + 50, yPosition);
    yPosition += 8;
  }

  // Total
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(totalsX - 5, yPosition - 3, 75, 12, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL:', totalsX, yPosition + 6);
  pdf.text(formatCurrency(invoice.grandTotal), totalsX + 50, yPosition + 6);

  // Notes
  if (templateSettings.showNotes && invoice.notes) {
    yPosition += 30;
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Notes:', margin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const notesText = invoice.notes || '';

    if (notesText.trim()) {
      yPosition = addWrappedText(notesText, margin, yPosition, pageWidth - 2 * margin);
    }
  }

  // Terms & Conditions
  if (templateSettings.showTerms) {
    yPosition += 20;
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Terms & Conditions:', margin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const termsText = invoice.terms || 'Payment is due within 30 days. Late payments may incur additional charges.';
    yPosition = addWrappedText(termsText, margin, yPosition, pageWidth - 2 * margin);
  }

  // QR Code
  try {
    const qrData = `Invoice: ${invoice.invoiceNo}\nAmount: ${formatCurrency(invoice.grandTotal)}\nDue: ${formatDate(invoice.dueDate || invoice.date)}\nStatus: ${invoice.paymentStatus}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, { width: 80, margin: 1 });

    yPosition += 20;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Scan for Details:', margin, yPosition);
    pdf.addImage(qrCodeDataURL, 'PNG', margin, yPosition + 5, 30, 30);
  } catch (error) {
    console.error('Error generating QR code:', error);
  }

  // Payment Information
  if (templateSettings.showPaymentInfo) {
    yPosition += 20;
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Payment Information:', margin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const paymentInfo = `Please make payment to: ${businessName}\nAccount: XXXX-XXXX-XXXX\nBank: Example Bank`;
    yPosition = addWrappedText(paymentInfo, margin, yPosition, pageWidth - 2 * margin);
  }

  // Footer
  const footerY = pageHeight - 20;
  pdf.setFontSize(8);
  pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  pdf.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  pdf.text(`Generated on ${formatDate(new Date())}`, pageWidth / 2, footerY + 5, { align: 'center' });

  // Save the PDF
  const fileName = `${invoice.type}_${invoice.invoiceNo}.pdf`;
  pdf.save(fileName);
};

export const generateInvoiceFromHTML = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 295; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;

  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
};