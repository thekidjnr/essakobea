import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import ProductDetail from "@/components/shop/ProductDetail";
import { PRODUCTS } from "@/components/shop/shopData";

export async function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return { title: "Product Not Found — Essakobea" };
  return {
    title: `${product.name} — Essakobea`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <>
      <Nav />
      <ProductDetail product={product} />
      <Footer />
    </>
  );
}
