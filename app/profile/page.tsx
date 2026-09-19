"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider/AuthContext";

interface ProfileData {
  user: { id: number; name: string; email: string; avatar_url: string; created_at: string };
  stats: { total_searches: number; active_alerts: number; unread_notifications: number };
  recent_searches: { query: string; created_at: string }[];
  alerts: { id: number; query: string; target_price: number; current_price: number | null; source: string; link: string; image: string; active: number; created_at: string }[];
  comparisons: { id: number; query: string; products: string; verdict: string; winner: string; created_at: string }[];
}

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) setProfile(data);
        })
        .catch(() => {});
    }
  }, [user]);

  if (authLoading || !user || !profile) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" /></div>;
  }

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setEditingName(false);
    setSaving(false);
    window.location.reload();
  };

  const handleDeleteAlert = async (alertId: number) => {
    await fetch(`/api/alerts/user?id=${alertId}`, { method: "DELETE" });
    setProfile((prev) => prev ? { ...prev, alerts: prev.alerts.filter((a) => a.id !== alertId) } : prev);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Profile Header */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-surface-dim border-2 border-outline-variant flex items-center justify-center text-xl font-bold text-text-primary">
              {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-text-primary">{user.name}</h1>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <p className="text-sm text-text-muted">{user.email}</p>
              <p className="text-xs text-text-muted mt-1">Member since {user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Recently"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setName(user.name); setEditingName(true); }} className="px-4 py-2 text-sm font-medium text-text-secondary border border-outline-variant rounded-lg hover:bg-surface-dim transition-colors">Edit Profile</button>
              <button onClick={() => { logout(); router.push("/"); }} className="px-4 py-2 text-sm font-medium text-error bg-error-bg border border-error/20 rounded-lg hover:bg-error/10 transition-colors">Sign Out</button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-outline-variant">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{profile.stats?.total_searches ?? 0}</p>
              <p className="text-xs text-text-muted">Total Searches</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{profile.stats?.active_alerts ?? 0}</p>
              <p className="text-xs text-text-muted">Active Alerts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{profile.stats?.unread_notifications ?? 0}</p>
              <p className="text-xs text-text-muted">Unread Notifications</p>
            </div>
          </div>
        </div>

        {/* Edit Name Modal */}
        {editingName && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold text-text-primary mb-4">Edit Profile Name</h3>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setEditingName(false)} className="flex-1 py-2.5 text-sm font-medium border border-outline-variant rounded-lg hover:bg-surface-dim">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Searches */}
          <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-2xl p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Recent Searches</h2>
            {(!profile.recent_searches || profile.recent_searches.length === 0) ? (
              <p className="text-sm text-text-muted">No searches yet. Start comparing prices!</p>
            ) : (
              <div className="space-y-2">
                {profile.recent_searches.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-dim rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => router.push(`/results?q=${encodeURIComponent(s.query)}`)}>
                    <span className="text-sm text-text-primary">{s.query}</span>
                    <span className="text-xs text-text-muted">{new Date(s.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price Alerts */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Price Alerts</h2>
            {(!profile.alerts || profile.alerts.length === 0) ? (
              <p className="text-sm text-text-muted">No active alerts. Set one from the results page!</p>
            ) : (
              <div className="space-y-3">
                {profile.alerts.map((a) => (
                  <div key={a.id} className="p-3 bg-surface-dim rounded-lg">
                    <p className="text-sm font-medium text-text-primary truncate">{a.query}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-text-muted">Target: ₹{a.target_price.toLocaleString("en-IN")}</span>
                      <button onClick={() => handleDeleteAlert(a.id)} className="text-xs text-error hover:underline">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comparison History */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⚖️</span>
            <h2 className="text-lg font-bold text-text-primary">Comparison History</h2>
          </div>
          {(!profile.comparisons || profile.comparisons.length === 0) ? (
            <p className="text-sm text-text-muted">No comparisons yet. Select products on the results page and click &quot;AI Compare Selected&quot;!</p>
          ) : (
            <div className="space-y-3">
              {profile.comparisons.map((c) => {
                let productNames: string[] = [];
                try {
                  const prods = JSON.parse(c.products);
                  productNames = Array.isArray(prods) ? prods.map((p: { title?: string; name?: string }) => p.title || p.name || "Product") : [];
                } catch { /* ignore */ }
                return (
                  <div key={c.id} className="p-4 bg-surface-dim rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-text-primary">{c.query}</p>
                      <span className="text-xs text-text-muted">{new Date(c.created_at).toLocaleDateString("en-IN")}</span>
                    </div>
                    <p className="text-xs text-text-muted mb-1">
                      Compared {productNames.length} products: {productNames.slice(0, 3).join(", ")}{productNames.length > 3 ? "..." : ""}
                    </p>
                    {c.winner && (
                      <p className="text-xs text-primary font-medium">Winner: {c.winner}</p>
                    )}
                    {c.verdict && (
                      <p className="text-xs text-text-secondary mt-1 italic">{c.verdict}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
