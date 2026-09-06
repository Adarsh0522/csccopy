import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET

    // Optional: Protect the webhook with a Bearer token matching a secret
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Supabase Custom SMS webhook payload usually provides `phone` and an `sms` object, or user.phone
    const phone = body?.user?.phone || body?.phone
    
    // The OTP is usually inside body.sms.otp or extracted from the message
    let otp = body?.sms?.otp || body?.otp
    
    // Fallback: If Supabase only sends the full text message, extract the 6 digit code
    if (!otp && body?.sms?.message) {
      const match = body.sms.message.match(/\b\d{6}\b/)
      if (match) {
        otp = match[0]
      }
    }

    if (!phone || !otp) {
      console.error('Invalid payload received:', body)
      return NextResponse.json({ error: 'Invalid payload - Missing phone or OTP' }, { status: 400 })
    }

    const accessToken = process.env.META_ACCESS_TOKEN
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'auth_otp_template'

    if (!accessToken || !phoneNumberId) {
      console.error('Missing Meta WhatsApp API credentials in .env.local')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Format phone number for WhatsApp (must not contain the '+' symbol, just the country code + number)
    const formattedPhone = phone.replace('+', '')

    // Meta API Request
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otp
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: otp
                }
              ]
            }
          ]
        }
      })
    })

    const data = await metaRes.json()

    if (!metaRes.ok) {
      console.error('WhatsApp API Error:', data)
      return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'OTP sent to WhatsApp successfully' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
