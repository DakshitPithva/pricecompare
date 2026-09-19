"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider/AuthContext";
import Logo from "@/components/Logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/results", label: "Search Results" },
  { href: "/notifications", label: "Notifications" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-surface-dim text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-dim/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-text-muted bg-surface-dim px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              SerpApi Engine Operational
            </span>

            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-dim transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-text-primary hidden sm:inline">{user.name.split(" ")[0]}</span>
                </Link>
                <button onClick={logout} className="text-xs text-text-muted hover:text-error transition-colors px-2 py-1">Logout</button>
              </div>
            ) : (
              <Link href="/auth" className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
