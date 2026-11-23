import type { Product } from "@/lib/catalog";
import { money } from "@/lib/catalog";

export default function ProductPrice({ product, quantity = 1 }: { product: Product; quantity?: number }) {
  return <span className="product-price">
    {product.regularPrice != null && <del>{money(product.regularPrice * quantity)}</del>}
    <span>{money(product.price * quantity)}</span>
  </span>;
}
