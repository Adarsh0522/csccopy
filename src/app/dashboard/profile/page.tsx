'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const isTempUser = typeof window !== 'undefined' && localStorage.getItem('temp_user') === 'true'
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (isTempUser) {
        setEmail('9876543210 (Test User)')
      } else if (user) {
        setEmail(user.email ?? 'No email associated')
      }
      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('temp_user')
    }
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-100 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-slate-500 font-medium">Manage your account settings and preferences.</p>
        </div>

        <Card className="border-slate-200 shadow-sm bg-white ring-1 ring-slate-900/5 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <CardContent className="relative px-8 pb-8 pt-0">
            <div className="absolute -top-12 left-8 w-24 h-24 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-blue-600">
              <User className="w-10 h-10" />
            </div>
            
            <div className="mt-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900">
                  {loading ? 'Loading...' : 'CSCCopy User'}
                </h2>
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Mail className="w-4 h-4" />
                  <span>{loading ? '...' : email}</span>
                </div>
              </div>
              
              <Button onClick={handleSignOut} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white ring-1 ring-slate-900/5">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-lg">Security & Plan</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1">Current Plan</p>
                <p className="font-bold text-slate-900">Standard Retailer</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1">Account Status</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <p className="font-bold text-slate-900">Active & Verified</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
