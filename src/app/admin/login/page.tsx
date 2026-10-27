'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, LogIn, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email, 
      password: password 
    })

    if (error) {
      alert(error.message)
      setIsLoading(false)
    } else {
      // Login successful!
      router.push('/admin/services')
    }
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-600/20 mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin<span className="text-emerald-600">Panel</span></h1>
          <p className="text-slate-500 mt-2 font-medium">Secure Access Required</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-8 sm:p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Admin Email</Label>
              <Input 
                required 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="h-12 bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20 px-4" 
                placeholder="admin@csc.com" 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Password</Label>
              <div className="relative">
                <Input 
                  required 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="h-12 bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20 px-4 pl-11" 
                  placeholder="••••••••" 
                />
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all duration-300"
            >
              {isLoading ? 'Verifying...' : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Internal CSC System</p>
          </div>
        </div>
      </div>
    </div>
  )
}
