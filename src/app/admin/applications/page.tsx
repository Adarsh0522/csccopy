'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { 
  Eye, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Save, 
  UploadCloud, 
  FileCheck, 
  Trash2, 
  Loader2, 
  AlertCircle,
  MessageSquare,
  Download,
  AlertTriangle,
  RefreshCw,
  User,
  Phone,
  Mail,
  Store,
  MessageCircle
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { subscribeToApplications, emitApplicationCreated, emitWalletUpdate } from '@/lib/realtime'

function extractPhoneFromData(submittedData: any): string {
  if (!submittedData || typeof submittedData !== 'object') return ''
  const priorityKeys = [
    'mobile', 'phone', 'mobileNumber', 'phoneNumber', 'mobile_number',
    'phone_number', 'mobile_no', 'phone_no', 'contact', 'contact_no', 'whatsapp'
  ]
  for (const k of priorityKeys) {
    if (submittedData[k] && typeof submittedData[k] === 'string') {
      const clean = submittedData[k].replace(/\D/g, '')
      if (clean.length >= 10) {
        return clean.length === 10 ? `+91 ${clean}` : (clean.startsWith('91') ? `+${clean}` : submittedData[k])
      }
    }
  }
  for (const val of Object.values(submittedData)) {
    if (typeof val === 'string') {
      const clean = val.replace(/\D/g, '')
      if (clean.length === 10) {
        return `+91 ${clean}`
      }
      if (clean.length === 12 && clean.startsWith('91')) {
        return `+${clean}`
      }
    }
  }
  return ''
}

function extractNameFromData(submittedData: any): string {
  if (!submittedData || typeof submittedData !== 'object') return ''
  const keys = [
    'full_name', 'fullName', 'applicant_name', 'applicantName',
    'name', 'customer_name', 'customerName', 'operator_name'
  ]
  for (const k of keys) {
    if (submittedData[k] && typeof submittedData[k] === 'string' && submittedData[k].trim().length > 0) {
      return submittedData[k].trim()
    }
  }
  return ''
}

