import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "pithvadaxit1@gmail.com",
    pass: process.env.EMAIL_PASS || "edej svyy kgel ncfw",
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"PriceCompare" <${process.env.EMAIL_USER || "pithvadaxit1@gmail.com"}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (err) {
    console.error("[Email] send failed:", err);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Welcome to PriceCompare — Start Saving Today!",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #006948; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PriceCompare</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #0f172a; margin-top: 0;">Welcome, ${name}!</h2>
          <p style="color: #334155; line-height: 1.6;">
            You've just joined <strong>150,000+ smart shoppers</strong> who compare prices across Google Shopping, Amazon, Walmart, and eBay.
          </p>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46; font-weight: 600;">Here's what you can do:</p>
            <ul style="color: #334155; margin: 10px 0 0 0;">
              <li>Compare prices across 4 major retailers instantly</li>
              <li>Set price drop alerts for products you want</li>
              <li>Track your search history and savings</li>
            </ul>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" style="display: inline-block; background: #006948; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px;">
            Start Comparing Prices
          </a>
        </div>
        <div style="background: #f8f9ff; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
          <p>© ${new Date().getFullYear()} PriceCompare. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Verify Your PriceCompare Account",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #006948; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PriceCompare</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #0f172a; margin-top: 0;">Verify Your Email</h2>
          <p style="color: #334155; line-height: 1.6;">
            Hi ${name}, thanks for signing up! Please click the button below to verify your email address and activate your account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="display: inline-block; background: #006948; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${verifyUrl}" style="color: #006948; word-break: break-all;">${verifyUrl}</a>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        <div style="background: #f8f9ff; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
          <p>© ${new Date().getFullYear()} PriceCompare. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

export async function sendPriceAlertEmail(
  email: string,
  productName: string,
  targetPrice: number,
  currentPrice: number,
  source: string,
  link: string
): Promise<boolean> {
  const savings = targetPrice - currentPrice;
  return sendEmail({
    to: email,
    subject: `Price Drop Alert: ${productName} is now ₹${currentPrice.toLocaleString("en-IN")}!`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #006948; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PriceCompare</h1>
        </div>
        <div style="padding: 30px;">
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 5px 0; color: #065f46; font-weight: 600; font-size: 14px;">PRICE DROP DETECTED</p>
            <p style="margin: 0; color: #065f46; font-size: 28px; font-weight: 700;">₹${currentPrice.toLocaleString("en-IN")}</p>
            <p style="margin: 5px 0 0 0; color: #10b981; font-size: 14px;">Save ₹${savings.toLocaleString("en-IN")} vs your target</p>
          </div>
          <h2 style="color: #0f172a; margin-top: 0;">${productName}</h2>
          <p style="color: #334155; line-height: 1.6;">
            The price has dropped below your target of <strong>₹${targetPrice.toLocaleString("en-IN")}</strong>!
          </p>
          <p style="color: #64748b; font-size: 14px;">
            Found on: <strong>${source}</strong>
          </p>
          <a href="${link}" style="display: inline-block; background: #006948; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px;">
            Buy Now
          </a>
        </div>
        <div style="background: #f8f9ff; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
          <p>© ${new Date().getFullYear()} PriceCompare. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}
