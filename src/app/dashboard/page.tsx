'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Printer, 
  FileText, 
  Camera, 
  Clock, 
  Check,
  CheckCircle2, 
  Clock3, 
  UploadCloud, 
  Fingerprint, 
  CreditCard, 
  User, 
  HelpCircle, 
  Home, 
  IndianRupee, 
  ArrowRight, 
  Wallet, 
  AlertTriangle, 
  AlertCircle, 
  Lock, 
  Loader2,
  HeartPulse,
  Building2,
  MessageSquareText,
  Car,
  GraduationCap,
  Vote,
  Wheat,
  Zap,
  BookOpen,
  X
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { deductWalletBalance } from '@/lib/actions/wallet'
import { emitWalletUpdate, emitApplicationCreated, subscribeToWallet, subscribeToApplications } from '@/lib/realtime'
import { UtilityTabs } from '@/components/utilities/UtilityTabs'
import { isImageSource } from '@/lib/utils'
import { useSearch } from './SearchContext'

type FormField = {
  name: string;
  label: string;
  type: string; // text, file, number, date, select
  options?: string[]; // for select
};

type Service = {
  id: string;
  title: string;
  description?: string;
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
    description: 'Aadhaar, PAN, Voter, Ayushman Card Generation',
    icon: 'Printer',
    price: 10,
    is_active: true,
    service_type: 'internal_tool',
    internal_route: '/dashboard/pvc-print',
  },
  {
    id: 'core-pan-services',
    title: 'PAN Form Generator',
    description: 'New PAN & Correction Application Form Generator',
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

function getKeywordIcon(serviceName: string = '', explicitIcon: string = '') {
  // If explicitly specified in db and valid (and not generic plus/card)
  if (explicitIcon && !isImageSource(explicitIcon)) {
    const formatted = formatIconName(explicitIcon);
    if (formatted && formatted !== 'Plus' && (LucideIcons as any)[formatted]) {
      return (LucideIcons as any)[formatted];
    }
  }

  const name = serviceName.toLowerCase();
  if (name.includes('pvc') || name.includes('print')) return Printer;
  if (name.includes('pan') || name.includes('nsdl') || name.includes('uti')) return CreditCard;
  if (name.includes('aadhaar') || name.includes('aadhar') || name.includes('eid') || name.includes('uid') || name.includes('npci')) return Fingerprint;
  if (name.includes('ayushman') || name.includes('health') || name.includes('pmjay')) return HeartPulse;
  if (name.includes('ngo') || name.includes('trust') || name.includes('society') || name.includes('company') || name.includes('regis')) return Building2;
  if (name.includes('sms') || name.includes('mobile') || name.includes('call') || name.includes('otp')) return MessageSquareText;
  if (name.includes('dl') || name.includes('driving') || name.includes('rc') || name.includes('vehicle') || name.includes('vahan')) return Car;
  if (name.includes('tec') || name.includes('csc') || name.includes('certificate') || name.includes('exam')) return GraduationCap;
  if (name.includes('voter') || name.includes('election')) return Vote;
  if (name.includes('ration') || name.includes('farmer') || name.includes('krishi') || name.includes('kisan')) return Wheat;
  if (name.includes('electricity') || name.includes('bill') || name.includes('light') || name.includes('power')) return Zap;
  if (name.includes('passport')) return BookOpen;
  
  return FileText;
}

function ServiceVisualIcon({ 
  serviceName, 
  imageUrl, 
  iconName 
}: { 
  serviceName: string; 
  imageUrl?: string | null; 
  iconName?: string | null; 
}) {
  const hasValidImage = isImageSource(imageUrl);

  return (
    <div className="mx-auto my-1.5 w-20 h-20 rounded-full bg-white shadow-lg shadow-black/40 ring-2 ring-indigo-400/25 flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform duration-200">
      {hasValidImage ? (
        <img
          src={imageUrl || ''}
          alt={serviceName}
          className="w-full h-full object-contain scale-105 rounded-full"
          loading="lazy"
        />
      ) : (
        (() => {
          const IconComp = getKeywordIcon(serviceName, iconName || '');
          return <IconComp className="w-11 h-11 text-emerald-600 shrink-0" strokeWidth={2} />;
        })()
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { searchQuery } = useSearch();
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
        const pvcDb = srvData.find((s: any) => 
          s.form_schema?.[0]?.core_tool === 'pvc_print' || 
          s.title?.toLowerCase().trim() === 'pvc print' ||
          (s.title?.toLowerCase().includes('pvc') && (!s.form_schema || s.form_schema.length <= 1))
        )
        const panDb = srvData.find((s: any) => 
          s.form_schema?.[0]?.core_tool === 'pan_services' || 
          s.title?.toLowerCase().trim() === 'pan services' || 
          s.title?.toLowerCase().trim() === 'pan form generator' ||
          ((s.title?.toLowerCase().trim() === 'pan' || s.title?.toLowerCase().startsWith('pan form')) && (!s.form_schema || s.form_schema.length <= 1))
        )

        const dynamicServices = srvData
          .filter((s: any) => s.id !== pvcDb?.id && s.id !== panDb?.id)
          .map((row: any) => ({
            ...row,
            service_type: 'dynamic_form' as const,
          }))

        const coreTools: Service[] = [
          {
            id: pvcDb?.id || 'core-pvc-print',
            title: pvcDb?.title || 'PVC Print',
            description: pvcDb?.description || 'Aadhaar, PAN, Voter, Ayushman Card Generation',
            icon: pvcDb?.icon || 'Printer',
            price: pvcDb?.price != null ? Number(pvcDb.price) : 10,
            is_active: pvcDb?.is_active ?? true,
            service_type: 'internal_tool',
            internal_route: '/dashboard/pvc-print',
          },
          {
            id: panDb?.id || 'core-pan-services',
            title: panDb?.title || 'PAN Form Generator',
            description: panDb?.description || 'New PAN & Correction Application Form Generator',
            icon: panDb?.icon || 'CreditCard',
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
      case 'Completed': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
      case 'Pending': return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
      case 'Processing': return 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
      case 'Rejected': return 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
      default: return 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 font-bold'
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
        <div className="bg-gradient-to-r from-amber-950/60 to-indigo-950/80 border border-amber-500/40 text-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-amber-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Complete Your Profile</p>
              <p className="text-xs text-indigo-200/80 mt-0.5">Your operator name and business name are not set yet. Please complete your profile to enable personalized documents and services.</p>
            </div>
          </div>
          <Link
            href="/dashboard/profile?complete=true"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all whitespace-nowrap text-center flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            Update Profile
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Primary Section: Available Tools Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="border-l-4 border-emerald-400 pl-3 text-xl font-extrabold text-white">
            Services
          </h2>
          {searchQuery && (
            <span className="text-xs text-indigo-300/80 font-medium">
              Showing results for &ldquo;<span className="text-emerald-400 font-bold">{searchQuery}</span>&rdquo;
            </span>
          )}
        </div>

        {/* 5-Column Responsive Services Grid on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
          {(() => {
            const filteredServices = dbServices.filter((service) => {
              if (!searchQuery.trim()) return true;
              return service.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
            });

            if (filteredServices.length === 0) {
              return (
                <div className="col-span-full py-12 px-6 rounded-2xl bg-[#1b183d]/60 border border-indigo-400/20 text-center space-y-2">
                  <p className="text-base font-bold text-white">No matching services found</p>
                  <p className="text-xs text-indigo-300/70">
                    We couldn&apos;t find any services matching &ldquo;{searchQuery}&rdquo;. Try another keyword.
                  </p>
                </div>
              );
            }

            return filteredServices.map((service) => {
              return (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className={`group relative rounded-3xl border transition-all duration-200 p-3.5 overflow-hidden flex flex-col justify-between h-full ${
                    service.is_active
                      ? 'bg-gradient-to-b from-[#231f4d] to-[#171436] border-indigo-400/25 shadow-lg shadow-black/30 hover:border-emerald-400/60 hover:shadow-emerald-500/15 hover:-translate-y-1 cursor-pointer'
                      : 'bg-gradient-to-b from-[#1b183a] to-[#121027] border-indigo-500/20 shadow-md opacity-75 cursor-not-allowed'
                  }`}
                >
                  {/* Top Section */}
                  <div>
                    {/* Top Row: Badge & Check Icon */}
                    <div className="flex items-center justify-between mb-2">
                      {service.is_active ? (
                        <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          SERVICE
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          SOON
                        </span>
                      )}
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="w-2.5 h-2.5 text-slate-950" strokeWidth={3.5} />
                      </div>
                    </div>

                    {/* Center Circular Icon / Image Frame */}
                    <ServiceVisualIcon
                      serviceName={service.title}
                      imageUrl={service.icon}
                      iconName={service.icon}
                    />

                    {/* Full Service Title (Centered, Zero Truncation) */}
                    <div className="mt-2 mb-3 min-h-[2.5rem] flex items-center justify-center text-center">
                      <h3 className="text-[14px] font-bold text-white leading-snug break-words">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  {/* Bottom Action Row (Pinned to bottom via mt-auto) */}
                  <div className="mt-auto pt-2 flex items-center gap-2 w-full">
                    {/* Left Side: Amount Box */}
                    {service.price > 0 ? (
                      <div className="px-2.5 py-2 rounded-xl border border-indigo-400/30 bg-[#0f0d26]/90 text-emerald-300 font-extrabold text-xs whitespace-nowrap flex items-center justify-center min-w-[60px]">
                        ₹ {service.price}
                      </div>
                    ) : (
                      <div className="px-2.5 py-2 rounded-xl border border-blue-400/40 bg-blue-500/20 text-blue-300 font-extrabold text-xs whitespace-nowrap flex items-center justify-center min-w-[60px]">
                        Free
                      </div>
                    )}

                    {/* Right Side: Apply Button */}
                    {service.is_active ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceClick(service);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <span>⚡</span>
                        <span>Apply</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 font-bold text-xs shadow-none flex items-center justify-center gap-1 cursor-not-allowed whitespace-nowrap"
                      >
                        <span>Coming Soon</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Free Utility Tools Section */}
      <UtilityTabs />

      {/* Secondary Section: Recent Transactions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="border-l-4 border-emerald-400 pl-3 text-xl font-extrabold text-white">
            Recent Activity
          </h2>
          <Link 
            href="/dashboard/activity" 
            className="text-xs font-extrabold text-emerald-300 hover:text-white bg-indigo-950/80 border border-emerald-400/30 px-4 py-1.5 rounded-full shadow-xs hover:bg-emerald-500/20 transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="bg-[#1b183d]/90 rounded-2xl border border-indigo-400/20 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-[#110f29] text-indigo-200 border-b border-indigo-500/20">
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider">Service Name</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/15">
                {recentActivity.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-indigo-300/60 font-medium">No recent activity.</td></tr>
                ) : (
                  recentActivity.map((txn) => (
                    <tr key={txn.id} className="even:bg-[#161338]/40 hover:bg-indigo-500/15 border-b border-indigo-500/15 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {txn.services?.title || 'Unknown Service'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-emerald-300">
                          - ₹{txn.charge_amount}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-indigo-200/80 font-medium">
                          <Clock3 className="w-4 h-4 text-indigo-400" />
                          {new Date(txn.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs ${getStatusColor(txn.status)}`}>
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

      {/* Dynamic Form Modal (Spacious 2-Column Split Layout) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          showCloseButton={false}
          className="sm:max-w-4xl w-[95vw] max-w-4xl max-h-[88vh] bg-[#161338] border border-indigo-400/30 rounded-2xl shadow-2xl p-0 gap-0 overflow-hidden flex flex-col text-white duration-200 outline-none"
        >
          {/* Fixed Top Header */}
          <div className="shrink-0 px-6 py-4 bg-[#110f29] border-b border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                {isImageSource(selectedService?.icon) ? (
                  <img src={selectedService?.icon || ''} alt="" className="w-full h-full object-contain" />
                ) : (
                  <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-white leading-tight truncate">
                  {selectedService?.title}
                </h2>
                <p className="text-xs text-indigo-300/70 font-medium">Application Form</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-9 h-9 rounded-full bg-indigo-950/80 border border-indigo-400/30 text-indigo-200 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-400/40 flex items-center justify-center transition cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form wrapper */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* BODY SPLIT (2-Column on md+) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
              
              {/* Left Panel (Fee, Description, Policy) */}
              <div className="md:col-span-5 bg-[#12102b]/80 border-b md:border-b-0 md:border-r border-indigo-500/20 p-5 overflow-y-auto space-y-4 dark-scrollbar">
                
                {/* 1. Fee & Wallet Summary Card */}
                <div className="bg-[#0f0d26] border border-indigo-400/25 rounded-2xl p-4 grid grid-cols-2 gap-3 shadow-inner">
                  <div>
                    <p className="text-[11px] font-semibold text-indigo-300/70 uppercase tracking-wider">Service Fee</p>
                    <p className="text-xl font-extrabold text-emerald-400 mt-0.5">
                      {selectedService?.price ? `₹${selectedService.price}` : 'Free'}
                    </p>
                  </div>
                  <div className="border-l border-indigo-500/20 pl-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300/70 uppercase tracking-wider">
                      <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Your Balance</span>
                    </div>
                    <p className={`text-xl font-bold mt-0.5 ${walletBalance !== null && walletBalance < (selectedService?.price || 0) ? 'text-rose-400 font-extrabold' : 'text-white'}`}>
                      ₹{walletBalance !== null ? walletBalance.toFixed(2) : '...'}
                    </p>
                  </div>
                </div>

                {/* Insufficient Balance Alert */}
                {walletBalance !== null && walletBalance < (selectedService?.price || 0) && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-rose-200">Insufficient Wallet Balance</p>
                      <p className="text-[11px] mt-0.5 text-rose-300/90 leading-tight">
                        Need ₹{selectedService?.price}, current: ₹{walletBalance.toFixed(2)}.
                      </p>
                      <Link
                        href="/dashboard/wallet"
                        className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-slate-950 bg-rose-400 hover:bg-rose-300 px-3 py-1 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Recharge Wallet
                      </Link>
                    </div>
                  </div>
                )}

                {/* 2. Dynamic Service Description (MUST SHOW) */}
                {selectedService?.description && selectedService.description.trim() !== '' && (
                  <div className="bg-[#0f0d26]/90 border border-indigo-400/25 rounded-2xl p-4 space-y-1.5">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>About This Service / Instructions</span>
                    </h4>
                    <p className="text-sm text-indigo-100/90 leading-relaxed whitespace-pre-line">
                      {selectedService.description}
                    </p>
                  </div>
                )}

                {/* 3. Compact Policy Box */}
                <div className="bg-amber-500/10 border border-amber-400/25 rounded-xl p-3.5 text-xs text-amber-100/90 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Important Policy:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-200/90 text-[11px] leading-relaxed pl-0.5">
                    <li>Enter genuine and verified applicant information.</li>
                    <li>Application fee will be deducted immediately from your wallet upon submission.</li>
                    <li>Processed application fees are strictly <strong>non-refundable</strong>.</li>
                  </ul>
                </div>
              </div>

              {/* Right Panel (Form Fields) */}
              <div className="md:col-span-7 p-6 overflow-y-auto space-y-4 dark-scrollbar">
                <div className="border-b border-indigo-500/20 pb-3 mb-2">
                  <h3 className="text-sm font-extrabold text-white tracking-wide">Application Form Details</h3>
                  <p className="text-xs text-indigo-300/70 mt-0.5">Please provide accurate applicant details below.</p>
                </div>

                {/* Error Notice */}
                {submitError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  {selectedService?.form_schema && selectedService.form_schema.length > 0 ? (
                    selectedService.form_schema.map((field) => (
                      <div key={field.name} className="flex flex-col gap-1.5">
                        <Label htmlFor={field.name} className="text-indigo-200 text-xs font-bold uppercase tracking-wide">
                          {field.label}
                        </Label>

                        {field.type === 'select' ? (
                          <select
                            id={field.name}
                            name={field.name}
                            className="flex h-11 w-full bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-colors [color-scheme:dark]"
                            required
                          >
                            <option value="" className="bg-[#0f0d26] text-indigo-300/60">Select {field.label}</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt} className="bg-[#181537] text-white">{opt}</option>
                            ))}
                          </select>
                        ) : field.type === 'file' ? (
                          <input
                            type="file"
                            id={field.name}
                            name={field.name}
                            className="flex h-11 w-full bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl px-4 py-2 text-sm file:border-0 file:bg-indigo-600/30 file:border file:border-indigo-400/30 file:text-emerald-300 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-bold focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-colors cursor-pointer"
                            required
                          />
                        ) : (
                          <Input
                            id={field.name}
                            name={field.name}
                            type={field.type}
                            placeholder={`Enter ${field.label}`}
                            className="bg-[#0f0d26] border border-indigo-400/30 text-white placeholder-indigo-300/40 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm h-11 px-4"
                            required
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-[#0f0d26]/60 rounded-xl border border-indigo-500/20 text-indigo-300/80 text-xs">
                      No additional fields required for this application. Click below to proceed.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fixed Bottom Footer */}
            <div className="shrink-0 px-6 py-4 bg-[#110f29] border-t border-indigo-500/20 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/15 hover:text-white font-semibold text-sm bg-transparent cursor-pointer h-10"
              >
                Cancel
              </Button>

              {walletBalance !== null && walletBalance < (selectedService?.price || 0) ? (
                <Button
                  type="button"
                  onClick={() => router.push('/dashboard/wallet')}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-lg shadow-rose-600/25 flex items-center gap-2 cursor-pointer h-10"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Recharge Wallet to Apply</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer h-10 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-slate-950" />
                      <span>Pay ₹{selectedService?.price ?? 0} & Submit Application</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Professional Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-[440px] bg-[#181537] text-white p-6 rounded-3xl border border-indigo-400/30 shadow-2xl text-center">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-400/30">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-xl font-extrabold text-white">
              Application Submitted Successfully!
            </DialogTitle>
            <DialogDescription className="text-xs text-indigo-200/80 mt-1">
              Your request has been received and queued for admin processing.
            </DialogDescription>
          </DialogHeader>

          {submittedApp && (
            <div className="bg-[#0f0d26] border border-indigo-400/20 rounded-2xl p-4 my-4 space-y-2.5 text-xs text-left">
              <div className="flex justify-between items-center py-1 border-b border-indigo-500/15">
                <span className="text-indigo-200/70 font-medium">Service Name</span>
                <span className="font-bold text-white">{submittedApp.title}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-indigo-500/15">
                <span className="text-indigo-200/70 font-medium">Amount Deducted</span>
                <span className="font-extrabold text-emerald-400">₹{submittedApp.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-indigo-500/15">
                <span className="text-indigo-200/70 font-medium">Updated Wallet Balance</span>
                <span className="font-bold text-white">₹{submittedApp.newBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-indigo-500/15">
                <span className="text-indigo-200/70 font-medium">Status</span>
                <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  <Clock className="w-3 h-3" /> Pending Review
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-indigo-200/70 font-medium">Reference Order ID</span>
                <span className="font-mono text-indigo-300 font-bold">#{submittedApp.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-indigo-200/70 leading-relaxed mb-4">
            You can monitor real-time updates and download completed outputs directly from the <strong>Recent Activity</strong> section.
          </p>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsSuccessModalOpen(false); router.push('/dashboard/activity'); }}
              className="w-full sm:flex-1 bg-indigo-950/80 border-indigo-400/30 text-indigo-200 hover:text-white hover:bg-indigo-900/60 font-bold rounded-xl h-11 text-xs cursor-pointer"
            >
              View in Activity
            </Button>
            <Button
              type="button"
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full sm:flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl h-11 text-xs shadow-md cursor-pointer"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
