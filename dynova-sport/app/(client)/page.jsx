import HomeClient from "@/components/home/HomeClient";
import { products } from "@/data/shop";

export default function HomePage() {
  return <HomeClient products={products} />;
}
