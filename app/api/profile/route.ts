import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getUserById, updateUserProfile, getRecentSearches, getUserAlerts, getUnreadNotificationCount, getUserComparisons, countUserSearches } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = getUserById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let searches: { query: string; created_at: string }[] = [];
    let totalSearches = 0;
    let alerts: { id: number; query: string; target_price: number; current_price: number | null; source: string; link: string; image: string; active: number; created_at: string }[] = [];
    let comparisons: { id: number; query: string; products: string; verdict: string; winner: string; created_at: string }[] = [];
    let unreadCount = 0;

    try { searches = getRecentSearches(10, authUser.id); } catch (e) { console.error("[Profile] searches error:", e); }
    try { totalSearches = countUserSearches(authUser.id); } catch (e) { console.error("[Profile] count searches error:", e); }
    try { alerts = getUserAlerts(authUser.id); } catch (e) { console.error("[Profile] alerts error:", e); }
    try { comparisons = getUserComparisons(authUser.id, 10); } catch (e) { console.error("[Profile] comparisons error:", e); }
    try { unreadCount = getUnreadNotificationCount(authUser.id); } catch (e) { console.error("[Profile] notifications error:", e); }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url || "",
        created_at: user.created_at,
      },
      stats: {
        total_searches: totalSearches,
        active_alerts: alerts.length,
        unread_notifications: unreadCount,
      },
      recent_searches: searches,
      alerts,
      comparisons,
    });
  } catch (err) {
    console.error("[Profile] GET error:", err);
    return NextResponse.json({ error: "Failed to get profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Name must be 2-100 characters" }, { status: 400 });
    }

    updateUserProfile(authUser.id, name.trim());

    return NextResponse.json({ success: true, user: { id: authUser.id, name: name.trim(), email: authUser.email } });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
