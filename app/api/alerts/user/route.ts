import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getUserAlerts, createPriceAlert, deletePriceAlert } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const alerts = getUserAlerts(authUser.id);
    return NextResponse.json({ alerts });
  } catch {
    return NextResponse.json({ error: "Failed to get alerts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { query, targetPrice, source, link, image } = body;

    if (!query || !targetPrice) {
      return NextResponse.json({ error: "query and targetPrice are required" }, { status: 400 });
    }

    const result = createPriceAlert(authUser.id, query, Number(targetPrice), source, link, image);
    return NextResponse.json({ success: true, id: result.id });
  } catch {
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = Number(searchParams.get("id"));
    if (!alertId) {
      return NextResponse.json({ error: "Alert id is required" }, { status: 400 });
    }

    const deleted = deletePriceAlert(authUser.id, alertId);
    return NextResponse.json({ success: deleted });
  } catch {
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
