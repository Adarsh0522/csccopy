'use client'

import { useState, useRef } from 'react'
import { UploadCloud, Download, Sparkles, RefreshCw, Palette, Check, ArrowRight, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

const BG_CHOICES = [
  { name: 'Transparent', color: 'transparent' },
  { name: 'Pure White', color: '#FFFFFF' },
  { name: 'Light Blue', color: '#B0E0E6' },
  { name: 'Sky Blue', color: '#87CEEB' },
  { name: 'Light Gray', color: '#F3F4F6' },
  { name: 'Dark Slate', color: '#1E293B' },
]

export function RemoveBgTool() {
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [removedBlob, setRemovedBlob] = useState<Blob | null>(null)
  const [removedUrl, setRemovedUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [progressMsg, setProgressMsg] = useState<string>('')
  const [activeBg, setActiveBg] = useState<string>('transparent')
  const [customColor, setCustomColor] = useState<string>('#FFFFFF')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, or WebP).')
      return
    }

    setFile(selectedFile)
    const url = URL.createObjectURL(selectedFile)
    setOriginalUrl(url)
    setRemovedBlob(null)
    setRemovedUrl(null)
    setActiveBg('transparent')

    // Automatically trigger AI background removal
    processRemoval(selectedFile, url)
  }

  const processRemoval = async (selectedFile: File, url: string) => {
    setIsProcessing(true)
    setProgressMsg('Loading AI background removal model...')

    try {
      const { removeBackground } = await import('@imgly/background-removal')
      setProgressMsg('Segmenting subject & removing background...')

      const blob = await removeBackground(selectedFile, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            setProgressMsg(`Processing AI Model: ${Math.round((current / total) * 100)}%`)
          }
        }
      })

      const transparentUrl = URL.createObjectURL(blob)
      setRemovedBlob(blob)
      setRemovedUrl(transparentUrl)
      setProgressMsg('')
    } catch (err: any) {
      console.error('Failed to remove background:', err)
      alert('Background removal encountered an error. Please try another image or a smaller file.')
      setProgressMsg('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async (withBackground: boolean = false) => {
    if (!removedUrl || !file) return

    if (!withBackground || activeBg === 'transparent') {
      // Direct Transparent PNG
      const a = document.createElement('a')
      a.href = removedUrl
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image'
      a.download = `${baseName}_no_bg.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else {
      // Render with selected background color
      const img = new Image()
      img.src = removedUrl
      await new Promise((res) => (img.onload = res))

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const bgColor = activeBg === 'custom' ? customColor : activeBg
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image'
        a.download = `${baseName}_bg_replaced.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.95)
    }
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
            <Sparkles className="h-8 w-8" />
          </div>
          <p className="text-base font-bold text-gray-800 group-hover:text-emerald-700">
            Click to upload or drag & drop image
          </p>
          <p className="text-xs text-gray-500 mt-2">
            100% Free AI Background Removal • High Quality Transparent PNG • Works completely in your browser
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">{file.name}</span>
              <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null)
                setOriginalUrl(null)
                setRemovedBlob(null)
                setRemovedUrl(null)
              }}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              Upload Different Image
            </button>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="font-bold text-emerald-900 text-sm">{progressMsg || 'Removing Background...'}</p>
              <p className="text-xs text-emerald-600">This happens 100% locally on your device with AI.</p>
            </div>
          )}

          {/* Result View */}
          {removedUrl && !isProcessing && (
            <div className="space-y-6">
              {/* Background Selector Palette */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-700">Replace Background:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {BG_CHOICES.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => setActiveBg(b.color)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        activeBg === b.color
                          ? 'border-emerald-600 bg-white shadow-xs text-emerald-800'
                          : 'border-gray-200 bg-white/70 hover:bg-white text-gray-600'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs"
                        style={{
                          backgroundColor: b.color === 'transparent' ? '#FFFFFF' : b.color,
                          backgroundImage: b.color === 'transparent' 
                            ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' 
                            : 'none',
                          backgroundSize: '4px 4px'
                        }}
                      />
                      <span>{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Side-by-side or Single View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Original</span>
                  <div className="h-80 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center p-3">
                    <img src={originalUrl!} alt="Original" className="max-h-full max-w-full object-contain rounded-lg" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide block">
                    Background Removed
                  </span>
                  <div
                    className="h-80 rounded-2xl overflow-hidden border border-emerald-300 flex items-center justify-center p-3 relative shadow-xs"
                    style={{
                      backgroundColor: activeBg === 'transparent' ? '#F9FAFB' : activeBg,
                      backgroundImage: activeBg === 'transparent'
                        ? 'radial-gradient(#CBD5E1 1px, transparent 1px)'
                        : 'none',
                      backgroundSize: '12px 12px'
                    }}
                  >
                    <img src={removedUrl} alt="No Background" className="max-h-full max-w-full object-contain rounded-lg drop-shadow-md" />
                  </div>
                </div>
              </div>

              {/* Download Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => handleDownload(false)}
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Transparent PNG
                </Button>

                {activeBg !== 'transparent' && (
                  <Button
                    onClick={() => handleDownload(true)}
                    variant="outline"
                    className="flex-1 h-12 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download with Selected Background (JPG)
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

