'use server'

import { createClient } from '@/lib/supabase/server'

export async function deductWalletBalance(amount: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'Unauthorized' }
  }

  // Call the secure RPC function we defined in Supabase SQL
  const { data, error } = await supabase.rpc('deduct_wallet_balance', {
    p_user_id: user.id,
    p_amount: amount,
  })

  if (error) {
    console.error('Wallet deduction error:', error)
    return { success: false, message: 'Failed to process deduction' }
  }

  return data
}

export async function getWalletBalance() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('wallet')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return 0.00
  }

  return data.balance
}
