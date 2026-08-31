'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Download, Loader2 } from 'lucide-react'
import { removeBackground } from '@imgly/background-removal'

export default function BackgroundRemovalPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0])
      setOriginalImage(url)
      setProcessedImage(null)
    }
  }

  const handleRemoveBackground = async () => {
    if (!originalImage) return
    setIsProcessing(true)

    try {
      const blob = await removeBackground(originalImage)
      const url = URL.createObjectURL(blob)
      setProcessedImage(url)
    } catch (error) {
      console.error('Background removal failed:', error)
      alert('Failed to remove background. Ensure the image is valid.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Free Background Removal</h1>
        <p className="text-zinc-500">100% Client-side. Fast, secure, and no wallet deduction.</p>
      </div>

      {!originalImage && (
        <div className="border-2 border-dashed border-zinc-300 rounded-xl p-12 flex flex-col items-center justify-center bg-zinc-50">
          <Upload className="w-12 h-12 text-zinc-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
          <Input type="file" accept="image/*" className="max-w-xs" onChange={handleFileUpload} />
        </div>
      )}

      {originalImage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-center">Original</h3>
            <div className="bg-zinc-100 rounded-xl p-4 flex items-center justify-center min-h-[300px]">
              <img src={originalImage} alt="Original" className="max-h-[300px] object-contain rounded-lg" />
            </div>
            {!processedImage && (
              <Button 
                onClick={handleRemoveBackground} 
                disabled={isProcessing}
                className="w-full h-12 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Remove Background'
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => { setOriginalImage(null); setProcessedImage(null); }} className="w-full">
              Upload Another
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-center">Result</h3>
            <div className="bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2QxZDFkMSIvPgo8cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZmZmZmZmIi8+CjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmZmZmZmYiLz4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNkMWQxZDEiLz4KPC9zdmc+')] rounded-xl p-4 flex items-center justify-center min-h-[300px] border">
              {processedImage ? (
                <img src={processedImage} alt="Processed" className="max-h-[300px] object-contain rounded-lg" />
              ) : (
                <span className="text-zinc-400">Result will appear here</span>
              )}
            </div>
            {processedImage && (
              <a href={processedImage} download="bg-removed.png">
                <Button className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                  <Download className="mr-2 h-5 w-5" />
                  Download
                </Button>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
