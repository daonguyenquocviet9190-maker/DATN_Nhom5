import Link from "next/link";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import { getProductById, getProducts } from "@/services/product.service";

function extractProduct(response) {
  return (
    response?.data?.product ||
    response?.data ||
    response?.product ||
    response ||
    null
  );
}

function extractProducts(response) {
  return (
    response?.data?.products ||
    response?.data ||
    response?.products ||
    []
  );
}

export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const productId = resolvedParams?.id;

  if (!productId) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] py-16">
        <div className="container-page">
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-black text-slate-950">
              Đường dẫn sản phẩm không hợp lệ
            </h1>

            <Link
              href="/shop"
              className="btn-primary mt-7 inline-flex rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wider"
            >
              Quay lại cửa hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  try {
    const productResponse = await getProductById(productId);
    const product = extractProduct(productResponse);

    if (!product?.id) {
      throw new Error("Không tìm thấy sản phẩm.");
    }

    let relatedProducts = [];

    if (product?.category_id) {
      const relatedResponse = await getProducts({
        category: product.category_id,
        per_page: 8,
      });

      relatedProducts = extractProducts(relatedResponse).filter(
        (item) => Number(item.id) !== Number(product.id)
      );
    }

    return (
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
      />
    );
  } catch (error) {
    console.log("Product detail API error:", error?.message);

    return (
      <div className="min-h-screen bg-[#f7f8fb] py-16">
        <div className="container-page">
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
              Dynova Sport
            </p>

            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Không tìm thấy sản phẩm
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
              Sản phẩm có thể đã bị ẩn, hết hàng hoặc API sản phẩm chưa trả đúng
              dữ liệu. Bạn quay lại cửa hàng để chọn sản phẩm khác nha.
            </p>

            <Link
              href="/shop"
              className="btn-primary mt-7 inline-flex rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wider"
            >
              Quay lại cửa hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }
}