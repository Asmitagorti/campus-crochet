import { useState, useEffect } from 'react'
import type { AuthUser } from '../types'
import { YarnBall } from './YarnDecor'

const ADMIN_EMAIL = 'asmileis4evr@gmail.com'
const COLLEGES = ['ACET', 'AEC', 'Aditya Degree College', 'Aditya Pharmacy College', 'Other Aditya institution']
const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'MBA', 'MCA', 'B.Pharm', 'Other']
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG']

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

type LoginStep = 'email' | 'otp' | 'details'

interface Props {
  mode: 'toast' | 'modal'
  onLogin: (user: AuthUser) => void
  onDismiss: () => void
}

export default function LoginModal({ mode, onLogin, onDismiss }: Props) {
  const [showForm, setShowForm] = useState(mode === 'modal')
  const [step, setStep] = useState<LoginStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [sending, setSending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  // Details form
  const [details, setDetails] = useState({ name: '', college: '', department: '', year: '', phone: '' })
  const [detailError, setDetailError] = useState('')

  useEffect(() => { if (mode === 'modal') setShowForm(true) }, [mode])

  // Prevent body scroll when modal open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [showForm])

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email)) return
    setSending(true)
    const code = generateOTP()
    setGeneratedOtp(code)
    const adminMode = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
    setIsAdmin(adminMode)
    setTimeout(() => {
      setSending(false)
      setOtpSent(true)
      setResendTimer(60)
      setStep('otp')
    }, 900)
  }

  function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    if (otp.trim() !== generatedOtp) {
      setOtpError('Incorrect OTP. Please try again.')
      return
    }
    setOtpError('')
    if (isAdmin) {
      onLogin({ username: email, role: 'admin', name: 'Admin', email })
    } else {
      setStep('details')
    }
  }

  function handleDetails(e: React.FormEvent) {
    e.preventDefault()
    if (!details.name.trim()) { setDetailError('Please enter your name.'); return }
    if (!details.college) { setDetailError('Please select your college.'); return }
    if (!details.phone.trim() || details.phone.length < 10) { setDetailError('Please enter a valid phone number.'); return }
    setDetailError('')
    const parts = email.split('@')
    onLogin({
      username: parts[0],
      role: 'student',
      name: details.name.trim(),
      email,
      college: details.college,
      department: details.department || undefined,
      year: details.year || undefined,
      phone: details.phone.trim(),
    })
  }

  function handleResend() {
    if (resendTimer > 0) return
    const code = generateOTP()
    setGeneratedOtp(code)
    setOtp('')
    setOtpError('')
    setResendTimer(60)
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  if (mode === 'toast' && !showForm) {
    return (
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 90, display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#2E1D15', color: '#F7F3EC', borderRadius: 50, padding: '0.75rem 1.25rem 0.75rem 1rem', boxShadow: '0 8px 32px rgba(46,29,21,0.28)', whiteSpace: 'nowrap', animation: 'slideUp 0.35s ease' }}>
        <YarnBall size={24} color="#D8A7A7" />
        <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Sign in to place orders 🧶</span>
        <button onClick={() => setShowForm(true)} style={{ backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 600, padding: '0.4rem 1rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.82rem', marginLeft: 4 }}>
          Sign in
        </button>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#B88080', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0 0.25rem' }}>×</button>
        <style>{`@keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
      </div>
    )
  }

  // ── Modal overlay ─────────────────────────────────────────────────────────
  return (
    <>
      <div
        onClick={onDismiss}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(46,29,21,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(2px)', animation: 'fadeIn 0.2s ease' }}
      >
        <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#FFFDF8', borderRadius: 24, padding: '2.25rem', width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(46,29,21,0.2)', position: 'relative', animation: 'popIn 0.25s ease', maxHeight: '90vh', overflowY: 'auto' }}>
          <button onClick={onDismiss} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#7A6058', fontSize: '1.25rem', lineHeight: 1, zIndex: 1 }}>×</button>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <YarnBall size={28} color="#C97B63" />
            <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2E1D15' }}>Campus Crochet</span>
          </div>

          {/* Step: Email */}
          {step === 'email' && (
            <>
              <h2 style={h2St}>Sign in with college email</h2>
              <p style={subSt}>Enter your college email to receive a one-time password.</p>

              <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1.25rem' }}>
                <div>
                  <label style={labelSt}>College Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@college.ac.in"
                    required
                    autoFocus
                    style={inputSt}
                    onFocus={e => e.target.style.borderColor = '#C97B63'}
                    onBlur={e => e.target.style.borderColor = '#EDD4D4'}
                  />
                </div>

                <button type="submit" disabled={sending || !isValidEmail(email)} style={btnSt(sending || !isValidEmail(email))}>
                  {sending ? 'Sending OTP...' : 'Send OTP →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', color: '#B88080', fontSize: '0.75rem', marginTop: '1.25rem', fontFamily: 'Caveat, cursive' }}>
                For students of Aditya institutions, Surampalem 🌸
              </p>
            </>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <>
              <h2 style={h2St}>Enter your OTP</h2>
              <p style={subSt}>
                A 6-digit code was sent to <strong style={{ color: '#2E1D15' }}>{email}</strong>
              </p>

              {/* Dev banner — shows OTP for demo */}
              <div style={{ backgroundColor: '#F0F7FF', borderRadius: 10, padding: '0.6rem 0.85rem', border: '1px solid #BFD7F5', marginTop: '0.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem' }}>📧</span>
                <span style={{ fontSize: '0.72rem', color: '#3A5F8A' }}>Demo mode · Your OTP: <strong style={{ fontFamily: 'monospace', letterSpacing: '0.1em', fontSize: '0.85rem' }}>{generatedOtp}</strong></span>
              </div>

              <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1rem' }}>
                <div>
                  <label style={labelSt}>6-digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError('') }}
                    placeholder="000000"
                    autoFocus
                    style={{ ...inputSt, textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.25rem', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#C97B63'}
                    onBlur={e => e.target.style.borderColor = '#EDD4D4'}
                  />
                </div>

                {otpError && <ErrorBox msg={otpError} />}

                <button type="submit" disabled={otp.length !== 6} style={btnSt(otp.length !== 6)}>
                  {isAdmin ? 'Verify & Enter Admin Panel →' : 'Verify & Continue →'}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button onClick={() => { setStep('email'); setOtp(''); setOtpError(''); setOtpSent(false) }} style={{ color: '#7A6058', fontSize: '0.78rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Change email
                </button>
                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  style={{ color: resendTimer > 0 ? '#B88080' : '#C97B63', fontSize: '0.78rem', background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer', fontWeight: 500 }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}

          {/* Step: Details (student only) */}
          {step === 'details' && (
            <>
              <h2 style={h2St}>Complete your profile</h2>
              <p style={subSt}>Fill in your details so we can personalise your order experience.</p>

              <form onSubmit={handleDetails} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1.25rem' }}>
                <div>
                  <label style={labelSt}>Full Name *</label>
                  <input type="text" value={details.name} onChange={e => setDetails(d => ({ ...d, name: e.target.value }))} placeholder="Your name" required style={inputSt} onFocus={e => e.target.style.borderColor = '#C97B63'} onBlur={e => e.target.style.borderColor = '#EDD4D4'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={labelSt}>College *</label>
                    <select value={details.college} onChange={e => setDetails(d => ({ ...d, college: e.target.value }))} required style={inputSt}>
                      <option value="">Select</option>
                      {COLLEGES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelSt}>Department</label>
                    <select value={details.department} onChange={e => setDetails(d => ({ ...d, department: e.target.value }))} style={inputSt}>
                      <option value="">Select</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={labelSt}>Year</label>
                    <select value={details.year} onChange={e => setDetails(d => ({ ...d, year: e.target.value }))} style={inputSt}>
                      <option value="">Select</option>
                      {YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelSt}>Phone *</label>
                    <input type="tel" value={details.phone} onChange={e => setDetails(d => ({ ...d, phone: e.target.value.replace(/\D/g, '') }))} placeholder="10-digit number" maxLength={10} style={inputSt} onFocus={e => e.target.style.borderColor = '#C97B63'} onBlur={e => e.target.style.borderColor = '#EDD4D4'} />
                  </div>
                </div>

                {detailError && <ErrorBox msg={detailError} />}

                <button type="submit" style={btnSt(false)}>
                  Create Account & Sign In →
                </button>
              </form>
            </>
          )}

          {/* Step indicator dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: '1.5rem' }}>
            {(['email', 'otp', 'details'] as LoginStep[]).map(s => (
              <div key={s} style={{ width: s === step ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: s === step ? '#C97B63' : '#EDD4D4', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      {otpSent && false && <span />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ backgroundColor: '#FDF0EC', borderRadius: 10, padding: '0.5rem 0.8rem', border: '1px solid #EDD4D4', fontSize: '0.78rem', color: '#A86248', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <span>⚠</span> {msg}
    </div>
  )
}

const h2St: React.CSSProperties = { fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#2E1D15', marginBottom: '0.3rem' }
const subSt: React.CSSProperties = { color: '#7A6058', fontSize: '0.82rem', lineHeight: 1.5 }
const labelSt: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#2E1D15', marginBottom: '0.3rem' }
const inputSt: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: 12, border: '1.5px solid #EDD4D4', backgroundColor: '#F7F3EC', color: '#2E1D15', fontSize: '0.88rem', outline: 'none', fontFamily: 'DM Sans, system-ui, sans-serif', transition: 'border-color 0.2s', boxSizing: 'border-box' }
function btnSt(disabled: boolean): React.CSSProperties {
  return { backgroundColor: disabled ? '#EDD4D4' : '#C97B63', color: disabled ? '#B88080' : '#FFFDF8', fontWeight: 600, padding: '0.8rem', borderRadius: 50, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.92rem', boxShadow: disabled ? 'none' : '0 4px 14px rgba(201,123,99,0.28)', transition: 'all 0.2s', width: '100%' }
}
