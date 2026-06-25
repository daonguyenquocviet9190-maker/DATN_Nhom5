'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, Clock, Share2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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

  useEffect(() => {
    if (id) {
      setArticle(ALL_ARTICLES[id] ?? ALL_ARTICLES['1']);
    }
  }, [id]);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-bold uppercase tracking-widest text-gray-400">
        Đang tải bài viết...
      </div>
    );
  }

  const relatedArticles = RELATED_ARTICLES.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <div className="bg-white min-h-screen pb-20">

      {/* ẢNH BÌA */}
      <div className="relative w-full h-[50vh] bg-gray-900">
        <img
          src={article.img}
          alt={article.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Nút quay lại */}
        <div className="absolute top-6 left-6 md:left-12 z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-gray-900 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-all shadow-sm"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
        </div>

        {/* Tiêu đề trên ảnh */}
        <div className="absolute bottom-8 left-6 md:left-12 right-6 max-w-4xl space-y-3 text-white">
          <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm">
            {article.category}
          </span>
          <h1 className="text-xl md:text-3xl font-black uppercase tracking-wide leading-tight">
            {article.title}
          </h1>
        </div>
      </div>

      {/* NỘI DUNG */}
      <div className="max-w-3xl mx-auto px-6 pt-10 grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Metadata bên trái */}
        <div className="md:col-span-3 space-y-4 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-4 text-xs text-gray-500">
          <div className="flex items-center gap-2 font-medium">
            <Calendar size={14} className="text-orange-500" /> {article.date}
          </div>
          <div className="flex items-center gap-2 font-medium">
            <User size={14} className="text-orange-500" /> Tác giả: {article.author}
          </div>
          <div className="flex items-center gap-2 font-medium">
            <Clock size={14} className="text-orange-500" /> {article.readTime}
          </div>
          <button className="flex items-center gap-2 text-blue-950 font-bold hover:text-orange-500 transition-colors pt-2">
            <Share2 size={14} /> Chia sẻ bài viết
          </button>
        </div>

        {/* Nội dung chính */}
        <div className="md:col-span-9 space-y-6">
          <p className="text-sm text-gray-700 leading-relaxed font-normal first-letter:text-4xl first-letter:font-black first-letter:text-orange-500 first-letter:mr-2 first-letter:float-left">
            {article.content}
          </p>

          <div className="bg-gray-50 border-l-4 border-orange-500 p-4 rounded-r-xl">
            <p className="text-xs text-gray-600 italic font-medium leading-relaxed">
              "Hãy tiếp tục theo dõi chuyên mục tin tức của Dynova Sport Shop để cập nhật liên tục các xu hướng thời trang, mẹo tập luyện cùng các sự kiện ưu đãi lớn nhất trong năm!"
            </p>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed font-normal">
            Sản phẩm và trang thiết bị thể thao phục vụ bài viết hiện đang có sẵn tại toàn bộ hệ thống showroom của Dynova trên toàn quốc hoặc đặt mua trực tuyến thông qua danh mục sản phẩm chính thức của chúng tôi.
          </p>

          {/* Bài viết liên quan */}
          {relatedArticles.length > 0 && (
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-base font-black text-blue-950 uppercase tracking-wide mb-6">
                Bài viết liên quan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/news/${related.id}`}
                    className="group bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                      <img
                        src={related.img}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-orange-500 tracking-wider">
                        {related.category}
                      </span>
                      <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors">
                        {related.title}
                      </p>
                      <p className="text-[10px] text-gray-400">{related.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
            <Link
              href="/news"
              className="text-xs font-black text-orange-500 hover:underline uppercase tracking-wider flex items-center gap-1"
            >
              <ArrowLeft size={12} /> Về trang tin tức
            </Link>
            <Link
              href="/"
              className="text-xs font-black text-blue-950 hover:text-orange-500 transition-colors uppercase tracking-wider flex items-center gap-1"
            >
              Trang chủ <ArrowRight size={12} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}