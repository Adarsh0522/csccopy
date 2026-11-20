import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { userId, phone, fullName, businessName, email } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const payload: Record<string, any> = {
      id: userId,
      updated_at: new Date().toISOString()
    }
    if (phone) payload.phone = phone.trim()
    if (fullName) payload.full_name = fullName.trim()
    if (businessName) payload.business_name = businessName.trim()
    if (email) payload.email = email.trim()

    let { error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' })

    // If phone or business_name columns are pending migration, retry without them
    if (error && error.message?.includes('phone')) {
      delete payload.phone
      const retry = await supabase.from('users').upsert(payload, { onConflict: 'id' })
      error = retry.error
    }
    if (error && error.message?.includes('business_name')) {
      delete payload.business_name
      const retry = await supabase.from('users').upsert(payload, { onConflict: 'id' })
      error = retry.error
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
