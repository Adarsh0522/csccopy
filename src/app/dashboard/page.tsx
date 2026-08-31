import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Printer, FileText, Camera, Shield, Search, FileBadge, ArrowRight, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

export default function DashboardPage() {
  const activeServices = [
    {
      title: 'PVC Card Print',
      description: 'Print Aadhaar, PAN, Voter ID on PVC.',
      icon: <Printer className="w-6 h-6 text-indigo-600" />,
      borderColor: 'border-l-indigo-500',
      href: '/dashboard/pvc-print',
    },
    {
      title: 'PAN Services',
      description: 'Generate New PAN & Correction Forms.',
      icon: <FileText className="w-6 h-6 text-emerald-600" />,
      borderColor: 'border-l-emerald-500',
      href: '/dashboard/pan-services',
    },
    {
      title: 'Photo Studio',
      description: 'Free tools: Remove BG, Crop, Compress.',
      icon: <Camera className="w-6 h-6 text-orange-500" />,
      borderColor: 'border-l-orange-500',
      href: '/dashboard/photo-studio',
    }
  ]

  const upcomingServices = [
    {
      title: 'Ayushman Print',
      description: 'Extract and print Ayushman cards.',
      icon: <Shield className="w-6 h-6 text-slate-400" />,
      borderColor: 'border-l-slate-300',
    },
    {
      title: 'Udyam Registration',
      description: 'MSME registration certificate generation.',
      icon: <FileBadge className="w-6 h-6 text-slate-400" />,
      borderColor: 'border-l-slate-300',
    },
    {
      title: 'Find PAN',
      description: 'Search PAN by Aadhaar number.',
      icon: <Search className="w-6 h-6 text-slate-400" />,
      borderColor: 'border-l-slate-300',
    }
  ]

  const recentTransactions = [
    { id: 'TXN-001', date: 'Oct 24, 2026 - 10:30 AM', service: 'PVC Print - Aadhaar', amount: '-₹10.00', status: 'Success' },
    { id: 'TXN-002', date: 'Oct 24, 2026 - 09:15 AM', service: 'PAN Services - New Form', amount: '-₹10.00', status: 'Success' },
    { id: 'TXN-003', date: 'Oct 23, 2026 - 04:45 PM', service: 'PVC Print - Voter ID', amount: '-₹10.00', status: 'Success' },
    { id: 'TXN-004', date: 'Oct 23, 2026 - 02:20 PM', service: 'Wallet Recharge', amount: '+₹500.00', status: 'Success' },
    { id: 'TXN-005', date: 'Oct 22, 2026 - 11:10 AM', service: 'PVC Print - Manual', amount: '-₹10.00', status: 'Success' },
  ]

  return (
    <div className="relative min-h-[calc(100vh-73px)] bg-slate-100 p-6 lg:p-8">
      
      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        
        {/* Section 2: Quick Actions / Services */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Active Services */}
            {activeServices.map((service, i) => (
              <Link key={i} href={service.href} className="group block outline-none">
                <div className={`h-full min-h-[110px] bg-white rounded-xl shadow-sm border-y border-r border-l-[6px] border-slate-200 ${service.borderColor} hover:shadow-md transition-shadow flex items-center p-6 gap-5`}>
                  <div className="shrink-0">
                    {service.icon}
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{service.title}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">{service.description}</p>
                  </div>
                </div>
              </Link>
            ))}

            {/* Upcoming Services (Placeholders) */}
            {upcomingServices.map((service, i) => (
              <div key={i} className={`h-full min-h-[110px] bg-slate-50/80 rounded-xl shadow-sm border-y border-r border-l-[6px] border-slate-200 ${service.borderColor} flex items-center p-6 gap-5 opacity-80 grayscale-[20%]`}>
                <div className="shrink-0">
                  {service.icon}
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <h3 className="font-extrabold text-slate-700 text-lg leading-tight">{service.title}</h3>
                  <p className="text-sm text-slate-400 font-medium mt-1">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Recent Activity */}
        <div className="space-y-4 pb-12">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <div className="bg-white border border-slate-200 shadow-md rounded-xl overflow-hidden ring-1 ring-slate-900/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date & Time</th>
                    <th className="px-6 py-4 font-medium">Service</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentTransactions.map((txn, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500">{txn.date}</td>
                      <td className="px-6 py-4 font-medium">{txn.service}</td>
                      <td className={`px-6 py-4 font-semibold ${txn.amount.startsWith('+') ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {txn.amount}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 w-max px-2.5 py-1 rounded-md text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {txn.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Global Floating WhatsApp Button */}
      <a 
        href="https://wa.me/your_number_here" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
        aria-label="Contact us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  )
}
