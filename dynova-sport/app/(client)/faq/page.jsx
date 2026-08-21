"use client";

import { useMemo, useState } from "react";
import {
    Search,
    ChevronDown,
    RotateCcw,
    Ruler,
    ShieldCheck,
    Truck,
    MessageCircle,
} from "lucide-react";

/**
 * FAQ data — organized by category.
 * Edit copy here; no other part of the component needs to change.
 */
const CATEGORIES = [
    {
        id: "doi-tra",
        label: "Đổi trả",
        icon: RotateCcw,
        tagline: "30 ngày, không hỏi lý do",
        items: [
            {
                q: "Tôi có thể đổi trả trong bao lâu?",
                a: "Bạn có 30 ngày kể từ ngày nhận hàng để đổi hoặc trả sản phẩm — áp dụng cho giày, quần áo, phụ kiện thể thao — miễn là còn nguyên tem mác, chưa giặt, chưa qua sử dụng.",
            },
            {
                q: "Đổi trả có mất phí không?",
                a: "Đổi size hoặc đổi màu trong 30 ngày đầu hoàn toàn miễn phí vận chuyển hai chiều, áp dụng cho mọi loại sản phẩm. Nếu trả hàng để hoàn tiền, phí ship chiều gửi trả sẽ trừ vào số tiền hoàn lại, trừ khi lỗi do Dynova.",
            },
            {
                q: "Bao lâu thì tôi nhận được tiền hoàn?",
                a: "Sau khi kho nhận và kiểm tra hàng trả (thường 2–3 ngày làm việc), tiền được hoàn về đúng phương thức thanh toán ban đầu trong vòng 5–7 ngày làm việc.",
            },
            {
                q: "Sản phẩm đã mặc/mang thử có đổi trả được không?",
                a: "Quần áo và giày chỉ được chấp nhận đổi trả nếu chưa giặt, chưa có mùi, chưa dính bẩn hoặc dấu vết sử dụng ngoài trời — bạn có thể thử trong nhà, giữ nguyên tem mác đính kèm.",
            },
            {
                q: "Đồ lót, tất, bình nước có được đổi trả không?",
                a: "Vì lý do vệ sinh, các sản phẩm tiếp xúc trực tiếp với da hoặc miệng (đồ lót thể thao, tất, bình nước đã mở seal) chỉ được đổi trả khi còn nguyên bao bì gốc, chưa mở seal.",
            },
        ],
    },
    {
        id: "kich-co",
        label: "Kích cỡ",
        icon: Ruler,
        tagline: "Chọn đúng size ngay từ đầu",
        items: [
            {
                q: "Làm sao để chọn đúng size giày?",
                a: "Mỗi mẫu giày đều có bảng size riêng ở tab 'Thông số' trên trang chi tiết. Đo chiều dài bàn chân vào cuối ngày (khi chân nở nhất) và đối chiếu theo cm, không theo số size quen thuộc.",
            },
            {
                q: "Làm sao để chọn đúng size quần áo?",
                a: "Mỗi mẫu áo/quần đều có bảng số đo (vòng ngực, eo, chiều dài) riêng theo từng chất liệu và form dáng — vì áo thun co giãn và áo khoác gió sẽ ra số đo khác nhau dù cùng ghi 'size M'.",
            },
            {
                q: "Sản phẩm Dynova có ra size lớn hay nhỏ hơn bình thường không?",
                a: "Giày chạy bộ và đồ tập gym phần lớn ra size chuẩn. Riêng giày bóng rổ và áo khoác form rộng phối hợp thương hiệu quốc tế thường nhỏ hơn 0.5 size hoặc rộng hơn 1 size — luôn được ghi chú rõ trong mô tả sản phẩm.",
            },
            {
                q: "Tôi lỡ đặt sai size, phải làm sao?",
                a: "Vào mục 'Đơn hàng của tôi', chọn đơn cần đổi và gửi yêu cầu đổi size. Chúng tôi giữ hàng size mới trong 24 giờ để đảm bảo còn hàng khi bạn gửi trả sản phẩm cũ.",
            },
            {
                q: "Không có size tôi cần thì sao?",
                a: "Bấm 'Báo khi có hàng' trên trang sản phẩm để nhận email ngay khi size đó được nhập thêm — không cần theo dõi thủ công.",
            },
        ],
    },
    {
        id: "bao-hanh",
        label: "Bảo hành",
        icon: ShieldCheck,
        tagline: "Cam kết chất lượng lâu dài",
        items: [
            {
                q: "Những sản phẩm nào được bảo hành?",
                a: "Giày, quần áo thể thao và phụ kiện (balo, túi, bình nước, đồng hồ) đều được bảo hành lỗi từ nhà sản xuất. Thời gian và điều kiện bảo hành khác nhau theo từng loại sản phẩm.",
            },
            {
                q: "Giày và quần áo được bảo hành bao lâu?",
                a: "Giày: 6 tháng cho lỗi keo, đường may; đế và vải bảo hành 3 tháng. Quần áo: 3 tháng cho lỗi đường chỉ, khoá kéo, phai màu bất thường không do người dùng gây ra.",
            },
            {
                q: "Trường hợp nào không được bảo hành?",
                a: "Hao mòn tự nhiên do sử dụng lâu ngày, hư hỏng do ngâm nước, hoá chất, giặt sai hướng dẫn trên tem vải, hoặc tự ý sửa chữa sẽ không thuộc diện bảo hành.",
            },
            {
                q: "Bảo hành mất bao lâu?",
                a: "Từ 5–10 ngày làm việc kể từ khi kho kỹ thuật nhận được sản phẩm, tuỳ mức độ lỗi. Bạn sẽ nhận thông báo qua email ở từng bước xử lý.",
            },
            {
                q: "Tôi cần gì để yêu cầu bảo hành?",
                a: "Chỉ cần mã đơn hàng hoặc hoá đơn điện tử — không cần giữ hộp/bao bì gốc. Gửi yêu cầu qua mục 'Hỗ trợ' kèm ảnh chụp vị trí lỗi.",
            },
        ],
    },
    {
        id: "van-chuyen",
        label: "Vận chuyển",
        icon: Truck,
        tagline: "Giao nhanh, minh bạch",
        items: [
            {
                q: "Phí vận chuyển được tính thế nào?",
                a: "Miễn phí giao hàng cho đơn từ 500.000₫. Với đơn dưới mức này, phí ship được tính tự động theo địa chỉ nhận hàng ngay ở bước thanh toán.",
            },
            {
                q: "Thời gian giao hàng là bao lâu?",
                a: "Nội thành TP.HCM và Hà Nội: 1–2 ngày làm việc. Các tỉnh thành khác: 3–5 ngày làm việc. Thời gian có thể chậm hơn vào các đợt cao điểm sale.",
            },
            {
                q: "Tôi có thể theo dõi đơn hàng ở đâu?",
                a: "Mã vận đơn được gửi qua email và hiển thị trong mục 'Đơn hàng của tôi' ngay khi đơn được bàn giao cho đối tác vận chuyển.",
            },
            {
                q: "Dynova có giao hàng quốc tế không?",
                a: "Hiện tại chúng tôi chỉ giao hàng trong lãnh thổ Việt Nam. Đơn hàng quốc tế sẽ được cập nhật khi tính năng này ra mắt.",
            },
        ],
    },
];

