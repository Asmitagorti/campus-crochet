import { useState, useEffect } from 'react'
import type { Navigate } from '../types'
import { CheckShieldIcon, CrochetFlower } from '../components/YarnDecor'

interface Props {
  navigate: Navigate
  productId: string | null
  onAddToCart?: (
  productId: string,
  color: string,
  quantity: number
) => boolean
}

const HARDCODED_CARE = [
  'Hand wash gently in cold or lukewarm water.',
  'Do not bleach or wring the piece.',
  'Gently reshape while damp and lay flat to dry.',
  'Keep away from direct heat and prolonged sunlight.',
  'Do not iron directly on the crochet.',
  'Store in a clean, dry place when not in use.',
]
const prevVersions = [
  { img: 'https://images.unsplash.com/photo-1700171394718-2457b1190444?w=300&h=375&fit=crop&auto=format', college: 'ACET', color: 'Sage Green', date: 'Aug 2026' },
  { img: 'https://images.unsplash.com/photo-1700171458554-46cfd3f2a87a?w=300&h=375&fit=crop&auto=format', college: 'AEC', color: 'Dusty Rose', date: 'Jul 2026' },
  { img: 'https://images.unsplash.com/photo-1700171518313-5dd219beaaa6?w=300&h=375&fit=crop&auto=format', college: 'ACET', color: 'Cream White', date: 'Jun 2026' },
]

export default function ProductDetailPage({ navigate, productId, onAddToCart }: Props) {
  const [product, setProduct] = useState<any>(null)

  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [expandedCare, setExpandedCare] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    async function getProduct() {
      console.log("🔥 FETCHING PRODUCT:", productId)

      const response = await fetch('/api/products')
      const data = await response.json()

      console.log("📦 ALL PRODUCTS:", data)

      const found = data.find(
        (product: any) => product.product_id === productId
      )

      console.log("🎯 FOUND PRODUCT:", found)

      if (found) {
        const formattedProduct = {
  id: found.product_id,
  name: found.name,
  price: found.price,
  category: found.category,
  description: found.description,

   images: found.product_images?.map(
    (image: any) => image.image_url
  ) ?? [],

  colors: found.product_colors?.map(
    (color: any) => color.color_name
  ) ?? [],

  badge: null,
  processingTime: found.processing_time_days,
  stock: found.stock_quantity,
  // Hardcoded for all woolen products
  care: HARDCODED_CARE,
}

        setProduct(formattedProduct)
        // Select the first available color
        setSelectedColor(formattedProduct.colors[0] ?? '')
        setActiveImg(0)
      }
    }

    if (productId) {
      getProduct()
    }
  }, [productId])

  if (!product) {
    return <div>Loading product...</div>
  }

  const images: string[] = product.images ?? []

  function handleBuyNow() {
    setOrderSuccess(true)

    setTimeout(() => {
      setOrderSuccess(false)
      navigate('payment')
    }, 2500)
  }
  return (
    <main style={{ backgroundColor: '#FFFDF8', minHeight: '100vh' }}>
      {/* Success animation overlay */}
      {orderSuccess && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(247,243,236,0.96)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '3rem', animation: 'bounce 0.6s ease infinite alternate' }}>🧶</div>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2E1D15', textAlign: 'center' }}>
            Your handmade order has been added to my crochet queue! 🧶💛
          </h2>
          <p
  style={{
    color: '#7A6058',
    fontSize: '0.95rem',
    textAlign: 'center',
    maxWidth: 380,
  }}
>
  I'll start working on it soon and it should be ready in{' '}
  {product.processingTime} working days.
</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <CrochetFlower size={32} color="#D8A7A7" />
            <CrochetFlower size={32} color="#A8B8A0" />
            <CrochetFlower size={32} color="#B7A7D8" />
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: '#7A6058', marginBottom: '2.5rem', alignItems: 'center' }}>
          <button onClick={() => navigate('home')} style={{ color: '#7A6058', background: 'none', border: 'none', cursor: 'pointer' }}>Home</button>
          <span>/</span>
          <button onClick={() => navigate('catalog')} style={{ color: '#7A6058', background: 'none', border: 'none', cursor: 'pointer' }}>Collection</button>
          <span>/</span>
          <span style={{ color: '#2E1D15', fontWeight: 500 }}>{product.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'start' }}>
          {/* Image gallery */}
