import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { amount } = await req.json()

    if (!amount || amount < 10) {
      return NextResponse.json(
        { success: false, message: 'Minimum recharge amount is ₹10.' },
        { status: 400 }
      )
    }

    const key = process.env.PAYU_MERCHANT_KEY
    const salt = process.env.PAYU_MERCHANT_SALT
    const isProd = process.env.PAYU_ENV === 'prod' || process.env.PAYU_ENV === 'production'

    if (!key || !salt) {
      console.error('PayU credentials not found in environment variables')
      return NextResponse.json(
        { 
          success: false, 
          message: 'PayU credentials missing. Please set PAYU_MERCHANT_KEY and PAYU_MERCHANT_SALT in .env.local.' 
        },
        { status: 500 }
      )
    }

    // Get current authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Determine user details
    const userId = user?.id || 'temp-user'
    const email = user?.email || 'customer@csccopy.com'
    const phone = user?.phone?.replace(/\D/g, '').slice(-10) || '9999999999'
    
    // First name only, alphanumeric, no special characters or spaces
    const rawName = user?.user_metadata?.full_name?.split(' ')[0] || 'Customer'
    const firstname = rawName.replace(/[^a-zA-Z0-9]/g, '') || 'Customer'

    const txnid = `tx_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`
    const formattedAmount = Number(amount).toFixed(2)
    // Product info without spaces
    const productinfo = 'WalletTopup'

    // Determine host origin for callbacks
    const headerOrigin = req.headers.get('origin') || req.headers.get('host')
    let origin = process.env.NEXT_PUBLIC_APP_URL || (headerOrigin ? (headerOrigin.startsWith('http') ? headerOrigin : `http://${headerOrigin}`) : 'http://localhost:3000')

    const surl = `${origin}/api/payu/callback`
    const furl = `${origin}/api/payu/callback`

    // udf1 stores userId so callback can identify who to credit
    const udf1 = userId

    // PayU SHA-512 Hash format:
    // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|SALT)
    // Exactly 16 pipes (|) separating 17 values
    const hashElements = [
      key,
      txnid,
      formattedAmount,
      productinfo,
      firstname,
      email,
      udf1,
      '', // udf2
      '', // udf3
      '', // udf4
      '', // udf5
      '', // udf6
      '', // udf7
      '', // udf8
      '', // udf9
      '', // udf10
      salt
    ]

    const hashString = hashElements.join('|')
    const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase()

    console.log('PayU Hash String:', hashString)
    console.log('Generated PayU Hash:', hash)

    const actionUrl = isProd
      ? 'https://secure.payu.in/_payment'
      : 'https://test.payu.in/_payment'

    return NextResponse.json({
      success: true,
      actionUrl,
      params: {
        key,
        txnid,
        amount: formattedAmount,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        hash,
        udf1,
      },
    })
  } catch (error: any) {
    console.error('PayU Initiate Error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to initiate PayU payment' },
      { status: 500 }
    )
  }
}
