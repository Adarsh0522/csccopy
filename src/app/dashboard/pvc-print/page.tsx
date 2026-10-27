'use client'

import { useState, useRef } from 'react'
import { loadPdf, renderPdfPageToCanvas } from '@/lib/pdfProcessor'
import { deductWalletBalance } from '@/lib/actions/wallet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Upload, Printer, FileWarning, ChevronDown, Image as ImageIcon, Settings2, FileText, CheckCircle2 } from 'lucide-react'
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
    <div className="w-full h-full animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* --- UI Section (Hidden during print) --- */}
      <div className="no-print space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <Printer className="w-10 h-10 text-emerald-600" />
              PVC Card Print
            </h1>
            <p className="text-slate-600 mt-3 text-lg font-medium">Select your document type, upload, perfectly adjust, and print premium PVC cards.</p>
          </div>

          {hasContent && (
            <Button onClick={handlePrint} size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl bg-slate-900 hover:bg-emerald-600 shadow-xl hover:shadow-emerald-500/20 transition-all active:scale-95 text-white">
              <Printer className="w-6 h-6 mr-3" />
              Print Now (₹10.00)
            </Button>
          )}
        </div>

        {/* --- Card Type Selector --- */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg shadow-slate-100/50 space-y-4">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Select Document Type
          </label>
          <div className="relative">
            <select
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value)
                setFile(null)
                setExtractedPhoto(null)
                setFrontImage(null)
                setBackImage(null)
              }}
              className="w-full appearance-none bg-slate-50 border-2 border-slate-200 text-slate-900 text-base font-bold rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 block p-4 cursor-pointer outline-none transition-all hover:bg-slate-100 shadow-inner"
            >
              {CARD_TYPES.map(type => (
                <option key={type} value={type} className="font-medium text-slate-900">{type}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-slate-500">
              <ChevronDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* --- PDF Mode Upload --- */}
        {!isManual && !file && (
          <div className="border-3 border-dashed border-slate-300 rounded-[2rem] p-16 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-slate-50 hover:border-emerald-500 transition-all duration-300 group relative overflow-hidden shadow-sm">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-100 relative z-10 group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-12 h-12 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 relative z-10">Upload {docType} PDF</h3>
            <p className="text-base text-slate-500 mb-6 relative z-10 font-medium bg-slate-100 px-4 py-1.5 rounded-full">Click to browse or drag and drop here</p>
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

        {/* --- Manual Mode Upload --- */}
        {isManual && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-500" />
                Front Side Image
              </h3>
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-slate-50 min-h-[280px] overflow-hidden group hover:border-emerald-500 hover:bg-emerald-50/30 transition-all">
                {frontImage ? (
                  <img src={frontImage} alt="Front" className="absolute inset-0 w-full h-full object-contain p-3" />
                ) : (
                  <div className="text-center flex flex-col items-center pointer-events-none p-6">
                    <div className="w-16 h-16 bg-white text-emerald-600 rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-bold text-slate-800">Upload Front</p>
                    <p className="text-sm text-slate-500 mt-2 font-medium">JPEG, PNG only</p>
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
                <Button variant="outline" onClick={() => setFrontImage(null)} className="w-full rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-bold">Clear Front Image</Button>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-500" />
                Back Side Image
              </h3>
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-slate-50 min-h-[280px] overflow-hidden group hover:border-emerald-500 hover:bg-emerald-50/30 transition-all">
                {backImage ? (
                  <img src={backImage} alt="Back" className="absolute inset-0 w-full h-full object-contain p-3" />
                ) : (
                  <div className="text-center flex flex-col items-center pointer-events-none p-6">
                    <div className="w-16 h-16 bg-white text-emerald-600 rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-bold text-slate-800">Upload Back</p>
                    <p className="text-sm text-slate-500 mt-2 font-medium">JPEG, PNG only</p>
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
                <Button variant="outline" onClick={() => setBackImage(null)} className="w-full rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-bold">Clear Back Image</Button>
              )}
            </div>
          </div>
        )}

        {/* --- Adjustments Panel --- */}
        {hasContent && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg shadow-slate-100/50">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Settings2 className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-extrabold text-2xl text-slate-900">Fine-tune Print Quality</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <Label className="text-slate-700 font-bold text-base">Brightness</Label>
                  <span className="text-sm font-black text-white bg-slate-800 px-3 py-1 rounded-md shadow-inner">{brightness}%</span>
                </div>
                <Slider
                  value={[brightness]}
                  min={0} max={200} step={1}
                  onValueChange={(v: any) => setBrightness(v[0])}
                  className="py-2"
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <Label className="text-slate-700 font-bold text-base">Contrast</Label>
                  <span className="text-sm font-black text-white bg-slate-800 px-3 py-1 rounded-md shadow-inner">{contrast}%</span>
                </div>
                <Slider
                  value={[contrast]}
                  min={0} max={200} step={1}
                  onValueChange={(v: any) => setContrast(v[0])}
                  className="py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Ready indicator */}
        {hasContent && (
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-center justify-between text-left">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-900 text-lg">Document Ready</h4>
                <p className="text-emerald-700 text-sm font-medium">Scroll down to see the real-time print preview. Layout updates instantly.</p>
              </div>
            </div>
            {/* Mobile print button duplication for convenience */}
            <Button onClick={handlePrint} className="hidden md:flex rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold px-6 shadow-lg shadow-emerald-200">
              Print Now
            </Button>
          </div>
        )}
      </div>

      {/* Hidden Canvas for PDF Rendering */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* --- A4 Print Layout (Visible ONLY during print or preview) --- */}
      <div className="print-container mt-16 no-print-margin pb-10">
        <div className="no-print flex items-center justify-center gap-4 mb-8">
          <div className="h-px bg-slate-300 flex-1 max-w-[200px]" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Live A4 Layout Preview</h2>
          <div className="h-px bg-slate-300 flex-1 max-w-[200px]" />
        </div>

        <div className="a4-page">
          <div className="card-grid">
            {/* Render up to 5 rows (10 cards max) */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card-row">
                {/* Front Card */}
                <div className="pvc-card relative bg-white overflow-hidden shadow-sm">
                  {!isManual && (
                    <div className="absolute inset-0 bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 font-bold uppercase tracking-widest text-[10px] p-4 text-center">
                      [{docType}]<br />FRONT SIDE
                    </div>
                  )}

                  {!isManual && extractedPhoto && i === 0 && (
                    <img
                      src={extractedPhoto}
                      alt="Extracted User"
                      className="absolute top-4 left-4 w-[25mm] h-[30mm] object-cover border-2 border-white shadow-md z-10"
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
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                      FRONT MISSING
                    </div>
                  )}
                </div>

                {/* Back Card */}
                <div className="pvc-card relative bg-white overflow-hidden shadow-sm">
                  {!isManual && (
                    <div className="absolute inset-0 bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 font-bold uppercase tracking-widest text-[10px] p-4 text-center">
                      [{docType}]<br />BACK SIDE
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
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                      BACK MISSING
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
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl p-0 overflow-hidden">
          <div className="bg-amber-500 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <FileWarning className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">Encrypted PDF</DialogTitle>
          </div>
          <div className="p-6 space-y-4 bg-white">
            <DialogDescription className="text-slate-600 font-medium text-center text-base">
              This document requires a password to unlock and process securely.
            </DialogDescription>
            <Input
              type="password"
              placeholder="Enter Document Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-2xl text-lg font-medium bg-slate-50 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 text-center"
            />
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 sm:justify-between">
            <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)} className="rounded-xl font-bold text-slate-600 hover:bg-slate-200 flex-1 h-12">Cancel</Button>
            <Button onClick={() => {
              if (file) handleFileUpload(file, password)
            }} className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 flex-1 h-12">Unlock PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
