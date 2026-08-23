import { useState } from 'react'
import type { Navigate } from '../types'
import { products, pastCreations } from '../data/products'
import { YarnBall, CrochetFlower, StitchDivider, WavyThread, CheckShieldIcon, MapPinIcon, HeartIcon, YarnIcon } from '../components/YarnDecor'

interface Props {
  navigate: Navigate
  onAddToCart?: (productId: string, color: string, quantity: number) => void
}

function TrustItem({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 px-4">
      <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(255,253,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <p style={{ color: '#FFFDF8', fontWeight: 500, fontSize: '0.9rem' }}>{title}</p>
      <p style={{ color: 'rgba(255,253,248,0.7)', fontSize: '0.78rem' }}>{sub}</p>
    </div>
  )
}

function ProcessStep({ n, title, sub, icon }: { n: number; title: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 flex-1">
      <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#F7F3EC', border: '2px solid #EDD4D4', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {icon}
        <span style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#C97B63', color: '#fff', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {n}
        </span>
      </div>
      <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 600, fontSize: '1rem', color: '#2E1D15' }}>{title}</p>
      <p style={{ color: '#7A6058', fontSize: '0.82rem', lineHeight: 1.5 }}>{sub}</p>
    </div>
  )
}

function PolicyCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#FFFDF8', borderRadius: 16, padding: '1.25rem 1.5rem', border: '1px solid #EDD4D4', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div>
        <p style={{ fontWeight: 600, color: '#2E1D15', fontSize: '0.9rem', marginBottom: '0.35rem' }}>{title}</p>
        <div style={{ color: '#7A6058', fontSize: '0.82rem', lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  )
}

