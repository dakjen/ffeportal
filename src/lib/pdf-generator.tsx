// src/lib/pdf-generator.ts
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';

// Register a font for extended characters, if needed.
// For basic Latin text, default fonts are often fine, but custom fonts
// can be registered here if specific typography is required.
// Example: Font.register({ family: 'Roboto', src: 'path/to/Roboto-Regular.ttf' });


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
  logoPath?: string; // Not directly used by react-pdf/renderer for image embedding, needs conversion to base64 or URL
  paymentTerms?: string; // e.g., 'Net 30'
  items: QuoteItem[];
}

const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', // Default font, can be overridden with custom registered fonts
    fontSize: 10,
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 10,
  },
  companyInfo: {
    fontSize: 10,
    textAlign: 'left',
  },
  companyTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#710505',
  },
  quoteInfo: {
    fontSize: 10,
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    color: '#710505',
    marginBottom: 20,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    color: '#710505',
  },
  text: {
    marginBottom: 3,
  },
  clientDetails: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f6f6f6',
    borderRadius: 5,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderBottomColor: '#cccccc',
    borderBottomWidth: 1,
    padding: 5,
    fontFamily: 'Helvetica-Bold',
    color: '#710505',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderBottomColor: '#eeeeee',
    borderBottomWidth: 1,
    padding: 5,
  },
  itemDescription: {
    fontSize: 8,
    color: '#ac8d79',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalText: {
    width: 'auto',
    textAlign: 'right',
    padding: 3,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#710505',
  },
  footer: {
    position: 'absolute',
    fontSize: 8,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#710505',
  },
});

export const getShortId = (id: string) => id.substring(0, 6);

const QuoteDocument = ({ quoteDetails }: { quoteDetails: QuoteDetails }) => (
  <Document title={`Quote - ${quoteDetails.projectName} - ${getShortId(quoteDetails.id)}`}>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyTitle}>DesignDomain LLC</Text>
          <Text>Professional Design Services</Text>
          <Text>quote@designdomainllc.com</Text>
        </View>
        <View style={styles.quoteInfo}>
          <Text>Project: {quoteDetails.projectName}</Text>
          <Text>Quote ID: {getShortId(quoteDetails.id)}</Text>
          <Text>Status: {quoteDetails.status}</Text>
          {quoteDetails.version && <Text>Version: {quoteDetails.version}</Text>}
        </View>
      </View>

      {/* Client Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Details</Text>
        <View style={styles.clientDetails}>
          <Text style={styles.text}>Name: {quoteDetails.clientName}</Text>
          {quoteDetails.clientCompanyName && <Text style={styles.text}>Company: {quoteDetails.clientCompanyName}</Text>}
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeader}>Service</Text>
          <Text style={[styles.tableColHeader, { width: '15%' }]}>Qty</Text>
          <Text style={[styles.tableColHeader, { width: '20%' }]}>Unit Price</Text>
          <Text style={[styles.tableColHeader, { width: '20%', textAlign: 'right' }]}>Total</Text>
        </View>
        {/* Table Rows */}
        {quoteDetails.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCol}>
              {item.serviceName}
              {item.description && <Text style={styles.itemDescription}>{'\n' + item.description}</Text>}
            </Text>
            <Text style={[styles.tableCol, { width: '15%' }]}>{item.quantity}</Text>
            <Text style={[styles.tableCol, { width: '20%' }]}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={[styles.tableCol, { width: '20%', textAlign: 'right' }]}>{formatCurrency(item.price)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalRow}>
        <Text style={styles.totalText}>Net Price:</Text>
        <Text style={[styles.totalText, { width: 70 }]}>{formatCurrency(quoteDetails.netPrice)}</Text>
      </View>
      {quoteDetails.taxRate > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Tax ({ (quoteDetails.taxRate * 100).toFixed(1) }%):</Text>
          <Text style={[styles.totalText, { width: 70 }]}>{formatCurrency(quoteDetails.taxAmount)}</Text>
        </View>
      )}
      {quoteDetails.deliveryFee > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Delivery Fee:</Text>
          <Text style={[styles.totalText, { width: 70 }]}>{formatCurrency(quoteDetails.deliveryFee)}</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={[styles.totalText, { fontSize: 14 }]}>TOTAL:</Text>
        <Text style={[styles.totalText, { width: 70, fontSize: 14 }]}>{formatCurrency(quoteDetails.totalPrice)}</Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer} fixed>
        Thank you for your business.
        {quoteDetails.paymentTerms && <Text>{'\n'}Payment Terms: {quoteDetails.paymentTerms}</Text>}
      </Text>
    </Page>
  </Document>
);

export async function generateQuotePdf(
  quoteDetails: QuoteDetails
): Promise<Buffer> {
  return await renderToBuffer(<QuoteDocument quoteDetails={quoteDetails} />);
}
