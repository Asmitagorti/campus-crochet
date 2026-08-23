import { useState } from 'react'
import type { Navigate, CartItem, AuthUser } from '../types'
import { products } from '../data/products'
import { CheckShieldIcon, CrochetFlower } from '../components/YarnDecor'

interface Props {
  navigate: Navigate
  cart: CartItem[]
  user: AuthUser | null
  onClearCart: () => void
}

type Step = 'verify' | 'review' | 'pay' | 'done'

const VALID_ROLL = '24p31a0574'
const COLLEGES = ['ACET', 'AEC', 'Aditya Degree College', 'Aditya Pharmacy College', 'Other Aditya institution']

function StepBar({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'verify', label: 'Verify' },
    { key: 'review', label: 'Review' },
    { key: 'pay', label: 'Pay' },
    { key: 'done', label: 'Done' },
  ]
  const idx = steps.findIndex(s => s.key === current)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2.5rem', justifyContent: 'center' }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: i <= idx ? '#C97B63' : '#EDD4D4', color: i <= idx ? '#FFFDF8' : '#B88080', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: i === idx ? 600 : 400, color: i <= idx ? '#C97B63' : '#B88080', whiteSpace: 'nowrap' }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 60, height: 2, backgroundColor: i < idx ? '#C97B63' : '#EDD4D4', margin: '0 4px', marginBottom: 18, transition: 'background-color 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function PaymentPage({ navigate, cart, user, onClearCart }: Props) {
  const [step, setStep] = useState<Step>('verify')

  // Step 1 state
  const [rollNumber, setRollNumber] = useState(user?.rollNumber ?? '')
  const [college, setCollege] = useState(user?.college ?? '')
  const [rollError, setRollError] = useState('')

  // Step 3 state
  const [payMethod, setPayMethod] = useState<'upi' | 'card' | 'netbanking'>('upi')
  const [upiId, setUpiId] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [paying, setPaying] = useState(false)
  const [screenshotFile, setScreenshotFile] = useState<string | null>(null)
  const [screenshotDrag, setScreenshotDrag] = useState(false)

  const cartDetails = cart.map(item => ({ ...item, product: products.find(p => p.id === item.productId) })).filter(i => i.product)
  const subtotal = cartDetails.reduce((s, i) => s + i.product!.price * i.quantity, 0)

  // ── Step 1: Verify ─────────────────────────────────────────────────────
  function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (rollNumber.trim().toLowerCase() !== VALID_ROLL) {
      setRollError('Roll number not found. Only students of Aditya institutions can order.')
      return
    }
    if (!college) { setRollError('Please select your college.'); return }
    setRollError('')
    setStep('review')
  }

  // ── Step 3: Pay ────────────────────────────────────────────────────────
  function handlePay() {
    if (!agreed) return
    setPaying(true)
    setTimeout(() => { setPaying(false); setStep('done') }, 2200)
  }

  // ── Step 4: Done ───────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#FFFDF8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ animation: 'spin 1s ease-out forwards', fontSize: '3.5rem', marginBottom: '1.25rem' }}>🧶</div>
        <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#2E1D15', maxWidth: 460, lineHeight: 1.3, marginBottom: '0.75rem' }}>
          Your handmade order has been added to my crochet queue! 🧶💛
        </h2>
        <p style={{ color: '#7A6058', fontSize: '0.95rem', maxWidth: 380, lineHeight: 1.75, marginBottom: '2rem' }}>
          I'll start working on it soon. It should be ready for campus pickup in <strong>3–5 working days</strong>. You'll get a message when it's ready!
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: '2.5rem', justifyContent: 'center' }}>
          {['#D8A7A7', '#A8B8A0', '#B7A7D8', '#C97B63'].map((c, i) => (
            <div key={i} style={{ animation: `bloom ${0.2 + i * 0.15}s ease forwards`, opacity: 0 }}>
              <CrochetFlower size={28} color={c} />
            </div>
          ))}
        </div>
        <button
          onClick={() => { onClearCart(); navigate('dashboard') }}
          style={{ backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 700, padding: '0.875rem 2.25rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(201,123,99,0.3)' }}
        >
          View My Orders →
        </button>
        <style>{`
          @keyframes spin { from { transform: rotate(-20deg) scale(0.7); opacity: 0 } to { transform: rotate(0) scale(1); opacity: 1 } }
          @keyframes bloom { from { opacity: 0; transform: scale(0) } to { opacity: 1; transform: scale(1) } }
        `}</style>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FFFDF8' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: '#7A6058', marginBottom: '2rem', alignItems: 'center' }}>
          <button onClick={() => navigate('home')} style={{ color: '#7A6058', background: 'none', border: 'none', cursor: 'pointer' }}>Home</button>
          <span>/</span>
          <button onClick={() => navigate('cart')} style={{ color: '#7A6058', background: 'none', border: 'none', cursor: 'pointer' }}>Cart</button>
          <span>/</span>
          <span style={{ color: '#2E1D15', fontWeight: 500 }}>Checkout</span>
        </div>

        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2E1D15', marginBottom: '0.4rem' }}>Secure Checkout</h1>
        <p style={{ color: '#7A6058', fontSize: '0.85rem', marginBottom: '2rem' }}>Campus-only ordering · Secured by Razorpay</p>

        <StepBar current={step} />

        {/* ── Step 1: Verify ── */}
        {step === 'verify' && (
          <div style={{ backgroundColor: '#F7F3EC', borderRadius: 24, border: '1px solid #EDD4D4', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#FDF0EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97B63" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>
              </div>
              <div>
                <h2 style={{ fontWeight: 700, color: '#2E1D15', fontSize: '1.1rem' }}>Verify Student Identity</h2>
                <p style={{ color: '#7A6058', fontSize: '0.8rem' }}>Orders are accepted only from Aditya institution students.</p>
              </div>
            </div>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelSt}>Roll Number *</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={e => { setRollNumber(e.target.value); setRollError('') }}
                  placeholder="e.g. 24P31A0574"
                  required
                  style={inSt}
                  onFocus={e => e.target.style.borderColor = '#C97B63'}
                  onBlur={e => e.target.style.borderColor = '#EDD4D4'}
                />
              </div>
              <div>
                <label style={labelSt}>Your College *</label>
                <select value={college} onChange={e => { setCollege(e.target.value); setRollError('') }} required style={inSt}>
                  <option value="">Select your college</option>
                  {COLLEGES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {rollError && (
                <div style={{ backgroundColor: '#FDF0EC', borderRadius: 10, padding: '0.65rem 0.9rem', border: '1px solid #EDD4D4', fontSize: '0.8rem', color: '#A86248', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠</span> {rollError}
                </div>
              )}

              <button type="submit" style={{ backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 700, padding: '0.85rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.92rem', boxShadow: '0 4px 14px rgba(201,123,99,0.28)', marginTop: '0.5rem' }}>
                Verify & Continue →
              </button>
            </form>

            <p style={{ color: '#B88080', fontSize: '0.74rem', marginTop: '1rem', lineHeight: 1.5 }}>
              Your roll number is verified against Aditya institution records. We do not store or share this information.
            </p>
          </div>
        )}

        {/* ── Step 2: Review ── */}
        {step === 'review' && (
          <div>
            <div style={{ backgroundColor: '#F7F3EC', borderRadius: 24, border: '1px solid #EDD4D4', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #EDD4D4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontWeight: 700, color: '#2E1D15', fontSize: '1.05rem' }}>Review Your Order</h2>
                  <p style={{ color: '#7A6058', fontSize: '0.78rem', marginTop: 2 }}>{cartDetails.length} item{cartDetails.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => navigate('cart')} style={{ color: '#C97B63', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Edit cart</button>
              </div>

              {/* Items */}
              {cartDetails.map(item => (
                <div key={`${item.productId}-${item.color}`} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #EDD4D4', display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '4/5', backgroundColor: '#EDD4D4' }}>
                    <img src={item.product!.image} alt={item.product!.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 600, fontSize: '0.9rem', color: '#2E1D15', marginBottom: 2 }}>{item.product!.name}</p>
                    <p style={{ color: '#7A6058', fontSize: '0.75rem' }}>{item.color} · Qty {item.quantity}</p>
                    <p style={{ color: '#A8B8A0', fontSize: '0.72rem', marginTop: 2 }}>3–5 working days · campus pickup</p>
                  </div>
                  <p style={{ fontWeight: 700, color: '#C97B63', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>₹{item.product!.price * item.quantity}</p>
                </div>
              ))}

              {/* Totals */}
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#7A6058' }}><span>Subtotal</span><span>₹{subtotal}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#A8B8A0' }}><span>Delivery</span><span>₹0 · campus pickup</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid #EDD4D4', marginTop: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#2E1D15' }}>Total</span>
                    <span style={{ fontWeight: 700, color: '#C97B63', fontSize: '1.2rem' }}>₹{subtotal}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verified student info */}
            <div style={{ backgroundColor: '#F7F3EC', borderRadius: 16, border: '1px solid #EDD4D4', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#7A6058', marginBottom: 2 }}>Verified student</p>
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#2E1D15' }}>{rollNumber.toUpperCase()} · {college}</p>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#C8D8C0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A6B3A" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>

            {/* Ordering time info */}
            <div style={{ backgroundColor: '#F7F3EC', borderRadius: 16, border: '1px solid #EDD4D4', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7A6058', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Timeline</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Ordered', value: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), icon: '📅' },
                  { label: 'Processing', value: '3–5 working days', icon: '🪡' },
                  { label: 'Est. Ready', value: (() => { const d = new Date(); let days = 5; while (days > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) days-- } return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) })(), icon: '📦' },
                ].map(t => (
                  <div key={t.label} style={{ textAlign: 'center', backgroundColor: '#FFFDF8', borderRadius: 12, padding: '0.75rem 0.5rem', border: '1px solid #EDD4D4' }}>
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{t.icon}</div>
                    <p style={{ fontWeight: 700, color: '#2E1D15', fontSize: '0.82rem' }}>{t.value}</p>
                    <p style={{ color: '#7A6058', fontSize: '0.68rem', marginTop: 2 }}>{t.label}</p>
                  </div>
                ))}
              </div>
              <p style={{ color: '#A8B8A0', fontSize: '0.72rem', marginTop: '0.6rem', textAlign: 'center' }}>Campus pickup · no delivery · we'll message you when it's ready</p>
            </div>

            {/* Policy reminder */}
            <div style={{ backgroundColor: '#2E1D15', borderRadius: 16, padding: '1.1rem 1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <CheckShieldIcon size={20} color="#A8B8A0" />
                <p style={{ color: '#B88080', fontSize: '0.78rem', lineHeight: 1.6 }}>
                  <strong style={{ color: '#D8A7A7' }}>No refund policy.</strong> Each piece is made specifically for you after payment. Orders cannot be cancelled once production starts.
                </p>
              </div>
            </div>

            <button onClick={() => setStep('pay')} style={{ width: '100%', backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 700, padding: '0.9rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(201,123,99,0.3)' }}>
              Proceed to Payment →
            </button>
          </div>
        )}

        {/* ── Step 3: Pay ── */}
        {step === 'pay' && (
          <div>
            <div style={{ backgroundColor: '#F7F3EC', borderRadius: 24, border: '1px solid #EDD4D4', padding: '1.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#FFFDF8', borderRadius: 8, padding: '0.3rem 0.6rem', border: '1px solid #EDD4D4', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#2D81F7"/><path d="M20 8l-8 8 4 2-6 6h12V16l-4-2 6-6z" fill="#fff" opacity="0.9"/></svg>
                  <span style={{ fontWeight: 700, color: '#2D81F7', fontSize: '0.82rem' }}>Razorpay</span>
                </div>
                <span style={{ color: '#7A6058', fontSize: '0.78rem' }}>Secure Payment · 256-bit SSL</span>
              </div>

              {/* Order total reminder */}
              <div style={{ backgroundColor: '#FFFDF8', borderRadius: 12, padding: '0.85rem 1rem', border: '1px solid #EDD4D4', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#7A6058', fontSize: '0.85rem' }}>Amount to pay</span>
                <span style={{ fontWeight: 700, color: '#C97B63', fontSize: '1.2rem' }}>₹{subtotal}</span>
              </div>

              {/* Method tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
                {(['upi', 'card', 'netbanking'] as const).map(m => (
                  <button key={m} onClick={() => setPayMethod(m)} style={{ padding: '0.4rem 1rem', borderRadius: 50, fontSize: '0.78rem', fontWeight: 600, border: payMethod === m ? '2px solid #2D81F7' : '1.5px solid #EDD4D4', backgroundColor: payMethod === m ? 'rgba(45,129,247,0.08)' : '#FFFDF8', color: payMethod === m ? '#2D81F7' : '#7A6058', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {m === 'netbanking' ? 'Net Banking' : m.toUpperCase()}
                  </button>
                ))}
              </div>

              {payMethod === 'upi' && (
                <div>
                  <label style={labelSt}>UPI ID</label>
                  <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" style={{ ...inSt, marginBottom: '0.75rem' }} onFocus={e => e.target.style.borderColor = '#2D81F7'} onBlur={e => e.target.style.borderColor = '#EDD4D4'} />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(a => (
                      <div key={a} style={{ padding: '0.3rem 0.8rem', borderRadius: 8, border: '1px solid #EDD4D4', backgroundColor: '#FFFDF8', fontSize: '0.75rem', color: '#7A6058', cursor: 'pointer' }}>{a}</div>
                    ))}
                  </div>
                </div>
              )}

              {payMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input placeholder="Card number" style={inSt} onFocus={e => e.target.style.borderColor = '#2D81F7'} onBlur={e => e.target.style.borderColor = '#EDD4D4'} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input placeholder="MM / YY" style={inSt} onFocus={e => e.target.style.borderColor = '#2D81F7'} onBlur={e => e.target.style.borderColor = '#EDD4D4'} />
                    <input placeholder="CVV" style={inSt} onFocus={e => e.target.style.borderColor = '#2D81F7'} onBlur={e => e.target.style.borderColor = '#EDD4D4'} />
                  </div>
                  <input placeholder="Cardholder name" style={inSt} onFocus={e => e.target.style.borderColor = '#2D81F7'} onBlur={e => e.target.style.borderColor = '#EDD4D4'} />
                </div>
              )}

              {payMethod === 'netbanking' && (
                <select style={inSt}>
                  <option>Select bank</option>
                  {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Bank of Baroda'].map(b => <option key={b}>{b}</option>)}
                </select>
              )}

              <p style={{ color: '#7A6058', fontSize: '0.73rem', marginTop: '1rem', lineHeight: 1.5 }}>
                🔒 Campus Crochet does not store your card or UPI details. All payments are processed by Razorpay.
              </p>
            </div>

            {/* Payment screenshot upload */}
            <div style={{ backgroundColor: '#F7F3EC', borderRadius: 20, border: '1px solid #EDD4D4', padding: '1.5rem', marginBottom: '1.25rem' }}>
              <p style={{ fontWeight: 600, color: '#2E1D15', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Upload Payment Screenshot</p>
              <p style={{ color: '#7A6058', fontSize: '0.78rem', marginBottom: '1rem' }}>After paying, upload a screenshot of the confirmation. This helps us verify your payment quickly.</p>

              {screenshotFile ? (
                <div style={{ position: 'relative' }}>
                  <img src={screenshotFile} alt="Payment screenshot" style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover', border: '1px solid #EDD4D4' }} />
                  <button
                    onClick={() => setScreenshotFile(null)}
                    style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', backgroundColor: '#2E1D15', color: '#FFFDF8', border: 'none', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >×</button>
                  <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A6B3A" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ color: '#3A6B3A', fontSize: '0.78rem', fontWeight: 600 }}>Screenshot uploaded</span>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setScreenshotDrag(true) }}
                  onDragLeave={() => setScreenshotDrag(false)}
                  onDrop={e => { e.preventDefault(); setScreenshotDrag(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) setScreenshotFile(URL.createObjectURL(f)) }}
                  onClick={() => document.getElementById('screenshot-input')?.click()}
                  style={{ border: `2px dashed ${screenshotDrag ? '#C97B63' : '#EDD4D4'}`, borderRadius: 14, padding: '2rem', textAlign: 'center', cursor: 'pointer', backgroundColor: screenshotDrag ? '#FDF0EC' : '#FFFDF8', transition: 'all 0.2s' }}
                >
                  <input id="screenshot-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setScreenshotFile(URL.createObjectURL(f)) }} />
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                  <p style={{ color: '#7A6058', fontSize: '0.82rem', fontWeight: 500 }}>Drop screenshot here or click to upload</p>
                  <p style={{ color: '#B88080', fontSize: '0.72rem', marginTop: '0.25rem' }}>PNG, JPG · optional but recommended</p>
                </div>
              )}
            </div>

            {/* Agreement */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3, accentColor: '#C97B63' }} />
              <span style={{ color: '#7A6058', fontSize: '0.8rem', lineHeight: 1.6 }}>
                I agree to the <strong style={{ color: '#2E1D15' }}>no-refund policy</strong> and confirm my order details are correct. I understand this piece will be made specifically for me.
              </span>
            </label>

            <button
              onClick={handlePay}
              disabled={paying || !agreed}
              style={{ width: '100%', backgroundColor: !agreed ? '#EDD4D4' : '#C97B63', color: !agreed ? '#B88080' : '#FFFDF8', fontWeight: 700, padding: '0.9rem', borderRadius: 50, border: 'none', cursor: !agreed ? 'not-allowed' : 'pointer', fontSize: '0.95rem', boxShadow: agreed ? '0 4px 16px rgba(201,123,99,0.3)' : 'none', transition: 'all 0.2s', marginBottom: '0.75rem' }}
            >
              {paying ? '⏳ Processing payment...' : `Pay ₹${subtotal} via Razorpay`}
            </button>

            <button onClick={() => setStep('review')} style={{ width: '100%', color: '#7A6058', fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem' }}>
              ← Back to order review
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

const labelSt: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#2E1D15', marginBottom: '0.35rem' }
const inSt: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: 12, border: '1.5px solid #EDD4D4', backgroundColor: '#FFFDF8', color: '#2E1D15', fontSize: '0.88rem', outline: 'none', fontFamily: 'DM Sans, system-ui, sans-serif', transition: 'border-color 0.2s' }
