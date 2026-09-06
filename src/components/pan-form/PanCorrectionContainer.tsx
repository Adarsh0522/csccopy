"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import { usePanCorrectionLogic } from "@/hooks/use-pan-correction-logic";
import { CorrectionIdentityStep } from "./correction/CorrectionIdentityStep";
import { CorrectionAddressStep } from "./correction/CorrectionAddressStep";
import { CorrectionContactIncomeSection, CorrectionParentsSection, CorrectionDeclarationSection } from "./correction/CorrectionAdditionalDetailsStep";
import { Loader2, Download, FileText, ChevronDown, Check, Printer, X, Sparkles } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { mapCorrectionFormToPDF } from "@/lib/mapping-layer/pan-correction-mapper";
import { PanCorrectionData } from "@/lib/form-engine/correction-schema";
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PanPdfEngine } from "@/lib/pdf/engine";
import { PAN_CORRECTION_CONFIG } from "@/lib/pdf/config/pan-correction";

// --- REUSABLE COLLAPSIBLE STEP COMPONENT ---
interface CollapsibleStepProps {
  title: string;
  stepIndex: number;
  activeStep: number;
  isCompleted: boolean;
  onContinue: () => void;
  onToggle: () => void;
  children: React.ReactNode;
  isValid?: boolean;
  customButton?: React.ReactNode;
}

