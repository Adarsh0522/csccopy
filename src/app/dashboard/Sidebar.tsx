'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Printer, Camera, FileText, Wallet, User, HelpCircle, LogOut, Activity, IdCard, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('temp_user')
      }
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  const menuLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'PVC Print', href: '/dashboard/pvc-print', icon: <Printer className="w-5 h-5" /> },
    { name: 'PAN Form Generator', href: '/dashboard/pan-services', icon: <IdCard className="w-5 h-5" /> },
  ]

  const generalLinks = [
    { name: 'Activity', href: '/dashboard/activity', icon: <Activity className="w-5 h-5" /> },
    { name: 'Wallet', href: '/dashboard/wallet', icon: <Wallet className="w-5 h-5" /> },
    { name: 'Profile', href: '/dashboard/profile', icon: <User className="w-5 h-5" /> },
    { name: 'Help', href: '/dashboard/help', icon: <HelpCircle className="w-5 h-5" /> },
  ]

  return (
    <aside className="w-64 bg-white flex flex-col no-print h-full relative">
      {/* Logo Area */}
      <div className="py-0 px-6 flex items-center shrink-0 border-b border-transparent">
        <img src="/logo-horizontal.jpg" alt="CSCCopy Logo" className="h-22 sm:h-22 w-auto max-w-[180px] object-contain object-left" />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">

        {/* MENU Section */}
        <div className="mb-8 mt-4">
          <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4 px-4">Menu</h3>
          <nav className="space-y-1">
            {menuLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl transition-all duration-300 ${isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  {/* Left Accent Line (Only visible when active) */}
                  {isActive && <div className="absolute left-4 w-1 h-6 bg-emerald-600 rounded-r-md" />}

                  <div className={`${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {link.icon}
                  </div>
                  <span className="text-[15px]">{link.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* GENERAL Section */}
        <div className="mb-8">
          <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4 px-4">General</h3>
          <nav className="space-y-1">
            {generalLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl transition-all duration-300 ${isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  {isActive && <div className="absolute left-4 w-1 h-6 bg-emerald-600 rounded-r-md" />}
                  <div className={`${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {link.icon}
                  </div>
                  <span className="text-[15px]">{link.name}</span>
                </Link>
              )
            })}

            {/* Logout Button */}
            <button 
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl transition-all duration-300 text-gray-500 hover:bg-red-50 hover:text-red-600 group cursor-pointer disabled:opacity-60"
            >
              <div className="text-gray-400 group-hover:text-red-500">
                {isLoggingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </div>
              <span className="text-[15px]">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </nav>
        </div>
      </div>
    </aside>
  )
}
