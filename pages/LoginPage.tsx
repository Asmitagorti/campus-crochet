import { useState } from 'react'
import { YarnBall, CrochetFlower } from '../components/YarnDecor'

interface Props {
  onLogin: (role: 'student' | 'admin') => void
}

const ACCOUNTS = {
  puppy: { password: 'puppy', role: 'student' as const },
  admin: { password: 'admin', role: 'admin' as const },
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const account = ACCOUNTS[username.trim().toLowerCase() as keyof typeof ACCOUNTS]
      if (account && account.password === password) {
        onLogin(account.role)
      } else {
        setError('Incorrect username or password. Please try again.')
      }
      setLoading(false)
    }, 600)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFDF8', display: 'flex', flexDirection: 'column' }}>
      {/* Decorative top band */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, #D8A7A7 0%, #A8B8A0 33%, #B7A7D8 66%, #C97B63 100%)' }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: '5%', left: '5%', opacity: 0.12 }}>
          <YarnBall size={160} color="#D8A7A7" />
        </div>
        <div style={{ position: 'absolute', bottom: '8%', right: '6%', opacity: 0.1 }}>
          <YarnBall size={120} color="#A8B8A0" />
        </div>
        <div style={{ position: 'absolute', top: '40%', right: '12%', opacity: 0.08 }}>
          <CrochetFlower size={80} color="#B7A7D8" />
        </div>
        <div style={{ position: 'absolute', bottom: '20%', left: '10%', opacity: 0.08 }}>
          <CrochetFlower size={60} color="#C97B63" />
        </div>

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <YarnBall size={52} color="#C97B63" />
            </div>
            <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.9rem', fontWeight: 700, color: '#2E1D15', lineHeight: 1.2 }}>
              Campus Crochet
            </h1>
            <p style={{ fontFamily: 'Caveat, cursive', color: '#C97B63', fontSize: '1.05rem', marginTop: '0.35rem' }}>
              Handmade pieces, stitched with love.
            </p>
          </div>

          {/* Card */}
          <div style={{ backgroundColor: '#FFFDF8', borderRadius: 24, border: '1px solid #EDD4D4', padding: '2.25rem', boxShadow: '0 8px 40px rgba(46,29,21,0.08)' }}>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#2E1D15', marginBottom: '0.35rem' }}>
              Sign in
            </h2>
            <p style={{ color: '#7A6058', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
              For students of Aditya educational institutions, Surampalem.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2E1D15', marginBottom: '0.4rem' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: 12, border: `1.5px solid ${error ? '#D8A7A7' : '#EDD4D4'}`, backgroundColor: '#F7F3EC', color: '#2E1D15', fontSize: '0.9rem', outline: 'none', fontFamily: 'DM Sans, system-ui, sans-serif', transition: 'border-color 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = '#C97B63'; setError('') }}
                  onBlur={e => e.target.style.borderColor = error ? '#D8A7A7' : '#EDD4D4'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2E1D15', marginBottom: '0.4rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{ width: '100%', padding: '0.7rem 2.5rem 0.7rem 0.9rem', borderRadius: 12, border: `1.5px solid ${error ? '#D8A7A7' : '#EDD4D4'}`, backgroundColor: '#F7F3EC', color: '#2E1D15', fontSize: '0.9rem', outline: 'none', fontFamily: 'DM Sans, system-ui, sans-serif', transition: 'border-color 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#C97B63'; setError('') }}
                    onBlur={e => e.target.style.borderColor = error ? '#D8A7A7' : '#EDD4D4'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7A6058', display: 'flex', alignItems: 'center' }}
                  >
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ backgroundColor: '#FDF0EC', borderRadius: 10, padding: '0.6rem 0.85rem', border: '1px solid #EDD4D4', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C97B63" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{ color: '#A86248', fontSize: '0.8rem' }}>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: loading ? '#EDD4D4' : '#C97B63', color: loading ? '#B88080' : '#FFFDF8', fontWeight: 600, padding: '0.825rem', borderRadius: 50, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.95rem', transition: 'background-color 0.2s', boxShadow: loading ? 'none' : '0 4px 16px rgba(201,123,99,0.28)', marginTop: '0.25rem' }}
              >
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>
          </div>

          {/* Hint note */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ fontFamily: 'Caveat, cursive', color: '#B88080', fontSize: '0.95rem' }}>
              Orders accepted only from Aditya institutions 🌸
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
