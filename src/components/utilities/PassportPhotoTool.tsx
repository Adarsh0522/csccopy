'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  UploadCloud, 
  Download, 
  Camera, 
  RefreshCw, 
  RotateCw, 
  ZoomIn, 
  Sparkles, 
  Grid, 
  FileText, 
  Printer, 
  Scissors, 
  Palette, 
  Check, 
  Sliders, 
  AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PDFDocument, rgb } from 'pdf-lib'

// Standard Background Color Presets
const BG_PRESETS = [
  { name: 'Original', color: 'transparent', border: '#E5E7EB' },
  { name: 'White', color: '#FFFFFF', border: '#D1D5DB' },
  { name: 'Light Blue', color: '#B0E0E6', border: '#93C5FD' },
  { name: 'Sky Blue', color: '#87CEEB', border: '#60A5FA' },
  { name: 'Royal Blue', color: '#1E40AF', border: '#1D4ED8' },
  { name: 'Light Gray', color: '#F3F4F6', border: '#E5E7EB' },
  { name: 'Red', color: '#DC2626', border: '#B91C1C' },
]

// Copy Grid Layout Options
const COPY_OPTIONS = [
  { count: 1, label: '1 Copy (Single Photo)', paper: 'Single' },
  { count: 2, label: '2 Copies', paper: '4x6" / A4' },
  { count: 4, label: '4 Copies', paper: '4x6" / A4' },
  { count: 6, label: '6 Copies (Standard 4x6")', paper: '4x6" Photo Paper' },
  { count: 8, label: '8 Copies (Full 4x6")', paper: '4x6" Photo Paper' },
  { count: 12, label: '12 Copies (A4 Sheet)', paper: 'A4 Paper' },
  { count: 16, label: '16 Copies (A4 Sheet)', paper: 'A4 Paper' },
  { count: 32, label: '32 Copies (A4 Full Sheet)', paper: 'A4 Paper' },
]

