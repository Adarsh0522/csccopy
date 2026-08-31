'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Printer, Image as ImageIcon, Camera, FileText, Wallet, User } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'PVC Print', href: '/dashboard/pvc-print', icon: <Printer className="w-5 h-5" /> },
    { name: 'PAN Services', href: '/dashboard/pan-services', icon: <FileText className="w-5 h-5" /> },
    { name: 'Photo Studio', href: '/dashboard/photo-studio', icon: <Camera className="w-5 h-5" /> },
    { name: 'Wallet', href: '/dashboard/wallet', icon: <Wallet className="w-5 h-5" /> },
    { name: 'Profile', href: '/dashboard/profile', icon: <User className="w-5 h-5" /> },
  ]

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col no-print h-screen sticky top-0 shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center relative group">
        <div className="h-14 w-full bg-transparent relative overflow-visible">
          <img src="/logo-horizontal.jpg" alt="CSCCopy Logo" className="w-full h-full object-contain object-left animate-logo-heartbeat" />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {link.icon}
              </div>
              <span>{link.name}</span>
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center font-medium">
        &copy; 2026 CSCCopy
      </div>
    </aside>
  )
}
