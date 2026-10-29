'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, ArrowRight, Loader2, CheckCircle2, MessageCircle, Layers, User, Mail, Building2, UserPlus, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [otp, setOtp] = useState('')

  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          router.replace('/dashboard')
          return
        }
      } catch (err) {
        console.error(err)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [supabase, router])

  const getFormattedPhone = () => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length === 10) return `+91${cleanPhone}`
    return cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`
  }

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfoMessage(null)

    try {
      const formattedPhone = getFormattedPhone()

      if (mode === 'login') {
        // Attempt login for existing user (do NOT create user if not registered)
        const { error: authError } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options: {
            shouldCreateUser: false
          }
        })

        if (authError) {
          // If user doesn't exist, switch to register mode and ask for details
          const isNotRegistered = 
            authError.status === 422 || 
            authError.message.toLowerCase().includes('signups not allowed') ||
            authError.message.toLowerCase().includes('user not found')

          if (isNotRegistered) {
            setMode('register')
            setInfoMessage('New user detected! Please fill your Full Name, Email, and Business Name to create an account.')
            setLoading(false)
            return
          }

          throw authError
        }

        setStep('otp')
      } else {
        // Register mode: validation
        if (!fullName.trim()) {
          throw new Error('Please enter your full name')
        }
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please enter a valid email address')
        }
        if (!businessName.trim()) {
          throw new Error('Please enter your business or center name')
        }

        const { error: authError } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options: {
            shouldCreateUser: true,
            data: {
              full_name: fullName.trim(),
              email: email.trim(),
              business_name: businessName.trim()
            }
          }
        })

        if (authError) throw authError

        setStep('otp')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formattedPhone = getFormattedPhone()

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      })

      if (verifyError) throw verifyError

      if (data.user) {
        // If register mode, ensure metadata is fully updated
        if (mode === 'register') {
          await supabase.auth.updateUser({
            data: {
              full_name: fullName.trim(),
              email: email.trim(),
              business_name: businessName.trim()
            }
          })
          router.push('/dashboard')
          router.refresh()
          return
        }

        // Check if existing user needs to complete profile
        const hasCompleteProfile = 
          Boolean(data.user.user_metadata?.full_name?.trim()) && 
          Boolean(data.user.user_metadata?.business_name?.trim())

        if (!hasCompleteProfile) {
          router.push('/dashboard/profile?complete=true')
          router.refresh()
          return
        }

        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
      {/* MAIN WRAPPER CARD */}
      <div className="w-full max-w-6xl min-h-[750px] flex flex-col lg:flex-row bg-emerald-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative">

        {/* LEFT PANEL - Dark Theme (50%) */}
        <div className="w-full lg:w-1/2 flex flex-col p-10 lg:p-14 relative z-0 h-[50vh] overflow-y-auto lg:h-auto lg:overflow-visible">

          {/* Subtle Background Rings/Gradients */}
          <div className="absolute top-10 left-10 w-[400px] h-[400px] border border-white/5 rounded-full pointer-events-none"></div>
          <div className="absolute top-24 left-24 w-[280px] h-[280px] border border-white/5 rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>

          {/* Top Intro Text */}
          <div className="text-emerald-100/70 font-medium text-sm tracking-wide mb-8 pt-2">
            Smart tools for CSC Operators — 100% Secure.
          </div>

          {/* Center Content */}
          <div className="my-auto pb-12">
            <h1 className="text-4xl lg:text-[2.8rem] font-bold text-white leading-[1.1] tracking-tight mb-14">
              The Ultimate <br /> All-in-One Portal <br /> for CSC Operators.
            </h1>

            {/* Feature List */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10 mt-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-[16px]">Smart PVC Print</h3>
                  <p className="text-emerald-100/60 text-[15px] mt-0.5 leading-snug">1-click auto-crop & align for standard CR80 PVC.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10 mt-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-[16px]">PAN Generator</h3>
                  <p className="text-emerald-100/60 text-[15px] mt-0.5 leading-snug">Instant automated PDFs for New PAN and Corrections.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10 mt-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-[16px]">Free Photo Studio</h3>
                  <p className="text-emerald-100/60 text-[15px] mt-0.5 leading-snug">Free editing tools to Remove BG, Crop, and Compress.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10 mt-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-[16px]">100% Client-Side Privacy</h3>
                  <p className="text-emerald-100/60 text-[15px] mt-0.5 leading-snug">No documents are saved on our servers. Ultimate security for your customers.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10 mt-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-[16px]">Instant Wallet System</h3>
                  <p className="text-emerald-100/60 text-[15px] mt-0.5 leading-snug">Add funds securely via PayU and enjoy seamless 1-click deductions.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL - White Auth Card (50%) */}
        <div className="w-full lg:w-1/2 bg-white rounded-[2.5rem] lg:rounded-l-[2.5rem] p-8 lg:p-14 flex flex-col justify-between shadow-[-10px_0_30px_rgba(0,0,0,0.1)] relative z-10">

          {/* Top Row: Logo & Sign Up Toggle */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <img src="/logo-horizontal.jpg" alt="CSCCopy Logo" className="h-18 sm:h-20 w-auto" />
            </div>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
                setInfoMessage(null)
              }}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors text-[15px]"
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </div>

          {/* Center Auth Form */}
          <div className="w-full h-full flex flex-col justify-center items-center py-4 flex-1">
            <div className="w-full max-w-md w-full">

              {step === 'form' ? (
                <>
                  {/* Segmented Tab Controls */}
                  <div className="flex p-1 bg-gray-100 rounded-xl mb-6 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login')
                        setError(null)
                        setInfoMessage(null)
                      }}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                        mode === 'login'
                          ? 'bg-white text-emerald-800 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Log In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register')
                        setError(null)
                        setInfoMessage(null)
                      }}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                        mode === 'register'
                          ? 'bg-white text-emerald-800 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  <div className="text-center mb-8">
                    <h2 className="text-3xl lg:text-4xl font-medium text-gray-900 mb-2 tracking-tight">
                      {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-gray-500 text-[15px]">
                      {mode === 'login'
                        ? 'Enter your mobile number to get WhatsApp OTP.'
                        : 'Join CSCCopy in just a minute.'}
                    </p>
                  </div>

                  {infoMessage && (
                    <div className="mb-6 p-4 text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl text-left font-medium flex items-start gap-3 shadow-sm">
                      <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{infoMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleRequestOtp} className="space-y-4 w-full">
                    {error && (
                      <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl text-center font-medium">
                        {error}
                      </div>
                    )}

                    {mode === 'register' && (
                      <>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            type="text"
                            placeholder="Full Name"
                            className="pl-12 h-14 bg-white border-gray-300 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-transparent text-[15px] text-gray-900 rounded-xl transition-all shadow-sm"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            type="email"
                            placeholder="Email Address"
                            className="pl-12 h-14 bg-white border-gray-300 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-transparent text-[15px] text-gray-900 rounded-xl transition-all shadow-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Building2 className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            type="text"
                            placeholder="Business / CSC Center Name"
                            className="pl-12 h-14 bg-white border-gray-300 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-transparent text-[15px] text-gray-900 rounded-xl transition-all shadow-sm"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            required
                          />
                        </div>
                      </>
                    )}

                    {/* Composite Mobile Number Input */}
                    <div className="flex h-14 rounded-xl border border-gray-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-emerald-600 focus-within:border-transparent overflow-hidden transition-all group">
                      <div className="bg-gray-50 border-r border-gray-300 px-4 flex items-center justify-center pointer-events-none">
                        <span className="font-semibold text-gray-500 text-[15px]">+91</span>
                      </div>
                      <input
                        type="tel"
                        placeholder="Mobile Number"
                        className="flex-1 bg-transparent border-none outline-none px-4 text-[15px] text-gray-900 font-medium placeholder-gray-400"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        required
                        maxLength={10}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-14 text-[16px] font-medium bg-gradient-to-r from-emerald-700 to-emerald-600 hover:opacity-90 text-white rounded-xl shadow-[0_8px_20px_rgba(4,_120,_87,_0.2)] transition-all border-none mt-2"
                      disabled={
                        loading ||
                        phone.length < 10 ||
                        (mode === 'register' && (!fullName.trim() || !email.trim() || !businessName.trim()))
                      }
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <span className="flex items-center">
                          {mode === 'login' ? 'Send OTP via WhatsApp' : 'Create Account & Send OTP'}
                          <ArrowRight className="inline ml-2 w-4 h-4" />
                        </span>
                      )}
                    </Button>

                    {/* Toggle Form Link inside the form area */}
                    <div className="text-center pt-2">
                      <p className="text-gray-500 text-[15px]">
                        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button
                          type="button"
                          onClick={() => {
                            setMode(mode === 'login' ? 'register' : 'login')
                            setError(null)
                            setInfoMessage(null)
                          }}
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          {mode === 'login' ? 'Sign Up' : 'Log In'}
                        </button>
                      </p>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="mb-10 text-center">
                    <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                      <MessageCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-medium text-gray-900 mb-3 tracking-tight">Check WhatsApp</h2>
                    <p className="text-[15px] text-gray-500">
                      We've sent a 6-digit OTP to <br /><span className="font-semibold text-gray-900">+91 {phone}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-6 w-full">
                    {error && (
                      <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl text-center font-medium">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-end px-1 mb-2">
                        <Label className="text-gray-500 font-medium text-[14px]">One Time Password</Label>
                        <button
                          type="button"
                          onClick={() => { setStep('form'); setOtp(''); setError(null); }}
                          className="text-[13px] text-emerald-700 font-bold hover:underline"
                        >
                          Change Number?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          type="text"
                          placeholder="123456"
                          className="pl-12 h-14 bg-white border-gray-300 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-transparent text-2xl tracking-[0.5em] font-mono font-bold text-center text-gray-900 rounded-xl transition-all shadow-sm"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          required
                          maxLength={6}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-14 text-[16px] font-medium bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 text-white rounded-xl shadow-[0_8px_20px_rgba(16,_185,_129,_0.2)] transition-all border-none mt-2"
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Verify & Login'}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Bottom Footer Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[13px] text-gray-400 font-medium pt-8 mt-auto border-t border-gray-100 gap-3">
            <p>© {new Date().getFullYear()} Aryan Enterprises (CSCCopy)</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <a href="/terms-and-conditions" className="hover:text-emerald-600 transition-colors">Terms</a>
              <a href="/privacy-policy" className="hover:text-emerald-600 transition-colors">Privacy Policy</a>
              <a href="/refund-policy" className="hover:text-emerald-600 transition-colors">Refund Policy</a>
              <a href="/contact" className="hover:text-emerald-600 transition-colors">Contact</a>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
