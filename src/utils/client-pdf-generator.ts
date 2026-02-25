// src/utils/client-pdf-generator.ts (Client-side only for jsPDF)
import { jsPDF } from 'jspdf';

// Re-use formatCurrency from '@/lib/pdf-generator' if it were globally defined.
// For now, re-define it here for client-side use.
const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export interface InvoiceItem {
  description: string;
  amount: number;
}

// Invoice Interfaces for Client-Side JS PDF
export interface InvoiceFormOutput {
  invoiceNumber?: string;
  dueDate?: string;
  projectName: string;
  items: InvoiceItem[];
  totalAmount: number;
  clientId?: string | null;
  clientEmail?: string | null;
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

// Helper to convert hex to RGB for jspdf
function hexToRgb(hex: string): [number, number, number] {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ] : [0, 0, 0]; // Default to black if invalid
}

// Invoice PDF generation logic
export const generateClientSideInvoicePdf = (
  data: InvoiceFormOutput,
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
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice #`, 140, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.invoiceNumber || 'N/A'}`, 180, 55, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text(`Date:`, 140, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(`${new Date().toLocaleDateString()}`, 180, 62, { align: 'right' });

  if (data.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Due Date:`, 140, 69);
    doc.setFont('helvetica', 'normal');
    // Ensure the date is interpreted locally, safely avoiding timezone shifts
    const [year, month, day] = data.dueDate.split('-');
    const dueDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    doc.text(`${dueDateObj.toLocaleDateString()}`, 180, 69, { align: 'right' });
  }

  // Bill To Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandRed);
  doc.text('Bill To:', 20, 60);
  doc.line(20, 62, 120, 62); // Line

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  let yPos = 70;
  
  if (data.clientId) {
     const client = clients.find(c => c.id === data.clientId);
     if (client?.companyName) {
       doc.setFont('helvetica', 'bold');
       doc.text(client.companyName, 20, yPos);
       yPos += 5;
       doc.setFont('helvetica', 'normal');
       doc.text(client.name, 20, yPos);
       yPos += 5;
     } else {
       doc.text(client?.name || '', 20, yPos);
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
  yPos += 15;

  // Table Header
  doc.setFillColor(...lightGray);
  doc.rect(20, yPos, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 22, yPos + 6);
  doc.text('Amount', 188, yPos + 6, { align: 'right' });
  
  yPos += 15;
  doc.setFont('helvetica', 'normal');

  // Table Rows (Items)
  data.items.forEach(item => {
    // Description can be long, so split it
    const splitDescription = doc.splitTextToSize(item.description, 130);
    doc.text(splitDescription, 22, yPos);
    
    // Print amount
    doc.text(formatCurrency(item.amount), 188, yPos, { align: 'right' });
    
    const rowHeight = splitDescription.length * 5;
    yPos += rowHeight + 5;

    // Line under each row (optional, can look clean)
    doc.setDrawColor(240, 240, 240);
    doc.line(20, yPos - 3, 190, yPos - 3);
  });

  yPos += 10;

  // Total Section
  doc.setFillColor(...lightGray);
  doc.rect(120, yPos, 70, 20, 'F'); // Box for total
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Total Amount:', 130, yPos + 13);
  doc.setTextColor(...brandRed);
  doc.setFontSize(14);
  doc.text(formatCurrency(data.totalAmount), 185, yPos + 13, { align: 'right' });

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business.', 105, 280, { align: 'center' });
  
  doc.save(`Invoice_${data.projectName.replace(/\s+/g, '_')}.pdf`);
};
