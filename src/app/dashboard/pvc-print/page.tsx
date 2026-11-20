'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import { 
  CR80_WIDTH, 
  CR80_HEIGHT, 
  A4_WIDTH, 
  A4_HEIGHT, 
  PhotoEnhancements, 
  QueuedCard, 
  DefaultCropRegions, 
  DEFAULT_AADHAAR_REGIONS, 
  AadhaarExtractedData,
  slicePdfRegion, 
  renderAadhaarPvc, 
  renderPanPvc, 
  renderGenericPvc, 
  composeA4Sheet 
} from '@/lib/pvcRenderer'
import FineTuneCropModal from '@/components/pvc/FineTuneCropModal'
import { deductWalletBalance } from '@/lib/actions/wallet'
import { emitWalletUpdate } from '@/lib/realtime'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Upload, 
  Printer, 
  Download, 
  Lock, 
  KeyRound, 
  Sliders, 
  Trash2, 
  Plus, 
  FileCheck, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  IdCard, 
  Layers, 
  FileText,
  User,
  Calendar,
  MapPin,
  QrCode as QrIcon
} from 'lucide-react'

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

const CARD_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Driving License',
  'ABHA Card',
  'Manual Card Maker'
]

export default function PVCPrintStudioPage() {
  // Document Type Tab
  const [docType, setDocType] = useState<string>(CARD_TYPES[0])
  const isManual = docType === 'Manual Card Maker'

  // Pricing & Wallet
  const [pvcPrice, setPvcPrice] = useState<number>(10)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  // PDF & Unlock State
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // Hidden Render Canvas (High-res 4.0 scale PDF page)
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Fine-Tune Crop Regions Modal
  const [cropRegions, setCropRegions] = useState<DefaultCropRegions>(DEFAULT_AADHAAR_REGIONS)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)

  // Sliced Canvases
  const slicedPhotoRef = useRef<HTMLCanvasElement | null>(null)
  const slicedFrontTextRef = useRef<HTMLCanvasElement | null>(null)
  const slicedBackAddressRef = useRef<HTMLCanvasElement | null>(null)
  const slicedQrCodeRef = useRef<HTMLCanvasElement | null>(null)
  const slicedCardNumberRef = useRef<HTMLCanvasElement | null>(null)
  const [extractedData, setExtractedData] = useState<AadhaarExtractedData>({})

  // Dual Canvas Preview Elements
  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Photo Enhancements
  const [enhancements, setEnhancements] = useState<PhotoEnhancements>({
    brightness: 105,
    contrast: 110,
    scale: 100,
    offsetY: 0,
    enableGhost: true,
  })

  // Manual Card Form State
  const [manualTitle, setManualTitle] = useState('STUDENT / IDENTITY CARD')
  const [manualName, setManualName] = useState('')
  const [manualDob, setManualDob] = useState('')
  const [manualGender, setManualGender] = useState('MALE')
  const [manualIdNumber, setManualIdNumber] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [manualPhotoUrl, setManualPhotoUrl] = useState<string | null>(null)
  const [manualFatherName, setManualFatherName] = useState('')
  const [manualQrData, setManualQrData] = useState<string | null>(null)

  // Master A4 Print Sheet State
  const [queuedCards, setQueuedCards] = useState<QueuedCard[]>([])
  const a4CanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 1. Load dynamic PVC service price & wallet balance
  useEffect(() => {
    async function loadInitialData() {
      try {
        const supabase = createClient()
        const { data: allSrv } = await supabase
          .from('services')
          .select('price, title, form_schema')

        const pvcMatch = allSrv?.find((s: any) => 
          s.form_schema?.[0]?.core_tool === 'pvc_print' || 
          s.title?.toLowerCase().trim() === 'pvc print' ||
          (s.title?.toLowerCase().includes('pvc') && s.price < 100)
        )
        if (pvcMatch?.price != null) {
          setPvcPrice(Number(pvcMatch.price))
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: wData } = await supabase
            .from('wallet')
            .select('balance')
            .eq('user_id', user.id)
            .maybeSingle()
          if (wData?.balance != null) {
            setWalletBalance(Number(wData.balance))
          }
        }
      } catch (err) {
        console.error('Initial data load error:', err)
      }
    }
    loadInitialData()
  }, [])

  // Auto-clear notices
  useEffect(() => {
    if (actionNotice) {
      const timer = setTimeout(() => setActionNotice(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [actionNotice])

  // 2. Render Card onto Dual Canvas
  const updateDualCanvas = useCallback(() => {
    if (!frontCanvasRef.current || !backCanvasRef.current) return

    if (docType === 'Aadhaar Card') {
      renderAadhaarPvc(
        frontCanvasRef.current,
        backCanvasRef.current,
        slicedPhotoRef.current,
        slicedFrontTextRef.current,
        slicedBackAddressRef.current,
        slicedQrCodeRef.current,
        slicedCardNumberRef.current,
        enhancements,
        extractedData
      )
    } else if (docType === 'PAN Card') {
      renderPanPvc(
        frontCanvasRef.current,
        backCanvasRef.current,
        slicedPhotoRef.current,
        enhancements,
        {
          name: manualName || 'CARDHOLDER NAME',
          fatherName: manualFatherName || "FATHER'S NAME",
          dob: manualDob || '01/01/1990',
          panNumber: manualIdNumber || 'ABCDE1234F',
          qrDataUrl: manualQrData || undefined,
        }
      )
    } else {
      // Driving License, ABHA, or Manual Card Maker
      renderGenericPvc(
        frontCanvasRef.current,
        backCanvasRef.current,
        slicedPhotoRef.current,
        enhancements,
        docType,
        {
          title: manualTitle,
          name: manualName || 'Cardholder Name',
          dob: manualDob || '01/01/1995',
          gender: manualGender || 'MALE',
          idNumber: manualIdNumber || 'MH0420230012345',
          address: manualAddress || 'Near Main Road, District, State - 400612',
          qrDataUrl: manualQrData || undefined,
        }
      )
    }
  }, [docType, enhancements, extractedData, manualTitle, manualName, manualFatherName, manualDob, manualGender, manualIdNumber, manualAddress, manualQrData])

  // Update dual canvas when enhancements or inputs change
  useEffect(() => {
    updateDualCanvas()
  }, [updateDualCanvas])

  // 3. Process Uploaded PDF
  const processPdf = async (pdfFile: File, pdfPass: string = '') => {
    setIsProcessing(true)
    setPdfError(null)

    try {
      const buffer = await pdfFile.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({
        data: buffer,
        password: pdfPass,
      })

      const pdf = await loadingTask.promise
      setNeedsPassword(false)

      // Render page 1 at ultra-high resolution (scale: 4.0 for razor-sharp 300 DPI cropping)
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 4.0 })

      const offCanvas = document.createElement('canvas')
      offCanvas.width = viewport.width
      offCanvas.height = viewport.height
      const offCtx = offCanvas.getContext('2d')
      if (!offCtx) throw new Error('Could not create off-screen canvas context')

      await (page.render as any)({ canvasContext: offCtx, viewport, canvas: offCanvas }).promise
      pdfCanvasRef.current = offCanvas

      // Extract text content for 12-digit number & dates
      try {
        const textContent = await page.getTextContent()
        const textItems = textContent.items.map((item: any) => item.str || '').join(' ')

        // 1. Match 12-digit Aadhaar pattern
        let matchedNumber: string | undefined
        const numMatch = textItems.match(/\b\d{4}\s+\d{4}\s+\d{4}\b/)
        if (numMatch) {
          matchedNumber = numMatch[0].replace(/\s+/g, ' ').trim()
        } else {
          const continuousMatch = textItems.match(/\b\d{12}\b/)
          if (continuousMatch) {
            const d = continuousMatch[0]
            matchedNumber = `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8, 12)}`
          }
        }

        // 2. Match Issue Date
        let matchedIssueDate: string | undefined
        const issueMatch = textItems.match(/(?:Issue\s*Date\s*[:\s]*|Date\s*of\s*Issue\s*[:\s]*)(\d{2}\/\d{2}\/\d{4})/i)
        if (issueMatch) {
          matchedIssueDate = issueMatch[1]
        }

        // 3. Match Download / Print Date
        let matchedPrintDate: string | undefined
        const printMatch = textItems.match(/(?:Download|Print)\s*Date\s*[:\s]*(\d{2}\/\d{2}\/\d{4})/i)
        if (printMatch) {
          matchedPrintDate = printMatch[1]
        } else {
          matchedPrintDate = new Date().toLocaleDateString('en-GB')
        }

        setExtractedData({
          aadhaarNumber: matchedNumber,
          issueDate: matchedIssueDate || '01/01/2024',
          printDate: matchedPrintDate,
        })
      } catch (textErr) {
        console.warn('Text extraction fallback:', textErr)
      }

      // Execute smart coordinate slicing
      sliceAndRenderFromPdf(offCanvas, cropRegions)
      setActionNotice({ type: 'success', message: 'PDF unlocked & card extracted successfully!' })
    } catch (err: any) {
      if (err.name === 'PasswordException' || err.message?.includes('password')) {
        setNeedsPassword(true)
        setPdfError('This PDF is password protected. Enter password (e.g. First 4 letters of Name in CAPS + Year of Birth).')
        setTimeout(() => passwordInputRef.current?.focus(), 150)
      } else {
        setPdfError('Failed to process PDF: ' + (err.message || 'Unknown error'))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Slice regions from high-res PDF canvas
  const sliceAndRenderFromPdf = (source: HTMLCanvasElement, regions: DefaultCropRegions) => {
    // 1. User photo (Keep original colors, do not remove white)
    slicedPhotoRef.current = slicePdfRegion(source, regions.photo, false)

    // 2. Front details (Remove white background so Devanagari ligatures stay crisp on PVC background)
    slicedFrontTextRef.current = slicePdfRegion(source, regions.frontDetails, true)

    // 3. Back address (Remove white background)
    slicedBackAddressRef.current = slicePdfRegion(source, regions.backAddress, true)

    // 4. QR Code (Do not remove white background to maintain QR contrast)
    slicedQrCodeRef.current = slicePdfRegion(source, regions.qrCode, false)

    // 5. Card Number (12-Digit slice fallback)
    slicedCardNumberRef.current = slicePdfRegion(source, regions.cardNumber, true)

    // Re-render
    updateDualCanvas()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      processPdf(selected, password)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      processPdf(file, password)
    }
  }

  // Handle Manual Photo Upload
  const handleManualPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        setManualPhotoUrl(url)
        const img = new Image()
        img.onload = () => {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = img.width
          tempCanvas.height = img.height
          const tCtx = tempCanvas.getContext('2d')
          tCtx?.drawImage(img, 0, 0)
          slicedPhotoRef.current = tempCanvas
          updateDualCanvas()
        }
        img.src = url
      }
      reader.readAsDataURL(f)
    }
  }

  // Auto-generate QR code for manual mode
  useEffect(() => {
    if (isManual) {
      const qrPayload = JSON.stringify({
        id: manualIdNumber || 'ID123456',
        name: manualName || 'Cardholder',
        dob: manualDob || '01/01/1990',
        addr: manualAddress || 'India',
      })
      QRCode.toDataURL(qrPayload, { width: 300, margin: 1 })
        .then((url) => setManualQrData(url))
        .catch((e) => console.error(e))
    }
  }, [isManual, manualIdNumber, manualName, manualDob, manualAddress])

  // 4. Master A4 Canvas Update
  useEffect(() => {
    if (a4CanvasRef.current) {
      composeA4Sheet(a4CanvasRef.current, queuedCards)
    }
  }, [queuedCards])

  // 5. Add Current Card to A4 Queue
  const handleAddToQueue = async () => {
    if (queuedCards.length >= 5) {
      setActionNotice({ type: 'error', message: 'A4 Print Sheet is full (Maximum 5 Cards). Please print or clear the sheet.' })
      return
    }

    if (!frontCanvasRef.current || !backCanvasRef.current) return

    // Deduct wallet balance for CSC operator
    try {
      const deduction = await deductWalletBalance(pvcPrice, `PVC Card Print - ${docType}`)
      if (!deduction.success) {
        setActionNotice({
          type: 'error',
          message: deduction.message || `Insufficient balance! ₹${pvcPrice} required. Please recharge wallet.`
        })
        return
      }

      if (deduction.new_balance != null) {
        setWalletBalance(deduction.new_balance)
        emitWalletUpdate(deduction.new_balance)
      }

      const frontDataUrl = frontCanvasRef.current.toDataURL('image/png', 1.0)
      const backDataUrl = backCanvasRef.current.toDataURL('image/png', 1.0)

      const newCard: QueuedCard = {
        id: Math.random().toString(36).substring(2, 9),
        docType: docType,
        customerName: manualName || file?.name || `${docType} #${queuedCards.length + 1}`,
        frontDataUrl,
        backDataUrl,
        addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setQueuedCards((prev) => [...prev, newCard])
      setActionNotice({
        type: 'success',
        message: `₹${pvcPrice} deducted. ${docType} added to Slot ${queuedCards.length + 1}/5!`,
      })

      // Reset file and left editor for next card
      setFile(null)
      setPassword('')
      setNeedsPassword(false)
      slicedPhotoRef.current = null
      slicedFrontTextRef.current = null
      slicedBackAddressRef.current = null
      slicedQrCodeRef.current = null
      slicedCardNumberRef.current = null
      setExtractedData({})
      setManualName('')
      setManualIdNumber('')
      setManualAddress('')
      setManualPhotoUrl(null)
    } catch (err: any) {
      setActionNotice({ type: 'error', message: 'Error adding card: ' + err.message })
    }
  }

  // Remove card from queue
  const handleRemoveQueuedCard = (id: string) => {
    setQueuedCards((prev) => prev.filter((c) => c.id !== id))
    setActionNotice({ type: 'success', message: 'Card removed from A4 Print Sheet.' })
  }

  // Clear entire queue
  const handleClearQueue = () => {
    if (confirm('Are you sure you want to clear all cards from the A4 Print Sheet?')) {
      setQueuedCards([])
      setActionNotice({ type: 'success', message: 'A4 Sheet cleared.' })
    }
  }

  // 6. Download High-Res A4 PDF (210mm x 297mm)
  const handleDownloadA4Pdf = () => {
    if (!a4CanvasRef.current) return

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false,
      })

      const imgData = a4CanvasRef.current.toDataURL('image/jpeg', 1.0)
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
      pdf.save(`CSCCopy_PVC_Sheet_${Date.now()}.pdf`)
      setActionNotice({ type: 'success', message: 'High-res A4 PDF downloaded successfully!' })
    } catch (err: any) {
      setActionNotice({ type: 'error', message: 'Failed to generate PDF: ' + err.message })
    }
  }

  // 7. Direct Print
  const handleDirectPrint = () => {
    if (!a4CanvasRef.current) return

    const imgData = a4CanvasRef.current.toDataURL('image/png', 1.0)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to trigger direct printing.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print PVC Sheet - CSCCopy</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              width: 210mm;
              height: 297mm;
            }
            img {
              width: 210mm;
              height: 297mm;
              display: block;
              image-rendering: -webkit-optimize-contrast;
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" onload="setTimeout(() => { window.print(); window.close(); }, 350);" />
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      
      {/* Action Notification Alert */}
      {actionNotice && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold shadow-sm transition-all ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-xs hover:underline opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* TOP BAR: Title & Document Type Tabs */}
      <div className="bg-[#1b183d]/90 backdrop-blur-md rounded-2xl border border-indigo-400/25 p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/25 font-bold">
            <IdCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              PVC Card Studio
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                ₹{pvcPrice} per card
              </span>
            </h1>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Precision CR80 card formatting and 5-card batch A4 dragon sheet print engine.
            </p>
          </div>
        </div>

        {/* Horizontal Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CARD_TYPES.map((type) => {
            const isActive = docType === type
            return (
              <button
                key={type}
                onClick={() => {
                  setDocType(type)
                  setPdfError(null)
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-md'
                    : 'bg-[#13112c] text-indigo-200 hover:bg-indigo-500/15 border border-indigo-400/20 hover:text-white'
                }`}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE (grid-cols-12) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Card Extraction & Live Editor (col-span-7) */}
        <div className="col-span-12 lg:col-span-7 space-y-5">
          
          {/* 1. Compact Upload & Unlock Bar */}
          {!isManual ? (
            <div className="bg-[#1b183d]/90 rounded-2xl border border-indigo-400/25 p-4 shadow-xl space-y-3 text-white">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                
                {/* File Dropzone Input */}
                <div className="relative flex-1">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full z-10"
                  />
                  <div className="border-2 border-dashed border-indigo-400/40 bg-[#13112c]/70 hover:bg-[#13112c] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs transition-colors">
                    <div className="flex items-center gap-2 text-indigo-100 truncate pr-2">
                      <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold truncate">
                        {file ? file.name : `Select or drop ${docType} PDF`}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-400/30 shrink-0">
                      Browse
                    </span>
                  </div>
                </div>

                {/* Password input (appears or highlights when password protected) */}
                <form onSubmit={handlePasswordSubmit} className="flex items-center gap-2 sm:w-64">
                  <div className="relative flex-1">
                    <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" />
                    <Input
                      ref={passwordInputRef}
                      type="password"
                      placeholder="PDF Password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-8 h-10 text-xs rounded-xl bg-[#0f0d26] text-white placeholder:text-indigo-300/40 border ${
                        needsPassword 
                          ? 'border-red-400 ring-2 ring-red-400/20 bg-red-950/30' 
                          : 'border-indigo-400/30 focus:border-emerald-400'
                      }`}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isProcessing || !file}
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs h-10 px-3.5 rounded-xl shadow-xs shrink-0"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Unlock'
                    )}
                  </Button>
                </form>

                {/* Fine-Tune Crop Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCropModalOpen(true)}
                  disabled={!pdfCanvasRef.current}
                  className="h-10 text-xs font-bold rounded-xl border-indigo-400/30 bg-[#13112c] text-indigo-100 hover:bg-indigo-500/20 hover:text-white shrink-0 gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Fine-Tune</span>
                </Button>
              </div>

              {/* Password or Extraction Error Helper */}
              {pdfError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{pdfError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Manual Card Maker Form UI */
            <div className="bg-[#1b183d]/90 rounded-2xl border border-indigo-400/25 p-5 shadow-xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Manual Card Details Form
                </span>
                <span className="text-[11px] text-indigo-300/70">Directly maps to PVC Canvas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-indigo-200">Card Header / Title</Label>
                  <Input 
                    value={manualTitle} 
                    onChange={(e) => setManualTitle(e.target.value)} 
                    placeholder="e.g. STUDENT / EMPLOYEE ID"
                    className="h-9 text-xs rounded-xl bg-[#0f0d26] border-indigo-400/30 text-white placeholder:text-indigo-300/40 focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-indigo-200">Upload Photo</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleManualPhotoUpload}
                    className="flex h-9 w-full bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl px-2 py-1 text-xs file:border-0 file:bg-emerald-500/20 file:text-emerald-300 file:rounded-md file:text-[10px] file:font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-indigo-200">Full Name</Label>
                  <Input 
                    value={manualName} 
                    onChange={(e) => setManualName(e.target.value)} 
                    placeholder="Full Name (English / Regional)"
                    className="h-9 text-xs rounded-xl bg-[#0f0d26] border-indigo-400/30 text-white placeholder:text-indigo-300/40 focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-indigo-200">ID / Card Number</Label>
                  <Input 
                    value={manualIdNumber} 
                    onChange={(e) => setManualIdNumber(e.target.value)} 
                    placeholder="e.g. MH0420230012345"
                    className="h-9 text-xs rounded-xl bg-[#0f0d26] border-indigo-400/30 text-white placeholder:text-indigo-300/40 focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-indigo-200">DOB (DD/MM/YYYY)</Label>
                  <Input 
                    value={manualDob} 
                    onChange={(e) => setManualDob(e.target.value)} 
                    placeholder="01/01/1995"
                    className="h-9 text-xs rounded-xl bg-[#0f0d26] border-indigo-400/30 text-white placeholder:text-indigo-300/40 focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-indigo-200">Gender</Label>
                  <select 
                    value={manualGender} 
                    onChange={(e) => setManualGender(e.target.value)}
                    className="h-9 w-full rounded-xl border border-indigo-400/30 bg-[#0f0d26] text-white text-xs px-2 focus:border-emerald-400"
                  >
                    <option value="MALE">MALE / पुरुष</option>
                    <option value="FEMALE">FEMALE / स्त्री</option>
                    <option value="TRANSGENDER">OTHER</option>
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs text-indigo-200">Full Address</Label>
                  <Input 
                    value={manualAddress} 
                    onChange={(e) => setManualAddress(e.target.value)} 
                    placeholder="Permanent Address Line, City, State - PIN"
                    className="h-9 text-xs rounded-xl bg-[#0f0d26] border-indigo-400/30 text-white placeholder:text-indigo-300/40 focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Live Dual Canvas Preview (Front & Back at 1011px x 638px scaled down with CSS) */}
          <div className="bg-[#1b183d]/90 rounded-3xl border border-indigo-400/25 p-5 shadow-xl space-y-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Live Dual Canvas Preview (CR80 Standard PVC - 300 DPI)
              </span>
              <span className="text-[11px] font-mono text-indigo-300/70">1011 × 638 px</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-200">
                  <span>FRONT SIDE</span>
                  <span className="text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">85.6mm</span>
                </div>
                <div className="bg-[#0f0d26]/80 rounded-2xl p-2 border border-indigo-400/20 flex items-center justify-center shadow-inner overflow-hidden">
                  <canvas
                    ref={frontCanvasRef}
                    className="w-full h-auto rounded-xl shadow-md border border-slate-200/60 bg-white transition-all"
                  />
                </div>
              </div>

              {/* Back Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-200">
                  <span>BACK SIDE</span>
                  <span className="text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">54.0mm</span>
                </div>
                <div className="bg-[#0f0d26]/80 rounded-2xl p-2 border border-indigo-400/20 flex items-center justify-center shadow-inner overflow-hidden">
                  <canvas
                    ref={backCanvasRef}
                    className="w-full h-auto rounded-xl shadow-md border border-slate-200/60 bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Photo Enhancement Controls */}
          <div className="bg-[#1b183d]/90 rounded-2xl border border-indigo-400/25 p-4 sm:p-5 shadow-xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Photo Tuning & PVC Hologram Effects
              </span>
              <button
                type="button"
                onClick={() => setEnhancements({ brightness: 105, contrast: 110, scale: 100, offsetY: 0, enableGhost: true })}
                className="text-[11px] font-semibold text-emerald-400 hover:underline cursor-pointer"
              >
                Reset Sliders
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Brightness */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-indigo-200">
                  <span>Photo Brightness</span>
                  <span className="font-mono text-emerald-400">{enhancements.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={enhancements.brightness}
                  onChange={(e) => setEnhancements((prev) => ({ ...prev, brightness: Number(e.target.value) }))}
                  className="w-full accent-emerald-400 h-1.5 bg-indigo-950/80 rounded-lg cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-indigo-200">
                  <span>Photo Contrast</span>
                  <span className="font-mono text-emerald-400">{enhancements.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={enhancements.contrast}
                  onChange={(e) => setEnhancements((prev) => ({ ...prev, contrast: Number(e.target.value) }))}
                  className="w-full accent-emerald-400 h-1.5 bg-indigo-950/80 rounded-lg cursor-pointer"
                />
              </div>

              {/* Photo Scale */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-indigo-200">
                  <span>Photo Zoom / Scale</span>
                  <span className="font-mono text-emerald-400">{enhancements.scale}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="140"
                  value={enhancements.scale}
                  onChange={(e) => setEnhancements((prev) => ({ ...prev, scale: Number(e.target.value) }))}
                  className="w-full accent-emerald-400 h-1.5 bg-indigo-950/80 rounded-lg cursor-pointer"
                />
              </div>

              {/* Photo Offset Y */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-indigo-200">
                  <span>Center Face (Vertical Offset)</span>
                  <span className="font-mono text-emerald-400">{enhancements.offsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={enhancements.offsetY}
                  onChange={(e) => setEnhancements((prev) => ({ ...prev, offsetY: Number(e.target.value) }))}
                  className="w-full accent-emerald-400 h-1.5 bg-indigo-950/80 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Ghost Image Checkbox */}
            <div className="pt-2 flex items-center justify-between border-t border-indigo-500/20">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-200">
                <input
                  type="checkbox"
                  checked={enhancements.enableGhost}
                  onChange={(e) => setEnhancements((prev) => ({ ...prev, enableGhost: e.target.checked }))}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-indigo-400/40 bg-[#0f0d26]"
                />
                <span>Enable PVC Ghost Image & Micro-Security Print</span>
              </label>
              <span className="text-[11px] text-indigo-300/60">Anti-forgery watermark</span>
            </div>
          </div>

          {/* 4. Queue Action Button */}
          <Button
            type="button"
            onClick={handleAddToQueue}
            disabled={queuedCards.length >= 5}
            className="w-full h-13 text-sm sm:text-base font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Add to A4 Print Queue (Current: {queuedCards.length}/5)</span>
          </Button>

        </div>

        {/* RIGHT PANEL: Sticky Live A4 Print Sheet Manager (col-span-5) */}
        <div className="col-span-12 lg:col-span-5 space-y-5 lg:sticky lg:top-6">
          
          <div className="bg-[#1b183d]/90 rounded-3xl border border-indigo-400/25 p-5 shadow-xl space-y-4 text-white">
            
            {/* Header & Controls */}
            <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  A4 Print Sheet Manager
                </h3>
                <p className="text-xs text-indigo-200/70">5-Slot Batch Dragon Sheet Layout</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  queuedCards.length > 0 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                    : 'bg-[#13112c] text-indigo-300/60 border-indigo-400/20'
                }`}>
                  {queuedCards.length} / 5 Slots
                </span>
                {queuedCards.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearQueue}
                    className="h-8 px-2 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200"
                    title="Clear Sheet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* A4 Sheet Visual Canvas Preview */}
            <div className="bg-[#0f0d26]/80 rounded-2xl p-2.5 border border-indigo-400/20 flex items-center justify-center shadow-inner">
              <canvas
                ref={a4CanvasRef}
                className="w-full h-auto rounded-lg shadow-md border border-slate-300 bg-white max-h-[460px] object-contain transition-all"
              />
            </div>

            {/* 5-Row Slot System Status List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-indigo-300/70 uppercase tracking-wider">
                Slot Allocations
              </span>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const card = queuedCards[slotIdx]
                  return (
                    <div
                      key={slotIdx}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        card
                          ? 'bg-[#13112c] border-emerald-500/40 text-white'
                          : 'bg-[#13112c]/50 border-indigo-400/20 text-indigo-300/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                          card ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-[#0f0d26] text-indigo-300/60'
                        }`}>
                          {slotIdx + 1}
                        </span>
                        {card ? (
                          <div className="truncate">
                            <span className="font-bold text-white truncate block">
                              {card.customerName || card.docType}
                            </span>
                            <span className="text-[10px] text-indigo-200/70">{card.docType} • {card.addedAt}</span>
                          </div>
                        ) : (
                          <span className="font-medium italic">Empty Slot</span>
                        )}
                      </div>

                      {card && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQueuedCard(card.id)}
                          className="text-indigo-300/60 hover:text-rose-400 p-1 rounded-md transition-colors"
                          title="Remove from slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Final Export Bar */}
            <div className="pt-2 border-t border-indigo-500/20 flex flex-col sm:flex-row gap-2.5">
              <Button
                type="button"
                onClick={handleDownloadA4Pdf}
                disabled={queuedCards.length === 0}
                className="flex-1 h-11 bg-[#0f0d26] hover:bg-[#13112c] border border-indigo-400/30 text-white font-bold text-xs rounded-xl shadow-xs gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-indigo-200" />
                <span>Download A4 PDF</span>
              </Button>

              <Button
                type="button"
                onClick={handleDirectPrint}
                disabled={queuedCards.length === 0}
                className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 gap-2 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sheet Directly</span>
              </Button>
            </div>

          </div>

        </div>

      </div>

      {/* Interactive Fine-Tune Crop Regions Modal */}
      <FineTuneCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        pdfCanvas={pdfCanvasRef.current}
        currentRegions={cropRegions}
        onApply={(newRegions) => {
          setCropRegions(newRegions)
          if (pdfCanvasRef.current) {
            sliceAndRenderFromPdf(pdfCanvasRef.current, newRegions)
            setActionNotice({ type: 'success', message: 'Crop regions updated & re-extracted!' })
          }
        }}
      />

    </div>
  )
}
