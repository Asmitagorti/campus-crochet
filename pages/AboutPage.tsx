import type { Navigate } from '../types'
import { YarnBall, CrochetFlower, StitchDivider } from '../components/YarnDecor'

export default function AboutPage({ navigate }: { navigate: Navigate }) {
  return (
    <main style={{ backgroundColor: '#FFFDF8' }}>
      {/* Hero */}
      <section style={{ backgroundColor: '#F7F3EC', borderBottom: '1px solid #EDD4D4', padding: '80px 0 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '3%', top: '5%', opacity: 0.15 }}>
          <YarnBall size={180} color="#D8A7A7" />
        </div>
        <div style={{ position: 'absolute', left: '2%', bottom: '-10%', opacity: 0.1 }}>
          <CrochetFlower size={100} color="#A8B8A0" />
        </div>
        <div className="max-w-[1200px] mx-auto px-6">
          <p style={{ fontFamily: 'Caveat, cursive', color: '#C97B63', fontSize: '1.1rem', marginBottom: '0.75rem' }}>The person behind the needle</p>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#2E1D15', lineHeight: 1.2, maxWidth: 560, marginBottom: '1.25rem' }}>
            About the Creator
          </h1>
          <p style={{ color: '#7A6058', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: 520 }}>
            A student. A maker. Someone who genuinely cannot stop crocheting.
          </p>
        </div>
      </section>

      {/* Story */}
      <section style={{ padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 24, overflow: 'hidden', aspectRatio: '4/5', backgroundColor: '#EDD4D4', boxShadow: '0 20px 60px rgba(46,29,21,0.1)' }}>
                <img
                  src="https://images.unsplash.com/photo-1519412849983-957822373d02?w=600&h=750&fit=crop&auto=format"
                  alt="Crocheting by hand"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ position: 'absolute', bottom: -16, right: -16 }}>
                <YarnBall size={72} color="#D8A7A7" />
              </div>
            </div>

            <div>
              <p style={{ fontFamily: 'Caveat, cursive', color: '#A8B8A0', fontSize: '1.1rem', marginBottom: '0.75rem' }}>My story</p>
              <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.9rem', fontWeight: 700, color: '#2E1D15', lineHeight: 1.3, marginBottom: '1.25rem' }}>
                Making things with my hands is something I've always loved.
              </h2>
              <p style={{ color: '#5A4238', lineHeight: 1.85, fontSize: '0.95rem', marginBottom: '1rem' }}>
                I'm a student at Aditya educational institutions in Surampalem — studying full-time, and crocheting every spare moment in between. The needle and yarn have been my creative outlet for years. What started as something I did quietly for myself slowly turned into gifts for close friends.
              </p>
              <p style={{ color: '#5A4238', lineHeight: 1.85, fontSize: '0.95rem', marginBottom: '1rem' }}>
                Seeing their reactions when they received something I made by hand — that feeling never got old. It made me think: maybe other Adityans would love something handmade too. Something that isn't mass-produced, that has a little bit of soul in every stitch.
              </p>
              <p style={{ color: '#5A4238', lineHeight: 1.85, fontSize: '0.95rem' }}>
                Campus Crochet has been a project I wanted to start for years. I'm glad I finally did.
              </p>
            </div>
          </div>
        </div>
      </section>

      <StitchDivider className="w-full opacity-30" />

      {/* Values */}
      <section style={{ padding: '80px 0', backgroundColor: '#F7F3EC' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontFamily: 'Caveat, cursive', color: '#C97B63', fontSize: '1.1rem', marginBottom: '0.5rem' }}>What I stand for</p>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#2E1D15' }}>The values behind every piece</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
            {[
              { icon: '🧶', title: 'Made with genuine passion', body: "I don't make products — I make things I'm proud of. Every stitch is placed with care because this craft genuinely brings me joy. That enthusiasm is woven into every order." },
              { icon: '✋', title: 'Truly handmade', body: 'Nothing is machine-made or outsourced. Every piece is crocheted by my hands, using the listing photo as a reference. It takes time — and that\'s exactly how I want it.' },
              { icon: '🌿', title: 'Quality over quantity', body: "I only accept orders I can fulfil properly. I'd rather make fewer pieces really well than rush through many. That's why I need 3–5 working days, and why every order passes a quality check before pickup." },
            ].map(v => (
              <div key={v.title} style={{ backgroundColor: '#FFFDF8', borderRadius: 20, padding: '1.75rem', border: '1px solid #EDD4D4' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{v.icon}</div>
                <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2E1D15', marginBottom: '0.6rem' }}>{v.title}</h3>
                <p style={{ color: '#7A6058', fontSize: '0.88rem', lineHeight: 1.75 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The student side */}
      <section style={{ padding: '80px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: 'Caveat, cursive', color: '#A8B8A0', fontSize: '1.1rem', marginBottom: '0.75rem' }}>I'm still a student</p>
              <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.9rem', fontWeight: 700, color: '#2E1D15', lineHeight: 1.3, marginBottom: '1.25rem' }}>
                Classes, assignments, and crochet — in that order.
              </h2>
              <p style={{ color: '#5A4238', lineHeight: 1.85, fontSize: '0.95rem', marginBottom: '1rem' }}>
                Campus Crochet is a passion project, not a full-time operation. I'm a student first — which means your order gets made in the evenings, on weekends, and during the gaps between classes.
              </p>
              <p style={{ color: '#5A4238', lineHeight: 1.85, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                This is also why I ask for 3–5 working days. It's not a long wait for something that's made just for you — but I want to be honest about my timeline rather than rush a piece and disappoint you.
              </p>
              <blockquote style={{ borderLeft: '3px solid #D8A7A7', paddingLeft: '1.25rem', fontFamily: 'Playfair Display, Georgia, serif', fontStyle: 'italic', color: '#8B6B5C', fontSize: '1.05rem', lineHeight: 1.6 }}>
                "I put the same care into your order that I'd put into something I was making for myself."
              </blockquote>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 24, overflow: 'hidden', aspectRatio: '1/1', backgroundColor: '#EDD4D4', boxShadow: '0 20px 60px rgba(46,29,21,0.08)' }}>
                <img
                  src="https://images.unsplash.com/photo-1700171394718-2457b1190444?w=600&h=600&fit=crop&auto=format"
                  alt="Crochet flowers"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ position: 'absolute', top: -16, left: -16 }}>
                <CrochetFlower size={52} color="#B7A7D8" />
              </div>
              <div style={{ position: 'absolute', bottom: 24, right: -24, backgroundColor: '#FFFDF8', borderRadius: 16, padding: '0.85rem 1.1rem', boxShadow: '0 8px 24px rgba(46,29,21,0.1)', border: '1px solid #EDD4D4' }}>
                <p style={{ fontSize: '0.72rem', color: '#7A6058', marginBottom: 2 }}>Every order</p>
                <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, color: '#2E1D15', fontSize: '0.95rem' }}>Made fresh, just for you</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campus story */}
      <section style={{ padding: '80px 0', backgroundColor: '#2E1D15' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: 'Caveat, cursive', color: '#D8A7A7', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Why campus-only</p>
              <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#F7F3EC', lineHeight: 1.35, marginBottom: '1.25rem' }}>
                Built for Adityans, by an Adityan.
              </h2>
              <p style={{ color: '#B88080', lineHeight: 1.85, fontSize: '0.92rem', marginBottom: '1rem' }}>
                I started with friends on campus — the people who saw me crocheting in the common room and got curious. The trust was already there. Orders were just an extension of that.
              </p>
              <p style={{ color: '#B88080', lineHeight: 1.85, fontSize: '0.92rem' }}>
                Keeping it campus-only isn't a limitation — it's a choice. I want to know the people I'm making things for. I want pickup to be a handoff, not a delivery. That personal connection is part of what makes this different.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { num: '10+', label: 'Completed orders' },
                { num: '85%', label: 'Similarity guarantee' },
                { num: '3–5', label: 'Working days per piece' },
                { num: '0', label: 'Delivery charges' },
              ].map(s => (
                <div key={s.label} style={{ backgroundColor: 'rgba(216,167,167,0.1)', borderRadius: 16, padding: '1.25rem', border: '1px solid rgba(216,167,167,0.15)', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#D8A7A7' }}>{s.num}</p>
                  <p style={{ color: '#7A6058', fontSize: '0.8rem', marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <CrochetFlower size={40} color="#D8A7A7" />
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#2E1D15', margin: '1rem 0 0.75rem' }}>
            Browse the collection
          </h2>
          <p style={{ color: '#7A6058', maxWidth: 380, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Every piece in the collection is something I genuinely enjoy making. I hope you find something you love.
          </p>
          <button
            onClick={() => navigate('catalog')}
            style={{ backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 600, padding: '0.875rem 2.25rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(201,123,99,0.3)' }}
          >
            Explore Collection →
          </button>
        </div>
      </section>
    </main>
  )
}
