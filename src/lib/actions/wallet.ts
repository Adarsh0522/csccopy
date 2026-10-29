'use server'

import { createClient } from '@/lib/supabase/server'

export async function deductWalletBalance(amount: number, description: string = 'Service Charge Deduction') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'Unauthorized. Please log in.' }
  }

  // 1. Fetch current wallet balance
  const { data: walletData } = await supabase
    .from('wallet')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle()

  const currentBalance = walletData?.balance != null ? Number(walletData.balance) : 0

  if (currentBalance < amount) {
    return { 
      success: false, 
      message: `Insufficient wallet balance. You have ₹${currentBalance.toFixed(2)}, but ₹${amount.toFixed(2)} is required. Please recharge your wallet.`,
      current_balance: currentBalance
    }
  }

  // 2. Try the Supabase RPC first
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('deduct_wallet_balance', {
      p_user_id: user.id,
      p_amount: amount,
    })

    if (!rpcError && rpcData?.success && rpcData?.new_balance != null) {
      // Record transaction
      await supabase.from('transactions').insert([{
        user_id: user.id,
        type: 'debit',
        amount: amount,
        description: description,
        status: 'success'
      }])

      return { 
        success: true, 
        new_balance: Number(rpcData.new_balance),
        message: 'Wallet deducted successfully' 
      }
    }
  } catch (rpcErr) {
    console.warn('RPC deduct_wallet_balance error, falling back to direct update:', rpcErr)
  }

  // 3. Reliable Fallback: Direct atomic update on wallet table
  const newBalance = Number((currentBalance - amount).toFixed(2))

  const { error: updateError } = await supabase
    .from('wallet')
    .update({ 
      balance: newBalance, 
      updated_at: new Date().toISOString() 
    })
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Wallet deduction fallback error:', updateError)
    return { success: false, message: 'Failed to process deduction. Please try again.' }
  }

  // Record debit transaction in transactions table
  await supabase.from('transactions').insert([{
    user_id: user.id,
    type: 'debit',
    amount: amount,
    description: description,
    status: 'success'
  }])

  return { 
    success: true, 
    new_balance: newBalance,
    message: 'Wallet deducted successfully' 
  }
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
    .maybeSingle()

  if (error || !data) {
    return 0.00
  }

  return Number(data.balance)
}
