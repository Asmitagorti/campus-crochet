import type { Navigate } from '../types'
import { activeOrders, pastCreations } from '../data/products'
import { YarnBall, CrochetFlower } from '../components/YarnDecor'

const statusSteps = [
  { key: 'payment_received', label: 'Payment received', icon: '💳' },
  { key: 'yarn_selected', label: 'Yarn selected', icon: '🧶' },
  { key: 'crocheting', label: 'Crocheting', icon: '🪡' },
  { key: 'quality_check', label: 'Quality check', icon: '✅' },
  { key: 'ready', label: 'Ready for pickup', icon: '📦' },
  { key: 'completed', label: 'Completed', icon: '🎉' },
]

const statusOrder = statusSteps.map(s => s.key)

export default function CustomerDashboard({ navigate, user: _user }: { navigate: Navigate; user?: { name?: string; rollNumber?: string } | null }) {
  const order = activeOrders[0]
  const currentIdx = statusOrder.indexOf(order.status)

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FFFDF8' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#F7F3EC', borderBottom: '1px solid #EDD4D4', padding: '2.5rem 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '4%', top: '-20%', opacity: 0.15 }}>
          <YarnBall size={120} color="#D8A7A7" />
        </div>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'Caveat, cursive', color: '#C97B63', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Welcome back 🌸</p>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#2E1D15' }}>
            Your Orders
          </h1>
          <p style={{ color: '#7A6058', fontSize: '0.9rem', marginTop: '0.35rem' }}>Track your handmade pieces from queue to campus pickup.</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Active order */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 24 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#A8B8A0', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#2E1D15' }}>Active Order</h2>
          </div>

          <div style={{ backgroundColor: '#F7F3EC', borderRadius: 24, border: '1px solid #EDD4D4', overflow: 'hidden' }}>
            {/* Order header */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '1.5rem', padding: '1.5rem', borderBottom: '1px solid #EDD4D4', alignItems: 'center' }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '4/5', backgroundColor: '#EDD4D4' }}>
                <img src={order.image} alt={order.product} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 600, fontSize: '1.1rem', color: '#2E1D15', marginBottom: 4 }}>{order.product}</p>
                <p style={{ color: '#7A6058', fontSize: '0.82rem' }}>{order.color} · {order.college}</p>
                <p style={{ color: '#7A6058', fontSize: '0.8rem', marginTop: 2 }}>Order #{order.id} · Placed {order.date}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#C97B63' }}>₹{order.price}</p>
                <span style={{ display: 'inline-block', backgroundColor: '#C97B63', color: '#FFFDF8', fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 50, marginTop: 6 }}>
                  In Progress
                </span>
              </div>
            </div>

            {/* Progress tracker */}
            <div style={{ padding: '2rem 2.5rem' }}>
              <p style={{ fontWeight: 600, color: '#2E1D15', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Order progress</p>
              <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                {statusSteps.map((step, i) => {
                  const done = i <= currentIdx
                  const current = i === currentIdx
                  return (
                    <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      {/* Connector line */}
                      {i < statusSteps.length - 1 && (
                        <div style={{ position: 'absolute', top: 20, left: '50%', width: '100%', height: 2, backgroundColor: done && i < currentIdx ? '#A8B8A0' : '#EDD4D4', zIndex: 0 }} />
                      )}
                      {/* Circle */}
                      <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: done ? (current ? '#C97B63' : '#A8B8A0') : '#FFFDF8', border: `2px solid ${done ? (current ? '#C97B63' : '#A8B8A0') : '#EDD4D4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', zIndex: 1, position: 'relative', transition: 'all 0.3s' }}>
                        {done ? (current ? step.icon : '✓') : <span style={{ color: '#C9B4AC', fontSize: '0.75rem' }}>{i + 1}</span>}
                      </div>
                      <p style={{ fontSize: '0.7rem', color: done ? '#2E1D15' : '#C9B4AC', fontWeight: done ? 600 : 400, marginTop: '0.5rem', textAlign: 'center', lineHeight: 1.3 }}>
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Current status message */}
              <div style={{ marginTop: '2rem', backgroundColor: '#FFFDF8', borderRadius: 12, padding: '1rem 1.25rem', border: '1px solid #EDD4D4' }}>
                <p style={{ fontFamily: 'Caveat, cursive', color: '#C97B63', fontSize: '1.1rem' }}>
                  {statusSteps[currentIdx].icon} {statusSteps[currentIdx].label === 'Crocheting' ? "I'm currently crocheting your piece. It's in good hands! 🌸" : `Status: ${statusSteps[currentIdx].label}`}
                </p>
                <p style={{ color: '#7A6058', fontSize: '0.82rem', marginTop: '0.3rem' }}>
                  Estimated ready: {order.date.replace('Jul', 'Jul').replace('Aug', 'Aug')} + 5 days · Campus pickup at main gate
                </p>
              </div>
            </div>

            {/* Pickup instructions */}
            <div style={{ margin: '0 1.5rem 1.5rem', backgroundColor: '#2E1D15', borderRadius: 16, padding: '1.25rem' }}>
              <p style={{ color: '#A8B8A0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>📍 Pickup instructions</p>
              <p style={{ color: '#EDD4D4', fontSize: '0.82rem', lineHeight: 1.7 }}>
                Once your order is ready, you'll be notified via message. Meet at the main gate of your campus at a mutually agreed time. Bring your order ID (#ORD-007) for verification.
              </p>
            </div>
          </div>
        </section>

        {/* Payment status */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#2E1D15', marginBottom: 20 }}>Payment Status</h2>
          <div style={{ backgroundColor: '#F7F3EC', borderRadius: 20, padding: '1.5rem', border: '1px solid #EDD4D4', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#C8D8C0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3A6B3A" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: '#2E1D15', fontSize: '0.9rem' }}>Payment received · ₹{order.price}</p>
              <p style={{ color: '#7A6058', fontSize: '0.82rem', marginTop: 2 }}>Paid via Razorpay on {order.date} · Transaction ID: RZP-2026-8847</p>
            </div>
          </div>
        </section>

        {/* Previous orders */}
        <section>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#2E1D15', marginBottom: 20 }}>Previous Orders</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pastCreations.map(o => (
              <div key={o.id} style={{ backgroundColor: '#F7F3EC', borderRadius: 16, border: '1px solid #EDD4D4', display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: '1rem', padding: '1rem 1.25rem', alignItems: 'center' }}>
                <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '4/5', backgroundColor: '#EDD4D4' }}>
                  <img src={o.image} alt={o.product} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#2E1D15', fontSize: '0.9rem' }}>{o.product}</p>
                  <p style={{ color: '#7A6058', fontSize: '0.78rem', marginTop: 2 }}>{o.color} · {o.college} · {o.date}</p>
                  <p style={{ color: '#7A6058', fontSize: '0.75rem' }}>Order #{o.id}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, color: '#C97B63' }}>₹{o.price}</p>
                  <span style={{ display: 'inline-block', backgroundColor: '#C8D8C0', color: '#3A6B3A', fontSize: '0.68rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: 50, marginTop: 4 }}>
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Browse more CTA */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <CrochetFlower size={32} color="#EDD4D4" />
          <p style={{ color: '#7A6058', fontSize: '0.9rem', margin: '0.75rem 0' }}>Want something new?</p>
          <button
            onClick={() => navigate('catalog')}
            style={{ backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 600, padding: '0.75rem 2rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Browse Collection
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </main>
  )
}
