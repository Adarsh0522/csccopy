import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CorrectionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  isSelected?: boolean;
  onToggle?: () => void;
  registration?: UseFormRegisterReturn;
}

export function CorrectionInput({
  label,
  error,
  isSelected,
  onToggle,
  registration,
  className,
  ...props
}: CorrectionInputProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between mb-1">
        <label className={cn(
          "text-xs font-bold transition-colors uppercase tracking-wide",
          isSelected ? "text-emerald-300" : "text-indigo-200"
        )}>
          {label} {props.required && <span className="text-rose-400">*</span>}
        </label>
        
        {/* Tick Box Tag */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all active:scale-95 cursor-pointer",
            isSelected 
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25" 
              : "bg-[#0f0d26] border border-indigo-400/30 text-indigo-300 hover:text-white hover:border-emerald-400"
          )}
        >
          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
          {isSelected ? "Correcting" : "Tick to Correct"}
        </button>
      </div>

      <div className="relative group">
        <input
          {...registration}
          {...props}
          disabled={!isSelected}
          className={cn(
            "w-full h-11 px-4 bg-[#0f0d26] border rounded-xl transition-all outline-none text-[14px] text-white uppercase placeholder:text-indigo-300/45 placeholder:uppercase [color-scheme:dark]",
            error
              ? "border-rose-500 focus:border-rose-500"
              : isSelected 
                ? "border-emerald-400 ring-2 ring-emerald-500/20 focus:ring-emerald-400/30" 
                : "border-indigo-400/25 opacity-70",
            !isSelected && "bg-[#0f0d26]/60 cursor-not-allowed"
          )}
        />
        {!isSelected && (
          <div className="absolute inset-0 cursor-not-allowed" onClick={onToggle} />
        )}
      </div>
      
      {error && (
        <p className="text-[11px] font-medium text-rose-400 mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
}

interface CorrectionSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: FieldError;
  options: { label: string; value: string }[];
  isSelected?: boolean;
  onToggle?: () => void;
  registration?: UseFormRegisterReturn;
}

export function CorrectionSelect({
  label,
  error,
  options,
  isSelected,
  onToggle,
  registration,
  className,
  ...props
}: CorrectionSelectProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between mb-1">
        <label className={cn(
          "text-xs font-bold transition-colors uppercase tracking-wide",
          isSelected ? "text-emerald-300" : "text-indigo-200"
        )}>
          {label} {props.required && <span className="text-rose-400">*</span>}
        </label>
        
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all active:scale-95 cursor-pointer",
            isSelected 
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25" 
              : "bg-[#0f0d26] border border-indigo-400/30 text-indigo-300 hover:text-white hover:border-emerald-400"
          )}
        >
          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
          {isSelected ? "Correcting" : "Tick to Correct"}
        </button>
      </div>

      <div className="relative group">
        <select
          {...registration}
          {...props}
          disabled={!isSelected}
          className={cn(
            "w-full h-11 px-4 pr-10 bg-[#0f0d26] border rounded-xl transition-all outline-none appearance-none text-[14px] text-white uppercase cursor-pointer",
            error
              ? "border-rose-500"
              : isSelected 
                ? "border-emerald-400 ring-2 ring-emerald-500/20" 
                : "border-indigo-400/25 opacity-70",
            !isSelected && "bg-[#0f0d26]/60 cursor-not-allowed"
          )}
        >
          <option value="" className="bg-[#13112c] text-white">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#13112c] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-300/70">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {!isSelected && (
          <div className="absolute inset-0 cursor-not-allowed" onClick={onToggle} />
        )}
      </div>
      
      {error && (
        <p className="text-[11px] font-medium text-rose-400 mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
}
