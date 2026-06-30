import CollectionsClient from "@/components/collections/CollectionsClient";
import { getBrands } from "@/services/brand.service";
import { getProducts } from "@/services/product.service";

export default async function CollectionsPage() {
  try {
    const [brands, productResponse] = await Promise.all([
      getBrands(),
      getProducts({
        per_page: 100,
      }),
    ]);

    return (
      <CollectionsClient
        brands={brands}
        products={productResponse?.data || []}
      />
    );
  } catch (error) {
    console.log("Collections API error:", error.message);

    return <CollectionsClient brands={[]} products={[]} apiError />;
  }
}