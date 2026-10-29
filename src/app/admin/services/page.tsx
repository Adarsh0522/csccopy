'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Save, AlertCircle, Pencil, Lock, Printer, CreditCard, Loader2, ShieldCheck, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type FieldType = 'text' | 'number' | 'date' | 'select' | 'radio' | 'checkbox'
type FormField = {
  id: string 
  name: string
  label: string
  type: FieldType
  options: string[]
}

const isCoreService = (title: string) => {
  const t = (title || '').toLowerCase().trim()
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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [price, setPrice] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [fields, setFields] = useState<FormField[]>([])

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
        // Deduplicate services by normalized title to prevent duplicates
        const map = new Map<string, any>()
        const duplicatesToDelete: string[] = []

        data.forEach((s: any) => {
          const key = s.title?.toLowerCase().trim() || ''
          if (!map.has(key)) {
            map.set(key, s)
          } else {
            // Found a duplicate row in DB
            const existing = map.get(key)
            // If the new one has custom price (user updated), keep it and queue the older one for deletion
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

        // Clean up duplicate rows from database asynchronously
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
    setTitle('')
    setDescription('')
    setIcon('')
    setPrice('0')
    setIsActive(true)
    setFields([])
  }

  const openEditModal = (service: any) => {
    setEditingServiceId(service.id)
    setTitle(service.title || '')
    setDescription(service.description || '')
    setIcon(service.icon || '')
    setPrice(service.price?.toString() || '0')
    setIsActive(service.is_active ?? true)
    
    const existingFields = service.form_schema?.map((f: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name || '',
      label: f.label || '',
      type: f.type || 'text',
      options: f.options || []
    })) || []
    
    setFields(existingFields)
    setIsModalOpen(true)
  }

  const addField = () => {
    setFields([...fields, { id: Math.random().toString(36).substr(2, 9), name: '', label: '', type: 'text', options: [] }])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id))
  }

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isCore = isCoreService(title)

    const formSchema = isCore ? [] : fields.map(f => {
      const cleanField: any = { name: f.name, label: f.label, type: f.type }
      if (['select', 'radio', 'checkbox'].includes(f.type) && f.options.length > 0) {
        cleanField.options = f.options.filter(opt => opt.trim() !== '')
      }
      return cleanField
    })

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
      const { error } = await supabase.from('services').insert([payload])
      submitError = error
    }

    if (!submitError) {
      setIsModalOpen(false)
      resetForm()
      fetchServices()
    } else {
      alert("Error saving service: " + submitError.message)
    }
  }

  const handleDeleteService = async (serviceId: string, serviceTitle: string) => {
    if (isCoreService(serviceTitle)) {
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

  const pvcService = services.find((s: any) => s.title?.toLowerCase().trim() === 'pvc print')
  const panService = services.find((s: any) => {
    const t = s.title?.toLowerCase().trim()
    return t === 'pan services' || t === 'pan form generator'
  })
  const editingIsCore = isCoreService(title)

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Services</h1>
          <p className="text-sm text-slate-500 mt-1">Configure pricing, edit existing tools, or create new custom dynamic services.</p>
        </div>
        
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Service
        </Button>
      </div>

      {/* CORE SYSTEM SERVICES PRICING CARDS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Core System Tools Pricing</span>
          <span className="text-xs text-slate-400 font-normal">(Built-in Interactive Tools)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PVC Print Card */}
          <div className="bg-white border-2 border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">PVC Card Print</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Core Tool</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Aadhaar, PAN, Voter, Ayushman Card Generation</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Current Charge:</span>
                  <span className="text-lg font-extrabold text-emerald-600">₹{pvcService ? pvcService.price : 10}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => openEditModal(pvcService || {
                id: null,
                title: 'PVC Print',
                description: 'Smart Aadhaar, PAN, Voter & Ayushman PVC Card Print generator',
                icon: 'Printer',
                price: 10,
                is_active: true
              })}
              variant="outline" 
              className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl h-10 px-4 shrink-0"
            >
              <Pencil className="w-4 h-4 mr-1.5" /> Edit Price
            </Button>
          </div>

          {/* PAN Services Card */}
          <div className="bg-white border-2 border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">PAN Form Generator</h3>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Core Tool</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">New PAN & Correction Application Form Generator</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Current Charge:</span>
                  <span className="text-lg font-extrabold text-blue-600">₹{panService ? panService.price : 10}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => openEditModal(panService || {
                id: null,
                title: 'PAN Form Generator',
                description: 'Generate New PAN & PAN Correction application forms',
                icon: 'IdCard',
                price: 10,
                is_active: true
              })}
              variant="outline" 
              className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 font-bold rounded-xl h-10 px-4 shrink-0"
            >
              <Pencil className="w-4 h-4 mr-1.5" /> Edit Price
            </Button>
          </div>
        </div>
      </div>

      {/* ALL SERVICES SECTION WITH SEARCH & PAGINATION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">All Registered Services</h2>
            <p className="text-xs text-slate-500 mt-0.5">Showing {filteredServices.length} of {services.length} total services</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search service name or description..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-9 bg-slate-50 border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 text-sm h-10"
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Service Title</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Price (₹)</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Type / Schema</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading services...</td></tr>
                ) : paginatedServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-slate-500 font-medium">No services match your search or filter.</p>
                      {searchQuery && (
                        <Button 
                          onClick={() => { setSearchQuery(''); setStatusFilter('All'); }} 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 text-xs"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedServices.map(service => {
                    const isCore = isCoreService(service.title)
                    return (
                      <tr key={service.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{service.title}</span>
                            {isCore && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                Core Tool
                              </span>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-xs text-slate-400 mt-0.5 max-w-md truncate">{service.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-extrabold text-base">₹{service.price}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${service.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {service.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {isCore ? (
                            <span className="text-xs font-semibold text-slate-400 italic">Built-in Interactive App</span>
                          ) : (
                            <span className="text-xs font-medium text-slate-600">
                              {service.form_schema?.length || 0} form fields
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              onClick={() => openEditModal(service)} 
                              variant="outline" 
                              size="sm" 
                              className="bg-white border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 h-8 px-3 rounded-lg font-semibold"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>

                            {isCore ? (
                              <span 
                                title="Core system services cannot be deleted"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-not-allowed select-none"
                              >
                                <Lock className="w-3 h-3" /> Protected
                              </span>
                            ) : (
                              <Button 
                                onClick={() => handleDeleteService(service.id, service.title)} 
                                disabled={deletingId === service.id}
                                variant="outline" 
                                size="sm" 
                                className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 h-8 px-3 rounded-lg font-semibold"
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
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-800">{Math.min(filteredServices.length, currentPage * ITEMS_PER_PAGE)}</span> of <span className="font-bold text-slate-800">{filteredServices.length}</span> services
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
      </div>

      {/* CREATE / EDIT SERVICE DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveService}>
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {editingServiceId ? (editingIsCore ? `Edit ${title} Charges & Details` : 'Edit Service') : 'Create New Service'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                {editingIsCore 
                  ? 'Update the charge amount and display status for this core system tool.' 
                  : 'Configure service details and customize the dynamic form fields that operators fill out.'}
              </DialogDescription>
            </DialogHeader>

            {editingIsCore && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-3">
                <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Core System Tool:</strong> This is a built-in application. Operators will be charged the exact price you specify here when using this tool.
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Service Title</Label>
                  <Input 
                    required 
                    disabled={editingIsCore}
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20 disabled:opacity-75 disabled:cursor-not-allowed" 
                    placeholder="e.g. New Voter ID" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Charge / Price (₹)</Label>
                  <Input 
                    required 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    className="bg-white border-2 border-emerald-300 font-bold text-emerald-700 text-base rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20" 
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Description</Label>
                  <Input 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="bg-white border-2 border-slate-200 text-slate-900 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20" 
                    placeholder="Brief description of the service" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Icon Name</Label>
                  <Input 
                    required 
                    value={icon} 
                    onChange={e => setIcon(e.target.value)} 
                    className="bg-white border-2 border-slate-200 text-slate-900 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20" 
                    placeholder="e.g. Printer or IdCard" 
                  />
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 text-emerald-600" /> Use Lucide icon names (e.g. Printer, IdCard, User)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Service Status</Label>
                  <div className="h-10 flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isActive} 
                        onChange={e => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">Active (Visible to users)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Field Builder (Only for custom dynamic services) */}
              {!editingIsCore && (
                <>
                  <div className="border-t border-slate-100 my-4"></div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-base font-bold text-slate-900">Custom Form Fields Builder</Label>
                    </div>
                    
                    {fields.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm">
                        <p className="mb-3">No custom fields added yet. Operators will fill these fields when applying.</p>
                        <Button type="button" onClick={addField} variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-white font-semibold">
                          <Plus className="w-4 h-4 mr-2" /> Add First Field
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {fields.map((field) => (
                          <div key={field.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                            <button type="button" onClick={() => removeField(field.id)} className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            
                            <div className="grid grid-cols-12 gap-3 mb-2">
                              <div className="col-span-5 space-y-1">
                                <Label className="text-xs font-bold text-slate-600">Field Label</Label>
                                <Input required value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} className="h-9 text-sm bg-white border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20" placeholder="e.g. Full Name" />
                              </div>
                              <div className="col-span-4 space-y-1">
                                <Label className="text-xs font-bold text-slate-600">JSON Key Name</Label>
                                <Input required value={field.name} onChange={e => updateField(field.id, { name: e.target.value })} className="h-9 text-sm bg-white border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20" placeholder="e.g. full_name" />
                              </div>
                              <div className="col-span-3 space-y-1">
                                <Label className="text-xs font-bold text-slate-600">Type</Label>
                                <select 
                                  value={field.type} 
                                  onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
                                  className="h-9 w-full bg-white border-2 border-slate-200 text-slate-900 rounded-lg px-2 text-sm focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20"
                                >
                                  <option value="text">Text</option>
                                  <option value="number">Number</option>
                                  <option value="date">Date</option>
                                  <option value="select">Dropdown</option>
                                  <option value="radio">Radio</option>
                                  <option value="checkbox">Checkbox</option>
                                </select>
                              </div>
                            </div>
                            
                            {/* Options Builder for Select/Radio */}
                            {['select', 'radio', 'checkbox'].includes(field.type) && (
                              <div className="mt-3 bg-white p-3 border border-slate-200 rounded-lg">
                                <Label className="text-xs font-bold text-slate-600 mb-1.5 block">Options (Comma separated)</Label>
                                <Input 
                                  value={field.options.join(', ')} 
                                  onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })} 
                                  className="h-8 text-sm bg-white border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20" 
                                  placeholder="e.g. Option 1, Option 2, Option 3" 
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="pt-2">
                          <Button type="button" onClick={addField} variant="outline" className="w-full border-dashed border-2 border-slate-300 text-slate-600 hover:text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 bg-white font-semibold">
                            <Plus className="w-4 h-4 mr-2" /> Add Another Field
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6">
                <Save className="w-4 h-4 mr-2" /> Save Service
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
