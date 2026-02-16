// src/lib/pdf-generator.tsx (Server-side compatible for React-PDF)
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from '@react-pdf/renderer';

// ========================== 
// UTILITY FUNCTIONS
// ========================== 
export const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export const getShortId = (id: string) => id.substring(0, 6); // Exported getShortId

function generate6DigitQuoteId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatTimestamp(date: Date) {
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ========================== 
// QUOTE INTERFACES
// ========================== 
export interface QuoteItem {
  serviceName: string;
  description?: string;
  price: number;
  unitPrice: number;
  quantity: number;
}

export interface QuoteDetails {
  id: string;
  version?: string; // Optional
  netPrice: number;
  taxRate: number;
  taxAmount: number;
  deliveryFee: number;
  totalPrice: number;
  projectName: string;
  clientName: string;
  clientCompanyName?: string;
  clientEmail?: string; // Added clientEmail to interface
  logoPath?: string; // Absolute URL or base64
  paymentTerms?: string; // Optional
  servicesNarrative?: string; // Optional
  sentAt?: Date; // Optional
  items: QuoteItem[];
}

// ========================== 
// QUOTE STYLES (for @react-pdf/renderer)
// ========================== 
const quoteStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 45,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
    marginBottom: 5,
  },
  companyTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#710505',
    letterSpacing: 1,
    marginBottom: 5, // Increased margin-bottom
  },
  quoteInfo: {
    alignItems: 'flex-end',
  },
  section: {
    marginBottom: 5, // Reduced space between sections
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#710505',
    marginBottom: 5,
  },
  servicesNarrative: {
    fontSize: 9,
    color: '#000000',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 1.4,
  },
  clientDetails: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f6f6f6',
    borderLeftWidth: 4,
    borderLeftColor: '#710505',
  },
  table: { // Removed display: 'table'
    width: 'auto',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '40%',
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    backgroundColor: '#710505',
    fontSize: 10,
  },
  tableCol: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  itemDescription: {
    fontSize: 8,
    color: '#ac8d79',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  totalText: {
    width: 70,
    textAlign: 'right',
    padding: 3,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#710505',
  },
  totalsContainer: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 45,
    right: 45,
    fontSize: 8,
    textAlign: 'center',
    color: '#ac8d79',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10,
  },
});

