import type { Navigate, CartItem, AuthUser } from "@/types"
import { YarnBall } from "../YarnDecor"
import { useProducts } from "@/lib/hooks"

interface Props {
  navigate: Navigate
  cart: CartItem[]
  onUpdateQty: (productId: string, color: string, qty: number) => void
  onRemove: (productId: string, color: string) => void
  user: AuthUser | null
  onRequireLogin: () => void
}

export default function CartPage({ navigate, cart, onUpdateQty, onRemove, user, onRequireLogin }: Props) {
  const { products, loading } = useProducts()
  const cartWithDetails = cart.map(item => ({
    ...item,
    product: products.find(p => p.id === item.productId),
  })).filter(i => i.product)

  const subtotal = cartWithDetails.reduce((sum, i) => sum + (i.product!.price * i.quantity), 0)

  function handleCheckout() {
    if (!user) { onRequireLogin(); return }
    navigate('payment')
  }

  if (cart.length === 0) {
    return (
      <main style={{ minHeight: '60vh', backgroundColor: '#FFFDF8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <YarnBall size={72} color="#EDD4D4" />
        <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#2E1D15' }}>Your cart is empty</h2>
        <p style={{ color: '#7A6058', fontSize: '0.9rem', maxWidth: 300 }}>Add a handmade piece to your cart to get started.</p>
        <button onClick={() => navigate('catalog')} style={{ backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 600, padding: '0.75rem 2rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
          Browse Collection
        </button>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FFFDF8' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#2E1D15', marginBottom: '0.4rem' }}>Your Cart</h1>
        <p style={{ color: '#7A6058', fontSize: '0.85rem', marginBottom: '2rem' }}>{cart.length} item{cart.length !== 1 ? 's' : ''} Â· all handmade to order</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cartWithDetails.map(item => (
              <div key={`${item.productId}-${item.color}`} style={{ backgroundColor: '#F7F3EC', borderRadius: 20, border: '1px solid #EDD4D4', padding: '1.25rem', display: 'grid', gridTemplateColumns: '88px 1fr', gap: '1.25rem', alignItems: 'center' }}>
                {/* Image */}
                <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '4/5', backgroundColor: '#EDD4D4', cursor: 'pointer' }} onClick={() => navigate('product', { id: item.productId })}>
                  <img src={item.product!.image} alt={item.product!.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Info */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                    <button onClick={() => navigate('product', { id: item.productId })} style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 600, fontSize: '1rem', color: '#2E1D15', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                      {item.product!.name}
                    </button>
                    <button onClick={() => onRemove(item.productId, item.color)} style={{ color: '#B88080', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: '0.5rem' }}>
                      Remove
                    </button>
                  </div>
                  <p style={{ color: '#7A6058', fontSize: '0.78rem', marginBottom: '0.25rem' }}>{item.product!.category}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#EDD4D4', color: '#8B6B5C', padding: '0.15rem 0.5rem', borderRadius: 50 }}>{item.color}</span>
                    <span style={{ fontSize: '0.72rem', color: '#A8B8A0' }}>Â· 3â€“5 working days</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Qty */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid #EDD4D4', borderRadius: 50, overflow: 'hidden' }}>
                      <button onClick={() => onUpdateQty(item.productId, item.color, Math.max(1, item.quantity - 1))} style={{ padding: '0.3rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: '#7A6058', fontSize: '1rem' }}>âˆ’</button>
                      <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#2E1D15' }}>{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.productId, item.color, item.quantity + 1)} style={{ padding: '0.3rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: '#7A6058', fontSize: '1rem' }}>+</button>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#C97B63' }}>â‚¹{item.product!.price * item.quantity}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue shopping */}
            <button onClick={() => navigate('catalog')} style={{ color: '#C97B63', fontSize: '0.85rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.25rem 0' }}>
              â† Continue shopping
            </button>
          </div>

          {/* Order summary */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ backgroundColor: '#F7F3EC', borderRadius: 20, border: '1px solid #EDD4D4', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #EDD4D4' }}>
                <h3 style={{ fontWeight: 700, color: '#2E1D15', fontSize: '1rem' }}>Order Summary</h3>
              </div>
              <div style={{ padding: '1.25rem 1.5rem' }}>
                {/* Line items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #EDD4D4' }}>
                  {cartWithDetails.map(i => (
                    <div key={`${i.productId}-${i.color}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#7A6058' }}>{i.product!.name} Ã— {i.quantity}</span>
                      <span style={{ color: '#2E1D15', fontWeight: 500 }}>â‚¹{i.product!.price * i.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#7A6058' }}>Subtotal</span>
                    <span style={{ color: '#2E1D15' }}>â‚¹{subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#A8B8A0' }}>Delivery</span>
                    <span style={{ color: '#A8B8A0' }}>â‚¹0 Â· campus pickup</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.6rem', borderTop: '1px solid #EDD4D4', marginTop: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#2E1D15', fontSize: '0.95rem' }}>Total</span>
                    <span style={{ fontWeight: 700, color: '#C97B63', fontSize: '1.15rem' }}>â‚¹{subtotal}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  style={{ width: '100%', backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 700, padding: '0.9rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(201,123,99,0.3)', marginBottom: '0.75rem', transition: 'background-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A86248'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C97B63'}
                >
                  Proceed to Checkout â†’
                </button>

                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A8B8A0" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3L20 6v6c0 5.25-3.5 9.75-8 11C7.5 21.75 4 17.25 4 12V6z"/></svg>
                  <span style={{ color: '#7A6058', fontSize: '0.72rem' }}>Secured by Razorpay</span>
                </div>
              </div>
            </div>

            {/* Info note */}
            <div style={{ backgroundColor: '#F7F3EC', borderRadius: 14, padding: '0.85rem 1rem', border: '1px solid #EDD4D4', marginTop: '0.75rem' }}>
              <p style={{ color: '#7A6058', fontSize: '0.75rem', lineHeight: 1.6 }}>
                ðŸ§¶ Each item is made fresh after your order. Campus pickup only â€” no delivery charges, no shipping.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
