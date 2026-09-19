import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "pricecompare.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_url TEXT DEFAULT '',
        email_verified INTEGER DEFAULT 0,
        verification_token TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        results TEXT,
        source_count INTEGER DEFAULT 0,
        user_id INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS price_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        query TEXT NOT NULL,
        target_price REAL NOT NULL,
        current_price REAL,
        source TEXT DEFAULT '',
        link TEXT DEFAULT '',
        image TEXT DEFAULT '',
        notified INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        data TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS comparisons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        query TEXT NOT NULL,
        products TEXT NOT NULL,
        verdict TEXT DEFAULT '',
        winner TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Phase 2: Price History Infrastructure
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        source TEXT NOT NULL,
        external_url TEXT,
        category TEXT,
        image_url TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(source, external_url)
      );

      CREATE TABLE IF NOT EXISTS price_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'INR',
        checked_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tracked_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        target_price REAL,
        type TEXT DEFAULT 'tracked',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(user_id, product_id)
      );
    `);

    // Migrations: upgrade legacy databases to the current schema
    migrateSchema(db);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_searches_query ON searches(query);
      CREATE INDEX IF NOT EXISTS idx_searches_user ON searches(user_id);
      CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at);
      CREATE INDEX IF NOT EXISTS idx_alerts_user ON price_alerts(user_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_query ON price_alerts(query);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_comparisons_user ON comparisons(user_id);
      -- Phase 2 indexes
      CREATE INDEX IF NOT EXISTS idx_products_source_url ON products(source, external_url);
      CREATE INDEX IF NOT EXISTS idx_price_snapshots_product ON price_snapshots(product_id, checked_at);
      CREATE INDEX IF NOT EXISTS idx_tracked_products_user ON tracked_products(user_id);
    `);

    // Migration: add email_verified and verification_token columns if missing
    try {
      db.exec(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`);
    } catch { /* column exists */ }
    try {
      db.exec(`ALTER TABLE users ADD COLUMN verification_token TEXT`);
    } catch { /* column exists */ }
  }
  return db;
}

function migrateSchema(database: Database.Database): void {
  const columnsOf = (table: string): string[] =>
    database.prepare(`PRAGMA table_info(${table})`).all().map((c) => (c as { name: string }).name);

  // searches.user_id (per-user search history)
  if (!columnsOf("searches").includes("user_id")) {
    database.exec("ALTER TABLE searches ADD COLUMN user_id INTEGER");
  }

  // price_alerts: migrate from legacy user_email-based schema to user_id-based
  const alertCols = columnsOf("price_alerts");
  if (!alertCols.includes("user_id")) {
    database.exec("ALTER TABLE price_alerts ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE");
  }
  if (!alertCols.includes("source")) database.exec("ALTER TABLE price_alerts ADD COLUMN source TEXT DEFAULT ''");
  if (!alertCols.includes("link")) database.exec("ALTER TABLE price_alerts ADD COLUMN link TEXT DEFAULT ''");
  if (!alertCols.includes("image")) database.exec("ALTER TABLE price_alerts ADD COLUMN image TEXT DEFAULT ''");
  if (!alertCols.includes("active")) database.exec("ALTER TABLE price_alerts ADD COLUMN active INTEGER DEFAULT 1");

  // Backfill legacy alerts by matching the old user_email column to a user
  try {
    database.exec(`
      UPDATE price_alerts
      SET user_id = (SELECT u.id FROM users u WHERE u.email = price_alerts.user_email)
      WHERE user_id IS NULL
    `);
  } catch { /* user_email column may not exist on fresh DBs */ }

  // tracked_products: add active and type columns if missing
  const trackedCols = columnsOf("tracked_products");
  if (!trackedCols.includes("active")) database.exec("ALTER TABLE tracked_products ADD COLUMN active INTEGER DEFAULT 1");
  if (!trackedCols.includes("type")) database.exec("ALTER TABLE tracked_products ADD COLUMN type TEXT DEFAULT 'tracked'");
}

// ====== User Operations ======

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  avatar_url: string;
  email_verified: number;
  verification_token: string | null;
  created_at: string;
  updated_at: string;
}

export function createUser(name: string, email: string, passwordHash: string): { id: number } {
  const database = getDb();
  const stmt = database.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
  const result = stmt.run(name, email.toLowerCase(), passwordHash);
  return { id: Number(result.lastInsertRowid) };
}

export function getUserByEmail(email: string): UserRow | undefined {
  const database = getDb();
  return database.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as UserRow | undefined;
}

export function getUserById(id: number): UserRow | undefined {
  const database = getDb();
  return database.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function updateUserProfile(id: number, name: string, avatarUrl?: string): void {
  const database = getDb();
  if (avatarUrl !== undefined) {
    database.prepare("UPDATE users SET name = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?").run(name, avatarUrl, id);
  } else {
    database.prepare("UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, id);
  }
}

// ====== Email Verification Operations ======

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function setVerificationToken(userId: number, token: string): void {
  const database = getDb();
  database.prepare("UPDATE users SET verification_token = ?, updated_at = datetime('now') WHERE id = ?").run(token, userId);
}

export function verifyEmail(token: string): { id: number; email: string; name: string } | null {
  const database = getDb();
  const user = database.prepare("SELECT id, email, name FROM users WHERE verification_token = ?").get(token) as { id: number; email: string; name: string } | undefined;
  if (!user) return null;
  database.prepare("UPDATE users SET email_verified = 1, verification_token = NULL, updated_at = datetime('now') WHERE id = ?").run(user.id);
  return user;
}

export function isEmailVerified(userId: number): boolean {
  const database = getDb();
  const row = database.prepare("SELECT email_verified FROM users WHERE id = ?").get(userId) as { email_verified: number } | undefined;
  return row?.email_verified === 1;
}

export function deleteUser(userId: number): void {
  const database = getDb();
  database.prepare("DELETE FROM users WHERE id = ?").run(userId);
}

// ====== Search Operations ======

export function saveSearch(query: string, results: unknown, sourceCount: number, userId?: number): void {
  try {
    const database = getDb();
    if (userId) {
      database.prepare("INSERT INTO searches (query, results, source_count, user_id) VALUES (?, ?, ?, ?)").run(query, JSON.stringify(results), sourceCount, userId);
    } else {
      database.prepare("INSERT INTO searches (query, results, source_count) VALUES (?, ?, ?)").run(query, JSON.stringify(results), sourceCount);
    }
  } catch (err) {
    console.error("[DB] save search error:", err);
  }
}

export function countUserSearches(userId: number): number {
  try {
    const database = getDb();
    const row = database.prepare("SELECT COUNT(*) as count FROM searches WHERE user_id = ?").get(userId) as { count: number };
    return row.count;
  } catch (err) {
    console.error("[DB] count user searches error:", err);
    return 0;
  }
}

export function getRecentSearches(limit: number = 10, userId?: number): { query: string; created_at: string }[] {
  try {
    const database = getDb();
    if (userId) {
      return database.prepare("SELECT query, created_at FROM searches WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, limit) as { query: string; created_at: string }[];
    }
    return database.prepare("SELECT query, created_at FROM searches ORDER BY created_at DESC LIMIT ?").all(limit) as { query: string; created_at: string }[];
  } catch (err) {
    console.error("[DB] get recent searches error:", err);
    return [];
  }
}

// ====== Price Alert Operations ======

export function createPriceAlert(userId: number, query: string, targetPrice: number, source?: string, link?: string, image?: string): { id: number } {
  const database = getDb();
  const stmt = database.prepare("INSERT INTO price_alerts (user_id, query, target_price, source, link, image) VALUES (?, ?, ?, ?, ?, ?)");
  const result = stmt.run(userId, query, targetPrice, source || "", link || "", image || "");
  return { id: Number(result.lastInsertRowid) };
}

export function getUserAlerts(userId: number): { id: number; query: string; target_price: number; current_price: number | null; source: string; link: string; image: string; active: number; notified: number; created_at: string }[] {
  const database = getDb();
  return database.prepare("SELECT id, query, target_price, current_price, source, link, image, active, notified, created_at FROM price_alerts WHERE user_id = ? AND active = 1 ORDER BY created_at DESC").all(userId) as { id: number; query: string; target_price: number; current_price: number | null; source: string; link: string; image: string; active: number; notified: number; created_at: string }[];
}

export function deletePriceAlert(userId: number, alertId: number): boolean {
  const database = getDb();
  const result = database.prepare("UPDATE price_alerts SET active = 0 WHERE id = ? AND user_id = ?").run(alertId, userId);
  return result.changes > 0;
}

export function updateAlertPrice(alertId: number, currentPrice: number): void {
  const database = getDb();
  database.prepare("UPDATE price_alerts SET current_price = ? WHERE id = ?").run(currentPrice, alertId);
}

// ====== Notification Operations ======

export function createNotification(userId: number, type: string, title: string, message: string, data?: Record<string, unknown>): { id: number } {
  const database = getDb();
  const stmt = database.prepare("INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)");
  const result = stmt.run(userId, type, title, message, JSON.stringify(data || {}));
  return { id: Number(result.lastInsertRowid) };
}

export function getUserNotifications(userId: number, limit: number = 50): { id: number; type: string; title: string; message: string; read: number; data: string; created_at: string }[] {
  const database = getDb();
  return database.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, limit) as { id: number; type: string; title: string; message: string; read: number; data: string; created_at: string }[];
}

export function markNotificationRead(userId: number, notificationId: number): boolean {
  const database = getDb();
  const result = database.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(notificationId, userId);
  return result.changes > 0;
}

export function markAllNotificationsRead(userId: number): void {
  const database = getDb();
  database.prepare("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0").run(userId);
}

export function getUnreadNotificationCount(userId: number): number {
  const database = getDb();
  const row = database.prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0").get(userId) as { count: number };
  return row.count;
}

// ====== Comparison History Operations ======

export function saveComparison(userId: number, query: string, products: unknown, verdict: string, winner: string): { id: number } {
  const database = getDb();
  const stmt = database.prepare("INSERT INTO comparisons (user_id, query, products, verdict, winner) VALUES (?, ?, ?, ?, ?)");
  const result = stmt.run(userId, query, JSON.stringify(products), verdict, winner);
  return { id: Number(result.lastInsertRowid) };
}

export function getUserComparisons(userId: number, limit: number = 20): { id: number; query: string; products: string; verdict: string; winner: string; created_at: string }[] {
  const database = getDb();
  return database.prepare("SELECT * FROM comparisons WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, limit) as { id: number; query: string; products: string; verdict: string; winner: string; created_at: string }[];
}

export function deleteComparison(userId: number, comparisonId: number): boolean {
  const database = getDb();
  const result = database.prepare("DELETE FROM comparisons WHERE id = ? AND user_id = ?").run(comparisonId, userId);
  return result.changes > 0;
}

// ====== Phase 2: Price History Infrastructure ======

export interface ProductRow {
  id: number;
  title: string;
  source: string;
  external_url: string | null;
  category: string | null;
  image_url: string | null;
  created_at: string;
}

export interface PriceSnapshotRow {
  id: number;
  product_id: number;
  price: number;
  currency: string;
  checked_at: string;
}

export interface TrackedProductRow {
  id: number;
  user_id: number;
  product_id: number;
  target_price: number | null;
  type: string;
  created_at: string;
}

/** Upsert a product from a search result, return the product ID */
export function upsertProduct(title: string, source: string, externalUrl: string, imageUrl?: string, category?: string): number {
  const database = getDb();
  try {
    // Try to find existing product by source + URL
    const existing = database.prepare("SELECT id FROM products WHERE source = ? AND external_url = ?").get(source, externalUrl) as { id: number } | undefined;
    if (existing) {
      // Update title/image if changed
      database.prepare("UPDATE products SET title = ?, image_url = ?, category = ? WHERE id = ?").run(title, imageUrl || "", category || "", existing.id);
      return existing.id;
    }
    const stmt = database.prepare("INSERT INTO products (title, source, external_url, image_url, category) VALUES (?, ?, ?, ?, ?)");
    const result = stmt.run(title, source, externalUrl, imageUrl || "", category || "");
    return Number(result.lastInsertRowid);
  } catch {
    // Fallback: maybe race condition, try to find again
    const existing = database.prepare("SELECT id FROM products WHERE source = ? AND external_url = ?").get(source, externalUrl) as { id: number } | undefined;
    if (existing) return existing.id;
    throw new Error("Failed to upsert product");
  }
}

/** Record a price snapshot for a product */
export function insertPriceSnapshot(productId: number, price: number, currency: string = "INR"): { id: number } {
  const database = getDb();
  const stmt = database.prepare("INSERT INTO price_snapshots (product_id, price, currency) VALUES (?, ?, ?)");
  const result = stmt.run(productId, price, currency);
  return { id: Number(result.lastInsertRowid) };
}

/** Get price history for a product (last N days) */
export function getPriceHistory(productId: number, days: number = 30): PriceSnapshotRow[] {
  const database = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return database.prepare(`
    SELECT * FROM price_snapshots 
    WHERE product_id = ? AND checked_at >= ? 
    ORDER BY checked_at ASC
  `).all(productId, cutoff.toISOString()) as PriceSnapshotRow[];
}

/** Get price history with product info for a query (for AI grounding) */
export function getPriceHistoryForQuery(query: string, days: number = 30): { product: ProductRow; snapshots: PriceSnapshotRow[] }[] {
  const database = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  // Find products matching the query (fuzzy match on title)
  const products = database.prepare(`
    SELECT * FROM products 
    WHERE LOWER(title) LIKE ? 
    ORDER BY created_at DESC
  `).all(`%${query.toLowerCase()}%`) as ProductRow[];
  
  return products.map((product) => ({
    product,
    snapshots: database.prepare(`
      SELECT * FROM price_snapshots 
      WHERE product_id = ? AND checked_at >= ? 
      ORDER BY checked_at ASC
    `).all(product.id, cutoff.toISOString()) as PriceSnapshotRow[]
  }));
}

/** Track a product for a user (wishlist/price tracking) */
export function trackProduct(userId: number, productId: number, targetPrice?: number, type: "tracked" | "wishlist" = "tracked"): { id: number } {
  const database = getDb();
  try {
    const stmt = database.prepare("INSERT INTO tracked_products (user_id, product_id, target_price, type) VALUES (?, ?, ?, ?)");
    const result = stmt.run(userId, productId, targetPrice ?? null, type);
    return { id: Number(result.lastInsertRowid) };
  } catch {
    // Already tracked
    const existing = database.prepare("SELECT id FROM tracked_products WHERE user_id = ? AND product_id = ?").get(userId, productId) as { id: number } | undefined;
    if (existing) return existing;
    throw new Error("Failed to track product");
  }
}

/** Untrack a product */
export function untrackProduct(userId: number, productId: number): boolean {
  const database = getDb();
  const result = database.prepare("DELETE FROM tracked_products WHERE user_id = ? AND product_id = ?").run(userId, productId);
  return result.changes > 0;
}

/** Get user's tracked products with price history summary */
export function getUserTrackedProducts(userId: number): { tracking: TrackedProductRow; product: ProductRow; latestPrice: number | null; lowestPrice: number | null }[] {
  const database = getDb();
  const tracked = database.prepare(`
    SELECT tp.*, p.title, p.source, p.external_url, p.image_url, p.category
    FROM tracked_products tp
    JOIN products p ON p.id = tp.product_id
    WHERE tp.user_id = ?
    ORDER BY tp.created_at DESC
  `).all(userId) as (TrackedProductRow & ProductRow)[];
  
  return tracked.map((tp) => {
    const snapshots = database.prepare("SELECT price FROM price_snapshots WHERE product_id = ? ORDER BY checked_at ASC").all(tp.product_id) as { price: number }[];
    const prices = snapshots.map((s) => s.price);
    return {
      tracking: { id: tp.id, user_id: tp.user_id, product_id: tp.product_id, target_price: tp.target_price, type: tp.type, created_at: tp.created_at },
      product: { id: tp.id, title: tp.title, source: tp.source, external_url: tp.external_url, category: tp.category, image_url: tp.image_url, created_at: tp.created_at },
      latestPrice: prices[prices.length - 1] ?? null,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : null
    };
  });
}

/** Get all tracked products (for cron job) */
export function getAllTrackedProducts(): { trackingId: number; userId: number; productId: number; targetPrice: number | null; title: string; source: string; externalUrl: string }[] {
  const database = getDb();
  return database.prepare(`
    SELECT tp.id as trackingId, tp.user_id as userId, tp.product_id as productId, tp.target_price as targetPrice, p.title, p.source, p.external_url as externalUrl
    FROM tracked_products tp
    JOIN products p ON p.id = tp.product_id
    WHERE tp.active IS NULL OR tp.active = 1
  `).all() as { trackingId: number; userId: number; productId: number; targetPrice: number | null; title: string; source: string; externalUrl: string }[];
}
