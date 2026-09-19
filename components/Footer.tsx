import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-surface-dim border-t border-outline-variant mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="mb-3">
              <Logo size="sm" />
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Independent Multi-Merchant Real-Time Index. Comparing live prices across Google Shopping, Amazon, Walmart, and eBay with automated cache &amp; SerpApi integration.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Coverage Network</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-google" />
                Google Shopping <span className="text-accent-green text-xs">Live</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amazon" />
                Amazon <span className="text-accent-green text-xs">Live</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-walmart" />
                Walmart <span className="text-accent-green text-xs">Live</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ebay" />
                eBay <span className="text-accent-green text-xs">Live</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Links</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Use</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API Status</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <p>&copy; {new Date().getFullYear()} PriceCompare Technologies. All rights reserved.</p>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-green" />
            SerpApi Engine Operational
          </span>
        </div>
      </div>
    </footer>
  );
}
