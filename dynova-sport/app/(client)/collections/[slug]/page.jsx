import { notFound } from "next/navigation";
import CollectionDetailClient from "@/components/collections/CollectionDetailClient";
import { getBrands } from "@/services/brand.service";
import { getProducts } from "@/services/product.service";

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function matchProductBrand(product, brand) {
  const brandId =
    product?.brand_id ||
    product?.brand_data?.id ||
    product?.brandInfo?.id ||
    product?.brand?.id;

  const brandName =
    product?.brand_data?.name ||
    product?.brandInfo?.name ||
    product?.brand?.name ||
    product?.brand;

  return (
    Number(brandId) === Number(brand?.id) ||
    normalizeText(brandName) === normalizeText(brand?.name)
  );
}

export default async function CollectionDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  try {
    const brands = await getBrands();

    const brand = brands.find((item) => item.slug === slug);

    if (!brand) {
      notFound();
    }

    const productResponse = await getProducts({
      brand: brand.id,
      per_page: 24,
    });

    let products = productResponse?.data || [];

    if (products.length === 0) {
      const fallbackResponse = await getProducts({
        per_page: 100,
      });

      products = (fallbackResponse?.data || []).filter((product) =>
        matchProductBrand(product, brand)
      );
    }

    return (
      <CollectionDetailClient
        brand={brand}
        products={products}
        relatedBrands={brands.filter((item) => item.id !== brand.id)}
      />
    );
  } catch (error) {
    console.log("Collection detail API error:", error.message);
    notFound();
  }
}