export type Page =
  | 'home'
  | 'catalog'
  | 'product'
  | 'dashboard'
  | 'admin'
  | 'add-product'
  | 'past-creations'
  | 'payment'
  | 'about'
  | 'cart'

export type Navigate = (page: Page, data?: Record<string, string>) => void

export interface Product {
  id: string
  name: string
  price: number
  category: string
  colors: string[]
  image: string
  badge?: string
  description: string
  care: string
  stock?: number
}

export interface Order {
  id: string
  product: string
  status: 'payment_received' | 'yarn_selected' | 'crocheting' | 'quality_check' | 'ready' | 'completed'
  date: string
  college: string
  price: number
  color: string
  image: string
}

export interface CartItem {
  productId: string
  color: string
  quantity: number
}

export interface AuthUser {
  username: string
  role: 'student' | 'admin'
  name: string
  email?: string
  rollNumber?: string
  college?: string
  department?: string
  year?: string
  phone?: string
}
