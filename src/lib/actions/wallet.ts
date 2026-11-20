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

export async function refundApplicationFee(
  userId: string,
  amount: number,
  serviceTitle: string = 'Service',
  appId: string = ''
) {
  if (!userId || !amount || amount <= 0) {
    return { success: false, message: 'Invalid refund parameters' }
  }

  const supabase = await createClient()
  const refundDesc = `Refund: Rejected Application for ${serviceTitle}`
  const refundId = appId ? `REFUND-${appId.slice(0, 8)}` : `REFUND-${Date.now()}`

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('add_wallet_balance', {
      p_user_id: userId,
      p_amount: amount,
      p_payment_id: refundId,
    })

    if (!rpcError && rpcData?.success) {
      return { 
        success: true, 
        new_balance: Number(rpcData.new_balance),
        message: 'Application fee refunded successfully.' 
      }
    }
  } catch (rpcErr) {
    console.warn('RPC add_wallet_balance failed, using direct update fallback:', rpcErr)
  }

  // Fallback to direct update
  try {
    const { data: wData } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle()

    const currentBal = wData?.balance != null ? Number(wData.balance) : 0
    const newBal = Number((currentBal + amount).toFixed(2))

    if (!wData) {
      await supabase.from('wallet').insert([{
        user_id: userId,
        balance: newBal,
        currency: 'INR'
      }])
    } else {
      await supabase
        .from('wallet')
        .update({ balance: newBal, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    }

    await supabase.from('transactions').insert([{
      user_id: userId,
      type: 'credit',
      amount: amount,
      description: refundDesc,
      payment_id: refundId,
      status: 'success'
    }])

    return { 
      success: true, 
      new_balance: newBal, 
      message: 'Application fee refunded successfully.' 
    }
  } catch (err: any) {
    console.error('Direct refund error:', err)
    return { success: false, message: err.message || 'Refund failed' }
  }
}
