import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      amount
    } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return NextResponse.json(
        { success: false, message: 'Missing payment verification details' },
        { status: 400 }
      )
    }

    const secret = process.env.RAZORPAY_KEY_SECRET

    if (!secret) {
      return NextResponse.json(
        { success: false, message: 'Payment gateway configuration missing' },
        { status: 500 }
      )
    }

    // Verify signature securely
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // If signature is valid, credit the wallet
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
       // Since users might be using the temp auth bypass (localStorage.temp_user = 'true')
       // We can't rely strictly on supabase user for temp testing if auth is bypassed.
       // However, this is a secure route. If we want to allow testing without auth, 
       // we should handle it. For now, assuming authenticated users.
       return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Call the secure RPC function
    const { data, error } = await supabase.rpc('add_wallet_balance', {
      p_user_id: user.id,
      p_amount: amount,
      p_payment_id: razorpay_payment_id
    })

    if (error) {
      console.error('Add wallet balance error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to credit wallet' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet credited successfully',
      data
    })
  } catch (error) {
    console.error('Verify Razorpay Payment Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
