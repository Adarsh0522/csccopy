"use client";

import { useState, useRef } from "react";
import { UploadCloud, Minimize2, Loader2, Download } from "lucide-react";

export function CompressTab() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const processImage = () => {
    setIsProcessing(true);
    // Placeholder for Canvas compression logic
    setTimeout(() => {
      setResult(URL.createObjectURL(file!));
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-4xl mx-auto w-full">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Compress Image</h2>
        <p className="text-gray-500">Reduce file size while preserving quality.</p>
      </div>

      {!file ? (
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
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 flex flex-col items-center space-y-8">
          <div className="w-full flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
              <span className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</span>
            </div>
            <button
              onClick={() => { setFile(null); setResult(null); }}
              className="text-sm text-gray-500 hover:text-red-500 underline"
            >
              Change file
            </button>
          </div>

          {!result ? (
            <div className="w-full max-w-md space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-gray-700">Compression Quality</label>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Smaller File</span>
                  <span>Better Quality</span>
                </div>
              </div>

              <button
                onClick={processImage}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Minimize2 className="w-5 h-5" />}
                {isProcessing ? "Compressing..." : "Compress Image"}
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md flex flex-col items-center space-y-6">
              <div className="bg-green-50 text-green-700 border border-green-200 w-full p-4 rounded-xl text-center space-y-1">
                <p className="font-bold">Compression Successful!</p>
                <p className="text-sm opacity-80">Estimated Size: ~{(file.size * (quality / 100) / 1024).toFixed(2)} KB</p>
              </div>
              
              <button className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md active:scale-95">
                <Download className="w-5 h-5" />
                Download Compressed Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
