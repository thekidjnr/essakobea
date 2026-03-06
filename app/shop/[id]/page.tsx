import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import ProductDetail from "@/components/shop/ProductDetail";
import { adminDb } from "@/lib/supabase/admin";
import { dbToProduct } from "@/lib/products";
import type { DbProduct } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data } = await adminDb.from("products").select("name,description").eq("slug", id).single();
  if (!data) return { title: "Product Not Found — Essakobea" };
  return {
    title: `${data.name} — Essakobea`,
    description: data.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: productData }, { data: relatedData }] = await Promise.all([
    adminDb.from("products").select("*").eq("slug", id).single(),
    adminDb.from("products").select("*").order("display_order", { ascending: true }),
  ]);

  if (!productData) notFound();

  const product = dbToProduct(productData as DbProduct);
  const related = ((relatedData as DbProduct[]) ?? [])
    .filter((p) => p.category === productData.category && p.slug !== id)
    .slice(0, 3)
    .map(dbToProduct);

  return (
    <>
      <Nav />
      <ProductDetail product={product} related={related} />
      <Footer />
    </>
  );
}
