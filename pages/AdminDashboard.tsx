import { useState } from 'react'
import type { Navigate, Product } from '../types'
import { products as initialProducts } from '../data/products'
import { YarnBall, CrochetFlower } from '../components/YarnDecor'

type AdminSection = 'dashboard' | 'orders' | 'products' | 'past-creations'

// ── Full order dataset ──────────────────────────────────────────────────────
const ALL_ORDERS = [
  { id: 'ORD-001', product: 'Daisy Scrunchie', customer: 'Ananya Reddy', college: 'ACET', status: 'completed', date: 'Aug 12, 2026', amount: 120, color: 'Sage Green' },
  { id: 'ORD-002', product: 'Flower Keychain', customer: 'Priya Srinivas', college: 'AEC', status: 'completed', date: 'Aug 5, 2026', amount: 85, color: 'Lavender' },
  { id: 'ORD-003', product: 'Mini Tote Bag', customer: 'Divya Lakshmi', college: 'Aditya Degree College', status: 'completed', date: 'Jul 28, 2026', amount: 350, color: 'Natural Cream' },
  { id: 'ORD-004', product: 'Pastel Phone Charm', customer: 'Kavya Mohan', college: 'ACET', status: 'completed', date: 'Jul 20, 2026', amount: 150, color: 'Blush Pink' },
  { id: 'ORD-005', product: 'Mini Tote Bag', customer: 'Sneha Teja', college: 'Aditya Degree College', status: 'quality_check', date: 'Jul 12, 2026', amount: 350, color: 'Sage Green' },
  { id: 'ORD-006', product: 'Flower Keychain', customer: 'Meghana Rao', college: 'ACET', status: 'yarn_selected', date: 'Jul 15, 2026', amount: 85, color: 'White' },
  { id: 'ORD-007', product: 'Daisy Scrunchie', customer: 'Meera Sharma', college: 'AEC', status: 'payment_received', date: 'Jul 18, 2026', amount: 120, color: 'Dusty Rose' },
  { id: 'ORD-008', product: 'Pastel Phone Charm', customer: 'Lasya Patel', college: 'ACET', status: 'crocheting', date: 'Jul 19, 2026', amount: 150, color: 'Lavender' },
  { id: 'ORD-009', product: 'Heart Coaster Set', customer: 'Sravani K.', college: 'AEC', status: 'ready', date: 'Jul 21, 2026', amount: 180, color: 'Rose & Cream' },
  { id: 'ORD-010', product: 'Sunflower Bookmark', customer: 'Bhavana M.', college: 'Aditya Pharmacy College', status: 'crocheting', date: 'Jul 21, 2026', amount: 70, color: 'Sunflower Yellow' },
]

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

