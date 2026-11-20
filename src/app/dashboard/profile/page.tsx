'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { 
  User, Mail, LogOut, ShieldCheck, Building2, Phone, 
  Lock, Edit3, CheckCircle2, AlertCircle, Loader2, Save, X 
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

function ProfileContent() {
  const [profile, setProfile] = useState<{
    fullName: string
    businessName: string
    email: string
    phone: string
  }>({
    fullName: '',
    businessName: '',
    email: '',
    phone: ''
  })

  // Edit form state
  const [isEditing, setIsEditing] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [editBusinessName, setEditBusinessName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function loadProfile() {
      const isTempUser = typeof window !== 'undefined' && localStorage.getItem('temp_user') === 'true'
      const { data: { user } } = await supabase.auth.getUser()

      if (isTempUser) {
        const dummy = {
          fullName: 'Test Operator',
          businessName: 'CSC Test Center',
          email: 'admin@csccopy.com',
          phone: '+91 9876543210'
        }
        setProfile(dummy)
        setEditFullName(dummy.fullName)
        setEditBusinessName(dummy.businessName)
        setEditEmail(dummy.email)
      } else if (user) {
        const fullName = user.user_metadata?.full_name || ''
        const businessName = user.user_metadata?.business_name || ''
        const email = user.user_metadata?.email || user.email || ''
        const rawPhone = user.phone || ''
        const phone = rawPhone ? (rawPhone.startsWith('+91') ? rawPhone : `+91 ${rawPhone}`) : 'No phone'

        const data = { fullName, businessName, email, phone }
        setProfile(data)
        setEditFullName(fullName)
        setEditBusinessName(businessName)
        setEditEmail(email)

        // If redirected with ?complete=true or if profile is missing name/business, auto-open edit mode!
        const mustComplete = searchParams.get('complete') === 'true' || !fullName || !businessName
        if (mustComplete) {
          setIsEditing(true)
        }
      }
      setLoading(false)
    }

    loadProfile()
  }, [supabase, searchParams])

  const handleStartEdit = () => {
    setEditFullName(profile.fullName)
    setEditBusinessName(profile.businessName)
    setEditEmail(profile.email)
    setError(null)
    setSuccess(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditFullName(profile.fullName)
    setEditBusinessName(profile.businessName)
    setEditEmail(profile.email)
    setError(null)
    setIsEditing(false)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!editFullName.trim()) {
        throw new Error('Please enter your full name')
      }
      if (!editBusinessName.trim()) {
        throw new Error('Please enter your business or center name')
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: editFullName.trim(),
          email: editEmail.trim(),
          business_name: editBusinessName.trim()
        }
      })

      if (updateError) throw updateError

      setProfile(prev => ({
        ...prev,
        fullName: editFullName.trim(),
        businessName: editBusinessName.trim(),
        email: editEmail.trim()
      }))

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('temp_user')
    }
    await supabase.auth.signOut()
    router.push('/')
  }

  const isIncomplete = !profile.fullName || !profile.businessName

  return (
    <div className="min-h-[calc(100vh-73px)] text-white p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Profile</h1>
          <p className="text-indigo-200/80 font-medium">Manage your account settings, operator details, and business information.</p>
        </div>

        {/* Incomplete Profile Alert Banner */}
        {isIncomplete && !loading && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5 flex items-start gap-4 text-amber-200 shadow-lg">
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base text-white">Complete Your Profile</h3>
              <p className="text-sm text-amber-200/90 mt-1">
                Your full name and business name are required. Please fill in the details below and click <strong>"Save Profile"</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Success / Error Messages */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-300 shadow-md font-medium text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex items-center gap-3 text-rose-300 shadow-md font-medium text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Header Card */}
        <Card className="border border-indigo-400/25 shadow-xl bg-[#1b183d]/90 text-white rounded-3xl overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700"></div>
          <CardContent className="relative px-8 pb-8 pt-0">
            <div className="absolute -top-12 left-8 w-24 h-24 bg-white rounded-2xl shadow-xl border-4 border-[#1b183d] flex items-center justify-center text-emerald-600">
              <User className="w-10 h-10" />
            </div>
            
            <div className="mt-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">
                    {loading ? 'Loading...' : (profile.fullName || 'CSCCopy Operator')}
                  </h2>
                  {profile.businessName ? (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-400/40 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {profile.businessName}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-400/30">
                      Business name pending
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-indigo-200/80 font-medium text-sm pt-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <span>{loading ? '...' : (profile.email || 'No email')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-indigo-400" />
                    <span>{loading ? '...' : profile.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!isEditing && (
                  <Button 
                    onClick={handleStartEdit} 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold shadow-md flex items-center gap-2 rounded-xl cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                )}
                <Button 
                  onClick={handleSignOut} 
                  variant="outline" 
                  className="text-rose-300 border-rose-500/30 hover:bg-rose-500/15 hover:text-rose-200 rounded-xl cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business & Operator Details (Editable Form) */}
        <Card className="border border-indigo-400/25 shadow-lg bg-[#1b183d]/90 text-white rounded-3xl">
          <CardHeader className="border-b border-indigo-500/20 pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <div>
                <CardTitle className="text-lg font-bold">Business & Operator Details</CardTitle>
                <CardDescription className="text-xs text-indigo-200/70">
                  {isEditing ? 'Update your personal and business details below.' : 'Your registered details for services.'}
                </CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button 
                onClick={handleStartEdit} 
                variant="ghost" 
                size="sm" 
                className="text-emerald-300 hover:text-white hover:bg-emerald-500/20 text-xs font-semibold gap-1.5 cursor-pointer rounded-xl"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Operator Full Name (Editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-semibold text-indigo-200 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-400" />
                      Operator Full Name <span className="text-rose-400">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Rahul Patil"
                      className="h-12 bg-[#0f0d26] border border-indigo-400/30 text-white placeholder-indigo-300/40 focus:border-emerald-400 rounded-xl"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Business / Center Name (Editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-semibold text-indigo-200 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      Business / Center Name <span className="text-rose-400">*</span>
                    </Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="e.g. Rahul Computers / CSC Center"
                      className="h-12 bg-[#0f0d26] border border-indigo-400/30 text-white placeholder-indigo-300/40 focus:border-emerald-400 rounded-xl"
                      value={editBusinessName}
                      onChange={(e) => setEditBusinessName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email Address (Editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-indigo-200 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. operator@gmail.com"
                      className="h-12 bg-[#0f0d26] border border-indigo-400/30 text-white placeholder-indigo-300/40 focus:border-emerald-400 rounded-xl"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>

                  {/* Mobile Number (LOCKED / NON-EDITABLE) */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-indigo-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        WhatsApp Mobile Number
                      </span>
                      <span className="text-[11px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1 font-semibold">
                        <Lock className="w-3 h-3" />
                        Cannot be edited
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        type="text"
                        value={profile.phone}
                        disabled
                        readOnly
                        className="h-12 bg-[#0f0d26]/60 border border-indigo-500/20 text-indigo-300/80 font-medium rounded-xl cursor-not-allowed select-none pl-4 pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-indigo-400" />
                      </div>
                    </div>
                    <p className="text-[11px] text-indigo-300/60">
                      Mobile number is verified via WhatsApp OTP and cannot be modified.
                    </p>
                  </div>

                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-indigo-500/20">
                  {!isIncomplete && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="rounded-xl px-5 h-11 bg-indigo-950/80 border-indigo-400/30 text-indigo-200 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={saving || !editFullName.trim() || !editBusinessName.trim()}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl px-6 h-11 shadow-lg shadow-emerald-500/25 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[#13112c]/90 p-4 rounded-xl border border-indigo-400/20">
                  <p className="text-xs text-indigo-300/70 font-semibold uppercase tracking-wider mb-1">Operator Name</p>
                  <p className="font-bold text-white text-base">{loading ? '...' : (profile.fullName || 'Not provided')}</p>
                </div>
                <div className="bg-[#13112c]/90 p-4 rounded-xl border border-indigo-400/20">
                  <p className="text-xs text-indigo-300/70 font-semibold uppercase tracking-wider mb-1">Business / Center Name</p>
                  <p className="font-bold text-white text-base">{loading ? '...' : (profile.businessName || 'Not provided')}</p>
                </div>
                <div className="bg-[#13112c]/90 p-4 rounded-xl border border-indigo-400/20">
                  <p className="text-xs text-indigo-300/70 font-semibold uppercase tracking-wider mb-1">Email Address</p>
                  <p className="font-bold text-white text-base">{loading ? '...' : (profile.email || 'Not provided')}</p>
                </div>
                <div className="bg-[#13112c]/90 p-4 rounded-xl border border-indigo-400/20">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-indigo-300/70 font-semibold uppercase tracking-wider">WhatsApp Mobile</p>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold px-2 py-0.5 rounded-full">Verified</span>
                  </div>
                  <p className="font-bold text-white text-base flex items-center gap-2">
                    {loading ? '...' : profile.phone}
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security & Plan Card */}
        <Card className="border border-indigo-400/25 shadow-lg bg-[#1b183d]/90 text-white rounded-3xl">
          <CardHeader className="border-b border-indigo-500/20 pb-4">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-lg font-bold">Security & Plan</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[#13112c]/90 p-4 rounded-xl border border-indigo-400/20">
                <p className="text-sm text-indigo-200/80 font-medium mb-1">Current Plan</p>
                <p className="font-bold text-white">Standard Retailer</p>
              </div>
              <div className="bg-[#13112c]/90 p-4 rounded-xl border border-indigo-400/20">
                <p className="text-sm text-indigo-200/80 font-medium mb-1">Account Status</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs"></div>
                  <p className="font-bold text-white">Active & Verified via WhatsApp</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}
