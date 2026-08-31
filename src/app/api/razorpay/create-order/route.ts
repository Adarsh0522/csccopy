import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function POST(req: Request) {
  try {
    const { amount } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys not found in environment variables')
      return NextResponse.json(
        { success: false, message: 'Payment gateway configuration missing' },
        { status: 500 }
      )
    }

    // Initialize Razorpay instance inside handler to ensure env variables are loaded
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    // Razorpay amount is in currency subunits (paise for INR)
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error) {
    console.error('Create Razorpay Order Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
