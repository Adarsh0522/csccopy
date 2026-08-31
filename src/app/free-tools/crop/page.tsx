'use client'

import React, { useState, useRef } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Download } from 'lucide-react'

export default function CropPage() {
  const [imgSrc, setImgSrc] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>('')

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop({ unit: '%', width: 50, height: 50, x: 25, y: 25 })
      const reader = new FileReader()
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''))
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const getCroppedImg = async (image: HTMLImageElement, pixelCrop: PixelCrop) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    const base64Image = canvas.toDataURL('image/jpeg')
    setCroppedImageUrl(base64Image)
  }

  const handleCropComplete = () => {
    if (completedCrop && imgRef.current) {
      getCroppedImg(imgRef.current, completedCrop)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Free Crop & Resize</h1>
        <p className="text-zinc-500">Fast client-side image cropping.</p>
      </div>

      {!imgSrc && (
        <div className="border-2 border-dashed border-zinc-300 rounded-xl p-12 flex flex-col items-center justify-center bg-zinc-50">
          <Upload className="w-12 h-12 text-zinc-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
          <Input type="file" accept="image/*" className="max-w-xs" onChange={onSelectFile} />
        </div>
      )}

      {imgSrc && (
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-xl p-4 flex justify-center overflow-auto max-h-[600px]">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              <img ref={imgRef} src={imgSrc} alt="Upload" />
            </ReactCrop>
          </div>
          
          <div className="flex space-x-4">
            <Button onClick={handleCropComplete} size="lg">Crop Image</Button>
            <Button variant="outline" onClick={() => { setImgSrc(''); setCroppedImageUrl(''); }} size="lg">Clear</Button>
          </div>
        </div>
      )}

      {croppedImageUrl && (
        <div className="space-y-4 pt-8 border-t">
          <h3 className="font-semibold text-lg text-center">Cropped Result</h3>
          <div className="flex justify-center">
            <img src={croppedImageUrl} alt="Cropped" className="max-h-[300px] border shadow-lg rounded" />
          </div>
          <div className="flex justify-center">
            <a href={croppedImageUrl} download="cropped-image.jpg">
              <Button className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" />
                Download Cropped
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
