export function effectiveProductPrice(regular: number, discount: number | null | undefined, saleActive: boolean) {
  if (saleActive && discount != null && Number.isFinite(discount) && discount > 0 && discount < regular)
    return { price: discount, regularPrice: regular };
  return { price: regular, regularPrice: null };
}
