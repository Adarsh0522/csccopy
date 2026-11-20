import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { userId, phone, fullName, password, businessName, email } = await req.json()

    if (!userId || !phone || !password) {
      return NextResponse.json({ error: 'User ID, phone, and password are required' }, { status: 400 })
    }

    const clean = phone.replace(/\D/g, '')
    const formattedPhone = clean.length === 10 ? `+91${clean}` : (clean.startsWith('91') ? `+${clean}` : `+91${clean}`)

    // Hash password with bcrypt
    const password_hash = await bcrypt.hash(password, 10)

    const supabase = await createClient()

    // 1. Upsert user in public.users
    const userPayload: Record<string, any> = {
      id: userId,
      phone: formattedPhone,
      full_name: fullName?.trim() || 'CSC Operator',
      password_hash: password_hash,
      updated_at: new Date().toISOString()
    }
    if (businessName) userPayload.business_name = businessName.trim()
    if (email) userPayload.email = email.trim()

    let { error: userError } = await supabase
      .from('users')
      .upsert(userPayload, { onConflict: 'phone' })

    // Fallback: if remote Supabase schema doesn't have business_name or email yet
    if (userError && userError.message?.includes('business_name')) {
      delete userPayload.business_name
      const retry = await supabase.from('users').upsert(userPayload, { onConflict: 'phone' })
      userError = retry.error
    }
    if (userError && userError.message?.includes('email')) {
      delete userPayload.email
      const retry = await supabase.from('users').upsert(userPayload, { onConflict: 'phone' })
      userError = retry.error
    }

    if (userError) {
      console.error('Error saving user to public.users:', userError)
      // Do not block login completely if table is pending migration, but report
    }

    // 2. Ensure wallet exists
    try {
      const { data: existingWallet } = await supabase
        .from('wallet')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!existingWallet) {
        await supabase.from('wallet').insert({
          user_id: userId,
          balance: 0,
          currency: 'INR'
        })
      }
    } catch (wErr) {
      console.warn('Wallet check warning:', wErr)
    }

    return NextResponse.json({ success: true, message: 'User password and profile saved successfully' })
  } catch (err: any) {
    console.error('save-user error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