export function PassportPhotoTool() {
  const [file, setFile] = useState<File | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  // Interactive Crop & Transform state
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [panX, setPanX] = useState<number>(0)
  const [panY, setPanY] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Background Options
  const [selectedBg, setSelectedBg] = useState<string>('White')
  const [customBgColor, setCustomBgColor] = useState<string>('#FFFFFF')
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false)
  const [bgRemovedBlob, setBgRemovedBlob] = useState<Blob | null>(null)
  const [bgRemovedUrl, setBgRemovedUrl] = useState<string | null>(null)
  const [bgStatusMessage, setBgStatusMessage] = useState<string>('')

  // Single Copy Size Options
  const [targetKb, setTargetKb] = useState<number>(50) // 10 to 1000 KB
  const [singleCopyBlob, setSingleCopyBlob] = useState<Blob | null>(null)
  const [singleCopyUrl, setSingleCopyUrl] = useState<string | null>(null)
  const [singleCopySize, setSingleCopySize] = useState<number>(0)

  // Sheet Layout Options
  const [copyCount, setCopyCount] = useState<number>(8)
  const [paperSize, setPaperSize] = useState<'4x6' | 'A4'>('4x6')
  const [includeBorder, setIncludeBorder] = useState<boolean>(true)
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'adjust' | 'sheet'>('adjust')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please upload a photo (JPG, PNG, or WebP).')
      return
    }

    setFile(selectedFile)
    const url = URL.createObjectURL(selectedFile)
    setImageSrc(url)
    setBgRemovedBlob(null)
    setBgRemovedUrl(null)
    setZoom(1)
    setRotation(0)
    setPanX(0)
    setPanY(0)
  }

  // AI Background Removal Trigger
  const handleRemoveBackground = async () => {
    if (!imageSrc) return
    setIsRemovingBg(true)
    setBgStatusMessage('Initializing AI Background Remover...')

    try {
      setBgStatusMessage('Segmenting subject & removing background...')
      const { removeBackground } = await import('@imgly/background-removal')
      const blob = await removeBackground(imageSrc, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            setBgStatusMessage(`Processing: ${Math.round((current / total) * 100)}%`)
          }
        }
      })

      const transparentUrl = URL.createObjectURL(blob)
      setBgRemovedBlob(blob)
      setBgRemovedUrl(transparentUrl)
      setBgStatusMessage('')
    } catch (err: any) {
      console.warn('AI background removal error:', err)
      alert('Could not auto-remove background. You can still crop and adjust with original photo.')
      setBgStatusMessage('')
    } finally {
      setIsRemovingBg(false)
    }
  }

  // Render the cropped 3.5cm x 4.5cm passport photo
  // Standard Indian passport photo at 300 DPI is 413 x 531 pixels (approx 35mm x 45mm)
  const renderCroppedPhoto = async (): Promise<HTMLCanvasElement | null> => {
    const srcToUse = bgRemovedUrl || imageSrc
    if (!srcToUse) return null

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = srcToUse
    await new Promise((res) => (img.onload = res))

    const targetWidth = 413
    const targetHeight = 531

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // 1. Draw Background Color
    if (bgRemovedUrl && selectedBg !== 'Original') {
      const activeColor = selectedBg === 'Custom' 
        ? customBgColor 
        : (BG_PRESETS.find(p => p.name === selectedBg)?.color || '#FFFFFF')
      ctx.fillStyle = activeColor
      ctx.fillRect(0, 0, targetWidth, targetHeight)
    } else if (!bgRemovedUrl && selectedBg !== 'Original') {
      // Default white background behind image
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, targetWidth, targetHeight)
    }

    // 2. Transform (Zoom, Pan, Rotate)
    ctx.save()
    ctx.translate(targetWidth / 2 + panX, targetHeight / 2 + panY)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(zoom, zoom)

    // Calculate aspect fill
    const scaleFactor = Math.max(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight)
    const drawW = img.naturalWidth * scaleFactor
    const drawH = img.naturalHeight * scaleFactor

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()

    // 3. Optional 1px Cutting Border
    if (includeBorder) {
      ctx.strokeStyle = '#D1D5DB'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, targetWidth, targetHeight)
    }

    return canvas
  }

  // Update Single Copy preview & target KB binary search
  useEffect(() => {
    if (!imageSrc) return

    let cancelled = false

    async function updateSinglePhoto() {
      const canvas = await renderCroppedPhoto()
      if (!canvas || cancelled) return

      const targetBytes = targetKb * 1024
      let minQ = 0.05
      let maxQ = 0.98
      let bestBlob: Blob | null = null

      // Binary search for exact KB target
      for (let i = 0; i < 7; i++) {
        const midQ = (minQ + maxQ) / 2
        const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', midQ))
        if (blob.size <= targetBytes) {
          bestBlob = blob
          minQ = midQ
        } else {
          maxQ = midQ
        }
      }

      // If still too large, downscale canvas slightly to meet strict limit
      if (!bestBlob || bestBlob.size > targetBytes) {
        const downCanvas = document.createElement('canvas')
        downCanvas.width = Math.round(canvas.width * 0.8)
        downCanvas.height = Math.round(canvas.height * 0.8)
        const dCtx = downCanvas.getContext('2d')
        if (dCtx) {
          dCtx.drawImage(canvas, 0, 0, downCanvas.width, downCanvas.height)
          bestBlob = await new Promise((res) => downCanvas.toBlob((b) => res(b!), 'image/jpeg', 0.6))
        }
      }

      if (cancelled || !bestBlob) return
      setSingleCopyBlob(bestBlob)
      setSingleCopySize(bestBlob.size)
      const url = URL.createObjectURL(bestBlob)
      setSingleCopyUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    }

    const timer = setTimeout(updateSinglePhoto, 120)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [imageSrc, bgRemovedUrl, selectedBg, customBgColor, zoom, rotation, panX, panY, includeBorder, targetKb])

  // Generate Print Sheet Grid (Canvas & Preview)
  useEffect(() => {
    if (!singleCopyUrl) return

    let cancelled = false

    async function generateSheet() {
      const singleCanvas = await renderCroppedPhoto()
      if (!singleCanvas || cancelled) return

      // Paper Dimensions at 300 DPI
      // 4x6" = 1200 x 1800 px (or 1800 x 1200 landscape)
      // A4 = 2480 x 3508 px
      const isA4 = paperSize === 'A4' || copyCount > 8
      const sheetW = isA4 ? 2480 : 1800
      const sheetH = isA4 ? 3508 : 1200

      const sheetCanvas = document.createElement('canvas')
      sheetCanvas.width = sheetW
      sheetCanvas.height = sheetH
      const ctx = sheetCanvas.getContext('2d')
      if (!ctx) return

      // White paper background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, sheetW, sheetH)

      // Photo Dimensions in px (3.5cm x 4.5cm at 300 DPI = 413 x 531 px)
      const photoW = 413
      const photoH = 531
      const gapX = isA4 ? 50 : 35
      const gapY = isA4 ? 60 : 40

      // Grid Layout columns & rows based on copy count
      let cols = 2
      let rows = 1
      if (copyCount === 1) { cols = 1; rows = 1 }
      else if (copyCount === 2) { cols = 2; rows = 1 }
      else if (copyCount === 4) { cols = 2; rows = 2 }
      else if (copyCount === 6) { cols = 3; rows = 2 }
      else if (copyCount === 8) { cols = 4; rows = 2 }
      else if (copyCount === 12) { cols = 3; rows = 4 }
      else if (copyCount === 16) { cols = 4; rows = 4 }
      else if (copyCount === 32) { cols = 4; rows = 8 }

      const totalGridW = cols * photoW + (cols - 1) * gapX
      const totalGridH = rows * photoH + (rows - 1) * gapY
      const startX = Math.round((sheetW - totalGridW) / 2)
      const startY = Math.round((sheetH - totalGridH) / 2)

      let rendered = 0
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rendered >= copyCount) break
          const posX = startX + c * (photoW + gapX)
          const posY = startY + r * (photoH + gapY)

          ctx.drawImage(singleCanvas, posX, posY, photoW, photoH)

          // Cutting guides / crop marks
          ctx.strokeStyle = '#9CA3AF'
          ctx.lineWidth = 1
          ctx.strokeRect(posX, posY, photoW, photoH)

          rendered++
        }
      }

      sheetCanvas.toBlob((blob) => {
        if (cancelled || !blob) return
        const url = URL.createObjectURL(blob)
        setSheetPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
      }, 'image/jpeg', 0.95)
    }

    generateSheet()
    return () => {
      cancelled = true
    }
  }, [singleCopyUrl, copyCount, paperSize])

  // Mouse pan drag handler
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPanX(e.clientX - dragStart.x)
    setPanY(e.clientY - dragStart.y)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Download Single Photo JPG
  const handleDownloadSingle = () => {
    if (!singleCopyUrl) return
    const a = document.createElement('a')
    a.href = singleCopyUrl
    a.download = `passport_photo_${Math.round(singleCopySize / 1024)}KB.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Download Print Sheet as PDF
  const handleDownloadSheetPdf = async () => {
    if (!sheetPreviewUrl) return

    try {
      const pdfDoc = await PDFDocument.create()
      // A4 is 595.28 x 841.89 pt, 4x6 is 288 x 432 pt
      const isA4 = paperSize === 'A4' || copyCount > 8
      const pageW = isA4 ? 595.28 : 432
      const pageH = isA4 ? 841.89 : 288

      const page = pdfDoc.addPage([pageW, pageH])

      const response = await fetch(sheetPreviewUrl)
      const imageBytes = await response.arrayBuffer()
      const embeddedImage = await pdfDoc.embedJpg(imageBytes)

      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: pageW,
        height: pageH,
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `passport_sheet_${copyCount}_copies_${paperSize}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to create PDF sheet:', err)
      alert('Failed to generate PDF. You can download the JPG sheet instead.')
    }
  }

  // Download Print Sheet as JPG
  const handleDownloadSheetJpg = () => {
    if (!sheetPreviewUrl) return
    const a = document.createElement('a')
    a.href = sheetPreviewUrl
    a.download = `passport_sheet_${copyCount}_copies_${paperSize}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0])
            }
          }}
          className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-3xl flex flex-col items-center justify-center p-12 transition-all duration-300 cursor-pointer group shadow-sm text-center"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0])
              }
            }}
          />
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Camera className="h-8 w-8" />
          </div>
          <p className="text-base font-bold text-gray-800 group-hover:text-emerald-700">
            Click to upload photo or take a picture
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Auto Indian Passport Ratio (3.5 × 4.5 cm) • Change Background • Multi-copy Print Sheets • Target KB adjustment
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-100">
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('adjust')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'adjust' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                1. Crop & Background
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sheet')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sheet' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                2. Print Copies & Sheet ({copyCount} Copies)
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null)
                setImageSrc(null)
                setBgRemovedBlob(null)
                setBgRemovedUrl(null)
              }}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              Upload Different Photo
            </button>
          </div>

          {activeTab === 'adjust' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Interactive Cropper View (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="relative w-full h-[400px] bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center cursor-move select-none shadow-inner border border-slate-700"
                >
                  {/* Photo with transformation */}
                  <div
                    style={{
                      transform: `translate(${panX}px, ${panY}px) rotate(${rotation}deg) scale(${zoom})`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                    className="origin-center pointer-events-none"
                  >
                    <img
                      src={(bgRemovedUrl || imageSrc)!}
                      alt="Crop View"
                      className="max-h-[360px] max-w-[360px] object-contain"
                    />
                  </div>

                  {/* Standard Passport Size Crop Overlay (3.5 x 4.5 Ratio) */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-[210px] h-[270px] border-2 border-emerald-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                      {/* Face Position Oval Guide */}
                      <div className="absolute inset-x-8 inset-y-6 border border-dashed border-emerald-300/60 rounded-full opacity-60" />
                      <div className="absolute top-2 inset-x-0 text-center">
                        <span className="text-[10px] font-bold text-emerald-300 tracking-wider bg-slate-900/80 px-2 py-0.5 rounded">
                          3.5 × 4.5 cm
                        </span>
                      </div>
                      <div className="absolute bottom-2 inset-x-0 text-center">
                        <span className="text-[9px] text-gray-300 bg-slate-900/80 px-2 py-0.5 rounded">
                          Drag photo to center face
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cropper Controls Toolbar */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <ZoomIn className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Zoom:</span>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-gray-800 font-bold w-10 text-right">{Math.round(zoom * 100)}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="h-8 gap-1.5 text-xs font-bold rounded-lg"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotate
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setZoom(1)
                        setRotation(0)
                        setPanX(0)
                        setPanY(0)
                      }}
                      className="h-8 text-xs font-bold rounded-lg text-gray-600"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>

              {/* Settings & Single Copy Download (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* 1. Background Replacement Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-emerald-600" />
                      Background Color
                    </span>
                    {!bgRemovedUrl && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={isRemovingBg}
                        onClick={handleRemoveBackground}
                        className="h-7 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        {isRemovingBg ? 'Processing...' : 'AI Remove BG'}
                      </Button>
                    )}
                  </div>

                  {bgStatusMessage && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                      <span>{bgStatusMessage}</span>
                    </div>
                  )}

                  {/* Color Preset Palette */}
                  <div className="flex flex-wrap gap-2">
                    {BG_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setSelectedBg(p.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedBg === p.name
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-gray-300"
                          style={{ backgroundColor: p.color === 'transparent' ? '#E5E7EB' : p.color }}
                        />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Single Copy File Size (KB/MB) Customizer */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      Single Photo Target Size
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700">
                      {Math.round(singleCopySize / 1024)} KB
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500">
                    Adjust target KB for Govt online job forms (SSC, UPSC, PAN upload):
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {[20, 50, 100, 200, 500].map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => setTargetKb(kb)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          targetKb === kb
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {kb} KB
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="800"
                    step="5"
                    value={targetKb}
                    onChange={(e) => setTargetKb(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />

                  {/* Single Photo Download Button */}
                  <Button
                    onClick={handleDownloadSingle}
                    disabled={!singleCopyUrl}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Single Photo ({Math.round(singleCopySize / 1024)} KB JPG)
                  </Button>
                </div>

                {/* Button to go to Multi-Copy Print Sheet */}
                <Button
                  onClick={() => setActiveTab('sheet')}
                  variant="outline"
                  className="w-full h-11 border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
                >
                  <Grid className="w-4 h-4" />
                  Print Multi-Photo Sheet ({copyCount} Copies)
                </Button>
              </div>
            </div>
          ) : (
            /* Multi-Copy Sheet Layout Tab */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Sheet Preview (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Sheet Preview ({copyCount} Copies on {paperSize})</span>
                  <span className="text-gray-400">Ready to print</span>
                </div>

                <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 flex items-center justify-center shadow-inner min-h-[420px]">
                  {sheetPreviewUrl ? (
                    <img
                      src={sheetPreviewUrl}
                      alt="Sheet Preview"
                      className="max-h-[380px] max-w-full object-contain rounded-md shadow-2xl bg-white"
                    />
                  ) : (
                    <div className="animate-spin text-emerald-400">
                      <RefreshCw className="w-8 h-8" />
                    </div>
                  )}
                </div>
              </div>

              {/* Sheet Controls & Download Buttons (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
                    Number of Copies on Sheet
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {COPY_OPTIONS.map((opt) => (
                      <button
                        key={opt.count}
                        type="button"
                        onClick={() => setCopyCount(opt.count)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          copyCount === opt.count
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{opt.paper}</div>
                      </button>
                    ))}
                  </div>

                  {/* Paper Type Selection */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Paper Type:</span>
                    <div className="inline-flex rounded-lg bg-gray-100 p-1">
                      <button
                        type="button"
                        onClick={() => setPaperSize('4x6')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                          paperSize === '4x6' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600'
                        }`}
                      >
                        4 × 6" Photo Paper
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaperSize('A4')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                          paperSize === 'A4' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600'
                        }`}
                      >
                        A4 Paper
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBorder}
                      onChange={(e) => setIncludeBorder(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Include cutting borders around each photo</span>
                  </label>
                </div>

                {/* Sheet Download Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleDownloadSheetPdf}
                    disabled={!sheetPreviewUrl}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Download Print-Ready PDF Sheet
                  </Button>

                  <Button
                    onClick={handleDownloadSheetJpg}
                    disabled={!sheetPreviewUrl}
                    variant="outline"
                    className="w-full h-11 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Sheet as JPG Image
                  </Button>

                  <Button
                    onClick={() => setActiveTab('adjust')}
                    variant="ghost"
                    className="w-full h-9 text-xs text-gray-500 hover:text-gray-800"
                  >
                    Back to Crop & Adjustments
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
