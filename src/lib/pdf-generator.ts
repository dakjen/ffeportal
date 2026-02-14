// src/lib/pdf-generator.ts
import PDFDocument from 'pdfkit';
import fs from 'fs';

interface QuoteItem {
  serviceName: string;
  description?: string;
  price: number;
  unitPrice: number;
  quantity: number;
}

interface QuoteDetails {
  id: string;
  version?: string; // e.g., 'v1'
  netPrice: number;
  taxRate: number;
  taxAmount: number;
  deliveryFee: number;
  totalPrice: number;
  status: string;
  projectName: string;
  clientName: string;
  clientCompanyName?: string;
  logoPath?: string; // local path to logo image
  paymentTerms?: string; // e.g., 'Net 30'
  items: QuoteItem[];
}

const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export function generateQuotePdf(
  quoteDetails: QuoteDetails
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const margin = 50;

    const colors = {
      primary: '#710505',
      secondary: '#ac8d79',
      lightBg: '#f6f6f6',
      text: '#000000',
      white: '#ffffff',
    };

    // ======================
    // PAGE BACKGROUND
    // ======================
    doc.rect(0, 0, pageWidth, doc.page.height).fill(colors.white);

    // ======================
    // HEADER WITH LOGO AND EMAIL
    // ======================
    const logoSize = 50;
    let headerY = 50;
    if (quoteDetails.logoPath && fs.existsSync(quoteDetails.logoPath)) {
      doc.image(quoteDetails.logoPath, margin, headerY, { width: logoSize });
    }

    const headerX = quoteDetails.logoPath ? margin + logoSize + 10 : margin;
    doc.fillColor(colors.primary)
      .fontSize(22)
      .text('DesignDomain LLC', headerX, headerY, { align: 'left' })
      .fontSize(10)
      .text('Professional Design Services', { align: 'left' })
      .moveDown(0.2)
      .text('quote@designdomainllc.com', { align: 'left', link: 'mailto:quote@designdomainllc.com' });

    // Quote version top-right
    if (quoteDetails.version) {
      doc.fontSize(10)
        .fillColor(colors.primary)
        .text(`Quote Version: ${quoteDetails.version}`, pageWidth - margin - 120, headerY, { align: 'right' });
    }

    doc.moveDown(4);

    // ======================
    // QUOTE DETAILS
    // ======================
    doc.fillColor(colors.text)
      .fontSize(12)
      .text(`Project: ${quoteDetails.projectName}`)
      .text(`Client: ${quoteDetails.clientCompanyName || quoteDetails.clientName}`)
      .text(`Quote ID: ${quoteDetails.id}`)
      .text(`Status: ${quoteDetails.status}`);

    if (quoteDetails.paymentTerms) {
      doc.moveDown(0.5)
        .fillColor(colors.primary)
        .fontSize(11)
        .text(`Payment Terms: ${quoteDetails.paymentTerms}`)
        .fillColor(colors.text);
    }

    doc.moveDown(1.5);

    // ======================
    // TABLE HEADER
    // ======================
    const serviceX = margin;
    const qtyX = 330;
    const unitPriceX = 390;
    const totalX = 470;

    doc.rect(margin - 5, doc.y - 2, pageWidth - 2 * margin + 10, 20)
      .fill(colors.lightBg);

    doc.fillColor(colors.primary)
      .fontSize(11)
      .font('Helvetica-Bold');
    doc.text('Service', serviceX, doc.y - 15);
    doc.text('Qty', qtyX, doc.y - 15);
    doc.text('Unit', unitPriceX, doc.y - 15);
    doc.text('Total', totalX, doc.y - 15, { align: 'right' });

    doc.moveTo(margin, doc.y + 5)
      .lineTo(pageWidth - margin, doc.y + 5)
      .strokeColor(colors.primary)
      .stroke();

    doc.moveDown();
    doc.font('Helvetica').fillColor(colors.text);

    // ======================
    // ITEMS
    // ======================
    quoteDetails.items.forEach((item) => {
      if (doc.y > doc.page.height - 100) doc.addPage();

      const startY = doc.y;

      doc.fontSize(10)
        .fillColor(colors.text)
        .text(item.serviceName, serviceX, startY, { width: 250 })
        .text(item.quantity.toString(), qtyX, startY)
        .text(formatCurrency(item.unitPrice), unitPriceX, startY)
        .text(formatCurrency(item.price), totalX, startY, { align: 'right' });

      if (item.description) {
        doc.fontSize(8)
          .fillColor(colors.secondary)
          .text(item.description, serviceX + 10, doc.y, { width: 250 })
          .fillColor(colors.text);
      }

      doc.moveDown(1);
    });

    // ======================
    // TOTALS
    // ======================
    doc.moveDown(2);

    doc.fontSize(11)
      .fillColor(colors.text)
      .text(`Net Price: ${formatCurrency(quoteDetails.netPrice)}`, { align: 'right' });

    if (quoteDetails.taxRate > 0) {
      doc.text(`Tax (${(quoteDetails.taxRate * 100).toFixed(1)}%): ${formatCurrency(quoteDetails.taxAmount)}`, { align: 'right' });
    }

    if (quoteDetails.deliveryFee > 0) {
      doc.text(`Delivery Fee: ${formatCurrency(quoteDetails.deliveryFee)}`, { align: 'right' });
    }

    doc.fontSize(14)
      .fillColor(colors.primary)
      .font('Helvetica-Bold')
      .text(`TOTAL: ${formatCurrency(quoteDetails.totalPrice)}`, { align: 'right' });

    // ======================
    // FOOTER
    // ======================
    doc.fontSize(9)
      .fillColor(colors.primary)
      .font('Helvetica')
      .text('Thank you for your business.', margin, doc.page.height - 50, { align: 'center' });

    doc.end();
  });
}
