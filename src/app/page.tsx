'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Lock, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  User, 
  Smartphone, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Zap, 
  Headphones, 
  Star, 
  MessageSquare, 
  KeyRound, 
  RefreshCw,
  HelpCircle,
  FileCheck2,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'login' | 'register' | 'forgot' | 'legacy-setup'

export default function HomePage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Form Fields
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [otp, setOtp] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  // UI States
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState<1 | 2>(1) // For register and forgot multi-step
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  // 1. Initial auth check: If user already logged in, redirect straight to /dashboard
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          router.replace('/dashboard')
          return
        }
      } catch (err) {
        console.error('Session check error:', err)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [supabase, router])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  const formatCleanPhone = (val: string) => val.replace(/\D/g, '').slice(0, 10)
  
  const getE164Phone = () => {
    const clean = phone.replace(/\D/g, '')
    if (clean.length === 10) return `+91${clean}`
    if (clean.startsWith('91') && clean.length === 12) return `+${clean}`
    return clean.startsWith('+') ? clean : `+91${clean}`
  }

  // Helper to switch modes and clear states
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setStep(1)
    setError(null)
    setSuccessMessage(null)
    setOtp('')
    setPassword('')
    setConfirmPassword('')
  }

  // =========================================================================
  // FLOW A: Login with Mobile Number + Password (with Legacy User Detection)
  // =========================================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const clean = phone.replace(/\D/g, '')
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }
    if (!password || password.length < 4) {
      setError('Please enter your password')
      return
    }

    setLoading(true)

    try {
      const formattedPhone = getE164Phone()

      // Call our secure backend API to check credentials & legacy status
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, password })
      })

      const data = await res.json()

      // CASE 2: Legacy OTP-Only User Migration
      if (data.requiresPasswordSetup) {
        // Trigger WhatsApp OTP to their phone so they can set password
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options: { shouldCreateUser: false }
        })

        if (otpError) {
          // If Supabase says user does not exist in auth either:
          if (otpError.message.toLowerCase().includes('user not found') || (otpError as any).status === 422) {
            setError('No account found with this mobile number. Please register first.')
            setLoading(false)
            return
          }
          throw otpError
        }

        // Switch to legacy setup view
        setMode('legacy-setup')
        setResendCountdown(60)
        setSuccessMessage('Existing account verified! We have sent a WhatsApp OTP to set your new password.')
        setLoading(false)
        return
      }

      // Check if backend returned invalid password
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Invalid mobile number or password')
      }

      // CASE 1: Password matched in database!
      // Sign in to Supabase GoTrue Auth to establish the session cookies for /dashboard
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password: password
      })

      if (authError) {
        // Fallback: If auth.users password was not synchronized yet, trigger quick WhatsApp OTP setup
        console.warn('GoTrue signInWithPassword error, migrating auth password:', authError.message)
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options: { shouldCreateUser: false }
        })
        if (!otpErr) {
          setMode('legacy-setup')
          setResendCountdown(60)
          setSuccessMessage('Please verify your WhatsApp OTP to complete password synchronization.')
          setLoading(false)
          return
        }
        throw authError
      }

      // Login successful!
      if (authData.user) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  // =========================================================================
  // FLOW B: Registration (Mandatory WhatsApp OTP)
  // =========================================================================
  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!fullName.trim()) {
      setError('Please enter your full name')
      return
    }
    const clean = phone.replace(/\D/g, '')
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const formattedPhone = getE164Phone()

      // 1. Check if user already exists
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      })
      const checkData = await checkRes.json()

      if (checkData.exists && checkData.hasPassword) {
        setError('This mobile number is already registered! Please login.')
        setLoading(false)
        return
      }

      // 2. Send WhatsApp OTP via Supabase Auth
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: fullName.trim()
          }
        }
      })

      if (otpError) throw otpError

      setStep(2)
      setResendCountdown(60)
      setSuccessMessage(`WhatsApp OTP sent to +91 ${clean}! Enter code below.`)
    } catch (err: any) {
      console.error('Registration OTP error:', err)
      setError(err.message || 'Failed to send WhatsApp OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit WhatsApp OTP')
      return
    }

    setLoading(true)

    try {
      const formattedPhone = getE164Phone()

      // 1. Verify OTP with Supabase Auth
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp.trim(),
        type: 'sms'
      })

      if (verifyError) throw verifyError

      if (!authData.user) {
        throw new Error('Authentication failed. Please try again.')
      }

      // 2. Set the permanent password in Supabase Auth
      await supabase.auth.updateUser({
        password: password,
        data: {
          full_name: fullName.trim()
        }
      })

      // 3. Save password hash and user info in public.users via backend API
      await fetch('/api/auth/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          phone: formattedPhone,
          fullName: fullName.trim(),
          password: password
        })
      })

      // Registration complete! Redirect straight to /dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Registration verification error:', err)
      setError(err.message || 'Invalid WhatsApp OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // =========================================================================
  // FLOW C: Forgot / Set Password (WhatsApp OTP Reset)
  // =========================================================================
  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const clean = phone.replace(/\D/g, '')
    if (clean.length !== 10) {
      setError('Please enter your 10-digit registered mobile number')
      return
    }

    setLoading(true)

    try {
      const formattedPhone = getE164Phone()

      // Send OTP via Supabase Auth
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { shouldCreateUser: false }
      })

      if (otpError) {
        if (otpError.message.toLowerCase().includes('user not found') || (otpError as any).status === 422) {
          setError('No registered account found with this mobile number. Please register.')
          setLoading(false)
          return
        }
        throw otpError
      }

      setStep(2)
      setResendCountdown(60)
      setSuccessMessage(`WhatsApp OTP sent to +91 ${clean}! Enter code and new password.`)
    } catch (err: any) {
      console.error('Forgot password OTP error:', err)
      setError(err.message || 'Failed to send reset OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit WhatsApp OTP')
      return
    }
    if (password.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const formattedPhone = getE164Phone()

      // 1. Verify OTP with Supabase Auth
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp.trim(),
        type: 'sms'
      })

      if (verifyError) throw verifyError

      if (!authData.user) {
        throw new Error('Authentication failed. Please try again.')
      }

      // 2. Update password in Supabase Auth
      await supabase.auth.updateUser({
        password: password
      })

      // 3. Update password_hash in public.users via backend API
      await fetch('/api/auth/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          phone: formattedPhone,
          fullName: authData.user.user_metadata?.full_name || 'CSC Operator',
          password: password
        })
      })

      setSuccessMessage('Password updated successfully! Logging you in...')
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1000)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(err.message || 'Failed to reset password. Please check OTP.')
    } finally {
      setLoading(false)
    }
  }

  // =========================================================================
  // Legacy User Password Setup Action
  // =========================================================================
  const handleLegacyPasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit WhatsApp OTP')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const formattedPhone = getE164Phone()

      // 1. Verify OTP
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp.trim(),
        type: 'sms'
      })

      if (verifyError) throw verifyError

      if (!authData.user) {
        throw new Error('Verification failed. Please try again.')
      }

      // 2. Set permanent password in Supabase Auth
      await supabase.auth.updateUser({
        password: password
      })

      // 3. Save to public.users table
      await fetch('/api/auth/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          phone: formattedPhone,
          fullName: authData.user.user_metadata?.full_name || 'CSC Operator',
          password: password
        })
      })

      setSuccessMessage('Password set successfully! Redirecting to dashboard...')
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 800)
    } catch (err: any) {
      console.error('Legacy password setup error:', err)
      setError(err.message || 'Failed to verify OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP helper
  const handleResendOtp = async () => {
    if (resendCountdown > 0) return
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      const formattedPhone = getE164Phone()
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { shouldCreateUser: mode === 'register' }
      })

      if (otpErr) throw otpErr

      setResendCountdown(60)
      setSuccessMessage('New WhatsApp OTP sent successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131136]">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#13112b] relative text-white selection:bg-purple-600 selection:text-white"
      style={{
        backgroundColor: '#13112b',
        background: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(135deg, #13112b 0%, #1e1b4b 45%, #312e81 100%)',
        backgroundSize: '28px 28px, 100% 100%',
        minHeight: '100vh',
      }}
    >
      {/* Ambient Lighting Orbs */}
      <div className="w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] absolute -top-20 -left-20 pointer-events-none" />
      <div className="w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[140px] absolute top-1/3 right-0 pointer-events-none" />
      <div className="w-[400px] h-[400px] rounded-full bg-teal-500/15 blur-[100px] absolute -bottom-10 left-1/4 pointer-events-none" />

      {/* TOP NAVIGATION BAR */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-3 sm:py-4 flex items-center justify-between relative z-20">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/20 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white group-hover:text-purple-200 transition-colors">
            CSCCopy
          </span>
        </Link>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/918169431433?text=Hello%20CSCCopy%20Support"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>WhatsApp Support</span>
          </a>

          {mode === 'login' ? (
            <button
              onClick={() => switchMode('register')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full backdrop-blur-md transition-all duration-200 shadow-sm flex items-center gap-2 cursor-pointer hover:border-purple-400"
            >
              <User className="w-4 h-4 text-purple-300" />
              <span>Create a new account</span>
            </button>
          ) : (
            <button
              onClick={() => switchMode('login')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full backdrop-blur-md transition-all duration-200 shadow-sm flex items-center gap-2 cursor-pointer hover:border-purple-400"
            >
              <span>Back to Login</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN TWO-COLUMN CONTAINER */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-2 sm:py-4 flex-1 flex items-center relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: HERO SECTION WITH MASCOT & PROPS                             */}
          {/* ========================================================================= */}
          <div className="md:col-span-6 lg:col-span-7 flex flex-col justify-center space-y-4 lg:pr-4">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-amber-300 text-xs font-extrabold tracking-wide self-start backdrop-blur-md shadow-sm">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>TRUSTED DIGITAL SERVICE PORTAL</span>
            </div>

            {/* Bold Hero Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.12] tracking-tight">
              Sab kuch ek hi <br />
              jagah,{' '}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                fast & easy.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl">
              PAN, Aadhaar, Voter, Driving Licence aur LL Exam Pass jaisi saari services ek hi portal par. Login karo aur kaam shuru karo.
            </p>

            {/* Mascot & Props Visual Graphic */}
            <div className="relative pt-4 pb-2 select-none">
              
              {/* Floating Props Badge 1 - 100% Secure */}
              <div className="absolute top-2 left-0 sm:left-4 z-20 bg-slate-900/85 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center gap-2.5 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[12px] font-extrabold text-white">100% Secure</div>
                  <div className="text-[10px] text-slate-300 font-medium">Protected login</div>
                </div>
              </div>

              {/* Floating Props Badge 2 - Instant Service */}
              <div className="absolute top-1/2 -translate-y-1/2 right-0 sm:right-2 z-20 bg-slate-900/85 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <div className="text-[12px] font-extrabold text-white">Instant Service</div>
                  <div className="text-[10px] text-slate-300 font-medium">Quick processing</div>
                </div>
              </div>

              {/* Floating Props Badge 3 - 24x7 Support */}
              <div className="absolute bottom-6 left-2 sm:left-6 z-20 bg-slate-900/85 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[12px] font-extrabold text-white">24x7 Support</div>
                  <div className="text-[10px] text-slate-300 font-medium">Always with you</div>
                </div>
              </div>

              {/* Vector Digital Character & Desk Illustration */}
              <div className="relative w-full max-w-lg mx-auto flex items-end justify-center min-h-[220px] sm:min-h-[260px]">
                
                {/* Speech Bubble pointing to the right */}
                <div className="absolute -top-3 right-4 sm:right-10 z-30 bg-white text-slate-900 text-xs sm:text-sm font-black px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-1.5 whitespace-nowrap animate-bounce border-2 border-purple-200">
                  <span>Login karo 👉 Yahan details daalo</span>
                  <div className="absolute -bottom-2 right-8 w-3.5 h-3.5 bg-white rotate-45 border-r-2 border-b-2 border-purple-200" />
                </div>

                {/* Highly Polished SVG Matching Reference Character & Props */}
                <svg viewBox="0 0 460 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[340px] sm:max-w-[400px] max-h-[250px] sm:max-h-[270px] h-auto drop-shadow-2xl">
                  <defs>
                    <linearGradient id="laptopGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#312e81" />
                      <stop offset="100%" stopColor="#1e1b4b" />
                    </linearGradient>
                    <linearGradient id="hoodieGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                    <linearGradient id="deskGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Ground Ambient Glow & Character Shadow */}
                  <ellipse cx="270" cy="306" rx="90" ry="14" fill="#000000" fillOpacity="0.4" />
                  <ellipse cx="115" cy="300" rx="75" ry="12" fill="#000000" fillOpacity="0.3" />

                  {/* LEFT: 3D Laptop, Desk & Workspace Props */}
                  <g>
                    {/* Desk Platform Base */}
                    <path d="M40 280L120 250L200 280L120 305Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                    
                    {/* Laptop Screen Body */}
                    <rect x="65" y="155" width="125" height="92" rx="10" fill="url(#laptopGrad)" stroke="#6366f1" strokeWidth="3" />
                    <rect x="73" y="163" width="109" height="76" rx="6" fill="#0f172a" />
                    
                    {/* Window Controls / Tab on Laptop Screen */}
                    <circle cx="82" cy="172" r="3" fill="#ef4444" />
                    <circle cx="90" cy="172" r="3" fill="#f59e0b" />
                    <circle cx="98" cy="172" r="3" fill="#10b981" />
                    
                    {/* Checklist on Screen */}
                    <rect x="80" y="184" width="24" height="6" rx="2" fill="#10b981" />
                    <rect x="110" y="184" width="60" height="6" rx="2" fill="#64748b" />
                    <rect x="80" y="196" width="24" height="6" rx="2" fill="#6366f1" />
                    <rect x="110" y="196" width="50" height="6" rx="2" fill="#64748b" />
                    <rect x="80" y="208" width="24" height="6" rx="2" fill="#f59e0b" />
                    <rect x="110" y="208" width="55" height="6" rx="2" fill="#64748b" />
                    <rect x="80" y="220" width="24" height="6" rx="2" fill="#ec4899" />
                    <rect x="110" y="220" width="45" height="6" rx="2" fill="#64748b" />

                    {/* Laptop Keyboard Base */}
                    <path d="M52 248H202L188 266H66L52 248Z" fill="#334155" stroke="#475569" strokeWidth="2" />
                    <rect x="100" y="254" width="54" height="8" rx="2" fill="#1e293b" />

                    {/* Stack of Reference Books */}
                    <rect x="42" y="260" width="40" height="9" rx="3" fill="#f43f5e" />
                    <rect x="40" y="267" width="44" height="9" rx="3" fill="#3b82f6" />
                    <rect x="38" y="274" width="48" height="9" rx="3" fill="#10b981" />

                    {/* Hourglass Prop */}
                    <path d="M182 232H202L194 246L202 260H182L190 246L182 232Z" fill="#fbbf24" fillOpacity="0.8" stroke="#d97706" strokeWidth="1.5" />
                    <circle cx="192" cy="254" r="2.5" fill="#f59e0b" />

                    {/* Gold Star Floating */}
                    <path d="M50 142L53 148L60 149L55 154L56 160L50 157L44 160L45 154L40 149L47 148L50 142Z" fill="#facc15" />
                  </g>

                  {/* CENTER-RIGHT: Vector Character Standing & Pointing Right */}
                  <g id="character">
                    {/* Pink/White Sneakers */}
                    {/* Left Shoe */}
                    <rect x="238" y="286" width="30" height="15" rx="7" fill="#ec4899" />
                    <path d="M238 296H268V299C268 300.5 266.5 302 264.5 302H241.5C239.5 302 238 300.5 238 299V296Z" fill="#ffffff" />
                    {/* Right Shoe */}
                    <rect x="282" y="286" width="32" height="15" rx="7" fill="#ec4899" />
                    <path d="M282 296H314V299C314 300.5 312.5 302 310.5 302H285.5C283.5 302 282 300.5 282 299V296Z" fill="#ffffff" />

                    {/* Dark Jeans / Pants */}
                    <path d="M242 195L240 288H264L275 220L286 288H310L308 195H242Z" fill="#1e293b" />
                    {/* Belt */}
                    <rect x="242" y="193" width="66" height="5" rx="2" fill="#0f172a" />
                    <rect x="270" y="193" width="10" height="5" rx="1.5" fill="#94a3b8" />

                    {/* Purple/Indigo Hoodie Body */}
                    <path d="M228 116L236 200H314L322 116C296 126 254 126 228 116Z" fill="url(#hoodieGrad)" />
                    {/* Hoodie Pocket */}
                    <path d="M250 162H300L294 194H256L250 162Z" fill="#4338ca" />
                    {/* White Drawstrings */}
                    <path d="M265 120V144" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M285 120V144" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Lightning Badge on Chest (White rounded square with indigo lightning) */}
                    <rect x="280" y="132" width="20" height="20" rx="5" fill="#ffffff" />
                    <path d="M291 134L286 142H290.5L289 150L295 140H290.5L291 134Z" fill="#4f46e5" />

                    {/* Left Arm Resting Along Torso */}
                    <path d="M230 120L216 168L212 196" stroke="#4f46e5" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="212" cy="196" r="9" fill="#fbcfe8" />

                    {/* Right Arm Extended Horizontally Pointing Directly to Login Card */}
                    <path d="M318 124L360 142L415 142" stroke="#4f46e5" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Pointing Hand */}
                    <circle cx="415" cy="142" r="10" fill="#fbcfe8" />
                    {/* Extended Pointing Finger */}
                    <rect x="415" y="137" width="28" height="9" rx="4.5" fill="#fbcfe8" />
                    {/* Sleeve Cuff */}
                    <rect x="402" y="133" width="7" height="18" rx="2" fill="#4338ca" />

                    {/* Neck */}
                    <rect x="267" y="98" width="16" height="20" rx="5" fill="#fbcfe8" />

                    {/* Head / Face */}
                    <circle cx="275" cy="74" r="32" fill="#fbcfe8" />

                    {/* Hair (Modern stylish dark brown hair) */}
                    <path d="M245 74C245 44 262 30 286 30C308 30 318 46 314 68C305 68 298 56 282 56C266 56 258 68 245 74Z" fill="#2d1a10" />
                    <path d="M246 72C240 60 250 48 266 40" stroke="#2d1a10" strokeWidth="6" strokeLinecap="round" />

                    {/* Eyes (Friendly cartoon brown/black eyes with white pupils) */}
                    <ellipse cx="264" cy="74" rx="4.5" ry="5.5" fill="#1e293b" />
                    <circle cx="265.5" cy="72" r="1.5" fill="#ffffff" />
                    <ellipse cx="286" cy="74" rx="4.5" ry="5.5" fill="#1e293b" />
                    <circle cx="287.5" cy="72" r="1.5" fill="#ffffff" />

                    {/* Eyebrows */}
                    <path d="M259 66C263 64 268 65 270 67" stroke="#2d1a10" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M280 67C282 65 287 64 291 66" stroke="#2d1a10" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Warm Smile */}
                    <path d="M268 86C272 92 280 92 284 86" stroke="#be123c" strokeWidth="3" strokeLinecap="round" />
                    
                    {/* Subtle Blush on Cheeks */}
                    <circle cx="258" cy="81" r="4" fill="#f43f5e" fillOpacity="0.25" />
                    <circle cx="292" cy="81" r="4" fill="#f43f5e" fillOpacity="0.25" />
                  </g>
                </svg>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: FLOATING WHITE LOGIN CARD                                  */}
          {/* ========================================================================= */}
          <div className="md:col-span-6 lg:col-span-5 flex justify-center md:justify-end">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-6 sm:p-8 relative border border-white/20 text-slate-800">
              
              {/* Top Center Overlapping Gradient Lock Badge */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/40 border-4 border-white">
                <Lock className="w-6 h-6 text-white" />
              </div>

              {/* Card Header Titles */}
              <div className="text-center pt-3 mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {mode === 'login' && (
                    <>Welcome to <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">CSCCopy</span></>
                  )}
                  {mode === 'register' && (
                    <>Create <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Account</span></>
                  )}
                  {mode === 'forgot' && (
                    <>Reset <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Password</span></>
                  )}
                  {mode === 'legacy-setup' && (
                    <>Set Your <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Password</span></>
                  )}
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {mode === 'login' && 'Login to continue'}
                  {mode === 'register' && (step === 1 ? 'Enter your details for WhatsApp verification' : 'Enter the 6-digit WhatsApp OTP')}
                  {mode === 'forgot' && (step === 1 ? 'Enter your registered mobile number' : 'Enter OTP and create a new password')}
                  {mode === 'legacy-setup' && 'Existing account verified! Set password to continue.'}
                </p>
              </div>

              {/* Error & Success Alerts */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">!</div>
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* ===================================================================== */}
              {/* VIEW 1: NORMAL LOGIN (MOBILE NUMBER + PASSWORD)                       */}
              {/* ===================================================================== */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  
                  {/* Green Button: Click here to activate account */}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span>Click here to activate account</span>
                  </button>

                  {/* Mobile Input */}
                  <div>
                    <div className="relative">
                      <Smartphone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(formatCleanPhone(e.target.value))}
                        placeholder="Mobile No"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all placeholder:text-slate-400"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Password"
                        className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password Row */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-semibold">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                      />
                      <span>Remember Me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="font-bold text-purple-600 hover:text-purple-800 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Login</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Register Switch Link */}
                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-600 font-medium">
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="font-extrabold text-purple-600 hover:text-purple-800 cursor-pointer transition-colors"
                      >
                        Register
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* ===================================================================== */}
              {/* VIEW 2: LEGACY USER PASSWORD SETUP (WHATSAPP OTP)                    */}
              {/* ===================================================================== */}
              {mode === 'legacy-setup' && (
                <form onSubmit={handleLegacyPasswordSetup} className="space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs font-semibold">
                    📱 6-digit verification code sent to your WhatsApp on <span className="font-extrabold">{getE164Phone()}</span>
                  </div>

                  {/* 6-Digit OTP */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Enter 6-Digit WhatsApp OTP
                    </label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-black py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 text-slate-900 focus:outline-none"
                      maxLength={6}
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Create New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Resend OTP Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCountdown > 0 || loading}
                      className="text-xs font-bold text-purple-600 hover:text-purple-800 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Resend WhatsApp OTP'}
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Save Password & Login →</span>}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              )}

              {/* ===================================================================== */}
              {/* VIEW 3: REGISTRATION (STEP 1 & STEP 2)                                */}
              {/* ===================================================================== */}
              {mode === 'register' && (
                <>
                  {step === 1 ? (
                    <form onSubmit={handleRegisterStep1} className="space-y-3.5">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Adarsh Sharma"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:border-purple-600"
                          />
                        </div>
                      </div>

                      {/* Mobile No */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Mobile No</label>
                        <div className="relative">
                          <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(formatCleanPhone(e.target.value))}
                            placeholder="10-digit mobile number"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:border-purple-600"
                            maxLength={10}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Create Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:border-purple-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:border-purple-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm disabled:opacity-60 mt-2"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Send WhatsApp OTP →</span>}
                      </button>

                      <div className="text-center pt-2">
                        <p className="text-xs text-slate-600 font-medium">
                          Already have an account?{' '}
                          <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className="font-extrabold text-purple-600 hover:text-purple-800 cursor-pointer"
                          >
                            Login
                          </button>
                        </p>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleRegisterStep2} className="space-y-4">
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs font-semibold">
                        Enter 6-digit WhatsApp OTP sent to <span className="font-extrabold">+91 {phone}</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          6-Digit WhatsApp Code
                        </label>
                        <input
                          type="text"
                          required
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="••••••"
                          className="w-full text-center tracking-widest text-xl font-black py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 text-slate-900 focus:outline-none"
                          maxLength={6}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="font-semibold text-slate-500 hover:text-slate-800"
                        >
                          ← Change details
                        </button>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendCountdown > 0 || loading}
                          className="font-bold text-purple-600 hover:text-purple-800 disabled:text-slate-400"
                        >
                          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verify & Create Account →</span>}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* ===================================================================== */}
              {/* VIEW 4: FORGOT / RESET PASSWORD                                       */}
              {/* ===================================================================== */}
              {mode === 'forgot' && (
                <>
                  {step === 1 ? (
                    <form onSubmit={handleForgotStep1} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Registered Mobile No
                        </label>
                        <div className="relative">
                          <Smartphone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(formatCleanPhone(e.target.value))}
                            placeholder="Enter 10-digit registered number"
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:border-purple-600"
                            maxLength={10}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Send Reset WhatsApp OTP →</span>}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          ← Back to Login
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotStep2} className="space-y-3.5">
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs font-semibold">
                        Enter 6-digit WhatsApp OTP sent to <span className="font-extrabold">+91 {phone}</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp OTP</label>
                        <input
                          type="text"
                          required
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          className="w-full text-center tracking-widest text-lg font-black py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 text-slate-900 focus:outline-none"
                          maxLength={6}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:border-purple-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:border-purple-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="font-semibold text-slate-500 hover:text-slate-800"
                        >
                          ← Change mobile
                        </button>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendCountdown > 0 || loading}
                          className="font-bold text-purple-600 hover:text-purple-800 disabled:text-slate-400"
                        >
                          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Update Password & Login →</span>}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* Card Footer Trust Badges */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-center gap-8 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Secure Login</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Fast Service</span>
                </span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 relative z-20 gap-2">
        <div>
          © {new Date().getFullYear()} CSCCopy. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <Link href="/privacy-policy" className="hover:text-purple-300 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-purple-300 transition-colors">Terms of Service</Link>
          <Link href="/refund-policy" className="hover:text-purple-300 transition-colors">Refund Policy</Link>
        </div>
      </footer>
    </div>
  )
}
