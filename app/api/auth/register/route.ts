import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { createUser, getUserByEmail, createNotification, generateVerificationToken, setVerificationToken } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { isValidEmail, isValidPassword, sanitizeInput, rateLimit, getClientIp, corsHeaders } from "@/lib/security";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`register:${ip}`, 5, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const cleanName = sanitizeInput(name);
    const cleanEmail = email.toLowerCase().trim();

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json({ error: "Name must be 2-100 characters" }, { status: 400 });
    }

    const existing = getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = createUser(cleanName, cleanEmail, passwordHash);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    setVerificationToken(user.id, verificationToken);

    // Create welcome notification
    createNotification(user.id, "system", "Welcome to PriceCompare!", "You've joined 150,000+ smart shoppers. Start comparing prices now!");

    // Send verification email
    const emailSent = await sendVerificationEmail(cleanEmail, cleanName, verificationToken);
    if (!emailSent) {
      console.error("[Auth] verification email failed to send for", cleanEmail);
    }

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? "Account created. Please check your email to verify your account before signing in."
        : "Account created, but the verification email could not be sent right now. You can resend it from the sign-in screen.",
    }, { status: 201 });
  } catch (err) {
    console.error("[Auth] register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
