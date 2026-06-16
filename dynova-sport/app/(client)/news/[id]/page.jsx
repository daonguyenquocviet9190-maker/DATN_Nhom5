'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, Clock, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params; // Lấy ID bài viết từ URL thanh địa chỉ

  const [article, setArticle] = useState(null);

  // Kho dữ liệu tổng hợp thông tin chi tiết của tất cả các bài viết
  const allArticles = {
    '1': {
      title: 'HYROX Là Gì? Hướng Dẫn Trang Bị Tập HYROX Cho Người Mới',
      category: 'Tin Khuyến mãi',
      date: '15 Tháng 6, 2026',
      author: 'Dynova Team',
      img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80',
      content: 'HYROX là cuộc đua thể lực kết hợp toàn cầu đang bùng nổ mạnh mẽ, bao gồm 1km chạy xen kẽ với 1 bài tập chức năng cố định lặp lại 8 lần. Đối với người mới bắt đầu, việc chuẩn bị trang phục thấm hút mồ hôi tốt, giày tập có độ bám cao và bổ sung điện giải là yếu tố cốt lõi để chinh phục đường đua khốc liệt này...'
    },
    '2': {
      title: 'Giày Chạy Đua UA Velociti Elite: Bí Quyết Chinh Phục Kỷ Lục Marathon',
      category: 'Tin Khuyến mãi',
      date: '14 Tháng 6, 2026',
      author: 'Đức Anh',
      img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1000&auto=format&fit=crop&q=80',
      content: 'Dòng giày UA Velociti Elite sở hữu tấm đệm carbon siêu nhẹ kết hợp bọt cao cấp giúp phản hồi lực cực tốt trên mỗi bước chạy. Đây là vũ khí tối thượng được các runner điền kinh lựa chọn để phá vỡ các giới hạn thời gian (PR) trên đường chạy full marathon 42.195km.'
    },
    '3': {
      title: 'Quần Bó Cơ Là Gì? 5 Lợi Ích Không Thể Bỏ Qua Của Quần Bó Cơ',
      category: 'Mẹo thời trang',
      date: '12 Tháng 6, 2026',
      author: 'Dynova Blog',
      img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000&auto=format&fit=crop&q=80',
      content: 'Quần bó cơ (Compression) tạo áp lực nhẹ lên cơ bắp giúp tăng tuần hoàn máu, giảm rung cơ trong khi vận động mạnh và rút ngắn thời gian phục hồi cơ bắp sau khi tập luyện. Ngoài ra, nó còn bảo vệ bạn tối đa khỏi các tổn thương xây xước da chấn thương.'
    },
    '4': {
      title: 'TOP 5 Giày Đá Bóng Adidas Dành Cho Sân Cỏ Nhân Tạo - Chính Hãng - Giá Tốt',
      category: 'Tin nổi bật',
      date: '10 Tháng 6, 2026',
      author: 'Văn Nam',
      img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=1000&auto=format&fit=crop&q=80',
      content: 'Sân cỏ nhân tạo tại Việt Nam có đặc thù nền đất cứng. Top 5 mẫu giày đinh TF đến từ nhà Adidas dưới đây (như Predator, X Crazyfast...) sở hữu bộ đệm êm ái, bám sân vượt trội sẽ giúp bạn tự tin làm chủ mọi trận đấu phủi kịch tính.'
    },
    '5': {
      title: 'Dịch Vụ In Áo Bóng Đá Chính Hãng Theo Yêu Cầu Tại Dynova Chuẩn Fan',
      category: 'Dịch vụ',
      date: '08 Tháng 6, 2026',
      author: 'Dynova Admin',
      img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000&auto=format&fit=crop&q=80',
      content: 'Dynova cung cấp công nghệ in decal chuyển nhiệt phản quang, in số và font chữ chuẩn thi đấu quốc tế cho các fan hâm mộ. Đảm bảo độ bền màu tuyệt đối, không bong tróc kể cả khi giặt máy nhiều lần.'
    },
    '6': {
      title: 'Mới Chơi Pickleball Nên Bắt Đầu Từ Đâu? Cách Chọn Vợt, Giày Và Gear Phù Hợp',
      category: 'Mẹo thể thao',
      date: '05 Tháng 6, 2026',
      author: 'HLV Minh Trí',
      img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1000&auto=format&fit=crop&q=80',
      content: 'Môn thể thao xu hướng Pickleball đòi hỏi cây vợt có trọng lượng vừa phải và bề mặt carbon phân bổ lực đều. Hãy bắt đầu bằng các bài tập tâng bóng cơ bản trước khi ra sân đấu chính thức.'
    },
    '7': {
      title: 'Nike Air Max Day 2026 Tại Supersports Crescent Mall – Sự Kiện Toàn Cầu Không Thể Bỏ Lỡ!',
      category: 'Sự kiện',
      date: '01 Tháng 6, 2026',
      author: 'Sự Kiện News',
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=80',
      content: 'Sự kiện bùng nổ kỷ niệm dòng giày huyền thoại Nike Air Max với hàng trăm phần quà giới hạn và không gian trải nghiệm công nghệ túi khí đỉnh cao của nhà Nike tại TTTM Crescent Mall.'
    }
  };

  // Khớp ID để lấy bài viết
  useEffect(() => {
    if (id && allArticles[id]) {
      setArticle(allArticles[id]);
    } else if (id) {
      // Nếu không tìm thấy ID khớp, lấy tạm bài số 1 làm dự phòng mẫu công khai
      setArticle(allArticles['1']);
    }
  }, [id]);

  if (!article) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-bold uppercase tracking-widest text-gray-400">Đang tải bài viết...</div>;
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      
      {/* Ảnh bìa bài viết lớn tràn viền */}
      <div className="relative w-full h-[50vh] bg-gray-900">
        <img src={article.img} alt={article.title} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Nút Quay Lại trang chủ */}
        <div className="absolute top-6 left-6 md:left-12 z-10">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-gray-900 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-all shadow-sm"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
        </div>

        {/* Tiêu đề tóm tắt trên ảnh nền */}
        <div className="absolute bottom-8 left-6 md:left-12 right-6 max-w-4xl space-y-3 text-white">
          <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm">
            {article.category}
          </span>
          <h1 className="text-xl md:text-3xl font-black uppercase tracking-wide leading-tight">
            {article.title}
          </h1>
        </div>
      </div>

      {/* Nội dung chi tiết của bài viết */}
      <div className="max-w-3xl mx-auto px-6 pt-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Thanh metadata bên trái */}
        <div className="md:col-span-3 space-y-4 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-4 text-xs text-gray-500">
          <div className="flex items-center gap-2 font-medium">
            <Calendar size={14} className="text-orange-500" /> {article.date}
          </div>
          <div className="flex items-center gap-2 font-medium">
            <User size={14} className="text-orange-500" /> Tác giả: {article.author}
          </div>
          <div className="flex items-center gap-2 font-medium">
            <Clock size={14} className="text-orange-500" /> 3 phút đọc
          </div>
          <button className="flex items-center gap-2 text-blue-950 font-bold hover:text-orange-500 transition-colors pt-2">
            <Share2 size={14} /> Chia sẻ bài viết
          </button>
        </div>

        {/* Khối văn bản nội dung chính bài viết */}
        <div className="md:col-span-9 space-y-6">
          <p className="text-sm text-gray-700 leading-relaxed font-normal first-letter:text-4xl first-letter:font-black first-letter:text-orange-500 first-letter:mr-2 first-letter:float-left">
            {article.content}
          </p>
          
          <div className="bg-gray-50 border-l-4 border-orange-500 p-4 rounded-r-xl">
            <p className="text-xs text-gray-600 italic font-medium leading-relaxed">
              "Hãy tiếp tục theo dõi chuyên mục tin tức của Dynova Sport Shop để cập nhật liên tục các xu hướng thời trang, mẹo tập luyện thể hình cùng các sự kiện ưu đãi giảm giá thẻ thành viên lớn nhất trong năm!"
            </p>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed font-normal">
            Sản phẩm và trang thiết bị thể thao phục vụ bài viết hiện đang có sẵn tại toàn bộ hệ thống showroom của Dynova trên toàn quốc hoặc đặt mua trực tuyến thông qua danh mục sản phẩm chính thức của chúng tôi.
          </p>

          <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
            <Link href="/" className="text-xs font-black text-orange-500 hover:underline uppercase tracking-wider">
              ← Về trang chủ mua sắm
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}