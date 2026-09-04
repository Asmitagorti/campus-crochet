import type { Product } from '../types'

export const products: Product[] = [
  {
    id: '1',
    name: 'Daisy Scrunchie',
    price: 120,
    category: 'Scrunchies',
    colors: ['Dusty Rose', 'Cream', 'Sage Green'],
    image: 'https://images.unsplash.com/photo-1700171394718-2457b1190444?w=600&h=750&fit=crop&auto=format',
    badge: 'Bestseller',
    description: 'A delicate daisy-adorned scrunchie handcrafted with soft cotton yarn. Each flower is individually crocheted and attached by hand — no two are exactly alike.',
    care: 'Hand wash in cold water. Lay flat to dry. Do not tumble dry or bleach.',
  },
  {
    id: '2',
    name: 'Flower Keychain',
    price: 85,
    category: 'Keychains',
    colors: ['Sage Green', 'White', 'Lavender'],
    image: 'https://images.unsplash.com/photo-1716400128984-3681f2005d22?w=600&h=750&fit=crop&auto=format',
    badge: 'Popular',
    description: 'A sweet crochet flower keychain to brighten your everyday carry. Comes with a sturdy metal keyring and a tiny bead accent. Perfect gift for a friend.',
    care: 'Spot clean only. Avoid prolonged exposure to water.',
  },
  {
    id: '3',
    name: 'Pastel Phone Charm',
    price: 150,
    category: 'Charms',
    colors: ['Lavender', 'Blush Pink', 'Cream'],
    image: 'https://images.unsplash.com/photo-1700170928599-d7fc2d4ec97f?w=600&h=750&fit=crop&auto=format',
    badge: 'New',
    description: 'A soft pastel phone charm made with fine cotton thread. Includes a micro crochet flower, seed beads, and a clip attachment for most phone cases.',
    care: 'Spot clean only. Handle with care — beads are hand-sewn.',
  },
  {
    id: '4',
    name: 'Sunflower Bookmark',
    price: 70,
    category: 'Bookmarks',
    colors: ['Sunflower Yellow', 'Terracotta', 'Brown'],
    image: 'https://images.unsplash.com/photo-1700171458554-46cfd3f2a87a?w=600&h=750&fit=crop&auto=format',
    description: 'A cheerful crochet sunflower bookmark that peeks out from your pages. Made with warm cotton yarn and a satin ribbon tail.',
    care: 'Handle gently. Spot clean if needed.',
  },
  {
    id: '5',
    name: 'Mini Tote Bag',
    price: 350,
    category: 'Bags',
    colors: ['Natural Cream', 'Sage Green', 'Dusty Rose'],
    image: 'https://images.unsplash.com/photo-1728393287642-13bee7126ae8?w=600&h=750&fit=crop&auto=format',
    badge: 'Featured',
    description: 'A fully hand-crocheted mini tote bag, sturdy enough for your essentials. Lined with cotton fabric inside, with a floral embellishment on the front.',
    care: 'Hand wash in cold water with mild detergent. Air dry completely before use.',
  },
  {
    id: '6',
    name: 'Heart Coaster Set',
    price: 180,
    category: 'Home',
    colors: ['Mixed Pastels', 'Rose & Cream', 'Sage & White'],
    image: 'https://images.unsplash.com/photo-1700171518313-5dd219beaaa6?w=600&h=750&fit=crop&auto=format',
    description: 'A set of 4 heart-shaped coasters crocheted in soft cotton. Absorbent and charming — a warm touch for your study table or bedside.',
    care: 'Machine washable on gentle cycle. Lay flat to dry.',
  },
]

// Local shape used by the admin "Past Creations" archive. Independent
// of the Supabase Order type so the seed data keeps working without
// needing a DB row for every historical order.
export interface PastCreation {
  id: string
  product: string
  status: 'completed'
  date: string
  college: string
  price: number
  color: string
  image: string
}

export const pastCreations: PastCreation[] = [
  {
    id: 'ORD-001',
    product: 'Daisy Scrunchie',
    status: 'completed',
    date: 'Aug 12, 2026',
    college: 'ACET',
    price: 120,
    color: 'Sage Green',
    image: 'https://images.unsplash.com/photo-1700171394718-2457b1190444?w=400&h=500&fit=crop&auto=format',
  },
  {
    id: 'ORD-002',
    product: 'Flower Keychain',
    status: 'completed',
    date: 'Aug 5, 2026',
    college: 'AEC',
    price: 85,
    color: 'Lavender',
    image: 'https://images.unsplash.com/photo-1716400128984-3681f2005d22?w=400&h=500&fit=crop&auto=format',
  },
  {
    id: 'ORD-003',
    product: 'Mini Tote Bag',
    status: 'completed',
    date: 'Jul 28, 2026',
    college: 'Aditya Degree College',
    price: 350,
    color: 'Natural Cream',
    image: 'https://images.unsplash.com/photo-1728393287642-13bee7126ae8?w=400&h=500&fit=crop&auto=format',
  },
  {
    id: 'ORD-004',
    product: 'Pastel Phone Charm',
    status: 'completed',
    date: 'Jul 20, 2026',
    college: 'ACET',
    price: 150,
    color: 'Blush Pink',
    image: 'https://images.unsplash.com/photo-1700170928599-d7fc2d4ec97f?w=400&h=500&fit=crop&auto=format',
  },
]

export const activeOrders: PastCreation[] = [
  {
    id: 'ORD-007',
    product: 'Daisy Scrunchie',
    status: 'completed',
    date: 'Jul 18, 2026',
    college: 'ACET',
    price: 120,
    color: 'Dusty Rose',
    image: 'https://images.unsplash.com/photo-1700171394718-2457b1190444?w=400&h=500&fit=crop&auto=format',
  },
]
