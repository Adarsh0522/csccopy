"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import { usePanFormLogic } from "@/hooks/use-pan-form-logic";
import { IdentityStep } from "./IdentityStep";
import { AddressStep } from "./AddressStep";
import { ContactIncomeSection, ParentsSection, DeclarationSection, RepresentativeAssesseeSection, ResidentialStatusSection } from "./AdditionalDetailsStep";
import { Loader2, ArrowRight, Download, FileText, ChevronDown, Check, Printer, X, Sparkles, Wallet, AlertCircle, ShieldCheck } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { mapFormToPDF } from "@/lib/mapping-layer/new-pan-mapper";
import { PanFormData } from "@/lib/form-engine/schema";
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PanPdfEngine } from "@/lib/pdf/engine";
import { NEW_PAN_CONFIG } from "@/lib/pdf/config/new-pan";
import { createClient } from "@/lib/supabase/client";
import { deductWalletBalance } from "@/lib/actions/wallet";
import { emitWalletUpdate, subscribeToWallet } from "@/lib/realtime";

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
        "bg-[#161338]/95 border transition-all duration-300 rounded-2xl overflow-hidden shadow-xl",
        isOpen ? "border-emerald-400/40 ring-4 ring-emerald-500/10 shadow-emerald-500/10" : "border-indigo-400/25 hover:border-indigo-400/40"
      )}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between p-5 cursor-pointer transition-colors",
          isOpen ? "bg-emerald-500/15 border-b border-emerald-400/30 text-white font-bold" : "bg-[#1f1b4b] border-b border-indigo-400/20 text-white hover:bg-[#25205a]"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all",
            isCompleted ? "bg-emerald-500 text-slate-950" :
              isOpen ? "bg-emerald-500 text-slate-950" : "bg-[#0f0d26] text-indigo-300 border border-indigo-400/30"
          )}>
            {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepIndex}
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            {title}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 transition-transform duration-300",
          isOpen ? "rotate-180 text-emerald-400" : "text-indigo-300"
        )} />
      </div>

      {/* Content */}
      <div className={cn(
        "grid transition-all duration-500 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="p-6 pt-6 border-t border-indigo-400/20 bg-[#161338]">
            <div className="space-y-6 text-white">
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
                    "rounded-xl px-8 py-2.5 text-sm font-extrabold shadow-lg transition-all active:scale-95 cursor-pointer",
                    isValid
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25"
                      : "bg-[#0f0d26] text-indigo-300/40 cursor-not-allowed border border-indigo-500/20"
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

export function PanFormContainer({ noPadding = false, initialProfile }: { noPadding?: boolean, initialProfile?: any }) {
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [insufficientMessage, setInsufficientMessage] = useState<string>("");

  // Dynamic pricing & wallet balance
  const [panPrice, setPanPrice] = useState<number>(10);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // PDF Generation State
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  const form: UseFormReturn<PanFormData, any, PanFormData> = usePanFormLogic(initialProfile);
  const { register, handleSubmit, formState: { errors, isValid: isFormValid }, control, watch, setValue, trigger } = form;

  // Load Template Once
  useEffect(() => {
    fetch('/templates/new-pan.pdf')
      .then(r => r.arrayBuffer())
      .then(buffer => setTemplateBuffer(buffer))
      .catch(err => console.error("Failed to load PDF template", err));
  }, []);

  // Fetch dynamic PAN services fee & user's current wallet balance
  useEffect(() => {
    let unsubscribeWallet: (() => void) | null = null;

    async function loadPriceAndWallet() {
      try {
        const supabase = createClient();
        const { data: allSrv } = await supabase
          .from('services')
          .select('price, title, form_schema');

        const serviceData = allSrv?.find((s: any) => 
          s.form_schema?.[0]?.core_tool === 'pan_services' || 
          s.title?.toLowerCase().trim() === 'pan services' || 
          s.title?.toLowerCase().trim() === 'pan form generator' ||
          (s.title?.toLowerCase().includes('pan') && s.price < 100)
        );

        if (serviceData?.price != null) {
          setPanPrice(Number(serviceData.price));
        } else {
          setPanPrice(2);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fetchBalance = async () => {
            const { data: walletData } = await supabase
              .from('wallet')
              .select('balance')
              .eq('user_id', user.id)
              .maybeSingle();

            if (walletData?.balance != null) {
              setWalletBalance(Number(walletData.balance));
            }
          };

          await fetchBalance();

          unsubscribeWallet = subscribeToWallet(user.id, (newBalance) => {
            if (newBalance !== undefined && newBalance !== null) {
              setWalletBalance(Number(newBalance));
            } else {
              fetchBalance();
            }
          });
        }
      } catch (err) {
        console.error("Failed to load PAN pricing or wallet balance:", err);
      }
    }

    loadPriceAndWallet();

    return () => {
      if (unsubscribeWallet) unsubscribeWallet();
    };
  }, []);

  // Scroll Lock Effect
  useEffect(() => {
    if (showSuccessModal || isGenerating || showInsufficientModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showSuccessModal, isGenerating, showInsufficientModal]);

  const currentValues = watch();
  const debouncedValues = useDebounce(currentValues, 1000);
  const [lastHash, setLastHash] = useState("");

  const addressType = watch("addressType");
  const hasRAStep = addressType === "REPRESENTATIVE";
  const totalSteps = hasRAStep ? 6 : 5;

  const stepFields = useMemo(() => {
    const fields: Record<number, any[]> = {
      1: ["firstName", "lastName", "gender", "dob", "aadhaar"],
      2: ["addressType", "addresses.residence"],
      3: ["residentialStatus", "passportNumber", "tin", "contact.mobile", "contact.email", "incomeSource", "contact.countryCode"],
      4: ["isSingleParent", "fatherName.firstName", "fatherName.lastName", "motherName.firstName", "motherName.lastName", "parentToPrint"],
    };

    if (hasRAStep) {
      fields[5] = ["raDetails.firstName", "raDetails.lastName", "raDetails.pan", "raDetails.aadhaar", "raDetails.mobile", "raDetails.email"];
      fields[6] = ["aoCode", "verification.place", "documents", "verification.name"];
    } else {
      fields[5] = ["aoCode", "verification.place", "documents", "verification.name"];
    }
    return fields;
  }, [hasRAStep]);

  // Live Preview Logic (Client-Side)
  useEffect(() => {
    const generatePreview = async () => {
      const currentHash = JSON.stringify(debouncedValues);
      if (currentHash === lastHash) return;
      if (debouncedValues.firstName?.length < 2 || debouncedValues.lastName?.length < 2 || !templateBuffer) {
        setPreviewUrl(null);
        return;
      }

      setPreviewLoading(true);
      try {
        const engine = new PanPdfEngine(NEW_PAN_CONFIG);
        await engine.init(templateBuffer);
        const mapped = mapFormToPDF(debouncedValues as any);
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
    const fields = stepFields[stepIndex];
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
    // Find first step with errors and expand it
    for (let i = 1; i <= totalSteps; i++) {
      const fields = stepFields[i];
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

  const onFinalSubmit = async (data: PanFormData) => {
    setIsGenerating(true);
    setShowSuccessModal(false);
    setGeneratedPdfUrl(null);

    try {
      if (!templateBuffer) throw new Error("PDF Template not loaded yet. Please wait a moment.");

      // Wallet deduction via server action
      const deductRes = await deductWalletBalance(panPrice, 'PAN Services: New PAN Application Form');
      
      if (!deductRes.success) {
        setIsGenerating(false);
        if (deductRes.current_balance !== undefined) {
          setWalletBalance(deductRes.current_balance);
        }
        setInsufficientMessage(deductRes.message || `Insufficient wallet balance. You need ₹${panPrice} to generate this application.`);
        setShowInsufficientModal(true);
        return;
      }

      if (deductRes.new_balance != null) {
        setWalletBalance(deductRes.new_balance);
        emitWalletUpdate(deductRes.new_balance);
      }

      const formattedData = {
        ...data,
        contact: {
          ...data.contact,
          email: data.contact?.email?.toUpperCase()
        }
      };

      const mapped = mapFormToPDF(formattedData as any);
      
      const engine = new PanPdfEngine(NEW_PAN_CONFIG);
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
    link.download = `PAN_Application_${currentValues.firstName || "Form"}.pdf`;
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
      "w-full flex flex-col lg:flex-row gap-6 items-start bg-transparent text-white",
      noPadding ? "" : "pt-2 px-4 lg:px-6"
    )}>
      {/* Form Section - Center (65%) */}
      <form
        onSubmit={handleSubmit(onFinalSubmit, onInvalidSubmit)}
        className="flex-1 w-full lg:max-w-[calc(100%-420px)] lg:pl-2"
      >
        <div className="flex flex-col gap-4">
          {/* Top Info Banner with Dynamic Fee and Wallet Balance */}
          <div className="bg-[#161338]/95 border border-indigo-400/25 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">New PAN Application (Form 49A)</h2>
              <p className="text-xs sm:text-sm text-indigo-200/80 mt-1">Fill in all steps. The official PDF will be generated upon confirmation.</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Service Fee: ₹{panPrice}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-xs">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Wallet: ₹{walletBalance != null ? walletBalance.toFixed(2) : '...'}</span>
              </div>
            </div>
          </div>

          <CollapsibleStep
            title="Personal Details"
            stepIndex={1}
            activeStep={activeStep}
            isCompleted={completedSteps.has(1)}
            onContinue={() => handleContinue(1)}
            onToggle={() => setActiveStep(1)}
          >
            <IdentityStep register={register} errors={errors} control={control} />
          </CollapsibleStep>

          <CollapsibleStep
            title="Communication Address"
            stepIndex={2}
            activeStep={activeStep}
            isCompleted={completedSteps.has(2)}
            onContinue={() => handleContinue(2)}
            onToggle={() => (completedSteps.has(1) || activeStep === 2) && setActiveStep(2)}
          >
            <AddressStep register={register} errors={errors} control={control} />
          </CollapsibleStep>

          <CollapsibleStep
            title="Contact & Income Details"
            stepIndex={3}
            activeStep={activeStep}
            isCompleted={completedSteps.has(3)}
            onContinue={() => handleContinue(3)}
            onToggle={() => (completedSteps.has(2) || activeStep === 3) && setActiveStep(3)}
          >
            <div className="space-y-6">
              <ResidentialStatusSection register={register} errors={errors} control={control} />
              <ContactIncomeSection register={register} errors={errors} control={control} />
            </div>
          </CollapsibleStep>

          <CollapsibleStep
            title="Parent's Details"
            stepIndex={4}
            activeStep={activeStep}
            isCompleted={completedSteps.has(4)}
            onContinue={() => handleContinue(4)}
            onToggle={() => (completedSteps.has(3) || activeStep === 4) && setActiveStep(4)}
          >
            <ParentsSection register={register} errors={errors} control={control} />
          </CollapsibleStep>

          {hasRAStep && (
            <CollapsibleStep
              title="Representative Assessee (RA)"
              stepIndex={5}
              activeStep={activeStep}
              isCompleted={completedSteps.has(5)}
              onContinue={() => handleContinue(5)}
              onToggle={() => (completedSteps.has(4) || activeStep === 5) && setActiveStep(5)}
            >
              <RepresentativeAssesseeSection register={register} errors={errors} control={control} />
            </CollapsibleStep>
          )}

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
                  "w-full lg:w-auto flex items-center justify-center gap-2 text-slate-950 h-[48px] px-8 rounded-xl font-extrabold transition-all active:scale-95 shadow-lg text-sm",
                  !isGenerating
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/25 cursor-pointer"
                    : "bg-[#0f0d26] text-indigo-300/40 border border-indigo-400/20 cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Deducting ₹{panPrice} & Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>Pay ₹{panPrice} & Generate PDF</span>
                  </>
                )}
              </button>
            }
          >
            <DeclarationSection register={register} errors={errors} control={control} setValue={setValue} />
          </CollapsibleStep>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center"
              >
                <div className="bg-[#181537] p-8 rounded-2xl shadow-2xl border border-indigo-400/30 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500 text-white">
                  <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                  <div className="space-y-1 text-center">
                    <p className="text-lg font-bold text-white tracking-tight">Processing Payment & PDF</p>
                    <p className="text-sm font-medium text-indigo-200">Deducting ₹{panPrice} from CSCCopy Wallet...</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Insufficient Balance Modal */}
          <AnimatePresence>
            {showInsufficientModal && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowInsufficientModal(false)}
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="relative w-full max-w-md bg-[#181537] rounded-2xl overflow-hidden shadow-2xl border border-indigo-400/30 p-6 text-center text-white"
                >
                  <button
                    type="button"
                    onClick={() => setShowInsufficientModal(false)}
                    className="absolute top-4 right-4 p-2 rounded-full text-indigo-300 hover:bg-[#0f0d26] hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="w-16 h-16 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <AlertCircle className="w-8 h-8" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">Insufficient Wallet Balance</h3>
                  <p className="text-sm text-indigo-200 mb-5 leading-relaxed">
                    {insufficientMessage || `You need ₹${panPrice} to generate and download this PAN application. Your current balance is ₹${walletBalance?.toFixed(2) || '0.00'}.`}
                  </p>

                  <div className="bg-[#0f0d26] border border-indigo-400/25 rounded-xl p-3.5 mb-6 text-left space-y-2 text-xs">
                    <div className="flex justify-between text-indigo-200">
                      <span>Service Fee:</span>
                      <span className="font-semibold text-white">₹{panPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-indigo-200">
                      <span>Current Balance:</span>
                      <span className="font-semibold text-rose-400">₹{(walletBalance || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-indigo-200 border-t border-indigo-500/20 pt-2 font-medium">
                      <span>Amount Needed:</span>
                      <span className="font-bold text-rose-400">₹{Math.max(0, panPrice - (walletBalance || 0)).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <a
                      href="/dashboard/wallet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-slate-950 h-[46px] rounded-xl font-extrabold transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-500/25"
                    >
                      <Wallet className="w-4 h-4" />
                      Recharge Wallet Now
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowInsufficientModal(false)}
                      className="h-[42px] rounded-xl font-semibold text-sm text-indigo-300 hover:text-white transition-all cursor-pointer"
                    >
                      Close & Review Form
                    </button>
                  </div>
                </motion.div>
              </div>
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
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowSuccessModal(false)}
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="relative w-full max-w-md bg-[#181537] rounded-2xl overflow-hidden shadow-2xl border border-indigo-400/30 p-8 text-center text-white"
                >
                  <button
                    type="button"
                    onClick={handleFinalReset}
                    className="absolute top-4 right-4 p-2 rounded-full text-indigo-300 hover:bg-[#0f0d26] hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>

                  <h2 className="text-xl font-bold text-white mb-2">Application Generated Successfully</h2>
                  <p className="text-indigo-200 mb-2 text-sm">
                    ₹{panPrice} was successfully deducted from your wallet. Your official PDF is ready.
                  </p>
                  {walletBalance != null && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f0d26] text-xs font-semibold text-emerald-300 border border-indigo-400/25 mb-6">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Remaining Balance: ₹{walletBalance.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 mb-6">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex items-center justify-center gap-2 text-slate-950 h-[48px] rounded-xl font-extrabold transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-500/25 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex items-center justify-center gap-2 text-white h-[48px] rounded-xl font-bold transition-all bg-[#0f0d26] border border-indigo-400/30 hover:bg-[#13112c] shadow-sm cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Print PDF
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalReset}
                    className="text-sm text-indigo-300 font-medium hover:text-white cursor-pointer"
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
        <div className="bg-[#13112c] border border-indigo-400/25 rounded-2xl p-4 shadow-xl relative overflow-hidden flex flex-col h-full text-white">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wide">Live Preview</span>
          </div>

          <div className="flex-1 bg-slate-900/80 rounded-xl overflow-hidden border border-indigo-400/20 relative shadow-inner flex flex-col items-center justify-center">
            {previewUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-white">
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full rounded-lg"
                  title="Live Print Preview"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-[#1b183d] rounded-xl shadow-sm flex items-center justify-center mb-3 border border-indigo-400/30">
                  <FileText className="w-6 h-6 text-indigo-300" />
                </div>
                <p className="text-xs font-bold text-white uppercase tracking-wide mb-1">Form Matrix</p>
                <p className="text-[11px] text-indigo-200/70 px-2">Waiting for sufficient input to generate the preview.</p>
              </div>
            )}

            {previewLoading && (
              <div className="absolute inset-0 bg-[#0d0b21]/70 backdrop-blur-[2px] flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
