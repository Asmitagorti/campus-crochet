import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { loadDisplayMode } from "@/lib/site-mode";
import { loadProducts } from "@/lib/store-data";
import ProductDetail from "@/components/product-detail";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (await loadDisplayMode() === "poll") return { title: "Design poll | Campus Crochet" };
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
  if (await loadDisplayMode() === "poll") redirect("/vote");
  const { slug } = await params,
    p = (await loadProducts()).find((p) => p.id === slug);
  if (!p) notFound();
  return <ProductDetail product={p} />;
}
