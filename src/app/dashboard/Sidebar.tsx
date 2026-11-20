'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Printer, Camera, FileText, Wallet, User, HelpCircle, LogOut, Activity, IdCard, Loader2, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [pvcTitle, setPvcTitle] = useState('PVC Print')
  const [panTitle, setPanTitle] = useState('PAN Form Generator')

  useEffect(() => {
    const fetchCoreTitles = async () => {
      try {
        const { data } = await supabase
          .from('services')
          .select('title, form_schema')
        
        if (data && data.length > 0) {
          const pvc = data.find((s: any) => 
            s.form_schema?.[0]?.core_tool === 'pvc_print' || 
            s.title?.toLowerCase().trim() === 'pvc print' ||
            (s.title?.toLowerCase().includes('pvc') && (!s.form_schema || s.form_schema.length <= 1))
          )
          const pan = data.find((s: any) => 
            s.form_schema?.[0]?.core_tool === 'pan_services' || 
            s.title?.toLowerCase().trim() === 'pan services' || 
            s.title?.toLowerCase().trim() === 'pan form generator' ||
            ((s.title?.toLowerCase().trim() === 'pan' || s.title?.toLowerCase().startsWith('pan form')) && (!s.form_schema || s.form_schema.length <= 1))
          )
          if (pvc?.title) setPvcTitle(pvc.title)
          if (pan?.title) setPanTitle(pan.title)
        }
      } catch (err) {
        console.error('Failed to load sidebar core titles:', err)
      }
    }
    fetchCoreTitles()
  }, [])

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
    { name: pvcTitle, href: '/dashboard/pvc-print', icon: <Printer className="w-5 h-5" /> },
    { name: panTitle, href: '/dashboard/pan-services', icon: <IdCard className="w-5 h-5" /> },
  ]

  const generalLinks = [
    { name: 'Activity', href: '/dashboard/activity', icon: <Activity className="w-5 h-5" /> },
    { name: 'Wallet', href: '/dashboard/wallet', icon: <Wallet className="w-5 h-5" /> },
    { name: 'Profile', href: '/dashboard/profile', icon: <User className="w-5 h-5" /> },
    { name: 'Help', href: '/dashboard/help', icon: <HelpCircle className="w-5 h-5" /> },
  ]

  return (
    <aside className="w-[276px] min-w-[276px] bg-[#13112c]/95 backdrop-blur-md flex flex-col no-print h-full relative border-r border-indigo-500/20 shrink-0 text-white shadow-xl">
      {/* Logo Area */}
      <div className="h-[72px] px-6 flex items-center shrink-0 border-b border-indigo-500/20">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/20 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white group-hover:text-purple-200 transition-colors">
            CSCCopy
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">

        {/* MENU Section */}
        <div className="mb-8 mt-5">
          <h3 className="text-xs font-extrabold tracking-wider text-indigo-300/70 uppercase mb-3 px-4">Menu</h3>
          <nav className="space-y-1.5">
            {menuLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 leading-tight ${isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25'
                    : 'text-indigo-100/85 font-semibold hover:bg-indigo-500/15 hover:text-white'
                    }`}
                >
                  <div className={`shrink-0 ${isActive ? 'text-white' : 'text-indigo-300'}`}>
                    {link.icon}
                  </div>
                  <span className="text-[15px] font-bold leading-tight truncate min-w-0 flex-1">{link.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* GENERAL Section */}
        <div className="mb-8">
          <h3 className="text-xs font-extrabold tracking-wider text-indigo-300/70 uppercase mb-3 px-4">General</h3>
          <nav className="space-y-1.5">
            {generalLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 leading-tight ${isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25'
                    : 'text-indigo-100/85 font-semibold hover:bg-indigo-500/15 hover:text-white'
                    }`}
                >
                  <div className={`shrink-0 ${isActive ? 'text-white' : 'text-indigo-300'}`}>
                    {link.icon}
                  </div>
                  <span className="text-[15px] font-bold leading-tight truncate min-w-0 flex-1">{link.name}</span>
                </Link>
              )
            })}

            {/* Logout Button */}
            <button 
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-rose-300/90 font-bold hover:bg-rose-500/15 hover:text-rose-200 group cursor-pointer disabled:opacity-60 text-left"
            >
              <div className="shrink-0 text-rose-400 group-hover:text-rose-300">
                {isLoggingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </div>
              <span className="text-[15px] leading-tight">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </nav>
        </div>
      </div>
    </aside>
  )
}
