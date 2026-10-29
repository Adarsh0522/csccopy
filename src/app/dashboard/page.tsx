'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Printer, FileText, Camera, Clock, CheckCircle2, Clock3, UploadCloud, Fingerprint, CreditCard, User, HelpCircle, Home, IndianRupee, ArrowRight, Wallet, AlertTriangle, AlertCircle, Lock, Loader2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { deductWalletBalance } from '@/lib/actions/wallet'
import { emitWalletUpdate, emitApplicationCreated, subscribeToWallet, subscribeToApplications } from '@/lib/realtime'
import { UtilityTabs } from '@/components/utilities/UtilityTabs'

type FormField = {
  name: string;
  label: string;
  type: string; // text, file, number, date, select
  options?: string[]; // for select
};

type Service = {
  id: string;
  title: string;
  icon: string;
  price: number;
  is_active: boolean;
  service_type: 'internal_tool' | 'dynamic_form';
  form_schema?: FormField[];
  internal_route?: string;
};

// Map string names from the DB to actual Lucide components
const iconMap: Record<string, any> = {
  Printer,
  FileText,
  Fingerprint,
  Camera,
  CreditCard,
  User,
  HelpCircle,
  Home
};

const defaultCoreServices: Service[] = [
  {
    id: 'core-pvc-print',
    title: 'PVC Print',
    icon: 'Printer',
    price: 10,
    is_active: true,
    service_type: 'internal_tool',
    internal_route: '/dashboard/pvc-print',
  },
  {
    id: 'core-pan-services',
    title: 'PAN Form Generator',
    icon: 'IdCard',
    price: 10,
    is_active: true,
    service_type: 'internal_tool',
    internal_route: '/dashboard/pan-services',
  },
];

