import HomeClient from "@/components/home/HomeClient";

import { getProducts } from "@/services/product.service";

export default async function HomePage() {

    const products = await getProducts();

    return (

        <HomeClient

            products={products}

        />

    );

}