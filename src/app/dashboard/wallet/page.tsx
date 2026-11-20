'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { subscribeToWallet, emitWalletUpdate } from '@/lib/realtime'
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, History, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function WalletContent() {
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const searchParams = useSearchParams()

  const paymentSuccess = searchParams.get('payment') === 'success'
  const paymentAmount = searchParams.get('amount')
  const txnid = searchParams.get('txnid')

  useEffect(() => {
    async function fetchData() {
      const isTempUser = typeof window !== 'undefined' && localStorage.getItem('temp_user') === 'true'
      
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('temp_user')
        }
        // Fetch balance
        const { data: walletData } = await supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .single()
        
        if (walletData) {
          setBalance(walletData.balance)
          if (paymentSuccess) {
            emitWalletUpdate(walletData.balance)
          }
        }

        // Fetch transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (txData) {
          setTransactions(txData)
        }
        setLoading(false)
        return
      }

      if (isTempUser) {
        setBalance(paymentSuccess && paymentAmount ? 150 + Number(paymentAmount) : 150.00)
        setTransactions([
          ...(paymentSuccess && paymentAmount ? [{
            id: 'new_tx',
            type: 'credit',
            amount: Number(paymentAmount),
            description: 'PayU Wallet Top-up',
            created_at: new Date().toISOString(),
            status: 'success'
          }] : []),
          { id: '1', type: 'credit', amount: 500, description: 'PayU Wallet Top-up', created_at: new Date().toISOString(), status: 'success' },
          { id: '2', type: 'debit', amount: 10, description: 'PVC Print - Aadhaar', created_at: new Date(Date.now() - 86400000).toISOString(), status: 'success' },
        ])
        setLoading(false)
        return
      }
      setLoading(false)
    }

    fetchData()

    let unsub: (() => void) | null = null
    const setupSub = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        unsub = subscribeToWallet(user.id, (newBal) => {
          if (newBal != null) {
            setBalance(Number(newBal))
          }
          fetchData()
        })
      }
    }
    setupSub()

    return () => {
      if (unsub) unsub()
    }
  }, [supabase, paymentSuccess, paymentAmount])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="min-h-[calc(100vh-73px)] text-white p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {paymentSuccess && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-400/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg">Payment Successful via PayU!</h3>
                <p className="text-emerald-100 text-sm font-medium">
                  ₹{paymentAmount || ''} has been credited to your wallet. {txnid ? `(Txn ID: ${txnid})` : ''}
                </p>
              </div>
            </div>
            <Link href="/dashboard/wallet">
              <Button variant="outline" className="bg-white/10 hover:bg-white text-white hover:text-emerald-950 border-white/30 font-bold rounded-xl cursor-pointer">
                Dismiss
              </Button>
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">My Wallet</h1>
            <p className="text-indigo-200/80 font-medium">Manage your funds and view transaction history.</p>
          </div>
          <Link href="/dashboard/wallet/add-balance">
            <Button className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/25 rounded-xl text-base flex items-center gap-2 cursor-pointer transition-all">
              <Plus className="w-5 h-5" />
              Add Balance
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-1 border border-indigo-400/30 shadow-xl bg-gradient-to-br from-[#231f4d] to-[#171436] text-white rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-15">
              <WalletIcon className="w-48 h-48 text-indigo-300" />
            </div>
            <CardHeader>
              <CardTitle className="text-indigo-200 text-base font-semibold flex items-center gap-2">
                <WalletIcon className="w-5 h-5 text-emerald-400" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-12 flex items-center">
                  <div className="w-24 h-8 bg-indigo-900/50 animate-pulse rounded-md"></div>
                </div>
              ) : (
                <div className="text-4xl font-black tracking-tight text-emerald-300">
                  ₹{balance.toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2 border border-indigo-400/25 shadow-lg bg-[#1b183d]/90 text-white rounded-3xl">
            <CardHeader className="border-b border-indigo-500/20 pb-4">
              <div className="flex items-center gap-2 text-white">
                <History className="w-5 h-5 text-emerald-400" />
                <CardTitle className="text-lg font-bold">Recent Transactions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-indigo-300/60">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-indigo-300/60 flex flex-col items-center">
                  <WalletIcon className="w-12 h-12 text-indigo-400/40 mb-3" />
                  <p className="font-bold text-indigo-200">No transactions found</p>
                  <p className="text-sm text-indigo-300/60 mt-0.5">Your recent wallet activity will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-indigo-500/15">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-indigo-500/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-full shrink-0 ${tx.type === 'credit' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'}`}>
                          {tx.type === 'credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-white">{tx.description || (tx.type === 'credit' ? 'Wallet Top-up' : 'Service Deduction')}</p>
                          <p className="text-xs text-indigo-300/70 mt-0.5">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                      <div className={`font-extrabold text-base text-right ${tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help & Refund Policy Helper */}
          <div className="col-span-1 md:col-span-3 bg-[#13112c]/90 border border-indigo-400/25 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Payment issue or recharge delay?</span>
              <span>WhatsApp: <strong className="text-emerald-400">+91 8169431433</strong></span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/refund-policy" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">Refund Policy</Link>
              <Link href="/dashboard/help" className="text-indigo-200 hover:text-white font-semibold transition-colors">Help & Support</Link>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading wallet...</div>}>
      <WalletContent />
    </Suspense>
  )
}
