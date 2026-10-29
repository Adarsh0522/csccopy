import Link from 'next/link'
import { FileQuestion, Home, LayoutDashboard, HelpCircle, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: '404 - Page Not Found | CSCCopy',
  description: 'The page you are looking for does not exist or has been moved.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10 text-center relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-100 rounded-full blur-3xl pointer-events-none opacity-60" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-100 rounded-full blur-3xl pointer-events-none opacity-60" />

        {/* 404 Badge & Icon */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <FileQuestion className="w-10 h-10" strokeWidth={1.75} />
          </div>
          <span className="absolute -top-2 -right-3 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-xs">
            404
          </span>
        </div>

        {/* Headings */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mt-2.5 leading-relaxed">
          We&apos;re sorry, the page you are looking for doesn&apos;t exist, has been removed, or is temporarily unavailable.
        </p>
        <p className="text-slate-400 text-xs mt-1">
          Please check the URL or navigate using the buttons below.
        </p>

        {/* Main Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all duration-150"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all duration-150"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>

        {/* Need Help Link */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>Need assistance?</span>
          <Link
            href="/dashboard/help"
            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Contact Support
          </Link>
        </div>

      </div>
    </div>
  )
}

