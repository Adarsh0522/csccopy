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

    // 1. Try RPC save_user_password (SECURITY DEFINER bypasses RLS safely)
    try {
      await supabase.rpc('save_user_password', {
        p_user_id: userId,
        p_phone: formattedPhone,
        p_full_name: fullName?.trim() || 'CSC Operator',
        p_password_hash: password_hash
      })
    } catch (rpcErr) {
      console.warn('RPC save_user_password not available yet:', rpcErr)
    }

    // 2. Upsert user in public.users on PRIMARY KEY 'id' (id is always unique)
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
      .upsert(userPayload, { onConflict: 'id' })

    // If upsert failed due to missing columns or constraints, try basic update
    if (userError) {
      console.warn('Upsert on id warning, attempting update:', userError.message)
      const cleanPayload = {
        password_hash: password_hash,
        phone: formattedPhone,
        full_name: fullName?.trim() || 'CSC Operator',
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(cleanPayload)
        .or(`id.eq.${userId},phone.eq.${formattedPhone},phone.eq.${clean}`)

      if (updateError) {
        console.warn('Update fallback warning, trying insert:', updateError.message)
        await supabase.from('users').insert({
          id: userId,
          phone: formattedPhone,
          full_name: fullName?.trim() || 'CSC Operator',
          password_hash: password_hash
        })
      }
    }

    // 3. Ensure wallet exists
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
