'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToApplications } from '@/lib/realtime'
import { Clock3, CheckCircle2, Clock, XCircle, FileText, Download, Eye, AlertTriangle, FileCheck, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<any>(null)

  useEffect(() => {
    const fetchActivities = async (isInitial: boolean = false) => {
      if (isInitial) setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || '11111111-1111-1111-1111-111111111111'

      const { data, error } = await supabase
        .from('service_applications')
        .select('*, services(title, form_schema)')
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
        return <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>
      case 'Pending': 
        return <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Pending</span>
      case 'Processing': 
        return <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-full text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Processing</span>
      case 'Rejected': 
        return <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> Rejected</span>
      default: 
        return <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>
    }
  }

  return (
    <div className="space-y-6 text-white pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Activity History</h1>
          <p className="text-sm text-indigo-200/80 mt-1">Track all your service applications, review admin remarks, and download completed documents.</p>
        </div>
      </div>

      {/* Main Table Surface */}
      <div className="bg-[#1b183d]/90 border border-indigo-400/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[#110f29] text-indigo-200 border-b border-indigo-500/20">
                <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider">Service Name</th>
                <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider">Admin Remark & Document</th>
                <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/15">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-indigo-300/60 font-medium">Loading activity history...</td></tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <FileText className="w-12 h-12 text-indigo-400/30 mx-auto mb-3" />
                    <p className="text-indigo-200 font-bold text-base">No applications found.</p>
                    <p className="text-sm text-indigo-300/60 mt-1">When you apply for any service, your status and completed files will appear here.</p>
                  </td>
                </tr>
              ) : (
                activities.map(app => (
                  <tr key={app.id} className="hover:bg-indigo-500/15 transition-colors">
                    {/* Order ID */}
                    <td className="px-6 py-4 font-mono text-xs text-indigo-300 font-semibold">
                      {app.id.split('-')[0].toUpperCase()}
                    </td>

                    {/* Service Title */}
                    <td className="px-6 py-4 font-bold text-white">
                      {app.services?.title || 'Custom Service'}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 font-extrabold text-emerald-300">
                      - ₹{app.charge_amount}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-indigo-200/80 font-medium">
                        <Clock3 className="w-3.5 h-3.5 text-indigo-400" />
                        {new Date(app.created_at).toLocaleString()}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {getStatusBadge(app.status)}
                    </td>

                    {/* Admin Remark & Deliverable Document */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 min-w-[200px] max-w-sm">
                        {/* Admin Remark Box */}
                        {app.admin_note && (
                          app.status === 'Rejected' ? (
                            <div className="bg-rose-500/15 border border-rose-400/30 text-rose-200 text-xs px-2.5 py-1.5 rounded-lg break-words whitespace-normal">
                              <span className="font-bold text-rose-300 block mb-0.5">Rejection Reason:</span>
                              <span>{app.admin_note}</span>
                            </div>
                          ) : (
                            <div className="bg-indigo-500/15 border border-indigo-400/25 text-indigo-200 text-xs px-2.5 py-1.5 rounded-lg break-words whitespace-normal">
                              <span className="font-bold text-indigo-300 block mb-0.5">Admin Remark:</span>
                              <span>{app.admin_note}</span>
                            </div>
                          )
                        )}

                        {/* Deliverable Download Button */}
                        {app.result_file_url && (
                          <div>
                            <a
                              href={app.result_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={app.result_file_name || 'Deliverable-Document'}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer whitespace-nowrap"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-950" />
                              <span>Download {app.result_file_name ? (app.result_file_name.length > 18 ? app.result_file_name.slice(0, 15) + '...' : app.result_file_name) : 'Document'}</span>
                            </a>
                          </div>
                        )}

                        {!app.admin_note && !app.result_file_url && (
                          <span className="text-indigo-300/40 text-xs italic">Under review</span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <Button 
                        onClick={() => setSelectedApp(app)} 
                        variant="outline" 
                        size="sm" 
                        className="bg-[#13112c] border-indigo-400/30 text-indigo-200 hover:bg-emerald-500/15 hover:text-emerald-300 hover:border-emerald-400/40 text-xs font-bold rounded-xl h-8 px-3 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User "View Details" Modal */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent 
          showCloseButton={false}
          className="sm:max-w-lg w-[95vw] bg-[#161338] border border-indigo-400/30 rounded-2xl shadow-2xl p-0 overflow-hidden flex flex-col text-white outline-none"
        >
          {selectedApp && (
            <>
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#110f29] border-b border-indigo-500/20 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-white">{selectedApp.services?.title || 'Application Details'}</h3>
                  <p className="text-xs text-indigo-300/70 font-mono mt-0.5">Order ID: {selectedApp.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="w-8 h-8 rounded-full bg-indigo-950/80 border border-indigo-400/30 text-indigo-200 hover:bg-rose-500/20 hover:text-rose-300 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto dark-scrollbar">
                {/* Meta Summary Card */}
                <div className="grid grid-cols-2 gap-3 bg-[#0f0d26] p-4 rounded-xl border border-indigo-400/20 text-xs">
                  <div>
                    <span className="text-indigo-300/70 font-semibold block mb-0.5 uppercase tracking-wider text-[10px]">Date Submitted</span>
                    <span className="font-bold text-white">{new Date(selectedApp.created_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-indigo-300/70 font-semibold block mb-0.5 uppercase tracking-wider text-[10px]">Fee Deducted</span>
                    <span className="font-extrabold text-emerald-300 text-sm">₹{selectedApp.charge_amount}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-indigo-500/20 flex items-center justify-between">
                    <span className="text-indigo-300/70 font-semibold uppercase tracking-wider text-[10px]">Application Status</span>
                    <div>{getStatusBadge(selectedApp.status)}</div>
                  </div>
                </div>

                {/* Deliverable Document Section if Available */}
                {selectedApp.result_file_url && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Final Deliverable Ready</p>
                        <p className="text-xs text-white font-medium truncate">{selectedApp.result_file_name || 'Deliverable Document'}</p>
                      </div>
                    </div>
                    <a
                      href={selectedApp.result_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={selectedApp.result_file_name || 'Deliverable-Document'}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Download className="w-4 h-4 text-slate-950" />
                      <span>Download Final Document</span>
                    </a>
                  </div>
                )}

                {/* Admin Remark / Rejection Reason */}
                {selectedApp.admin_note && (
                  selectedApp.status === 'Rejected' ? (
                    <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-400/30 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Rejection Reason from Admin:</span>
                      </div>
                      <p className="text-rose-200 leading-relaxed whitespace-pre-line pl-0.5">
                        {selectedApp.admin_note}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-indigo-500/15 border border-indigo-400/25 space-y-1.5 text-xs">
                      <p className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">Admin Remark:</p>
                      <p className="text-indigo-100 leading-relaxed whitespace-pre-line">
                        {selectedApp.admin_note}
                      </p>
                    </div>
                  )
                )}

                {/* Submitted User Data */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-200 mb-2">Submitted Applicant Details</h4>
                  {selectedApp.submitted_data && Object.keys(selectedApp.submitted_data).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedApp.services?.form_schema && selectedApp.services.form_schema.length > 0 ? (
                        selectedApp.services.form_schema.map((field: any) => {
                          const value = selectedApp.submitted_data[field.name];
                          if (value === undefined) return null;
                          return (
                            <div key={field.name} className="bg-[#0f0d26] border border-indigo-400/20 p-3 rounded-xl">
                              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                {field.label}
                              </p>
                              <p className="text-xs text-white font-medium break-words mt-1">
                                {value?.toString() || '-'}
                              </p>
                            </div>
                          )
                        })
                      ) : (
                        Object.entries(selectedApp.submitted_data).map(([key, value]) => (
                          <div key={key} className="bg-[#0f0d26] border border-indigo-400/20 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-white font-medium break-words mt-1">
                              {(value as any)?.toString() || '-'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-indigo-300/60 italic">No input data recorded.</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#110f29] border-t border-indigo-500/20 flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedApp(null)}
                  className="bg-transparent border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/15 hover:text-white text-xs font-bold rounded-xl h-9 px-5"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
