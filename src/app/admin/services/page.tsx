'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Trash2, Save, AlertCircle, Pencil, Lock, Printer, CreditCard, Loader2, ShieldCheck, Search, Filter, ChevronLeft, ChevronRight, X, Upload, Image as ImageIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { isImageSource } from '@/lib/utils'

type FieldType = 'text' | 'number' | 'date' | 'select' | 'radio' | 'checkbox'
type FormField = {
  id: string 
  name: string
  label: string
  type: FieldType
  options: string[]
}

const isCoreService = (item: any) => {
  if (!item) return false
  if (typeof item === 'object') {
    if (item.form_schema?.[0]?.core_tool) return true
    const t = (item.title || '').toLowerCase().trim()
    return t === 'pvc print' || t === 'pan services' || t === 'pan form generator'
  }
  const t = (item || '').toLowerCase().trim()
  return t === 'pvc print' || t === 'pan services' || t === 'pan form generator'
}

export default function ManageServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  // Form State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [editingCoreKey, setEditingCoreKey] = useState<'pvc_print' | 'pan_services' | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [price, setPrice] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [fields, setFields] = useState<FormField[]>([])
  const [useCustomUrlOrIcon, setUseCustomUrlOrIcon] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        const map = new Map<string, any>()
        const duplicatesToDelete: string[] = []

        data.forEach((s: any) => {
          const key = s.title?.toLowerCase().trim() || ''
          if (!map.has(key)) {
            map.set(key, s)
          } else {
            const existing = map.get(key)
            if ((s.price === 50 || s.price !== 10) && existing.price === 10) {
              duplicatesToDelete.push(existing.id)
              map.set(key, s)
            } else if ((s.price === 10 || s.price !== 107) && existing.price === 107) {
              duplicatesToDelete.push(existing.id)
              map.set(key, s)
            } else {
              duplicatesToDelete.push(s.id)
            }
          }
        })

        if (duplicatesToDelete.length > 0) {
          for (const dupId of duplicatesToDelete) {
            await supabase.from('services').delete().eq('id', dupId)
          }
        }

        setServices(Array.from(map.values()))
      }
    } catch (err) {
      console.error('Failed to fetch services:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingServiceId(null)
    setEditingCoreKey(null)
    setTitle('')
    setDescription('')
    setIcon('')
    setPrice('0')
    setIsActive(true)
    setFields([])
    setUseCustomUrlOrIcon(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openEditModal = (service: any, coreKey?: 'pvc_print' | 'pan_services') => {
    setEditingServiceId(service.id || null)
    setEditingCoreKey(coreKey || (service.form_schema?.[0]?.core_tool || null))
    setTitle(service.title || '')
    setDescription(service.description || '')
    setIcon(service.icon || '')
    setPrice(service.price ? service.price.toString() : '0')
    setIsActive(service.is_active ?? true)
    setFields(service.form_schema && !service.form_schema?.[0]?.core_tool ? service.form_schema : [])
    setUseCustomUrlOrIcon(Boolean(service.icon && !isImageSource(service.icon)))
    setIsModalOpen(true)
  }

  const addField = () => {
    const newField: FormField = {
      id: Math.random().toString(36).substring(7),
      name: `field_${fields.length + 1}`,
      label: `Field ${fields.length + 1}`,
      type: 'text',
      options: []
    }
    setFields([...fields, newField])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, SVG).')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size exceeds 2MB limit. Please choose a smaller image.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      if (base64) {
        setIcon(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault()

    const isCore = !!editingCoreKey || isCoreService({ title, form_schema: editingCoreKey ? [{ core_tool: editingCoreKey }] : [] })
    let activeCoreKey = editingCoreKey
    if (!activeCoreKey && isCore) {
      const t = title.toLowerCase().trim()
      if (t.includes('pvc')) activeCoreKey = 'pvc_print'
      else if (t.includes('pan')) activeCoreKey = 'pan_services'
    }

    const formSchema = isCore 
      ? [{ core_tool: activeCoreKey || 'pvc_print' }]
      : fields

    const payload = {
      title,
      description,
      icon,
      price: parseFloat(price) || 0,
      is_active: isActive,
      form_schema: formSchema
    }

    let submitError: any = null

    if (editingServiceId) {
      const { error } = await supabase
        .from('services')
        .update(payload)
        .eq('id', editingServiceId)
      submitError = error
    } else {
      if (isCore && activeCoreKey) {
        const { data: existing } = await supabase
          .from('services')
          .select('id, form_schema, title')
        
        const match = existing?.find((s: any) => 
          s.form_schema?.[0]?.core_tool === activeCoreKey ||
          (activeCoreKey === 'pvc_print' && s.title?.toLowerCase().trim() === 'pvc print') ||
          (activeCoreKey === 'pan_services' && (s.title?.toLowerCase().trim() === 'pan services' || s.title?.toLowerCase().trim() === 'pan form generator'))
        )
        
        if (match) {
          const { error } = await supabase
            .from('services')
            .update(payload)
            .eq('id', match.id)
          submitError = error
        } else {
          const { error } = await supabase.from('services').insert([payload])
          submitError = error
        }
      } else {
        const { error } = await supabase.from('services').insert([payload])
        submitError = error
      }
    }

    if (!submitError) {
      setIsModalOpen(false)
      resetForm()
      fetchServices()
    } else {
      alert("Error saving service: " + submitError.message)
    }
  }

  const handleDeleteService = async (serviceId: string, serviceTitle: string, serviceSchema?: any) => {
    if (isCoreService(serviceTitle) || serviceSchema?.[0]?.core_tool) {
      alert('Core system services (PVC Print, PAN Services) are protected and cannot be deleted.')
      return
    }

    const confirmed = window.confirm(`Are you sure you want to delete "${serviceTitle}"?\n\nThis will permanently remove it from the dashboard.`)
    if (!confirmed) return

    setDeletingId(serviceId)
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) {
        if (error.code === '23503') {
          alert(`Cannot delete "${serviceTitle}" because there are existing user applications submitted for it. You can mark it as Inactive instead.`)
        } else {
          alert("Error deleting service: " + error.message)
        }
        return
      }

      await fetchServices()
    } catch (err: any) {
      alert("Failed to delete service: " + (err.message || err))
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered & Paginated services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = 
        !query ||
        service.title?.toLowerCase().includes(query) ||
        (service.description || '').toLowerCase().includes(query)

      const matchesStatus = 
        statusFilter === 'All' ||
        (statusFilter === 'Active' && service.is_active) ||
        (statusFilter === 'Inactive' && !service.is_active)

      return matchesSearch && matchesStatus
    })
  }, [services, searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / ITEMS_PER_PAGE))
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredServices.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredServices, currentPage, ITEMS_PER_PAGE])

  const pvcService = services.find((s: any) => 
    s.form_schema?.[0]?.core_tool === 'pvc_print' || 
    s.title?.toLowerCase().trim() === 'pvc print' ||
    (s.title?.toLowerCase().includes('pvc') && (!s.form_schema || s.form_schema.length <= 1))
  )
  const panService = services.find((s: any) => 
    s.form_schema?.[0]?.core_tool === 'pan_services' || 
    s.title?.toLowerCase().trim() === 'pan services' || 
    s.title?.toLowerCase().trim() === 'pan form generator' ||
    ((s.title?.toLowerCase().trim() === 'pan' || s.title?.toLowerCase().startsWith('pan form')) && (!s.form_schema || s.form_schema.length <= 1))
  )
  const editingIsCore = !!editingCoreKey || isCoreService({ title, form_schema: editingCoreKey ? [{ core_tool: editingCoreKey }] : [] })

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-400/30 text-slate-950 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Manage Services</h1>
              <p className="text-sm text-indigo-200/70 mt-0.5">
                Configure pricing, edit core system tools, or create new custom dynamic services.
              </p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => { resetForm(); setIsModalOpen(true); }} 
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add New Service
        </Button>
      </div>

      {/* CORE SYSTEM SERVICES PRICING CARDS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Core System Tools Pricing</span>
          <span className="text-xs text-indigo-300/60 font-normal">(Built-in Interactive Tools)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PVC Print Card */}
          <div className="bg-[#1b183d]/90 border border-indigo-400/25 rounded-2xl p-5 shadow-xl hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 bg-[#0f0d26] rounded-2xl flex items-center justify-center text-emerald-400 border border-indigo-400/30 shrink-0 overflow-hidden p-1.5 shadow-sm">
                {isImageSource(pvcService?.icon) ? (
                  <img src={pvcService.icon} alt={pvcService?.title || "PVC Card Print"} className="w-full h-full object-contain" />
                ) : (
                  <Printer className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white text-base truncate">
                    {pvcService?.title || 'PVC Card Print'}
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                    Core Tool
                  </span>
                </div>
                <p className="text-xs text-indigo-200/70 mt-0.5 line-clamp-1">
                  {pvcService?.description || 'Aadhaar, PAN, Voter, Ayushman Card Generation'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-indigo-300/70 font-medium">Current Charge:</span>
                  <span className="text-lg font-extrabold text-emerald-300">
                    ₹{pvcService?.price != null ? pvcService.price : 10}
                  </span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => openEditModal(pvcService || {
                id: null,
                title: 'PVC Card Print',
                description: 'Aadhaar, PAN, Voter, Ayushman Card Generation',
                icon: 'Printer',
                price: 10,
                is_active: true,
                form_schema: [{ core_tool: 'pvc_print' }]
              }, 'pvc_print')}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl h-10 px-4 shrink-0 shadow-md flex items-center gap-1.5 self-start sm:self-center cursor-pointer text-xs"
            >
              <Pencil className="w-4 h-4 shrink-0" />
              <span>Edit Tool</span>
            </Button>
          </div>

          {/* PAN Services Card */}
          <div className="bg-[#1b183d]/90 border border-indigo-400/25 rounded-2xl p-5 shadow-xl hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 bg-[#0f0d26] rounded-2xl flex items-center justify-center text-sky-400 border border-indigo-400/30 shrink-0 overflow-hidden p-1.5 shadow-sm">
                {isImageSource(panService?.icon) ? (
                  <img src={panService.icon} alt={panService?.title || "PAN Form Generator"} className="w-full h-full object-contain" />
                ) : (
                  <CreditCard className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white text-base truncate">
                    {panService?.title || 'PAN Form Generator'}
                  </h3>
                  <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                    Core Tool
                  </span>
                </div>
                <p className="text-xs text-indigo-200/70 mt-0.5 line-clamp-1">
                  {panService?.description || 'New PAN & Correction Application Form Generator'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-indigo-300/70 font-medium">Current Charge:</span>
                  <span className="text-lg font-extrabold text-emerald-300">
                    ₹{panService?.price != null ? panService.price : 10}
                  </span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => openEditModal(panService || {
                id: null,
                title: 'PAN Form Generator',
                description: 'New PAN & Correction Application Form Generator',
                icon: 'CreditCard',
                price: 10,
                is_active: true,
                form_schema: [{ core_tool: 'pan_services' }]
              }, 'pan_services')}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl h-10 px-4 shrink-0 shadow-md flex items-center gap-1.5 self-start sm:self-center cursor-pointer text-xs"
            >
              <Pencil className="w-4 h-4 shrink-0" />
              <span>Edit Tool</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ALL SERVICES SECTION WITH SEARCH & PAGINATION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">All Registered Services</h2>
            <p className="text-xs text-indigo-200/70 mt-0.5">Showing {filteredServices.length} of {services.length} total services</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#1b183d]/90 p-4 rounded-2xl border border-indigo-400/25 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:flex-1 sm:min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300/60" />
            <Input 
              placeholder="Search service name or description..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-9 bg-[#0f0d26] border border-indigo-400/30 text-white placeholder-indigo-300/50 rounded-xl focus:border-emerald-400 text-sm h-10 w-full"
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-[#0f0d26] border border-indigo-400/30 rounded-xl px-3 py-2 text-white w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-indigo-200">Status:</span>
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#13112c] text-white">All Statuses</option>
                <option value="Active" className="bg-[#13112c] text-white">Active Only</option>
                <option value="Inactive" className="bg-[#13112c] text-white">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-[#1b183d]/90 border border-indigo-400/25 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-[#110f29] text-indigo-200 border-b border-indigo-500/20 text-xs font-extrabold uppercase tracking-wider">
                  <th className="px-6 py-4">Service Title</th>
                  <th className="px-6 py-4">Price (₹)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Type / Schema</th>
                  <th className="px-6 py-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/15 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-indigo-300 font-medium">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-2" />
                      Loading services...
                    </td>
                  </tr>
                ) : paginatedServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <p className="text-white font-bold text-base">No services match your search or filter.</p>
                      {searchQuery && (
                        <Button 
                          onClick={() => { setSearchQuery(''); setStatusFilter('All'); }} 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 text-xs bg-[#0f0d26] border-indigo-400/30 text-indigo-200 hover:text-white hover:bg-indigo-500/20"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedServices.map(service => {
                    const isCore = isCoreService(service)
                    return (
                      <tr key={service.id} className="hover:bg-indigo-500/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0f0d26] border border-indigo-400/30 flex items-center justify-center overflow-hidden shrink-0 p-1">
                              {isImageSource(service.icon) ? (
                                <img src={service.icon} alt={service.title} className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-indigo-300 font-bold text-xs uppercase">
                                  {service.icon ? service.icon.slice(0, 3) : 'SVC'}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{service.title}</span>
                                {isCore && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                                    Core Tool
                                  </span>
                                )}
                              </div>
                              {service.description && (
                                <p className="text-xs text-indigo-200/60 mt-0.5 max-w-md truncate">{service.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-emerald-300 font-extrabold text-base">₹{service.price}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            service.is_active 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {service.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-indigo-200/70">
                          {isCore ? (
                            <span className="text-xs font-semibold text-indigo-300/60 italic">Built-in Interactive App</span>
                          ) : (
                            <span className="text-xs font-medium text-indigo-200">
                              {service.form_schema?.length || 0} form fields
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              onClick={() => openEditModal(service)} 
                              variant="outline" 
                              size="sm" 
                              className="bg-white/5 border-indigo-400/25 text-indigo-200 hover:text-white hover:bg-indigo-500/20 h-8 px-3 rounded-xl font-semibold text-xs"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>

                            {isCore ? (
                              <span 
                                title="Core system services cannot be deleted"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-300/50 bg-[#0f0d26] px-2.5 py-1.5 rounded-xl border border-indigo-500/20 cursor-not-allowed select-none"
                              >
                                <Lock className="w-3 h-3" /> Protected
                              </span>
                            ) : (
                              <Button 
                                onClick={() => handleDeleteService(service.id, service.title, service.form_schema)} 
                                disabled={deletingId === service.id}
                                variant="outline" 
                                size="sm" 
                                className="bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 h-8 px-3 rounded-xl font-semibold text-xs"
                              >
                                {deletingId === service.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-indigo-500/20 bg-[#13112c]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-indigo-200/70">
              <p>
                Showing <span className="font-bold text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-white">{Math.min(filteredServices.length, currentPage * ITEMS_PER_PAGE)}</span> of <span className="font-bold text-white">{filteredServices.length}</span> services
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
      </div>

      {/* CREATE / EDIT SERVICE DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-[#161338] p-0 rounded-2xl border border-indigo-400/30 shadow-2xl max-h-[90vh] overflow-y-auto text-white">
          <form onSubmit={handleSaveService}>
            <div className="bg-[#110f29] p-6 border-b border-indigo-500/20">
              <DialogTitle className="text-xl font-bold text-white">
                {editingCoreKey 
                  ? `Edit ${title || 'Core Tool'}` 
                  : (editingServiceId ? 'Edit Service' : 'Create New Service')}
              </DialogTitle>
              <DialogDescription className="text-xs text-indigo-200/70 mt-1">
                {editingIsCore 
                  ? 'Update the tool title, description, and charge amount for this core system tool.' 
                  : 'Configure service details and customize the dynamic form fields that operators fill out.'}
              </DialogDescription>
            </div>

            {editingIsCore && (
              <div className="m-6 p-4 bg-sky-950/40 border border-sky-400/30 rounded-xl text-sky-200 text-xs flex items-start gap-3">
                <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Core System Tool:</strong> This is a built-in application. Operators will access it from the dashboard and sidebar with the title, description, and price configured here.
                </div>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-indigo-200 uppercase tracking-wide">Service Title</Label>
                  <Input 
                    required 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl focus:border-emerald-400 text-sm" 
                    placeholder="e.g. PVC Card Print" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-indigo-200 uppercase tracking-wide">Charge / Price (₹)</Label>
                  <Input 
                    required 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    className="bg-[#0f0d26] border border-indigo-400/30 font-bold text-emerald-300 text-base rounded-xl focus:border-emerald-400" 
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-bold text-indigo-200 uppercase tracking-wide">Description</Label>
                  <Input 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl focus:border-emerald-400 text-sm" 
                    placeholder="Brief description of the service" 
                  />
                </div>

                {/* Service Image / Icon Section */}
                <div className="space-y-2 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-indigo-200 uppercase tracking-wide">
                      Service Image / Icon
                    </Label>
                    <button
                      type="button"
                      onClick={() => setUseCustomUrlOrIcon(!useCustomUrlOrIcon)}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                      {useCustomUrlOrIcon ? "← Back to Image Upload" : "Or use Icon name / External URL"}
                    </button>
                  </div>

                  {!useCustomUrlOrIcon ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-indigo-400/30 bg-[#0f0d26]/60 hover:border-emerald-400/60 transition-colors">
                      {/* Image Preview Box */}
                      <div className="w-16 h-16 rounded-xl bg-[#161338] border border-indigo-400/30 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative p-1.5">
                        {isImageSource(icon) ? (
                          <img src={icon} alt="Service Preview" className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="w-7 h-7 text-indigo-400/40" />
                        )}
                      </div>

                      {/* Upload Controls & Instructions */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={handleImageUpload}
                            className="hidden" 
                            id="service-image-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#1b183d] border-indigo-400/30 text-emerald-300 hover:bg-indigo-500/20 font-bold h-9 px-3.5 rounded-xl shadow-xs text-xs flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {isImageSource(icon) ? "Change Image" : "Upload Image"}
                          </Button>

                          {isImageSource(icon) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIcon('')
                                if (fileInputRef.current) fileInputRef.current.value = ''
                              }}
                              className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 h-9 px-3 rounded-xl text-xs"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-indigo-300/60 leading-tight">
                          Upload PNG, JPG, WebP or SVG. Transparent PNG images look best on dashboard cards.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Input 
                        value={icon} 
                        onChange={e => setIcon(e.target.value)} 
                        className="bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl focus:border-emerald-400 text-xs" 
                        placeholder="e.g. Printer, IdCard, or https://example.com/logo.png" 
                      />
                      <p className="text-[11px] text-indigo-300/60 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-emerald-400 shrink-0" /> Enter a Lucide icon name or direct image URL.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-indigo-200 uppercase tracking-wide">Service Status</Label>
                  <div className="h-10 flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isActive} 
                        onChange={e => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 rounded border-indigo-400/40 bg-[#0f0d26] focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold text-white">Active (Visible to users)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Field Builder (Only for custom dynamic services) */}
              {!editingIsCore && (
                <>
                  <div className="border-t border-indigo-500/20 my-4"></div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-base font-bold text-white">Custom Form Fields Builder</Label>
                    </div>
                    
                    {fields.length === 0 ? (
                      <div className="text-center py-8 bg-[#0f0d26] border-2 border-dashed border-indigo-400/25 rounded-2xl text-indigo-300 text-sm">
                        <p className="mb-3">No custom fields added yet. Operators will fill these fields when applying.</p>
                        <Button 
                          type="button" 
                          onClick={addField} 
                          variant="outline" 
                          className="text-emerald-300 border-indigo-400/30 hover:bg-indigo-500/20 bg-white/5 font-semibold text-xs"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add First Field
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {fields.map((field) => (
                          <div key={field.id} className="p-4 bg-[#0f0d26] border border-indigo-400/25 rounded-xl relative group">
                            <button 
                              type="button" 
                              onClick={() => removeField(field.id)} 
                              className="absolute top-3 right-3 text-indigo-400/60 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            
                            <div className="grid grid-cols-12 gap-3 mb-2">
                              <div className="col-span-5 space-y-1">
                                <Label className="text-xs font-bold text-indigo-200">Field Label</Label>
                                <Input 
                                  required 
                                  value={field.label} 
                                  onChange={e => updateField(field.id, { label: e.target.value })} 
                                  className="h-9 text-sm bg-[#161338] border border-indigo-400/30 text-white focus:border-emerald-400" 
                                  placeholder="e.g. Full Name" 
                                />
                              </div>
                              <div className="col-span-4 space-y-1">
                                <Label className="text-xs font-bold text-indigo-200">JSON Key Name</Label>
                                <Input 
                                  required 
                                  value={field.name} 
                                  onChange={e => updateField(field.id, { name: e.target.value })} 
                                  className="h-9 text-sm bg-[#161338] border border-indigo-400/30 text-white focus:border-emerald-400" 
                                  placeholder="e.g. full_name" 
                                />
                              </div>
                              <div className="col-span-3 space-y-1">
                                <Label className="text-xs font-bold text-indigo-200">Type</Label>
                                <select 
                                  value={field.type} 
                                  onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
                                  className="h-9 w-full bg-[#161338] border border-indigo-400/30 text-white rounded-lg px-2 text-sm focus:outline-none focus:border-emerald-400"
                                >
                                  <option value="text" className="bg-[#13112c] text-white">Text</option>
                                  <option value="number" className="bg-[#13112c] text-white">Number</option>
                                  <option value="date" className="bg-[#13112c] text-white">Date</option>
                                  <option value="select" className="bg-[#13112c] text-white">Dropdown</option>
                                  <option value="radio" className="bg-[#13112c] text-white">Radio</option>
                                  <option value="checkbox" className="bg-[#13112c] text-white">Checkbox</option>
                                </select>
                              </div>
                            </div>
                            
                            {/* Options Builder for Select/Radio */}
                            {['select', 'radio', 'checkbox'].includes(field.type) && (
                              <div className="mt-3 bg-[#161338] p-3 border border-indigo-400/25 rounded-lg">
                                <Label className="text-xs font-bold text-indigo-200 mb-1.5 block">Options (Comma separated)</Label>
                                <Input 
                                  value={field.options.join(', ')} 
                                  onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })} 
                                  className="h-8 text-sm bg-[#0f0d26] border border-indigo-400/30 text-white focus:border-emerald-400" 
                                  placeholder="e.g. Option 1, Option 2, Option 3" 
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="pt-2">
                          <Button 
                            type="button" 
                            onClick={addField} 
                            variant="outline" 
                            className="w-full border-dashed border-2 border-indigo-400/30 text-indigo-200 hover:text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/10 bg-white/5 font-semibold text-xs"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Add Another Field
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="p-4 bg-[#110f29] border-t border-indigo-500/20 flex items-center justify-between sm:justify-between w-full">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)} 
                className="bg-white/5 border-indigo-400/25 text-indigo-200 hover:text-white font-semibold"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold px-6 py-2 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 mr-1" /> Save Service
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
