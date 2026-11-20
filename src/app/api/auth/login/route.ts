import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: 'Mobile number and password are required' }, { status: 400 })
    }

    const clean = phone.replace(/\D/g, '')
    const formattedPhone = clean.length === 10 ? `+91${clean}` : (clean.startsWith('91') ? `+${clean}` : `+91${clean}`)
    const tenDigit = clean.slice(-10)

    const supabase = await createClient()

    // Query user in public.users
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, phone, full_name, password_hash')
      .or(`phone.eq.${formattedPhone},phone.eq.${clean},phone.eq.${tenDigit}`)
      .maybeSingle()

    if (dbError && dbError.code !== 'PGRST116') {
      console.warn('public.users error in login route:', dbError.message)
    }

    // Case 1: User found in public.users
    if (user) {
      // Legacy user who hasn't set a password yet
      if (!user.password_hash || user.password_hash.trim().length === 0) {
        return NextResponse.json({
          requiresPasswordSetup: true,
          phone: formattedPhone,
          message: 'Existing user detected. Please verify with WhatsApp OTP to set your password.'
        })
      }

      // Password exists: verify with bcrypt
      const isValid = await bcrypt.compare(password, user.password_hash)
      if (!isValid) {
        return NextResponse.json({
          error: 'Invalid password. Please check your password or use "Forgot / Set Password?".'
        }, { status: 400 })
      }

      // Password matches!
      return NextResponse.json({
        success: true,
        phone: formattedPhone,
        user: {
          id: user.id,
          full_name: user.full_name || 'CSC Operator'
        }
      })
    }

    // Case 2: User not found in public.users table yet
    // They may be a legacy user in auth.users whose public.users record is pending migration.
    return NextResponse.json({
      requiresPasswordSetup: true,
      phone: formattedPhone,
      isLegacyCheck: true,
      message: 'Existing user check required.'
    })
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
