"use client";

import { useState, useEffect, useCallback } from 'react'
import type { Page, Navigate, AuthUser, CartItem } from '../types'
import Navbar from './Navbar'
import Footer from './Footer'
import LoginModal from './LoginModal'
import HomePage from '../pages/HomePage'
import CatalogPage from '../pages/CatalogPage'
import ProductDetailPage from '../pages/ProductDetailPage'
import CustomerDashboard from '../pages/CustomerDashboard'
import AdminDashboard from '../pages/AdminDashboard'
import AddProductPage from '../pages/AddProductPage'
import PastCreationsPage from '../pages/PastCreationsPage'
import PaymentPage from '../pages/PaymentPage'
import { supabase } from '../lib/supabase'
import AboutPage from '../pages/AboutPage'
import CartPage from '../pages/CartPage'

import TestAPI from "./TestAPI";

const ADMIN_PAGES: Page[] = ['admin', 'add-product', 'past-creations']
const NO_FOOTER_PAGES: Page[] = ['admin', 'add-product', 'past-creations']

export default function App() {
  console.log("🔥 APP IS RUNNING")
  const [user, setUser] = useState<AuthUser | null>(null)
  const [page, setPage] = useState<Page>('home')
  const [pageData, setPageData] = useState<Record<string, string>>({})
  const [cart, setCart] = useState<CartItem[]>([])

  // Login modal state
  const [loginMode, setLoginMode] = useState<'toast' | 'modal' | null>(null)
  const [scrollPromptDismissed, setScrollPromptDismissed] = useState(false)

  // Login count (admin stat)
  const [loginCount, setLoginCount] = useState(0)

  useEffect(() => {
  async function restoreSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      console.log("🔐 Existing session found:", session.user.email)

      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email ?? '',
        role: session.user.user_metadata?.role ?? 'customer',
        name: session.user.user_metadata?.name ?? '',
      }

      setUser(authUser)
    }
  }

  restoreSession()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (!session?.user) {
        setUser(null)
        return
      }

      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email ?? '',
        role: session.user.user_metadata?.role ?? 'customer',
        name: session.user.user_metadata?.name ?? '',
      }

      setUser(authUser)
    }
  )

  return () => {
    subscription.unsubscribe()
  }
}, [])
  // Scroll-triggered toast: show after 600px, once per session
  useEffect(() => {
    if (user || scrollPromptDismissed) return
    function onScroll() {
      if (window.scrollY > 600 && !scrollPromptDismissed && !user) {
        setLoginMode('toast')
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [user, scrollPromptDismissed])

  const navigate: Navigate = useCallback((target, data) => {
    console.log("🚀 NAVIGATE CALLED:", target)
    setPage(target)
    if (data) setPageData(data)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  function handleLogin(authedUser: AuthUser) {
    setUser(authedUser)
    setLoginCount(c => c + 1)
    setLoginMode(null)
    setScrollPromptDismissed(true)
    if (authedUser.role === 'admin') {
      navigate('admin')
    } else if (page === 'payment' || page === 'dashboard') {
      // stay on current page
    } else {
      // stay on whatever page they were on
    }
  }

  async function handleLogout() {
  await supabase.auth.signOut()

  setUser(null)
  setCart([])
  setPage('home')

  window.scrollTo({ top: 0 })
}

  function openLogin() {
    setLoginMode('modal')
  }

  function dismissLogin() {
    setLoginMode(null)
    if (!user) setScrollPromptDismissed(true)
  }

  // Cart helpers
 function addToCart(productId: string, color: string, quantity = 1) {
  if (!user) {
    openLogin()
    return false
  }

  setCart(prev => {
    const existing = prev.find(
      i => i.productId === productId && i.color === color
    )

    if (existing) {
      return prev.map(i =>
        i.productId === productId && i.color === color
          ? { ...i, quantity: i.quantity + quantity }
          : i
      )
    }

    return [...prev, { productId, color, quantity }]
  })

  return true
}

  function updateCartQty(productId: string, color: string, qty: number) {
    if (qty <= 0) {
      removeFromCart(productId, color)
    } else {
      setCart(prev => prev.map(i => i.productId === productId && i.color === color ? { ...i, quantity: qty } : i))
    }
  }

  function removeFromCart(productId: string, color: string) {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.color === color)))
  }

  function clearCart() {
    setCart([])
  }

  const showNavbar = !ADMIN_PAGES.includes(page)
  const showFooter = !NO_FOOTER_PAGES.includes(page)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFDF8', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {showNavbar && (
        <Navbar
          page={page}
          navigate={navigate}
          cart={cart}
          user={user}
          onLoginClick={openLogin}
          onLogout={handleLogout}
        />
      )}
      {page === 'home' && <HomePage navigate={navigate} onAddToCart={addToCart} />}
      {page === 'catalog' && (
  <CatalogPage
    navigate={navigate}
    cart={cart}
    onAddToCart={addToCart}
    onUpdateQty={updateCartQty}
  />
)}
      {page === 'product' && <ProductDetailPage navigate={navigate} productId={pageData.id ?? null} onAddToCart={addToCart} />}
      {page === 'dashboard' && <CustomerDashboard navigate={navigate} user={user} />}
      {page === 'admin' && <AdminDashboard navigate={navigate} onLogout={handleLogout} loginCount={loginCount} />}
      {page === 'add-product' && <AddProductPage navigate={navigate} />}
      {page === 'past-creations' && <PastCreationsPage navigate={navigate} />}
      {page === 'payment' && (
        <PaymentPage
          navigate={navigate}
          cart={cart}
          user={user}
          onClearCart={clearCart}
        />
      )}
      {page === 'about' && <AboutPage navigate={navigate} />}
      {page === 'cart' && (
        <CartPage
          navigate={navigate}
          cart={cart}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          user={user}
          onRequireLogin={openLogin}
        />
      )}

      {showFooter && <Footer navigate={navigate} />}

      {/* Login modal/toast */}
      {loginMode && (
        <LoginModal
          mode={loginMode}
          onLogin={handleLogin}
          onDismiss={dismissLogin}
        />
      )}
    </div>
  )
}