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

export type AuthUser = {
  id?: string
  username?: string
  email: string
  role: 'admin' | 'student' | 'customer'
  name: string

  college?: string
  department?: string
  year?: string
  phone?: string
  rollnumber?: string
}

export type CartItem = {
  productId: string
  color: string
  quantity: number
}

export type Navigate = (
  target: Page,
  data?: Record<string, string>
) => void