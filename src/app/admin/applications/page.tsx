'use client'

import { useState, useEffect, useMemo } from 'react'
import { Eye, FileText, CheckCircle2, XCircle, Clock, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { subscribeToApplications, emitApplicationCreated } from '@/lib/realtime'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false)
  
  // Search, Filter, Pagination State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [serviceFilter, setServiceFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const supabase = createClient()

  useEffect(() => {
    fetchApplications(true)

    const unsubscribe = subscribeToApplications(() => {
      fetchApplications(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const fetchApplications = async (isInitial: boolean = false) => {
    if (isInitial) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('service_applications')
        .select(`
          *,
          services ( title, form_schema )
        `)
        .order('created_at', { ascending: false })

      if (data) setApplications(data)
    } catch (err) {
      console.error('Failed to fetch applications:', err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  const handleView = (app: any) => {
    setSelectedApp(app)
    setIsModalOpen(true)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedApp) return
    setUpdateStatusLoading(true)
    const { error } = await supabase
      .from('service_applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', selectedApp.id)

    if (!error) {
      setSelectedApp({ ...selectedApp, status: newStatus })
      setApplications(applications.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a))
      emitApplicationCreated({ id: selectedApp.id, status: newStatus })
    } else {
      alert("Failed to update status: " + error.message)
    }
    setUpdateStatusLoading(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>
      case 'Pending': return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Pending</span>
      case 'Processing': return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Processing</span>
      case 'Rejected': return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> Rejected</span>
      default: return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold">{status}</span>
    }
  }

  // Unique Services for Filter
  const uniqueServices = Array.from(new Set(applications.map(app => app.services?.title))).filter(Boolean) as string[]

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const query = searchQuery.toLowerCase().trim()
      const submittedStr = JSON.stringify(app.submitted_data || {}).toLowerCase()

      const matchesSearch = 
        !query ||
        app.id.toLowerCase().includes(query) || 
        (app.services?.title || '').toLowerCase().includes(query) ||
        submittedStr.includes(query)
      
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter
      const matchesService = serviceFilter === 'All' || app.services?.title === serviceFilter
      
      return matchesSearch && matchesStatus && matchesService
    })
  }, [applications, searchQuery, statusFilter, serviceFilter])

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / ITEMS_PER_PAGE))
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredApplications.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredApplications, currentPage, ITEMS_PER_PAGE])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Applications</h1>
          <p className="text-sm text-slate-500 mt-1">Review and process dynamic form submissions offline.</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by Order ID, applicant name, phone, or service..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-9 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-lg text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="text-sm bg-transparent py-2 w-full outline-none font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <select 
            value={serviceFilter}
            onChange={(e) => { setServiceFilter(e.target.value); setCurrentPage(1); }}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 w-full sm:w-auto min-w-[160px]"
          >
            <option value="All">All Services</option>
            {uniqueServices.map(srv => (
              <option key={srv} value={srv}>{srv}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-sm">Order ID</th>
                <th className="px-6 py-4 font-semibold text-sm">Service</th>
                <th className="px-6 py-4 font-semibold text-sm">Date</th>
                <th className="px-6 py-4 font-semibold text-sm">Charge</th>
                <th className="px-6 py-4 font-semibold text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">Loading applications...</td></tr>
              ) : paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-slate-500 font-medium">No applications found.</p>
                    {searchQuery || statusFilter !== 'All' || serviceFilter !== 'All' ? (
                      <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters.</p>
                    ) : null}
                  </td>
                </tr>
              ) : (
                paginatedApplications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{app.id.split('-')[0].toUpperCase()}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{app.services?.title || 'Unknown Service'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(app.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{app.charge_amount}</td>
                    <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button onClick={() => handleView(app)} variant="outline" size="sm" className="bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200">
                        <Eye className="w-4 h-4 mr-1.5" /> View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredApplications.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900">{Math.min(filteredApplications.length, currentPage * ITEMS_PER_PAGE)}</span> of <span className="font-bold text-slate-900">{filteredApplications.length}</span> results
            </p>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 h-8 px-3 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 w-8 text-xs font-bold rounded-lg p-0 ${
                    pageNum === currentPage 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </Button>
              ))}

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 h-8 px-3 text-xs"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white p-6 rounded-xl border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader className="mb-6">
                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Application Details
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Review the user's submitted data for {selectedApp.services?.title}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Meta Data */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Order ID</p>
                    <p className="font-mono text-sm font-bold text-slate-900">{selectedApp.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date Submitted</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(selectedApp.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Submitted JSON Data mapped to a clean grid */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">User Input Data</h3>
                  {selectedApp.submitted_data && Object.keys(selectedApp.submitted_data).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedApp.services?.form_schema ? (
                        selectedApp.services.form_schema.map((field: any) => {
                          const value = selectedApp.submitted_data[field.name];
                          if (value === undefined) return null;
                          return (
                            <div key={field.name} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                              <p className="text-xs font-bold text-emerald-700 mb-1 capitalize">
                                {field.label}
                              </p>
                              <p className="text-sm text-slate-900 font-medium break-words">
                                {value?.toString() || '-'}
                              </p>
                            </div>
                          )
                        })
                      ) : (
                        Object.entries(selectedApp.submitted_data).map(([key, value]) => (
                          <div key={key} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                            <p className="text-xs font-bold text-emerald-700 mb-1 capitalize">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-slate-900 font-medium break-words">
                              {(value as any)?.toString() || '-'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No data submitted.</p>
                  )}
                </div>

                {/* Status Update */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Update Status</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      disabled={updateStatusLoading} 
                      onClick={() => handleStatusChange('Pending')}
                      variant={selectedApp.status === 'Pending' ? 'default' : 'outline'}
                      className={selectedApp.status === 'Pending' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}
                    >
                      Pending
                    </Button>
                    <Button 
                      disabled={updateStatusLoading} 
                      onClick={() => handleStatusChange('Processing')}
                      variant={selectedApp.status === 'Processing' ? 'default' : 'outline'}
                      className={selectedApp.status === 'Processing' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}
                    >
                      Processing
                    </Button>
                    <Button 
                      disabled={updateStatusLoading} 
                      onClick={() => handleStatusChange('Completed')}
                      variant={selectedApp.status === 'Completed' ? 'default' : 'outline'}
                      className={selectedApp.status === 'Completed' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}
                    >
                      Completed
                    </Button>
                    <Button 
                      disabled={updateStatusLoading} 
                      onClick={() => handleStatusChange('Rejected')}
                      variant={selectedApp.status === 'Rejected' ? 'default' : 'outline'}
                      className={selectedApp.status === 'Rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}
                    >
                      Rejected
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-8 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
