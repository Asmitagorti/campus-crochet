import { useEffect, useState } from 'react'
import type { Navigate, Product, CustomRequest } from "@/types"
import { YarnBall, CrochetFlower } from "../YarnDecor"
import { supabase } from "@/lib/supabase"

type AdminSection = 'dashboard' | 'orders' | 'products' | 'custom' | 'past-creations'

// ── AdminOrder local type ────────────────────────────────────────────────
// Used by both DashboardSection (live) and OrdersSection (live).
// Declared early so DashboardSection can reference it.
type AdminOrder = {
  id: string
  product: string
  customer: string
  college: string
  status: string
  date: string
  amount: number
  color: string
  image: string
}

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  payment_received: { label: 'Payment received', bg: '#EDD4D4', text: '#8B4A3A' },
  yarn_selected:    { label: 'Yarn selected',    bg: '#D4C8EE', text: '#4A3A8B' },
  crocheting:       { label: 'Crocheting',        bg: '#FDE9CC', text: '#8B5A1A' },
  quality_check:    { label: 'Quality check',     bg: '#C8D8C0', text: '#3A6B3A' },
  ready:            { label: 'Ready for pickup',  bg: '#A8D4C8', text: '#1A6B5A' },
  completed:        { label: 'Completed',         bg: '#2E1D15', text: '#EDD4D4' },
}

const colorOptions = ['Dusty Rose', 'Cream', 'Sage Green', 'Lavender', 'Terracotta', 'Warm Brown', 'Sunflower Yellow', 'White', 'Blush Pink', 'Natural Cream', 'Rose & Cream', 'Mixed Pastels']
const categoryOptions = ['Scrunchies', 'Keychains', 'Charms', 'Bookmarks', 'Bags', 'Home']
const processingOptions = ['3–5 working days', '5–7 working days', '7–10 working days']

