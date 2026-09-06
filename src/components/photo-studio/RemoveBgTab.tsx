"use client";

import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Scissors, Loader2, Download } from "lucide-react";

export function RemoveBgTab() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const processImage = () => {
    setIsProcessing(true);
    // Placeholder for @imgly/background-removal logic
    setTimeout(() => {
      // Simulate processed result with original for now
      setResult(preview); 
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Remove Background</h2>
        <p className="text-gray-500">Automatically remove backgrounds from images instantly and for free.</p>
      </div>

      {!preview ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 min-h-[300px] border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors group"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Drag & Drop your image here</p>
          <p className="text-sm text-gray-500 mt-2">or click to browse from your device</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
          {/* Original */}
          <div className="flex flex-col items-center space-y-4">
            <h3 className="font-semibold text-gray-700">Original Image</h3>
            <div className="flex-1 w-full relative bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden flex items-center justify-center min-h-[300px]">
              <img src={preview} alt="Original" className="max-w-full max-h-[400px] object-contain" />
            </div>
            <button
              onClick={() => { setFile(null); setPreview(null); setResult(null); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Upload a different image
            </button>
          </div>

          {/* Result */}
          <div className="flex flex-col items-center space-y-4">
            <h3 className="font-semibold text-gray-700">Result</h3>
            <div className="flex-1 w-full relative bg-gray-100/50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col items-center justify-center min-h-[300px] bg-[url('https://transparenttextures.com/patterns/cubes.png')]">
              {result ? (
                <img src={result} alt="Removed BG" className="max-w-full max-h-[400px] object-contain drop-shadow-2xl" />
              ) : isProcessing ? (
                <div className="flex flex-col items-center text-emerald-600">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <span className="font-medium animate-pulse">Extracting Subject...</span>
                </div>
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                  <span>Ready to process</span>
                </div>
              )}
            </div>
            
            {result ? (
              <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-semibold transition-all">
                <Download className="w-4 h-4" />
                Download Image
              </button>
            ) : (
              <button
                onClick={processImage}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-full font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Scissors className="w-4 h-4" />
                Remove Background
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
