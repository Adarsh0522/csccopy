import { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

interface SharedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  helperText?: string;
}

export function SharedInput({
  label,
  error,
  helperText,
  className,
  placeholder,
  ...props
}: SharedInputProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-bold text-indigo-200 block uppercase tracking-wide">
        {label} {props.required && <span className="text-rose-400">*</span>}
      </label>
      <input
        className={cn(
          "w-full h-11 px-4 bg-[#0f0d26] border rounded-xl transition-all outline-none text-[14px] text-white uppercase placeholder:text-indigo-300/45 placeholder:uppercase [color-scheme:dark]",
          error
            ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            : "border-indigo-400/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20",
          props.disabled && "bg-[#13112c]/60 cursor-not-allowed text-indigo-300/40 border-indigo-500/20"
        )}
        placeholder={placeholder?.toUpperCase()}
        {...props}
      />
      {error && (
        <p className="text-[11px] font-medium text-rose-400 mt-1 flex items-center gap-1">
          {error.message}
        </p>
      )}
    </div>
  );
}

interface SharedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: FieldError;
  options: { label: string; value: string }[];
}

export function SharedSelect({
  label,
  error,
  options,
  className,
  ...props
}: SharedSelectProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-bold text-indigo-200 block uppercase tracking-wide">
        {label} {props.required && <span className="text-rose-400">*</span>}
      </label>
      <div className="relative group">
        <select
          className={cn(
            "w-full h-11 px-4 pr-10 bg-[#0f0d26] border rounded-xl transition-all outline-none appearance-none text-[14px] text-white uppercase cursor-pointer",
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "border-indigo-400/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20",
            props.disabled && "bg-[#13112c]/60 cursor-not-allowed text-indigo-300/40 border-indigo-500/20"
          )}
          {...props}
        >
          <option value="" className="bg-[#13112c] text-white">SELECT {label.toUpperCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#13112c] text-white">
              {opt.label.toUpperCase()}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-300/70">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-[11px] font-medium text-rose-400 mt-1 flex items-center gap-1">
          {error.message}
        </p>
      )}
    </div>
  );
}
