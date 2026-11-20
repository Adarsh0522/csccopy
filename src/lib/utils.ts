import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isImageSource(str?: string | null): boolean {
  if (!str) return false
  const s = str.trim()
  return (
    s.startsWith('data:image/') ||
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('/') ||
    s.startsWith('blob:') ||
    /\.(png|jpg|jpeg|svg|webp|gif|ico)(\?.*)?$/i.test(s)
  )
}