function AccordionItem({ item, isOpen, onToggle }) {
    return (
        <div className="border-b border-slate-200 last:border-b-0">
            <button
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
                <span className="text-[15px] font-semibold text-slate-900 sm:text-base">
                    {item.q}
                </span>
                <ChevronDown
                    className={`h-5 w-5 shrink-0 text-orange-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>
            <div
                className={`grid overflow-hidden transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
            >
                <div className="min-h-0 overflow-hidden">
                    <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                        {item.a}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function FaqPage() {
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
    const [query, setQuery] = useState("");
    const [openKey, setOpenKey] = useState(null);

    const filteredCategories = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return CATEGORIES;

        return CATEGORIES.map((cat) => ({
            ...cat,
            items: cat.items.filter(
                (item) =>
                    item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
            ),
        })).filter((cat) => cat.items.length > 0);
    }, [query]);

    const isSearching = query.trim().length > 0;
    const visibleCategories = isSearching
        ? filteredCategories
        : CATEGORIES.filter((c) => c.id === activeCategory);

    return (
        <div className="min-h-screen bg-[#F8F7F4]">
<section className="bg-slate-950 px-6 py-16 sm:py-20">
                <div className="mx-auto max-w-3xl text-center">
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-orange-400">
                        Câu hỏi thường gặp
                    </span>
                    <h1 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                        Trước khi bạn xỏ đôi giày mới,
                        <br className="hidden sm:block" /> hỏi Dynova trước đã.
                    </h1>
                    <p className="mx-auto mt-4 max-w-lg text-sm text-slate-400 sm:text-base">
                        Mọi thứ bạn cần biết về đổi trả, chọn size, bảo hành và giao hàng
                        — gói gọn ở một chỗ.
                    </p>

                    <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tìm câu hỏi, ví dụ: đổi size…"
                            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                        />
                    </div>
                </div>
            </section>
{!isSearching && (
                <section className="mx-auto -mt-7 max-w-5xl px-6">
                    <div className="flex flex-wrap justify-center gap-3">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const active = cat.id === activeCategory;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setActiveCategory(cat.id);
                                        setOpenKey(null);
                                    }}
                                    className={`group relative flex items-center gap-2 rounded-xl py-3 pl-6 pr-5 text-sm font-semibold shadow-sm transition-all ${active
                                            ? "bg-orange-500 text-white shadow-orange-200"
                                            : "bg-white text-slate-700 hover:bg-orange-50"
                                        }`}
                                >
<span
                                        className={`absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${active ? "bg-orange-600" : "bg-[#F8F7F4]"
                                            } ring-1 ${active ? "ring-orange-300" : "ring-slate-300"}`}
                                    />
                                    <Icon
                                        className={`h-4 w-4 ${active ? "text-white" : "text-orange-500"
                                            }`}
                                    />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}
<section className="mx-auto max-w-3xl px-6 py-12">
                {visibleCategories.length === 0 && (
                    <p className="py-10 text-center text-sm text-slate-500">
                        Không tìm thấy câu hỏi phù hợp với “{query}”. Thử từ khoá khác
                        hoặc liên hệ đội ngũ hỗ trợ bên dưới.
                    </p>
                )}

                {visibleCategories.map((cat) => (
                    <div key={cat.id} className="mb-10 last:mb-0">
                        {isSearching && (
                            <div className="mb-3 flex items-center gap-2">
                                <cat.icon className="h-4 w-4 text-orange-500" />
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    {cat.label}
                                </h2>
                            </div>
                        )}
                        <div className="rounded-3xl border border-slate-200 bg-white px-6 shadow-sm sm:px-8">
                            {cat.items.map((item, i) => {
                                const key = `${cat.id}-${i}`;
                                return (
                                    <AccordionItem
                                        key={key}
                                        item={item}
                                        isOpen={openKey === key}
                                        onToggle={() => setOpenKey(openKey === key ? null : key)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </section>
<section className="border-t border-slate-200 bg-white px-6 py-14">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
                        <MessageCircle className="h-6 w-6 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                        Không tìm thấy câu trả lời bạn cần?
                    </h3>
                    <p className="max-w-sm text-sm text-slate-500">
                        Đội ngũ hỗ trợ Dynova phản hồi trong vòng 24 giờ qua chat hoặc
                        email.
                    </p>
                    <a
                        href="/contact"
                        className="mt-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Liên hệ hỗ trợ
                    </a>
                </div>
            </section>
        </div>
    );
}