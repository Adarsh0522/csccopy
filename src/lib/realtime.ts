'use client'

import { createClient } from './supabase/client'

const GLOBAL_CHANNEL_NAME = 'csccopy_global_sync'
const BROADCAST_BUS_NAME = 'csccopy_bus'

// Safe cross-tab BroadcastChannel
let localBus: BroadcastChannel | null = null
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBus = new BroadcastChannel(BROADCAST_BUS_NAME)
  } catch (e) {
    console.warn('BroadcastChannel not supported in this browser', e)
  }
}

// Global Supabase Realtime channel instance
let globalSupabaseChannel: any = null

function getGlobalChannel() {
  if (typeof window === 'undefined') return null
  if (!globalSupabaseChannel) {
    try {
      const supabase = createClient()
      globalSupabaseChannel = supabase.channel(GLOBAL_CHANNEL_NAME, {
        config: { broadcast: { self: false } }
      })
      globalSupabaseChannel.subscribe((status: string) => {
        // Channel status logger (quiet)
      })
    } catch (err) {
      console.warn('Failed to initialize global Supabase channel:', err)
    }
  }
  return globalSupabaseChannel
}

/**
 * Emit a wallet balance update to:
 * 1. Current tab via CustomEvent
 * 2. Other tabs via BroadcastChannel
 * 3. Other connected devices/browsers via Supabase Realtime Broadcast
 */
export function emitWalletUpdate(newBalance?: number) {
  if (typeof window === 'undefined') return

  // 1. Same-tab CustomEvent (0ms instant)
  window.dispatchEvent(
    new CustomEvent('csccopy:wallet_updated', {
      detail: { balance: newBalance, timestamp: Date.now() }
    })
  )

  // 2. Cross-tab BroadcastChannel
  try {
    localBus?.postMessage({
      type: 'WALLET_UPDATED',
      balance: newBalance,
      timestamp: Date.now()
    })
  } catch (err) {
    console.error('Bus postMessage error:', err)
  }

  // 3. Supabase Realtime Broadcast
  try {
    const channel = getGlobalChannel()
    channel?.send({
      type: 'broadcast',
      event: 'wallet_updated',
      payload: { balance: newBalance, timestamp: Date.now() }
    })
  } catch (err) {
    console.warn('Supabase broadcast wallet error:', err)
  }
}

/**
 * Emit a new application created event to:
 * 1. Current tab via CustomEvent
 * 2. Other tabs via BroadcastChannel
 * 3. Admin dashboard via Supabase Realtime Broadcast
 */
export function emitApplicationCreated(application: any) {
  if (typeof window === 'undefined') return

  // 1. Same-tab CustomEvent (0ms instant)
  window.dispatchEvent(
    new CustomEvent('csccopy:application_created', {
      detail: { application, timestamp: Date.now() }
    })
  )

  // 2. Cross-tab BroadcastChannel
  try {
    localBus?.postMessage({
      type: 'APPLICATION_CREATED',
      application,
      timestamp: Date.now()
    })
  } catch (err) {
    console.error('Bus postMessage error:', err)
  }

  // 3. Supabase Realtime Broadcast
  try {
    const channel = getGlobalChannel()
    channel?.send({
      type: 'broadcast',
      event: 'new_application',
      payload: { application, timestamp: Date.now() }
    })
  } catch (err) {
    console.warn('Supabase broadcast application error:', err)
  }
}

/**
 * Subscribe to wallet balance changes
 */
