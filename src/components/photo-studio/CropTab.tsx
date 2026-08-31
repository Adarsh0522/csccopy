"use client";

import { useState, useRef } from "react";
import { UploadCloud, Crop as CropIcon, Loader2, Download } from "lucide-react";

export function CropTab() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const processImage = () => {
    setIsProcessing(true);
    // Placeholder for crop extraction logic
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-bold text-slate-900">Crop Image</h2>
        <p className="text-slate-500">Freely crop your images to custom dimensions.</p>
      </div>

      {!preview ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 min-h-[300px] border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors group"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-lg font-semibold text-slate-700">Drag & Drop your image here</p>
          <p className="text-sm text-slate-500 mt-2">or click to browse from your device</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6 flex-1">
          <div className="w-full bg-slate-100 rounded-2xl border border-slate-200 p-4 flex items-center justify-center min-h-[400px]">
            {/* Placeholder for react-image-crop */}
            <div className="relative border-2 border-dashed border-blue-400 p-2">
              <img src={preview} alt="To Crop" className="max-w-full max-h-[500px] object-contain" />
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Crop Area Placeholder</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setFile(null); setPreview(null); }}
              className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={processImage}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CropIcon className="w-4 h-4" />}
              {isProcessing ? "Cropping..." : "Apply Crop"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
