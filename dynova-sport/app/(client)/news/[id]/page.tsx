'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Archivo, Inter } from 'next/font/google';
import { ArrowLeft, Calendar, User, Clock, Share2, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-archivo',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
});

// ---- Kiểu dữ liệu bài viết ----
type Article = {
  id: number;
  title: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  img: string;
  content: string;
};

// ---- Kho dữ liệu tất cả bài viết ----
const ALL_ARTICLES: Record<string, Article> = {
  '1': {
    id: 1,
    title: 'HYROX Là Gì? Hướng Dẫn Trang Bị Tập HYROX Cho Người Mới Bắt Đầu',
    category: 'Xu hướng',
    date: '15 Tháng 6, 2026',
    author: 'Admin Dynova',
    readTime: '5 phút đọc',
    img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80',
    content:
      'HYROX là cuộc đua thể lực kết hợp toàn cầu đang bùng nổ mạnh mẽ, bao gồm 1km chạy xen kẽ với 1 bài tập chức năng cố định lặp lại 8 lần. Đối với người mới bắt đầu, việc chuẩn bị trang phục thấm hút mồ hôi tốt, giày tập có độ bám cao và bổ sung điện giải là yếu tố cốt lõi để chinh phục đường đua khốc liệt này. Dynova Sport cung cấp đầy đủ các trang bị cần thiết từ áo co giãn 4 chiều, quần bó cơ compression đến giày đa năng phù hợp cho HYROX.',
  },
  '2': {
    id: 2,
    title: 'Giày Chạy Đua UA Velociti Elite: Bí Quyết Chinh Phục Kỷ Lục Marathon',
    category: 'Kiến thức chuyên môn',
    date: '12 Tháng 6, 2026',
    author: 'Minh Trí',
    readTime: '4 phút đọc',
    img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1000&auto=format&fit=crop&q=80',
    content:
      'Dòng giày UA Velociti Elite sở hữu tấm đệm carbon siêu nhẹ kết hợp bọt cao cấp giúp phản hồi lực cực tốt trên mỗi bước chạy. Đây là vũ khí tối thượng được các runner điền kinh lựa chọn để phá vỡ các giới hạn thời gian (PR) trên đường chạy full marathon 42.195km. Công nghệ Flow đế ngoài tạo độ bám linh hoạt, trong khi lớp upper dệt Warp 3D ôm sát chân mà không gây áp lực.',
  },
  '3': {
    id: 3,
    title: 'Quần Bó Cơ Là Gì? 5 Lợi Ích Không Thể Bỏ Qua Của Quần Bó Cơ Trong Tập Luyện',
    category: 'Mẹo thời trang',
    date: '10 Tháng 6, 2026',
    author: 'Hoàng Anh',
    readTime: '6 phút đọc',
    img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000&auto=format&fit=crop&q=80',
    content:
      'Quần bó cơ (Compression) tạo áp lực nhẹ lên cơ bắp giúp tăng tuần hoàn máu, giảm rung cơ trong khi vận động mạnh và rút ngắn thời gian phục hồi cơ bắp sau khi tập luyện. 5 lợi ích chính: (1) Tăng lưu thông máu đến cơ bắp, (2) Giảm rung lắc cơ khi chạy, (3) Hỗ trợ khớp gối và hông, (4) Rút ngắn thời gian hồi phục, (5) Bảo vệ da khỏi xây xước.',
  },
  '4': {
    id: 4,
    title: 'TOP 5 Giày Đá Bóng Đáng Mua Nhất Dành Cho Sân Cỏ Nhân Tạo',
    category: 'Xu hướng',
    date: '08 Tháng 6, 2026',
    author: 'Khánh Nam',
    readTime: '4 phút đọc',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000&auto=format&fit=crop&q=80',
    content:
      'Sân cỏ nhân tạo tại Việt Nam có đặc thù nền đất cứng, đòi hỏi giày có hệ thống đinh TF (Turf) phân bổ đều và đế ngoài linh hoạt. Top 5 mẫu đang được yêu thích: Adidas Predator TF, Nike Mercurial Vapor TF, Mizuno Morelia Neo TF, Puma Future TF, và New Balance Furon TF.',
  },
  '5': {
    id: 5,
    title: 'Dynova Đồng Hành Cùng Giải Chạy Marathon Quốc Tế TP.HCM 2026',
    category: 'Khuyến mãi',
    date: '05 Tháng 6, 2026',
    author: 'Tin Tức Dynova',
    readTime: '3 phút đọc',
    img: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1000&auto=format&fit=crop&q=80',
    content:
      'Dynova Sport tự hào là nhà tài trợ trang phục độc quyền cho Giải Marathon Quốc Tế TP.HCM 2026 với hơn 10.000 vận động viên tham dự. Công nghệ Pro-Dry thế hệ mới thoát ẩm nhanh hơn 40%, giữ mát cơ thể suốt chặng đường dài. Các runner đăng ký sớm nhận áo chạy Dynova giới hạn kèm ưu đãi 20% toàn bộ sản phẩm.',
  },
  '6': {
    id: 6,
    title: 'Bí Quyết Phối Đồ Tập Gym Vừa Đẹp Vừa Khỏe Khoắn Cho Cả Nam Và Nữ',
    category: 'Mẹo thời trang',
    date: '01 Tháng 6, 2026',
    author: 'Thùy Linh',
    readTime: '4 phút đọc',
    img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1000&auto=format&fit=crop&q=80',
    content:
      'Phối đồ tập gym không chỉ về thẩm mỹ mà còn ảnh hưởng đến hiệu suất tập luyện. Nguyên tắc cơ bản: chọn một màu chủ đạo (neutral: đen, xám, navy) và một màu nhấn (cam, đỏ, xanh lá). Chất liệu ưu tiên: polyester/spandex blend thoáng khí. Nam giới: áo tank top + quần short + giày cross-training. Nữ giới: áo sports bra + legging compression + giày có arch support tốt.',
  },
};

