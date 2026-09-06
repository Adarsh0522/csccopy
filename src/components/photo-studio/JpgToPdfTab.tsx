"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, Loader2, Download, Trash2 } from "lucide-react";

export function JpgToPdfTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
      setResult(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processImages = () => {
    setIsProcessing(true);
    // Placeholder for pdf-lib image embedding logic
    setTimeout(() => {
      setResult("dummy_pdf_url");
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-4xl mx-auto w-full">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">JPG to PDF</h2>
        <p className="text-gray-500">Combine multiple images into a single PDF document.</p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="min-h-[160px] border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors group"
      >
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-base font-semibold text-gray-700">Drag & Drop images here</p>
        <p className="text-xs text-gray-500 mt-1">or click to add more files</p>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
      </div>

      {files.length > 0 && !result && (
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 max-h-[300px] overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">{files.length} Images Selected</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map((f, i) => (
                <div key={i} className="relative group bg-white rounded-xl border border-gray-200 overflow-hidden aspect-square flex items-center justify-center">
                  <img src={URL.createObjectURL(f)} alt="preview" className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] truncate px-2 py-1 backdrop-blur-sm">
                    {f.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={processImages}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-full font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              {isProcessing ? "Generating PDF..." : "Convert to PDF"}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-3xl p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">PDF Ready!</h3>
          <p className="text-gray-500">Your images have been successfully converted into a PDF document.</p>
          
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => { setFiles([]); setResult(null); }}
              className="px-6 py-2.5 rounded-full font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
            >
              Convert More
            </button>
            <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-full font-semibold transition-all shadow-md active:scale-95">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
