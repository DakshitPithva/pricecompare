import { NextRequest, NextResponse } from "next/server";
import { comparePassword, generateToken } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import { isValidEmail, rateLimit, getClientIp, corsHeaders } from "@/lib/security";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`login:${ip}`, 10, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const user = getUserByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check if email is verified
    if (user.email_verified !== 1) {
      return NextResponse.json({ error: "Please verify your email before signing in. Check your inbox for the verification link." }, { status: 403 });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[Auth] login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
