export interface QuoteItem {
  id: string;
  serviceName: string;
  description: string | null;
  price: string;
  unitPrice: string | null;
  quantity: string;
}