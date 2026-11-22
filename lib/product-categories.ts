import type { Product } from "./catalog";

type CategoryProduct = Pick<Product, "category" | "gallery"> & Partial<Pick<Product, "categories" | "active">>;

export function productCategoryNames(product: Pick<Product, "category"> & Partial<Pick<Product, "categories">>): string[] {
  const chosen = Array.isArray(product.categories) ? product.categories.filter((name) => typeof name === "string" && name.trim()) : [];
  return chosen.length ? chosen : product.category ? [product.category] : [];
}

export function belongsToCategory(product: Pick<Product, "category"> & Partial<Pick<Product, "categories">>, name: string): boolean {
  return productCategoryNames(product).includes(name);
}

export function visibleCategoryGroups(products: CategoryProduct[], preferred: readonly string[]) {
  const groups = new Map<string, { name: string; count: number; image: string }>();
  for (const product of products) {
    if (product.active === false) continue;
    for (const name of productCategoryNames(product)) {
      const current = groups.get(name);
      if (current) current.count++;
      else groups.set(name, { name, count: 1, image: product.gallery[0] || "" });
    }
  }
  return [...groups.values()].sort((a, b) => {
    const aIndex = preferred.indexOf(a.name);
    const bIndex = preferred.indexOf(b.name);
    return (aIndex < 0 ? preferred.length : aIndex) - (bIndex < 0 ? preferred.length : bIndex)
      || a.name.localeCompare(b.name);
  });
}

export function parseProductCategories(raw: unknown, legacy: unknown, known: readonly string[] = []): string[] {
  const values = raw === undefined ? [legacy] : raw;
  if (!Array.isArray(values) || values.length < 1 || values.length > 8)
    throw Error("Choose between one and eight categories.");
  const names = values.map((value) => {
    const name = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
    return known.find((item) => item.toLocaleLowerCase("en-IN") === name.toLocaleLowerCase("en-IN")) || name;
  });
  if (names.some((name) => name.length < 2 || name.length > 50 || name.toLowerCase() === "all" ||
    !/^[\p{L}\p{N}][\p{L}\p{N} .&/,'()+-]*$/u.test(name)) ||
    new Set(names.map((name) => name.toLocaleLowerCase("en-IN"))).size !== names.length)
    throw Error("Check your category names. Use distinct names of 2–50 letters, numbers or simple punctuation.");
  return names;
}
