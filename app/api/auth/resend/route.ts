import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createNotification, generateVerificationToken, setVerificationToken, isEmailVerified } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { isValidEmail, rateLimit, getClientIp, corsHeaders } from "@/lib/security";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`resend:${ip}`, 5, 60000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many resend attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const email = body.email;

    if (!email || !isValidEmail(email.toLowerCase().trim())) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = getUserByEmail(cleanEmail);

    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    if (isEmailVerified(user.id)) {
      return NextResponse.json({ error: "This email is already verified. You can sign in now." }, { status: 400 });
    }

    const verificationToken = generateVerificationToken();
    setVerificationToken(user.id, verificationToken);
    createNotification(user.id, "system", "Verification email sent", `We sent a fresh verification link to ${user.email}.`);

    const sent = await sendVerificationEmail(user.email, user.name, verificationToken);
    if (!sent) {
      return NextResponse.json(
        { emailSent: false, message: "Account found, but the verification email could not be sent right now. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({ emailSent: true, message: `A fresh verification link has been sent to ${user.email}.` });
  } catch (err) {
    console.error("[Auth] resend error:", err);
    return NextResponse.json({ error: "Failed to resend verification email" }, { status: 500 });
  }
}