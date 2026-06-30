import HomeClient from "@/components/home/HomeClient";
import { getHomeData } from "@/services/home.service";

export default async function HomePage() {
  try {
    const data = await getHomeData();

    return (
      <HomeClient
        products={data.products}
        banners={data.banners}
        apiCategories={data.categories}
        apiBrands={data.brands}
      />
    );
  } catch (error) {
    console.log("Home API error:", error.message);

    return (
      <HomeClient
        products={[]}
        banners={[]}
        apiCategories={[]}
        apiBrands={[]}
      />
    );
  }
}