'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Printer, FileText, Camera, Clock, CheckCircle2, Clock3, UploadCloud, Fingerprint, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('Remove BG')
  const tabs = ['Remove BG', 'Crop Passport', 'Compress JPG', 'JPG to PDF']

  const transactions = [
    { id: '1', date: 'Oct 24, 2026 - 10:30 AM', service: 'PVC Print - Aadhaar', amount: '- ₹10.00', status: 'Completed', color: 'bg-green-100 text-green-700' },
    { id: '2', date: 'Oct 24, 2026 - 09:15 AM', service: 'Wallet Recharge', amount: '+ ₹500.00', status: 'Completed', color: 'bg-green-100 text-green-700' },
    { id: '3', date: 'Oct 23, 2026 - 04:45 PM', service: 'PAN Services - New Form', amount: '- ₹107.00', status: 'Pending', color: 'bg-orange-100 text-orange-700' },
    { id: '4', date: 'Oct 23, 2026 - 02:20 PM', service: 'Photo Studio - BG Remove', amount: '- ₹0.00', status: 'Completed', color: 'bg-green-100 text-green-700' },
    { id: '5', date: 'Oct 22, 2026 - 11:10 AM', service: 'PVC Print - Voter ID', amount: '- ₹10.00', status: 'Completed', color: 'bg-green-100 text-green-700' },
  ]

  return (
    <div className="w-full h-full max-w-7xl mx-auto animate-in fade-in duration-500 space-y-12 pb-12">

      {/* Primary Section: Available Tools Grid */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <Link href="/dashboard/pvc-print" className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-[1.5rem] p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col w-full group">
            <Printer className="absolute -bottom-6 -right-6 text-white/5 h-32 w-32 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-center gap-4 mb-4 relative z-10 w-full">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Printer className="text-white h-7 w-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">PVC Print</h3>
            </div>
            <p className="text-emerald-50 text-sm leading-relaxed relative z-10">Instantly crop and format Aadhaar, PAN, and Voter IDs for CR80 PVC printing.</p>
          </Link>

          <Link href="/dashboard/pan-services" className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-[1.5rem] p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col w-full group">
            <FileText className="absolute -bottom-6 -right-6 text-white/5 h-32 w-32 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-center gap-4 mb-4 relative z-10 w-full">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <FileText className="text-white h-7 w-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">PAN Services</h3>
            </div>
            <p className="text-emerald-50 text-sm leading-relaxed relative z-10">Process new PAN applications or correct existing PAN details seamlessly.</p>
          </Link>

          {/* Coming Soon Card */}
          <div className="bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-[1.5rem] p-6 shadow-lg relative overflow-hidden flex flex-col w-full opacity-80 cursor-not-allowed group">
            <div className="absolute top-4 right-4 bg-white/20 text-white/90 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full z-20 backdrop-blur-sm">
              Coming Soon
            </div>
            <Fingerprint className="absolute -bottom-6 -right-6 text-white/5 h-32 w-32 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-center gap-4 mb-4 relative z-10 pr-20">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <Fingerprint className="text-white/70 h-7 w-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white/90">Aadhaar Services</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed relative z-10">Download e-Aadhaar, update demographic details, and print securely.</p>
          </div>
        </div>
      </div>

      {/* Free Utility Tools Section */}
      <div className="w-full bg-gradient-to-b from-emerald-200/60 to-transparent border border-emerald-300 rounded-[2rem] p-6 sm:p-10 my-8">

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
                  ? 'bg-emerald-600 text-white shadow-md font-semibold transform scale-100'
                  : 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 font-medium'
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

            <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50/50 hover:bg-emerald-50/30 rounded-3xl flex flex-col items-center justify-center p-12 transition-all duration-300 cursor-pointer group">
              <UploadCloud className="text-emerald-600 h-14 w-14 mb-4 transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 ease-out" />
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
          <Link href="/dashboard/wallet" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full">
            View All
          </Link>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-emerald-50/80 text-emerald-800 border-b border-emerald-100">
                  <th className="px-6 py-4 font-semibold text-sm tracking-wide">Service Name</th>
                  <th className="px-6 py-4 font-semibold text-sm tracking-wide">Amount</th>
                  <th className="px-6 py-4 font-semibold text-sm tracking-wide">Date & Time</th>
                  <th className="px-6 py-4 font-semibold text-sm tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors group">

                    {/* Service Name */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{txn.service}</div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <div className={`font-bold ${txn.amount.startsWith('+') ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {txn.amount}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <Clock3 className="w-4 h-4 text-gray-400" />
                        {txn.date}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${txn.color}`}>
                        {txn.status === 'Completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
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
  )
}
