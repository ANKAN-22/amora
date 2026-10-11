import { db, fetchAll } from '@/admin/review.ts'

export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED'
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'

export type SubscriptionRecord = {
  id: string
  userId: string
  userName: string
  userEmail: string
  plan: string
  status: SubscriptionStatus
  startedAt: string
  expiresAt: string | null
  lapsed: boolean
}

export type PaymentRecord = {
  id: string
  transactionId: string
  userName: string | null
  userEmail: string | null
  payerRef: string
  provider: string
  amountMinor: number
  currency: string
  status: PaymentStatus
  method: string | null
  paidAt: string | null
  createdAt: string
}

function subscriptionStatus(value: string): SubscriptionStatus {
  return value === 'CANCELED' || value === 'EXPIRED' ? value : 'ACTIVE'
}

function paymentStatus(value: string): PaymentStatus {
  return value === 'SUCCEEDED' || value === 'FAILED' || value === 'REFUNDED' ? value : 'PENDING'
}

async function namesFor(ids: string[]) {
  const people = new Map<string, { name: string; email: string }>()
  const unique = [...new Set(ids)]
  for (let i = 0; i < unique.length; i += 200) {
    const { data, error } = await db().from('profiles').select('id, name, email').in('id', unique.slice(i, i + 200))
    if (error) throw new Error(error.message)
    for (const row of (data ?? []) as { id: string; name: string; email: string }[]) {
      people.set(row.id, { name: row.name || 'Student', email: row.email })
    }
  }
  return people
}

export async function listSubscriptions(): Promise<SubscriptionRecord[]> {
  const client = db()
  const rows = await fetchAll<{
    id: string
    user_id: string
    plan: string
    status: string
    started_at: string
    expires_at: string | null
  }>((from, to) =>
    client
      .from('subscriptions')
      .select('id, user_id, plan, status, started_at, expires_at')
      .order('started_at', { ascending: false })
      .order('id')
      .range(from, to),
  )
  const people = await namesFor(rows.map((row) => row.user_id))
  return rows.map((row) => {
    const status = subscriptionStatus(row.status)
    return {
      id: row.id,
      userId: row.user_id,
      userName: people.get(row.user_id)?.name ?? 'Unknown user',
      userEmail: people.get(row.user_id)?.email ?? '',
      plan: row.plan,
      status,
      startedAt: row.started_at,
      expiresAt: row.expires_at,
      lapsed: status === 'ACTIVE' && row.expires_at !== null && new Date(row.expires_at).getTime() <= Date.now(),
    }
  })
}

export async function updateSubscription(id: string, status: SubscriptionStatus, expiresAt: string | null) {
  const { data, error } = await db()
    .from('subscriptions')
    .update({ status, expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('The subscription was not updated. You may not have permission.')
}

export async function listPayments(): Promise<PaymentRecord[]> {
  const client = db()
  const rows = await fetchAll<{
    id: string
    user_id: string | null
    payer_ref: string
    provider: string
    transaction_id: string
    amount_minor: number
    currency: string
    status: string
    method: string | null
    paid_at: string | null
    created_at: string
  }>((from, to) =>
    client
      .from('payments')
      .select('id, user_id, payer_ref, provider, transaction_id, amount_minor, currency, status, method, paid_at, created_at')
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to),
  )
  const people = await namesFor(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id)))
  return rows.map((row) => {
    const person = row.user_id ? people.get(row.user_id) : undefined
    return {
      id: row.id,
      transactionId: row.transaction_id,
      userName: person?.name ?? null,
      userEmail: person?.email ?? null,
      payerRef: row.payer_ref,
      provider: row.provider,
      amountMinor: Number(row.amount_minor),
      currency: row.currency,
      status: paymentStatus(row.status),
      method: row.method,
      paidAt: row.paid_at,
      createdAt: row.created_at,
    }
  })
}

export function successfulRevenue(payments: PaymentRecord[]) {
  const totals = new Map<string, number>()
  let count = 0
  for (const payment of payments) {
    if (payment.status !== 'SUCCEEDED') continue
    count += 1
    totals.set(payment.currency, (totals.get(payment.currency) ?? 0) + payment.amountMinor)
  }
  return { count, totals: [...totals.entries()].map(([currency, minor]) => ({ currency, minor })) }
}
