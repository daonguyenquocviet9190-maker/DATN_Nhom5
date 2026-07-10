import Link from "next/link";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import { getProductById, getProducts } from "@/services/product.service";
import {
  extractProduct,
  extractProducts,
  normalizeProduct,
} from "@/utils/productNormalizer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function ErrorState({
  title = "Không tìm thấy sản phẩm",
  description = "Sản phẩm có thể đã bị ẩn hoặc không còn tồn tại.",
}) {
  return (
    <main className="min-h-screen bg-[#f7f8fb] py-16">
      <div className="container-page">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
            Dynova Sport
          </p>

          <h1 className="mt-3 text-3xl font-black text-slate-950">
            {title}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
            {description}
          </p>

          <Link
            href="/shop"
            className="btn-primary mt-7 inline-flex rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wider"
          >
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const productId = resolvedParams?.id;

  if (!productId) {
    return (
      <ErrorState
        title="Đường dẫn sản phẩm không hợp lệ"
        description="Không xác định được mã sản phẩm trong đường dẫn."
      />
    );
  }

  try {
    const productResponse = await getProductById(productId);
    const rawProduct = extractProduct(productResponse);
    const product = normalizeProduct(rawProduct);

    if (!product?.id) {
      throw new Error("Không tìm thấy sản phẩm.");
    }

    let relatedProducts = [];

    if (product.category_id) {
      const relatedResponse = await getProducts({
        category: product.category_id,
        per_page: 8,
      });

      relatedProducts = extractProducts(relatedResponse)
        .map(normalizeProduct)
        .filter(
          (item) =>
            item?.id &&
            Number(item.id) !== Number(product.id)
        )
        .slice(0, 8);
    }

    return (
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
      />
    );
  } catch (error) {
    console.log("Product detail API error:", error?.message || error);

    return (
      <ErrorState
        description="Sản phẩm có thể đã bị ẩn hoặc API sản phẩm chưa trả đủ dữ liệu thương hiệu, size và màu."
      />
    );
  }
}
