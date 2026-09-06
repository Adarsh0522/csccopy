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
      <label className="text-[12px] font-medium text-gray-600 block uppercase tracking-wide">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        className={cn(
          "w-full h-11 px-4 bg-white border rounded-lg transition-all outline-none text-[14px] uppercase placeholder:text-gray-400 placeholder:uppercase",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            : "border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
          props.disabled && "bg-gray-50 cursor-not-allowed text-gray-400 border-gray-200"
        )}
        placeholder={placeholder?.toUpperCase()}
        {...props}
      />
      {error && (
        <p className="text-[11px] font-medium text-red-500 mt-1 flex items-center gap-1">
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
      <label className="text-[12px] font-medium text-gray-600 block uppercase tracking-wide">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        <select
          className={cn(
            "w-full h-11 px-4 pr-10 bg-white border rounded-lg transition-all outline-none appearance-none text-[14px] uppercase",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
            props.disabled && "bg-gray-50 cursor-not-allowed text-gray-400 border-gray-200"
          )}
          {...props}
        >
          <option value="">SELECT {label.toUpperCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label.toUpperCase()}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-[11px] font-medium text-red-500 mt-1 flex items-center gap-1">
          {error.message}
        </p>
      )}
    </div>
  );
}


