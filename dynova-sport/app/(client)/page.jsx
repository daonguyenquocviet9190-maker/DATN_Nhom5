import HomeClient from "@/components/home/HomeClient";
import { getProducts } from "@/services/product.service";

export default async function HomePage() {

    const products = await getProducts();

    console.log(products);

    return (
        <HomeClient
            products={products}
        />
    );
}