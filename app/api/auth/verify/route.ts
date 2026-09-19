import { NextRequest, NextResponse } from "next/server";
import { verifyEmail } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth?error=invalid_token", request.url));
  }

  try {
    const result = verifyEmail(token);
    if (!result) {
      return NextResponse.redirect(new URL("/auth?error=invalid_token", request.url));
    }
    return NextResponse.redirect(new URL("/auth?verified=true", request.url));
  } catch (err) {
    console.error("[Auth] verify error:", err);
    return NextResponse.redirect(new URL("/auth?error=verify_failed", request.url));
  }
}
