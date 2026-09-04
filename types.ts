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
  | 'ai-assistant';

export type AuthUser = {
  id: string;
  username?: string;
  email: string;
  role: 'admin' | 'student' | 'customer';
  name: string;

  college?: string;
  department?: string;
  year?: string;
  phone?: string;
  rollnumber?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  colors: string[];
  image: string;
  badge?: string;
  description: string;
  short_description?: string;
  care?: string;
  stock?: number;
  is_available?: boolean;
  featured?: boolean;
  processing_time_days?: number;
  processing_time?: string;
  updated_at?: string;
}

export interface ProductWithImages extends Product {
  product_images?: { image_id: string; image_url: string; display_order: number }[];
  product_colors?: { color_id: string; color_name: string }[];
}

export type CartItem = {
  productId: string;
  color: string;
  quantity: number;
  id?: string;
}

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded';

export type OrderLifecycleStatus =
  | 'pending'
  | 'payment_received'
  | 'yarn_selected'
  | 'crocheting'
  | 'quality_check'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  total_price: number;
  payment_status: PaymentStatus;
  order_status: OrderLifecycleStatus;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  selected_color: string;
  quantity: number;
  price_at_purchase: number;
  products?: Product;
}

export interface CustomRequest {
  id: string;
  user_id?: string;
  name: string;
  item_name: string;
  occasion?: string;
  colors?: string;
  email?: string;
  description?: string;
  budget?: number;
  status: CustomRequestStatus;
  admin_price?: number;
  admin_notes?: string;
  student_response?: 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export type CustomRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'counter_offered'
  | 'student_accepted'
  | 'paid'
  | 'in_production'
  | 'ready'
  | 'completed';

export type Navigate = (
  target: Page,
  data?: Record<string, string>
) => void

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: Product[];
  needsFollowUp?: boolean;
  followUpQuestion?: string;
  timestamp: Date;
}