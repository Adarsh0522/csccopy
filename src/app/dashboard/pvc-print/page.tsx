'use client'

import { useState, useRef } from 'react'
import { loadPdf, renderPdfPageToCanvas } from '@/lib/pdfProcessor'
import { deductWalletBalance } from '@/lib/actions/wallet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Upload, Printer, FileWarning, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const CARD_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Voter ID',
  'e-Shram Card',
  'Driving License',
  'General ID Card',
  'Manual Print (Custom Images)'
]

export default function PVCPrintPage() {
  // --- Selection State ---
  const [docType, setDocType] = useState(CARD_TYPES[0])
  const isManual = docType === 'Manual Print (Custom Images)'

  // --- PDF Flow State ---
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [extractedPhoto, setExtractedPhoto] = useState<string | null>(null)
  
  // --- Manual Flow State ---
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)

  // --- Shared Adjustments ---
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)

  // --- Internal References ---
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileUpload = async (uploadedFile: File, pdfPassword?: string) => {
    try {
      const pdf = await loadPdf(uploadedFile, pdfPassword)
      setIsPasswordModalOpen(false)
      setFile(uploadedFile)
      
      // Render first page to hidden canvas
      if (hiddenCanvasRef.current) {
        await renderPdfPageToCanvas(pdf, 1, hiddenCanvasRef.current)
        
        // --- SIMULATED EXTRACTION ---
        const ctx = hiddenCanvasRef.current.getContext('2d')
        if (ctx) {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = 200
          tempCanvas.height = 250
          const tempCtx = tempCanvas.getContext('2d')
          tempCtx?.drawImage(hiddenCanvasRef.current, 50, 50, 200, 250, 0, 0, 200, 250)
          setExtractedPhoto(tempCanvas.toDataURL('image/jpeg'))
        }
      }
    } catch (error: any) {
      if (error.name === 'PasswordException') {
        setIsPasswordModalOpen(true)
      } else {
        alert('Failed to process PDF: ' + error.message)
      }
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0])
      if (side === 'front') setFrontImage(url)
      else setBackImage(url)
    }
  }

  const handlePrint = async () => {
    if (isManual && !frontImage && !backImage) {
      alert('Please upload at least one image.')
      return
    }
    
    if (!isManual && !file) {
      alert('Please upload a PDF document.')
      return
    }

    const result = await deductWalletBalance(10.00)
    
    if (!result.success) {
      alert(result.message || 'Failed to deduct balance')
      return
    }

    window.print()
  }

  const hasContent = isManual ? (frontImage || backImage) : file

  return (
    <div className="p-6 relative min-h-[calc(100vh-73px)] bg-slate-50">
      {/* --- UI Section (Hidden during print) --- */}
      <div className="no-print max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">PVC Card Print</h1>
          <p className="text-slate-500 mt-2">Select your document type, upload, adjust, and print perfectly aligned cards.</p>
        </div>

        {/* --- Card Type Selector --- */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <label className="text-sm font-semibold text-slate-700">Select Document Type</label>
          <div className="relative">
            <select
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value)
                // Reset state when switching modes
                setFile(null)
                setExtractedPhoto(null)
                setFrontImage(null)
                setBackImage(null)
              }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3.5 cursor-pointer font-medium outline-none transition-all hover:bg-slate-100"
            >
              {CARD_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* --- PDF Mode --- */}
        {!isManual && !file && (
          <div className="border-2 border-dashed border-blue-200 rounded-3xl p-16 flex flex-col items-center justify-center bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent group-hover:scale-150 transition-transform duration-700" />
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100 relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
              <Upload className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 relative z-10">Upload {docType} PDF</h3>
            <p className="text-sm text-slate-500 mb-6 relative z-10 font-medium">Click to browse or drag and drop</p>
            <Input 
              type="file" 
              accept="application/pdf" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0])
              }} 
            />
          </div>
        )}

        {/* --- Manual Mode --- */}
        {isManual && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Front Upload */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Front Side Image</h3>
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-white min-h-[250px] overflow-hidden group hover:border-blue-400 transition-colors">
                {frontImage ? (
                  <img src={frontImage} alt="Front" className="absolute inset-0 w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center flex flex-col items-center pointer-events-none p-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Upload Front</p>
                    <p className="text-xs text-slate-500 mt-1">Image format only</p>
                  </div>
                )}
                <Input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleImageUpload(e, 'front')} 
                />
              </div>
              {frontImage && (
                <Button variant="outline" onClick={() => setFrontImage(null)} className="w-full rounded-xl">Clear Front Image</Button>
              )}
            </div>

            {/* Back Upload */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Back Side Image</h3>
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-white min-h-[250px] overflow-hidden group hover:border-blue-400 transition-colors">
                {backImage ? (
                  <img src={backImage} alt="Back" className="absolute inset-0 w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center flex flex-col items-center pointer-events-none p-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Upload Back</p>
                    <p className="text-xs text-slate-500 mt-1">Image format only</p>
                  </div>
                )}
                <Input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleImageUpload(e, 'back')} 
                />
              </div>
              {backImage && (
                <Button variant="outline" onClick={() => setBackImage(null)} className="w-full rounded-xl">Clear Back Image</Button>
              )}
            </div>
          </div>
        )}

        {/* Adjustments & Actions */}
        {hasContent && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold mb-6 text-lg text-slate-900">Photo Adjustments</h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-slate-700 font-medium">Brightness</Label>
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{brightness}%</span>
                    </div>
                    <Slider 
                      value={[brightness]} 
                      min={0} max={200} step={1}
                      onValueChange={(v: any) => setBrightness(v[0])}
                      className="accent-blue-600"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-slate-700 font-medium">Contrast</Label>
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{contrast}%</span>
                    </div>
                    <Slider 
                      value={[contrast]} 
                      min={0} max={200} step={1}
                      onValueChange={(v: any) => setContrast(v[0])}
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={handlePrint} size="lg" className="w-full text-lg h-14 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95">
                <Printer className="w-5 h-5 mr-2" />
                Print Cards (₹10.00)
              </Button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
                <Printer className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">Ready to Print</h4>
              <p className="text-emerald-700 text-sm font-medium">Your preview is visible at the bottom of the screen. Adjustments apply directly to the layout.</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Canvas for PDF Rendering */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* --- A4 Print Layout (Visible ONLY during print or preview) --- */}
      <div className="print-container mt-12 no-print-margin">
        <h2 className="no-print text-xl font-bold mb-4 text-center text-slate-400">--- A4 Print Layout Preview ---</h2>
        
        <div className="a4-page">
          <div className="card-grid">
            {/* Render up to 5 rows (10 cards max) */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card-row">
                {/* Front Card */}
                <div className="pvc-card relative bg-slate-100 overflow-hidden">
                  {!isManual && (
                    <div className="absolute inset-0 bg-blue-100/50 flex items-center justify-center text-xs text-blue-400 font-medium tracking-wide">
                      {docType} Front Template
                    </div>
                  )}
                  
                  {!isManual && extractedPhoto && i === 0 && (
                    <img 
                      src={extractedPhoto} 
                      alt="Extracted User"
                      className="absolute top-4 left-4 w-[25mm] h-[30mm] object-cover border border-slate-300 shadow-sm z-10"
                      style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                    />
                  )}

                  {isManual && frontImage && i === 0 && (
                    <img 
                      src={frontImage} 
                      alt="Front Print"
                      className="absolute inset-0 w-full h-full object-cover z-10"
                      style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                    />
                  )}
                  {isManual && !frontImage && i === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                      No Front Image
                    </div>
                  )}
                </div>

                {/* Back Card */}
                <div className="pvc-card relative bg-slate-100 overflow-hidden">
                  {!isManual && (
                    <div className="absolute inset-0 bg-emerald-100/50 flex items-center justify-center text-xs text-emerald-400 font-medium tracking-wide">
                      {docType} Back Template
                    </div>
                  )}

                  {isManual && backImage && i === 0 && (
                    <img 
                      src={backImage} 
                      alt="Back Print"
                      className="absolute inset-0 w-full h-full object-cover z-10"
                      style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                    />
                  )}
                  {isManual && !backImage && i === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                      No Back Image
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <FileWarning className="w-6 h-6 mr-3 text-amber-500" />
              Encrypted PDF
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              This document is protected. Please enter the password to unlock it locally.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              type="password" 
              placeholder="Document Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={() => {
              if (file) handleFileUpload(file, password)
            }} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">Unlock & Process</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
