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
          "text-[12px] font-bold transition-colors uppercase tracking-wide",
          isSelected ? "text-emerald-700" : "text-gray-500"
        )}>
          {label} {props.required && <span className="text-red-500">*</span>}
        </label>
        
        {/* Tick Box Tag */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all active:scale-95",
            isSelected 
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" 
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          )}
        >
          {isSelected && <Check className="w-3 h-3" />}
          {isSelected ? "Correcting" : "Tick to Correct"}
        </button>
      </div>

      <div className="relative group">
        <input
          {...registration}
          {...props}
          disabled={!isSelected}
          className={cn(
            "w-full h-11 px-4 bg-white border rounded-lg transition-all outline-none text-[14px] uppercase placeholder:text-gray-400 placeholder:uppercase",
            error
              ? "border-red-500 focus:border-red-500"
              : isSelected 
                ? "border-emerald-500 ring-2 ring-emerald-500/10 focus:ring-emerald-500/20" 
                : "border-gray-200 opacity-60 grayscale-[0.5]",
            !isSelected && "bg-gray-50/50 cursor-not-allowed"
          )}
        />
        {!isSelected && (
          <div className="absolute inset-0 cursor-not-allowed" onClick={onToggle} />
        )}
      </div>
      
      {error && (
        <p className="text-[11px] font-medium text-red-500 mt-1">
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
          "text-[12px] font-bold transition-colors uppercase tracking-wide",
          isSelected ? "text-emerald-700" : "text-gray-500"
        )}>
          {label} {props.required && <span className="text-red-500">*</span>}
        </label>
        
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
            isSelected ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"
          )}
        >
          {isSelected && <Check className="w-3 h-3" />}
          {isSelected ? "Correcting" : "Tick to Correct"}
        </button>
      </div>

      <div className="relative group">
        <select
          {...registration}
          {...props}
          disabled={!isSelected}
          className={cn(
            "w-full h-11 px-4 pr-10 bg-white border rounded-lg transition-all outline-none appearance-none text-[14px] uppercase",
            error
              ? "border-red-500"
              : isSelected 
                ? "border-emerald-500 ring-2 ring-emerald-500/10" 
                : "border-gray-200 opacity-60",
            !isSelected && "bg-gray-50/50 cursor-not-allowed"
          )}
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {!isSelected && (
          <div className="absolute inset-0 cursor-not-allowed" onClick={onToggle} />
        )}
      </div>
      
      {error && (
        <p className="text-[11px] font-medium text-red-500 mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
}
