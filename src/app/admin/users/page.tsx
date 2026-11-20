'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Search,
  Wallet,
  FileText,
  UserCheck,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  ArrowUpDown,
  Filter,
  Eye,
  PlusCircle,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Store,
  ShieldCheck,
  Clock,
  Edit,
  Database,
  Terminal,
  X
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface UserItem {
  id: string
  phone: string
  full_name: string
  business_name: string
  email: string
  balance: number
  created_at: string
  updated_at: string
  applications_count: number
  recent_applications: {
    id: string
    status: string
    charge_amount: number
    service_title: string
    created_at: string
  }[]
}

interface Stats {
  totalUsers: number
  totalWalletBalance: number
  totalApplications: number
  activeUsers: number
}

const SYNC_SQL_SCRIPT = `-- ==============================================================================
-- CSCCopy: Sync auth.users to public.users & Create get_admin_users() RPC
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Ensure required columns exist on public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- 2. Populate / Synchronize all existing users from auth.users into public.users
INSERT INTO public.users (id, phone, full_name, business_name, email, created_at, updated_at)
SELECT 
  au.id,
  au.phone,
  coalesce(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'CSC Operator'),
  coalesce(au.raw_user_meta_data->>'business_name', 'CSC Center'),
  au.email,
  au.created_at,
  now()
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  phone = coalesce(EXCLUDED.phone, public.users.phone),
  full_name = coalesce(EXCLUDED.full_name, public.users.full_name),
  business_name = coalesce(EXCLUDED.business_name, public.users.business_name),
  email = coalesce(EXCLUDED.email, public.users.email),
  updated_at = now();

-- 3. Create high-performance RPC function to fetch all users with live balances
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  result json;
begin
  select coalesce(json_agg(u), '[]'::json) into result
  from (
    select 
      au.id,
      coalesce(pu.phone, au.phone, '') as phone,
      coalesce(
        pu.full_name,
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        'CSC Operator'
      ) as full_name,
      coalesce(
        pu.business_name,
        au.raw_user_meta_data->>'business_name',
        'CSC Center'
      ) as business_name,
      coalesce(pu.email, au.email, '') as email,
      coalesce(w.balance, 0)::numeric as balance,
      au.created_at,
      coalesce(pu.updated_at, au.updated_at, au.created_at) as updated_at
    from auth.users au
    left join public.users pu on pu.id = au.id
    left join public.wallet w on w.user_id = au.id
    order by au.created_at desc
  ) u;

  return result;
end;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated, anon, service_role;`

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalWalletBalance: 0,
    totalApplications: 0,
    activeUsers: 0,
  })
  const [hasRpc, setHasRpc] = useState(true)
  const [showSqlBanner, setShowSqlBanner] = useState(true)
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false)
  const [sqlCopied, setSqlCopied] = useState(false)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'zero'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'balance_desc' | 'apps_desc' | 'name_asc'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Modals state
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Edit user state
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editBusinessName, setEditBusinessName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Adjust balance form state
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [adjustMessage, setAdjustMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Copy ID tooltip state
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers(true)
  }, [])

  const fetchUsers = async (initial: boolean = false) => {
    if (initial) setLoading(true)
    else setRefreshing(true)

    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users)
        if (data.stats) setStats(data.stats)
        if (data.hasRpc !== undefined) setHasRpc(data.hasRpc)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const q = searchQuery.toLowerCase().trim()
        const matchesQuery =
          !q ||
          user.full_name.toLowerCase().includes(q) ||
          user.phone.toLowerCase().includes(q) ||
          user.business_name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.id.toLowerCase().includes(q)

        let matchesBalance = true
        if (balanceFilter === 'positive') {
          matchesBalance = user.balance > 0
        } else if (balanceFilter === 'zero') {
          matchesBalance = user.balance <= 0
        }

        return matchesQuery && matchesBalance
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        if (sortBy === 'balance_desc') {
          return b.balance - a.balance
        }
        if (sortBy === 'apps_desc') {
          return b.applications_count - a.applications_count
        }
        if (sortBy === 'name_asc') {
          return a.full_name.localeCompare(b.full_name)
        }
        return 0
      })
  }, [users, searchQuery, balanceFilter, sortBy])

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredUsers, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, balanceFilter, sortBy])

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopySql = () => {
    navigator.clipboard.writeText(SYNC_SQL_SCRIPT)
    setSqlCopied(true)
    setTimeout(() => setSqlCopied(false), 2500)
  }

  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user)
    setEditFullName(user.full_name.startsWith('CSC Operator (') ? '' : user.full_name)
    setEditPhone(user.phone === 'Not set' || user.phone.includes('Run SQL') ? '' : user.phone)
    setEditBusinessName(user.business_name === 'CSC Center' || user.business_name === 'CSC Kendra' ? '' : user.business_name)
    setEditEmail(user.email || '')
    setEditMessage(null)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setEditLoading(true)
    setEditMessage(null)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          fullName: editFullName.trim() || undefined,
          phone: editPhone.trim() || undefined,
          businessName: editBusinessName.trim() || undefined,
          email: editEmail.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update user')
      }

      setEditMessage({ type: 'success', text: 'User details updated successfully!' })

      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                full_name: editFullName.trim() || u.full_name,
                phone: editPhone.trim() || u.phone,
                business_name: editBusinessName.trim() || u.business_name,
                email: editEmail.trim() || u.email,
              }
            : u
        )
      )

      setTimeout(() => {
        setIsEditOpen(false)
        fetchUsers(false)
      }, 1200)
    } catch (err: any) {
      setEditMessage({ type: 'error', text: err.message || 'Error updating user' })
    } finally {
      setEditLoading(false)
    }
  }

  const handleOpenAdjust = (user: UserItem, type: 'credit' | 'debit' = 'credit') => {
    setSelectedUser(user)
    setAdjustType(type)
    setAdjustAmount('')
    setAdjustReason('')
    setAdjustMessage(null)
    setIsAdjustOpen(true)
  }

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    const num = Number(adjustAmount)
    if (isNaN(num) || num <= 0) {
      setAdjustMessage({ type: 'error', text: 'Please enter a valid amount (e.g. 100)' })
      return
    }

    setAdjustLoading(true)
    setAdjustMessage(null)

    try {
      const res = await fetch('/api/admin/users/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: num,
          type: adjustType,
          description: adjustReason.trim() || undefined,
        }),
      })

      const result = await res.json()

      if (!res.ok || result.error) {
        throw new Error(result.error || 'Failed to adjust balance')
      }

      setAdjustMessage({
        type: 'success',
        text: `Success! ₹${num.toFixed(2)} ${adjustType === 'credit' ? 'credited' : 'debited'}. New balance: ₹${result.newBalance.toFixed(2)}`,
      })

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, balance: result.newBalance } : u))
      )

      setSelectedUser((prev) => (prev ? { ...prev, balance: result.newBalance } : null))

      setTimeout(() => {
        fetchUsers(false)
        setIsAdjustOpen(false)
      }, 1400)
    } catch (err: any) {
      setAdjustMessage({ type: 'error', text: err.message || 'Error adjusting balance' })
    } finally {
      setAdjustLoading(false)
    }
  }

  const getAvatarInitials = (name: string) => {
    if (!name || name.startsWith('CSC Operator (')) return 'CS'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const getCleanPhone = (phone: string) => {
    return phone.replace(/\D/g, '')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-400/30 text-slate-950 font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Users Management
              </h1>
              <p className="text-sm text-indigo-200/70 mt-0.5">
                Manage registered CSC operators, inspect contact details, monitor wallet balances, and handle account adjustments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-indigo-300/70 hidden md:inline-block">
              Updated: {lastUpdated}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#0f0d26] border-indigo-400/30 text-indigo-200 hover:text-white hover:bg-indigo-500/20 shadow-sm text-xs font-semibold"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Sync Auth Users SQL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(false)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 bg-[#0f0d26] border-indigo-400/30 text-indigo-200 hover:text-white hover:bg-indigo-500/20 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* SQL Setup Helper Banner */}
      {!hasRpc && showSqlBanner && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-xl border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl mt-0.5">
              <Terminal className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Sync Real Mobile Numbers from Supabase Auth
              </h4>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                To automatically fetch operator mobile numbers and names directly from Supabase Auth, run our 1-click SQL script in Supabase SQL Editor.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              onClick={() => setIsSqlModalOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-md"
            >
              View &amp; Copy SQL
            </Button>
            <button
              onClick={() => setShowSqlBanner(false)}
              className="p-1.5 text-indigo-300 hover:text-white rounded-lg"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-[#1b183d]/90 p-5 rounded-2xl border border-indigo-400/25 shadow-xl flex items-center justify-between text-white">
          <div>
            <p className="text-xs font-semibold text-indigo-300/70 uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {loading ? '...' : stats.totalUsers}
            </h3>
            <p className="text-xs text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Registered CSC Operators
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0f0d26] border border-indigo-400/30 text-emerald-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Wallet Balance */}
        <div className="bg-[#1b183d]/90 p-5 rounded-2xl border border-indigo-400/25 shadow-xl flex items-center justify-between text-white">
          <div>
            <p className="text-xs font-semibold text-indigo-300/70 uppercase tracking-wider">Total Wallet Balance</p>
            <h3 className="text-2xl font-bold text-emerald-300 mt-1">
              {loading ? '...' : `₹ ${stats.totalWalletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </h3>
            <p className="text-xs text-indigo-300 font-medium mt-0.5 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Across all operator accounts
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0f0d26] border border-indigo-400/30 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-[#1b183d]/90 p-5 rounded-2xl border border-indigo-400/25 shadow-xl flex items-center justify-between text-white">
          <div>
            <p className="text-xs font-semibold text-indigo-300/70 uppercase tracking-wider">Active Operators</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {loading ? '...' : stats.activeUsers}
            </h3>
            <p className="text-xs text-sky-400 font-medium mt-0.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> With balance or orders
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0f0d26] border border-indigo-400/30 text-sky-400 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Applications */}
        <div className="bg-[#1b183d]/90 p-5 rounded-2xl border border-indigo-400/25 shadow-xl flex items-center justify-between text-white">
          <div>
            <p className="text-xs font-semibold text-indigo-300/70 uppercase tracking-wider">Total Applications</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {loading ? '...' : stats.totalApplications}
            </h3>
            <p className="text-xs text-amber-400 font-medium mt-0.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Submitted services
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0f0d26] border border-indigo-400/30 text-amber-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#1b183d]/90 p-4 rounded-2xl border border-indigo-400/25 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:flex-1 md:min-w-[280px]">
          <Search className="w-4 h-4 text-indigo-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Name, Mobile, Shop, Email..."
            className="pl-9 pr-4 py-2 text-sm bg-[#0f0d26] border border-indigo-400/30 text-white placeholder-indigo-300/50 focus:border-emerald-400 rounded-xl w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-300 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Balance Filter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#0f0d26] border border-indigo-400/30 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={balanceFilter}
              onChange={(e: any) => setBalanceFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#13112c] text-white">All Balances</option>
              <option value="positive" className="bg-[#13112c] text-white">Has Balance (&gt; ₹0)</option>
              <option value="zero" className="bg-[#13112c] text-white">Zero Balance (₹0)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#0f0d26] border border-indigo-400/30 rounded-xl px-3 py-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="newest" className="bg-[#13112c] text-white">Newest First</option>
              <option value="oldest" className="bg-[#13112c] text-white">Oldest First</option>
              <option value="balance_desc" className="bg-[#13112c] text-white">Highest Balance</option>
              <option value="apps_desc" className="bg-[#13112c] text-white">Most Applications</option>
              <option value="name_asc" className="bg-[#13112c] text-white">Name (A to Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="bg-[#1b183d]/90 rounded-2xl border border-indigo-400/25 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-indigo-300">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
            <p className="text-sm font-medium">Loading registered users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-indigo-400/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No users found</h3>
            <p className="text-xs text-indigo-200/60 mt-1 max-w-sm mx-auto">
              {searchQuery ? `No operators matching "${searchQuery}". Please try another search term.` : 'No operators are registered in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#110f29] border-b border-indigo-500/20 text-[11px] font-extrabold text-indigo-200 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">User &amp; Center</th>
                  <th className="py-3.5 px-4">Mobile Number</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Wallet Balance</th>
                  <th className="py-3.5 px-4">Applications</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/15 text-sm">
                {paginatedUsers.map((user) => {
                  const cleanPhone = getCleanPhone(user.phone)
                  const hasValidPhone = cleanPhone.length >= 10
                  const isPositiveBalance = user.balance > 0

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-indigo-500/10 transition-colors group"
                    >
                      {/* User & Center Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm border border-indigo-400/30">
                            {getAvatarInitials(user.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">
                              {user.full_name || 'CSC Operator'}
                            </p>
                            <p className="text-xs text-indigo-200/70 flex items-center gap-1 truncate mt-0.5">
                              <Store className="w-3 h-3 text-indigo-400 shrink-0" />
                              {user.business_name || 'CSC Center'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Mobile Number & WhatsApp Link */}
                      <td className="py-3.5 px-4">
                        {hasValidPhone ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-white">
                              {user.phone}
                            </span>
                            <a
                              href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(user.full_name || 'CSC Operator')},%20greetings%20from%20CSCCopy%20Admin!`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chat on WhatsApp"
                              className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30 font-medium">
                              {user.phone.includes('Run SQL') ? 'Pending Sync' : (user.phone || 'Not set')}
                            </span>
                            <button
                              onClick={() => handleOpenEdit(user)}
                              title="Set Phone Number"
                              className="text-xs text-indigo-300 hover:text-white hover:underline font-medium"
                            >
                              + Add
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        {user.email ? (
                          <span className="text-xs text-indigo-200/80 flex items-center gap-1 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                            {user.email}
                          </span>
                        ) : (
                          <span className="text-xs text-indigo-300/40 italic">Not set</span>
                        )}
                      </td>

                      {/* Wallet Balance */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isPositiveBalance
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            ₹ {user.balance.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleOpenAdjust(user, 'credit')}
                            title="Add money to wallet"
                            className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded transition text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Applications Count */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-200 bg-indigo-500/20 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
                          <FileText className="w-3 h-3 text-indigo-300" />
                          {user.applications_count}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-xs text-indigo-200/70 whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right pr-6 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsDetailsOpen(true)
                            }}
                            className="h-8 px-2.5 text-xs text-indigo-200 hover:text-white hover:bg-indigo-500/20 font-medium"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAdjust(user, 'credit')}
                            className="h-8 px-2.5 text-xs text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/30 font-medium"
                          >
                            <Wallet className="w-3.5 h-3.5 mr-1" />
                            Wallet
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(user)}
                            className="h-8 px-2 text-xs text-indigo-300 hover:text-white hover:bg-indigo-500/20 font-medium"
                            title="Edit User Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-indigo-500/20 bg-[#13112c]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-indigo-200/70">
            <div>
              Showing <span className="font-bold text-white">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}
              </span> of <span className="font-bold text-white">{filteredUsers.length}</span> operators
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-xs bg-[#0f0d26] border-indigo-400/30 text-indigo-200 hover:text-white hover:bg-indigo-500/20"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" /> Previous
              </Button>
              <span className="px-3 py-1 font-semibold text-white bg-[#0f0d26] border border-indigo-400/30 rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-8 px-2.5 text-xs bg-[#0f0d26] border-indigo-400/30 text-indigo-200 hover:text-white hover:bg-indigo-500/20"
              >
                Next <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. USER DETAILS MODAL */}
      {/* ======================================================== */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-[#161338] border-indigo-400/30 text-white p-0 overflow-hidden rounded-2xl shadow-2xl">
          {selectedUser && (
            <>
              {/* Header */}
              <div className="bg-[#110f29] text-white p-6 border-b border-indigo-500/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-lg border border-white/10">
                      {getAvatarInitials(selectedUser.full_name)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {selectedUser.full_name || 'CSC Operator'}
                      </h2>
                      <p className="text-xs text-indigo-200/70 flex items-center gap-1.5 mt-0.5">
                        <Store className="w-3.5 h-3.5 text-emerald-400" />
                        {selectedUser.business_name || 'CSC Center'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsDetailsOpen(false)
                        handleOpenEdit(selectedUser)
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-medium h-7"
                    >
                      <Edit className="w-3 h-3 mr-1" /> Edit Profile
                    </Button>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Contact Info */}
                  <div className="bg-[#0f0d26] p-4 rounded-xl border border-indigo-400/25 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-300/70 uppercase tracking-wider">
                      Contact Information
                    </h4>

                    {/* Mobile Number */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-indigo-200">
                        <Phone className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold text-white font-mono">
                          {selectedUser.phone}
                        </span>
                      </div>
                      {getCleanPhone(selectedUser.phone).length >= 10 && (
                        <a
                          href={`https://wa.me/${getCleanPhone(selectedUser.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 text-xs text-indigo-200">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-white">
                        {selectedUser.email || 'Email not provided'}
                      </span>
                    </div>

                    {/* User ID */}
                    <div className="pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px]">
                      <span className="text-indigo-300/60">User UUID:</span>
                      <button
                        onClick={() => handleCopyId(selectedUser.id)}
                        className="font-mono text-indigo-200 hover:text-white flex items-center gap-1 bg-[#161338] px-2 py-0.5 rounded border border-indigo-400/30"
                        title="Click to copy ID"
                      >
                        {selectedUser.id.slice(0, 12)}...
                        {copiedId === selectedUser.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-indigo-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right: Live Wallet Card */}
                  <div className="bg-gradient-to-br from-[#161338] to-[#1e1b4b] p-4 rounded-xl border border-indigo-400/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-emerald-400" /> Current Wallet Balance
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold text-emerald-300 mt-2">
                        ₹ {selectedUser.balance.toFixed(2)}
                      </div>
                      <p className="text-xs text-indigo-200/70 mt-1">
                        Total {selectedUser.applications_count} service applications placed.
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-indigo-500/20 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsDetailsOpen(false)
                          handleOpenAdjust(selectedUser, 'credit')
                        }}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-md"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1" /> + Credit Money
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsDetailsOpen(false)
                          handleOpenAdjust(selectedUser, 'debit')
                        }}
                        className="bg-white/5 border-indigo-400/30 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold"
                      >
                        <MinusCircle className="w-3.5 h-3.5 mr-1" /> - Deduct Money
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Recent Applications */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" /> Recent Service Applications
                  </h4>

                  {selectedUser.recent_applications.length === 0 ? (
                    <div className="p-4 bg-[#0f0d26] rounded-xl border border-indigo-400/25 text-center text-xs text-indigo-300/60">
                      No applications submitted by this user yet.
                    </div>
                  ) : (
                    <div className="bg-[#0f0d26] rounded-xl border border-indigo-400/25 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#110f29] text-indigo-200 font-bold uppercase text-[10px] border-b border-indigo-500/20">
                            <th className="p-2.5 pl-3">Service Name</th>
                            <th className="p-2.5">Fee</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5 pr-3 text-right">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-500/15">
                          {selectedUser.recent_applications.map((app) => (
                            <tr key={app.id} className="hover:bg-indigo-500/10 transition-colors">
                              <td className="p-2.5 pl-3 font-semibold text-white">
                                {app.service_title}
                              </td>
                              <td className="p-2.5 font-bold text-emerald-300">
                                ₹ {app.charge_amount}
                              </td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    app.status === 'Approved'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                      : app.status === 'Rejected'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                  }`}
                                >
                                  {app.status}
                                </span>
                              </td>
                              <td className="p-2.5 pr-3 text-right text-indigo-200/70">
                                {new Date(app.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Timestamps */}
                <div className="p-3 bg-[#0f0d26] rounded-lg text-xs text-indigo-200/70 flex flex-wrap items-center justify-between gap-2 border border-indigo-500/20">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Joined: {new Date(selectedUser.created_at).toLocaleString('en-IN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Last Updated: {new Date(selectedUser.updated_at).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-[#110f29] border-t border-indigo-500/20 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailsOpen(false)}
                  className="bg-white/5 text-indigo-200 border-indigo-400/30 font-medium"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 2. ADJUST WALLET BALANCE MODAL */}
      {/* ======================================================== */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="max-w-md bg-[#161338] border-indigo-400/30 text-white p-0 overflow-hidden rounded-2xl shadow-2xl">
          {selectedUser && (
            <form onSubmit={handleAdjustSubmit}>
              <div className="bg-[#110f29] text-white p-5 border-b border-indigo-500/20">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  Adjust Wallet Balance
                </DialogTitle>
                <DialogDescription className="text-xs text-indigo-200/70 mt-1">
                  Operator: <span className="text-white font-semibold">{selectedUser.full_name}</span> ({selectedUser.phone})
                </DialogDescription>
              </div>

              <div className="p-6 space-y-4">
                {/* Current Balance */}
                <div className="bg-[#0f0d26] p-3.5 rounded-xl border border-indigo-400/25 flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-200">Current Balance:</span>
                  <span className="text-base font-extrabold text-emerald-300">
                    ₹ {selectedUser.balance.toFixed(2)}
                  </span>
                </div>

                {/* Credit vs Debit Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('credit')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      adjustType === 'credit'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-md'
                        : 'bg-[#0f0d26] border border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/10'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" /> + Credit Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('debit')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      adjustType === 'debit'
                        ? 'bg-rose-600 text-white font-extrabold shadow-md'
                        : 'bg-[#0f0d26] border border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/10'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" /> - Deduct Money
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <Label htmlFor="adjustAmount" className="text-xs font-semibold text-indigo-200 mb-1.5 block">
                    Amount (in ₹) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-300">₹</span>
                    <Input
                      id="adjustAmount"
                      type="number"
                      min="1"
                      step="any"
                      required
                      placeholder="e.g. 100, 500"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="pl-8 text-base font-bold bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl focus:border-emerald-400"
                    />
                  </div>

                  {/* Quick Shortcut Pills */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[50, 100, 200, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAdjustAmount(amt.toString())}
                        className="text-[11px] font-semibold bg-[#0f0d26] border border-indigo-400/30 hover:border-emerald-400/50 text-indigo-200 px-2 py-1 rounded-md transition"
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <Label htmlFor="adjustReason" className="text-xs font-semibold text-indigo-200 mb-1.5 block">
                    Reason / Remark (Optional)
                  </Label>
                  <Input
                    id="adjustReason"
                    type="text"
                    placeholder="e.g. Cash payment received, PhonePe recharge, correction..."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="text-xs bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl focus:border-emerald-400"
                  />
                </div>

                {/* Messages */}
                {adjustMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      adjustMessage.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    }`}
                  >
                    {adjustMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{adjustMessage.text}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-[#110f29] border-t border-indigo-500/20 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdjustOpen(false)}
                  disabled={adjustLoading}
                  className="bg-white/5 border-indigo-400/25 text-indigo-200 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={adjustLoading}
                  className={`${
                    adjustType === 'credit'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold shadow-md'
                      : 'bg-rose-600 hover:bg-rose-700 text-white font-bold'
                  }`}
                >
                  {adjustLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {adjustType === 'credit' ? 'Confirm Credit' : 'Confirm Deduct'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 3. EDIT USER DETAILS MODAL */}
      {/* ======================================================== */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-[#161338] border-indigo-400/30 text-white p-0 overflow-hidden rounded-2xl shadow-2xl">
          {selectedUser && (
            <form onSubmit={handleEditSubmit}>
              <div className="bg-[#110f29] text-white p-5 border-b border-indigo-500/20">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Edit className="w-5 h-5 text-emerald-400" />
                  Edit Operator Details
                </DialogTitle>
                <DialogDescription className="text-xs text-indigo-200/70 mt-1">
                  Update operator name, mobile number, center/shop name, and email.
                </DialogDescription>
              </div>

              <div className="p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <Label htmlFor="editFullName" className="text-xs font-semibold text-indigo-200 mb-1.5 block">
                    Operator Full Name
                  </Label>
                  <Input
                    id="editFullName"
                    type="text"
                    placeholder="e.g. Ramesh Patil"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="text-sm bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl focus:border-emerald-400"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <Label htmlFor="editPhone" className="text-xs font-semibold text-indigo-200 mb-1.5 block">
                    Mobile Number (10 digits)
                  </Label>
                  <Input
                    id="editPhone"
                    type="text"
                    placeholder="e.g. 9876543210 or +91 9876543210"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="text-sm font-mono bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl focus:border-emerald-400"
                  />
                </div>

                {/* Business / Shop Name */}
                <div>
                  <Label htmlFor="editBusinessName" className="text-xs font-semibold text-indigo-200 mb-1.5 block">
                    Shop / CSC Center Name
                  </Label>
                  <Input
                    id="editBusinessName"
                    type="text"
                    placeholder="e.g. Maha E-Seva Kendra"
                    value={editBusinessName}
                    onChange={(e) => setEditBusinessName(e.target.value)}
                    className="text-sm bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl focus:border-emerald-400"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <Label htmlFor="editEmail" className="text-xs font-semibold text-indigo-200 mb-1.5 block">
                    Email Address
                  </Label>
                  <Input
                    id="editEmail"
                    type="email"
                    placeholder="e.g. operator@gmail.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="text-sm bg-[#0f0d26] border border-indigo-400/30 text-white rounded-xl focus:border-emerald-400"
                  />
                </div>

                {/* Alert Messages */}
                {editMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      editMessage.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    }`}
                  >
                    {editMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{editMessage.text}</span>
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="p-4 bg-[#110f29] border-t border-indigo-500/20 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(false)}
                  disabled={editLoading}
                  className="bg-white/5 border-indigo-400/25 text-indigo-200 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={editLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold shadow-md"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Details'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 4. SQL SYNC HELPER MODAL */}
      {/* ======================================================== */}
      <Dialog open={isSqlModalOpen} onOpenChange={setIsSqlModalOpen}>
        <DialogContent className="max-w-2xl bg-[#161338] border-indigo-400/30 text-white p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="bg-[#110f29] text-white p-5 border-b border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-emerald-400" />
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  Supabase Auth Users Sync Script
                </DialogTitle>
                <DialogDescription className="text-xs text-indigo-200/70 mt-0.5">
                  Run this SQL script in Supabase to link Auth user mobile numbers &amp; full names.
                </DialogDescription>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleCopySql}
              className={`${sqlCopied ? 'bg-emerald-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold shadow-md'}`}
            >
              {sqlCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy SQL
                </>
              )}
            </Button>
          </div>

          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="bg-[#0f0d26] p-3.5 rounded-xl border border-indigo-400/25 text-xs text-indigo-200/80 space-y-1">
              <p className="font-bold text-white">Quick 3-Step Instructions:</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-semibold">Supabase Dashboard</a>.</li>
                <li>Go to <strong>SQL Editor</strong> &gt; <strong>New query</strong>.</li>
                <li>Paste the script below and click <strong>Run</strong>. That&apos;s all!</li>
              </ol>
            </div>

            <pre className="p-4 bg-[#090818] text-indigo-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-indigo-500/20 max-h-72">
              {SYNC_SQL_SCRIPT}
            </pre>
          </div>

          <div className="p-4 bg-[#110f29] border-t border-indigo-500/20 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSqlModalOpen(false)}
              className="bg-white/5 text-indigo-200 border-indigo-400/30"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleCopySql}
              className={`${sqlCopied ? 'bg-emerald-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold shadow-md'}`}
            >
              {sqlCopied ? 'Copied to Clipboard' : 'Copy SQL Script'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