export default function HomePage({ navigate, onAddToCart: _onAddToCart }: Props) {
  const [college, setCollege] = useState('')
  const [addedId, setAddedId] = useState<string | null>(null)

  function handleAddToCart(id: string) {
    setAddedId(id)
    setTimeout(() => setAddedId(null), 2000)
  }

  const featured = products.slice(0, 3)

  return (
    <main style={{ backgroundColor: '#FFFDF8' }}>
      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundColor: '#FFFDF8', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle background yarn balls */}
        <div style={{ position: 'absolute', top: '8%', left: '2%', opacity: 0.25 }}>
          <YarnBall size={120} color="#D8A7A7" />
        </div>
        <div style={{ position: 'absolute', bottom: '12%', right: '3%', opacity: 0.2 }}>
          <YarnBall size={80} color="#A8B8A0" />
        </div>
        <div style={{ position: 'absolute', top: '50%', right: '48%', opacity: 0.12 }}>
          <CrochetFlower size={60} color="#B7A7D8" />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 w-full">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            {/* Left: copy */}
            <div>
              <p style={{ fontFamily: 'Caveat, cursive', color: '#C97B63', fontSize: '1.2rem', marginBottom: '1rem' }}>
                🧶 Made just for you, by a student
              </p>
              <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontWeight: 700, color: '#2E1D15', lineHeight: 1.15, marginBottom: '1.25rem' }}>
                Handmade pieces,<br />
                <em style={{ color: '#C97B63', fontStyle: 'italic' }}>stitched with love.</em>
              </h1>
              <p style={{ color: '#7A6058', fontSize: '1rem', lineHeight: 1.8, maxWidth: 420, marginBottom: '2rem' }}>
                Every piece is crocheted by hand using locally sourced yarn — made only after you order, and carefully checked before handover. This is not mass production. This is craft.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => navigate('catalog')}
                  style={{ backgroundColor: '#C97B63', color: '#FFFDF8', padding: '0.75rem 1.75rem', borderRadius: 50, fontWeight: 500, fontSize: '0.95rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(201,123,99,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#A86248')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C97B63')}
                >
                  Explore Collection
                </button>
                <button
                  onClick={() => navigate('catalog')}
                  style={{ backgroundColor: 'transparent', color: '#8B6B5C', padding: '0.75rem 1.75rem', borderRadius: 50, fontWeight: 500, fontSize: '0.95rem', border: '1.5px solid #C9B4AC', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F3EC'; e.currentTarget.style.borderColor = '#8B6B5C' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#C9B4AC' }}
                >
                  Custom Order
                </button>
              </div>

              <p style={{ fontFamily: 'Caveat, cursive', color: '#B88080', fontSize: '1.05rem' }}>
                Made after you order · 3–5 working days
              </p>
            </div>

            {/* Right: image */}
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 24, overflow: 'hidden', aspectRatio: '4/5', backgroundColor: '#F7F3EC', boxShadow: '0 24px 60px rgba(46,29,21,0.12)' }}>
                <img
                  src="https://images.unsplash.com/photo-1700171518313-5dd219beaaa6?w=700&h=875&fit=crop&auto=format"
                  alt="Handcrafted crochet flowers"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {/* Floating tag */}
              <div style={{ position: 'absolute', bottom: 24, left: -24, backgroundColor: '#FFFDF8', borderRadius: 16, padding: '0.75rem 1rem', boxShadow: '0 8px 24px rgba(46,29,21,0.12)', border: '1px solid #EDD4D4', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <HeartIcon size={18} color="#D8A7A7" />
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#7A6058' }}>Latest creation</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2E1D15' }}>Daisy Scrunchie · ₹120</p>
                </div>
              </div>
              {/* Top accent */}
              <div style={{ position: 'absolute', top: -16, right: -16 }}>
                <CrochetFlower size={48} color="#D8A7A7" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section style={{ backgroundColor: '#A8B8A0', padding: '2rem 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <TrustItem icon={<HeartIcon size={22} color="#FFFDF8" />} title="Handmade by a student" sub="Every stitch, by hand" />
            <TrustItem icon={<YarnIcon size={22} color="#FFFDF8" />} title="Local yarn" sub="Sourced nearby, made nearby" />
            <TrustItem icon={<CheckShieldIcon size={22} color="#FFFDF8" />} title="85% similarity guarantee" sub="We recreate faithfully" />
            <TrustItem icon={<MapPinIcon size={22} color="#FFFDF8" />} title="Campus pickup only" sub="No delivery, no charges" />
          </div>
        </div>
      </section>

      {/* ── FEATURED COLLECTION ── */}
      <section style={{ padding: '96px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontFamily: 'Caveat, cursive', color: '#C97B63', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Handcrafted with care</p>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#2E1D15', marginBottom: '0.75rem' }}>
              Featured Collection
            </h2>
            <p style={{ color: '#7A6058', maxWidth: 440, margin: '0 auto' }}>
              A small, curated selection — each piece made fresh, only after your order arrives.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {featured.map(p => (
              <div
                key={p.id}
                style={{ backgroundColor: '#F7F3EC', borderRadius: 24, overflow: 'hidden', border: '1px solid #EDD4D4', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(46,29,21,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                onClick={() => navigate('product', { id: p.id })}
              >
                <div style={{ position: 'relative', aspectRatio: '4/5', backgroundColor: '#EDD4D4', overflow: 'hidden' }}>
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.badge && (
                    <span style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#C97B63', color: '#FFFDF8', fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 50, letterSpacing: '0.04em' }}>
                      {p.badge}
                    </span>
                  )}
                  <span style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#FFFDF8', color: '#7A6058', fontSize: '0.68rem', fontWeight: 500, padding: '0.25rem 0.6rem', borderRadius: 50 }}>
                    Handmade
                  </span>
                  {/* Hover add button */}
                  <button
                    style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2E1D15', color: '#FFFDF8', fontSize: '0.8rem', fontWeight: 500, padding: '0.5rem 1.25rem', borderRadius: 50, border: 'none', cursor: 'pointer', opacity: addedId === p.id ? 1 : 0, transition: 'opacity 0.2s' }}
                    onClick={e => { e.stopPropagation(); handleAddToCart(p.id) }}
                    className="group-hover:opacity-100"
                  >
                    {addedId === p.id ? '✓ Added!' : 'Quick Add'}
                  </button>
                </div>
                <div style={{ padding: 24 }}>
                  <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 600, fontSize: '1.1rem', color: '#2E1D15', marginBottom: 4 }}>{p.name}</p>
                  <p style={{ color: '#7A6058', fontSize: '0.82rem', marginBottom: 12 }}>{p.category}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#C97B63' }}>₹{p.price}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {p.colors.slice(0, 3).map(c => (
                        <span key={c} style={{ fontSize: '0.72rem', color: '#8B6B5C', backgroundColor: '#FFFDF8', padding: '0.15rem 0.4rem', borderRadius: 4, border: '1px solid #EDD4D4' }}>{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button
              onClick={() => navigate('catalog')}
              style={{ color: '#C97B63', fontWeight: 500, fontSize: '0.95rem', background: 'none', border: '1.5px solid #C97B63', padding: '0.7rem 2rem', borderRadius: 50, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#C97B63'; e.currentTarget.style.color = '#FFFDF8' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#C97B63' }}
            >
              View Full Collection →
            </button>
          </div>
        </div>
      </section>

      <StitchDivider className="w-full opacity-40" />

      {/* ── OUR STORY ── */}
      <section style={{ padding: '96px 0', backgroundColor: '#F7F3EC' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 24, overflow: 'hidden', aspectRatio: '4/5', backgroundColor: '#EDD4D4' }}>
                <img
                  src="https://images.unsplash.com/photo-1519412849983-957822373d02?w=600&h=750&fit=crop&auto=format"
                  alt="Student crocheting by hand"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ position: 'absolute', top: -20, left: -20 }}>
                <YarnBall size={60} color="#D8A7A7" />
              </div>
            </div>
            <div>
              <p style={{ fontFamily: 'Caveat, cursive', color: '#A8B8A0', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Our story</p>
              <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#2E1D15', lineHeight: 1.3, marginBottom: '1.25rem' }}>
                Built by a student who never stopped creating with their hands.
              </h2>
              <p style={{ color: '#7A6058', lineHeight: 1.85, marginBottom: '1rem', fontSize: '0.95rem' }}>
                Campus Crochet started as a hobby — a needle, some yarn, and a lot of late nights between classes. What began as small gifts for friends slowly grew into something more. Each piece carries the care and patience of someone who genuinely loves making things.
              </p>
              <p style={{ color: '#7A6058', lineHeight: 1.85, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                This is a passion project, not a mass-production business. Orders are accepted only from fellow students at Aditya institutions — because I believe in personal connections, and I want you to trust who's making your piece.
              </p>
              <blockquote style={{ borderLeft: '3px solid #D8A7A7', paddingLeft: '1.25rem', fontFamily: 'Playfair Display, Georgia, serif', fontStyle: 'italic', color: '#8B6B5C', fontSize: '1.05rem' }}>
                "Every piece is made with the same care I'd put into something for myself."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS TIMELINE ── */}
      <section style={{ padding: '96px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontFamily: 'Caveat, cursive', color: '#C97B63', fontSize: '1.1rem', marginBottom: '0.5rem' }}>How it works</p>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#2E1D15' }}>
              From order to your hands
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 28, left: 'calc(12.5% + 28px)', right: 'calc(12.5% + 28px)', height: 1, borderTop: '2px dashed #EDD4D4', zIndex: 0 }} />

            <ProcessStep
              n={1}
              icon={<YarnIcon size={24} color="#C97B63" />}
              title="Choose a design"
              sub="Browse the collection and pick the piece that speaks to you."
            />
            <ProcessStep
              n={2}
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A8B8A0" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
              title="Pay securely online"
              sub="Full payment via Razorpay before production begins."
            />
            <ProcessStep
              n={3}
              icon={<NeedleStitchIcon />}
              title="I crochet your order"
              sub="Your piece is made fresh — 3 to 5 working days of careful craft."
            />
            <ProcessStep
              n={4}
              icon={<MapPinIcon size={24} color="#C97B63" />}
              title="Meet on campus & collect"
              sub="No delivery. We meet at a common pickup point on campus."
            />
          </div>
        </div>
      </section>

      {/* ── PAST CREATIONS ── */}
      <section style={{ padding: '96px 0', backgroundColor: '#F7F3EC' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontFamily: 'Caveat, cursive', color: '#A8B8A0', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Real completed orders</p>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#2E1D15' }}>
              Past Creations
            </h2>
            <p style={{ color: '#7A6058', marginTop: '0.5rem', maxWidth: 380, margin: '0.5rem auto 0' }}>
              Every card below is a real order that was made, checked, and delivered.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {pastCreations.map(o => (
              <div key={o.id} style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFFDF8', border: '1px solid #EDD4D4', boxShadow: '0 4px 16px rgba(46,29,21,0.04)' }}>
                <div style={{ aspectRatio: '1/1', backgroundColor: '#EDD4D4', overflow: 'hidden' }}>
                  <img src={o.image} alt={o.product} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {['Handmade', 'Completed', 'Real order'].map(b => (
                      <span key={b} style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 50, backgroundColor: b === 'Completed' ? '#C8D8C0' : b === 'Real order' ? '#EDD4D4' : '#D4C8EE', color: b === 'Completed' ? '#3A6B3A' : b === 'Real order' ? '#8B4A3A' : '#4A3A8B' }}>
                        {b}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#2E1D15' }}>{o.product}</p>
                  <p style={{ fontFamily: 'Caveat, cursive', color: '#7A6058', fontSize: '0.9rem', marginTop: 2 }}>
                    {o.color} · {o.college} · {o.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HANDMADE TRUST SECTION ── */}
      <section style={{ padding: '96px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
            {/* Uniqueness */}
            <div style={{ backgroundColor: '#F7F3EC', borderRadius: 24, padding: '2.5rem', border: '1px solid #EDD4D4' }}>
              <CrochetFlower size={36} color="#D8A7A7" />
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#2E1D15', marginTop: '1rem', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                Every piece is handmade — and that makes it unique.
              </h3>
              <p style={{ color: '#7A6058', lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '1rem' }}>
                Slight variations in stitch tension, flower shape, or placement are natural. No two handmade pieces will be perfectly identical.
              </p>
              <p style={{ color: '#7A6058', lineHeight: 1.8, fontSize: '0.9rem' }}>
                These tiny differences are a sign of genuine craftsmanship — and they make each order uniquely yours.
              </p>
            </div>

            {/* 85% guarantee */}
            <div style={{ backgroundColor: '#2E1D15', borderRadius: 24, padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.12 }}>
                <YarnBall size={120} color="#D8A7A7" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <CheckShieldIcon size={32} color="#A8B8A0" />
                <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#F7F3EC' }}>
                  85% Similarity Guarantee
                </span>
              </div>
              <p style={{ color: '#EDD4D4', lineHeight: 1.8, fontSize: '0.92rem', marginBottom: '1.25rem' }}>
                We guarantee that your final product will be at least <strong style={{ color: '#D8A7A7' }}>85% visually similar</strong> to the product shown in the listing photos.
              </p>
              <p style={{ color: '#B88080', lineHeight: 1.8, fontSize: '0.85rem' }}>
                Many people worry about receiving a product that looks nothing like the photos. Every order is made with the listing images as the reference, and we do our best to recreate the same colors, structure, and overall look.
              </p>
              <div style={{ marginTop: '1.5rem', padding: '0.75rem 1.25rem', backgroundColor: 'rgba(168,184,160,0.15)', borderRadius: 12, border: '1px solid rgba(168,184,160,0.3)' }}>
                <p style={{ fontFamily: 'Caveat, cursive', color: '#A8B8A0', fontSize: '1.05rem' }}>
                  Your trust means everything. 🌿
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BEFORE YOU ORDER ── */}
      <section style={{ padding: '96px 0', backgroundColor: '#F7F3EC' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontFamily: 'Caveat, cursive', color: '#C97B63', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Please read this</p>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#2E1D15' }}>
              Before you order
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
            <PolicyCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A8B8A0" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
              title="Who can order?"
            >
              <p>Orders are accepted only from <strong>students of Aditya educational institutions in Surampalem.</strong></p>
              <div style={{ marginTop: '0.6rem' }}>
                <label style={{ fontSize: '0.78rem', color: '#8B6B5C', display: 'block', marginBottom: 4 }}>Your college</label>
                <select
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: 8, border: '1px solid #EDD4D4', backgroundColor: '#FFFDF8', color: '#2E1D15', fontSize: '0.82rem', outline: 'none' }}
                >
                  <option value="">Select your college</option>
                  {['ACET', 'AEC', 'Aditya Degree College', 'Aditya Pharmacy College', 'Other Aditya institution'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </PolicyCard>

            <PolicyCard icon={<MapPinIcon size={20} color="#C97B63" />} title="Campus pickup only">
              <p>No shipping available. No delivery charges. You must meet the creator at a common pickup point on campus after your order is ready.</p>
            </PolicyCard>

            <PolicyCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B7A7D8" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              title="Processing time"
            >
              <p><strong>3–5 working days</strong> after payment is received. Exam periods may slightly affect timelines — I'll keep you informed.</p>
            </PolicyCard>

            <PolicyCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C97B63" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
              title="Payment via Razorpay"
            >
              <p>Full payment must be made online via <strong>Razorpay</strong> before production begins. Cash payments are not accepted.</p>
            </PolicyCard>
          </div>

          <div style={{ backgroundColor: '#FFFDF8', borderRadius: 16, padding: '1.25rem 1.5rem', border: '1px solid #EDD4D4', borderLeft: '3px solid #D8A7A7' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D8A7A7" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p style={{ fontWeight: 600, color: '#2E1D15', fontSize: '0.9rem', marginBottom: '0.25rem' }}>No refund policy</p>
                <p style={{ color: '#7A6058', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  Since each product is made specifically for you, orders cannot be cancelled once production starts. Please review your order carefully before payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CUSTOM CTA ── */}
      <section style={{ padding: '96px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ backgroundColor: '#C97B63', borderRadius: 28, padding: '3.5rem 3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: '3%', top: '20%', opacity: 0.2 }}>
              <YarnBall size={100} color="#FFFDF8" />
            </div>
            <div style={{ position: 'absolute', right: '3%', bottom: '10%', opacity: 0.2 }}>
              <YarnBall size={70} color="#FFFDF8" />
            </div>
            <p style={{ fontFamily: 'Caveat, cursive', color: 'rgba(255,253,248,0.8)', fontSize: '1.15rem', marginBottom: '0.75rem' }}>
              Have something special in mind?
            </p>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#FFFDF8', marginBottom: '0.75rem' }}>
              Request a Custom Piece
            </h2>
            <p style={{ color: 'rgba(255,253,248,0.85)', fontSize: '0.95rem', maxWidth: 440, margin: '0 auto 2rem', lineHeight: 1.7 }}>
              Have a color, design, or idea in mind? Send a message and let's talk about creating something just for you.
            </p>
            <button
              onClick={() => navigate('catalog')}
              style={{ backgroundColor: '#FFFDF8', color: '#C97B63', fontWeight: 600, padding: '0.875rem 2.25rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F3EC'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFDF8'}
            >
              Request a Custom Piece →
            </button>
          </div>
        </div>
      </section>

      <WavyThread color="#EDD4D4" className="w-full" />
    </main>
  )
}

function NeedleStitchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 L12 21" stroke="#D8A7A7" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" />
      <path d="M7 8 C7 8 9.5 6 12 8 C14.5 10 17 8 17 8" stroke="#D8A7A7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M7 13 C7 13 9.5 11 12 13 C14.5 15 17 13 17 13" stroke="#D8A7A7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}
