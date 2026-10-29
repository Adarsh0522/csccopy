'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { CropRegion, DefaultCropRegions, DEFAULT_AADHAAR_REGIONS } from '@/lib/pvcRenderer'
import { RotateCcw, Check, Sliders, Eye } from 'lucide-react'

interface FineTuneCropModalProps {
  isOpen: boolean
  onClose: () => void
  pdfCanvas: HTMLCanvasElement | null
  currentRegions: DefaultCropRegions
  onApply: (regions: DefaultCropRegions) => void
}

export default function FineTuneCropModal({
  isOpen,
  onClose,
  pdfCanvas,
  currentRegions,
  onApply,
}: FineTuneCropModalProps) {
  const [regions, setRegions] = useState<DefaultCropRegions>(currentRegions)
  const [activeTab, setActiveTab] = useState<'photo' | 'frontDetails' | 'backAddress' | 'qrCode' | 'cardNumber'>('photo')
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isOpen) {
      setRegions(currentRegions)
    }
  }, [isOpen, currentRegions])

  // Redraw preview with overlay bounding boxes whenever regions change
  useEffect(() => {
    if (!isOpen || !pdfCanvas || !previewCanvasRef.current) return

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Scale down PDF canvas to fit preview
    const maxW = 540
    const scale = maxW / pdfCanvas.width
    canvas.width = maxW
    canvas.height = pdfCanvas.height * scale

    ctx.drawImage(pdfCanvas, 0, 0, canvas.width, canvas.height)

    // Helper to draw a box
    const drawBox = (r: CropRegion, strokeColor: string, fillColor: string, label: string, isActive: boolean) => {
      const bx = r.x * canvas.width
      const by = r.y * canvas.height
      const bw = r.w * canvas.width
      const bh = r.h * canvas.height

      ctx.save()
      ctx.fillStyle = fillColor
      ctx.fillRect(bx, by, bw, bh)

      ctx.strokeStyle = strokeColor
      ctx.lineWidth = isActive ? 3 : 1.5
      ctx.setLineDash(isActive ? [] : [4, 4])
      ctx.strokeRect(bx, by, bw, bh)

      // Label tag
      ctx.fillStyle = strokeColor
      ctx.fillRect(bx, by - 18, Math.max(70, label.length * 8), 18)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 10px sans-serif'
      ctx.fillText(label, bx + 4, by - 5)
      ctx.restore()
    }

    // Draw 5 boxes
    drawBox(regions.photo, '#2563eb', 'rgba(37, 99, 235, 0.15)', 'Photo', activeTab === 'photo')
    drawBox(regions.frontDetails, '#16a34a', 'rgba(22, 163, 74, 0.15)', 'Front Text', activeTab === 'frontDetails')
    drawBox(regions.backAddress, '#d97706', 'rgba(217, 119, 6, 0.15)', 'Back Address', activeTab === 'backAddress')
    drawBox(regions.qrCode, '#9333ea', 'rgba(147, 51, 234, 0.15)', 'QR Code', activeTab === 'qrCode')
    drawBox(regions.cardNumber, '#e11d48', 'rgba(225, 29, 72, 0.15)', 'Card Number', activeTab === 'cardNumber')

  }, [isOpen, pdfCanvas, regions, activeTab])

  const handleSliderChange = (prop: keyof CropRegion, val: number) => {
    setRegions((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [prop]: val / 1000, // Normalized (0.000 to 1.000)
      },
    }))
  }

  const activeRegion = regions[activeTab]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                Fine-Tune PDF Crop Regions
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Adjust coordinates if UIDAI or NSDL shifts the PDF layout. Changes apply immediately to the card preview.
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegions(DEFAULT_AADHAAR_REGIONS)}
              className="text-xs h-8 text-slate-600 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          {/* Left Canvas Preview */}
          <div className="md:col-span-7 bg-slate-100 rounded-2xl p-2 border border-slate-200 flex items-center justify-center min-h-[380px] max-h-[500px] overflow-auto">
            {pdfCanvas ? (
              <canvas ref={previewCanvasRef} className="rounded-xl shadow-md max-w-full" />
            ) : (
              <div className="text-xs text-slate-400 font-medium p-8 text-center">
                Upload a PDF first to preview crop regions.
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="md:col-span-5 space-y-5 flex flex-col justify-between">
            {/* Region Selector Pills */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Select Region to Adjust:</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'photo', label: 'User Photo', color: 'border-blue-500 bg-blue-50 text-blue-700' },
                  { key: 'frontDetails', label: 'Front Details', color: 'border-green-500 bg-green-50 text-green-700' },
                  { key: 'backAddress', label: 'Back Address', color: 'border-amber-500 bg-amber-50 text-amber-700' },
                  { key: 'qrCode', label: 'QR Code', color: 'border-purple-500 bg-purple-50 text-purple-700' },
                  { key: 'cardNumber', label: 'Card Number', color: 'border-rose-500 bg-rose-50 text-rose-700' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                      activeTab === item.key
                        ? `${item.color} shadow-xs ring-2 ring-emerald-500/20`
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders for Active Region */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Horizontal (X)</span>
                <span className="font-mono text-emerald-600">{(activeRegion.x * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="900"
                value={Math.round(activeRegion.x * 1000)}
                onChange={(e) => handleSliderChange('x', Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Vertical (Y)</span>
                <span className="font-mono text-emerald-600">{(activeRegion.y * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="500"
                max="950"
                value={Math.round(activeRegion.y * 1000)}
                onChange={(e) => handleSliderChange('y', Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Width (W)</span>
                <span className="font-mono text-emerald-600">{(activeRegion.w * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                value={Math.round(activeRegion.w * 1000)}
                onChange={(e) => handleSliderChange('w', Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Height (H)</span>
                <span className="font-mono text-emerald-600">{(activeRegion.h * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="400"
                value={Math.round(activeRegion.h * 1000)}
                onChange={(e) => handleSliderChange('h', Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onApply(regions)
                  onClose()
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-5 rounded-xl gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                Apply & Re-Extract
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

