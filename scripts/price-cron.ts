import Database from "better-sqlite3";
import path from "path";
import { searchGoogleShopping } from "../lib/services/googleShopping";
import { searchAmazon } from "../lib/services/amazon";
import { searchWalmart } from "../lib/services/walmart";
import { searchEbay } from "../lib/services/ebay";
import { normalizeResult, NormalizedResult } from "../lib/normalize";
import { upsertProduct, insertPriceSnapshot, getAllTrackedProducts, getUserAlerts, createNotification, getUserById } from "../lib/db";
import { sendPriceAlertEmail } from "../lib/email";

// Load environment variables from .env.local
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), ".env.local") });

const DB_PATH = path.join(process.cwd(), "data", "pricecompare.db");

async function runPriceCron() {
  console.log("[Cron] Starting price snapshot job:", new Date().toISOString());
  
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.error("[Cron] SERPAPI_KEY not configured, skipping live price checks");
    db.close();
    return;
  }

  const tracked = getAllTrackedProducts();
  console.log(`[Cron] Found ${tracked.length} tracked products`);

  for (const tp of tracked) {
    try {
      console.log(`[Cron] Checking: ${tp.title} (${tp.source})`);
      
      let results: NormalizedResult[] = [];
      
      // Query the specific source for this product
      // For simplicity, search by title on the same source
      try {
        if (tp.source === "Google Shopping") {
          const raw = await searchGoogleShopping(tp.title, apiKey);
          results = raw.map((r) => normalizeResult("Google Shopping", r));
        } else if (tp.source === "Amazon") {
          const raw = await searchAmazon(tp.title, apiKey);
          results = raw.map((r) => normalizeResult("Amazon", r));
        } else if (tp.source === "Walmart") {
          const raw = await searchWalmart(tp.title, apiKey);
          results = raw.map((r) => normalizeResult("Walmart", r));
        } else if (tp.source === "eBay") {
          const raw = await searchEbay(tp.title, apiKey);
          results = raw.map((r) => normalizeResult("eBay", r));
        }
      } catch (err) {
        console.error(`[Cron] Search failed for ${tp.title}:`, err);
        continue;
      }

      // Find exact match by URL or closest by title
      let match = results.find((r) => r.link === tp.externalUrl);
      if (!match && results.length > 0) {
        match = results[0];
      }
      
      if (!match || match.price <= 0) {
        console.log(`[Cron] No valid price found for ${tp.title}`);
        continue;
      }

      // Record price snapshot
      const productId = upsertProduct(match.title, match.source, match.link, match.image);
      insertPriceSnapshot(productId, match.price, match.currency);
      console.log(`[Cron] Recorded price ₹${match.price} for ${match.title}`);

      // Check price alerts for this user
      const alerts = getUserAlerts(tp.userId);
      for (const alert of alerts) {
        if (alert.active && alert.target_price > 0 && match.price <= alert.target_price && !alert.notified) {
          // Update alert
          db.prepare("UPDATE price_alerts SET current_price = ?, notified = 1 WHERE id = ?").run(match.price, alert.id);
          
          // Create notification
          createNotification(
            tp.userId,
            "price_drop",
            "Price Drop Alert!",
            `"${alert.query}" is now ₹${match.price.toLocaleString("en-IN")} (your target: ₹${alert.target_price.toLocaleString("en-IN")})`,
            { alertId: alert.id, productUrl: match.link, currentPrice: match.price, targetPrice: alert.target_price }
          );
          
          // Send email notification
          const user = getUserById(tp.userId);
          if (user?.email) {
            const emailSent = await sendPriceAlertEmail(
              user.email,
              alert.query,
              alert.target_price,
              match.price,
              match.source,
              match.link
            );
            console.log(`[Cron] Price alert email ${emailSent ? "sent" : "failed"} to ${user.email} for ${alert.query}`);
          }
          
          console.log(`[Cron] Price alert triggered for user ${tp.userId}: ${alert.query}`);
        }
      }
    } catch (err) {
      console.error(`[Cron] Error processing ${tp.title}:`, err);
    }
  }

  db.close();
  console.log("[Cron] Price snapshot job completed:", new Date().toISOString());
}

runPriceCron().catch((err) => {
  console.error("[Cron] Fatal error:", err);
  process.exit(1);
});