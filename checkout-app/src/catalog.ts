export interface ProductVariant {
  id: string;
  label: string;
  priceCents: number;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  currency: string;
  variants: ProductVariant[];
}

const CATALOG: Record<string, Product> = {
  prod_123: {
    id: 'prod_123',
    name: 'The Weekend Tote',
    description:
      'Hand-stitched 14oz canvas with full-grain leather straps. Fits a 15" laptop with room to spare.',
    currency: 'INR',
    variants: [
      { id: 'forest', label: 'Forest Canvas', priceCents: 1099900, color: '#2f5c48' },
      { id: 'sand', label: 'Sand Canvas', priceCents: 1099900, color: '#c9a876' },
      { id: 'clay', label: 'Clay Canvas', priceCents: 1099900, color: '#b5643f' },
      { id: 'charcoal', label: 'Charcoal, leather trim', priceCents: 1199900, color: '#3a3733' },
    ],
  },
};

const FALLBACK: Omit<Product, 'id'> = {
  name: 'Custom Order',
  description: 'One-time purchase.',
  currency: 'INR',
  variants: [{ id: 'standard', label: 'Standard', priceCents: 199900, color: '#2f5c48' }],
};

export function getProduct(productId: string): Product {
  return CATALOG[productId] ?? { id: productId, ...FALLBACK };
}

export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
