'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { subscribeToWallet } from '@/lib/realtime'
import { Mail, Bell, Wallet, HelpCircle } from 'lucide-react'

export function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let unsubscribeWallet: (() => void) | null = null

    async function loadData() {
      const isTempUser = typeof window !== 'undefined' && localStorage.getItem('temp_user') === 'true'
      
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('temp_user')
        }
        setUserEmail(user.email ?? user.phone ?? 'User')
        setUserName(user.user_metadata?.business_name || user.user_metadata?.full_name || 'CSC Operator')

        const fetchBalance = async () => {
          try {
            const { data: walletData } = await supabase
              .from('wallet')
              .select('balance')
              .eq('user_id', user.id)
              .maybeSingle()

            if (walletData && walletData.balance != null) {
              setWalletBalance(Number(walletData.balance))
            }
          } catch (err) {
            console.error('Failed to fetch wallet balance:', err)
          }
        }

        // 1. Initial fetch
        await fetchBalance()

        // 2. Real-time subscription (Postgres changes, BroadcastChannel, CustomEvents, Heartbeat)
        unsubscribeWallet = subscribeToWallet(user.id, (newBalance) => {
          if (newBalance !== undefined && newBalance !== null) {
            setWalletBalance(Number(newBalance))
          } else {
            fetchBalance()
          }
        })

        return
      }
      
      if (isTempUser) {
        setUserEmail('admin@csccopy.com')
        setUserName('CSC Operator')
        setWalletBalance(150.00)
        return
      }

      router.push('/')
    }
    
    loadData()

    return () => {
      if (unsubscribeWallet) {
        unsubscribeWallet()
      }
    }
  }, [supabase, router])

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm px-8 py-5 flex items-center justify-between no-print w-full shrink-0">
      
      {/* Left: Branding/Empty Space */}
      <div className="flex-1"></div>
      
      {/* Right: Actions & Profile */}
      <div className="flex items-center space-x-4">
        
        {/* Wallet Balance & Icon Buttons */}
        <div className="flex items-center space-x-4 pr-4 border-r border-gray-200">
          
          <Link 
            href="/dashboard/wallet" 
            className="hidden sm:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm hover:bg-emerald-100 transition-all duration-300 group"
          >
            <Wallet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-emerald-700 text-sm tracking-tight transition-all">
              ₹ {walletBalance.toFixed(2)}
            </span>
          </Link>

          <a 
            href="https://wa.me/918169431433" 
            target="_blank" 
            rel="noopener noreferrer"
            title="Help & Support"
            className="group flex items-center bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white h-10 rounded-full transition-all duration-300 ease-out overflow-hidden w-10 hover:w-[105px] px-2.5 gap-2 border border-emerald-100 hover:border-emerald-600 shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="font-bold text-sm tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Support</span>
          </a>
          <button className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm group relative">
            <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
        
        {/* Profile */}
        <Link href="/dashboard/profile" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-0.5 shadow-sm">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white">
               {/* Default Avatar Illustration */}
               <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="36" height="36"><mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" fill="#FFFFFF" rx="72"></rect></mask><g mask="url(#mask__beam)"><rect width="36" height="36" fill="#047857"></rect><rect x="0" y="0" width="36" height="36" transform="translate(-5 -5) rotate(199 18 18) scale(1)" fill="#10b981" rx="6"></rect><g transform="translate(1 -3) rotate(9 18 18)"><path d="M15 19c2 1 4 1 6 0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"></path><rect x="11" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect><rect x="23" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect></g></g></svg>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-gray-900 leading-tight">{userName}</div>
            <div className="text-[11px] font-medium text-gray-500">{userEmail}</div>
          </div>
        </Link>
        
      </div>
    </nav>
  )
}
