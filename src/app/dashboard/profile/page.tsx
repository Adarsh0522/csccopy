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
    <div className="min-h-[calc(100vh-73px)] bg-gray-100 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-500 font-medium">Manage your account settings, operator details, and business information.</p>
        </div>

        {/* Incomplete Profile Alert Banner */}
        {isIncomplete && !loading && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-start gap-4 text-amber-900 shadow-sm">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base">Complete Your Profile</h3>
              <p className="text-sm text-amber-800 mt-1">
                Your full name and business name are required. Please fill in the details below and click <strong>"Save Profile"</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Success / Error Messages */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 shadow-sm font-medium text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700 shadow-sm font-medium text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Header Card */}
        <Card className="border-gray-200 shadow-sm bg-white ring-1 ring-gray-900/5 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-700"></div>
          <CardContent className="relative px-8 pb-8 pt-0">
            <div className="absolute -top-12 left-8 w-24 h-24 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-emerald-600">
              <User className="w-10 h-10" />
            </div>
            
            <div className="mt-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {loading ? 'Loading...' : (profile.fullName || 'CSCCopy Operator')}
                  </h2>
                  {profile.businessName ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {profile.businessName}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                      Business name pending
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-gray-500 font-medium text-sm pt-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{loading ? '...' : (profile.email || 'No email')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{loading ? '...' : profile.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!isEditing && (
                  <Button 
                    onClick={handleStartEdit} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                )}
                <Button 
                  onClick={handleSignOut} 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business & Operator Details (Editable Form) */}
        <Card className="border-gray-200 shadow-sm bg-white ring-1 ring-gray-900/5">
          <CardHeader className="border-b border-gray-100 pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 text-gray-800">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <div>
                <CardTitle className="text-lg">Business & Operator Details</CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  {isEditing ? 'Update your personal and business details below.' : 'Your registered details for services.'}
                </CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button 
                onClick={handleStartEdit} 
                variant="ghost" 
                size="sm" 
                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs font-semibold gap-1.5"
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
                    <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-600" />
                      Operator Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Rahul Patil"
                      className="h-12 bg-white border-gray-300 focus-visible:ring-emerald-600 text-gray-900 rounded-xl"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Business / Center Name (Editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      Business / Center Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="e.g. Rahul Computers / CSC Center"
                      className="h-12 bg-white border-gray-300 focus-visible:ring-emerald-600 text-gray-900 rounded-xl"
                      value={editBusinessName}
                      onChange={(e) => setEditBusinessName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email Address (Editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-emerald-600" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. operator@gmail.com"
                      className="h-12 bg-white border-gray-300 focus-visible:ring-emerald-600 text-gray-900 rounded-xl"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>

                  {/* Mobile Number (LOCKED / NON-EDITABLE) */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        WhatsApp Mobile Number
                      </span>
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 font-semibold">
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
                        className="h-12 bg-gray-100 border-gray-200 text-gray-600 font-medium rounded-xl cursor-not-allowed select-none pl-4 pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Mobile number is verified via WhatsApp OTP and cannot be modified.
                    </p>
                  </div>

                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  {!isIncomplete && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="rounded-xl px-5 h-11"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={saving || !editFullName.trim() || !editBusinessName.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-11 shadow-sm font-semibold"
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
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Operator Name</p>
                  <p className="font-bold text-gray-900 text-base">{loading ? '...' : (profile.fullName || 'Not provided')}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Business / Center Name</p>
                  <p className="font-bold text-gray-900 text-base">{loading ? '...' : (profile.businessName || 'Not provided')}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Email Address</p>
                  <p className="font-bold text-gray-900 text-base">{loading ? '...' : (profile.email || 'Not provided')}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">WhatsApp Mobile</p>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Verified</span>
                  </div>
                  <p className="font-bold text-gray-900 text-base flex items-center gap-2">
                    {loading ? '...' : profile.phone}
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security & Plan Card */}
        <Card className="border-gray-200 shadow-sm bg-white ring-1 ring-gray-900/5">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2 text-gray-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-lg">Security & Plan</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-1">Current Plan</p>
                <p className="font-bold text-gray-900">Standard Retailer</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-1">Account Status</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <p className="font-bold text-gray-900">Active & Verified via WhatsApp</p>
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
