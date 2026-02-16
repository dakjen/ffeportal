import { jsPDF } from 'jspdf';

// Invoice Interfaces for Client-Side JS PDF
export interface InvoiceFormValues {
  projectName: string;
  description: string;
  amount: number;
  clientId?: string | null;
  clientEmail?: string | null;
  netPrice?: number;
  taxRate?: number;
  taxAmount?: number;
  deliveryFee?: number;
}

export interface ClientOption {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
}

export interface ContractorDetails {
  contractorName: string;
  contractorCompany?: string | null;
  contractorEmail: string;
}

// Invoice PDF generation logic
export const generateClientSideInvoicePdf = (
  data: InvoiceFormValues,
  clients: ClientOption[],
  contractorDetails: ContractorDetails
) => {
  const doc = new jsPDF();
  const brandRed = [113, 5, 5] as [number, number, number]; // #710505
  const lightGray = [240, 240, 240] as [number, number, number];

  // Header Background
  doc.setFillColor(...brandRed);
  doc.rect(0, 0, 210, 40, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 180, 25, { align: 'right' });

  // Company Info (Top Left)
  doc.setFontSize(16);
  doc.text(contractorDetails.contractorCompany || contractorDetails.contractorName, 20, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(contractorDetails.contractorEmail, 20, 28);

  // Invoice Meta
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 180, 50, { align: 'right' });

  // Bill To Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandRed);
  doc.text('Bill To:', 20, 60);
  doc.line(20, 62, 190, 62); // Line

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  let yPos = 70;
  
  if (data.clientId) {
     const client = clients.find(c => c.id === data.clientId);
     doc.text(client?.name || '', 20, yPos);
     yPos += 5;
     if (client?.companyName) {
       doc.text(client.companyName, 20, yPos);
       yPos += 5;
     }
     doc.text(client?.email || '', 20, yPos);
  } else {
     doc.text(data.clientEmail || 'N/A', 20, yPos);
  }

  // Project Details Section
  yPos += 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandRed);
  doc.text('Project Details', 20, yPos);
  doc.line(20, yPos + 2, 190, yPos + 2); // Line

  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text('Project:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.projectName, 50, yPos); // Include client project name
  yPos += 10; // Move yPos down after adding project name

  doc.setFont('helvetica', 'bold');
  doc.text('Description:', 20, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8); // Reduced font size for description
  const splitDescription = doc.splitTextToSize(data.description, 170);
  doc.text(splitDescription, 20, yPos);
  
  const descHeight = splitDescription.length * 5;
  yPos += descHeight + 10;

  // Totals Section
  let totalsYPos = yPos + 10; // Start below the project description
  const lineSpacing = 6; // Tight line spacing for totals

  doc.setFont('helvetica', 'normal'); // Reset font to normal for details
  doc.setTextColor(0, 0, 0); // Black for labels
  doc.setFontSize(9);

  // Net Price
  if (data.netPrice !== undefined) {
    doc.text('Net Price:', 150, totalsYPos, { align: 'right' });
    doc.text(`$${data.netPrice.toFixed(2)}`, 185, totalsYPos, { align: 'right' });
    totalsYPos += lineSpacing;
  }

  // Tax
  if (data.taxAmount !== undefined && data.taxRate !== undefined && data.taxRate > 0) {
    doc.text(`Tax (${(data.taxRate * 100).toFixed(1)}%):`, 150, totalsYPos, { align: 'right' });
    doc.text(`$${data.taxAmount.toFixed(2)}`, 185, totalsYPos, { align: 'right' });
    totalsYPos += lineSpacing;
  }

  // Delivery Fee
  if (data.deliveryFee !== undefined && data.deliveryFee > 0) {
    doc.text('Delivery Fee:', 150, totalsYPos, { align: 'right' });
    doc.text(`$${data.deliveryFee.toFixed(2)}`, 185, totalsYPos, { align: 'right' });
    totalsYPos += lineSpacing;
  }

  // Add a line before the final total for separation if any details were shown
  if (data.netPrice !== undefined || data.taxAmount !== undefined || data.deliveryFee !== undefined) {
    doc.line(140, totalsYPos - (lineSpacing / 2) + 2, 190, totalsYPos - (lineSpacing / 2) + 2); // Subtle line
    totalsYPos += (lineSpacing / 2); // Add a bit more space after the line
  }

  // Total Amount (final)
  doc.setFontSize(12); // Slightly smaller for the label
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL DUE:', 150, totalsYPos, { align: 'right' }); // Change label to TOTAL DUE
  doc.setTextColor(...brandRed);
  doc.setFontSize(14); // Keep total value prominent
  doc.text(`$${data.amount.toFixed(2)}`, 185, totalsYPos, { align: 'right' });

  // Update yPos for the rest of the document
  yPos = totalsYPos + 10;

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business.', 105, 280, { align: 'center' });
  
  doc.save(`Invoice_${data.projectName.replace(/\s+/g, '_')}.pdf`);
};
