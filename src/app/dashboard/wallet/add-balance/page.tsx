'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wallet, ShieldCheck, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'

export default function AddBalancePage() {
  const [amount, setAmount] = useState<number | ''>(500)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const presetAmounts = [100, 200, 500, 1000, 2000]

  const handleAmountSelect = (val: number) => {
    setAmount(val)
  }

  const handlePayment = async () => {
    if (!amount || amount < 10) {
      setErrorMessage('Minimum recharge amount is ₹10.')
      setStatus('error')
      return
    }

    try {
      setIsProcessing(true)
      setStatus('idle')

      // 1. Create order on the server
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to create order')
      }

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use test key
        amount: data.amount, // in paise
        currency: data.currency,
        name: 'CSCCopy Wallet',
        description: 'Wallet Top-up',
        order_id: data.orderId,
        theme: {
          color: '#2563eb', // emerald-600
        },
        handler: async function (response: any) {
          try {
            setIsProcessing(true)
            // 3. Verify Payment on the server
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: amount,
              }),
            })

            const verifyData = await verifyRes.json()

            if (verifyData.success) {
              setStatus('success')
              setAmount('')
              // Refresh to update wallet balance in Navbar
              setTimeout(() => {
                router.refresh()
              }, 2000)
            } else {
              throw new Error(verifyData.message || 'Payment verification failed')
            }
          } catch (err: any) {
            console.error(err)
            setStatus('error')
            setErrorMessage(err.message || 'Failed to verify payment')
          } finally {
            setIsProcessing(false)
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@csccopy.com',
          contact: '9999999999',
        },
      }

      const rzp = new (window as any).Razorpay(options)
      
      rzp.on('payment.failed', function (response: any) {
        setStatus('error')
        setErrorMessage(response.error.description || 'Payment failed')
        setIsProcessing(false)
      })

      rzp.open()
    } catch (err: any) {
      console.error(err)
      setStatus('error')
      setErrorMessage(err.message || 'An error occurred during payment initialization')
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-100 p-6 lg:p-8 flex items-center justify-center">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Add Balance</h1>
          <p className="text-gray-500 font-medium">Recharge your wallet to use premium CSCCopy services.</p>
        </div>

        <Card className="border-gray-200 shadow-lg bg-white ring-1 ring-gray-900/5">
          <CardHeader className="border-b border-gray-100 pb-6">
            <CardTitle className="text-lg">Select Amount</CardTitle>
            <CardDescription>Choose a preset amount or enter a custom value</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            
            {status === 'success' && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="font-semibold">Payment Successful!</h4>
                  <p className="text-sm opacity-90">Your wallet has been credited.</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h4 className="font-semibold">Payment Failed</h4>
                  <p className="text-sm opacity-90">{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === preset ? 'default' : 'outline'}
                  className={`h-14 text-lg font-bold ${
                    amount === preset 
                      ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-600 ring-offset-2' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleAmountSelect(preset)}
                >
                  ₹{preset}
                </Button>
              ))}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Custom Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                <Input
                  type="number"
                  min="10"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || '')}
                  className="pl-9 h-14 text-lg font-bold border-gray-200 bg-gray-50 focus-visible:ring-emerald-500"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600 leading-relaxed">
                <strong>100% Secure Payment.</strong> Processed securely via Razorpay in Test Mode. No real money is deducted.
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all"
              onClick={handlePayment}
              disabled={isProcessing || !amount || amount < 10}
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceed to Pay ₹{amount || 0}
                </>
              )}
            </Button>
            
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
