import { notFound } from "next/navigation";
import CollectionDetailClient from "@/components/collections/CollectionDetailClient";
import { getBrands } from "@/services/brand.service";
import { getProducts } from "@/services/product.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function CollectionDetailPage({ params }) {
  const { slug } = await params;

  let brands = [];

  try {
    brands = await getBrands();
  } catch {
    brands = [];
  }

  const brand = brands.find(
    (item) => String(item?.slug || "").toLowerCase() === String(slug || "").toLowerCase()
  );

  if (!brand) {
    notFound();
  }

  let products = [];

  try {
    const response = await getProducts({
      brand: brand.id,
      per_page: 100,
    });

    products = Array.isArray(response?.data) ? response.data : [];
  } catch {
    products = [];
  }

  const relatedBrands = brands
    .filter((item) => Number(item?.id) !== Number(brand.id))
    .slice(0, 6);

  return (
    <CollectionDetailClient
      brand={brand}
      products={products}
      relatedBrands={relatedBrands}
    />
  );
}
