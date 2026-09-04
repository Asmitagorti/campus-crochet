import { useState, useRef, useEffect } from 'react'
import type { Navigate, Page, AuthUser, CartItem } from '../types'
import { YarnBall } from './YarnDecor'

interface Props {
  page: Page
  navigate: Navigate
  cart: CartItem[]
  user: AuthUser | null
  onLoginClick: () => void
  onLogout: () => void
}

export default function Navbar({ page, navigate, cart, user, onLoginClick, onLogout }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  // Close profile dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (['admin', 'add-product', 'past-creations'].includes(page)) return null

  const navLinks: { label: string; target: Page }[] = [
    { label: 'Collection', target: 'catalog' },
    { label: 'AI Assistant', target: 'ai-assistant' },
    { label: 'About', target: 'about' },
  ]

  return (
    <header style={{ borderBottom: '1px solid #EDD4D4', backgroundColor: '#FFFDF8' }} className="sticky top-0 z-50">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <button onClick={() => navigate('home')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
          <YarnBall size={26} color="#C97B63" />
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#2E1D15', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
            Campus Crochet
          </span>
        </button>

        {/* Desktop nav links */}
        <nav className="desktop-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          {navLinks.map(l => (
            <button
              key={l.target}
              onClick={() => navigate(l.target)}
              style={{ color: page === l.target ? '#C97B63' : '#7A6058', fontWeight: page === l.target ? 600 : 400, fontSize: '0.88rem', background: 'none', border: 'none', cursor: 'pointer', borderBottom: page === l.target ? '1.5px solid #C97B63' : '1.5px solid transparent', paddingBottom: '2px', transition: 'all 0.15s' }}
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Right: search + profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>

          {/* Search */}
          <button onClick={() => navigate('catalog')} style={{ padding: '0.45rem', borderRadius: 50, color: '#7A6058', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>

          {/* Profile / Sign in */}
          {user ? (
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(v => !v)}
                style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#F7F3EC', border: '1.5px solid #EDD4D4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '0.85rem', color: '#C97B63' }}
                title={user.name || '?'}
              >
                {(user.name?.[0] ?? '?').toUpperCase()}
              </button>

              {profileOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', backgroundColor: '#FFFDF8', borderRadius: 16, border: '1px solid #EDD4D4', boxShadow: '0 8px 32px rgba(46,29,21,0.12)', minWidth: 220, zIndex: 100, overflow: 'hidden', animation: 'fadeIn 0.15s ease' }}>
                  {/* User info */}
                  <div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid #EDD4D4', backgroundColor: '#F7F3EC' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#EDD4D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '0.95rem', color: '#C97B63', flexShrink: 0 }}>
                        {(user.name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#2E1D15', fontSize: '0.88rem' }}>{user.name}</p>
                        {/* {user.rollNumber && (
                          <p style={{ color: '#7A6058', fontSize: '0.72rem', marginTop: 1 }}>{user.rollNumber} · {user.college}</p>
                        )} */}
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.12rem 0.45rem', borderRadius: 50, backgroundColor: user.role === 'admin' ? '#2E1D15' : '#EDD4D4', color: user.role === 'admin' ? '#D8A7A7' : '#8B4A3A', display: 'inline-block', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '0.5rem 0' }}>
                    {user.role === 'admin' && (
                      <DropdownItem icon={<AdminIcon />} label="Admin Panel" onClick={() => { navigate('admin'); setProfileOpen(false) }} />
                    )}
                    <DropdownItem icon={<AIAssistantIcon />} label="AI Assistant" onClick={() => { navigate('ai-assistant'); setProfileOpen(false) }} />
                    <DropdownItem icon={<OrdersIcon />} label="My Orders" onClick={() => { navigate('dashboard'); setProfileOpen(false) }} />
                    <DropdownItem icon={<CartIcon />} label="My Cart" badge={cartCount > 0 ? cartCount : undefined} onClick={() => { navigate('cart'); setProfileOpen(false) }} />
                    <div style={{ borderTop: '1px solid #EDD4D4', margin: '0.4rem 0' }} />
                    <DropdownItem icon={<LogoutIcon />} label="Sign out" onClick={() => { onLogout(); setProfileOpen(false) }} danger />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              style={{ marginLeft: '0.25rem', padding: '0.45rem 1rem', borderRadius: 50, backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 600, fontSize: '0.82rem', border: 'none', cursor: 'pointer', transition: 'background-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A86248'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C97B63'}
            >
              Sign in
            </button>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(v => !v)} style={{ marginLeft: '0.25rem', padding: '0.45rem', color: '#7A6058', background: 'none', border: 'none', cursor: 'pointer' }} className="mobile-menu-btn" aria-label="Toggle menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></> : <><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <nav className={`mobile-nav-links${menuOpen ? ' open' : ''}`}>
        {navLinks.map(l => (
          <button
            key={l.target}
            onClick={() => { navigate(l.target); setMenuOpen(false) }}
          >
            {l.label}
          </button>
        ))}
        {!user && (
          <button onClick={() => { onLoginClick(); setMenuOpen(false) }}>
            Sign in
          </button>
        )}
        {user && (
          <>
            <button onClick={() => { navigate('ai-assistant'); setMenuOpen(false) }}>AI Assistant</button>
            <button onClick={() => { navigate('dashboard'); setMenuOpen(false) }}>My Orders</button>
            <button onClick={() => { navigate('cart'); setMenuOpen(false) }}>My Cart {cartCount > 0 ? `(${cartCount})` : ''}</button>
            {user.role === 'admin' && (
              <button onClick={() => { navigate('admin'); setMenuOpen(false) }}>Admin Panel</button>
            )}
            <button onClick={() => { onLogout(); setMenuOpen(false) }}>Sign out</button>
          </>
        )}
      </nav>

      <style>{`@keyframes fadeIn { from { opacity:0; transform: translateY(-4px) } to { opacity:1; transform: translateY(0) } }`}</style>
    </header>
  )
}

function DropdownItem({ icon, label, onClick, badge, danger }: { icon: React.ReactNode; label: string; onClick: () => void; badge?: number; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: danger ? '#A86248' : '#5A4238', fontSize: '0.85rem', transition: 'background-color 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F3EC'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span style={{ color: danger ? '#A86248' : '#8B6B5C', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{ backgroundColor: '#C97B63', color: '#FFFDF8', fontSize: '0.6rem', fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>
      )}
    </button>
  )
}

function AdminIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function AIAssistantIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg> }
function OrdersIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg> }
function CartIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> }
function LogoutIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
