import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getUserById } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const fullUser = getUserById(user.id);
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        avatar_url: fullUser.avatar_url,
        created_at: fullUser.created_at,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
