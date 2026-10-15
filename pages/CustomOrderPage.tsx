import { useEffect, useState } from 'react'
import type { Navigate, AuthUser } from '../types'
import { supabase } from '../lib/supabase'
import { fetchMyRequests, createRequest, type CustomRequest } from '../lib/client-api'

const inputSt: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: 12, border: '1.5px solid #EDD4D4', backgroundColor: '#FFFDF8', color: '#2E1D15', fontSize: '0.88rem', outline: 'none', fontFamily: 'DM Sans, system-ui, sans-serif', boxSizing: 'border-box' }
const labelSt: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#2E1D15', marginBottom: '0.3rem' }

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FDE9CC', text: '#8B5A1A', label: 'Pending review' },
  accepted: { bg: '#C8D8C0', text: '#3A6B3A', label: 'Accepted' },
  rejected: { bg: '#FDF0EC', text: '#A86248', label: 'Not possible right now' },
  completed: { bg: '#2E1D15', text: '#EDD4D4', label: 'Completed' },
}

export default function CustomOrderPage({ navigate, user, onRequireLogin }: { navigate: Navigate; user: AuthUser | null; onRequireLogin: () => void }) {
  const [requests, setRequests] = useState<CustomRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ description: '', preferred_color: '', size: '', quantity: '1', budget: '', extra_requirements: '' })
  const [refPreview, setRefPreview] = useState<string | null>(null)
  const [refFile, setRefFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const data = await fetchMyRequests()
        if (mounted) setRequests(data)
      } catch {
        /* offline — form still usable */
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user?.id])

  function pickFile(f: File | undefined) {
    if (!f || !f.type.startsWith('image/')) return
    if (f.size > 5 * 1024 * 1024) {
      setError('Reference image must be smaller than 5 MB.')
      return
    }
    setRefFile(f)
    setRefPreview(URL.createObjectURL(f))
    setError('')
  }

  async function uploadReference(): Promise<string | null> {
    if (!refFile) return refPreview
    const { data: { session } } = await supabase.auth.getSession()
    const fd = new FormData()
    fd.append('file', refFile)
    const res = await fetch('/api/products/upload', {
      method: 'POST',
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      body: fd,
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error ?? 'Reference upload failed.')
    return body.url as string
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      onRequireLogin()
      return
    }
    if (form.description.trim().length < 10) {
      setError('Please describe what you would like in a few words.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const reference_image_url = await uploadReference().catch(() => null)
      const created = await createRequest({
        description: form.description.trim(),
        preferred_color: form.preferred_color.trim(),
        size: form.size.trim(),
        quantity: Number(form.quantity) || 1,
        budget: form.budget.trim() === '' ? null : Number(form.budget),
        extra_requirements: form.extra_requirements.trim(),
        reference_image_url,
      })
      setRequests(r => [created, ...r])
      setForm({ description: '', preferred_color: '', size: '', quantity: '1', budget: '', extra_requirements: '' })
      setRefFile(null)
      setRefPreview(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (e: any) {
      setError(e.message ?? 'Could not submit your request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FFFDF8' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <p style={{ fontFamily: 'Caveat, cursive', color: '#C97B63', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Made just for you</p>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#2E1D15' }}>Request a Custom Piece</h1>
        <p style={{ color: '#7A6058', fontSize: '0.9rem', marginTop: '0.4rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Describe what you have in mind — colors, size, quantity, budget. We review every request personally and reply right here.
          Custom pieces take 3–5 working days after confirmation · campus pickup · online payment only.
        </p>

        <form onSubmit={handleSubmit} style={{ backgroundColor: '#F7F3EC', borderRadius: 24, border: '1px solid #EDD4D4', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
          {success && (
            <div style={{ backgroundColor: '#C8D8C0', borderRadius: 10, padding: '0.6rem 1rem', color: '#3A6B3A', fontWeight: 600, fontSize: '0.85rem' }}>
              Request submitted! Track its status below.
            </div>
          )}
          {error && (
            <div style={{ backgroundColor: '#FDF0EC', borderRadius: 10, padding: '0.6rem 1rem', border: '1px solid #EDD4D4', fontSize: '0.82rem', color: '#A86248' }}>
              ⚠ {error}
            </div>
          )}
          <div>
            <label style={labelSt}>What would you like? *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="e.g. A sunflower tote bag in yellow and brown, medium size…"
              rows={4}
              maxLength={2000}
              style={{ ...inputSt, resize: 'vertical' }}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelSt}>Preferred color</label>
              <input value={form.preferred_color} onChange={e => setForm(f => ({ ...f, preferred_color: e.target.value }))} placeholder="e.g. Sage green" style={inputSt} maxLength={120} />
            </div>
            <div>
              <label style={labelSt}>Size</label>
              <input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} placeholder="e.g. Medium" style={inputSt} maxLength={120} />
            </div>
            <div>
              <label style={labelSt}>Quantity</label>
              <input type="number" min={1} max={50} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} style={inputSt} />
            </div>
          </div>
          <div>
            <label style={labelSt}>Budget (₹, optional)</label>
            <input type="number" min={0} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="e.g. 250" style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Anything else? (optional)</label>
            <textarea value={form.extra_requirements} onChange={e => setForm(f => ({ ...f, extra_requirements: e.target.value }))} placeholder="Deadlines, gift wrapping, pattern references…" rows={2} maxLength={2000} style={{ ...inputSt, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelSt}>Reference image (optional)</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <label style={{ padding: '0.55rem 1.1rem', borderRadius: 50, border: '1.5px dashed #EDD4D4', backgroundColor: '#FFFDF8', color: '#7A6058', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
                Choose image
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => pickFile(e.target.files?.[0])} />
              </label>
              {refPreview && (
                <div style={{ position: 'relative' }}>
                  <img src={refPreview} alt="Reference" style={{ width: 64, height: 80, objectFit: 'cover', borderRadius: 10, border: '1px solid #EDD4D4' }} />
                  <button type="button" onClick={() => { setRefFile(null); setRefPreview(null) }} style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', backgroundColor: '#2E1D15', color: '#FFFDF8', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>×</button>
                </div>
              )}
            </div>
          </div>
          <button type="submit" disabled={submitting} style={{ backgroundColor: submitting ? '#EDD4D4' : '#C97B63', color: submitting ? '#B88080' : '#FFFDF8', fontWeight: 700, padding: '0.85rem', borderRadius: 50, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.92rem' }}>
            {submitting ? 'Submitting…' : user ? 'Submit Request →' : 'Sign in to Submit →'}
          </button>
        </form>

        <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#2E1D15', marginBottom: 16 }}>Your Requests</h2>
        {!user ? (
          <p style={{ color: '#7A6058', fontSize: '0.88rem' }}>Sign in to track your custom requests.</p>
        ) : loading ? (
          <div style={{ backgroundColor: '#F7F3EC', borderRadius: 16, border: '1px solid #EDD4D4', padding: '2rem', textAlign: 'center', color: '#7A6058' }}>
            Loading your requests…
          </div>
        ) : requests.length === 0 ? (
          <div style={{ backgroundColor: '#F7F3EC', borderRadius: 16, border: '1px dashed #EDD4D4', padding: '2rem', textAlign: 'center', color: '#7A6058', fontSize: '0.88rem' }}>
            No requests yet — your submissions will be tracked here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map(r => {
              const m = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending
              return (
                <div key={r.request_id} style={{ backgroundColor: '#F7F3EC', borderRadius: 16, border: '1px solid #EDD4D4', padding: '1.1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 600, color: '#2E1D15', fontSize: '0.88rem', lineHeight: 1.5 }}>{r.description}</p>
                    <span style={{ backgroundColor: m.bg, color: m.text, fontSize: '0.68rem', fontWeight: 600, padding: '0.22rem 0.6rem', borderRadius: 50, whiteSpace: 'nowrap' }}>{m.label}</span>
                  </div>
                  <p style={{ color: '#7A6058', fontSize: '0.75rem' }}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {r.preferred_color ? ` · ${r.preferred_color}` : ''} · Qty {r.quantity}{r.budget != null ? ` · ₹${r.budget}` : ''}
                  </p>
                  {r.admin_note && (
                    <div style={{ marginTop: '0.75rem', backgroundColor: '#FFFDF8', borderRadius: 10, padding: '0.7rem 0.9rem', border: '1px solid #EDD4D4' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#C97B63', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Response from Campus Crochet</p>
                      <p style={{ fontSize: '0.82rem', color: '#2E1D15', lineHeight: 1.6 }}>{r.admin_note}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <button onClick={() => navigate('catalog')} style={{ background: 'none', border: 'none', color: '#C97B63', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
            ← Back to Collection
          </button>
        </div>
      </div>
    </main>
  )
}
