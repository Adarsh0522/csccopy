'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, AlertCircle, Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
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

export default function ManageServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()

  // Form State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [price, setPrice] = useState('0')
  const [fields, setFields] = useState<FormField[]>([])

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false })
    if (data) setServices(data)
    setLoading(false)
  }

  const resetForm = () => {
    setEditingServiceId(null)
    setTitle('')
    setDescription('')
    setIcon('')
    setPrice('0')
    setFields([])
  }

  const openEditModal = (service: any) => {
    setEditingServiceId(service.id)
    setTitle(service.title || '')
    setDescription(service.description || '')
    setIcon(service.icon || '')
    setPrice(service.price?.toString() || '0')
    
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
    
    const formSchema = fields.map(f => {
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
      is_active: true,
      form_schema: formSchema
    }

    let submitError;

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Services</h1>
          <p className="text-sm text-slate-500 mt-1">Add or update dynamic services and their forms.</p>
        </div>
        
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Service
        </Button>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[700px] bg-white p-6 rounded-xl border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveService}>
              <DialogHeader className="mb-6">
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {editingServiceId ? 'Edit Service' : 'Create New Service'}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Configure the service details and build the dynamic form that users will fill out.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold text-slate-700">Service Title</Label>
                    <Input required value={title} onChange={e => setTitle(e.target.value)} className="bg-white border-2 border-slate-200 text-slate-900 rounded-lg focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20" placeholder="e.g. New Voter ID" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold text-slate-700">Price (₹)</Label>
                    <Input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-white border-2 border-slate-200 text-slate-900 rounded-lg focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-sm font-bold text-slate-700">Description</Label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} className="bg-white border-2 border-slate-200 text-slate-900 rounded-lg focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20" placeholder="Brief description of the service" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-sm font-bold text-slate-700">Icon Name</Label>
                    <Input required value={icon} onChange={e => setIcon(e.target.value)} className="bg-white border-2 border-slate-200 text-slate-900 rounded-lg focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20" placeholder="e.g. Printer" />
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-emerald-600" /> Use exact icon names from <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">lucide.dev/icons</a>
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 my-4"></div>

                {/* Dynamic Field Builder */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-bold text-slate-900">Form Builder</Label>
                  </div>
                  
                  {fields.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm">
                      <p className="mb-4">No fields added yet. Click below to start building the form.</p>
                      <Button type="button" onClick={addField} variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-white">
                        <Plus className="w-4 h-4 mr-2" /> Add Field
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                              <Label className="text-xs font-bold text-slate-600 mb-2 block">Options (Comma separated)</Label>
                              <Input 
                                value={field.options.join(', ')} 
                                onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })} 
                                className="h-8 text-sm bg-white border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20" 
                                placeholder="e.g. Option 1, Option 2" 
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="pt-2">
                        <Button type="button" onClick={addField} variant="outline" className="w-full border-dashed border-2 border-slate-300 text-slate-600 hover:text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 bg-white">
                          <Plus className="w-4 h-4 mr-2" /> Add Another Field
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-8 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900">Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  <Save className="w-4 h-4 mr-2" /> Save Service
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-sm">Service Title</th>
                <th className="px-6 py-4 font-semibold text-sm">Price</th>
                <th className="px-6 py-4 font-semibold text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-sm">Form Fields</th>
                <th className="px-6 py-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading services...</td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No services found. Add one to get started.</td></tr>
              ) : (
                services.map(service => (
                  <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{service.title}</td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">₹{service.price}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${service.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {service.form_schema?.length || 0} fields configured
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button onClick={() => openEditModal(service)} variant="outline" size="sm" className="bg-white border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50">
                        <Pencil className="w-4 h-4 mr-1.5" /> Edit
                      </Button>
                    </td>
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