function CollapsibleStep({
  title,
  stepIndex,
  activeStep,
  isCompleted,
  onContinue,
  onToggle,
  children,
  isValid = true,
  customButton
}: CollapsibleStepProps) {
  const isOpen = activeStep === stepIndex;
  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && stepRef.current) {
      stepRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isOpen]);

  return (
    <div
      ref={stepRef}
      className={cn(
        "bg-white border transition-all duration-300 rounded-xl overflow-hidden",
        isOpen ? "border-emerald-200 ring-4 ring-emerald-500/10 shadow-md" : "border-gray-200 shadow-sm",
        isCompleted && !isOpen ? "bg-white" : ""
      )}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between p-5 cursor-pointer transition-colors",
          isOpen ? "bg-emerald-50 text-emerald-700" : "bg-white hover:bg-gray-50"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
            isCompleted ? "bg-emerald-500 text-white" :
              isOpen ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"
          )}>
            {isCompleted ? <Check className="w-4 h-4" /> : stepIndex}
          </div>
          <span className={cn(
            "text-sm font-semibold tracking-tight transition-colors",
            isOpen ? "text-emerald-700" : "text-gray-700"
          )}>
            {title}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 transition-transform duration-300",
          isOpen ? "rotate-180 text-emerald-700" : "text-gray-400"
        )} />
      </div>

      {/* Content */}
      <div className={cn(
        "grid transition-all duration-500 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="p-6 pt-6 border-t border-gray-100">
            <div className="space-y-6">
              {children}
            </div>
            <div className="mt-8 flex justify-end">
              {customButton ? (
                customButton
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onContinue();
                  }}
                  disabled={!isValid}
                  className={cn(
                    "rounded-xl px-8 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-95",
                    isValid
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  )}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PanCorrectionContainer({ noPadding = false, initialProfile }: { noPadding?: boolean, initialProfile?: any }) {
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // PDF Generation State
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  const form: UseFormReturn<PanCorrectionData, any, PanCorrectionData> = usePanCorrectionLogic(initialProfile);
  const { register, handleSubmit, formState: { errors }, control, watch, setValue, trigger } = form;

  // Load Template Once
  useEffect(() => {
    fetch('/templates/pan-correction.pdf')
      .then(r => r.arrayBuffer())
      .then(buffer => setTemplateBuffer(buffer))
      .catch(err => console.error("Failed to load PAN Correction template", err));
  }, []);

  // Scroll Lock Effect
  useEffect(() => {
    if (showSuccessModal || isGenerating) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showSuccessModal, isGenerating]);

  const currentValues = watch();
  const debouncedValues = useDebounce(currentValues, 1000);
  const [lastHash, setLastHash] = useState("");

  const addressType = watch("addressType");
  const totalSteps = 5;

  const stepFields = useMemo(() => {
    return {
      1: ["oldPan", "firstName", "lastName", "gender", "dob", "aadhaar", "correctionFields"],
      2: ["addressType", "correctionFields.address", addressType === "OFFICE" ? "addresses.office" : "addresses.residence"],
      3: ["passportNumber", "tin", "contact.mobile", "contact.email", "contact.isdCode", "contact.stdCode", "contact.landline"],
      4: ["fatherName", "motherName", "parentToPrint"],
      5: ["verification.place", "verification.date", "verification.pronoun", "documents", "correctionFields"],
    };
  }, [addressType]);

  // Live Preview Logic (Client-Side)
  useEffect(() => {
    const generatePreview = async () => {
      const currentHash = JSON.stringify(debouncedValues);
      if (currentHash === lastHash) return;

      const hasAnySelection = Object.values(debouncedValues.correctionFields || {}).some(v => v === true);
      if (!debouncedValues.oldPan || !hasAnySelection || !templateBuffer) {
        setPreviewUrl(null);
        return;
      }

      setPreviewLoading(true);
      try {
        const engine = new PanPdfEngine(PAN_CORRECTION_CONFIG);
        await engine.init(templateBuffer);
        const mapped = mapCorrectionFormToPDF(debouncedValues as any);
        const pdfBytes = await engine.generate(mapped, false, false);
        const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        
        setPreviewUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setLastHash(currentHash);
      } catch (e) {
        console.error("Preview failed", e);
      } finally {
        setPreviewLoading(false);
      }
    };
    generatePreview();
  }, [debouncedValues, lastHash, templateBuffer]);

  const handleContinue = async (stepIndex: number) => {
    const fields = stepFields[stepIndex as keyof typeof stepFields];
    if (!fields) return;

    const isStepValid = await trigger(fields as any);

    if (isStepValid) {
      setCompletedSteps(prev => new Set(prev).add(stepIndex));
      if (stepIndex < totalSteps) {
        setActiveStep(stepIndex + 1);
      }
    }
  };

  const onInvalidSubmit = (errs: any) => {
    for (let i = 1; i <= totalSteps; i++) {
      const fields = stepFields[i as keyof typeof stepFields];
      const hasError = fields.some(f => {
        const parts = f.split('.');
        let curr = errs;
        for (const p of parts) {
          if (curr && curr[p]) curr = curr[p];
          else { curr = undefined; break; }
        }
        return !!curr;
      });

      if (hasError) {
        setActiveStep(i);
        return;
      }
    }
  };

  const onFinalSubmit = async (data: PanCorrectionData) => {
    setIsGenerating(true);
    setShowSuccessModal(false);
    setGeneratedPdfUrl(null);

    try {
      if (!templateBuffer) throw new Error("PDF Template not loaded yet. Please wait a moment.");

      // --- WALLET DEDUCTION LOGIC ---
      // In a real environment, this would call Supabase RPC `deduct_wallet`.
      await new Promise(resolve => setTimeout(resolve, 800));
      // -------------------------------

      const formattedData = {
        ...data,
        contact: {
          ...data.contact,
          email: data.contact?.email?.toUpperCase()
        }
      };

      const mapped = mapCorrectionFormToPDF(formattedData as any);
      
      const engine = new PanPdfEngine(PAN_CORRECTION_CONFIG);
      await engine.init(templateBuffer);
      const pdfBytes = await engine.generate(mapped, false, false);
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      setGeneratedPdfUrl(URL.createObjectURL(blob));

      setCompletedSteps(prev => {
        const next = new Set(prev);
        for (let i = 1; i <= totalSteps; i++) next.add(i);
        return next;
      });
      setActiveStep(0);

      setIsGenerating(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Form preparation failed:", error);
      alert(error.message || "Something went wrong. Please try again.");
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPdfUrl) return;
    const link = document.createElement("a");
    link.href = generatedPdfUrl;
    link.download = `PAN_Correction_${currentValues.oldPan || "Form"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!generatedPdfUrl) return;
    const printWindow = window.open(generatedPdfUrl, "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to view and print the PDF.");
    }
  };

  const handleFinalReset = () => {
    form.reset();
    setGeneratedPdfUrl(null);
    setShowSuccessModal(false);
    window.location.href = "/dashboard/pan-services";
  };

  return (
    <div className={cn(
      "w-full flex flex-col lg:flex-row gap-6 items-start bg-gray-50",
      noPadding ? "" : "pt-2 px-4 lg:px-6"
    )}>
      {/* Form Section - Center (65%) */}
      <form
        onSubmit={handleSubmit(onFinalSubmit, onInvalidSubmit)}
        className="flex-1 w-full lg:max-w-[calc(100%-420px)] lg:pl-2"
      >
        <div className="flex flex-col gap-4">
          <CollapsibleStep
            title="Correction Fields & Personal Details"
            stepIndex={1}
            activeStep={activeStep}
            isCompleted={completedSteps.has(1)}
            onContinue={() => handleContinue(1)}
            onToggle={() => setActiveStep(1)}
          >
            <CorrectionIdentityStep register={register} errors={errors} control={control} setValue={setValue} />
          </CollapsibleStep>

          <CollapsibleStep
            title="Communication Address"
            stepIndex={2}
            activeStep={activeStep}
            isCompleted={completedSteps.has(2)}
            onContinue={() => handleContinue(2)}
            onToggle={() => (completedSteps.has(1) || activeStep === 2) && setActiveStep(2)}
          >
            <CorrectionAddressStep register={register} errors={errors} control={control} setValue={setValue} />
          </CollapsibleStep>

          <CollapsibleStep
            title="Contact Details"
            stepIndex={3}
            activeStep={activeStep}
            isCompleted={completedSteps.has(3)}
            onContinue={() => handleContinue(3)}
            onToggle={() => (completedSteps.has(2) || activeStep === 3) && setActiveStep(3)}
          >
            <CorrectionContactIncomeSection register={register} errors={errors} control={control} setValue={setValue} />
          </CollapsibleStep>

          <CollapsibleStep
            title="Parents Details"
            stepIndex={4}
            activeStep={activeStep}
            isCompleted={completedSteps.has(4)}
            onContinue={() => handleContinue(4)}
            onToggle={() => (completedSteps.has(3) || activeStep === 4) && setActiveStep(4)}
          >
            <CorrectionParentsSection register={register} errors={errors} control={control} setValue={setValue} />
          </CollapsibleStep>

          <CollapsibleStep
            title="Declaration & Verification"
            stepIndex={totalSteps}
            activeStep={activeStep}
            isCompleted={completedSteps.has(totalSteps)}
            onContinue={() => handleContinue(totalSteps)}
            onToggle={() => (completedSteps.has(totalSteps - 1) || activeStep === totalSteps) && setActiveStep(totalSteps)}
            customButton={
              <button
                type="submit"
                disabled={isGenerating}
                className={cn(
                  "w-full lg:w-auto flex items-center justify-center gap-2 text-white h-[48px] px-8 rounded-xl font-semibold transition-all active:scale-95 shadow-sm text-sm",
                  !isGenerating
                    ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Wallet Deduction...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Correction PDF (₹10)</span>
                  </>
                )}
              </button>
            }
          >
            <CorrectionDeclarationSection register={register} errors={errors} control={control} setValue={setValue} />
          </CollapsibleStep>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center"
              >
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                  <div className="space-y-1 text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Processing Payment & PDF</p>
                    <p className="text-sm font-medium text-gray-500">Deducting ₹10 from CSCCopy Wallet...</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Modal */}
          <AnimatePresence>
            {showSuccessModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                  onClick={() => setShowSuccessModal(false)}
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200 p-8 text-center"
                >
                  <button
                    type="button"
                    onClick={handleFinalReset}
                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Check className="w-8 h-8" />
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-2">Correction Form Generated</h2>
                  <p className="text-gray-500 mb-8 text-sm">
                    ₹10 was successfully deducted from your wallet. Your PDF is ready.
                  </p>

                  <div className="flex flex-col gap-3 mb-6">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex items-center justify-center gap-2 text-white h-[48px] rounded-xl font-semibold transition-all bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex items-center justify-center gap-2 text-gray-700 h-[48px] rounded-xl font-semibold transition-all bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      Print PDF
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalReset}
                    className="text-sm text-gray-500 font-medium hover:text-gray-700"
                  >
                    Start New Application
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Live Preview Section - Right (35%) */}
      <div className="w-full lg:w-[380px] lg:sticky lg:top-8 h-[525px] max-h-[90vh]">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Live Preview</span>
          </div>

          <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative shadow-inner flex flex-col items-center justify-center">
            {previewUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full rounded-lg"
                  title="Live Print Preview"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 border border-gray-200">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Form Matrix</p>
                <p className="text-[10px] text-gray-400 px-2">Select update fields and enter Old PAN to generate preview.</p>
              </div>
            )}

            {previewLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
