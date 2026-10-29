'use client'

import { useState, useRef } from 'react'
import { UploadCloud, Download, FileText, RefreshCw, Check, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadPdf, renderPdfPageToCanvas } from '@/lib/pdfProcessor'
import { PDFDocument } from 'pdf-lib'

const COMPRESSION_LEVELS = [
  {
    id: 'extreme',
    title: 'Extreme Compression',
    description: 'Smallest file size. Ideal for Govt & Online Job portal uploads (< 300KB).',
    scale: 1.2,
    quality: 0.5,
    badge: 'Max Savings',
  },
  {
    id: 'recommended',
    title: 'Recommended (Balanced)',
    description: 'Optimal balance between clear text readability and significant file size reduction.',
    scale: 1.6,
    quality: 0.72,
    badge: 'Popular',
  },
  {
    id: 'light',
    title: 'Light Compression',
    description: 'High resolution preserved. Great for high quality presentations and printing.',
    scale: 2.0,
    quality: 0.85,
    badge: 'Best Quality',
  },
]

export function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string>('recommended')
  const [isCompressing, setIsCompressing] = useState<boolean>(false)
  const [progressMsg, setProgressMsg] = useState<string>('')
  
  // Results
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null)
  const [compressedSize, setCompressedSize] = useState<number>(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a PDF document.')
      return
    }

    setFile(selectedFile)
    setCompressedBlob(null)
    setCompressedUrl(null)
    setCompressedSize(0)
  }

  const handleCompress = async () => {
    if (!file) return
    setIsCompressing(true)
    setProgressMsg('Opening PDF document...')

    try {
      const pdf = await loadPdf(file)
      const numPages = pdf.numPages
      const setting = COMPRESSION_LEVELS.find((l) => l.id === selectedLevel) || COMPRESSION_LEVELS[1]

      const newPdfDoc = await PDFDocument.create()
      const canvas = document.createElement('canvas')

      for (let i = 1; i <= numPages; i++) {
        setProgressMsg(`Compressing page ${i} of ${numPages}...`)
        const dim = await renderPdfPageToCanvas(pdf, i, canvas, setting.scale)

        const jpegDataUrl = canvas.toDataURL('image/jpeg', setting.quality)
        const response = await fetch(jpegDataUrl)
        const jpegBytes = await response.arrayBuffer()
        const embeddedImage = await newPdfDoc.embedJpg(jpegBytes)

        // Convert canvas dimensions back to standard points (approx 72 DPI)
        const pageW = dim.width / setting.scale
        const pageH = dim.height / setting.scale

        const newPage = newPdfDoc.addPage([pageW, pageH])
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: pageW,
          height: pageH,
        })
      }

      setProgressMsg('Finalizing compressed PDF...')
      const pdfBytes = await newPdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      setCompressedBlob(blob)
      setCompressedSize(blob.size)
      setCompressedUrl(url)
      setProgressMsg('')
    } catch (err: any) {
      console.error('Failed to compress PDF:', err)
      alert('PDF compression failed: ' + (err.message || 'Please check if file is password protected.'))
      setProgressMsg('')
    } finally {
      setIsCompressing(false)
    }
  }

  const handleDownload = () => {
    if (!compressedUrl || !file) return
    const a = document.createElement('a')
    a.href = compressedUrl
    const baseName = file.name.replace(/\.pdf$/i, '')
    a.download = `compressed_${baseName}.pdf`
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

  const savingsPercent = file && compressedSize > 0
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
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0])
              }
            }}
          />
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="h-8 w-8" />
          </div>
          <p className="text-base font-bold text-gray-800 group-hover:text-emerald-700">
            Click to upload or drag & drop PDF document
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Reduce PDF file size up to 90% while maintaining great readability
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Info Bar */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                PDF
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block truncate max-w-[320px]">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500">
                  Original Size: {formatBytes(file.size)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null)
                setCompressedBlob(null)
                setCompressedUrl(null)
              }}
              className="text-xs font-semibold text-gray-500 hover:text-red-600"
            >
              Choose Different PDF
            </button>
          </div>

          {/* Compression Level Selector Cards */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide block">
              Select Compression Level:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COMPRESSION_LEVELS.map((level) => (
                <div
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedLevel === level.id
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900">{level.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {level.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{level.description}</p>
                  </div>

                  <div className="pt-4 flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedLevel === level.id
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedLevel === level.id && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">Select this level</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compression Progress */}
          {isCompressing && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="font-bold text-emerald-900 text-sm">{progressMsg}</p>
              <p className="text-xs text-emerald-600">Processing pages locally in your browser...</p>
            </div>
          )}

          {/* Result Card */}
          {compressedUrl && !isCompressing && (
            <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  PDF Compressed Successfully!
                </span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Saved {savingsPercent}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="text-xs text-gray-500 block">Original Size</span>
                  <span className="text-base font-bold text-gray-800">{formatBytes(file.size)}</span>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <span className="text-xs text-emerald-700 block">Compressed Size</span>
                  <span className="text-base font-extrabold text-emerald-800">{formatBytes(compressedSize)}</span>
                </div>
              </div>

              <Button
                onClick={handleDownload}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Compressed PDF ({formatBytes(compressedSize)})
              </Button>
            </div>
          )}

          {/* Compress Trigger Button if not yet compressed */}
          {!compressedUrl && !isCompressing && (
            <Button
              onClick={handleCompress}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Start PDF Compression
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