// Danh sách bài viết tóm tắt dùng cho phần "Bài viết liên quan"
const RELATED_ARTICLES = Object.values(ALL_ARTICLES).map(({ id, title, date, img, category }) => ({
  id, title, date, img, category,
}));

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [article, setArticle] = useState<Article | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      setArticle(ALL_ARTICLES[id] ?? ALL_ARTICLES['1']);
    }
  }, [id]);

  const handleShare = async () => {
    const shareData = {
      title: article?.title,
      text: article?.title,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // người dùng huỷ chia sẻ, không cần xử lý gì thêm
    }
  };

  if (!article) {
    return (
      <div
        className={`${archivo.variable} ${inter.variable} min-h-screen flex items-center justify-center text-xs font-bold uppercase tracking-widest text-neutral-400 px-6 text-center`}
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        Đang tải bài viết...
      </div>
    );
  }

  const relatedArticles = RELATED_ARTICLES.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <div className={`${archivo.variable} ${inter.variable} bg-white min-h-screen pb-16 sm:pb-20 text-[#0F0F0F]`} style={{ fontFamily: 'var(--font-inter)' }}>

      {/* ẢNH BÌA */}
      <div className="relative w-full h-[38vh] sm:h-[45vh] md:h-[50vh] min-h-[280px] bg-[#0F0F0F]">
        <img
          src={article.img}
          alt={article.title}
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Nút quay lại */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-8 lg:left-12 z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 sm:gap-2 bg-white/10 hover:bg-[#FF5A1F] active:bg-[#FF5A1F] text-white px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-all border border-white/30 hover:border-[#FF5A1F]"
            style={{ fontFamily: 'var(--font-archivo)' }}
          >
            <ArrowLeft size={13} /> Quay lại
          </button>
        </div>

        {/* Tiêu đề trên ảnh */}
        <div className="absolute bottom-5 left-4 right-4 sm:bottom-8 sm:left-8 lg:left-12 sm:right-8 max-w-5xl space-y-3 sm:space-y-4 text-white">
          <span
            className="inline-flex items-center gap-1.5 bg-[#FF5A1F] text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5"
            style={{ fontFamily: 'var(--font-archivo)' }}
          >
            <Zap size={10} className="fill-white" /> {article.category}
          </span>
          <h1
            className="uppercase tracking-tight leading-[1.1] sm:leading-[1.05] text-xl sm:text-2xl md:text-4xl"
            style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900 }}
          >
            {article.title}
          </h1>
        </div>
      </div>

      {/* NỘI DUNG */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-10">

        {/* Metadata: hàng ngang trên mobile, cột dọc từ md trở lên */}
        <div className="md:col-span-3 flex flex-wrap items-center gap-x-5 gap-y-3 md:flex-col md:items-start md:gap-4 border-b md:border-b-0 md:border-r-2 border-neutral-200 pb-5 md:pb-0 md:pr-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2 font-semibold whitespace-nowrap">
            <Calendar size={14} className="text-[#FF5A1F] shrink-0" /> {article.date}
          </div>
          <div className="flex items-center gap-2 font-semibold whitespace-nowrap">
            <User size={14} className="text-[#FF5A1F] shrink-0" /> {article.author}
          </div>
          <div className="flex items-center gap-2 font-semibold whitespace-nowrap">
            <Clock size={14} className="text-[#FF5A1F] shrink-0" /> {article.readTime}
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-[#0F0F0F] font-extrabold hover:text-[#FF5A1F] active:text-[#FF5A1F] transition-colors md:pt-2 uppercase tracking-wide text-[11px] whitespace-nowrap"
            style={{ fontFamily: 'var(--font-archivo)' }}
          >
            <Share2 size={14} className="shrink-0" /> {copied ? 'Đã sao chép!' : 'Chia sẻ bài viết'}
          </button>
        </div>

        {/* Nội dung chính */}
        <div className="md:col-span-9 space-y-5 sm:space-y-6">
          <p
            className="text-base sm:text-lg text-neutral-700 leading-relaxed sm:leading-loose font-normal first-letter:text-4xl sm:first-letter:text-5xl first-letter:font-black first-letter:text-[#FF5A1F] first-letter:mr-2 first-letter:float-left"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {article.content}
          </p>

          <div className="bg-neutral-50 border-l-4 border-[#FF5A1F] p-4 sm:p-5">
            <p className="text-sm text-neutral-600 italic font-medium leading-relaxed">
              "Hãy tiếp tục theo dõi chuyên mục tin tức của Dynova Sport Shop để cập nhật liên tục các xu hướng thời trang, mẹo tập luyện cùng các sự kiện ưu đãi lớn nhất trong năm!"
            </p>
          </div>

          <p className="text-base sm:text-lg text-neutral-700 leading-relaxed sm:leading-loose font-normal">
            Sản phẩm và trang thiết bị thể thao phục vụ bài viết hiện đang có sẵn tại toàn bộ hệ thống showroom của Dynova trên toàn quốc hoặc đặt mua trực tuyến thông qua danh mục sản phẩm chính thức của chúng tôi.
          </p>

          {/* Bài viết liên quan */}
          {relatedArticles.length > 0 && (
            <div className="pt-6 sm:pt-8 border-t-2 border-neutral-200">
              <h3
                className="uppercase tracking-wide mb-5 sm:mb-6 font-extrabold text-sm sm:text-base"
                style={{ fontFamily: 'var(--font-archivo)' }}
              >
                Bài viết <span className="text-[#FF5A1F]">liên quan</span>
              </h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/news/${related.id}`}
                    className="group bg-white border-2 border-neutral-200 hover:border-[#0F0F0F] overflow-hidden transition-all"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-neutral-100 relative">
                      <img
                        src={related.img}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span
                        className="absolute top-2 left-2 bg-[#FF5A1F] text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-1"
                        style={{ fontFamily: 'var(--font-archivo)' }}
                      >
                        {related.category}
                      </span>
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-xs font-bold text-neutral-800 leading-snug line-clamp-2 group-hover:text-[#FF5A1F] transition-colors">
                        {related.title}
                      </p>
                      <p className="text-[10px] text-neutral-400">{related.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="pt-5 sm:pt-6 border-t-2 border-neutral-200 flex flex-col xs:flex-row gap-3 xs:gap-0 justify-between xs:items-center">
            <Link
              href="/news"
              className="text-xs font-extrabold text-[#FF5A1F] hover:underline uppercase tracking-wider flex items-center gap-1"
              style={{ fontFamily: 'var(--font-archivo)' }}
            >
              <ArrowLeft size={12} /> Về trang tin tức
            </Link>
            <Link
              href="/"
              className="text-xs font-extrabold text-[#0F0F0F] hover:text-[#FF5A1F] transition-colors uppercase tracking-wider flex items-center gap-1"
              style={{ fontFamily: 'var(--font-archivo)' }}
            >
              Trang chủ <ArrowRight size={12} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}