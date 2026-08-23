import { useState } from 'react'
import type { Navigate } from '../types'
import { pastCreations } from '../data/products'
import { YarnBall, CrochetFlower } from '../components/YarnDecor'

const refImages = [
  'https://images.unsplash.com/photo-1700170447159-9d2d0da133a5?w=400&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1700170928599-d7fc2d4ec97f?w=400&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1728393287642-13bee7126ae8?w=400&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1618574760337-2750f6251d20?w=400&h=500&fit=crop&auto=format',
]

const similarityScores = [92, 88, 95, 87]

export default function PastCreationsPage({ navigate }: { navigate: Navigate }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [publicToggle, setPublicToggle] = useState<Record<string, boolean>>({ 'ORD-001': true, 'ORD-002': true, 'ORD-003': false, 'ORD-004': true })

  const selectedCreation = pastCreations.find(c => c.id === selected)
  const selectedIdx = pastCreations.findIndex(c => c.id === selected)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFFDF8' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, backgroundColor: '#2E1D15', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(216,167,167,0.15)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <YarnBall size={24} color="#D8A7A7" />
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#F7F3EC', fontSize: '1rem', fontWeight: 600 }}>Campus Crochet</span>
        </div>
        <div style={{ padding: '1rem 1.25rem', flex: 1 }}>
          <p style={{ color: '#B88080', fontSize: '0.82rem', fontWeight: 600 }}>Past Creations Archive</p>
          <p style={{ color: '#7A6058', fontSize: '0.75rem', marginTop: 4 }}>{pastCreations.length} completed pieces</p>
        </div>
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(216,167,167,0.15)' }}>
          <button onClick={() => navigate('admin')} style={{ color: '#7A6058', fontSize: '0.78rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            Back to admin
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: 220, flex: 1, padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2E1D15' }}>Past Creations Archive</h1>
            <p style={{ color: '#7A6058', fontSize: '0.85rem', marginTop: 4 }}>All completed handmade orders. Use side-by-side comparison to maintain quality consistency.</p>
          </div>
          <button
            style={{ backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 600, padding: '0.6rem 1.5rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            + Add Completed Order
          </button>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 48 }}>
          {pastCreations.map((o, i) => (
            <div
              key={o.id}
              style={{ backgroundColor: '#F7F3EC', borderRadius: 20, border: `2px solid ${selected === o.id ? '#C97B63' : '#EDD4D4'}`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => setSelected(selected === o.id ? null : o.id)}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {/* Final photo */}
                <div style={{ position: 'relative' }}>
                  <div style={{ aspectRatio: '4/5', backgroundColor: '#EDD4D4', overflow: 'hidden' }}>
                    <img src={o.image} alt="Final piece" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 50, backgroundColor: 'rgba(46,29,21,0.75)', color: '#EDD4D4' }}>
                    Final
                  </span>
                </div>
                {/* Ref photo */}
                <div style={{ position: 'relative' }}>
                  <div style={{ aspectRatio: '4/5', backgroundColor: '#D4C8EE', overflow: 'hidden' }}>
                    <img src={refImages[i]} alt="Reference" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ position: 'absolute', bottom: 8, right: 8, fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 50, backgroundColor: 'rgba(46,29,21,0.75)', color: '#EDD4D4' }}>
                    Reference
                  </span>
                </div>
              </div>

              <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#2E1D15', fontSize: '0.9rem' }}>{o.product}</p>
                    <p style={{ color: '#7A6058', fontSize: '0.78rem', marginTop: 2 }}>{o.color} · {o.college} · {o.date}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '1.1rem', color: similarityScores[i] >= 90 ? '#3A6B3A' : '#8B4A3A' }}>
                      {similarityScores[i]}%
                    </p>
                    <p style={{ fontSize: '0.65rem', color: '#7A6058' }}>similarity</p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 50, backgroundColor: '#C8D8C0', color: '#3A6B3A' }}>Completed</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 50, backgroundColor: '#EDD4D4', color: '#8B4A3A' }}>Order #{o.id}</span>
                  </div>

                  {/* Public toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={e => { e.stopPropagation(); setPublicToggle(t => ({ ...t, [o.id]: !t[o.id] })) }}>
                    <div style={{ width: 32, height: 18, borderRadius: 9, backgroundColor: publicToggle[o.id] ? '#A8B8A0' : '#EDD4D4', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                      <div style={{ position: 'absolute', top: 2, left: publicToggle[o.id] ? 16 : 2, width: 14, height: 14, borderRadius: '50%', backgroundColor: '#FFFDF8', transition: 'left 0.2s' }} />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#7A6058' }}>{publicToggle[o.id] ? 'Public' : 'Private'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison detail */}
        {selectedCreation && (
          <div style={{ backgroundColor: '#F7F3EC', borderRadius: 24, border: '1px solid #EDD4D4', padding: '2rem', marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#2E1D15' }}>Side-by-Side Comparison</h3>
                <p style={{ color: '#7A6058', fontSize: '0.82rem', marginTop: 4 }}>Listing Photo vs Final Handmade Photo · {selectedCreation.product}</p>
              </div>
              <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '1.5rem', color: similarityScores[selectedIdx] >= 90 ? '#3A6B3A' : '#C97B63' }}>
                {similarityScores[selectedIdx]}% match
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#7A6058', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Listing Photo (Reference)</p>
                <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '4/5', backgroundColor: '#D4C8EE' }}>
                  <img src={refImages[selectedIdx]} alt="Reference" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#7A6058', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Final Handmade Photo</p>
                <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '4/5', backgroundColor: '#EDD4D4' }}>
                  <img src={selectedCreation.image} alt="Final" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button style={{ flex: 1, padding: '0.6rem', borderRadius: 50, border: '1.5px solid #EDD4D4', backgroundColor: '#FFFDF8', color: '#7A6058', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                Edit details
              </button>
              <button style={{ flex: 1, padding: '0.6rem', borderRadius: 50, backgroundColor: '#C97B63', color: '#FFFDF8', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                Add completed order to public gallery
              </button>
            </div>
          </div>
        )}

        {/* Colors used summary */}
        <div style={{ backgroundColor: '#2E1D15', borderRadius: 20, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <CrochetFlower size={24} color="#D8A7A7" />
            <h3 style={{ fontWeight: 700, color: '#F7F3EC', fontSize: '1rem' }}>Colors used across completed orders</h3>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['Sage Green', 'Lavender', 'Natural Cream', 'Blush Pink', 'Dusty Rose', 'Terracotta'].map(c => (
              <span key={c} style={{ backgroundColor: 'rgba(216,167,167,0.15)', color: '#D8A7A7', fontSize: '0.78rem', fontWeight: 500, padding: '0.3rem 0.85rem', borderRadius: 50, border: '1px solid rgba(216,167,167,0.2)' }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
