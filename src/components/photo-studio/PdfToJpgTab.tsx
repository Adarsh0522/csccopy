"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileImage, Loader2, Download, CheckCircle2 } from "lucide-react";

export function PdfToJpgTab() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedImages([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setExtractedImages([]);
    }
  };

  const processPDF = () => {
    setIsProcessing(true);
    // Placeholder for pdf.js extraction logic
    setTimeout(() => {
      // Simulate 2 extracted pages
      setExtractedImages(["dummy_url_1", "dummy_url_2"]);
      setIsProcessing(false);
    }, 2500);
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-4xl mx-auto w-full">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-bold text-slate-900">PDF to JPG</h2>
        <p className="text-slate-500">Extract every page of a PDF document into high-quality JPG images.</p>
      </div>

      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 min-h-[300px] border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors group"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-lg font-semibold text-slate-700">Drag & Drop your PDF here</p>
          <p className="text-sm text-slate-500 mt-2">or click to browse from your device</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
        </div>
      ) : extractedImages.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 flex flex-col items-center space-y-8 flex-1 justify-center">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm border border-red-100">
              <span className="font-bold text-xl uppercase">PDF</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg truncate max-w-xs">{file.name}</h3>
              <p className="text-slate-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setFile(null)}
              className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 underline"
            >
              Choose different file
            </button>
            <button
              onClick={processPDF}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileImage className="w-5 h-5" />}
              {isProcessing ? "Extracting Pages..." : "Convert to JPG"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 text-green-700 border border-green-200 w-full p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            <p className="font-semibold">Successfully extracted {extractedImages.length} pages!</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
            {extractedImages.map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-3">
                <div className="w-full aspect-[1/1.4] bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-center p-2 relative group">
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <button className="bg-white text-slate-900 rounded-full p-3 shadow-lg hover:scale-110 transition-transform">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-slate-300 font-medium text-center">
                    <FileImage className="w-8 h-8 mx-auto mb-2" />
                    Page {i + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-full font-semibold transition-all shadow-md active:scale-95">
              <Download className="w-5 h-5" />
              Download All as ZIP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
