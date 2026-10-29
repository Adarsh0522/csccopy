import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Mail, Phone, MapPin, ExternalLink } from 'lucide-react'

interface LegalLayoutProps {
  title: string
  subtitle: string
  lastUpdated?: string
  activeSlug: 'privacy-policy' | 'terms-and-conditions' | 'refund-policy' | 'shipping-policy' | 'contact'
  children: React.ReactNode
}

export default function LegalLayout({
  title,
  subtitle,
  lastUpdated = 'October 28, 2026',
  activeSlug,
  children,
}: LegalLayoutProps) {
  const navItems = [
    { name: 'Privacy Policy', href: '/privacy-policy', slug: 'privacy-policy' },
    { name: 'Terms & Conditions', href: '/terms-and-conditions', slug: 'terms-and-conditions' },
    { name: 'Refund & Cancellation', href: '/refund-policy', slug: 'refund-policy' },
    { name: 'Shipping & Delivery', href: '/shipping-policy', slug: 'shipping-policy' },
    { name: 'Contact Us', href: '/contact', slug: 'contact' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-emerald-600 transition-colors">
                CSCCopy
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400 ml-2">
                by Aryan Enterprises
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors border border-emerald-200"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/help"
              className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition-colors"
            >
              Help & Support
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Title Section */}
      <div className="bg-white border-b border-slate-200 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Legal & Compliance Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-2">
            {subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
            <span>Entity: <strong className="text-slate-700">Aryan Enterprises</strong></span>
            <span>•</span>
            <span>Platform: <strong className="text-slate-700">CSCCopy (csccopy.online)</strong></span>
            <span>•</span>
            <span>Last Updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area with Legal Navigation */}
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-slate-200 scrollbar-none">
          {navItems.map((item) => {
            const isActive = item.slug === activeSlug
            return (
              <Link
                key={item.slug}
                href={item.href}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900'
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Legal Text Body */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs prose prose-slate max-w-none text-sm sm:text-base leading-relaxed">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 mt-auto border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="font-bold text-white text-sm mb-2">Aryan Enterprises (CSCCopy)</div>
              <p className="text-slate-400 leading-relaxed text-xs">
                Suresh Nagar, near Railway station middle bridge,<br />
                Diva east, Thane, Maharashtra - 400612, India.
              </p>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="text-slate-300 font-semibold mb-1">Customer Support</div>
              <p>Email: <a href="mailto:ranjit@csccopy.online" className="text-emerald-400 hover:underline">ranjit@csccopy.online</a></p>
              <p>Phone / WhatsApp: <a href="https://wa.me/918169431433" className="text-emerald-400 hover:underline">+91 8169431433</a></p>
              <p>Working Hours: Mon - Sat (9:00 AM - 8:00 PM IST)</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <p>© {new Date().getFullYear()} Aryan Enterprises. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link href="/terms-and-conditions" className="hover:text-slate-300 transition-colors">Terms</Link>
              <Link href="/refund-policy" className="hover:text-slate-300 transition-colors">Refund Policy</Link>
              <Link href="/shipping-policy" className="hover:text-slate-300 transition-colors">Shipping</Link>
              <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

