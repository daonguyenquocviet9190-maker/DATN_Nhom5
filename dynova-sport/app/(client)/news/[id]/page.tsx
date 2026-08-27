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
  '7': {
    id: 7,
    title: 'Chạy Bộ Buổi Sáng Hay Buổi Tối Tốt Hơn? Giải Đáp Từ Chuyên Gia Thể Thao',
    category: 'Kiến thức chuyên môn',
    date: '28 Tháng 5, 2026',
    author: 'Minh Trí',
    readTime: '5 phút đọc',
    img: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1000&auto=format&fit=crop&q=80',
    content:
      'Chạy buổi sáng giúp kích hoạt trao đổi chất sớm, tận dụng không khí trong lành và tạo thói quen kỷ luật cho cả ngày, nhưng cơ thể chưa "khởi động" đầy đủ nên dễ chấn thương hơn nếu bỏ qua bước làm nóng. Chạy buổi tối lại tận dụng lúc thân nhiệt và độ linh hoạt cơ khớp ở mức cao nhất trong ngày, giúp hiệu suất tốt hơn, nhưng có thể ảnh hưởng giấc ngủ nếu chạy quá sát giờ nghỉ. Lựa chọn khung giờ phù hợp phụ thuộc vào nhịp sinh học và lịch trình cá nhân của từng người, quan trọng nhất vẫn là duy trì đều đặn.',
  },
  '8': {
    id: 8,
    title: 'Hướng Dẫn Chọn Giày Tập Gym Đúng Chuẩn Cho Người Mới Tập',
    category: 'Kiến thức chuyên môn',
    date: '25 Tháng 5, 2026',
    author: 'Khánh Nam',
    readTime: '5 phút đọc',
    img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1000&auto=format&fit=crop&q=80',
    content:
      'Giày tập gym cần đế phẳng và cứng cáp để tạo điểm tựa vững chắc khi squat hoặc deadlift, khác hoàn toàn với giày chạy bộ vốn có đệm êm để giảm chấn động. Với các bài cardio hoặc HIIT, nên ưu tiên giày có độ linh hoạt cao ở mũi chân và trọng lượng nhẹ để dễ dàng đổi hướng. Người mới tập nên chọn một đôi giày đa năng (cross-training) có thể đáp ứng cả hai nhu cầu trước khi đầu tư giày chuyên biệt cho từng bộ môn.',
  },
  '9': {
    id: 9,
    title: 'Yoga Và Pilates: Nên Tập Môn Nào Để Cải Thiện Vóc Dáng Nhanh Nhất',
    category: 'Xu hướng',
    date: '22 Tháng 5, 2026',
    author: 'Thùy Linh',
    readTime: '6 phút đọc',
    img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1000&auto=format&fit=crop&q=80',
    content:
      'Yoga tập trung vào sự dẻo dai, hơi thở và cân bằng tinh thần, phù hợp với người muốn giảm căng thẳng và cải thiện linh hoạt cơ thể toàn diện. Pilates thiên về kích hoạt nhóm cơ lõi (core), giúp săn chắc vòng eo và cải thiện tư thế nhanh hơn nhờ các bài tập có kiểm soát chặt chẽ. Nếu mục tiêu là giảm stress và tăng độ mềm dẻo, yoga là lựa chọn phù hợp; nếu muốn vóc dáng săn chắc rõ rệt trong thời gian ngắn, Pilates thường cho kết quả nhanh hơn.',
  },
  '10': {
    id: 10,
    title: 'Bí Quyết Chọn Vợt Cầu Lông Phù Hợp Với Trình Độ Người Chơi',
    category: 'Kiến thức chuyên môn',
    date: '19 Tháng 5, 2026',
    author: 'Hoàng Anh',
    readTime: '5 phút đọc',
    img: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1000&auto=format&fit=crop&q=80',
    content:
      'Trọng lượng vợt (thường từ 3U đến 5U) ảnh hưởng trực tiếp đến tốc độ vung vợt và độ bền sức khi thi đấu dài hơi. Người mới nên chọn vợt nhẹ, độ cứng thấp (flexible) để dễ tạo lực và giảm áp lực lên cổ tay. Người chơi có kỹ thuật vững hơn có thể chuyển sang vợt nặng và cứng hơn (stiff) để tăng độ chính xác và lực đập cầu. Điểm cân bằng của vợt (balance point) cũng quyết định vợt thiên về tấn công hay phòng thủ.',
  },
  '11': {
    id: 11,
    title: 'Trang Phục Đạp Xe Mùa Hè: Vừa Thoáng Mát Vừa Chống Nắng Hiệu Quả',
    category: 'Mẹo thời trang',
    date: '16 Tháng 5, 2026',
    author: 'Minh Trí',
    readTime: '4 phút đọc',
    img: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1000&auto=format&fit=crop&q=80',
    content:
      'Trang phục đạp xe mùa hè cần ưu tiên vải có chỉ số chống tia UV (UPF 30+ trở lên) kết hợp khả năng thấm hút mồ hôi nhanh để tránh bí bách khi vận động ngoài trời nắng nóng. Áo tay dài mỏng nhẹ giúp bảo vệ da tốt hơn áo tay ngắn dù nghe có vẻ ngược đời, vì lớp vải tạo bóng râm trực tiếp lên da. Quần đạp xe nên có lớp đệm mút (chamois) êm ái để giảm ma sát khi ngồi yên trong thời gian dài, cùng với đó là mũ bảo hiểm thoáng khí và kính chống UV bảo vệ mắt.',
  },
  '12': {
    id: 12,
    title: 'Bơi Lội Giảm Cân Có Hiệu Quả Không? Lịch Tập Bơi Cho Người Mới',
    category: 'Xu hướng',
    date: '13 Tháng 5, 2026',
    author: 'Khánh Nam',
    readTime: '6 phút đọc',
    img: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1000&auto=format&fit=crop&q=80',
    content:
      'Bơi lội đốt calo hiệu quả tương đương chạy bộ nhưng tác động lên khớp thấp hơn nhiều nhờ lực nâng của nước, phù hợp với người có vấn đề về khớp gối hoặc thừa cân. Để giảm cân hiệu quả, nên duy trì tần suất 3-4 buổi/tuần, mỗi buổi 30-45 phút với cường độ vừa phải, kết hợp các kiểu bơi khác nhau (sải, ếch, bướm) để kích hoạt nhiều nhóm cơ. Người mới nên bắt đầu với các bài bơi ngắn xen kẽ nghỉ, sau đó tăng dần quãng đường và giảm thời gian nghỉ theo từng tuần.',
  },
  '13': {
    id: 13,
    title: 'Ưu Đãi Tháng 6: Giảm Đến 40% Toàn Bộ Trang Phục Chạy Bộ Dynova',
    category: 'Khuyến mãi',
    date: '10 Tháng 5, 2026',
    author: 'Tin Tức Dynova',
    readTime: '2 phút đọc',
    img: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=1000&auto=format&fit=crop&q=80',
    content:
      'Nhân dịp hưởng ứng mùa giải chạy bộ sôi động nhất trong năm, Dynova Sport triển khai chương trình giảm giá đến 40% cho toàn bộ dòng trang phục chạy bộ, bao gồm áo công nghệ Pro-Dry, quần short siêu nhẹ và tất chống phồng rộp. Chương trình áp dụng tại cửa hàng và trên website chính thức, số lượng có hạn theo từng size. Đây là thời điểm lý tưởng để các runner nâng cấp tủ đồ chuẩn bị cho các giải chạy cuối năm.',
  },
  '14': {
    id: 14,
    title: 'Tennis Cho Người Mới: Trang Bị Cần Thiết Và Lỗi Sai Thường Gặp',
    category: 'Kiến thức chuyên môn',
    date: '07 Tháng 5, 2026',
    author: 'Hoàng Anh',
    readTime: '5 phút đọc',
    img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1000&auto=format&fit=crop&q=80',
    content:
      'Người mới chơi tennis cần chuẩn bị vợt có độ cứng thấp để dễ kiểm soát, giày tennis chuyên dụng với đế bám sân tốt tránh trơn trượt, và trang phục co giãn thoáng khí giúp di chuyển linh hoạt trên sân. Lỗi thường gặp nhất là cầm vợt quá chặt khiến cổ tay dễ chấn thương, đứng sai tư thế chờ bóng làm giảm tốc độ phản ứng, và bỏ qua bước khởi động kỹ trước khi vào trận. Việc luyện tập đúng kỹ thuật cơ bản ngay từ đầu sẽ giúp hạn chế chấn thương và tiến bộ nhanh hơn.',
  },
  '15': {
    id: 15,
    title: 'Chạy Bộ Đường Dài: Cách Xây Dựng Lịch Tập Chuẩn Bị Cho Half Marathon',
    category: 'Xu hướng',
    date: '04 Tháng 5, 2026',
    author: 'Minh Trí',
    readTime: '7 phút đọc',
    img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1000&auto=format&fit=crop&q=80',
    content:
      'Chinh phục cự ly 21km đòi hỏi một lộ trình tập luyện khoa học kéo dài khoảng 8 tuần, kết hợp giữa các buổi chạy dài tăng dần quãng đường, buổi chạy tốc độ (tempo run) và ngày nghỉ phục hồi hợp lý. Tuần đầu tiên nên bắt đầu với quãng đường quen thuộc, sau đó tăng khoảng 10% mỗi tuần để tránh quá tải. Hai tuần cuối trước ngày thi đấu (taper) cần giảm khối lượng tập để cơ thể phục hồi hoàn toàn, đảm bảo thể lực tốt nhất khi bước vào đường đua chính thức.',
  },
  '16': {
    id: 16,
    title: 'Tất Chạy Bộ Chống Phồng Rộp: Có Thực Sự Cần Thiết Cho Runner?',
    category: 'Mẹo thời trang',
    date: '01 Tháng 5, 2026',
    author: 'Thùy Linh',
    readTime: '4 phút đọc',
    img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1000&auto=format&fit=crop&q=80',
    content:
      'Phồng rộp chân xảy ra do ma sát lặp lại giữa da và bề mặt tất hoặc giày trong suốt quá trình chạy, đặc biệt nghiêm trọng ở các cự ly dài như half hoặc full marathon. Tất chạy bộ chuyên dụng thường có thiết kế liền mạch (seamless), chất liệu thoát ẩm nhanh và lớp đệm gia cố ở gót, mũi chân giúp giảm đáng kể ma sát so với tất thông thường. Đầu tư một đôi tất chuyên dụng là khoản chi nhỏ nhưng mang lại hiệu quả bảo vệ rõ rệt, đặc biệt quan trọng với các runner tập luyện cường độ cao và thường xuyên.',
  },
};

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
<div className="relative w-full h-[38vh] sm:h-[45vh] md:h-[50vh] min-h-[280px] bg-[#0F0F0F]">
        <img
          src={article.img}
          alt={article.title}
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
<div className="absolute top-4 left-4 sm:top-6 sm:left-8 lg:left-12 z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 sm:gap-2 bg-white/10 hover:bg-[#FF5A1F] active:bg-[#FF5A1F] text-white px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-all border border-white/30 hover:border-[#FF5A1F]"
            style={{ fontFamily: 'var(--font-archivo)' }}
          >
            <ArrowLeft size={13} /> Quay lại
          </button>
        </div>
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
<div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-10">
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