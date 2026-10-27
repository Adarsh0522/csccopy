import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // 1. Get the payload from Supabase Auth Hook
    const body = await req.json()
    
    // Supabase passes phone as +91XXXX, Meta expects digits without '+'
    const rawPhone = body?.user?.phone || ''
    const phone = rawPhone.replace(/\D/g, '')
    const otp = body?.sms?.otp

    if (!phone || !otp) {
      throw new Error("Missing phone or OTP in hook payload")
    }
    
    // 2. Fetch Credentials from Supabase Edge Function Secrets (supporting both name conventions)
    const META_TOKEN = Deno.env.get('META_ACCESS_TOKEN') || Deno.env.get('META_API_TOKEN')
    const PHONE_ID = Deno.env.get('META_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_ID')
    const TEMPLATE_NAME = Deno.env.get('WHATSAPP_TEMPLATE_NAME') || 'auth_otp_template'

    if (!META_TOKEN || !PHONE_ID) {
      throw new Error("Missing Meta Credentials (META_ACCESS_TOKEN / META_PHONE_NUMBER_ID) in Edge Function Secrets")
    }

    // 3. Call Meta's Official WhatsApp API
    // Note: auth_otp_template requires 2 body params (App Name & OTP) and 1 URL button param (OTP)
    const response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: TEMPLATE_NAME,
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: 'CSCCopy' },
                { type: 'text', text: otp }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                { type: 'text', text: otp }
              ]
            }
          ]
        }
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error("Meta API Error:", JSON.stringify(result))
      const metaMsg = result?.error?.error_data?.details || result?.error?.message || "Failed to send WhatsApp message"
      throw new Error(metaMsg)
    }
    
    // Supabase Auth Hook expects {} with 200 status on success
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })

  } catch (error: any) {
    console.error("Edge Function Error:", error.message)
    // Supabase Auth Hook requires { error: { http_code: 400, message: "..." } } structure
    return new Response(
      JSON.stringify({
        error: {
          http_code: 400,
          message: error.message || "Failed to send OTP via WhatsApp"
        }
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
