'use client'

import { useState, useRef } from 'react'
import { UploadCloud, Download, FileText, Plus, Trash2, ArrowLeft, ArrowRight, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PDFDocument } from 'pdf-lib'

interface ImageItem {
  id: string
  file: File
  previewUrl: string
}

export function ImageToPdfTool() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Fit'>('A4')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [margin, setMargin] = useState<'none' | 'small' | 'normal'>('small')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return
    const newItems: ImageItem[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (f.type.startsWith('image/')) {
        newItems.push({
          id: Math.random().toString(36).substring(7),
          file: f,
          previewUrl: URL.createObjectURL(f),
        })
      }
    }
    setImages((prev) => [...prev, ...newItems])
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((x) => x.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((x) => x.id !== id)
    })
  }

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (
      (direction === 'left' && index === 0) ||
      (direction === 'right' && index === images.length - 1)
    ) {
      return
    }

    const newArr = [...images]
    const targetIdx = direction === 'left' ? index - 1 : index + 1
    const temp = newArr[index]
    newArr[index] = newArr[targetIdx]
    newArr[targetIdx] = temp
    setImages(newArr)
  }

  const handleGeneratePdf = async () => {
    if (images.length === 0) return
    setIsGenerating(true)

    try {
      const pdfDoc = await PDFDocument.create()

      // Margin in points (72 points = 1 inch)
      const marginPoints = margin === 'none' ? 0 : margin === 'small' ? 14.17 : 28.34 // 0mm, 5mm, 10mm

      for (const item of images) {
        const imageBytes = await item.file.arrayBuffer()
        let embeddedImage: any

        if (item.file.type === 'image/png') {
          try {
            embeddedImage = await pdfDoc.embedPng(imageBytes)
          } catch (e) {
            embeddedImage = await pdfDoc.embedJpg(imageBytes)
          }
        } else {
          try {
            embeddedImage = await pdfDoc.embedJpg(imageBytes)
          } catch (e) {
            embeddedImage = await pdfDoc.embedPng(imageBytes)
          }
        }

        const imgWidth = embeddedImage.width
        const imgHeight = embeddedImage.height

        let pageW = 595.28 // A4 width
        let pageH = 841.89 // A4 height

        if (pageSize === 'Letter') {
          pageW = 612
          pageH = 792
        } else if (pageSize === 'Fit') {
          pageW = imgWidth + marginPoints * 2
          pageH = imgHeight + marginPoints * 2
        }

        if (orientation === 'landscape' && pageSize !== 'Fit') {
          const temp = pageW
          pageW = pageH
          pageH = temp
        }

        const page = pdfDoc.addPage([pageW, pageH])

        // Scale to fit available width & height with margin
        const availW = pageW - marginPoints * 2
        const availH = pageH - marginPoints * 2
        const scaleFactor = Math.min(availW / imgWidth, availH / imgHeight, 1)

        const drawW = imgWidth * scaleFactor
        const drawH = imgHeight * scaleFactor

        const drawX = marginPoints + (availW - drawW) / 2
        const drawY = marginPoints + (availH - drawH) / 2

        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `images_converted_${images.length}_pages.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF creation error:', err)
      alert('Could not generate PDF. Please ensure images are valid JPG or PNG files.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleAddFiles(e.target.files)}
      />

      {images.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleAddFiles(e.dataTransfer.files)
          }}
          className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-3xl flex flex-col items-center justify-center p-12 transition-all duration-300 cursor-pointer group shadow-sm text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="h-8 w-8" />
          </div>
          <p className="text-base font-bold text-gray-800 group-hover:text-emerald-700">
            Click to upload or drag & drop multiple images
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Combine multiple JPGs or PNGs into a single clean PDF document (A4 / Letter)
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Settings & Options Bar */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Page Size:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800"
                >
                  <option value="A4">A4 (Standard)</option>
                  <option value="Letter">Letter</option>
                  <option value="Fit">Fit to Image</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span>Orientation:</span>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span>Margin:</span>
                <select
                  value={margin}
                  onChange={(e) => setMargin(e.target.value as any)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800"
                >
                  <option value="none">No Margin (Full)</option>
                  <option value="small">Small (5mm)</option>
                  <option value="normal">Normal (10mm)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 gap-1.5 rounded-lg text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add More Images
              </Button>
              <button
                type="button"
                onClick={() => setImages([])}
                className="text-xs font-semibold text-red-500 hover:text-red-700 ml-2"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Image Thumbnail Grid with Reordering */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((item, idx) => (
              <div
                key={item.id}
                className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="h-32 bg-gray-100 flex items-center justify-center p-2 relative">
                  <img src={item.previewUrl} alt={`Page ${idx + 1}`} className="max-h-full max-w-full object-contain rounded" />
                  <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(item.id)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Move Left / Right Buttons */}
                <div className="flex items-center justify-between p-1 bg-gray-50 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveImage(idx, 'left')}
                    className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-gray-500 font-medium truncate max-w-[70px]">
                    {item.file.name}
                  </span>
                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => moveImage(idx, 'right')}
                    className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Generate PDF Button */}
          <Button
            onClick={handleGeneratePdf}
            disabled={isGenerating || images.length === 0}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating PDF Document...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Convert & Download PDF ({images.length} Pages)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

