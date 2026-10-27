import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const status = formData.get('status')?.toString() || ''
    const txnid = formData.get('txnid')?.toString() || ''
    const amount = formData.get('amount')?.toString() || ''
    const productinfo = formData.get('productinfo')?.toString() || ''
    const firstname = formData.get('firstname')?.toString() || ''
    const email = formData.get('email')?.toString() || ''
    const mihpayid = formData.get('mihpayid')?.toString() || ''
    const hash = formData.get('hash')?.toString() || ''
    const key = formData.get('key')?.toString() || ''
    const udf1 = formData.get('udf1')?.toString() || '' // user_id
    const additionalCharges = formData.get('additionalCharges')?.toString() || ''
    const errorMessage = formData.get('error_Message')?.toString() || formData.get('field9')?.toString() || 'Payment failed or cancelled'

    const salt = process.env.PAYU_MERCHANT_SALT

    if (!salt) {
      console.error('PAYU_MERCHANT_SALT is missing in environment variables')
      return NextResponse.redirect(
        new URL('/dashboard/wallet/add-balance?payment=failed&reason=Gateway_configuration_missing', req.url),
        303
      )
    }

    // PayU reverse SHA-512 response hash calculation:
    // With additionalCharges:
    // sha512(additionalCharges|salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    // Without additionalCharges:
    // sha512(salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const hashElements = [
      ...(additionalCharges ? [additionalCharges] : []),
      salt,
      status,
      formData.get('udf10')?.toString() || '',
      formData.get('udf9')?.toString() || '',
      formData.get('udf8')?.toString() || '',
      formData.get('udf7')?.toString() || '',
      formData.get('udf6')?.toString() || '',
      formData.get('udf5')?.toString() || '',
      formData.get('udf4')?.toString() || '',
      formData.get('udf3')?.toString() || '',
      formData.get('udf2')?.toString() || '',
      udf1,
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      key
    ]

    const hashSequence = hashElements.join('|')
    const calculatedHash = crypto.createHash('sha512').update(hashSequence).digest('hex').toLowerCase()

    if (calculatedHash !== hash.toLowerCase()) {
      console.error('PayU Callback Hash Mismatch:', {
        received: hash.toLowerCase(),
        calculated: calculatedHash,
        hashSequence
      })
      return NextResponse.redirect(
        new URL('/dashboard/wallet/add-balance?payment=failed&reason=Invalid_payment_hash_verification', req.url),
        303
      )
    }

    if (status === 'success') {
      // Credit wallet via Supabase RPC function
      const supabase = await createClient()

      if (udf1 && udf1 !== 'temp-user') {
        const { error: rpcError } = await supabase.rpc('add_wallet_balance', {
          p_user_id: udf1,
          p_amount: parseFloat(amount),
          p_payment_id: mihpayid || txnid
        })

        if (rpcError) {
          console.error('Error crediting wallet balance:', rpcError)
          return NextResponse.redirect(
            new URL(`/dashboard/wallet?payment=success&txnid=${txnid}&amount=${amount}&notice=manual_credit_check`, req.url),
            303
          )
        }
      }

      // Success redirect
      return NextResponse.redirect(
        new URL(`/dashboard/wallet?payment=success&txnid=${txnid}&amount=${amount}`, req.url),
        303
      )
    } else {
      // Payment failed / cancelled
      return NextResponse.redirect(
        new URL(`/dashboard/wallet/add-balance?payment=failed&reason=${encodeURIComponent(errorMessage)}`, req.url),
        303
      )
    }
  } catch (error: any) {
    console.error('PayU Callback Exception:', error)
    return NextResponse.redirect(
      new URL('/dashboard/wallet/add-balance?payment=failed&reason=Internal_server_error', req.url),
      303
    )
  }
}

export async function GET(req: Request) {
  return NextResponse.redirect(new URL('/dashboard/wallet', req.url), 303)
}
