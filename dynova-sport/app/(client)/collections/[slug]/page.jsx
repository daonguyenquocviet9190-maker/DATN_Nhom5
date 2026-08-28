import { notFound } from "next/navigation";
import CollectionDetailClient from "@/components/collections/CollectionDetailClient";
import SeasonProductGrid from "@/components/collections/SeasonProductGrid";
import { getBrands } from "@/services/brand.service";
import { getProducts } from "@/services/product.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Danh sách bộ sưu tập theo mùa (đồng bộ với trang danh sách collections)
const seasonalCollections = [
  {
    slug: "xuan-he-2026",
    tag: "SPRING/SUMMER",
    title: "Xuân/Hè 2026",
    description: "Chất liệu thoáng nhẹ, bảng màu tươi sáng cho những ngày nắng ấm.",
    image: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=1600&q=80",
  },
  {
    slug: "thu-dong-2026",
    tag: "FALL/WINTER",
    title: "Thu/Đông 2026",
    description: "Layering ấm áp, tông trầm cùng chất liệu giữ nhiệt vượt trội.",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=80",
  },
  {
    slug: "le-hoi-cuoi-nam-2026",
    tag: "HOLIDAY DROP",
    title: "Lễ Hội Cuối Năm 2026",
    description: "Phiên bản giới hạn dịp lễ với chi tiết ánh kim nổi bật.",
    image: "https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=1600&q=80",
  },
  {
    slug: "pre-fall-2026",
    tag: "PRE-FALL",
    title: "Pre-Fall 2026",
    description: "Bộ sưu tập chuyển mùa, kết hợp linh hoạt giữa thể thao và đời thường.",
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1600&q=80",
  },
];

export default async function CollectionDetailPage({ params }) {
  const { slug } = await params;
  const normalizedSlug = String(slug || "").toLowerCase();

  // 1. Kiểm tra xem slug có phải là bộ sưu tập theo MÙA không
  const season = seasonalCollections.find(
    (item) => item.slug.toLowerCase() === normalizedSlug
  );

  if (season) {
    let products = [];
    try {
      // Nếu API hỗ trợ lọc theo season/tag thì truyền thêm param ở đây,
      // ví dụ: { season: season.slug, per_page: 400 }
      const response = await getProducts({ per_page: 400 });
      products = Array.isArray(response?.data) ? response.data : [];
    } catch {
      products = [];
    }

    return (
      <div className="min-h-screen bg-white">
        <div className="relative h-[45vh] md:h-[55vh] w-full overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${season.image}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12 max-w-4xl">
            <span className="self-start text-[10px] font-bold uppercase tracking-widest text-white/80 bg-white/10 backdrop-blur-sm px-2.5 py-1 border border-white/20 mb-3">
              {season.tag}
            </span>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-3">
              {season.title}
            </h1>
            <p className="text-sm md:text-base text-white/80 max-w-xl">
              {season.description}
            </p>
          </div>
        </div>

        <div className="p-6 md:p-12">
          <SeasonProductGrid products={products} />
        </div>
      </div>
    );
  }

  // 2. Nếu không phải mùa, xử lý như bộ sưu tập theo THƯƠNG HIỆU (logic cũ)
  let brands = [];
  try {
    brands = await getBrands();
  } catch {
    brands = [];
  }

  const brand = brands.find(
    (item) => String(item?.slug || "").toLowerCase() === normalizedSlug
  );

  if (!brand) {
    notFound();
  }

  let products = [];
  try {
    const response = await getProducts({
      brand: brand.id,
      per_page: 400,
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