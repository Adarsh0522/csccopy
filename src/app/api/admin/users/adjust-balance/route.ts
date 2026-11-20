import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { userId, amount, type, description } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid positive amount' }, { status: 400 })
    }

    if (type !== 'credit' && type !== 'debit') {
      return NextResponse.json({ error: 'Type must be "credit" or "debit"' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Try calling Supabase SECURITY DEFINER RPC functions first (bypasses RLS)
    if (type === 'credit') {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('add_wallet_balance', {
          p_user_id: userId,
          p_amount: numAmount,
          p_payment_id: `admin_adj_${Date.now()}`
        })

        if (!rpcError && rpcData?.new_balance != null) {
          return NextResponse.json({
            success: true,
            newBalance: Number(rpcData.new_balance),
            message: `Successfully credited ₹${numAmount.toFixed(2)}. New balance is ₹${Number(rpcData.new_balance).toFixed(2)}.`
          })
        }
      } catch (rpcErr) {
        console.warn('RPC add_wallet_balance failed, attempting direct update:', rpcErr)
      }
    } else if (type === 'debit') {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('deduct_wallet_balance', {
          p_user_id: userId,
          p_amount: numAmount
        })

        if (!rpcError && rpcData?.new_balance != null) {
          return NextResponse.json({
            success: true,
            newBalance: Number(rpcData.new_balance),
            message: `Successfully debited ₹${numAmount.toFixed(2)}. New balance is ₹${Number(rpcData.new_balance).toFixed(2)}.`
          })
        }
      } catch (rpcErr) {
        console.warn('RPC deduct_wallet_balance failed, attempting direct update:', rpcErr)
      }
    }

    // 2. Fallback: Direct database update
    const { data: wallet } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle()

    const currentBalance = wallet?.balance != null ? Number(wallet.balance) : 0
    let newBalance = currentBalance

    if (type === 'credit') {
      newBalance = Number((currentBalance + numAmount).toFixed(2))
    } else {
      if (currentBalance < numAmount) {
        return NextResponse.json({
          error: `Cannot deduct ₹${numAmount.toFixed(2)}. Current user balance is ₹${currentBalance.toFixed(2)}.`
        }, { status: 400 })
      }
      newBalance = Number((currentBalance - numAmount).toFixed(2))
    }

    const { error: walletError } = await supabase
      .from('wallet')
      .upsert({
        user_id: userId,
        balance: newBalance,
        currency: 'INR',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (walletError) {
      console.error('Failed to update wallet:', walletError)
      if (walletError.code === '42501') {
        throw new Error('Database permission restricted (RLS). Please ensure add_wallet_balance RPC is created in Supabase SQL editor.')
      }
      throw new Error(walletError.message)
    }

    // 3. Record transaction
    const finalDesc = description?.trim() || (type === 'credit' ? 'Admin Cash/Offline Recharge' : 'Admin Balance Deduction')
    try {
      await supabase.from('transactions').insert([{
        user_id: userId,
        type: type,
        amount: numAmount,
        description: finalDesc,
        status: 'success',
        created_at: new Date().toISOString()
      }])
    } catch (tErr) {
      console.warn('Transaction record warning:', tErr)
    }

    return NextResponse.json({
      success: true,
      newBalance,
      message: `Successfully ${type === 'credit' ? 'credited' : 'debited'} ₹${numAmount.toFixed(2)}. New balance is ₹${newBalance.toFixed(2)}.`
    })
  } catch (err: any) {
    console.error('Error in adjust-balance route:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
