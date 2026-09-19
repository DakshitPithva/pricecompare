import { SearchResponse } from "@/types";

export function getMockResults(query: string): SearchResponse {
  const q = query.toLowerCase();

  if (q.includes("iphone")) {
    return {
      query,
      results: [
        { source: "eBay", title: "Apple iPhone 15 Pro 128GB - Unlocked - Natural Titanium", price: 78999, currency: "INR", image: "", link: "#", rating: 4.9, reviews: 940, description: "6.1\" Super Retina XDR, A17 Pro chip, 48MP camera system", shipping: "Free Express Shipping" },
        { source: "Walmart", title: "Apple iPhone 15 Pro 128GB (Unlocked)", price: 82499, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 3420, description: "Titanium design, USB-C, Action button, 2x optical zoom", shipping: "Free 2-Day Delivery" },
        { source: "Google Shopping", title: "Apple iPhone 15 Pro 128GB - Best Buy", price: 84999, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 2100, description: "A17 Pro chip, ProMotion display, Always-On", shipping: "Store Pickup Available" },
        { source: "Amazon", title: "Apple iPhone 15 Pro 128GB - Ships & Sold by Amazon", price: 89999, currency: "INR", image: "", link: "#", rating: 4.7, reviews: 12890, description: "48MP Main camera, spatial video, crash detection", shipping: "Prime 1-Day Delivery", originalPrice: 94900 },
      ],
      cheapest: { source: "eBay", price: 78999 },
      fetchedAt: new Date().toISOString(),
    };
  }

  if (q.includes("sony") || q.includes("wh-1000")) {
    return {
      query,
      results: [
        { source: "Walmart", title: "Sony WH-1000XM5 Wireless Noise Canceling Over-Ear Headphones (Black)", price: 27499, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 3420, originalPrice: 32990, shipping: "Free 2-Day Delivery", description: "Industry-leading Noise Canceling with Auto NC Optimizer" },
        { source: "Amazon", title: "Sony WH-1000XM5 - Prime Available - Ships & Sold by Amazon.com", price: 28999, currency: "INR", image: "", link: "#", rating: 4.7, reviews: 12890, originalPrice: 32990, shipping: "Prime 1-Day Free", description: "Wireless Noise Canceling Headphones" },
        { source: "Google Shopping", title: "Sony WH-1000XM5 - Best Buy - Store Pickup", price: 29499, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 2100, shipping: "Free Curbside Pickup" },
        { source: "eBay", title: "Sony WH-1000XM5 - Top Rated Plus Seller - Brand New", price: 30499, currency: "INR", image: "", link: "#", rating: 4.9, reviews: 940, shipping: "Free 3-Day Shipping" },
      ],
      cheapest: { source: "Walmart", price: 27499 },
      fetchedAt: new Date().toISOString(),
    };
  }

  if (q.includes("macbook")) {
    return {
      query,
      results: [
        { source: "Amazon", title: 'MacBook Air M3 13" (8GB RAM, 256GB SSD)', price: 89999, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 5420, shipping: "Prime Delivery", description: "Apple M3 chip, 8-core GPU" },
        { source: "Walmart", title: 'MacBook Air M3 13" 8GB/256GB', price: 92499, currency: "INR", image: "", link: "#", rating: 4.7, reviews: 1200, shipping: "Free Delivery" },
        { source: "Google Shopping", title: "MacBook Air M3 - Apple Store", price: 94999, currency: "INR", image: "", link: "#", rating: 4.9, reviews: 890, shipping: "Store Pickup" },
        { source: "eBay", title: "MacBook Air M3 2024 - New Sealed", price: 99999, currency: "INR", image: "", link: "#", rating: 4.6, reviews: 320, shipping: "Free Shipping" },
      ],
      cheapest: { source: "Amazon", price: 89999 },
      fetchedAt: new Date().toISOString(),
    };
  }

  if (q.includes("playstation") || q.includes("ps5")) {
    return {
      query,
      results: [
        { source: "Walmart", title: "PlayStation 5 Slim Console - Disc Edition", price: 47999, currency: "INR", image: "", link: "#", rating: 4.9, reviews: 8720, shipping: "Free Delivery" },
        { source: "Amazon", title: "PlayStation 5 Slim Disc Console", price: 49999, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 15300, shipping: "Prime Delivery" },
        { source: "eBay", title: "PS5 Slim Disc Edition - New Sealed", price: 51499, currency: "INR", image: "", link: "#", rating: 4.7, reviews: 2100, shipping: "Free Shipping" },
        { source: "Google Shopping", title: "PlayStation 5 Slim - Best Buy", price: 52999, currency: "INR", image: "", link: "#", rating: 4.8, reviews: 3400, shipping: "Store Pickup" },
      ],
      cheapest: { source: "Walmart", price: 47999 },
      fetchedAt: new Date().toISOString(),
    };
  }

  return {
    query,
    results: [
      { source: "eBay", title: `${query} - Top Rated Seller`, price: 16999, currency: "INR", image: "", link: "#", rating: 4.5, reviews: 320, shipping: "Free Shipping" },
      { source: "Walmart", title: `${query} - Free 2-Day Delivery`, price: 18499, currency: "INR", image: "", link: "#", rating: 4.4, reviews: 1200, shipping: "Free Delivery" },
      { source: "Google Shopping", title: `${query} - Verified Retailer`, price: 19499, currency: "INR", image: "", link: "#", rating: 4.6, reviews: 890 },
      { source: "Amazon", title: `${query} - Prime Available`, price: 20499, currency: "INR", image: "", link: "#", rating: 4.7, reviews: 5400, shipping: "Prime Delivery" },
    ],
    cheapest: { source: "eBay", price: 16999 },
    fetchedAt: new Date().toISOString(),
  };
}
