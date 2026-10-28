import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadProducts } from "@/lib/store-data";
import ProductDetail from "@/components/product-detail";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params,
    p = (await loadProducts()).find((p) => p.id === slug);
  if (!p) notFound();
  return {
    title: `${p.name} | Campus-Crochet`,
    description: p.description,
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    p = (await loadProducts()).find((p) => p.id === slug);
  if (!p) notFound();
  return <ProductDetail product={p} />;
}
