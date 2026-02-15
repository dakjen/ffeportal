import { jsPDF } from 'jspdf';

// Invoice Interfaces for Client-Side JS PDF
export interface InvoiceFormValues {
  projectName: string;
  description: string;
  amount: number;
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
  const splitDescription = doc.splitTextToSize(data.description, 170);
  doc.text(splitDescription, 20, yPos);
  
  const descHeight = splitDescription.length * 5;
  yPos += descHeight + 10;

  // Total Section
  doc.setFillColor(...lightGray);
  doc.rect(120, yPos, 70, 20, 'F'); // Box for total
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Total Amount:', 130, yPos + 13);
  doc.setTextColor(...brandRed);
  doc.setFontSize(14);
  doc.text(`$${data.amount.toFixed(2)}`, 185, yPos + 13, { align: 'right' });

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business.', 105, 280, { align: 'center' });
  
  doc.save(`Invoice_${data.projectName.replace(/\s+/g, '_')}.pdf`);
};
