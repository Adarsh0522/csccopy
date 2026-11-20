import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function extractPhoneFromData(submittedData: any): string {
  if (!submittedData || typeof submittedData !== 'object') return ''
  const priorityKeys = [
    'mobile', 'phone', 'mobileNumber', 'phoneNumber', 'mobile_number',
    'phone_number', 'mobile_no', 'phone_no', 'contact', 'contact_no', 'whatsapp'
  ]
  for (const k of priorityKeys) {
    if (submittedData[k] && typeof submittedData[k] === 'string') {
      const clean = submittedData[k].replace(/\D/g, '')
      if (clean.length >= 10) {
        return clean.length === 10 ? `+91 ${clean}` : (clean.startsWith('91') ? `+${clean}` : submittedData[k])
      }
    }
  }
  // Check any field with 10-12 digits
  for (const val of Object.values(submittedData)) {
    if (typeof val === 'string') {
      const clean = val.replace(/\D/g, '')
      if (clean.length === 10) {
        return `+91 ${clean}`
      }
      if (clean.length === 12 && clean.startsWith('91')) {
        return `+${clean}`
      }
    }
  }
  return ''
}

function extractShopFromData(submittedData: any): string {
  if (!submittedData || typeof submittedData !== 'object') return ''
  const keys = [
    'business_name', 'shop_name', 'center_name', 'kendra_name',
    'businessName', 'shopName', 'centerName', 'kendraName', 'firm_name'
  ]
  for (const k of keys) {
    if (submittedData[k] && typeof submittedData[k] === 'string' && submittedData[k].trim().length > 0) {
      return submittedData[k].trim()
    }
  }
  return ''
}

