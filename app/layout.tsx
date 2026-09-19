import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PriceCompare — Multi-Platform Price Comparison",
    template: "%s | PriceCompare",
  },
  description: "Find the lowest price across Google Shopping, Amazon, Walmart, and eBay. Compare prices in real-time with automated price indexing.",
  keywords: ["price comparison", "shopping", "best price", "Amazon", "Walmart", "eBay", "Google Shopping", "India", "INR"],
  authors: [{ name: "PriceCompare" }],
  creator: "PriceCompare",
  publisher: "PriceCompare",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://pricecompare.example.com",
    siteName: "PriceCompare",
    title: "PriceCompare — Multi-Platform Price Comparison",
    description: "Find the lowest price across Google Shopping, Amazon, Walmart, and eBay.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PriceCompare" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PriceCompare — Multi-Platform Price Comparison",
    description: "Find the lowest price across Google Shopping, Amazon, Walmart, and eBay.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
