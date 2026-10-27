'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Printer, FileText, Camera, Clock, CheckCircle2, Clock3, UploadCloud, Fingerprint, CreditCard, User, HelpCircle, Home, IndianRupee } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

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

const mockServices: Service[] = [
  {
    id: '1',
    title: 'PVC Print',
    icon: 'Printer',
    price: 10,
    is_active: true,
    service_type: 'internal_tool',
    internal_route: '/dashboard/pvc-print',
  },
  {
    id: '2',
    title: 'PAN Services',
    icon: 'IdCard',
    price: 107,
    is_active: true,
    service_type: 'internal_tool',
    internal_route: '/dashboard/pan-services',
  },
  {
    id: '3',
    title: 'Aadhaar Print',
    icon: 'Fingerprint',
    price: 10,
    is_active: false,
    service_type: 'internal_tool',
    internal_route: '#',
  },
  {
    id: '4',
    title: 'New Voter ID',
    icon: 'User',
    price: 50,
    is_active: true,
    service_type: 'dynamic_form',
    form_schema: [
      { name: 'full_name', label: 'Full Name', type: 'text' },
      { name: 'dob', label: 'Date of Birth', type: 'date' },
      { name: 'state', label: 'State', type: 'select', options: ['Maharashtra', 'Gujarat', 'Delhi', 'Karnataka'] },
      { name: 'photo', label: 'Passport Photo', type: 'file' },
    ]
  },
  {
    id: '5',
    title: 'Passport Apply',
    icon: 'Camera',
    price: 1500,
    is_active: true,
    service_type: 'dynamic_form',
    form_schema: [
      { name: 'applicant_name', label: 'Applicant Name', type: 'text' },
      { name: 'email', label: 'Email ID', type: 'text' },
      { name: 'aadhaar_file', label: 'Aadhaar Copy', type: 'file' },
    ]
  },
  {
    id: '6',
    title: 'Driving License',
    icon: 'CreditCard',
    price: 250,
    is_active: true,
    service_type: 'dynamic_form',
    form_schema: [
      { name: 'dl_number', label: 'DL Number', type: 'text' },
      { name: 'rto', label: 'RTO Office', type: 'text' },
    ]
  }
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
  const [activeTab, setActiveTab] = useState('Remove BG')
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const tabs = ['Remove BG', 'Crop Passport', 'Compress JPG', 'JPG to PDF']

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || '11111111-1111-1111-1111-111111111111'

      const { data: srvData } = await supabase.from('services').select('*').order('created_at', { ascending: false })
      if (srvData) {
        const mapped = srvData.map((row: any) => ({
          ...row,
          service_type: 'dynamic_form',
        }))
        setDbServices(mapped)
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

  const handleServiceClick = (service: Service) => {
    if (!service.is_active) return;

    if (service.service_type === 'internal_tool' && service.internal_route) {
      router.push(service.internal_route);
    } else if (service.service_type === 'dynamic_form') {
      setSelectedService(service);
      setIsModalOpen(true);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const submittedData: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      submittedData[key] = value;
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    // For MVP/testing if user auth isn't fully set up on the frontend, use a dummy UUID
    const userId = session?.user?.id || '11111111-1111-1111-1111-111111111111'

    const payload = {
      user_id: userId,
      service_id: selectedService.id,
      status: 'Pending',
      submitted_data: submittedData,
      charge_amount: selectedService.price
    }

    const { error } = await supabase.from('service_applications').insert([payload])

    if (error) {
      alert("Error submitting application: " + error.message)
    } else {
      alert(`Application submitted successfully! Wallet deducted by ₹${selectedService.price}`)
      setIsModalOpen(false)
    }
  }

  return (
    <div className="w-full h-full max-w-7xl mx-auto animate-in fade-in duration-500 space-y-12 pb-12">

      {/* Primary Section: Available Tools Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Services</h2>
        
        {/* Horizontal Services Panel Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...mockServices, ...dbServices].map((service, index) => {
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
      <div className="w-full bg-gradient-to-br from-emerald-100/80 via-teal-100/60 to-blue-100/50 border border-emerald-200/60 shadow-sm rounded-[2rem] p-6 sm:p-10 my-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Free Utility Tools</h2>
          <p className="text-sm text-gray-500 mt-2">100% Client-Side. No wallet deduction.</p>
        </div>

        {/* Centered Tabs */}
        <div className="flex justify-center w-full mb-8">
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full inline-flex shadow-sm border border-gray-200/50 overflow-x-auto custom-scrollbar hide-scrollbar max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-semibold transform scale-100'
                  : 'text-gray-500 hover:text-emerald-700 hover:bg-white/80 font-medium'
                  } rounded-full px-6 py-2.5 transition-all duration-300 ease-out whitespace-nowrap`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content & Premium Dropzone */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out" key={activeTab}>
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 sm:p-12 w-full max-w-4xl mx-auto">

            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-900">{activeTab}</h3>
              <p className="text-sm text-gray-500 mt-2">Drag and drop your file here to get started.</p>
            </div>

            <div className="border-2 border-dashed border-emerald-300/80 hover:border-emerald-500 bg-white/60 hover:bg-white rounded-3xl flex flex-col items-center justify-center p-12 transition-all duration-300 cursor-pointer group shadow-sm">
              <UploadCloud className="text-teal-500 h-14 w-14 mb-4 transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 ease-out" />
              <p className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-2">SVG, PNG, JPG or GIF (max. 10MB)</p>
            </div>

          </div>
        </div>

      </div>

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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{selectedService?.title}</DialogTitle>
              <DialogDescription>
                Fill in the details below. This service costs ₹{selectedService?.price}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedService?.form_schema?.map((field) => (
                <div key={field.name} className="flex flex-col gap-2">
                  <Label htmlFor={field.name} className="text-sm font-bold text-slate-700 mb-1.5">{field.label}</Label>
                  
                  {field.type === 'select' ? (
                    <select 
                      id={field.name} 
                      name={field.name} 
                      className="flex h-10 w-full bg-white border-2 border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="flex h-10 w-full bg-white border-2 border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    />
                  ) : (
                    <Input 
                      id={field.name} 
                      name={field.name}
                      type={field.type} 
                      placeholder={field.label} 
                      className="bg-white border-2 border-slate-200 text-slate-900 rounded-lg focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20 transition-colors placeholder:text-slate-400"
                      required
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 text-lg rounded-xl shadow-md transition-all">
                Pay ₹{selectedService?.price} & Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
