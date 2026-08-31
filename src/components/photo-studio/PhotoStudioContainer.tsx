"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Scissors, Crop, Minimize2, FileImage, FileText } from "lucide-react";

import { RemoveBgTab } from "./RemoveBgTab";
import { CropTab } from "./CropTab";
import { CompressTab } from "./CompressTab";
import { JpgToPdfTab } from "./JpgToPdfTab";
import { PdfToJpgTab } from "./PdfToJpgTab";

const tabs = [
  { id: "remove-bg", label: "Remove BG", icon: <Scissors className="w-4 h-4" /> },
  { id: "crop", label: "Crop", icon: <Crop className="w-4 h-4" /> },
  { id: "compress", label: "Compress", icon: <Minimize2 className="w-4 h-4" /> },
  { id: "jpg-to-pdf", label: "JPG to PDF", icon: <FileText className="w-4 h-4" /> },
  { id: "pdf-to-jpg", label: "PDF to JPG", icon: <FileImage className="w-4 h-4" /> },
];

export function PhotoStudioContainer() {
  const [activeTab, setActiveTab] = useState("remove-bg");

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Photo Studio</h1>
        <p className="text-slate-500 mt-2">
          100% Free Client-Side Image Tools. No wallet deduction, completely secure.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-none">
        <div className="flex bg-slate-200/50 p-1 rounded-2xl w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300",
                  isActive
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="w-full bg-white border border-slate-200 shadow-sm rounded-3xl p-6 lg:p-8 min-h-[500px]">
        {activeTab === "remove-bg" && <RemoveBgTab />}
        {activeTab === "crop" && <CropTab />}
        {activeTab === "compress" && <CompressTab />}
        {activeTab === "jpg-to-pdf" && <JpgToPdfTab />}
        {activeTab === "pdf-to-jpg" && <PdfToJpgTab />}
      </div>
    </div>
  );
}
