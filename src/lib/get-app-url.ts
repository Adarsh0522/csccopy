/**
 * Resolves the public base URL of the application.
 *
 * CRITICAL NOTE:
 * Never use `req.headers.get('origin')` or `req.headers.get('referer')`
 * to determine the application's base URL. When payment gateways (like PayU)
 * submit the callback form cross-origin, the `Origin` and `Referer` headers
 * contain the payment gateway's domain (e.g. `https://secure.payu.in`).
 * Using them causes the user to be redirected to the payment gateway's server,
 * which results in a 403 Forbidden error!
 */
export function getAppUrl(req?: Request): string {
  // 1. Primary: explicitly configured NEXT_PUBLIC_APP_URL
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '')
  }

  // 2. Check destination headers from reverse proxy (Hostinger, Cloudflare, Nginx)
  if (req) {
    const forwardedHost = req.headers.get('x-forwarded-host')?.trim()
    const forwardedProto = req.headers.get('x-forwarded-proto')?.trim() || 'https'
    if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
      const host = forwardedHost.split(',')[0].trim()
      // Never use payu or other gateway domains
      if (!host.includes('payu')) {
        return `${forwardedProto}://${host}`
      }
    }

    const host = req.headers.get('host')?.trim()
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      if (!host.includes('payu')) {
        const proto = host.includes('csccopy.online') ? 'https' : (req.headers.get('x-forwarded-proto') || 'https')
        return `${proto}://${host}`
      }
    }

    // Localhost detection during local development
    if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
      return `http://${host}`
    }
  }

  // 3. Fallback to envUrl if defined (e.g. localhost in local dev)
  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  // 4. Default to production domain
  return 'https://csccopy.online'
}
