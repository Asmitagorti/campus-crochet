import type { Product } from '../types';

export const products: Product[] = [];

export interface PastCreation {
  id: string;
  product: string;
  status: 'completed';
  date: string;
  college: string;
  price: number;
  color: string;
  image: string;
}

export const pastCreations: PastCreation[] = [];
