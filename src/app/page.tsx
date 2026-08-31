'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Smartphone, Lock, ArrowRight, Loader2, CheckCircle2, Layers } from 'lucide-react'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Simulate API call to send OTP
    setTimeout(() => {
      setLoading(false)
      setStep('otp')
    }, 800)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Temporary mock login
    setTimeout(() => {
      setLoading(false)
      if (phone === '9876543210' && otp === '123456') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('temp_user', 'true')
        }
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Invalid OTP. Please try again.')
      }
    }, 800)
  }

  return (
    <div className="min-h-screen flex w-full bg-white">
      
      {/* LEFT PANEL - Hidden on mobile, 60% width on desktop */}
      <div className="hidden lg:flex lg:w-[60%] bg-slate-50 flex-col justify-between p-10 xl:p-16 relative overflow-hidden border-r border-slate-200">
        
        {/* Soft Background Accent */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-100/60 blur-[120px] pointer-events-none" />

        {/* Logo Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">CSCCopy</span>
        </div>

        {/* Main Marketing Content */}
        <div className="relative z-10 max-w-2xl my-12">
          <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight mb-10">
            The Ultimate All-in-One Portal for CSC Operators & Cyber Cafes.
          </h1>

          <ul className="space-y-8">
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xl mb-1">Smart PVC Card Printing</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  1-click auto-crop and align for Aadhaar, Voter ID, e-Shram, and more on standard CR80 PVC.
                </p>
              </div>
            </li>
            
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xl mb-1">PAN Form Generator</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Instantly generate and auto-fill PDFs for both "New PAN" and "PAN Correction" applications.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xl mb-1">Free Photo Studio</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  100% free tools to Remove BG, Crop, Compress, Convert Image to PDF, and PDF to Image.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xl mb-1">Daily CSC Utilities</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Fast wallet recharges, 100% client-side privacy, and other essential daily tools for retailers.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Trust Badge */}
        <div className="relative z-10 flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl border border-slate-200 w-fit shadow-sm">
          <div className="flex -space-x-3">
             <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-200"></div>
             <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-300"></div>
             <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-400"></div>
          </div>
          <span className="text-[15px] font-bold text-slate-700 tracking-tight ml-2">
            Trusted by 10,000+ CSC Retailers across India.
          </span>
        </div>
      </div>

      {/* RIGHT PANEL - 100% on mobile, 40% width on desktop */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center p-6 sm:p-12 relative bg-white">
        
        {/* Mobile Logo Only */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">CSCCopy</span>
        </div>

        <div className="w-full max-w-[420px] mt-16 lg:mt-0">
          
          <Card className="border-slate-200 shadow-xl shadow-slate-200/50 bg-white rounded-2xl overflow-hidden">
            <div className="p-8 sm:p-10">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome Back</h2>
                <p className="text-slate-500 font-medium text-[15px]">
                  Log in securely to access your dashboard.
                </p>
              </div>

              {step === 'phone' ? (
                <form onSubmit={handleSendOtp} className="transition-all duration-500 ease-in-out">
                  <div className="space-y-6">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl font-medium text-center">
                        {error}
                      </div>
                    )}
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-slate-700 font-bold ml-1 text-[15px]">Mobile Number</Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter 10-digit number"
                          className="pl-12 h-14 bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent text-lg font-semibold transition-all text-slate-900 rounded-xl placeholder:text-slate-400 placeholder:font-normal shadow-sm"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          required
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all group rounded-xl border-none mt-4" 
                      disabled={loading || phone.length < 10}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <span className="flex items-center">
                          Continue <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="transition-all duration-500 ease-in-out">
                  <div className="space-y-6">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl font-medium text-center">
                        {error}
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex justify-between items-end ml-1 mb-1">
                        <Label htmlFor="otp" className="text-slate-700 font-bold text-[15px]">One Time Password</Label>
                        <button 
                          type="button" 
                          onClick={() => setStep('phone')}
                          className="text-sm text-blue-600 font-bold hover:underline"
                        >
                          Change Number?
                        </button>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                          <Lock className="h-5 w-5" />
                        </div>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="123456"
                          className="pl-12 h-14 bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-transparent text-xl tracking-[0.5em] font-mono font-bold transition-all text-center text-slate-900 rounded-xl placeholder:text-slate-300 shadow-sm"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          required
                          maxLength={6}
                        />
                      </div>
                      <div className="text-sm text-slate-500 font-medium ml-1 text-center mt-3">
                        Code sent to <span className="text-slate-900 font-bold">+91 {phone}</span>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl border-none mt-4" 
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        'Verify & Login'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
            
            <div className="bg-slate-50 border-t border-slate-100 p-6 text-center">
              <p className="text-sm text-slate-500 font-medium">
                By continuing, you agree to CSCCopy's <br className="hidden sm:block" />
                <a href="#" className="text-blue-600 font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 font-semibold hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </Card>
        </div>
      </div>
      
    </div>
  )
}
