import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { trackProduct, untrackProduct, getUserTrackedProducts, upsertProduct } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/security";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`track-get:${ip}`, 30, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const authUser = authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const tracked = getUserTrackedProducts(authUser.id);
    return NextResponse.json({ tracked });
  } catch (err) {
    console.error("[Track] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch tracked products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`track-post:${ip}`, 20, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const authUser = authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, title, source, externalUrl, imageUrl, category, targetPrice, type } = body;

    if (!productId && (!title || !source || !externalUrl)) {
      return NextResponse.json({ error: "productId or (title, source, externalUrl) required" }, { status: 400 });
    }

    let pid = productId;
    if (!pid) {
      pid = upsertProduct(title, source, externalUrl, imageUrl, category);
    }

    const result = trackProduct(authUser.id, pid, targetPrice, type || "tracked");
    return NextResponse.json({ success: true, trackingId: result.id });
  } catch (err) {
    console.error("[Track] POST error:", err);
    return NextResponse.json({ error: "Failed to track product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`track-delete:${ip}`, 20, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const authUser = authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }

    const success = untrackProduct(authUser.id, parseInt(productId, 10));
    return NextResponse.json({ success });
  } catch (err) {
    console.error("[Track] DELETE error:", err);
    return NextResponse.json({ error: "Failed to untrack product" }, { status: 500 });
  }
}