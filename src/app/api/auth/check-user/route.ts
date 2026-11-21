import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 })
    }

    const clean = phone.replace(/\D/g, '')
    const formattedPhone = clean.length === 10 ? `+91${clean}` : (clean.startsWith('91') ? `+${clean}` : `+91${clean}`)
    const tenDigit = clean.slice(-10)

    const supabase = await createClient()

    // 1. Try RPC check_user_auth (checks auth.users & public.users via SECURITY DEFINER)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('check_user_auth', {
        p_phone: formattedPhone
      })
      if (!rpcError && rpcData && typeof rpcData === 'object' && rpcData.exists !== undefined) {
        return NextResponse.json({
          exists: Boolean(rpcData.exists),
          hasPassword: Boolean(rpcData.has_password),
          requiresPasswordSetup: Boolean(rpcData.exists && !rpcData.has_password),
          phone: formattedPhone,
          fullName: rpcData.full_name || 'CSC Operator'
        })
      }
    } catch (rpcErr) {
      // RPC not yet deployed, fallback to public.users
    }

    // 2. Fallback check in public.users
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone, full_name, password_hash')
      .or(`phone.eq.${formattedPhone},phone.eq.${clean},phone.eq.${tenDigit}`)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('public.users query warning:', error.message)
    }

    if (user) {
      const hasPassword = Boolean(user.password_hash && user.password_hash.trim().length > 0)
      return NextResponse.json({
        exists: true,
        hasPassword,
        requiresPasswordSetup: !hasPassword,
        phone: formattedPhone,
        fullName: user.full_name || 'CSC Operator'
      })
    }

    // Default response if not found in public tables
    return NextResponse.json({
      exists: false,
      hasPassword: false,
      requiresPasswordSetup: false,
      phone: formattedPhone
    })
  } catch (err: any) {
    console.error('check-user error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