<div>
  <div
    style={{
      borderRadius: 24,
      overflow: 'hidden',
      aspectRatio: '4/5',
      backgroundColor: '#F7F3EC',
      border: '1px solid #EDD4D4',
      marginBottom: '0.75rem',
    }}
  >
    {images.length > 0 ? (
      <img
        src={images[activeImg] || images[0]}
        alt={product.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.2s',
        }}
      />
    ) : (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7A6058',
          fontSize: '0.9rem',
        }}
      >
        No image available
      </div>
    )}
  </div>

  {/* Thumbnail images */}
  {images.length > 0 && (
    <div style={{ display: 'flex', gap: 10 }}>
      {images.map((img: string, i: number) => (
        <button
          type="button"
          key={`${img}-${i}`}
          onClick={() => setActiveImg(i)}
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            width: 72,
            aspectRatio: '4/5',
            padding: 0,
            border:
              activeImg === i
                ? '2px solid #C97B63'
                : '2px solid transparent',
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'border-color 0.15s',
            backgroundColor: '#F7F3EC',
          }}
        >
          <img
            src={img}
            alt={`${product.name} image ${i + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </button>
      ))}
    </div>
  )}
</div>

          {/* Product info */}
          <div>
            {product.badge && (
              <span style={{ backgroundColor: '#C97B63', color: '#FFFDF8', fontSize: '0.72rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: 50, letterSpacing: '0.04em', display: 'inline-block', marginBottom: '0.75rem' }}>
                {product.badge}
              </span>
            )}

            <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#2E1D15', lineHeight: 1.2, marginBottom: '0.5rem' }}>
              {product.name}
            </h1>
            <p style={{ color: '#7A6058', fontSize: '0.9rem', marginBottom: '1rem' }}>{product.category}</p>
            <p style={{ fontWeight: 700, fontSize: '1.75rem', color: '#C97B63', marginBottom: '1.5rem' }}>₹{product.price}</p>

            <p style={{ color: '#5A4238', lineHeight: 1.8, fontSize: '0.92rem', marginBottom: '1.75rem' }}>{product.description}</p>

            {/* Color selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2E1D15', marginBottom: '0.6rem' }}>Color: <span style={{ color: '#7A6058', fontWeight: 400 }}>{selectedColor}</span></p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.colors.map((c: string) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: 50,
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      border: selectedColor === c ? '2px solid #C97B63' : '1.5px solid #EDD4D4',
                      backgroundColor: selectedColor === c ? '#FDF0EC' : '#FFFDF8',
                      color: selectedColor === c ? '#C97B63' : '#7A6058',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
<div style={{ marginBottom: '1.75rem' }}>
  <p
    style={{
      fontSize: '0.82rem',
      fontWeight: 600,
      color: '#2E1D15',
      marginBottom: '0.6rem',
    }}
  >
    Quantity
    <span
      style={{
        fontWeight: 400,
        color: '#7A6058',
        marginLeft: 8,
      }}
    >
      ({product.stock} available)
    </span>
  </p>

  {product.stock > 0 ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: '1.5px solid #EDD4D4',
        borderRadius: 50,
        width: 'fit-content',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setQuantity(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        style={{
          padding: '0.4rem 0.9rem',
          fontSize: '1.1rem',
          color: quantity <= 1 ? '#C8BDB8' : '#7A6058',
          background: 'none',
          border: 'none',
          cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
        }}
      >
        −
      </button>

      <span
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#2E1D15',
          minWidth: 20,
          textAlign: 'center',
        }}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={() =>
          setQuantity(Math.min(product.stock, quantity + 1))
        }
        disabled={quantity >= product.stock}
        style={{
          padding: '0.4rem 0.9rem',
          fontSize: '1.1rem',
          color: quantity >= product.stock ? '#C8BDB8' : '#7A6058',
          background: 'none',
          border: 'none',
          cursor:
            quantity >= product.stock
              ? 'not-allowed'
              : 'pointer',
        }}
      >
        +
      </button>
    </div>
  ) : (
    <p
      style={{
        color: '#C97B63',
        fontWeight: 600,
        fontSize: '0.9rem',
      }}
    >
      Currently out of stock
    </p>
  )}
</div>

            {/* Processing time note */}
            <div style={{ backgroundColor: '#F7F3EC', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8B8A0" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p style={{ fontSize: '0.82rem', color: '#7A6058' }}>
                Made after your order · <strong style={{ color: '#2E1D15' }}>3–5 working days</strong> processing time
              </p>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: '2rem' }}>
              <button
                onClick={() => {
  if (onAddToCart) {
    const added = onAddToCart(
      product.id,
      selectedColor,
      quantity
    )

    if (added) {
      navigate('cart')
    }
  } else {
    navigate('cart')
  }
}}
                style={{ flex: 1, backgroundColor: '#F7F3EC', color: '#2E1D15', fontWeight: 600, padding: '0.875rem', borderRadius: 50, border: '1.5px solid #EDD4D4', cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#C97B63'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#EDD4D4'}
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                style={{ flex: 1, backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 600, padding: '0.875rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.95rem', transition: 'background-color 0.2s', boxShadow: '0 4px 16px rgba(201,123,99,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A86248'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C97B63'}
              >
                Buy Now
              </button>
            </div>

            {/* Care instructions accordion */}
            <div style={{ borderTop: '1px solid #EDD4D4', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setExpandedCare(v => !v)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0' }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2E1D15' }}>Care instructions</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A6058" strokeWidth="1.8" strokeLinecap="round" style={{ transform: expandedCare ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expandedCare && (
  <ul
    style={{
      color: '#7A6058',
      fontSize: '0.85rem',
      lineHeight: 1.7,
      paddingTop: '0.5rem',
      paddingLeft: '1.2rem',
      margin: 0,
    }}
  >
    {product.care.map((instruction: string, i: number) => (
      <li key={i}>{instruction}</li>
    ))}
  </ul>
)}
            </div>

            {/* Handmade note */}
            <div style={{ backgroundColor: '#2E1D15', borderRadius: 16, padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <CheckShieldIcon size={22} color="#A8B8A0" />
                <div>
                  <p style={{ fontWeight: 600, color: '#F7F3EC', fontSize: '0.85rem', marginBottom: '0.35rem' }}>85% Similarity Guarantee</p>
                  <p style={{ color: '#B88080', fontSize: '0.78rem', lineHeight: 1.6 }}>
                    Your piece will be at least 85% visually similar to the listing photos. Tiny variations are part of the handmade charm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Previous versions */}
        <section style={{ marginTop: 96 }}>
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontFamily: 'Caveat, cursive', color: '#A8B8A0', fontSize: '1.05rem', marginBottom: '0.4rem' }}>Real completed versions</p>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2E1D15' }}>
              See previous handmade versions
            </h2>
            <p style={{ color: '#7A6058', fontSize: '0.88rem', marginTop: '0.4rem' }}>
              These are real orders that were made, photographed, and delivered. Every piece is slightly unique.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {prevVersions.map((v, i) => (
              
              <div key={i} style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: '#F7F3EC', border: '1px solid #EDD4D4' }}>
                <div style={{ aspectRatio: '4/5', backgroundColor: '#EDD4D4', overflow: 'hidden' }}>
                  <img src={v.img} alt="Previous version" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 50, backgroundColor: '#C8D8C0', color: '#3A6B3A' }}>Completed</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 50, backgroundColor: '#EDD4D4', color: '#8B4A3A' }}>Real order</span>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#2E1D15' }}>{v.color}</p>
                  <p style={{ fontFamily: 'Caveat, cursive', color: '#7A6058', fontSize: '0.9rem' }}>
                    {v.college} · {v.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes bounce {
          from { transform: translateY(0) rotate(0deg); }
          to { transform: translateY(-12px) rotate(15deg); }
        }
      `}</style>
    </main>
  )
}
