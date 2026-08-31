'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, History } from 'lucide-react'
import Link from 'next/link'

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const isTempUser = typeof window !== 'undefined' && localStorage.getItem('temp_user') === 'true'
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user && !isTempUser) {
        setLoading(false)
        return
      }

      if (isTempUser) {
        setBalance(150.00)
        setTransactions([
          { id: '1', type: 'credit', amount: 500, description: 'Razorpay Wallet Top-up', created_at: new Date().toISOString(), status: 'success' },
          { id: '2', type: 'debit', amount: 10, description: 'PVC Print - Aadhaar', created_at: new Date(Date.now() - 86400000).toISOString(), status: 'success' },
        ])
        setLoading(false)
        return
      }

      if (user) {
        // Fetch balance
        const { data: walletData } = await supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .single()
        
        if (walletData) {
          setBalance(walletData.balance)
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
      }
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-100 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Wallet</h1>
            <p className="text-slate-500 font-medium">Manage your funds and view transaction history.</p>
          </div>
          <Link href="/dashboard/wallet/add-balance">
            <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm text-base font-bold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Balance
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-1 border-slate-200 shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white ring-1 ring-slate-900/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
              <WalletIcon className="w-48 h-48" />
            </div>
            <CardHeader>
              <CardTitle className="text-slate-200 text-base font-medium flex items-center gap-2">
                <WalletIcon className="w-5 h-5" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-12 flex items-center">
                  <div className="w-24 h-8 bg-slate-700 animate-pulse rounded-md"></div>
                </div>
              ) : (
                <div className="text-4xl font-black tracking-tight">
                  ₹{balance.toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2 border-slate-200 shadow-sm bg-white ring-1 ring-slate-900/5">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-slate-800">
                <History className="w-5 h-5 text-slate-500" />
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <WalletIcon className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="font-medium">No transactions found</p>
                  <p className="text-sm">Your recent wallet activity will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full shrink-0 ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{tx.description || (tx.type === 'credit' ? 'Wallet Top-up' : 'Service Deduction')}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                      <div className={`font-extrabold text-right ${tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  )
}
