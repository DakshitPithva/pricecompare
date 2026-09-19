"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider/AuthContext";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: number;
  data: string;
  created_at: string;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetch("/api/notifications").then((r) => r.json()).then((d) => {
        setNotifications(d.notifications);
        setUnreadCount(d.unreadCount);
      }).catch(() => {});
    }
  }, [user]);

  const markRead = async (id: number) => {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: 1 } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    setUnreadCount(0);
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const typeIcon = (type: string) => {
    switch (type) {
      case "price_drop": return { bg: "bg-accent-green-bg", color: "text-accent-green", icon: "↓" };
      case "alert": return { bg: "bg-amber-50", color: "text-amber-600", icon: "!" };
      case "system": return { bg: "bg-blue-50", color: "text-blue-600", icon: "i" };
      default: return { bg: "bg-surface-dim", color: "text-text-muted", icon: "•" };
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
            <p className="text-sm text-text-muted mt-1">Real-time price drop triggers and system updates.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={markAllRead} className="px-4 py-2 text-sm font-medium text-text-secondary border border-outline-variant rounded-lg hover:bg-surface-dim transition-colors">Mark all as read</button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === "all" ? "bg-text-primary text-white" : "bg-surface-dim text-text-secondary border border-outline-variant"}`}>
            All <span className="ml-1 text-xs opacity-70">{notifications.length}</span>
          </button>
          <button onClick={() => setFilter("unread")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === "unread" ? "bg-text-primary text-white" : "bg-surface-dim text-text-secondary border border-outline-variant"}`}>
            Unread <span className="ml-1 text-xs opacity-70">{unreadCount}</span>
          </button>
        </div>

        {/* Notification list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-outline-variant rounded-2xl">
              <p className="text-text-muted text-sm">No notifications yet.</p>
            </div>
          ) : (
            filtered.map((n) => {
              const icon = typeIcon(n.type);
              return (
                <div key={n.id} onClick={() => !n.read && markRead(n.id)} className={`bg-surface border rounded-xl p-5 transition-all cursor-pointer hover:shadow-card-hover ${n.read ? "border-outline-variant" : "border-primary/20 bg-primary/5"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${icon.bg} ${icon.color} flex-shrink-0`}>
                      {icon.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-text-primary">{n.title}</h3>
                        <div className="flex items-center gap-2">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                          <span className="text-xs text-text-muted whitespace-nowrap">{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