export function subscribeToWallet(
  userId: string | null | undefined,
  onUpdate: (balance?: number) => void
) {
  if (typeof window === 'undefined') return () => {}

  const supabase = createClient()

  // 1. Listen to same-tab CustomEvent
  const handleCustomEvent = (e: any) => {
    onUpdate(e.detail?.balance)
  }
  window.addEventListener('csccopy:wallet_updated', handleCustomEvent)

  // 2. Listen to cross-tab BroadcastChannel
  const handleBusMessage = (event: MessageEvent) => {
    if (event.data?.type === 'WALLET_UPDATED') {
      onUpdate(event.data?.balance)
    }
  }
  localBus?.addEventListener('message', handleBusMessage)

  // 3. Listen to Supabase Realtime: Postgres changes on 'wallet'
  const walletChannelName = `user_wallet_${userId || 'anon'}_${Math.random().toString(36).substring(7)}`
  const walletChannel = supabase.channel(walletChannelName)

  if (userId) {
    walletChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wallet',
        filter: `user_id=eq.${userId}`
      },
      (payload: any) => {
        if (payload.new && (payload.new as any).balance != null) {
          onUpdate(Number((payload.new as any).balance))
        } else {
          onUpdate()
        }
      }
    )
  }

  walletChannel.on('broadcast', { event: 'wallet_updated' }, (payload: any) => {
    onUpdate(payload.payload?.balance)
  })

  walletChannel.subscribe()

  // 4. Global broadcast listener
  const globalCh = getGlobalChannel()
  globalCh?.on('broadcast', { event: 'wallet_updated' }, (payload: any) => {
    onUpdate(payload.payload?.balance)
  })

  // 5. Visibility / Window Focus listener
  const handleFocus = () => {
    onUpdate()
  }
  window.addEventListener('focus', handleFocus)
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      onUpdate()
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)

  // 6. Silent heartbeat polling every 8s
  const intervalId = setInterval(() => {
    onUpdate()
  }, 8000)

  return () => {
    window.removeEventListener('csccopy:wallet_updated', handleCustomEvent)
    localBus?.removeEventListener('message', handleBusMessage)
    window.removeEventListener('focus', handleFocus)
    document.removeEventListener('visibilitychange', handleVisibility)
    clearInterval(intervalId)
    try {
      supabase.removeChannel(walletChannel)
    } catch (e) {
      // quiet cleanup
    }
  }
}

/**
 * Subscribe to applications list updates (for admin and users)
 */
export function subscribeToApplications(onUpdate: (app?: any) => void) {
  if (typeof window === 'undefined') return () => {}

  const supabase = createClient()

  // 1. Same-tab CustomEvent
  const handleCustomEvent = (e: any) => {
    onUpdate(e.detail?.application)
  }
  window.addEventListener('csccopy:application_created', handleCustomEvent)

  // 2. Cross-tab BroadcastChannel
  const handleBusMessage = (event: MessageEvent) => {
    if (event.data?.type === 'APPLICATION_CREATED') {
      onUpdate(event.data?.application)
    }
  }
  localBus?.addEventListener('message', handleBusMessage)

  // 3. Supabase Realtime: Postgres changes on 'service_applications'
  const appChannelName = `apps_channel_${Math.random().toString(36).substring(7)}`
  const appChannel = supabase.channel(appChannelName)

  appChannel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'service_applications'
    },
    (payload: any) => {
      onUpdate(payload.new)
    }
  )

  appChannel.on('broadcast', { event: 'new_application' }, (payload: any) => {
    onUpdate(payload.payload?.application)
  })

  appChannel.subscribe()

  // 4. Global broadcast listener
  const globalCh = getGlobalChannel()
  globalCh?.on('broadcast', { event: 'new_application' }, (payload: any) => {
    onUpdate(payload.payload?.application)
  })

  // 5. Visibility / Window Focus
  const handleFocus = () => {
    onUpdate()
  }
  window.addEventListener('focus', handleFocus)
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      onUpdate()
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)

  // 6. Silent heartbeat polling every 5s (crucial for Admin)
  const intervalId = setInterval(() => {
    onUpdate()
  }, 5000)

  return () => {
    window.removeEventListener('csccopy:application_created', handleCustomEvent)
    localBus?.removeEventListener('message', handleBusMessage)
    window.removeEventListener('focus', handleFocus)
    document.removeEventListener('visibilitychange', handleVisibility)
    clearInterval(intervalId)
    try {
      supabase.removeChannel(appChannel)
    } catch (e) {
      // quiet cleanup
    }
  }
}