function extractShopFromData(submittedData: any): string {
  if (!submittedData || typeof submittedData !== 'object') return ''
  const keys = [
    'business_name', 'shop_name', 'center_name', 'kendra_name',
    'businessName', 'shopName', 'centerName', 'kendraName', 'firm_name'
  ]
  for (const k of keys) {
    if (submittedData[k] && typeof submittedData[k] === 'string' && submittedData[k].trim().length > 0) {
      return submittedData[k].trim()
    }
  }
  return ''
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Review form state inside modal
  const [selectedStatus, setSelectedStatus] = useState<string>('Pending')
  const [adminNote, setAdminNote] = useState<string>('')
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [existingFileUrl, setExistingFileUrl] = useState<string>('')
  const [existingFileName, setExistingFileName] = useState<string>('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
      const [appsRes, usersRes] = await Promise.all([
        supabase
          .from('service_applications')
          .select(`
            *,
            services ( title, form_schema )
          `)
          .order('created_at', { ascending: false }),
        fetch('/api/admin/users').then(r => r.json()).catch(() => null)
      ])

      const userMap = new Map<string, any>()
      if (usersRes?.success && Array.isArray(usersRes.users)) {
        usersRes.users.forEach((u: any) => {
          if (u.id) userMap.set(u.id, u)
        })
      }

      // If /api/admin/users didn't populate userMap, fallback to public.users table directly
      if (userMap.size === 0) {
        const { data: publicUsers } = await supabase.from('users').select('*')
        if (publicUsers) {
          publicUsers.forEach((u: any) => {
            if (u.id) userMap.set(u.id, u)
          })
        }
      }

      if (appsRes.data) {
        const enriched = appsRes.data.map((app: any) => {
          const user = userMap.get(app.user_id) || {}
          const fallbackName = extractNameFromData(app.submitted_data)
          const fallbackPhone = extractPhoneFromData(app.submitted_data)
          const fallbackShop = extractShopFromData(app.submitted_data)

          let name = user.full_name
          if (!name || name === 'CSC Operator') {
            name = fallbackName || `CSC Operator (${(app.user_id || '').slice(0, 6)})`
          }

          let phone = user.phone
          if (!phone || phone === 'Not set' || phone.includes('Not Synced')) {
            phone = fallbackPhone || 'No Phone'
          }

          let business = user.business_name || fallbackShop || 'CSC Center'
          let email = user.email || ''

          return {
            ...app,
            applicant_name: name,
            applicant_phone: phone,
            applicant_business: business,
            applicant_email: email,
          }
        })

        setApplications(enriched)
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  const handleView = (app: any) => {
    setSelectedApp(app)
    setSelectedStatus(app.status || 'Pending')
    setAdminNote(app.admin_note || '')
    setFileToUpload(null)
    setExistingFileUrl(app.result_file_url || '')
    setExistingFileName(app.result_file_name || '')
    setStatusMessage(null)
    setIsModalOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'File size exceeds 10MB limit. Please choose a smaller file.' })
        return
      }
      setFileToUpload(file)
      setStatusMessage(null)
    }
  }

  const handleSaveReview = async () => {
    if (!selectedApp) return

    // Validation: If rejecting, a note/reason is required
    if (selectedStatus === 'Rejected' && !adminNote.trim()) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Please provide a reason in the Admin Note field before rejecting the application.' 
      })
      return
    }

    setSaveLoading(true)
    setStatusMessage(null)

    try {
      let finalFileUrl = existingFileUrl
      let finalFileName = existingFileName

      // 1. If a new file was chosen, upload it to Supabase Storage
      if (fileToUpload) {
        const fileExt = fileToUpload.name.split('.').pop()
        const cleanFileName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `${selectedApp.user_id}/${selectedApp.id}_${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('application-deliverables')
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.warn('Storage upload warning:', uploadError.message)
          // If custom bucket not configured yet, fallback gracefully
          const { data: pubUrlData } = supabase.storage
            .from('services')
            .getPublicUrl(filePath)
          finalFileUrl = pubUrlData?.publicUrl || ''
          finalFileName = fileToUpload.name
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('application-deliverables')
            .getPublicUrl(filePath)
          finalFileUrl = publicUrlData.publicUrl
          finalFileName = fileToUpload.name
        }
      }

      // 2. Update service_applications record
      const updatePayload: Record<string, any> = {
        status: selectedStatus,
        admin_note: adminNote.trim() || null,
        result_file_url: finalFileUrl || null,
        result_file_name: finalFileName || null,
      }

      const { data: updatedApp, error: updateError } = await supabase
        .from('service_applications')
        .update(updatePayload)
        .eq('id', selectedApp.id)
        .select(`
          *,
          services ( title, form_schema )
        `)
        .single()

      if (updateError) {
        // Fallback: If result_file_url column doesn't exist yet, retry updating just status
        if (updateError.message?.includes('result_file_url') || updateError.message?.includes('admin_note')) {
          const { data: fallbackApp, error: fallbackError } = await supabase
            .from('service_applications')
            .update({ status: selectedStatus })
            .eq('id', selectedApp.id)
            .select(`*, services ( title, form_schema )`)
            .single()

          if (fallbackError) throw fallbackError
        } else {
          throw updateError
        }
      }

      // Notify realtime clients
      emitApplicationCreated(updatedApp || { ...selectedApp, ...updatePayload })

      // Update local state
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...updatePayload } : a))
      setSelectedApp((prev: any) => ({ ...prev, ...updatePayload }))

      setStatusMessage({ 
        type: 'success', 
        text: `Application successfully updated to "${selectedStatus}"!` 
      })

      setTimeout(() => {
        setIsModalOpen(false)
      }, 1000)

    } catch (err: any) {
      console.error('Update application error:', err)
      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Failed to update application. Please try again.' 
      })
    } finally {
      setSaveLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': 
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed
          </span>
        )
      case 'Pending': 
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending
          </span>
        )
      case 'Processing': 
        return (
          <span className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-300 border border-sky-400/40 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Clock className="w-3.5 h-3.5 text-sky-400" /> Processing
          </span>
        )
      case 'Rejected': 
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-400/40 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Rejected
          </span>
        )
      default: 
        return (
          <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold">
            {status}
          </span>
        )
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
        (app.admin_note || '').toLowerCase().includes(query) ||
        (app.applicant_name || '').toLowerCase().includes(query) ||
        (app.applicant_phone || '').toLowerCase().includes(query) ||
        (app.applicant_email || '').toLowerCase().includes(query) ||
        (app.applicant_business || '').toLowerCase().includes(query) ||
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-400/30 text-slate-950 font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">User Applications</h1>
              <p className="text-sm text-indigo-200/70 mt-0.5">
                Review applicant submissions, attach completed deliverable files, and update application status.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchApplications(false)}
          className="bg-white/5 border-indigo-400/25 text-indigo-200 hover:text-white hover:bg-indigo-500/15 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh List
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-[#1b183d]/90 p-4 rounded-2xl border border-indigo-400/25 shadow-xl items-center justify-between">
        <div className="relative w-full md:flex-1 md:min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300/60" />
          <Input 
            placeholder="Search by Order ID, applicant name, phone, or service..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-9 bg-[#0f0d26] border border-indigo-400/30 text-white placeholder-indigo-300/55 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm outline-none w-full"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#0f0d26] border border-indigo-400/30 rounded-xl px-3 py-2 text-white">
            <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs bg-transparent outline-none font-semibold text-white cursor-pointer"
            >
              <option value="All" className="bg-[#13112c] text-white">All Statuses</option>
              <option value="Pending" className="bg-[#13112c] text-white">Pending</option>
              <option value="Processing" className="bg-[#13112c] text-white">Processing</option>
              <option value="Completed" className="bg-[#13112c] text-white">Completed</option>
              <option value="Rejected" className="bg-[#13112c] text-white">Rejected</option>
            </select>
          </div>

          {/* Service Filter */}
          <select 
            value={serviceFilter}
            onChange={(e) => { setServiceFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs bg-[#0f0d26] border border-indigo-400/30 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400 font-semibold cursor-pointer min-w-[160px]"
          >
            <option value="All" className="bg-[#13112c] text-white">All Services</option>
            {uniqueServices.map(srv => (
              <option key={srv} value={srv} className="bg-[#13112c] text-white">{srv}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-[#1b183d]/90 border border-indigo-400/25 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[#110f29] text-indigo-200 border-b border-indigo-500/20 text-xs font-extrabold uppercase tracking-wider">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">User / Operator</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Charge</th>
                <th className="px-6 py-4">Status &amp; Deliverable</th>
                <th className="px-6 py-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/15 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-indigo-300 font-medium">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-2" />
                    Loading applications...
                  </td>
                </tr>
              ) : paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <FileText className="w-12 h-12 text-indigo-400/40 mx-auto mb-2" />
                    <p className="text-white font-bold text-base">No applications found</p>
                    <p className="text-xs text-indigo-200/60 mt-1">
                      {searchQuery || statusFilter !== 'All' || serviceFilter !== 'All' 
                        ? 'Try adjusting your search query or filters.' 
                        : 'No users have placed service applications yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedApplications.map(app => (
                  <tr key={app.id} className="hover:bg-indigo-500/10 transition-colors">
                    {/* Order ID */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-indigo-200 bg-[#0f0d26] border border-indigo-400/25 px-2.5 py-1 rounded-md">
                        {app.id.split('-')[0].toUpperCase()}
                      </span>
                    </td>

                    {/* User / Operator */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
                          {(app.applicant_name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate max-w-[170px]" title={app.applicant_name}>
                            {app.applicant_name}
                          </p>
                          {app.applicant_phone && app.applicant_phone !== 'No Phone' ? (
                            <a 
                              href={`https://wa.me/${app.applicant_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${app.applicant_name}, regarding your order ${app.id.split('-')[0].toUpperCase()} for ${app.services?.title || 'Service'} on CSCCopy:`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-300/90 hover:text-emerald-300 text-xs font-mono flex items-center gap-1 group mt-0.5"
                              title="Click to chat on WhatsApp"
                            >
                              <Phone className="w-3 h-3 text-emerald-400/80 group-hover:text-emerald-400" />
                              <span>{app.applicant_phone}</span>
                            </a>
                          ) : (
                            <span className="text-indigo-300/50 text-xs italic">No phone</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Service Title */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{app.services?.title || 'Unknown Service'}</p>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-xs text-indigo-200/70">
                      {new Date(app.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Charge Amount */}
                    <td className="px-6 py-4">
                      <span className="text-emerald-300 font-extrabold text-sm">
                        ₹{app.charge_amount}
                      </span>
                    </td>

                    {/* Status & Deliverable Pill */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(app.status)}
                        {app.result_file_url && (
                          <span title="Deliverable document attached" className="p-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            <FileCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {app.admin_note && (
                          <span title={`Remark: ${app.admin_note}`} className="p-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right pr-6">
                      <Button 
                        onClick={() => handleView(app)} 
                        size="sm" 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md whitespace-nowrap cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Review &amp; Deliver
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
          <div className="px-6 py-4 border-t border-indigo-500/20 bg-[#13112c]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-indigo-200/70">
            <p>
              Showing <span className="font-bold text-white">{filteredApplications.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-white">{Math.min(filteredApplications.length, currentPage * ITEMS_PER_PAGE)}</span> of <span className="font-bold text-white">{filteredApplications.length}</span> applications
            </p>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-[#0f0d26] border-indigo-400/30 text-indigo-200 hover:text-white hover:bg-indigo-500/20 h-8 px-3 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <Button
                  key={pageNum}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 w-8 text-xs font-bold rounded-lg p-0 ${
                    pageNum === currentPage 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-md' 
                      : 'bg-[#0f0d26] border border-indigo-400/30 text-indigo-200 hover:text-white hover:bg-indigo-500/20'
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
                className="bg-[#0f0d26] border-indigo-400/30 text-indigo-200 hover:text-white hover:bg-indigo-500/20 h-8 px-3 text-xs"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* REVIEW & DELIVERABLE MODAL */}
      {/* ======================================================== */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[680px] bg-[#161338] p-0 rounded-2xl border border-indigo-400/30 shadow-2xl max-h-[92vh] overflow-y-auto text-white">
          {selectedApp && (
            <>
              {/* Header */}
              <div className="bg-[#110f29] p-6 border-b border-indigo-500/20">
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Review Application &amp; Attach Deliverable
                </DialogTitle>
                <DialogDescription className="text-xs text-indigo-200/70 mt-1">
                  Update status, attach final deliverable PDF/images, and add operator notes for {selectedApp.services?.title}.
                </DialogDescription>
              </div>

              <div className="p-6 space-y-6">
                {statusMessage && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    statusMessage.type === 'success' 
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300' 
                      : 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                  }`}>
                    {statusMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                {/* Meta Summary Card */}
                <div className="grid grid-cols-3 gap-3 bg-[#0f0d26] p-3.5 rounded-xl border border-indigo-400/25 text-xs">
                  <div>
                    <p className="font-semibold text-indigo-300/70 uppercase tracking-wider mb-0.5">Order ID</p>
                    <p className="font-mono font-bold text-white truncate" title={selectedApp.id}>{selectedApp.id}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-indigo-300/70 uppercase tracking-wider mb-0.5">Date</p>
                    <p className="font-bold text-white">{new Date(selectedApp.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-indigo-300/70 uppercase tracking-wider mb-0.5">Service Fee</p>
                    <p className="font-extrabold text-emerald-300 text-sm">₹{selectedApp.charge_amount}</p>
                  </div>
                </div>

                {/* Submitted By (Operator / User) Details Card */}
                <div className="bg-[#0f0d26] p-4 rounded-xl border border-indigo-400/25 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      Submitted By (Operator)
                    </h3>
                    {selectedApp.applicant_phone && selectedApp.applicant_phone !== 'No Phone' && (
                      <a
                        href={`https://wa.me/${selectedApp.applicant_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selectedApp.applicant_name}, regarding your application ${selectedApp.id.split('-')[0].toUpperCase()} for ${selectedApp.services?.title || 'Service'} on CSCCopy:`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 hover:bg-emerald-500/25 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        title="Chat with Operator on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp Operator</span>
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] font-semibold text-indigo-300/70 uppercase tracking-wider">Operator Name</p>
                      <p className="font-bold text-white text-sm mt-0.5 truncate" title={selectedApp.applicant_name}>
                        {selectedApp.applicant_name || 'CSC Operator'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold text-indigo-300/70 uppercase tracking-wider">Mobile Number</p>
                      {selectedApp.applicant_phone && selectedApp.applicant_phone !== 'No Phone' ? (
                        <a
                          href={`https://wa.me/${selectedApp.applicant_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-emerald-300 text-sm mt-0.5 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{selectedApp.applicant_phone}</span>
                        </a>
                      ) : (
                        <p className="font-mono text-indigo-300/50 text-xs mt-0.5 italic">Not available</p>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold text-indigo-300/70 uppercase tracking-wider">Center / Shop</p>
                      <p className="font-medium text-indigo-100 text-xs mt-0.5 truncate" title={selectedApp.applicant_business}>
                        {selectedApp.applicant_business || 'CSC Center'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold text-indigo-300/70 uppercase tracking-wider">Email Address</p>
                      <p className="font-medium text-indigo-200/80 text-xs mt-0.5 truncate" title={selectedApp.applicant_email}>
                        {selectedApp.applicant_email || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submitted User Data */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-200 mb-2">
                    Applicant Submitted Data
                  </h3>
                  {selectedApp.submitted_data && Object.keys(selectedApp.submitted_data).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1 border border-indigo-500/20 rounded-xl bg-[#0f0d26]/60">
                      {selectedApp.services?.form_schema && selectedApp.services.form_schema.length > 0 ? (
                        selectedApp.services.form_schema.map((field: any) => {
                          const value = selectedApp.submitted_data[field.name];
                          if (value === undefined) return null;
                          return (
                            <div key={field.name} className="bg-[#1b183d]/90 border border-indigo-400/25 p-2.5 rounded-lg shadow-xs">
                              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                                {field.label}
                              </p>
                              <p className="text-xs text-white font-medium break-words mt-0.5">
                                {value?.toString() || '-'}
                              </p>
                            </div>
                          )
                        })
                      ) : (
                        Object.entries(selectedApp.submitted_data).map(([key, value]) => (
                          <div key={key} className="bg-[#1b183d]/90 border border-indigo-400/25 p-2.5 rounded-lg shadow-xs">
                            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-white font-medium break-words mt-0.5">
                              {(value as any)?.toString() || '-'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-indigo-300/50 italic">No input data submitted.</p>
                  )}
                </div>

                {/* Status Selection */}
                <div className="space-y-2 pt-2 border-t border-indigo-500/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">Application Status</Label>
                    <span className="text-[11px] text-indigo-300/60 font-medium">Select a status, add note, then click Save</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'Pending', label: 'Pending', icon: Clock, activeClass: 'bg-amber-500 text-slate-950 font-extrabold ring-2 ring-amber-400/40 shadow', inactiveClass: 'bg-[#0f0d26] border border-indigo-400/25 text-indigo-200 hover:bg-indigo-500/10' },
                      { key: 'Processing', label: 'Processing', icon: Clock, activeClass: 'bg-sky-500 text-slate-950 font-extrabold ring-2 ring-sky-400/40 shadow', inactiveClass: 'bg-[#0f0d26] border border-indigo-400/25 text-indigo-200 hover:bg-indigo-500/10' },
                      { key: 'Completed', label: 'Completed', icon: CheckCircle2, activeClass: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold ring-2 ring-emerald-400/40 shadow', inactiveClass: 'bg-[#0f0d26] border border-indigo-400/25 text-indigo-200 hover:bg-indigo-500/10' },
                      { key: 'Rejected', label: 'Rejected', icon: XCircle, activeClass: 'bg-rose-600 text-white font-extrabold ring-2 ring-rose-500/40 shadow', inactiveClass: 'bg-[#0f0d26] border border-indigo-400/25 text-indigo-200 hover:bg-indigo-500/10' },
                    ].map(s => {
                      const isSelected = selectedStatus === s.key
                      const Icon = s.icon
                      return (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => setSelectedStatus(s.key)}
                          className={`h-10 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected ? s.activeClass : s.inactiveClass
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{s.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Admin Note / Rejection Reason Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-extrabold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                      <span>Admin Note / Remark (Visible to User)</span>
                      {selectedStatus === 'Rejected' && (
                        <span className="text-[10px] text-rose-300 font-bold bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-400/30">
                          * Required for Rejection
                        </span>
                      )}
                    </Label>
                    <span className="text-[11px] text-indigo-300/60">Operators will see this note in Activity History</span>
                  </div>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={
                      selectedStatus === 'Rejected'
                        ? "Enter exact reason for rejection (e.g., Blurry document, mismatch in applicant name/DOB, incorrect signature)..."
                        : "Optional remarks (e.g., Application approved! Download your final certificate below)..."
                    }
                    className={`w-full p-3 rounded-xl text-xs bg-[#0f0d26] border border-indigo-400/30 text-white placeholder-indigo-300/40 focus:outline-none transition-all ${
                      selectedStatus === 'Rejected'
                        ? 'border-rose-400/60 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/20'
                        : 'focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>

                {/* Upload Deliverable Document (PDF, JPG, PNG) */}
                <div className="space-y-2 pt-2 border-t border-indigo-500/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">
                      Upload Deliverable Document (PDF, JPG, PNG, WebP)
                    </Label>
                    <span className="text-[11px] text-indigo-300/60">Max 10MB</span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {fileToUpload || existingFileUrl ? (
                    <div className="flex items-center justify-between p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">
                            {fileToUpload ? fileToUpload.name : (existingFileName || 'Deliverable Document')}
                          </p>
                          <p className="text-[11px] text-emerald-300 font-semibold">
                            {fileToUpload 
                              ? `${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload on Save`
                              : 'Deliverable document currently attached'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {existingFileUrl && (
                          <a 
                            href={existingFileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </a>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs bg-[#0f0d26] border-indigo-400/30 text-indigo-200 hover:text-white hover:bg-indigo-500/20 h-8 px-2.5 font-semibold"
                        >
                          Replace
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFileToUpload(null)
                            setExistingFileUrl('')
                            setExistingFileName('')
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="text-xs text-rose-400 hover:bg-rose-500/10 h-8 px-2 font-semibold"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-indigo-400/30 hover:border-emerald-400 bg-[#0f0d26]/60 hover:bg-indigo-500/10 rounded-xl p-5 text-center cursor-pointer transition-colors"
                    >
                      <UploadCloud className="w-8 h-8 text-indigo-400/60 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-white">Click to select final document (PDF, JPG, PNG)</p>
                      <p className="text-[11px] text-indigo-300/60 mt-0.5">The user will be able to download this from their dashboard.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#110f29] border-t border-indigo-500/20 flex items-center justify-between w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)} 
                  className="bg-white/5 border-indigo-400/25 text-indigo-200 hover:text-white hover:bg-white/10 font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveReview}
                  disabled={saveLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold px-6 py-2 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
                >
                  {saveLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Application...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save &amp; Update Application</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
