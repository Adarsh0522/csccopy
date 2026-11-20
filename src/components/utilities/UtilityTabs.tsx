'use client'

import { useState } from 'react'
import { Sparkles, Camera, Image as ImageIcon, FileText, FileDown, Layers, ShieldCheck } from 'lucide-react'
import { RemoveBgTool } from './RemoveBgTool'
import { PassportPhotoTool } from './PassportPhotoTool'
import { CompressJpgTool } from './CompressJpgTool'
import { ImageToPdfTool } from './ImageToPdfTool'
import { PdfToImageTool } from './PdfToImageTool'
import { CompressPdfTool } from './CompressPdfTool'

const UTILITY_TOOLS = [
  {
    id: 'crop-passport',
    name: 'Crop Passport',
    label: 'Passport Size Photo',
    icon: Camera,
    description: '3.5×4.5cm Indian Standard • Change Background • Multi-copy Print Sheets • Target KB Adjuster',
  },
  {
    id: 'remove-bg',
    name: 'Remove BG',
    label: 'Background Remover',
    icon: Sparkles,
    description: '100% Free Client-Side AI Background Remover • High Quality Transparent PNG Output',
  },
  {
    id: 'compress-jpg',
    name: 'Compress JPG',
    label: 'Compress Image',
    icon: ImageIcon,
    description: 'Reduce JPG/PNG file sizes to exact target KB (20KB, 50KB, 100KB) for Govt online portals',
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    label: 'JPG to PDF',
    icon: FileText,
    description: 'Merge multiple JPG or PNG images into a clean, printable A4 or Letter PDF document',
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    label: 'PDF to Image',
    icon: Layers,
    description: 'Extract every page of your PDF into high-resolution JPG or PNG images instantly',
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    label: 'Compress PDF',
    icon: FileDown,
    description: 'Reduce PDF document file size up to 90% while keeping clear text and sharp images',
  },
]

export function UtilityTabs() {
  const [activeTab, setActiveTab] = useState('crop-passport')

  const currentTool = UTILITY_TOOLS.find((t) => t.id === activeTab) || UTILITY_TOOLS[0]

  return (
    <div className="w-full bg-[#1b183d]/90 border border-indigo-400/25 shadow-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-indigo-500/20">
        <h2 className="border-l-4 border-emerald-400 pl-3 text-xl font-extrabold text-white">
          Free Smart Utility Tools
        </h2>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Client-Side Free • Zero Wallet Deduction</span>
        </div>
      </div>

      {/* Tab Selector Pills */}
      <div className="flex justify-center w-full">
        <div className="p-1.5 rounded-2xl sm:rounded-full inline-flex flex-wrap sm:flex-nowrap justify-center gap-2 overflow-x-auto max-w-full custom-scrollbar">
          {UTILITY_TOOLS.map((tool) => {
            const Icon = tool.icon
            const isActive = activeTab === tool.id
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTab(tool.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-md border-2 border-transparent'
                    : 'bg-[#13112c] border border-indigo-400/25 text-indigo-200 hover:border-emerald-400/50 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-indigo-300'}`} />
                <span>{tool.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Tool Container */}
      <div className="bg-[#13112c]/80 rounded-2xl border border-indigo-400/30 p-6 sm:p-8 w-full max-w-5xl mx-auto space-y-6 text-white">
        {/* Tool Description Bar */}
        <div className="border-b border-indigo-500/20 pb-4">
          <div className="flex items-center gap-2">
            <currentTool.icon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">{currentTool.label}</h3>
          </div>
          <p className="text-xs text-indigo-200/80 mt-1">{currentTool.description}</p>
        </div>

        {/* Dynamic Tool Component */}
        <div className="animate-in fade-in duration-300 text-slate-100" key={activeTab}>
          {activeTab === 'crop-passport' && <PassportPhotoTool />}
          {activeTab === 'remove-bg' && <RemoveBgTool />}
          {activeTab === 'compress-jpg' && <CompressJpgTool />}
          {activeTab === 'image-to-pdf' && <ImageToPdfTool />}
          {activeTab === 'pdf-to-image' && <PdfToImageTool />}
          {activeTab === 'compress-pdf' && <CompressPdfTool />}
        </div>
      </div>
    </div>
  )
}