// ── Confirmation dialog ──────────────────────────────────────────────────────────────────────────────────────
function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  onConfirm: (pass: string) => void
  onCancel: () => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [pass, setPass] = useState('')
  const [passError, setPassError] = useState('')

  function handleFirstConfirm() { setStep(2) }
  function handleSecondConfirm() {
    if (pass !== 'admin') { setPassError('Incorrect admin password.'); return }
    onConfirm(pass)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(46,29,21,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ backgroundColor: '#FFFDF8', borderRadius: 20, padding: '2rem', maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(46,29,21,0.25)' }}>
        {step === 1 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#FDF0EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97B63" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, color: '#2E1D15', fontSize: '1.1rem' }}>{title}</h3>
            </div>
            <p style={{ color: '#7A6058', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{message}</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={onCancel} style={{ flex: 1, padding: '0.65rem', borderRadius: 50, border: '1.5px solid #EDD4D4', backgroundColor: '#FFFDF8', color: '#7A6058', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleFirstConfirm} style={{ flex: 1, padding: '0.65rem', borderRadius: 50, backgroundColor: '#C97B63', color: '#FFFDF8', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
                Yes, continue
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#F7F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E1D15" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, color: '#2E1D15', fontSize: '1.1rem' }}>Admin verification</h3>
            </div>
            <p style={{ color: '#7A6058', fontSize: '0.85rem', marginBottom: '1rem' }}>Enter your admin password to confirm this action.</p>
            <input
              type="password"
              placeholder="Admin password"
              value={pass}
              onChange={e => { setPass(e.target.value); setPassError('') }}
              style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: 12, border: `1.5px solid ${passError ? '#D8A7A7' : '#EDD4D4'}`, backgroundColor: '#F7F3EC', color: '#2E1D15', fontSize: '0.88rem', outline: 'none', marginBottom: '0.5rem', fontFamily: 'DM Sans, system-ui, sans-serif' }}
              autoFocus
            />
            {passError && <p style={{ color: '#A86248', fontSize: '0.78rem', marginBottom: '0.75rem' }}>{passError}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: passError ? 0 : '0.5rem' }}>
              <button onClick={onCancel} style={{ flex: 1, padding: '0.65rem', borderRadius: 50, border: '1.5px solid #EDD4D4', backgroundColor: '#FFFDF8', color: '#7A6058', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleSecondConfirm} style={{ flex: 1, padding: '0.65rem', borderRadius: 50, backgroundColor: '#2E1D15', color: '#FFFDF8', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
                Confirm action
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────────────────────────────────────────────
function Sidebar({ section, setSection, navigate, onLogout }: { section: AdminSection; setSection: (s: AdminSection) => void; navigate: Navigate; onLogout: () => void }) {
  const items: { key: AdminSection; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <GridIcon /> },
    { key: 'orders', label: 'All Orders', icon: <BoxIcon /> },
    { key: 'custom', label: 'Custom Requests', icon: <ChatIcon /> },
    { key: 'products', label: 'Products', icon: <TagIcon /> },
    { key: 'past-creations', label: 'Past Creations', icon: <HeartIcon /> },
  ]

  return (
    <aside style={{ width: 220, backgroundColor: '#2E1D15', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(216,167,167,0.15)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <YarnBall size={24} color="#D8A7A7" />
        <span style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#F7F3EC', fontSize: '1rem', fontWeight: 600 }}>Campus Crochet</span>
      </div>
      <div style={{ padding: '0.75rem 0', flex: 1 }}>
        <p style={{ color: '#7A6058', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.75rem 1.25rem 0.4rem' }}>Admin Panel</p>
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => {
              if (item.key === 'past-creations') navigate('past-creations')
              else setSection(item.key)
            }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.65rem 1.25rem', backgroundColor: section === item.key ? 'rgba(201,123,99,0.2)' : 'transparent', border: 'none', borderLeft: section === item.key ? '3px solid #C97B63' : '3px solid transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
          >
            <span style={{ color: section === item.key ? '#C97B63' : '#7A6058' }}>{item.icon}</span>
            <span style={{ color: section === item.key ? '#F7F3EC' : '#B88080', fontSize: '0.85rem', fontWeight: section === item.key ? 600 : 400 }}>{item.label}</span>
          </button>
        ))}
      </div>
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(216,167,167,0.15)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button onClick={() => navigate('home')} style={{ color: '#7A6058', fontSize: '0.78rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', textAlign: 'left' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          View site
        </button>
        <button onClick={onLogout} style={{ color: '#B88080', fontSize: '0.78rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', textAlign: 'left' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}

// ── Dashboard Overview ──────────────────────────────────────────────────────────────────────────────────────
function DashboardSection({ setSection, loginCount = 0 }: { setSection: (s: AdminSection) => void; loginCount?: number }) {
  const [liveOrders, setLiveOrders] = useState<AdminOrder[]>([])
  const [dashLoading, setDashLoading] = useState(true)

  useEffect(() => {
    async function loadDashOrders() {
      setDashLoading(true)
      try {
        const res = await fetch('/api/orders')
        if (!res.ok) return
        const data: unknown[] = (await res.json()) ?? []
        const normalized: AdminOrder[] = data.map((raw) => {
          const o = raw as {
            order_id?: string
            id?: string
            user_id: string | null
            order_status?: string
            ordered_at?: string
            total_price?: number | string
            order_items?: Array<{
              selected_color?: string
              products?: { name?: string; image?: string } | null
            }>
          }
          const item = o.order_items?.[0]
          const product = item?.products
          const orderId = o.order_id ?? o.id ?? ''
          const dateStr = o.ordered_at ?? new Date().toISOString()
          return {
            id: orderId,
            product: product?.name ?? 'Custom order',
            customer: o.user_id ? o.user_id.slice(0, 8) : 'Customer',
            college: '—',
            status: o.order_status ?? 'pending',
            date: new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            amount: Number(o.total_price ?? 0),
            color: item?.selected_color ?? 'Custom',
            image: product?.image ?? '',
          }
        })
        setLiveOrders(normalized)
      } finally {
        setDashLoading(false)
      }
    }
    loadDashOrders()
  }, [])

  const totalRevenue = liveOrders.reduce((s, o) => s + o.amount, 0)
  const completedOrders = liveOrders.filter(o => o.status === 'completed')
  const activeOrders = liveOrders.filter(o => o.status !== 'completed')
  const pendingOrders = liveOrders.filter(o => ['payment_received', 'yarn_selected'].includes(o.status))

  // Most ordered product
  const productCount: Record<string, number> = {}
  liveOrders.forEach(o => { productCount[o.product] = (productCount[o.product] ?? 0) + 1 })
  const mostOrdered = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]

  // Revenue by product
  const revenueByProduct: Record<string, number> = {}
  liveOrders.forEach(o => { revenueByProduct[o.product] = (revenueByProduct[o.product] ?? 0) + o.amount })
  const topRevenue = Object.entries(revenueByProduct).sort((a, b) => b[1] - a[1])

  // Orders by college
  const collegeCount: Record<string, number> = {}
  liveOrders.forEach(o => { if (o.college !== '—') collegeCount[o.college] = (collegeCount[o.college] ?? 0) + 1 })

  const stats = [
    { label: 'Total Orders', value: dashLoading ? '…' : liveOrders.length, sub: `${completedOrders.length} completed`, color: '#D8A7A7', icon: '📦' },
    { label: 'Active Orders', value: dashLoading ? '…' : activeOrders.length, sub: `${pendingOrders.length} pending start`, color: '#FDE9CC', icon: '🪡' },
    { label: 'Total Revenue', value: dashLoading ? '…' : `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'all time', color: '#C8D8C0', icon: '💚' },
    { label: 'Logged-in Users', value: loginCount, sub: 'this session', color: '#D4C8EE', icon: '👥' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2E1D15' }}>Dashboard</h1>
        <p style={{ color: '#7A6058', fontSize: '0.85rem', marginTop: 4 }}>Overview of Campus Crochet operations.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ backgroundColor: '#F7F3EC', borderRadius: 18, padding: '1.4rem', border: '1px solid #EDD4D4' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>{s.icon}</div>
            <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.8rem', fontWeight: 700, color: '#2E1D15' }}>{s.value}</p>
            <p style={{ color: '#2E1D15', fontSize: '0.82rem', fontWeight: 600, marginTop: 2 }}>{s.label}</p>
            <p style={{ color: '#7A6058', fontSize: '0.74rem', marginTop: 2 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Revenue by product */}
        <div style={{ backgroundColor: '#F7F3EC', borderRadius: 18, padding: '1.4rem', border: '1px solid #EDD4D4' }}>
          <p style={{ fontWeight: 700, color: '#2E1D15', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🏆 Revenue by Product
          </p>
          {dashLoading ? (
            <p style={{ color: '#7A6058', fontSize: '0.82rem' }}>Loading…</p>
          ) : topRevenue.length === 0 ? (
            <p style={{ color: '#7A6058', fontSize: '0.82rem' }}>No orders yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {topRevenue.map(([product, revenue]) => {
                const pct = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0
                return (
                  <div key={product}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                      <span style={{ color: '#2E1D15', fontWeight: mostOrdered && product === mostOrdered[0] ? 700 : 400 }}>{product}</span>
                      <span style={{ color: '#C97B63', fontWeight: 600 }}>₹{revenue}</span>
                    </div>
                    <div style={{ height: 5, backgroundColor: '#EDD4D4', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: mostOrdered && product === mostOrdered[0] ? '#C97B63' : '#D8A7A7', borderRadius: 10, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Orders by college */}
        <div style={{ backgroundColor: '#F7F3EC', borderRadius: 18, padding: '1.4rem', border: '1px solid #EDD4D4' }}>
          <p style={{ fontWeight: 700, color: '#2E1D15', fontSize: '0.9rem', marginBottom: '1rem' }}>🏫 Orders by College</p>
          {dashLoading ? (
            <p style={{ color: '#7A6058', fontSize: '0.82rem' }}>Loading…</p>
          ) : Object.keys(collegeCount).length === 0 ? (
            <p style={{ color: '#7A6058', fontSize: '0.82rem' }}>No college data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {Object.entries(collegeCount).sort((a, b) => b[1] - a[1]).map(([college, count]) => (
                <div key={college} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#7A6058', fontSize: '0.82rem' }}>{college}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ height: 5, width: Math.max(count * 18, 4), backgroundColor: '#A8B8A0', borderRadius: 10 }} />
                    <span style={{ color: '#2E1D15', fontWeight: 600, fontSize: '0.82rem' }}>{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Most ordered callout */}
      {mostOrdered && (
        <div style={{ backgroundColor: '#2E1D15', borderRadius: 18, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 28 }}>
          <CrochetFlower size={28} color="#D8A7A7" />
          <div>
            <p style={{ color: '#B88080', fontSize: '0.8rem' }}>Most ordered product</p>
            <p style={{ color: '#F7F3EC', fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '1.1rem' }}>
              {mostOrdered[0]} – {mostOrdered[1]} orders
            </p>
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div style={{ backgroundColor: '#F7F3EC', borderRadius: 18, border: '1px solid #EDD4D4', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #EDD4D4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: 700, color: '#2E1D15', fontSize: '0.95rem' }}>Recent Orders</p>
          <button onClick={() => setSection('orders')} style={{ color: '#C97B63', fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>View all →</button>
        </div>
        {dashLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#7A6058', fontSize: '0.85rem' }}>Loading…</div>
        ) : liveOrders.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#7A6058', fontSize: '0.85rem' }}>No orders yet.</div>
        ) : (
          <OrderTable orders={liveOrders.slice(0, 5)} showActions={false} />
        )}
      </div>
    </div>
  )
}

// ── Orders Table ──────────────────────────────────────────────────────────────────────────────────────
function OrderTable({
  orders,
  showActions,
  onStatusChange,
  pendingId,
}: {
  orders: AdminOrder[]
  showActions: boolean
  onStatusChange?: (id: string, status: AdminOrder['status']) => void
  pendingId?: string | null
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #EDD4D4' }}>
            {['Order ID', 'Product', 'Customer', 'College', 'Date', 'Status', 'Amount', ...(showActions ? ['Action'] : [])].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '0.7rem 1.25rem', fontSize: '0.7rem', fontWeight: 600, color: '#7A6058', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => {
            const sc = STATUS_META[o.status] ?? { label: o.status, bg: '#EDD4D4', text: '#2E1D15' }
            const isPending = pendingId === o.id
            return (
              <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid #EDD4D4' : 'none' }}>
                <td style={{ padding: '0.8rem 1.25rem', fontSize: '0.8rem', color: '#2E1D15', fontWeight: 500, whiteSpace: 'nowrap' }}>{o.id.slice(0, 8)}</td>
                <td style={{ padding: '0.8rem 1.25rem', fontSize: '0.82rem', color: '#2E1D15', fontWeight: 600, whiteSpace: 'nowrap' }}>{o.product}</td>
                <td style={{ padding: '0.8rem 1.25rem', fontSize: '0.8rem', color: '#7A6058', whiteSpace: 'nowrap' }}>{o.customer}</td>
                <td style={{ padding: '0.8rem 1.25rem', fontSize: '0.78rem', color: '#7A6058', whiteSpace: 'nowrap' }}>{o.college}</td>
                <td style={{ padding: '0.8rem 1.25rem', fontSize: '0.78rem', color: '#7A6058', whiteSpace: 'nowrap' }}>{o.date}</td>
                <td style={{ padding: '0.8rem 1.25rem' }}>
                  <span style={{ backgroundColor: sc.bg, color: sc.text, fontSize: '0.68rem', fontWeight: 600, padding: '0.22rem 0.6rem', borderRadius: 50, whiteSpace: 'nowrap' }}>{sc.label}</span>
                </td>
                <td style={{ padding: '0.8rem 1.25rem', fontWeight: 700, color: '#C97B63', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>₹{o.amount}</td>
                {showActions && (
                  <td style={{ padding: '0.8rem 1.25rem' }}>
                    <select
                      value={o.status}
                      disabled={isPending}
                      onChange={e => onStatusChange?.(o.id, e.target.value as AdminOrder['status'])}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 8,
                        border: '1px solid #EDD4D4',
                        backgroundColor: isPending ? '#F7F3EC' : '#FFFDF8',
                        color: '#2E1D15',
                        cursor: isPending ? 'wait' : 'pointer',
                        outline: 'none',
                      }}
                    >
                      {Object.entries(STATUS_META).map(([key, m]) => (
                        <option key={key} value={key}>{m.label}</option>
                      ))}
                    </select>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// â”€â”€ All Orders Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OrdersSection({ notify }: { notify: (msg: string) => void }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) {
        notify('Failed to load orders.')
        setOrders([])
        return
      }
      const data: unknown[] = (await res.json()) ?? []
      const normalized: AdminOrder[] = data.map((raw) => {
        const o = raw as {
          order_id?: string
          id?: string
          user_id: string | null
          order_status?: string
          ordered_at?: string
          total_price?: number | string
          order_items?: Array<{
            selected_color?: string
            products?: { name?: string; image?: string } | null
          }>
        }
        const item = o.order_items?.[0]
        const product = item?.products
        const orderId = o.order_id ?? o.id ?? ''
        const dateStr = o.ordered_at ?? new Date().toISOString()
        return {
          id: orderId,
          product: product?.name ?? 'Custom order',
          customer: o.user_id ? o.user_id.slice(0, 8) : 'Customer',
          college: '—',
          status: o.order_status ?? 'pending',
          date: new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          amount: Number(o.total_price ?? 0),
          color: item?.selected_color ?? 'Custom',
          image: product?.image ?? '',
        }
      })
      setOrders(normalized)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function handleStatusChange(id: string, status: AdminOrder['status']) {
    const current = orders.find(o => o.id === id)
    if (!current || current.status === status) return

    const targetLabel = STATUS_META[status]?.label ?? status
    if (!confirm(`Move order ${id.slice(0, 8)} to "${targetLabel}"?`)) {
      // Revert the select by reloading
      load()
      return
    }

    setPendingId(id)
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: id, order_status: status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        notify(data.error ?? 'Failed to update order.')
        return
      }
      notify(`Order moved to "${targetLabel}".`)
      load()
    } finally {
      setPendingId(null)
    }
  }

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || (filter === 'active' ? o.status !== 'completed' : o.status === 'completed')
    const matchSearch = search === '' || o.product.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const totalRevenue = filtered.reduce((s, o) => s + o.amount, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2E1D15' }}>All Orders</h1>
          <p style={{ color: '#7A6058', fontSize: '0.85rem', marginTop: 4 }}>{filtered.length} orders Â· â‚¹{totalRevenue.toLocaleString('en-IN')} total</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A6058" strokeWidth="1.8" strokeLinecap="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." style={{ padding: '0.45rem 0.75rem 0.45rem 2rem', borderRadius: 50, border: '1.5px solid #EDD4D4', backgroundColor: '#F7F3EC', color: '#2E1D15', fontSize: '0.82rem', outline: 'none', width: 200 }} />
          </div>
          {['all', 'active', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.4rem 1rem', borderRadius: 50, fontSize: '0.78rem', fontWeight: 500, border: filter === f ? '1.5px solid #C97B63' : '1.5px solid #EDD4D4', backgroundColor: filter === f ? '#C97B63' : '#FFFDF8', color: filter === f ? '#FFFDF8' : '#7A6058', cursor: 'pointer', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total orders shown', value: filtered.length },
          { label: 'Active (in progress)', value: filtered.filter(o => o.status !== 'completed').length },
          { label: 'Revenue shown', value: `â‚¹${totalRevenue.toLocaleString('en-IN')}` },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#F7F3EC', borderRadius: 14, padding: '1rem 1.25rem', border: '1px solid #EDD4D4' }}>
            <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#2E1D15' }}>{s.value}</p>
            <p style={{ color: '#7A6058', fontSize: '0.75rem', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#F7F3EC', borderRadius: 18, border: '1px solid #EDD4D4', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#7A6058' }}>
            <p>Loading ordersâ€¦</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#7A6058' }}>
            <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.1rem', color: '#2E1D15' }}>No orders found</p>
          </div>
        ) : (
          <OrderTable orders={filtered} showActions={true} onStatusChange={handleStatusChange} pendingId={pendingId} />
        )}
      </div>
    </div>
  )
}

// â”€â”€ Custom Requests Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CUSTOM_STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  pending:           { label: 'Pending review',  bg: '#EDD4D4', text: '#8B4A3A' },
  accepted:          { label: 'Accepted',        bg: '#C8D8C0', text: '#3A6B3A' },
  rejected:          { label: 'Rejected',        bg: '#D8A7A7', text: '#7A2E2E' },
  counter_offered:   { label: 'Counter offered', bg: '#FDE9CC', text: '#8B5A1A' },
  student_accepted:  { label: 'Student accepted', bg: '#A8D4C8', text: '#1A6B5A' },
  paid:              { label: 'Paid',            bg: '#D4C8EE', text: '#4A3A8B' },
  in_production:     { label: 'In production',   bg: '#FDE9CC', text: '#8B5A1A' },
  ready:             { label: 'Ready',           bg: '#A8D4C8', text: '#1A6B5A' },
  completed:         { label: 'Completed',       bg: '#2E1D15', text: '#EDD4D4' },
}

function CustomRequestsSection({ notify }: { notify: (msg: string) => void }) {
  const [requests, setRequests] = useState<CustomRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/custom-requests')
      if (!res.ok) {
        console.error('Failed to load custom requests')
        setRequests([])
        return
      }
      const data = (await res.json()) ?? []
      setRequests(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel('admin-custom-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_requests' },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function patchRequest(
    id: string,
    payload: {
      status: CustomRequest['status']
      admin_price?: number
      admin_notes?: string
    }
  ) {
    setSavingId(id)
    try {
      const res = await fetch('/api/custom-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id, ...payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        notify(data.error ?? 'Failed to update request')
        return false
      }
      notify('Request updated.')
      return true
    } finally {
      setSavingId(null)
    }
  }

  function openEditor(req: CustomRequest) {
    setEditing(req.id)
    setPriceInput(req.admin_price ? String(req.admin_price) : '')
    setNotesInput(req.admin_notes ?? '')
  }

  async function submitCounterOffer(req: CustomRequest) {
    const price = Number(priceInput)
    if (!Number.isFinite(price) || price <= 0) {
      notify('Enter a valid price before sending a counter-offer.')
      return
    }
    const ok = await patchRequest(req.id, {
      status: 'counter_offered',
      admin_price: price,
      admin_notes: notesInput.trim() || undefined,
    })
    if (ok) setEditing(null)
  }

  async function acceptDirect(req: CustomRequest) {
    const price = priceInput ? Number(priceInput) : req.admin_price
    if (!price || !Number.isFinite(price)) {
      notify('Set a price before accepting.')
      return
    }
    await patchRequest(req.id, {
      status: 'accepted',
      admin_price: price,
      admin_notes: notesInput.trim() || undefined,
    })
  }

  async function reject(req: CustomRequest) {
    if (!confirm(`Reject "${req.item_name}" from ${req.name}?`)) return
    await patchRequest(req.id, {
      status: 'rejected',
      admin_notes: notesInput.trim() || undefined,
    })
  }

  async function advance(req: CustomRequest, status: CustomRequest['status']) {
    await patchRequest(req.id, { status })
  }

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    counter: requests.filter(r => r.status === 'counter_offered').length,
    studentAccepted: requests.filter(r => r.status === 'student_accepted').length,
    paid: requests.filter(r => ['paid', 'in_production'].includes(r.status)).length,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2E1D15' }}>Custom Requests</h1>
          <p style={{ color: '#7A6058', fontSize: '0.85rem', marginTop: 4 }}>{requests.length} total Â· {counts.pending} pending review</p>
        </div>
        <button
          onClick={load}
          style={{ padding: '0.5rem 1.25rem', borderRadius: 50, border: '1.5px solid #EDD4D4', backgroundColor: '#FFFDF8', color: '#7A6058', cursor: 'pointer', fontSize: '0.82rem' }}
        >
          â†» Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Pending', value: counts.pending, color: '#EDD4D4' },
          { label: 'Counter offered', value: counts.counter, color: '#FDE9CC' },
          { label: 'Awaiting payment', value: counts.studentAccepted, color: '#A8D4C8' },
          { label: 'In production', value: counts.paid, color: '#D4C8EE' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: s.color, borderRadius: 14, padding: '1rem 1.25rem' }}>
            <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.6rem', fontWeight: 700, color: '#2E1D15' }}>{s.value}</p>
            <p style={{ color: '#2E1D15', fontSize: '0.78rem', fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#7A6058', fontSize: '0.9rem' }}>Loading custom requestsâ€¦</p>
      ) : requests.length === 0 ? (
        <div style={{ backgroundColor: '#F7F3EC', borderRadius: 18, border: '1px solid #EDD4D4', padding: '3rem', textAlign: 'center', color: '#7A6058' }}>
          <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.1rem', color: '#2E1D15' }}>No custom requests yet</p>
          <p style={{ fontSize: '0.85rem', marginTop: 4 }}>When students send a custom piece request, you'll see it here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {requests.map(req => {
            const meta = CUSTOM_STATUS_META[req.status] ?? { label: req.status, bg: '#EDD4D4', text: '#2E1D15' }
            const isEditing = editing === req.id
            const isSaving = savingId === req.id

            return (
              <div
                key={req.id}
                style={{ backgroundColor: '#F7F3EC', borderRadius: 18, border: '1px solid #EDD4D4', padding: '1.25rem 1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 600, fontSize: '1.05rem', color: '#2E1D15' }}>
                      {req.item_name}
                    </p>
                    <p style={{ color: '#7A6058', fontSize: '0.8rem', marginTop: 4 }}>
                      {req.name} Â· {req.email ?? 'no email'} Â· {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span style={{ backgroundColor: meta.bg, color: meta.text, fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 50, whiteSpace: 'nowrap' }}>
                    {meta.label}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginTop: '0.85rem', fontSize: '0.82rem', color: '#5A4238' }}>
                  {req.description && <Detail label="Description" value={req.description} />}
                  {req.colors && <Detail label="Colors" value={req.colors} />}
                  {req.occasion && <Detail label="Occasion" value={req.occasion} />}
                  {req.budget ? <Detail label="Budget" value={`â‚¹${req.budget}`} /> : null}
                  {req.admin_price ? <Detail label="Your price" value={`â‚¹${req.admin_price}`} /> : null}
                  {req.student_response ? <Detail label="Student response" value={req.student_response} /> : null}
                </div>

                {req.admin_notes && !isEditing && (
                  <div style={{ marginTop: '0.85rem', padding: '0.6rem 0.85rem', backgroundColor: '#FFFDF8', border: '1px solid #EDD4D4', borderRadius: 10, fontSize: '0.8rem', color: '#5A4238' }}>
                    ðŸ“ {req.admin_notes}
                  </div>
                )}

                {isEditing && (
                  <div style={{ marginTop: '0.85rem', padding: '0.85rem', backgroundColor: '#FFFDF8', border: '1px solid #EDD4D4', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.6rem', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2E1D15' }}>Price (â‚¹)</label>
                      <input
                        type="number"
                        value={priceInput}
                        onChange={e => setPriceInput(e.target.value)}
                        placeholder="e.g. 250"
                        style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1.5px solid #EDD4D4', backgroundColor: '#F7F3EC', color: '#2E1D15', fontSize: '0.85rem', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.6rem', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2E1D15' }}>Note to student</label>
                      <textarea
                        value={notesInput}
                        onChange={e => setNotesInput(e.target.value)}
                        placeholder="Explain the quote, materials, timelineâ€¦"
                        rows={3}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1.5px solid #EDD4D4', backgroundColor: '#F7F3EC', color: '#2E1D15', fontSize: '0.85rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: '1rem', flexWrap: 'wrap' }}>
                  {req.status === 'pending' && !isEditing && (
                    <>
                      <AdminButton onClick={() => openEditor(req)} bg="#C97B63" disabled={isSaving}>Set price & review</AdminButton>
                      <AdminButton onClick={() => reject(req)} bg="#A86248" disabled={isSaving}>Reject</AdminButton>
                    </>
                  )}
                  {req.status === 'pending' && isEditing && (
                    <>
                      <AdminButton onClick={() => submitCounterOffer(req)} bg="#C97B63" disabled={isSaving}>Send counter-offer â†’</AdminButton>
                      <AdminButton onClick={() => acceptDirect(req)} bg="#A8B8A0" disabled={isSaving}>Accept as-is</AdminButton>
                      <AdminButton onClick={() => reject(req)} bg="#A86248" disabled={isSaving}>Reject</AdminButton>
                      <AdminButton onClick={() => setEditing(null)} bg="#EDD4D4" textColor="#7A6058" disabled={isSaving}>Cancel</AdminButton>
                    </>
                  )}
                  {req.status === 'counter_offered' && (
                    <>
                      <AdminButton onClick={() => openEditor(req)} bg="#FDE9CC" textColor="#8B5A1A" disabled={isSaving}>Edit offer</AdminButton>
                      <AdminButton onClick={() => reject(req)} bg="#A86248" disabled={isSaving}>Withdraw & reject</AdminButton>
                    </>
                  )}
                  {req.status === 'student_accepted' && (
                    <AdminButton onClick={() => advance(req, 'paid')} bg="#A8B8A0" disabled={isSaving}>Mark as paid (ready for production)</AdminButton>
                  )}
                  {(req.status === 'paid' || req.status === 'in_production') && (
                    <>
                      <AdminButton onClick={() => advance(req, 'ready')} bg="#A8D4C8" textColor="#1A6B5A" disabled={isSaving}>Mark ready for pickup</AdminButton>
                      <AdminButton onClick={() => advance(req, 'completed')} bg="#2E1D15" disabled={isSaving}>Mark completed</AdminButton>
                    </>
                  )}
                  {req.status === 'ready' && (
                    <AdminButton onClick={() => advance(req, 'completed')} bg="#2E1D15" disabled={isSaving}>Mark completed</AdminButton>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.65rem', color: '#7A6058', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#2E1D15', fontWeight: 500 }}>{value}</p>
    </div>
  )
}

function AdminButton({
  onClick,
  bg,
  textColor,
  disabled,
  children,
}: {
  onClick: () => void
  bg: string
  textColor?: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.55rem 1rem',
        borderRadius: 50,
        backgroundColor: disabled ? '#EDD4D4' : bg,
        color: textColor ?? (disabled ? '#B88080' : '#FFFDF8'),
        border: 'none',
        fontWeight: 600,
        fontSize: '0.82rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 2px 8px rgba(46,29,21,0.15)',
      }}
    >
      {children}
    </button>
  )
}

// â”€â”€ Shared Product Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type FormState = { name: string; shortDesc: string; description: string; price: string; category: string; processingTime: string; care: string; stock: string; active: boolean; featured: boolean }

function ProductForm({ form, setForm, selectedColors, setSelectedColors, previewImg, setPreviewImg, dragOver, setDragOver, onSubmit, submitLabel }: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  selectedColors: string[]
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>
  previewImg: string | null
  setPreviewImg: (v: string | null) => void
  dragOver: boolean
  setDragOver: (v: boolean) => void
  onSubmit: () => void
  submitLabel: string
}) {
  const previewSrc = previewImg ?? 'https://images.unsplash.com/photo-1700171394718-2457b1190444?w=400&h=500&fit=crop&auto=format'

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setPreviewImg(URL.createObjectURL(file))
  }

  const disabled = !form.name || !form.price || !form.category

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.75rem', alignItems: 'start' }}>
      {/* Image upload */}
      <div>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => document.getElementById('admin-img-input')?.click()}
          style={{ border: `2px dashed ${dragOver ? '#C97B63' : '#EDD4D4'}`, borderRadius: 14, cursor: 'pointer', backgroundColor: dragOver ? '#FDF0EC' : '#FFFDF8', transition: 'all 0.2s', overflow: 'hidden', marginBottom: '0.6rem' }}
        >
          <input id="admin-img-input" type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} style={{ display: 'none' }} />
          <div style={{ aspectRatio: '4/5', overflow: 'hidden', position: 'relative' }}>
            <img src={previewSrc} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(46,29,21,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span style={{ color: '#FFFDF8', fontSize: '0.7rem', fontWeight: 600 }}>Click to upload</span>
            </div>
          </div>
        </div>
        <p style={{ color: '#7A6058', fontSize: '0.7rem', textAlign: 'center' }}>4:5 ratio Â· PNG, JPG, WEBP</p>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <PField label="Product name *">
            <input type="text" placeholder="e.g. Daisy Scrunchie" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={iStyle} />
          </PField>
          <PField label="Price (â‚¹) *">
            <input type="number" placeholder="e.g. 120" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={iStyle} />
          </PField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <PField label="Category *">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={iStyle}>
              <option value="">Select</option>
              {categoryOptions.map(c => <option key={c}>{c}</option>)}
            </select>
          </PField>
          <PField label="Processing time">
            <select value={form.processingTime} onChange={e => setForm(f => ({ ...f, processingTime: e.target.value }))} style={iStyle}>
              {processingOptions.map(p => <option key={p}>{p}</option>)}
            </select>
          </PField>
          <PField label="Stock limit">
            <input type="number" min="0" placeholder="Unlimited" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} style={iStyle} />
          </PField>
        </div>
        <PField label="Short description">
          <input type="text" placeholder="One-line description" value={form.shortDesc} onChange={e => setForm(f => ({ ...f, shortDesc: e.target.value }))} style={iStyle} />
        </PField>
        <PField label="Full description">
          <textarea placeholder="Describe the product in detail..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...iStyle, resize: 'vertical' }} />
        </PField>
        <PField label="Care instructions">
          <input type="text" placeholder="e.g. Hand wash in cold water." value={form.care} onChange={e => setForm(f => ({ ...f, care: e.target.value }))} style={iStyle} />
        </PField>
        <PField label="Available colors">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {colorOptions.map(c => (
              <button key={c} type="button" onClick={() => setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                style={{ padding: '0.3rem 0.75rem', borderRadius: 50, fontSize: '0.75rem', fontWeight: 500, border: selectedColors.includes(c) ? '2px solid #C97B63' : '1.5px solid #EDD4D4', backgroundColor: selectedColors.includes(c) ? '#FDF0EC' : '#FFFDF8', color: selectedColors.includes(c) ? '#C97B63' : '#7A6058', cursor: 'pointer', transition: 'all 0.15s' }}>
                {c}
              </button>
            ))}
          </div>
        </PField>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <AToggle label="Active listing" value={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} />
          <AToggle label="Featured product" value={form.featured} onChange={v => setForm(f => ({ ...f, featured: v }))} />
        </div>
        <button
          onClick={onSubmit}
          disabled={disabled}
          style={{ backgroundColor: disabled ? '#EDD4D4' : '#C97B63', color: disabled ? '#B88080' : '#FFFDF8', fontWeight: 600, padding: '0.75rem', borderRadius: 50, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.9rem', boxShadow: disabled ? 'none' : '0 4px 14px rgba(201,123,99,0.25)' }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

// â”€â”€ Products Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BLANK_FORM: FormState = { name: '', shortDesc: '', description: '', price: '', category: '', processingTime: '3â€“5 working days', care: '', stock: '', active: true, featured: false }

function ProductsSection({ notify }: { notify: (msg: string) => void }) {
  const [productList, setProductList] = useState<Product[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [addConfirm, setAddConfirm] = useState(false)
  const [editConfirm, setEditConfirm] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [form, setForm] = useState(BLANK_FORM)
  const [, setSaving] = useState(false)

  function showSuccess(msg: string) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500) }

  async function loadProducts() {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      if (!res.ok) {
        notify('Failed to load products.')
        return
      }
      const rows = await res.json()
      setProductList(Array.isArray(rows) ? rows : [])
    } catch (err) {
      console.error('Products load error:', err)
      notify('Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openEdit(p: Product) {
  setEditTarget(p)
  setForm({
    name: p.name,
    shortDesc: '',
    description: p.description,
    price: String(p.price),
    category: p.category,
    processingTime: '3-5 working days',
    care: p.care ?? '',
    stock: p.stock ? String(p.stock) : '',
    active: true,
    featured: !!p.badge
  })
  setSelectedColors(p.colors)
  setPreviewImg(p.image)
  setShowAddForm(false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

  function closeEdit() { setEditTarget(null); setForm(BLANK_FORM); setSelectedColors([]); setPreviewImg(null) }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      const res = await fetch(`/api/admin/products/${target.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        notify(data.error ?? 'Failed to delete product.')
        return
      }
      setProductList(l => l.filter(p => p.id !== target.id))
      showSuccess(`"${target.name}" has been removed from the collection.`)
    } catch (err) {
      console.error('delete product error:', err)
      notify('Failed to delete product.')
    }
  }

  async function handleAddConfirmed() {
    if (!form.name || !form.price || !form.category) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        category: form.category,
        description: form.description || form.shortDesc || '',
        care: form.care || 'Hand wash in cold water. Lay flat to dry.',
        image_url: previewImg ?? '',
        badge: form.featured ? 'Featured' : null,
        processing_time: form.processingTime,
        stock_quantity: form.stock ? Number(form.stock) : null,
        active: form.active,
        featured: form.featured,
        colors: selectedColors.length > 0 ? selectedColors : ['Natural'],
        images: previewImg ? [previewImg] : [],
      }
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        notify(data.error ?? 'Failed to create product.')
        return
      }
      setAddConfirm(false)
      setShowAddForm(false)
      setForm(BLANK_FORM)
      setSelectedColors([])
      setPreviewImg(null)
      await loadProducts()
      showSuccess(`"${data.name ?? form.name}" has been added to the collection!`)
    } catch (err) {
      console.error('add product error:', err)
      notify('Failed to create product.')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditConfirmed() {
    if (!editTarget || !form.name || !form.price || !form.category) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        category: form.category,
        description: form.description || editTarget.description,
        care: form.care || editTarget.care,
        image_url: previewImg ?? editTarget.image,
        badge: form.featured ? 'Featured' : null,
        processing_time: form.processingTime,
        stock_quantity: form.stock ? Number(form.stock) : null,
        active: form.active,
        featured: form.featured,
        colors: selectedColors.length > 0 ? selectedColors : editTarget.colors,
        images: previewImg ? [previewImg] : (editTarget.image ? [editTarget.image] : []),
      }
      const res = await fetch(`/api/admin/products/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        notify(data.error ?? 'Failed to update product.')
        return
      }
      setEditConfirm(false)
      closeEdit()
      await loadProducts()
      showSuccess(`"${form.name}" has been updated.`)
    } catch (err) {
      console.error('edit product error:', err)
      notify('Failed to update product.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Confirm dialogs */}
      {deleteTarget && (
        <ConfirmDialog
          title={`Remove "${deleteTarget.name}"?`}
          message={`This will permanently remove "${deleteTarget.name}" from your collection. This action cannot be undone.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {addConfirm && (
        <ConfirmDialog
          title="Publish new product?"
          message={`This will add "${form.name}" at â‚¹${form.price} to your live collection. Customers will be able to order it immediately.`}
          onConfirm={handleAddConfirmed}
          onCancel={() => setAddConfirm(false)}
        />
      )}
      {editConfirm && (
        <ConfirmDialog
          title={`Save changes to "${form.name}"?`}
          message="Customers will immediately see the updated product details. Verify everything looks correct."
          onConfirm={handleEditConfirmed}
          onCancel={() => setEditConfirm(false)}
        />
      )}

      {/* Success banner */}
      {successMsg && (
        <div style={{ backgroundColor: '#C8D8C0', borderRadius: 12, padding: '0.75rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CrochetFlower size={18} color="#3A6B3A" />
          <span style={{ color: '#3A6B3A', fontWeight: 600, fontSize: '0.88rem' }}>{successMsg}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2E1D15' }}>Products</h1>
          <p style={{ color: '#7A6058', fontSize: '0.85rem', marginTop: 4 }}>{loading ? 'Loading…' : `${productList.length} products in collection`}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editTarget && (
            <button onClick={closeEdit} style={{ backgroundColor: '#F7F3EC', color: '#7A6058', fontWeight: 600, padding: '0.6rem 1.25rem', borderRadius: 50, border: '1.5px solid #EDD4D4', cursor: 'pointer', fontSize: '0.88rem' }}>
              âœ• Cancel Edit
            </button>
          )}
          <button
            onClick={() => { setShowAddForm(v => !v); if (editTarget) closeEdit() }}
            style={{ backgroundColor: showAddForm ? '#F7F3EC' : '#C97B63', color: showAddForm ? '#7A6058' : '#FFFDF8', fontWeight: 600, padding: '0.6rem 1.5rem', borderRadius: 50, border: showAddForm ? '1.5px solid #EDD4D4' : 'none', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {showAddForm ? 'âœ• Cancel' : '+ Add New Product'}
          </button>
        </div>
      </div>

      {/* Edit product form */}
      {editTarget && !showAddForm && (
        <div style={{ backgroundColor: '#FDF5EC', borderRadius: 20, border: '2px solid #C97B63', padding: '1.75rem', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#C97B63' }} />
            <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, color: '#2E1D15', fontSize: '1.1rem' }}>Editing: {editTarget.name}</h3>
          </div>
          <ProductForm
            form={form} setForm={setForm}
            selectedColors={selectedColors} setSelectedColors={setSelectedColors}
            previewImg={previewImg} setPreviewImg={setPreviewImg}
            dragOver={dragOver} setDragOver={setDragOver}
            onSubmit={() => { if (!form.name || !form.price || !form.category) return; setEditConfirm(true) }}
            submitLabel="Save Changes â†’"
          />
        </div>
      )}

      {/* Add product form */}
      {showAddForm && !editTarget && (
        <div style={{ backgroundColor: '#F7F3EC', borderRadius: 20, border: '1px solid #EDD4D4', padding: '1.75rem', marginBottom: 28 }}>
          <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, color: '#2E1D15', fontSize: '1.15rem', marginBottom: '1.25rem' }}>Add New Product</h3>
          <ProductForm
            form={form} setForm={setForm}
            selectedColors={selectedColors} setSelectedColors={setSelectedColors}
            previewImg={previewImg} setPreviewImg={setPreviewImg}
            dragOver={dragOver} setDragOver={setDragOver}
            onSubmit={() => { if (!form.name || !form.price || !form.category) return; setAddConfirm(true) }}
            submitLabel="Publish Product â†’"
          />
        </div>
      )}

      {/* Product grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {productList.map(p => (
          <div key={p.id} style={{ backgroundColor: '#F7F3EC', borderRadius: 20, overflow: 'hidden', border: '1px solid #EDD4D4' }}>
            <div style={{ position: 'relative', aspectRatio: '4/5', backgroundColor: '#EDD4D4', overflow: 'hidden' }}>
              <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {p.badge && (
                <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#C97B63', color: '#FFFDF8', fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 50 }}>{p.badge}</span>
              )}
            </div>
            <div style={{ padding: '1rem' }}>
              <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 600, fontSize: '0.95rem', color: '#2E1D15', marginBottom: 2 }}>{p.name}</p>
              <p style={{ color: '#7A6058', fontSize: '0.75rem', marginBottom: 4 }}>{p.category}</p>
              <p style={{ color: '#C97B63', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>â‚¹{p.price}</p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {p.colors.slice(0, 3).map(c => (
                  <span key={c} style={{ fontSize: '0.65rem', color: '#8B6B5C', backgroundColor: '#FFFDF8', padding: '0.1rem 0.4rem', borderRadius: 4, border: '1px solid #EDD4D4' }}>{c}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openEdit(p)}
                  style={{ flex: 1, padding: '0.45rem', borderRadius: 8, border: editTarget?.id === p.id ? '1.5px solid #C97B63' : '1px solid #EDD4D4', backgroundColor: editTarget?.id === p.id ? '#FDF0EC' : '#FFFDF8', color: editTarget?.id === p.id ? '#C97B63' : '#7A6058', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  {editTarget?.id === p.id ? 'âœŽ Editing' : 'Edit'}
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  style={{ flex: 1, padding: '0.45rem', borderRadius: 8, border: '1px solid #EDD4D4', backgroundColor: '#FDF0EC', color: '#A86248', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Remove
                </button>
              </div>
              {p.stock !== undefined && (
                <p style={{ fontSize: '0.68rem', color: p.stock <= 2 ? '#A86248' : '#7A6058', marginTop: '0.4rem', fontWeight: p.stock <= 2 ? 600 : 400 }}>
                  {p.stock <= 0 ? 'âš  Out of stock' : `${p.stock} available`}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// â”€â”€ Main AdminDashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AdminDashboard({ navigate, onLogout, loginCount = 0 }: { navigate: Navigate; onLogout: () => void; loginCount?: number }) {
  const [section, setSection] = useState<AdminSection>('dashboard')
  const [toast, setToast] = useState('')

  function notify(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFFDF8' }}>
      <Sidebar section={section} setSection={setSection} navigate={navigate} onLogout={onLogout} />

      <div style={{ marginLeft: 220, flex: 1 }}>
        {/* Top header */}
        <header style={{ height: 56, borderBottom: '1px solid #EDD4D4', backgroundColor: '#FFFDF8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 40, gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#2E1D15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#D8A7A7' }}>A</div>
          <span style={{ fontSize: '0.82rem', color: '#2E1D15', fontWeight: 500 }}>Admin</span>
        </header>

        <div style={{ padding: '2rem' }}>
          {section === 'dashboard' && <DashboardSection setSection={setSection} loginCount={loginCount} />}
          {section === 'orders' && <OrdersSection notify={notify} />}
          {section === 'products' && <ProductsSection notify={notify} />}
          {section === 'custom' && <CustomRequestsSection notify={notify} />}
        </div>
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            backgroundColor: '#2E1D15', color: '#FFFDF8', borderRadius: 50,
            padding: '0.65rem 1.5rem', fontSize: '0.85rem', fontWeight: 500,
            boxShadow: '0 8px 24px rgba(46,29,21,0.3)', zIndex: 200,
            animation: 'fadeUp 0.3s ease',
          }}
        >
          {toast}
        </div>
      )}
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
    </div>
  )
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const iStyle: React.CSSProperties = { width: '100%', padding: '0.55rem 0.8rem', borderRadius: 10, border: '1.5px solid #EDD4D4', backgroundColor: '#FFFDF8', color: '#2E1D15', fontSize: '0.85rem', outline: 'none', fontFamily: 'DM Sans, system-ui, sans-serif' }

function PField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#2E1D15', marginBottom: '0.3rem' }}>{label}</label>
      {children}
    </div>
  )
}

function AToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
      <div onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: value ? '#C97B63' : '#EDD4D4', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#FFFDF8', transition: 'left 0.2s' }} />
      </div>
      <span style={{ fontSize: '0.78rem', color: '#7A6058' }}>{label}</span>
    </label>
  )
}

function GridIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function BoxIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> }
function TagIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> }
function HeartIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> }
function ChatIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> }
