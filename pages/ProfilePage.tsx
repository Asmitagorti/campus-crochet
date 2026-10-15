import { useEffect, useState } from 'react'
import type { Navigate, AuthUser } from '../types'
import { fetchProfile, updateProfile, type Profile } from '../lib/client-api'

const BRANCHES = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'MBA', 'MCA', 'B.Pharm', 'Other']
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG']

const inputSt: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: 12, border: '1.5px solid #EDD4D4', backgroundColor: '#FFFDF8', color: '#2E1D15', fontSize: '0.88rem', outline: 'none', fontFamily: 'DM Sans, system-ui, sans-serif', boxSizing: 'border-box' }
const labelSt: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#2E1D15', marginBottom: '0.3rem' }

export default function ProfilePage({ navigate, user, onProfileUpdate }: { navigate: Navigate; user: AuthUser | null; onProfileUpdate: (u: AuthUser) => void }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', phone_number: '', branch: '', year: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const p = await fetchProfile()
        if (!mounted) return
        setProfile(p)
        setForm({
          full_name: p.full_name ?? '',
          phone_number: p.phone_number ?? '',
          branch: p.branch ?? '',
          year: p.year ?? '',
        })
      } catch (e: any) {
        if (mounted) setError(e.message ?? 'Could not load your profile.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user?.id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) {
      setError('Please enter your name.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const updated = await updateProfile({
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        branch: form.branch,
        year: form.year,
      })
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      if (user) {
        onProfileUpdate({
          ...user,
          name: updated.full_name ?? user.name,
          phone: updated.phone_number ?? undefined,
          branch: updated.branch ?? undefined,
          year: updated.year ?? undefined,
        })
      }
    } catch (e: any) {
      setError(e.message ?? 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FFFDF8' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2E1D15', marginBottom: '0.4rem' }}>Your Profile</h1>
        <p style={{ color: '#7A6058', fontSize: '0.85rem', marginBottom: '2rem' }}>Stored securely · used only for order fulfillment on campus.</p>

        {!user ? (
          <div style={{ backgroundColor: '#F7F3EC', borderRadius: 20, border: '1px solid #EDD4D4', padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: '#2E1D15', fontWeight: 600 }}>Please sign in to view your profile.</p>
          </div>
        ) : loading ? (
          <div style={{ backgroundColor: '#F7F3EC', borderRadius: 20, border: '1px solid #EDD4D4', padding: '2.5rem', textAlign: 'center', color: '#7A6058' }}>
            Loading your profile…
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ backgroundColor: '#F7F3EC', borderRadius: 24, border: '1px solid #EDD4D4', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {saved && (
              <div style={{ backgroundColor: '#C8D8C0', borderRadius: 10, padding: '0.6rem 1rem', color: '#3A6B3A', fontWeight: 600, fontSize: '0.85rem' }}>
                Profile saved.
              </div>
            )}
            {error && (
              <div style={{ backgroundColor: '#FDF0EC', borderRadius: 10, padding: '0.6rem 1rem', border: '1px solid #EDD4D4', fontSize: '0.82rem', color: '#A86248' }}>
                ⚠ {error}
              </div>
            )}
            <div>
              <label style={labelSt}>Email (cannot be changed)</label>
              <input value={profile?.email ?? user.email} disabled style={{ ...inputSt, opacity: 0.6 }} />
            </div>
            <div>
              <label style={labelSt}>Full Name *</label>
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={inputSt} required />
            </div>
            <div>
              <label style={labelSt}>Phone *</label>
              <input value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value.replace(/\D/g, '').slice(0, 15) }))} placeholder="10-digit number" style={inputSt} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelSt}>Branch *</label>
                <select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} style={inputSt} required>
                  <option value="">Select</option>
                  {BRANCHES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Year *</label>
                <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} style={inputSt} required>
                  <option value="">Select</option>
                  {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving} style={{ backgroundColor: saving ? '#EDD4D4' : '#C97B63', color: saving ? '#B88080' : '#FFFDF8', fontWeight: 700, padding: '0.85rem', borderRadius: 50, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.92rem' }}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
            <button type="button" onClick={() => navigate('dashboard')} style={{ background: 'none', border: 'none', color: '#C97B63', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
              → Go to My Orders
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