// ── Confirmation dialog ──────────────────────────────────────────────────────
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

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ section, setSection, navigate, onLogout }: { section: AdminSection; setSection: (s: AdminSection) => void; navigate: Navigate; onLogout: () => void }) {
  const items: { key: AdminSection; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <GridIcon /> },
    { key: 'orders', label: 'All Orders', icon: <BoxIcon /> },
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

// ── Dashboard Overview ────────────────────────────────────────────────────────
function DashboardSection({ setSection, products: _products, loginCount = 0 }: { setSection: (s: AdminSection) => void; products: Product[]; loginCount?: number }) {
  const totalRevenue = ALL_ORDERS.reduce((s, o) => s + o.amount, 0)
  const completedOrders = ALL_ORDERS.filter(o => o.status === 'completed')
  const activeOrders = ALL_ORDERS.filter(o => o.status !== 'completed')
  const pendingOrders = ALL_ORDERS.filter(o => ['payment_received', 'yarn_selected'].includes(o.status))

  // Most ordered product
  const productCount: Record<string, number> = {}
  ALL_ORDERS.forEach(o => { productCount[o.product] = (productCount[o.product] ?? 0) + 1 })
  const mostOrdered = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]

  // Revenue by product
  const revenueByProduct: Record<string, number> = {}
  ALL_ORDERS.forEach(o => { revenueByProduct[o.product] = (revenueByProduct[o.product] ?? 0) + o.amount })
  const topRevenue = Object.entries(revenueByProduct).sort((a, b) => b[1] - a[1])

  // Orders by college
  const collegeCount: Record<string, number> = {}
  ALL_ORDERS.forEach(o => { collegeCount[o.college] = (collegeCount[o.college] ?? 0) + 1 })

  const stats = [
    { label: 'Total Orders', value: ALL_ORDERS.length, sub: `${completedOrders.length} completed`, color: '#D8A7A7', icon: '📦' },
    { label: 'Active Orders', value: activeOrders.length, sub: `${pendingOrders.length} pending start`, color: '#FDE9CC', icon: '🪡' },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'all time', color: '#C8D8C0', icon: '💚' },
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
        {/* Most ordered + top revenue */}
        <div style={{ backgroundColor: '#F7F3EC', borderRadius: 18, padding: '1.4rem', border: '1px solid #EDD4D4' }}>
          <p style={{ fontWeight: 700, color: '#2E1D15', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🏆 Revenue by Product
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {topRevenue.map(([product, revenue]) => {
              const pct = Math.round((revenue / totalRevenue) * 100)
              return (
                <div key={product}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                    <span style={{ color: '#2E1D15', fontWeight: product === mostOrdered[0] ? 700 : 400 }}>{product}</span>
                    <span style={{ color: '#C97B63', fontWeight: 600 }}>₹{revenue}</span>
                  </div>
                  <div style={{ height: 5, backgroundColor: '#EDD4D4', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: product === mostOrdered[0] ? '#C97B63' : '#D8A7A7', borderRadius: 10, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Orders by college */}
        <div style={{ backgroundColor: '#F7F3EC', borderRadius: 18, padding: '1.4rem', border: '1px solid #EDD4D4' }}>
          <p style={{ fontWeight: 700, color: '#2E1D15', fontSize: '0.9rem', marginBottom: '1rem' }}>🏫 Orders by College</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {Object.entries(collegeCount).sort((a, b) => b[1] - a[1]).map(([college, count]) => (
              <div key={college} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#7A6058', fontSize: '0.82rem' }}>{college}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ height: 5, width: count * 18, backgroundColor: '#A8B8A0', borderRadius: 10 }} />
                  <span style={{ color: '#2E1D15', fontWeight: 600, fontSize: '0.82rem' }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most ordered callout */}
      <div style={{ backgroundColor: '#2E1D15', borderRadius: 18, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 28 }}>
        <CrochetFlower size={28} color="#D8A7A7" />
        <div>
          <p style={{ color: '#B88080', fontSize: '0.8rem' }}>Most ordered product</p>
          <p style={{ color: '#F7F3EC', fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '1.1rem' }}>
            {mostOrdered[0]} — {mostOrdered[1]} orders
          </p>
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ backgroundColor: '#F7F3EC', borderRadius: 18, border: '1px solid #EDD4D4', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #EDD4D4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: 700, color: '#2E1D15', fontSize: '0.95rem' }}>Recent Orders</p>
          <button onClick={() => setSection('orders')} style={{ color: '#C97B63', fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>View all →</button>
        </div>
        <OrderTable orders={ALL_ORDERS.slice(0, 5)} showActions={false} />
      </div>
    </div>
  )
}

// ── Orders Table ─────────────────────────────────────────────────────────────
function OrderTable({ orders, showActions }: { orders: typeof ALL_ORDERS; showActions: boolean }) {
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
            const sc = STATUS_META[o.status]
            return (
              <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid #EDD4D4' : 'none' }}>
                <td style={{ padding: '0.8rem 1.25rem', fontSize: '0.8rem', color: '#2E1D15', fontWeight: 500, whiteSpace: 'nowrap' }}>{o.id}</td>
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
                    <select defaultValue={o.status} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: 8, border: '1px solid #EDD4D4', backgroundColor: '#FFFDF8', color: '#2E1D15', cursor: 'pointer', outline: 'none' }}>
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

// ── All Orders Section ────────────────────────────────────────────────────────
function OrdersSection() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = ALL_ORDERS.filter(o => {
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
          <p style={{ color: '#7A6058', fontSize: '0.85rem', marginTop: 4 }}>{filtered.length} orders · ₹{totalRevenue.toLocaleString('en-IN')} total</p>
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
          { label: 'Revenue shown', value: `₹${totalRevenue.toLocaleString('en-IN')}` },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#F7F3EC', borderRadius: 14, padding: '1rem 1.25rem', border: '1px solid #EDD4D4' }}>
            <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#2E1D15' }}>{s.value}</p>
            <p style={{ color: '#7A6058', fontSize: '0.75rem', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#F7F3EC', borderRadius: 18, border: '1px solid #EDD4D4', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#7A6058' }}>
            <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.1rem', color: '#2E1D15' }}>No orders found</p>
          </div>
        ) : (
          <OrderTable orders={filtered} showActions={true} />
        )}
      </div>
    </div>
  )
}

// ── Shared Product Form ───────────────────────────────────────────────────────
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
        <p style={{ color: '#7A6058', fontSize: '0.7rem', textAlign: 'center' }}>4:5 ratio · PNG, JPG, WEBP</p>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <PField label="Product name *">
            <input type="text" placeholder="e.g. Daisy Scrunchie" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={iStyle} />
          </PField>
          <PField label="Price (₹) *">
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

// ── Products Section ──────────────────────────────────────────────────────────
const BLANK_FORM: FormState = { name: '', shortDesc: '', description: '', price: '', category: '', processingTime: '3–5 working days', care: '', stock: '', active: true, featured: false }

function ProductsSection() {
  const [productList, setProductList] = useState<Product[]>(initialProducts)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [addConfirm, setAddConfirm] = useState(false)
  const [editConfirm, setEditConfirm] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [form, setForm] = useState(BLANK_FORM)

  function showSuccess(msg: string) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500) }

  function openEdit(p: Product) {
    setEditTarget(p)
    setForm({ name: p.name, shortDesc: '', description: p.description, price: String(p.price), category: p.category, processingTime: '3–5 working days', care: p.care, stock: p.stock ? String(p.stock) : '', active: true, featured: !!p.badge })
    setSelectedColors(p.colors)
    setPreviewImg(p.image)
    setShowAddForm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeEdit() { setEditTarget(null); setForm(BLANK_FORM); setSelectedColors([]); setPreviewImg(null) }

  function handleDeleteConfirmed() {
    if (!deleteTarget) return
    setProductList(l => l.filter(p => p.id !== deleteTarget.id))
    setDeleteTarget(null)
    showSuccess(`"${deleteTarget.name}" has been removed from the collection.`)
  }

  function handleAddConfirmed() {
    if (!form.name || !form.price || !form.category) return
    const newProduct: Product = {
      id: String(Date.now()),
      name: form.name,
      price: Number(form.price),
      category: form.category,
      colors: selectedColors.length > 0 ? selectedColors : ['Natural'],
      image: previewImg ?? 'https://images.unsplash.com/photo-1700171394718-2457b1190444?w=600&h=750&fit=crop&auto=format',
      badge: form.featured ? 'Featured' : undefined,
      description: form.description || form.shortDesc,
      care: form.care || 'Hand wash in cold water. Lay flat to dry.',
      stock: form.stock ? Number(form.stock) : undefined,
    }
    setProductList(l => [newProduct, ...l])
    setShowAddForm(false)
    setForm(BLANK_FORM)
    setSelectedColors([])
    setPreviewImg(null)
    setAddConfirm(false)
    showSuccess(`"${newProduct.name}" has been added to the collection!`)
  }

  function handleEditConfirmed() {
    if (!editTarget || !form.name || !form.price || !form.category) return
    setProductList(l => l.map(p => p.id === editTarget.id ? {
      ...p,
      name: form.name,
      price: Number(form.price),
      category: form.category,
      colors: selectedColors.length > 0 ? selectedColors : p.colors,
      image: previewImg ?? p.image,
      badge: form.featured ? 'Featured' : undefined,
      description: form.description || p.description,
      care: form.care || p.care,
      stock: form.stock ? Number(form.stock) : undefined,
    } : p))
    setEditConfirm(false)
    closeEdit()
    showSuccess(`"${form.name}" has been updated.`)
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
          message={`This will add "${form.name}" at ₹${form.price} to your live collection. Customers will be able to order it immediately.`}
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
          <p style={{ color: '#7A6058', fontSize: '0.85rem', marginTop: 4 }}>{productList.length} products in collection</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editTarget && (
            <button onClick={closeEdit} style={{ backgroundColor: '#F7F3EC', color: '#7A6058', fontWeight: 600, padding: '0.6rem 1.25rem', borderRadius: 50, border: '1.5px solid #EDD4D4', cursor: 'pointer', fontSize: '0.88rem' }}>
              ✕ Cancel Edit
            </button>
          )}
          <button
            onClick={() => { setShowAddForm(v => !v); if (editTarget) closeEdit() }}
            style={{ backgroundColor: showAddForm ? '#F7F3EC' : '#C97B63', color: showAddForm ? '#7A6058' : '#FFFDF8', fontWeight: 600, padding: '0.6rem 1.5rem', borderRadius: 50, border: showAddForm ? '1.5px solid #EDD4D4' : 'none', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {showAddForm ? '✕ Cancel' : '+ Add New Product'}
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
            submitLabel="Save Changes →"
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
            submitLabel="Publish Product →"
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
              <p style={{ color: '#C97B63', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>₹{p.price}</p>
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
                  {editTarget?.id === p.id ? '✎ Editing' : 'Edit'}
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
                  {p.stock <= 0 ? '⚠ Out of stock' : `${p.stock} available`}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main AdminDashboard ───────────────────────────────────────────────────────
export default function AdminDashboard({ navigate, onLogout, loginCount = 0 }: { navigate: Navigate; onLogout: () => void; loginCount?: number }) {
  const [section, setSection] = useState<AdminSection>('dashboard')
  const [products] = useState(initialProducts)

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
          {section === 'dashboard' && <DashboardSection setSection={setSection} products={products} loginCount={loginCount} />}
          {section === 'orders' && <OrdersSection />}
          {section === 'products' && <ProductsSection />}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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
