import Link from "next/link";
import HomeClient from "@/components/home/HomeClient";
import { getHomeData } from "@/services/home.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const EMPTY_HOME = {
  products: [],
  banners: [],
  categories: [],
  brands: [],
};

function getArray(value) {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.data)) return value.data;

  return [];
}

function normalizeHomeData(response) {
  const data = response?.data || response || {};

  return {
    products: getArray(data.products),
    banners: getArray(data.banners),
    categories: getArray(data.categories),
    brands: getArray(data.brands),
  };
}

function isEmptyHome(data) {
  return (
    data.products.length === 0 &&
    data.banners.length === 0 &&
    data.categories.length === 0 &&
    data.brands.length === 0
  );
}

function HomeFallback() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] py-16">
      <section className="container-page">
        <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 px-6 py-12 text-white md:px-10 md:py-16">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
              Dynova Sport
            </p>

            <h1 className="mt-4 max-w-2xl text-4xl font-black uppercase leading-tight tracking-[-0.05em] md:text-5xl">
              Trang chủ đang chờ dữ liệu
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
              Hiện chưa thể tải nội dung trang chủ. Vui lòng thử lại sau.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-orange-500 px-6 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
              >
                Vào cửa hàng
              </Link>

              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/20"
              >
                Tải lại trang
              </Link>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
            {[
              "Dữ liệu đang tạm thời gián đoạn. Vui lòng thử tải lại trang.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="text-sm font-bold leading-6 text-slate-600">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function HomePage() {
  let homeData = EMPTY_HOME;

  try {
    const response = await getHomeData();
    homeData = normalizeHomeData(response);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Không thể tải trang chủ:", error?.message || error);
    }
  }

  if (isEmptyHome(homeData)) {
    return <HomeFallback />;
  }

  return (
    <HomeClient
      products={homeData.products}
      banners={homeData.banners}
      apiCategories={homeData.categories}
      apiBrands={homeData.brands}
    />
  );
}