import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import Footer from "@/components/Footer";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Cheapest First Always",
    desc: "We highlight the absolute lowest total checkout cost, factoring in shipping, delivery surcharges, and instant coupon codes. No sponsored rank-boosting.",
    link: "Sort Algorithm: Total Net Cost",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.915-1.242a4.5 4.5 0 00-6.364-6.364L5.757 8.25a4.5 4.5 0 006.364 6.364l4.5-4.5z" />
      </svg>
    ),
    title: "Zero Account Required",
    desc: "Instant direct links out to the actual verified merchant listing. We never lock prices behind paywalls, phone verification forms, or forced newsletters.",
    link: "Direct Merchant Forwarding",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
      </svg>
    ),
    title: "Fault-Tolerant Engine",
    desc: "Even if an upstream retailer times out or triggers rate-limits, you get instant partial feeds in milliseconds while secondary nodes continue polling.",
    link: "99.98% Feed Availability",
  },
];

const stats = [
  { value: "₹4.2 Cr+", label: "Saved by Smart Shoppers This Month" },
  { value: "15 Min", label: "Index Refresh Cycle" },
  { value: "4.9 ★", label: "Trust Score (8K+ Ratings)" },
  { value: "4 Stores", label: "Integrated Live in India" },
];

const testimonials = [
  {
    quote: "Saved ₹18,400 on my LG OLED TV purchase. I was about to click buy on Amazon during Great Indian Festival, but this tool found a cheaper price on Reliance Digital with an extra HDFC offline parity coupon.",
    name: "Rohan M.",
    location: "Bengaluru, Karnataka",
  },
  {
    quote: "The 90-day price history graph exposed a fake 40% discount on a microwave oven. It turned out the seller had doubled the MRP two days prior. This tool is essential.",
    name: "Priya K.",
    location: "New Delhi",
  },
  {
    quote: "No login required to get instant quotes is gold. Fast, minimal, and does one thing extraordinarily well without ad banners cluttering the screen.",
    name: "Siddharth M.",
    location: "Mumbai, Maharashtra",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-surface-container-low to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-accent-green-bg)_0%,_transparent_60%)] opacity-40" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
            {/* Live indicator */}
            <div className="flex justify-center mb-6 animate-fade-in-down">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary bg-surface border border-outline-variant rounded-full px-4 py-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                Live comparison across Google Shopping, Amazon, Walmart &amp; eBay
              </span>
            </div>

            <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight leading-[1.1] mb-5 animate-fade-in-up">
              Find the lowest price
              <br />
              <span className="text-primary">in seconds.</span>
            </h1>
            <p className="text-center text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animation-delay-100">
              Compare 4 major retail networks simultaneously with automated price indexing.
              No affiliate bias, zero sponsor prioritization, pure real-time sorted savings.
            </p>

            <div className="max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              <SearchBar />
            </div>

            <div className="flex items-center justify-center gap-6 mt-5 text-xs text-text-muted animate-fade-in-up animation-delay-300">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                4 sources checked in &lt; 1.2s
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                100% Free &amp; Unbiased
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                Automated SerpApi Cache Sync
              </span>
            </div>
          </div>
        </section>

        {/* Coverage Network */}
        <section className="border-y border-outline-variant bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Coverage Network:</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-google" /> Google Shopping <span className="text-accent-green text-xs font-medium">Live</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amazon" /> Amazon India <span className="text-accent-green text-xs font-medium">Live</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-walmart" /> Walmart <span className="text-accent-green text-xs font-medium">Live</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ebay" /> eBay <span className="text-accent-green text-xs font-medium">Live</span></span>
              <span className="text-text-muted hidden sm:inline">|</span>
              <span className="text-text-muted hidden sm:inline text-xs">Normalized SerpApi JSON pipeline &bull; Zero scrape spoofing</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="bg-surface border border-outline-variant rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center text-primary mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{f.desc}</p>
                <a href="#" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                  {f.link} &rarr;
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="bg-surface-dim border-y border-outline-variant">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">{s.value}</p>
                  <p className="text-sm text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Voice of the Consumer</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-10">Tested and Loved by Smart Buyers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-surface border border-outline-variant rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-text-secondary italic leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-text-primary rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.05)_0%,_transparent_60%)]" />
            <div className="relative z-10">
              <p className="text-xs font-semibold text-accent-green uppercase tracking-wider mb-2">100% Free &amp; Unbiased Forever</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Start Saving On Your Next Purchase</h2>
              <p className="text-text-muted max-w-lg mx-auto mb-8">
                Stop hopping between 5 different browser tabs. One search reveals true bottom-line pricing with verified coupons and logistics.
              </p>
              <div className="max-w-md mx-auto">
                <SearchBar compact />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
