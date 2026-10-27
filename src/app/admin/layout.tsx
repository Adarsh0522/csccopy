'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FileText, Settings, ArrowLeft, LogOut } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

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
      const { count } = await supabase
        .from('service_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending')
      
      setPendingCount(count || 0)
    }

    fetchPendingCount()

    const channel = supabase
      .channel('layout_pending_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_applications' }, () => {
        fetchPendingCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAuthorized, supabase])

  if (!isAuthorized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100">
        <div className="animate-pulse text-emerald-600 font-medium">Verifying access...</div>
      </div>
    )
  }

  // Render raw children without sidebar if it's the login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="h-screen w-screen bg-slate-100 flex overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white flex flex-col h-full relative border-r border-slate-200">
        <div className="p-6 flex items-center shrink-0 border-b border-slate-100">
          <Link href="/admin/services" className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">Admin<span className="text-emerald-600">Panel</span></span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Link href="/admin/services" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Manage Services
          </Link>
          <Link href="/admin/applications" className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors font-medium">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              Applications
            </div>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingCount} New
              </span>
            )}
          </Link>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/admin/login')
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors font-medium mb-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors font-medium">
            <ArrowLeft className="w-5 h-5" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 relative overflow-hidden shadow-inner">
        <main className="flex-1 overflow-auto relative p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  )
}
