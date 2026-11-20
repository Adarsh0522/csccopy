'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, FileEdit, IndianRupee, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function PanServicesPage() {
  const [panPrice, setPanPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPanPrice() {
      try {
        const supabase = createClient()
        const { data: allSrv } = await supabase
          .from('services')
          .select('price, title, form_schema')

        const panMatch = allSrv?.find((s: any) => 
          s.form_schema?.[0]?.core_tool === 'pan_services' || 
          s.title?.toLowerCase().trim() === 'pan services' || 
          s.title?.toLowerCase().trim() === 'pan form generator' ||
          (s.title?.toLowerCase().includes('pan') && s.price < 100)
        )

        if (panMatch?.price != null) {
          setPanPrice(Number(panMatch.price))
        } else {
          setPanPrice(2)
        }
      } catch (err) {
        console.error('Failed to load PAN price:', err)
        setPanPrice(2)
      } finally {
        setLoading(false)
      }
    }
    fetchPanPrice()
  }, [])

  const tools = [
    {
      title: 'Generate New PAN Form',
      description: 'Fill applicant details and generate Form 49A application PDF.',
      icon: FileText,
      href: '/dashboard/pan-services/new-pan',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Generate PAN Correction Form',
      description: 'Update or correct existing PAN details with proper CSF form mapping.',
      icon: FileEdit,
      href: '/dashboard/pan-services/pan-correction',
      iconColor: 'text-emerald-400',
    }
  ]

  const priceDisplay = loading || panPrice === null ? '...' : panPrice

  return (
    <div className="w-full flex-1 p-6 md:p-8 min-h-[calc(100vh-73px)] text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">PAN Form Generator</h1>
            <p className="text-indigo-200/80 mt-1.5 text-sm">
              Select a form below to generate professional PAN application documents.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Service Fee: ₹{priceDisplay} per application</span>
          </div>
        </div>

        {/* Available Forms Grid with Generous Width */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-emerald-400 pl-3">Available Forms</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {tools.map((tool) => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="bg-[#1b183d]/90 p-5 sm:p-6 rounded-3xl border border-indigo-400/25 shadow-xl hover:shadow-2xl hover:border-emerald-400/60 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-5 group cursor-pointer text-white"
                >
                  {/* Left Icon */}
                  <div className={`flex-shrink-0 p-3.5 sm:p-4 bg-[#0f0d26] rounded-2xl ${tool.iconColor} group-hover:scale-105 transition-all duration-300 border border-indigo-400/20`}>
                    <Icon className="h-8 w-8 sm:h-9 sm:w-9 text-emerald-400" strokeWidth={1.5} />
                  </div>

                  {/* Right Content */}
                  <div className="flex flex-col flex-grow min-w-0 justify-center">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-indigo-200/80 mt-1 line-clamp-1">
                      {tool.description}
                    </p>
                    <div className="flex items-center justify-between text-sm font-semibold text-indigo-200/80 mt-3 pt-2.5 border-t border-indigo-500/20">
                      <span className="flex items-center text-emerald-300 font-extrabold text-sm sm:text-base">
                        <IndianRupee className="h-4 w-4 mr-0.5" strokeWidth={2.5} />
                        {priceDisplay}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Start <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
