import { useState, useRef } from 'react'
import type { Navigate } from "@/types"
import { YarnBall, CrochetFlower } from "../YarnDecor"

const colorOptions = ['Dusty Rose', 'Cream', 'Sage Green', 'Lavender', 'Terracotta', 'Warm Brown', 'Sunflower Yellow', 'White', 'Blush Pink', 'Natural Cream']
const categoryOptions = ['Scrunchies', 'Keychains', 'Charms', 'Bookmarks', 'Bags', 'Home']
const processingOptions = ['3â€“5 working days', '5â€“7 working days', '7â€“10 working days']

export default function AddProductPage({ navigate }: { navigate: Navigate }) {
  const [dragOver, setDragOver] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    shortDesc: '',
    description: '',
    price: '',
    category: '',
    processingTime: '3â€“5 working days',
    active: true,
    featured: false,
  })
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setPreviewImg(url)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function toggleColor(c: string) {
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  function handlePublish() {
    setSaved(true)
    setTimeout(() => { setSaved(false); navigate('admin') }, 2000)
  }

  const previewSrc = previewImg ?? 'https://images.unsplash.com/photo-1700171394718-2457b1190444?w=400&h=500&fit=crop&auto=format'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFFDF8' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, backgroundColor: '#2E1D15', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(216,167,167,0.15)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <YarnBall size={24} color="#D8A7A7" />
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#F7F3EC', fontSize: '1rem', fontWeight: 600 }}>Campus Crochet</span>
        </div>
        <div style={{ padding: '1rem 1.25rem', flex: 1 }}>
          <p style={{ color: '#7A6058', fontSize: '0.8rem' }}>Add / Edit Product</p>
        </div>
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(216,167,167,0.15)' }}>
          <button onClick={() => navigate('admin')} style={{ color: '#7A6058', fontSize: '0.78rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            Back to admin
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: 220, flex: 1, padding: '2.5rem 2rem' }}>
        {/* Success banner */}
        {saved && (
          <div style={{ backgroundColor: '#C8D8C0', borderRadius: 12, padding: '0.75rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CrochetFlower size={20} color="#3A6B3A" />
            <span style={{ color: '#3A6B3A', fontWeight: 600, fontSize: '0.9rem' }}>Product published successfully!</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2E1D15' }}>Add New Product</h1>
            <p style={{ color: '#7A6058', fontSize: '0.85rem', marginTop: 4 }}>Fill in the details below â€” you can publish in under 2 minutes.</p>
          </div>
          <button onClick={handlePublish} style={{ backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 600, padding: '0.7rem 2rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(201,123,99,0.3)' }}>
            Publish Product
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem', alignItems: 'start' }}>
          {/* Left: image upload + preview */}
          <div>
            {/* Upload zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? '#C97B63' : '#EDD4D4'}`, borderRadius: 20, padding: '2rem', textAlign: 'center', cursor: 'pointer', backgroundColor: dragOver ? '#FDF0EC' : '#F7F3EC', transition: 'all 0.2s', marginBottom: '1rem' }}
            >
              <input ref={fileRef} type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} style={{ display: 'none' }} />
              <div style={{ marginBottom: '0.75rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C97B63" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto' }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p style={{ fontWeight: 600, color: '#2E1D15', fontSize: '0.9rem' }}>Drag & drop image here</p>
              <p style={{ color: '#7A6058', fontSize: '0.78rem', marginTop: 4 }}>or click to browse Â· PNG, JPG, WEBP</p>
            </div>

            {/* Live preview */}
            <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #EDD4D4', backgroundColor: '#F7F3EC' }}>
              <div style={{ aspectRatio: '4/5', overflow: 'hidden', backgroundColor: '#EDD4D4' }}>
                <img src={previewSrc} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 50, backgroundColor: '#EDD4D4', color: '#8B4A3A' }}>Handmade</span>
                  {form.featured && <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 50, backgroundColor: '#C97B63', color: '#FFFDF8' }}>Featured</span>}
                </div>
                <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 600, fontSize: '1rem', color: '#2E1D15' }}>{form.name || 'Product Name'}</p>
                <p style={{ color: '#7A6058', fontSize: '0.78rem', marginTop: 2 }}>{form.category || 'Category'}</p>
                <p style={{ color: '#C97B63', fontWeight: 700, marginTop: 4 }}>{form.price ? `â‚¹${form.price}` : 'â‚¹â€”'}</p>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', backgroundColor: '#F7F3EC', borderRadius: 10, border: '1px solid #EDD4D4' }}>
              <p style={{ color: '#7A6058', fontSize: '0.72rem', lineHeight: 1.5 }}>
                âœ¦ Images auto-crop to 4:5 ratio<br/>
                âœ¦ Thumbnails auto-generate<br/>
                âœ¦ Product cards stay aligned automatically
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Field label="Product name *">
              <input
                type="text"
                placeholder="e.g. Daisy Scrunchie"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
              />
            </Field>

            <Field label="Short description">
              <input
                type="text"
                placeholder="One-line description shown on cards"
                value={form.shortDesc}
                onChange={e => setForm(f => ({ ...f, shortDesc: e.target.value }))}
                style={inputStyle}
              />
            </Field>

            <Field label="Full description">
              <textarea
                placeholder="Describe the product in detail â€” materials, size, feel, use..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Price (â‚¹) *">
                <input
                  type="number"
                  placeholder="e.g. 120"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
              <Field label="Category *">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                  <option value="">Select category</option>
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Available colors">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {colorOptions.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleColor(c)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: 50,
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      border: selectedColors.includes(c) ? '2px solid #C97B63' : '1.5px solid #EDD4D4',
                      backgroundColor: selectedColors.includes(c) ? '#FDF0EC' : '#FFFDF8',
                      color: selectedColors.includes(c) ? '#C97B63' : '#7A6058',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Processing time">
              <select value={form.processingTime} onChange={e => setForm(f => ({ ...f, processingTime: e.target.value }))} style={inputStyle}>
                {processingOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <Toggle label="Active listing" value={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} />
              <Toggle label="Featured product" value={form.featured} onChange={v => setForm(f => ({ ...f, featured: v }))} />
            </div>

            <button onClick={handlePublish} style={{ backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 600, padding: '0.875rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(201,123,99,0.25)', transition: 'background-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A86248'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C97B63'}>
              Publish Product â†’
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.9rem',
  borderRadius: 12,
  border: '1.5px solid #EDD4D4',
  backgroundColor: '#FFFDF8',
  color: '#2E1D15',
  fontSize: '0.88rem',
  outline: 'none',
  fontFamily: 'DM Sans, system-ui, sans-serif',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2E1D15', marginBottom: '0.4rem' }}>{label}</label>
      {children}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!value)}
        style={{ width: 40, height: 22, borderRadius: 11, backgroundColor: value ? '#C97B63' : '#EDD4D4', position: 'relative', transition: 'background-color 0.2s' }}
      >
        <div style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#FFFDF8', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
      </div>
      <span style={{ fontSize: '0.82rem', color: '#7A6058', fontWeight: 500 }}>{label}</span>
    </label>
  )
}
