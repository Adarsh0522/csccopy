'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, User } from 'lucide-react'

export function Navbar() {
  const [balance, setBalance] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const isTempUser = typeof window !== 'undefined' && localStorage.getItem('temp_user') === 'true'
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (isTempUser) {
        setUserEmail('9876543210 (Test)')
        setBalance(150.00)
        return
      }

      if (user) {
        setUserEmail(user.email ?? null)
        
        // Fetch wallet balance
        const { data } = await supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .single()
          
        if (data) {
          setBalance(data.balance)
        }
      } else {
        router.push('/')
      }
    }
    
    loadData()
  }, [supabase, router])

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('temp_user')
    }
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between no-print transition-all duration-300 shadow-sm">
      <div className="flex items-center">
        <span className="font-bold text-xl text-zinc-800 tracking-tight"></span>
      </div>
      
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/wallet/add-balance" className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-300 transition-all cursor-pointer group">
          <Wallet className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm text-slate-800">
            {balance !== null ? `₹${balance.toFixed(2)}` : '...'}
          </span>
          <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold leading-none group-hover:bg-blue-700 transition-colors ml-1 shadow-sm">+</span>
        </Link>
        
        <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 backdrop-blur-md font-medium">
          <User className="w-4 h-4" />
          <span>{userEmail}</span>
        </div>
        
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out" className="hover:bg-red-50 hover:text-red-600 rounded-full transition-colors duration-300 w-10 h-10">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </nav>
  )
}
