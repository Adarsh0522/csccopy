import Link from 'next/link'
import { FileText, FileEdit, IndianRupee, ArrowRight, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: "PAN Form Generator | CSCCopy",
};

export default async function PanServicesPage() {
  let panPrice = 10
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('services')
      .select('price')
      .ilike('title', '%pan%')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data?.price != null) {
      panPrice = Number(data.price)
    }
  } catch (err) {
    console.error('Failed to load PAN price:', err)
  }

  const tools = [
    {
      title: 'Generate New PAN Form',
      description: 'Fill applicant details and generate Form 49A application PDF.',
      icon: FileText,
      href: '/dashboard/pan-services/new-pan',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Generate PAN Correction Form',
      description: 'Update or correct existing PAN details with proper CSF form mapping.',
      icon: FileEdit,
      href: '/dashboard/pan-services/pan-correction',
      iconColor: 'text-emerald-600',
    }
  ]

  return (
    <div className="w-full flex-1 p-6 md:p-8 bg-gray-50 min-h-[calc(100vh-73px)]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">PAN Form Generator</h1>
            <p className="text-gray-500 mt-1.5 text-sm">
              Select a form below to generate professional PAN application documents.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Service Fee: ₹{panPrice} per application</span>
          </div>
        </div>

        {/* Available Forms Grid with Generous Width */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Available Forms</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {tools.map((tool) => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-5 group cursor-pointer"
                >
                  {/* Left Icon */}
                  <div className={`flex-shrink-0 p-3.5 sm:p-4 bg-slate-50 rounded-2xl ${tool.iconColor} group-hover:scale-105 group-hover:bg-emerald-50 transition-all duration-300 border border-slate-100`}>
                    <Icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.5} />
                  </div>

                  {/* Right Content */}
                  <div className="flex flex-col flex-grow min-w-0 justify-center">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {tool.description}
                    </p>
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
                      <span className="flex items-center text-emerald-600 font-extrabold text-sm sm:text-base">
                        <IndianRupee className="h-4 w-4 mr-0.5" strokeWidth={2.5} />
                        {panPrice}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