function extractNameFromData(submittedData: any): string {
  if (!submittedData || typeof submittedData !== 'object') return ''
  const keys = [
    'full_name', 'fullName', 'applicant_name', 'applicantName',
    'name', 'customer_name', 'customerName', 'operator_name'
  ]
  for (const k of keys) {
    if (submittedData[k] && typeof submittedData[k] === 'string' && submittedData[k].trim().length > 0) {
      return submittedData[k].trim()
    }
  }
  return ''
}

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Fetch applications to map activity and contact fallbacks
    const { data: applicationsData } = await supabase
      .from('service_applications')
      .select('id, user_id, status, charge_amount, submitted_data, created_at, services(title)')
      .order('created_at', { ascending: false })

    const userAppsMap = new Map<string, any[]>()
    const fallbackPhoneMap = new Map<string, string>()
    const fallbackShopMap = new Map<string, string>()
    const fallbackNameMap = new Map<string, string>()

    if (applicationsData) {
      applicationsData.forEach((app: any) => {
        if (app.user_id) {
          if (!userAppsMap.has(app.user_id)) {
            userAppsMap.set(app.user_id, [])
          }
          userAppsMap.get(app.user_id)!.push({
            id: app.id,
            status: app.status || 'Pending',
            charge_amount: Number(app.charge_amount || 0),
            service_title: app.services?.title || 'Custom Service',
            created_at: app.created_at
          })

          if (!fallbackPhoneMap.has(app.user_id)) {
            const p = extractPhoneFromData(app.submitted_data)
            if (p) fallbackPhoneMap.set(app.user_id, p)
          }

          if (!fallbackShopMap.has(app.user_id)) {
            const s = extractShopFromData(app.submitted_data)
            if (s) fallbackShopMap.set(app.user_id, s)
          }

          if (!fallbackNameMap.has(app.user_id)) {
            const n = extractNameFromData(app.submitted_data)
            if (n) fallbackNameMap.set(app.user_id, n)
          }
        }
      })
    }

    // 2. Try Supabase RPC get_admin_users (directly reads auth.users + public.wallet)
    let hasRpc = false
    try {
      const { data: rpcUsers, error: rpcError } = await supabase.rpc('get_admin_users')
      if (!rpcError && Array.isArray(rpcUsers) && rpcUsers.length > 0) {
        hasRpc = true
        const combinedUsers = rpcUsers.map((u: any) => {
          const apps = userAppsMap.get(u.id) || []
          return {
            id: u.id,
            phone: u.phone || fallbackPhoneMap.get(u.id) || 'Not set',
            full_name: u.full_name || fallbackNameMap.get(u.id) || `CSC Operator (${u.id.slice(0, 8)})`,
            business_name: u.business_name || fallbackShopMap.get(u.id) || 'CSC Center',
            email: u.email || '',
            balance: Number((Number(u.balance) || 0).toFixed(2)),
            created_at: u.created_at || new Date().toISOString(),
            updated_at: u.updated_at || u.created_at || new Date().toISOString(),
            applications_count: apps.length,
            recent_applications: apps.slice(0, 10)
          }
        })

        const totalUsers = combinedUsers.length
        const totalWalletBalance = combinedUsers.reduce((sum, u) => sum + (Number(u.balance) || 0), 0)
        const totalApplications = Array.from(userAppsMap.values()).reduce((sum, apps) => sum + apps.length, 0)
        const activeUsers = combinedUsers.filter(u => u.applications_count > 0 || u.balance > 0).length

        return NextResponse.json({
          success: true,
          hasRpc: true,
          users: combinedUsers,
          stats: {
            totalUsers,
            totalWalletBalance: Number(totalWalletBalance.toFixed(2)),
            totalApplications,
            activeUsers
          }
        })
      }
    } catch (rpcErr) {
      console.warn('RPC get_admin_users not available yet, falling back to public tables:', rpcErr)
    }

    // 3. Fallback: Query public.users and public.wallet
    const { data: usersData } = await supabase
      .from('users')
      .select('*')

    const { data: walletData } = await supabase
      .from('wallet')
      .select('user_id, balance, currency, updated_at')

    const walletMap = new Map<string, number>()
    if (walletData) {
      walletData.forEach((w: any) => {
        if (w.user_id) {
          walletMap.set(w.user_id, Number(w.balance || 0))
        }
      })
    }

    const seenUserIds = new Set<string>()
    const combinedUsers: any[] = []

    if (usersData && Array.isArray(usersData)) {
      usersData.forEach((u: any) => {
        seenUserIds.add(u.id)
        const apps = userAppsMap.get(u.id) || []
        const userBalance = walletMap.has(u.id) ? Number(walletMap.get(u.id)) : 0

        let phone = u.phone || fallbackPhoneMap.get(u.id) || ''
        let fullName = u.full_name || fallbackNameMap.get(u.id) || ''
        let businessName = u.business_name || fallbackShopMap.get(u.id) || ''

        if (!fullName || fullName === 'CSC Operator') {
          fullName = fallbackNameMap.get(u.id) || `CSC Operator (${u.id.slice(0, 8)})`
        }

        if (!phone) {
          phone = 'Not Synced (Run SQL)'
        }

        if (!businessName) {
          businessName = 'CSC Center'
        }

        combinedUsers.push({
          id: u.id,
          phone: phone,
          full_name: fullName,
          business_name: businessName,
          email: u.email || '',
          balance: Number(userBalance.toFixed(2)),
          created_at: u.created_at || new Date().toISOString(),
          updated_at: u.updated_at || u.created_at || new Date().toISOString(),
          applications_count: apps.length,
          recent_applications: apps.slice(0, 10)
        })
      })
    }

    // Extra user IDs from wallet or applications
    const extraUserIds = new Set<string>()
    if (walletData) {
      walletData.forEach((w: any) => {
        if (w.user_id && !seenUserIds.has(w.user_id)) extraUserIds.add(w.user_id)
      })
    }
    if (applicationsData) {
      applicationsData.forEach((a: any) => {
        if (a.user_id && !seenUserIds.has(a.user_id)) extraUserIds.add(a.user_id)
      })
    }

    extraUserIds.forEach((uid: string) => {
      const apps = userAppsMap.get(uid) || []
      const userBalance = walletMap.has(uid) ? Number(walletMap.get(uid)) : 0
      const phone = fallbackPhoneMap.get(uid) || 'Not Synced (Run SQL)'
      const fullName = fallbackNameMap.get(uid) || `CSC Operator (${uid.slice(0, 8)})`
      const businessName = fallbackShopMap.get(uid) || 'CSC Center'

      combinedUsers.push({
        id: uid,
        phone: phone,
        full_name: fullName,
        business_name: businessName,
        email: '',
        balance: Number(userBalance.toFixed(2)),
        created_at: apps[0]?.created_at || new Date().toISOString(),
        updated_at: apps[0]?.created_at || new Date().toISOString(),
        applications_count: apps.length,
        recent_applications: apps.slice(0, 10)
      })
    })

    combinedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const totalUsers = combinedUsers.length
    const totalWalletBalance = combinedUsers.reduce((sum, u) => sum + (Number(u.balance) || 0), 0)
    const totalApplications = Array.from(userAppsMap.values()).reduce((sum, apps) => sum + apps.length, 0)
    const activeUsers = combinedUsers.filter(u => u.applications_count > 0 || u.balance > 0).length

    return NextResponse.json({
      success: true,
      hasRpc: false,
      users: combinedUsers,
      stats: {
        totalUsers,
        totalWalletBalance: Number(totalWalletBalance.toFixed(2)),
        totalApplications,
        activeUsers
      }
    })
  } catch (err: any) {
    console.error('Error in admin users GET:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, fullName, phone, businessName, email } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const updatePayload: Record<string, any> = {
      id: userId,
      updated_at: new Date().toISOString()
    }

    if (fullName) updatePayload.full_name = fullName.trim()
    if (phone) updatePayload.phone = phone.trim()
    if (businessName) updatePayload.business_name = businessName.trim()
    if (email) updatePayload.email = email.trim()

    let { error } = await supabase
      .from('users')
      .upsert(updatePayload, { onConflict: 'id' })

    if (error && error.message?.includes('phone')) {
      delete updatePayload.phone
      const retry = await supabase.from('users').upsert(updatePayload, { onConflict: 'id' })
      error = retry.error
    }
    if (error && error.message?.includes('business_name')) {
      delete updatePayload.business_name
      const retry = await supabase.from('users').upsert(updatePayload, { onConflict: 'id' })
      error = retry.error
    }

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, message: 'User updated successfully' })
  } catch (err: any) {
    console.error('Error updating user:', err)
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 })
  }
}
