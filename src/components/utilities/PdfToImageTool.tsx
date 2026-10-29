'use client'

import { useState, useRef, useEffect } from 'react'
import { UploadCloud, Download, FileText, Image as ImageIcon, RefreshCw, Check, Layers, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadPdf, renderPdfPageToCanvas } from '@/lib/pdfProcessor'

interface PagePreview {
  pageNumber: number
  imageUrl: string
  width: number
  height: number
}

export function PdfToImageTool() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [pages, setPages] = useState<PagePreview[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadingProgress, setLoadingProgress] = useState<string>('')
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg')
  const [dpiScale, setDpiScale] = useState<number>(2.0) // 2x scale = approx 150 DPI, 3x = 300 DPI

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please upload a PDF file.')
      return
    }

    setFile(selectedFile)
    setPages([])
    setIsLoading(true)
    setLoadingProgress('Reading PDF document...')

    try {
      const pdf = await loadPdf(selectedFile)
      const count = pdf.numPages
      setPageCount(count)

      const renderedPages: PagePreview[] = []
      const canvas = document.createElement('canvas')

      for (let i = 1; i <= count; i++) {
        setLoadingProgress(`Rendering page ${i} of ${count}...`)
        const dim = await renderPdfPageToCanvas(pdf, i, canvas, dpiScale)

        const mime = format === 'png' ? 'image/png' : 'image/jpeg'
        const quality = format === 'jpeg' ? 0.92 : undefined
        const dataUrl = canvas.toDataURL(mime, quality)

        renderedPages.push({
          pageNumber: i,
          imageUrl: dataUrl,
          width: dim.width,
          height: dim.height,
        })
      }

      setPages(renderedPages)
      setLoadingProgress('')
    } catch (err: any) {
      console.error('Failed to convert PDF to images:', err)
      alert('Error reading PDF: ' + (err.message || 'Please check if file is password protected.'))
      setLoadingProgress('')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPage = (page: PagePreview) => {
    const a = document.createElement('a')
    a.href = page.imageUrl
    const baseName = file ? file.name.replace(/\.pdf$/i, '') : 'document'
    const ext = format === 'png' ? 'png' : 'jpg'
    a.download = `${baseName}_page_${page.pageNumber}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const downloadAllPages = () => {
    pages.forEach((page, index) => {
      setTimeout(() => {
        downloadPage(page)
      }, index * 200)
    })
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
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0])
              }
            }}
          />
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ImageIcon className="h-8 w-8" />
          </div>
          <p className="text-base font-bold text-gray-800 group-hover:text-emerald-700">
            Click to upload or drag & drop PDF
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Extract every page of your PDF into high-resolution JPG or PNG images instantly
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                PDF
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block truncate max-w-[280px]">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500">
                  {pageCount > 0 ? `${pageCount} Pages Loaded` : 'Loading pages...'} • {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <span>Format:</span>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold"
                >
                  <option value="jpeg">JPG (Compact)</option>
                  <option value="png">PNG (Lossless)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <span>Resolution:</span>
                <select
                  value={dpiScale}
                  onChange={(e) => setDpiScale(Number(e.target.value))}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold"
                >
                  <option value={1.5}>Standard (150 DPI)</option>
                  <option value={2.5}>High Quality (200 DPI)</option>
                  <option value={3.5}>Ultra HD (300 DPI)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setPages([])
                }}
                className="text-xs font-semibold text-gray-500 hover:text-red-600 ml-2"
              >
                Choose Another PDF
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="font-bold text-emerald-900 text-sm">{loadingProgress}</p>
            </div>
          )}

          {/* Batch Download Button */}
          {pages.length > 1 && !isLoading && (
            <div className="flex justify-end">
              <Button
                onClick={downloadAllPages}
                className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm text-xs gap-2"
              >
                <Download className="w-4 h-4" />
                Download All {pages.length} Pages as {format.toUpperCase()}
              </Button>
            </div>
          )}

          {/* Pages Grid */}
          {pages.length > 0 && !isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pages.map((page) => (
                <div
                  key={page.pageNumber}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="bg-gray-100 p-3 flex items-center justify-center h-64 overflow-hidden relative">
                    <img
                      src={page.imageUrl}
                      alt={`Page ${page.pageNumber}`}
                      className="max-h-full max-w-full object-contain rounded-md shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Page {page.pageNumber}
                    </span>
                  </div>

                  <div className="p-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-500">
                      {page.width} × {page.height} px
                    </span>
                    <Button
                      onClick={() => downloadPage(page)}
                      size="sm"
                      className="h-8 text-xs font-bold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-colors gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

