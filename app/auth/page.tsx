"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider/AuthContext";
import Logo from "@/components/Logo";

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const { login, register, resendVerification } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlVerified = searchParams.get("verified") === "true";
  const urlError =
    searchParams.get("error") === "invalid_token"
      ? "Invalid or expired verification link. Please request a new one."
      : searchParams.get("error") === "verify_failed"
      ? "Verification failed. Please try again."
      : "";

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const showVerifyResend = !isSignUp && error.toLowerCase().includes("verify");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResendMessage("");
    setLoading(true);

    if (isSignUp) {
      const result = await register(name, email, password);
      setLoading(false);
      if (result.success) {
        setSignupSuccess(true);
        setEmailSent(result.emailSent !== false);
        setError("");
      } else {
        setError(result.error || "Something went wrong");
      }
    } else {
      const result = await login(email, password);
      setLoading(false);
      if (result.success) {
        router.push("/");
      } else {
        setError(result.error || "Something went wrong");
      }
    }
  };

  const handleResend = async () => {
    setResendMessage("");
    setResending(true);
    const result = await resendVerification(email);
    setResending(false);
    if (result.success || result.emailSent) {
      setResendMessage(result.emailSent ? "A fresh verification link has been sent. Check your inbox (and spam folder)." : "Account found, but the email service rejected sending right now. The app password may be invalid — fix it in .env.local and try again.");
    } else {
      setResendMessage(result.error || "Could not resend the verification email.");
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-outline-variant shadow-card p-8">
      <div className="flex bg-surface-dim rounded-lg p-1 mb-6">
        <button
          onClick={() => { setIsSignUp(false); setError(""); setSignupSuccess(false); }}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${!isSignUp ? "bg-surface text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"}`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setIsSignUp(true); setError(""); setSignupSuccess(false); }}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${isSignUp ? "bg-surface text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"}`}
        >
          Create Free Account
        </button>
      </div>

      {urlVerified && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Email verified! You can now sign in.
        </div>
      )}

      {signupSuccess && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            <div>
              {emailSent ? (
                <>
                  <p className="font-semibold">Check your email!</p>
                  <p className="mt-1">We sent a verification link to <strong>{email}</strong>. Click the link to activate your account, then come back and sign in.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Account created!</p>
                  <p className="mt-1">The verification email could not be sent right now. Click below to resend it to <strong>{email}</strong>.</p>
                </>
              )}
              <button type="button" onClick={handleResend} disabled={resending} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark disabled:opacity-50">
                {resending ? (
                  <>
                    <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Resend verification email
                  </>
                )}
              </button>
              {resendMessage && <p className={`mt-2 text-xs ${resendMessage.startsWith("A fresh") ? "text-emerald-600" : "text-amber-700"}`}>{resendMessage}</p>}
            </div>
          </div>
        </div>
      )}

      {(error || urlError) && (
        <div className="mb-4 p-3 bg-error-bg border border-error/20 rounded-lg text-sm text-error">{error || urlError}</div>
      )}

      {showVerifyResend && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center justify-between gap-2 flex-wrap">
          <span>Need a new link?</span>
          <button type="button" onClick={handleResend} disabled={resending} className="text-xs font-semibold text-primary hover:text-primary-dark px-3 py-1.5 bg-white border border-amber-200 rounded-lg disabled:opacity-50">
            {resending ? "Sending..." : "Resend verification email"}
          </button>
        </div>
      )}

      {resendMessage && !showVerifyResend && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">{resendMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name <span className="text-error">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Verma" className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Email Address</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            </span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Password {isSignUp && <span className="text-error">*</span>}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </span>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isSignUp ? "Minimum 8 characters" : "Enter your password"} className="w-full pl-10 pr-10 py-3 bg-surface border border-outline-variant rounded-lg text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required minLength={8} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
              {showPassword ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            </button>
          </div>
          {isSignUp && password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= passwordStrength ? passwordStrength <= 1 ? "bg-error" : passwordStrength <= 2 ? "bg-amber-500" : passwordStrength <= 3 ? "bg-accent-green" : "bg-accent-green" : "bg-outline-variant"}`} />
                ))}
              </div>
              <p className="text-xs text-text-muted">{passwordStrength <= 1 ? "Weak" : passwordStrength <= 2 ? "Fair" : passwordStrength <= 3 ? "Strong" : "Very strong"}</p>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
          {loading ? "Please wait..." : isSignUp ? "Create Free Account — Start Saving" : "Sign In"}
        </button>
      </form>

      <p className="text-xs text-text-muted text-center mt-5">
        {isSignUp ? "By continuing, you agree to our " : "By continuing, you agree to our "}
        <a href="#" className="text-primary hover:underline">Terms of Use</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal header */}
      <header className="border-b border-outline-variant bg-surface/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center">
            <Logo size="sm" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex">
        {/* Left side - branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />
          <div className="relative z-10 flex flex-col justify-center px-16">
            <div className="inline-flex items-center gap-2 text-white/70 text-xs font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
              LIVE INR TRACKING ENGINE
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Join <span className="text-white/90">150,000+</span> smart Indian shoppers tracking real-time prices.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-md">
              Stop checking five retail apps manually. Set automated price watches across Amazon India, Flipkart, Croma, and Reliance Digital with zero algorithmic markups.
            </p>
            <div className="space-y-4">
              {[
                { icon: "✓", text: "Instant WhatsApp & Email alerts" },
                { icon: "✓", text: "Multi-Merchant Live History" },
                { icon: "✓", text: "Automated Indian Bank Discounts" },
                { icon: "✓", text: "100% Free Forever" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-white/80">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs text-white">{item.icon}</div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <Logo size="lg" />
            </div>

            <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" /></div>}>
              <AuthForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
