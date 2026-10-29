'use client'

import { useState, useRef, useEffect } from 'react'
import { UploadCloud, Download, Image as ImageIcon, Sparkles, RefreshCw, Check, ArrowRight, Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CompressJpgTool() {
  const [file, setFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null)
  
  // Compression Settings
  const [quality, setQuality] = useState<number>(80) // 1-100
  const [targetKb, setTargetKb] = useState<number>(50) // target KB
  const [mode, setMode] = useState<'quality' | 'target'>('target')
  const [scale, setScale] = useState<number>(100) // 10-100%
  
  // Output State
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null)
  const [compressedSize, setCompressedSize] = useState<number>(0)
  const [isCompressing, setIsCompressing] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP).')
      return
    }

    setFile(selectedFile)
    const previewUrl = URL.createObjectURL(selectedFile)
    setImagePreview(previewUrl)

    const img = new Image()
    img.onload = () => {
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = previewUrl
  }

  // Auto-compress when settings or file change
  useEffect(() => {
    if (!file || !imagePreview) return

    let cancelled = false

    async function processCompression() {
      setIsCompressing(true)
      try {
        const img = new Image()
        img.src = imagePreview!
        await new Promise((resolve) => (img.onload = resolve))

        if (cancelled) return

        const canvas = document.createElement('canvas')
        const currentScale = scale / 100
        const width = Math.round(img.naturalWidth * currentScale)
        const height = Math.round(img.naturalHeight * currentScale)
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        if (mode === 'quality') {
          // Direct quality mode
          const q = Math.max(0.01, Math.min(1, quality / 100))
          canvas.toBlob(
            (blob) => {
              if (cancelled || !blob) return
              setCompressedBlob(blob)
              setCompressedSize(blob.size)
              const url = URL.createObjectURL(blob)
              setCompressedUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return url
              })
              setIsCompressing(false)
            },
            'image/jpeg',
            q
          )
        } else {
          // Target KB Binary Search
          const targetBytes = targetKb * 1024
          let minQ = 0.01
          let maxQ = 0.98
          let bestBlob: Blob | null = null
          let bestSize = Infinity

          for (let i = 0; i < 7; i++) {
            const midQ = (minQ + maxQ) / 2
            const currentBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', midQ))
            
            if (currentBlob.size <= targetBytes) {
              bestBlob = currentBlob
              bestSize = currentBlob.size
              minQ = midQ // try for higher quality within limit
            } else {
              maxQ = midQ // too large, lower quality
            }
          }

          // Fallback if even minQ exceeds target: rescale canvas down
          if (!bestBlob || bestBlob.size > targetBytes) {
            let resizeScale = 0.8
            while (resizeScale >= 0.2) {
              const resCanvas = document.createElement('canvas')
              resCanvas.width = Math.round(width * resizeScale)
              resCanvas.height = Math.round(height * resizeScale)
              const rCtx = resCanvas.getContext('2d')
              if (rCtx) {
                rCtx.fillStyle = '#FFFFFF'
                rCtx.fillRect(0, 0, resCanvas.width, resCanvas.height)
                rCtx.drawImage(canvas, 0, 0, resCanvas.width, resCanvas.height)
                const candidate: Blob = await new Promise((res) => resCanvas.toBlob((b) => res(b!), 'image/jpeg', 0.6))
                if (candidate.size <= targetBytes || resizeScale <= 0.25) {
                  bestBlob = candidate
                  bestSize = candidate.size
                  break
                }
              }
              resizeScale -= 0.2
            }
          }

          if (cancelled || !bestBlob) return
          setCompressedBlob(bestBlob)
          setCompressedSize(bestSize)
          const url = URL.createObjectURL(bestBlob)
          setCompressedUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return url
          })
          setIsCompressing(false)
        }
      } catch (err) {
        console.error('Compression failed:', err)
        setIsCompressing(false)
      }
    }

    const timer = setTimeout(processCompression, 150)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [file, imagePreview, quality, targetKb, mode, scale])

  const handleDownload = () => {
    if (!compressedUrl || !file) return
    const a = document.createElement('a')
    a.href = compressedUrl
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image'
    a.download = `compressed_${baseName}_${Math.round(compressedSize / 1024)}KB.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    if (bytes < k) return bytes + ' B'
    if (bytes < k * k) return (bytes / k).toFixed(1) + ' KB'
    return (bytes / (k * k)).toFixed(2) + ' MB'
  }

  const reductionPercent = file && compressedSize > 0 
    ? Math.max(0, Math.round(((file.size - compressedSize) / file.size) * 100))
    : 0

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
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0])
              }
            }}
          />
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="h-8 w-8" />
          </div>
          <p className="text-base font-bold text-gray-800 group-hover:text-emerald-700">
            Click to upload or drag & drop JPG / PNG image
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Compress files to exact KB targets (20KB, 50KB, 100KB) for Govt & job portals
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Controls Bar */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Mode:</span>
                <div className="inline-flex rounded-xl bg-gray-200 p-1">
                  <button
                    type="button"
                    onClick={() => setMode('target')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mode === 'target' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Exact Target (KB)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('quality')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mode === 'quality' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Quality Slider (%)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setImagePreview(null)
                  setCompressedBlob(null)
                }}
                className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                Choose Another Image
              </button>
            </div>

            {mode === 'target' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                  <span>Target File Size:</span>
                  <span className="font-bold text-emerald-700 text-sm">{targetKb} KB</span>
                </div>
                
                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2">
                  {[20, 50, 100, 200, 500].map((kb) => (
                    <button
                      key={kb}
                      type="button"
                      onClick={() => setTargetKb(kb)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        targetKb === kb
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {kb} KB
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="5"
                  value={targetKb}
                  onChange={(e) => setTargetKb(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                  <span>Compression Quality:</span>
                  <span className="font-bold text-emerald-700 text-sm">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Stats Comparison Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
              <span className="text-xs text-gray-500 font-medium block mb-1">Original Size</span>
              <span className="text-lg font-bold text-gray-800">{formatBytes(file.size)}</span>
              {originalDimensions && (
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {originalDimensions.width} × {originalDimensions.height} px
                </span>
              )}
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-center">
              <span className="text-xs text-emerald-700 font-medium block mb-1">Compressed Size</span>
              <span className="text-lg font-extrabold text-emerald-700">
                {isCompressing ? 'Calculating...' : formatBytes(compressedSize)}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                Saved {reductionPercent}%
              </span>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-center">
              <Button
                onClick={handleDownload}
                disabled={isCompressing || !compressedUrl}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download ({formatBytes(compressedSize)})
              </Button>
            </div>
          </div>

          {/* Live Preview Side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide block">Original Image</span>
              <div className="h-64 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center p-2">
                <img src={imagePreview!} alt="Original" className="max-h-full max-w-full object-contain rounded-lg" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide block">Compressed Preview</span>
              <div className="h-64 bg-gray-100 rounded-2xl overflow-hidden border border-emerald-300 flex items-center justify-center p-2 relative">
                {compressedUrl ? (
                  <img src={compressedUrl} alt="Compressed" className="max-h-full max-w-full object-contain rounded-lg" />
                ) : (
                  <div className="animate-spin text-emerald-600">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
