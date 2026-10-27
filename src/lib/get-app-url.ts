/**
 * Resolves the public base URL of the application.
 * Ensures redirects and webhook callbacks never point to internal localhost
 * in production or when accessed via a public domain like csccopy.online.
 */
export function getAppUrl(req?: Request): string {
  // 1. If incoming request has headers, check them first
  if (req) {
    // Check Origin header (always sent by browsers on fetch/POST)
    const origin = req.headers.get('origin')?.trim()
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin.replace(/\/$/, '')
    }

    // Check standard reverse proxy headers (Hostinger / Nginx / Cloudflare)
    const forwardedHost = req.headers.get('x-forwarded-host')?.trim()
    const forwardedProto = req.headers.get('x-forwarded-proto')?.trim() || 'https'
    if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
      const host = forwardedHost.split(',')[0].trim()
      return `${forwardedProto}://${host}`
    }

    // Check Referer header
    const referer = req.headers.get('referer')?.trim()
    if (referer) {
      try {
        const refUrl = new URL(referer)
        if (!refUrl.hostname.includes('localhost') && !refUrl.hostname.includes('127.0.0.1')) {
          return `${refUrl.protocol}//${refUrl.host}`
        }
      } catch {}
    }

    // Check Host header
    const host = req.headers.get('host')?.trim()
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const proto = host.includes('csccopy.online') ? 'https' : (req.headers.get('x-forwarded-proto') || 'https')
      return `${proto}://${host}`
    }
  }

  // 2. Check NEXT_PUBLIC_APP_URL environment variable
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '')
  }

  // 3. Fallback for local development when headers are localhost
  if (req) {
    const origin = req.headers.get('origin')?.trim()
    if (origin) return origin.replace(/\/$/, '')

    const host = req.headers.get('host')?.trim()
    if (host) return `http://${host}`
  }

  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  // 4. Default to production domain
  return 'https://csccopy.online'
}
