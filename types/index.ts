export interface PriceResult {
  source: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  link: string;
  rating?: number;
  reviews?: number;
  originalPrice?: number;
  description?: string;
  specifications?: Record<string, string>;
  shipping?: string;
  productId?: number;
}

export interface SearchResponse {
  query: string;
  results: PriceResult[];
  cheapest: { source: string; price: number } | null;
  fetchedAt: string;
}
