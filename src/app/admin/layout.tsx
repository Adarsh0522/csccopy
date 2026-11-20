'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FileText, Settings, ArrowLeft, LogOut, Users } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { subscribeToApplications } from '@/lib/realtime'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Skip auth check if we are on the login page
    if (pathname === '/admin/login') {
      setIsAuthorized(true)
      return
    }

    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/admin/login')
      } else {
        setIsAuthorized(true)
      }
    }
    
    checkAdmin()
  }, [router, pathname, supabase.auth])

  useEffect(() => {
    if (!isAuthorized) return

    const fetchPendingCount = async () => {
      try {
        const { count } = await supabase
          .from('service_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending')
        
        setPendingCount(count || 0)
      } catch (err) {
        console.error('Failed to fetch pending count:', err)
      }
    }

    fetchPendingCount()

    const unsubscribe = subscribeToApplications(() => {
      fetchPendingCount()
    })

    return () => {
      unsubscribe()
    }
  }, [isAuthorized, supabase])

  if (!isAuthorized) {
    return (
      <div 
        className="h-screen w-screen flex items-center justify-center text-white"
        style={{ background: 'linear-gradient(135deg, #0d0b21 0%, #161338 50%, #1e1b4b 100%)' }}
      >
        <div className="animate-pulse text-emerald-400 font-bold flex items-center gap-2">
          Verifying access...
        </div>
      </div>
    )
  }

  // Render raw children without sidebar if it's the login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div 
      className="h-screen w-screen flex overflow-hidden text-white"
      style={{ background: 'linear-gradient(135deg, #0d0b21 0%, #161338 50%, #1e1b4b 100%)' }}
    >
      {/* Admin Sidebar */}
      <aside className="w-64 bg-[#13112c]/95 backdrop-blur-md flex flex-col h-full relative border-r border-indigo-500/20">
        <div className="p-6 flex items-center shrink-0 border-b border-indigo-500/20">
          <Link href="/admin/services" className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <Settings className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">Admin<span className="text-emerald-400">Panel</span></span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          <Link 
            href="/admin/services" 
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
              pathname === '/admin/services' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/25' 
                : 'text-indigo-100/85 hover:bg-indigo-500/15 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Manage Services
          </Link>

          <Link 
            href="/admin/applications" 
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
              pathname.startsWith('/admin/applications') 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/25' 
                : 'text-indigo-100/85 hover:bg-indigo-500/15 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              Applications
            </div>
            {pendingCount > 0 && (
              <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                pathname.startsWith('/admin/applications')
                  ? 'bg-slate-950/40 text-slate-950 border border-slate-950/20'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse'
              }`}>
                {pendingCount} New
              </span>
            )}
          </Link>

          <Link 
            href="/admin/users" 
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
              pathname.startsWith('/admin/users') 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/25' 
                : 'text-indigo-100/85 hover:bg-indigo-500/15 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            Users
          </Link>
        </div>

        <div className="p-4 border-t border-indigo-500/20">
          <button 
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/admin/login')
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors font-semibold mb-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
          <Link href="/dashboard" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-indigo-200/70 hover:text-white hover:bg-indigo-500/15 transition-colors font-semibold">
            <ArrowLeft className="w-5 h-5" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <main className="flex-1 overflow-auto relative p-6 lg:p-10 text-white">
          {children}
        </main>
      </div>
    </div>
  )
}
