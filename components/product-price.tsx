import type { Product } from "@/lib/catalog";
import { money } from "@/lib/catalog";

export default function ProductPrice({
  product,
  quantity = 1,
  showSavings = true,
}: {
  product: Product;
  quantity?: number;
  showSavings?: boolean;
}) {
  const regularPrice = product.regularPrice;
  const isDiscounted = regularPrice != null && regularPrice > product.price;
  const discountPercent = isDiscounted
    ? Math.floor(((regularPrice - product.price) / regularPrice) * 100)
    : 0;

  return (
    <span className="product-price">
      <span className="product-price__current">{money(product.price * quantity)}</span>
      {isDiscounted && (
        <span className="product-price__original">
          Regular <del>{money(regularPrice * quantity)}</del>
        </span>
      )}
      {isDiscounted && showSavings && discountPercent > 0 && (
        <span className="product-price__saving">({discountPercent}% OFF)</span>
      )}
    </span>
  );
}