const formatIconName = (name: string) => {
  if (!name) return 'Plus';
  if ((LucideIcons as any)[name]) return name;
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

export default function DashboardPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dbServices, setDbServices] = useState<Service[]>(defaultCoreServices);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [incompleteProfile, setIncompleteProfile] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<{
    id: string;
    title: string;
    price: number;
    newBalance: number;
  } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || '11111111-1111-1111-1111-111111111111'

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const hasComplete = Boolean(user.user_metadata?.full_name?.trim()) && Boolean(user.user_metadata?.business_name?.trim())
        setIncompleteProfile(!hasComplete)

        const { data: wData } = await supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle()
        if (wData?.balance != null) {
          setWalletBalance(Number(wData.balance))
        }
      }

      const { data: srvData } = await supabase.from('services').select('*').order('created_at', { ascending: false })
      if (srvData && srvData.length > 0) {
        const pvcDb = srvData.find((s: any) => s.title?.toLowerCase().trim() === 'pvc print')
        const panDb = srvData.find((s: any) => {
          const t = s.title?.toLowerCase().trim()
          return t === 'pan services' || t === 'pan form generator'
        })

        const dynamicServices = srvData
          .filter((s: any) => {
            const t = s.title?.toLowerCase().trim()
            return t !== 'pvc print' && t !== 'pan services' && t !== 'pan form generator'
          })
          .map((row: any) => ({
            ...row,
            service_type: 'dynamic_form' as const,
          }))

        const coreTools: Service[] = [
          {
            id: pvcDb?.id || 'core-pvc-print',
            title: pvcDb?.title || 'PVC Print',
            icon: pvcDb?.icon || 'Printer',
            price: pvcDb?.price != null ? Number(pvcDb.price) : 10,
            is_active: pvcDb?.is_active ?? true,
            service_type: 'internal_tool',
            internal_route: '/dashboard/pvc-print',
          },
          {
            id: panDb?.id || 'core-pan-services',
            title: 'PAN Form Generator',
            icon: panDb?.icon || 'IdCard',
            price: panDb?.price != null ? Number(panDb.price) : 10,
            is_active: panDb?.is_active ?? true,
            service_type: 'internal_tool',
            internal_route: '/dashboard/pan-services',
          },
        ]

        setDbServices([...coreTools, ...dynamicServices])
      }

      const { data: actData } = await supabase
        .from('service_applications')
        .select('*, services(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (actData) {
        setRecentActivity(actData)
      }
    }
    fetchDashboardData()

    let unsubWallet: (() => void) | null = null
    const setupSubscriptions = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        unsubWallet = subscribeToWallet(user.id, (newBal) => {
          if (newBal != null) setWalletBalance(Number(newBal))
        })
      }
    }
    setupSubscriptions()

    const unsubApps = subscribeToApplications(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: actData } = await supabase
          .from('service_applications')
          .select('*, services(title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
        if (actData) setRecentActivity(actData)
      }
    })

    return () => {
      if (unsubWallet) unsubWallet()
      unsubApps()
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700'
      case 'Pending': return 'bg-amber-100 text-amber-700'
      case 'Processing': return 'bg-blue-100 text-blue-700'
      case 'Rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const handleServiceClick = async (service: Service) => {
    if (!service.is_active) return;

    if (service.service_type === 'internal_tool' && service.internal_route) {
      router.push(service.internal_route);
    } else if (service.service_type === 'dynamic_form') {
      setSelectedService(service);
      setSubmitError(null);
      setIsSubmitting(false);

      // Refresh current wallet balance
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: wData } = await supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();
        if (wData?.balance != null) {
          setWalletBalance(Number(wData.balance));
        }
      }

      setIsModalOpen(true);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const submittedData: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      submittedData[key] = value;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSubmitError("Please log in to submit this service application.");
        setIsSubmitting(false);
        return;
      }

      const servicePrice = Number(selectedService.price) || 0;
      let newBalance = walletBalance ?? 0;

      // 1. Process Wallet Deduction if fee > 0
      if (servicePrice > 0) {
        const deductResult = await deductWalletBalance(
          servicePrice, 
          `Service Application: ${selectedService.title}`
        );

        if (!deductResult || !deductResult.success) {
          setSubmitError(deductResult?.message || `Insufficient wallet balance. You need ₹${servicePrice} to apply.`);
          setIsSubmitting(false);
          return;
        }

        newBalance = deductResult.new_balance != null ? Number(deductResult.new_balance) : newBalance;
        setWalletBalance(newBalance);
        emitWalletUpdate(newBalance);
      }

      // 2. Insert into service_applications
      const payload = {
        user_id: user.id,
        service_id: selectedService.id,
        status: 'Pending',
        submitted_data: submittedData,
        charge_amount: servicePrice
      };

      const { data: appData, error: appError } = await supabase
        .from('service_applications')
        .insert([payload])
        .select()
        .single();

      if (appError) {
        console.error("Application record error:", appError);
        setSubmitError("Application recorded with issue: " + appError.message);
        setIsSubmitting(false);
        return;
      }

      // Emit real-time application created event for Admin and all clients
      emitApplicationCreated(appData);

      // 3. Success! Close form modal and open professional confirmation dialog
      setIsModalOpen(false);
      setSubmittedApp({
        id: appData?.id || 'APP-' + Math.floor(100000 + Math.random() * 900000),
        title: selectedService.title,
        price: servicePrice,
        newBalance: newBalance
      });
      setIsSuccessModalOpen(true);

      // 4. Refresh recent activity
      const { data: actData } = await supabase
        .from('service_applications')
        .select('*, services(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (actData) {
        setRecentActivity(actData);
      }

    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full max-w-7xl mx-auto animate-in fade-in duration-500 space-y-10 pb-12">

      {/* Incomplete Profile Reminder Banner */}
      {incompleteProfile && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Complete Your Profile</p>
              <p className="text-xs text-gray-600 mt-0.5">Your operator name and business name are not set yet. Please complete your profile to enable personalized documents and services.</p>
            </div>
          </div>
          <Link 
            href="/dashboard/profile?complete=true" 
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all whitespace-nowrap text-center flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            Update Profile
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Primary Section: Available Tools Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Services</h2>
        
        {/* Horizontal Services Panel Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {dbServices.map((service, index) => {
            const formattedIcon = formatIconName(service.icon);
            const IconComponent = (LucideIcons as any)[formattedIcon] || Plus;
            const iconColors = ['text-blue-600', 'text-red-600', 'text-emerald-600', 'text-amber-500', 'text-indigo-600', 'text-pink-600'];
            const iconColorClass = iconColors[index % iconColors.length];
            
            return (
              <div 
                key={service.id}
                onClick={() => handleServiceClick(service)}
                className={`bg-white p-3 sm:p-4 rounded-xl border shadow-sm transition-all duration-200 flex items-center gap-4 group relative ${
                  service.is_active 
                    ? 'border-emerald-100 hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 cursor-pointer' 
                    : 'opacity-60 cursor-not-allowed grayscale border-gray-200 hover:border-gray-200'
                }`}
              >
                {!service.is_active && (
                  <div className="absolute -top-2 -right-2 bg-gray-200 text-gray-600 text-[9px] uppercase font-bold px-2 py-0.5 rounded-md z-20 shadow-sm">
                    Soon
                  </div>
                )}
                
                {/* Left Icon */}
                <div className={`flex-shrink-0 p-2.5 bg-slate-50 rounded-xl ${iconColorClass} group-hover:scale-110 group-hover:bg-emerald-50 transition-all duration-300`}>
                  <IconComponent className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
                </div>

                {/* Right Content */}
                <div className="flex flex-col flex-grow min-w-0 justify-center">
                  <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-900 truncate leading-tight mb-1 group-hover:text-emerald-700 transition-colors">
                    {service.title}
                  </h3>
                  <div className="flex items-center text-[13px] font-semibold text-slate-500">
                    {service.price > 0 ? (
                      <span className="flex items-center text-emerald-600">
                        <IndianRupee className="h-3.5 w-3.5 mr-0.5" strokeWidth={2.5} />
                        {service.price}
                      </span>
                    ) : (
                      <span className="text-emerald-600">Free</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Free Utility Tools Section */}
      <UtilityTabs />

      {/* Secondary Section: Recent Transactions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <Link href="/dashboard/activity" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full">
            View All
          </Link>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-emerald-50/40 text-slate-700 border-b border-emerald-100/50">
                  <th className="px-6 py-4 font-semibold text-sm tracking-wide">Service Name</th>
                  <th className="px-6 py-4 font-semibold text-sm tracking-wide">Amount</th>
                  <th className="px-6 py-4 font-semibold text-sm tracking-wide">Date & Time</th>
                  <th className="px-6 py-4 font-semibold text-sm tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentActivity.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No recent activity.</td></tr>
                ) : (
                  recentActivity.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {txn.services?.title || 'Unknown Service'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">
                          - ₹{txn.charge_amount}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                          <Clock3 className="w-4 h-4 text-gray-400" />
                          {new Date(txn.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(txn.status)}`}>
                          {txn.status === 'Completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {txn.status}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dynamic Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                {selectedService?.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Please complete all required fields below to submit your service application.
              </DialogDescription>
            </DialogHeader>

            {/* Service Charge & Wallet Balance Snapshot */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Service Fee:</span>
                <span className="font-extrabold text-emerald-600 text-sm">₹{selectedService?.price ?? 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 font-medium">Your Balance:</span>
                <span className={`font-bold ${walletBalance !== null && walletBalance < (selectedService?.price || 0) ? 'text-red-600 font-extrabold' : 'text-slate-800'}`}>
                  ₹{walletBalance !== null ? walletBalance.toFixed(2) : '...'}
                </span>
              </div>
            </div>

            {/* Important Instructions Box */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Important Instructions & Policy:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px] leading-relaxed pl-0.5">
                <li>Please enter genuine and verified applicant information.</li>
                <li>An application fee of <strong>₹{selectedService?.price}</strong> will be deducted immediately from your wallet upon submission.</li>
                <li>Fee deductions for processed applications are <strong>strictly non-refundable</strong>.</li>
              </ul>
            </div>

            {/* Insufficient Balance Notice */}
            {walletBalance !== null && walletBalance < (selectedService?.price || 0) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Insufficient Wallet Balance</p>
                  <p className="text-[11px] mt-0.5 text-red-700">
                    You need ₹{selectedService?.price} for this service, but your wallet balance is only ₹{walletBalance.toFixed(2)}.
                  </p>
                  <Link 
                    href="/dashboard/wallet"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Recharge Wallet Now
                  </Link>
                </div>
              </div>
            )}

            {/* Error Message If Any */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Dynamic Fields */}
            <div className="space-y-3.5 py-2">
              {selectedService?.form_schema?.map((field) => (
                <div key={field.name} className="flex flex-col gap-1.5">
                  <Label htmlFor={field.name} className="text-xs font-bold text-slate-700">
                    {field.label}
                  </Label>
                  
                  {field.type === 'select' ? (
                    <select 
                      id={field.name} 
                      name={field.name} 
                      className="flex h-10 w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-colors"
                      required
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'file' ? (
                    <input 
                      type="file" 
                      id={field.name} 
                      name={field.name}
                      className="flex h-10 w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-sm file:border-0 file:bg-transparent file:text-xs file:font-semibold focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-colors"
                      required
                    />
                  ) : (
                    <Input 
                      id={field.name} 
                      name={field.name}
                      type={field.type} 
                      placeholder={`Enter ${field.label}`} 
                      className="bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 text-sm h-10"
                      required
                    />
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="pt-2">
              {walletBalance !== null && walletBalance < (selectedService?.price || 0) ? (
                <Button 
                  type="button" 
                  onClick={() => router.push('/dashboard/wallet')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" /> Recharge Wallet to Continue
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deducting Wallet & Submitting...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay ₹{selectedService?.price} & Submit Application
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Professional Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-[440px] bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-200">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-xl font-extrabold text-slate-900">
              Application Submitted Successfully!
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Your request has been received and queued for admin processing.
            </DialogDescription>
          </DialogHeader>

          {submittedApp && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 my-4 space-y-2.5 text-xs text-left">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Service Name</span>
                <span className="font-bold text-slate-900">{submittedApp.title}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Amount Deducted</span>
                <span className="font-extrabold text-emerald-600">₹{submittedApp.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Updated Wallet Balance</span>
                <span className="font-bold text-slate-900">₹{submittedApp.newBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Status</span>
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <Clock className="w-3 h-3" /> Pending Review
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-medium">Reference Order ID</span>
                <span className="font-mono text-slate-700 font-bold">#{submittedApp.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
            You can monitor real-time updates and download completed outputs directly from the <strong>Recent Activity</strong> section.
          </p>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { setIsSuccessModalOpen(false); router.push('/dashboard/activity'); }}
              className="w-full sm:flex-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl h-11 text-xs"
            >
              View in Activity
            </Button>
            <Button 
              type="button" 
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 text-xs shadow-md"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
