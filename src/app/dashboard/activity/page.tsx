'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToApplications } from '@/lib/realtime'
import { Clock3, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react'

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async (isInitial: boolean = false) => {
      if (isInitial) setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || '11111111-1111-1111-1111-111111111111'

      const { data, error } = await supabase
        .from('service_applications')
        .select('*, services(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (data) setActivities(data)
      if (isInitial) setLoading(false)
    }

    fetchActivities(true)

    const unsub = subscribeToApplications(() => {
      fetchActivities(false)
    })

    return () => {
      unsub()
    }
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': 
        return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>
      case 'Pending': 
        return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Pending</span>
      case 'Processing': 
        return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Processing</span>
      case 'Rejected': 
        return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> Rejected</span>
      default: 
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity History</h1>
          <p className="text-sm text-slate-500 mt-1">Track all your applications and wallet charges.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-sm">Order ID</th>
                <th className="px-6 py-4 font-semibold text-sm">Service Name</th>
                <th className="px-6 py-4 font-semibold text-sm">Amount Deducted</th>
                <th className="px-6 py-4 font-semibold text-sm">Date & Time</th>
                <th className="px-6 py-4 font-semibold text-sm">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading activity...</td></tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No applications found.</p>
                    <p className="text-sm text-slate-400 mt-1">When you apply for a service, it will appear here.</p>
                  </td>
                </tr>
              ) : (
                activities.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{app.id.split('-')[0].toUpperCase()}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{app.services?.title || 'Unknown Service'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">- ₹{app.charge_amount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <Clock3 className="w-4 h-4 text-slate-400" />
                        {new Date(app.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
