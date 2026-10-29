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
    <div className="w-full bg-gradient-to-br from-emerald-100/70 via-teal-50/50 to-blue-100/40 border border-emerald-200/80 shadow-md rounded-[2.5rem] p-6 sm:p-10 my-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600/10 border border-emerald-600/20 text-emerald-800 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>100% Client-Side Free Utilities • Zero Wallet Deduction</span>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Free Smart Utility Tools</h2>
      </div>

      {/* Tab Selector Pills */}
      <div className="flex justify-center w-full">
        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl sm:rounded-full inline-flex shadow-sm border border-gray-200/60 overflow-x-auto max-w-full gap-1 custom-scrollbar">
          {UTILITY_TOOLS.map((tool) => {
            const Icon = tool.icon
            const isActive = activeTab === tool.id
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTab(tool.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md transform scale-[1.02]'
                    : 'text-gray-600 hover:text-emerald-700 hover:bg-white/90'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                <span>{tool.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Tool Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10 w-full max-w-5xl mx-auto space-y-6">
        {/* Tool Description Bar */}
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <currentTool.icon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xl font-bold text-gray-900">{currentTool.label}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">{currentTool.description}</p>
        </div>

        {/* Dynamic Tool Component */}
        <div className="animate-in fade-in duration-300" key={activeTab}>
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

