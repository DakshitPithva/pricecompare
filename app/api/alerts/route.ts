import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { createPriceAlert, getUserAlerts, deletePriceAlert } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/security";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`alerts-get:${ip}`, 30, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const authUser = authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const alerts = getUserAlerts(authUser.id);
    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("[Alerts] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`alerts-post:${ip}`, 20, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const authUser = authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { query, targetPrice, source, link, image } = body;

    if (!query || !targetPrice) {
      return NextResponse.json({ error: "query and targetPrice are required" }, { status: 400 });
    }

    const result = createPriceAlert(authUser.id, query, Number(targetPrice), source, link, image);
    return NextResponse.json({ success: true, alertId: result.id });
  } catch (err) {
    console.error("[Alerts] POST error:", err);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`alerts-delete:${ip}`, 20, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const authUser = authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("alertId");

    if (!alertId) {
      return NextResponse.json({ error: "alertId required" }, { status: 400 });
    }

    const success = deletePriceAlert(authUser.id, parseInt(alertId, 10));
    return NextResponse.json({ success });
  } catch (err) {
    console.error("[Alerts] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}