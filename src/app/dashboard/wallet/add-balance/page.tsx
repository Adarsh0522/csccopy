'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wallet, ShieldCheck, CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

function AddBalanceContent() {
  const [amount, setAmount] = useState<number | ''>(500)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const presetAmounts = [100, 200, 500, 1000, 2000]

  useEffect(() => {
    const payment = searchParams.get('payment')
    const reason = searchParams.get('reason')

    if (payment === 'failed') {
      setStatus('error')
      setErrorMessage(reason ? decodeURIComponent(reason).replace(/_/g, ' ') : 'Payment failed or cancelled. Please try again.')
    }
  }, [searchParams])

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

      // 1. Request PayU payment parameters and hash from server
      const res = await fetch('/api/payu/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to initiate PayU payment')
      }

      // 2. Submit form to PayU Payment Gateway
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.actionUrl

      Object.entries(data.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        }
      })

      document.body.appendChild(form)
      form.submit()
    } catch (err: any) {
      console.error(err)
      setStatus('error')
      setErrorMessage(err.message || 'An error occurred during payment initialization')
      setIsProcessing(false)
    }
  }

  return (
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
                    ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-600 ring-offset-2 text-white' 
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
              <strong>100% Secure Payment.</strong> Processed securely via PayU Payment Gateway. Supports UPI, Net Banking, Debit and Credit Cards.
            </div>
          </div>

          <Button 
            className="w-full h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handlePayment}
            disabled={isProcessing || !amount || amount < 10}
          >
            {isProcessing ? (
              <span className="flex items-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Redirecting to PayU...
              </span>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Proceed to Pay ₹{amount || 0} via PayU
              </>
            )}
          </Button>
          
        </CardContent>
      </Card>
    </div>
  )
}

export default function AddBalancePage() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-100 p-6 lg:p-8 flex items-center justify-center">
      <Suspense fallback={<div className="text-gray-500 font-medium">Loading...</div>}>
        <AddBalanceContent />
      </Suspense>
    </div>
  )
}