// ========================== 
// QUOTE PDF COMPONENT (@react-pdf/renderer)
// ========================== 
const QuoteDocument = ({ quoteDetails }: { quoteDetails: QuoteDetails }) => (
  <Document>
    <Page size="A4" style={quoteStyles.page}>

      {/* Header */}
      <View style={quoteStyles.header}>
        <View>
          {quoteDetails.logoPath && (
            <Image src={quoteDetails.logoPath} style={quoteStyles.logo} />
          )}
          <Text style={quoteStyles.companyTitle}>DesignDomain LLC</Text><Text style={{ fontSize: 10, marginTop: 10 }}>Professional Design Services</Text><Text style={{ fontSize: 10, marginTop: 5 }}>quote@designdomainllc.com</Text>
        </View>

        <View style={quoteStyles.quoteInfo}>
          <Text style={{ fontSize: 10, color: '#777777' }}>
            Quote ID: {getShortId(quoteDetails.id)}
          </Text>
          <Text style={{ fontSize: 10, color: '#710505', fontFamily: 'Helvetica-Bold', marginTop: 5 }}>
            TOTAL: {formatCurrency(quoteDetails.totalPrice)}
          </Text>
          {quoteDetails.version && (
            <Text style={{ fontSize: 9, color: '#ac8d79', marginTop: 5 }}>
              Version: {quoteDetails.version}
            </Text>
          )}
          {quoteDetails.sentAt && (
            <Text style={{ fontSize: 9, color: '#777777', marginTop: 2 }}>
              Sent: {quoteDetails.sentAt.toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </Text>
          )}
        </View>
      </View>

      {/* Top brand bar */}
      <View style={{
        height: 6,
        backgroundColor: '#710505',
        marginBottom: 15
      }} />

      {/* Client Details */}
      <View style={quoteStyles.section}>
        <Text style={quoteStyles.sectionTitle}>Client Details</Text>
        <View style={quoteStyles.clientDetails}>
          <Text>Company: {quoteDetails.clientCompanyName || quoteDetails.clientName}</Text> {/* Display company, fallback to name */}
          {quoteDetails.clientEmail && (
            <Text>Email: {quoteDetails.clientEmail}</Text>
          )}
          <Text>Project: {quoteDetails.projectName}</Text>
        </View>
      </View>

      {/* Professional Narrative */}
      <View style={quoteStyles.section}>
        <Text style={quoteStyles.sectionTitle}>About Us</Text>
        <Text style={quoteStyles.servicesNarrative}>
          Design Domain LLC provides full-service FF&E procurement, sourcing furniture, technology, and equipment aligned with your design vision, functional needs, and budget. We leverage design and ease to secure pricing typically 20–50% below retail while managing vendor coordination, logistics, and delivery to ensure a seamless experience.
        </Text>
      </View>

      {/* Scope of Work */}
      <View style={quoteStyles.section}>
        <Text style={quoteStyles.sectionTitle}>Scope of Work</Text>
        <Text style={quoteStyles.servicesNarrative}>
          This quote may include sourcing, procurement coordination, vendor communication, order management, and delivery coordination if applicable.
        </Text>
      </View>

      {/* Items Table */}
      <View style={quoteStyles.table}>
        {/* Table Header */}
        <View style={quoteStyles.tableRow}>
          <Text style={quoteStyles.tableColHeader}>Service</Text>
          <Text style={[quoteStyles.tableColHeader, { width: '10%' }]}>Qty</Text>
          <Text style={[quoteStyles.tableColHeader, { width: '20%' }]}>Unit Price</Text>
          <Text style={[quoteStyles.tableColHeader, { width: '20%', textAlign: 'right' }]}>Total</Text>
        </View>

        {/* Table Rows */}
        {quoteDetails.items.map((item, index) => (
          <View key={index} style={quoteStyles.tableRow}>
            <View style={[quoteStyles.tableCol, { width: '40%' }]}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10 }}>
                {item.serviceName}
              </Text>
              {item.description && (
                <Text style={quoteStyles.itemDescription}>
                  {item.description}
                </Text>
              )}
            </View>
            <Text style={[quoteStyles.tableCol, { width: '10%' }]}>{item.quantity}</Text>
            <Text style={[quoteStyles.tableCol, { width: '20%' }]}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={[quoteStyles.tableCol, { width: '20%', textAlign: 'right' }]}>{formatCurrency(item.price)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={quoteStyles.totalsContainer}>
        <View style={quoteStyles.totalRow}>
          <Text style={quoteStyles.totalText}>Net Price:</Text>
          <Text style={quoteStyles.totalText}>{formatCurrency(quoteDetails.netPrice)}</Text>
        </View>

        {quoteDetails.taxRate && quoteDetails.taxRate > 0 && (
          <View style={quoteStyles.totalRow}>
            <Text style={quoteStyles.totalText}>Tax ({(quoteDetails.taxRate * 100).toFixed(1)}%):</Text>
            <Text style={quoteStyles.totalText}>{formatCurrency(quoteDetails.taxAmount)}</Text>
          </View>
        )}

        {quoteDetails.deliveryFee && quoteDetails.deliveryFee > 0 && (
          <View style={quoteStyles.totalRow}>
            <Text style={quoteStyles.totalText}>Delivery Fee:</Text>
            <Text style={quoteStyles.totalText}>{formatCurrency(quoteDetails.deliveryFee)}</Text>
          </View>
        )}

        <View style={quoteStyles.totalRow}>
          <Text style={[quoteStyles.totalText, { fontSize: 14 }]}>TOTAL:</Text>
          <Text style={[quoteStyles.totalText, { width: 70, fontSize: 14 }]}>{formatCurrency(quoteDetails.totalPrice)}</Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={quoteStyles.footer} fixed>
        Thank you for your business.
        {quoteDetails.paymentTerms && (
          <Text>
            {'\n'}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Payment Terms:</Text> {quoteDetails.paymentTerms}
          </Text>
        )}
      </Text>

    </Page>
  </Document>
);

export async function generateQuotePdf(
  quoteDetails: QuoteDetails
): Promise<Buffer> {
  return await renderToBuffer(<QuoteDocument quoteDetails={quoteDetails} />);
}
