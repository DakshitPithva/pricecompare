import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getUserNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const notifications = getUserNotifications(authUser.id);
    const unreadCount = getUnreadNotificationCount(authUser.id);

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ error: "Failed to get notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      markAllNotificationsRead(authUser.id);
    } else if (notificationId) {
      markNotificationRead(authUser.id, notificationId);
    }

    const unreadCount = getUnreadNotificationCount(authUser.id);
    return NextResponse.json({ success: true, unreadCount });
  } catch {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
