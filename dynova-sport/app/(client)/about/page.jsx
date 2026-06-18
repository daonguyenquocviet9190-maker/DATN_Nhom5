'use client';
import React from 'react';
import { ShieldCheck, Target, Award, Users, ArrowRight, Zap, RefreshCw } from 'lucide-react';

export default function AboutPage() {
  // Dữ liệu các giá trị cốt lõi
  const coreValues = [
    {
      icon: <Target className="w-8 h-8 text-orange-500" />,
      title: "Sứ mệnh bứt phá",
      desc: "Truyền cảm hứng và cung cấp trang bị tối tân nhất để mỗi cá nhân tự tin bứt phá giới hạn bản thân trong thể thao."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-orange-500" />,
      title: "Chất lượng tối thượng",
      desc: "Mọi sản phẩm của Dynova đều trải qua các quy trình kiểm thử nghiêm ngặt về độ bền, co giãn và công nghệ thấm hút."
    },
    {
      icon: <Award className="w-8 h-8 text-orange-500" />,
      title: "Đột phá công nghệ",
      desc: "Ứng dụng các công nghệ vải tiên tiến như Pro-Dry, Ultra-Light giúp tối ưu hóa hiệu suất vận động của vận động viên."
    }
  ];

  // Dữ liệu các cột mốc lịch sử phát triển
  const milestones = [
    { year: "2024", title: "Khởi nguồn ý tưởng", desc: "Họp mặt Group 4, đặt những viên gạch đầu tiên cho thương hiệu thời trang thể thao Dynova." },
    { year: "2025", title: "Ra mắt bộ sưu tập đầu tiên", desc: "Tung ra thị trường dòng sản phẩm Dynova Pro-Dry chuyên dụng cho Gymer và Runner tại TP.HCM." },
    { year: "2026", title: "Khẳng định vị thế", desc: "Trở thành nền tảng mua sắm trang phục thể thao cao cấp được các bạn trẻ và vận động viên bán chuyên tin dùng." }
  ];

  // Danh mục sản phẩm nổi bật tại Dynova
  const productHighlights = [
    {
      label: "Trang phục tập luyện",
      desc: "Áo thun thoáng khí, quần short năng động, bộ đồ tập yoga/gym co giãn 4 chiều tối ưu."
    },
    {
      label: "Thời trang Sportstyle",
      desc: "Những thiết kế mang đậm tinh thần thể thao đường phố, vừa khỏe khoắn vừa phong cách để bạn tự tin xuống phố."
    },
    {
      label: "Phụ kiện thể thao",
      desc: "Giày chạy bộ, bình nước, balo, găng tay… tất cả những gì bạn cần cho một buổi tập hoàn hảo."
    }
  ];

  // Lý do nên chọn Dynova
  const whyChooseUs = [
    {
      label: "Chất lượng vượt trội",
      desc: "Toàn bộ sản phẩm đều được tuyển chọn kỹ lưỡng, sử dụng chất liệu vải cao cấp với công nghệ thấm hút mồ hôi, kháng khuẩn và co giãn tuyệt đối."
    },
    {
      label: "Trải nghiệm mua sắm thông minh",
      desc: "Giao diện website hiện đại, dễ dàng tìm kiếm, đặt hàng nhanh chóng chỉ với vài cú click."
    },
    {
      label: "Dịch vụ tận tâm",
      desc: "Đội ngũ hỗ trợ khách hàng luôn sẵn sàng tư vấn 24/7, chính sách đổi trả linh hoạt và giao hàng siêu tốc trên toàn quốc."
    }
  ];

  return (
    <div className="bg-white min-h-screen">

      {/* 1. HERO BANNER CỦA TRANG GIỚI THIỆU */}
      <section className="relative h-[40vh] md:h-[50vh] bg-blue-950 flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/50 to-blue-950 z-10" />

        <div className="relative z-20 text-center text-white space-y-4 px-4">
          <p className="text-orange-500 font-extrabold text-xs uppercase tracking-widest">Về chúng tôi</p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Câu chuyện <span className="text-orange-500">Dynova Sport</span></h1>
          <p className="text-sm text-gray-300 max-w-lg mx-auto font-light leading-relaxed">
            Hành trình kiến tạo một thương hiệu thời trang thể thao cao cấp, đồng hành cùng tinh thần chiến binh của người Việt.
          </p>
        </div>
      </section>

      {/* 1.5 LỜI CHÀO & CÂU CHUYỆN THƯƠNG HIỆU */}
      <section className="py-16 md:py-20 container mx-auto px-6 max-w-4xl space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-black text-blue-950 uppercase leading-tight">
            Chào mừng bạn đến với Dynova <span className="text-orange-500">– Bứt phá giới hạn, làm chủ cuộc chơi!</span>
          </h2>
        </div>

        <div className="space-y-4 text-gray-700 text-sm md:text-base leading-relaxed font-light">
          <p>
            Tại Dynova, chúng tôi tin rằng thể thao không chỉ là một hoạt động rèn luyện thân thể, mà còn là một phong cách sống, là hành trình khám phá và vượt qua những giới hạn của chính bản thân mình. Chính từ nguồn cảm hứng bất tận đó, Dynova đã ra đời với sứ mệnh trở thành người bạn đồng hành tin cậy, tiếp sức cho ngọn lửa đam mê bên trong bạn.
          </p>
          <p>
            Chúng tôi tự hào là website mua sắm thời trang thể thao trực tuyến uy tín, nơi bạn có thể tìm thấy sự kết hợp hoàn hảo giữa hiệu suất vận động đỉnh cao và xu hướng thời trang thời thượng.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg md:text-xl font-bold text-blue-950 uppercase">Câu chuyện thương hiệu</h3>
          <p className="text-gray-600 text-sm leading-relaxed font-light">
            Cái tên Dynova được kết hợp từ Dynamic (Sự năng động) và Innovation (Sự đổi mới). Chúng tôi không ngừng sáng tạo và cập nhật những xu hướng mới nhất để mang đến cho cộng đồng yêu thể thao những trang phục chất lượng, giúp bạn luôn cảm thấy tự tin, thoải mái và tràn đầy năng lượng – dù là trên sàn tập, đường đua hay trong cuộc sống hàng ngày.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg md:text-xl font-bold text-blue-950 uppercase">Danh mục sản phẩm tại Dynova</h3>
          <p className="text-gray-600 text-sm leading-relaxed font-light">
            Đến với Dynova, bạn sẽ được trải nghiệm không gian mua sắm đa dạng với hàng ngàn sản phẩm cao cấp dành cho cả nam và nữ:
          </p>
          <ul className="space-y-2">
            {productHighlights.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-gray-600 font-light leading-relaxed">
                <span className="text-orange-500 font-bold mt-0.5">•</span>
                <span><span className="font-bold text-gray-900">{item.label}:</span> {item.desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg md:text-xl font-bold text-blue-950 uppercase">Tại sao chọn Dynova?</h3>
          <ul className="space-y-2">
            {whyChooseUs.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-gray-600 font-light leading-relaxed">
                <span className="text-orange-500 font-bold mt-0.5">•</span>
                <span><span className="font-bold text-gray-900">{item.label}:</span> {item.desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-600 text-sm leading-relaxed font-light pt-2">
            Dynova không chỉ bán trang phục, chúng tôi bán sự tự tin và tinh thần chiến binh. Hãy để chúng tôi cùng bạn viết tiếp hành trình chinh phục những đỉnh cao mới!
          </p>
          <p className="text-orange-500 font-bold text-sm pt-1">
            Dynova – Năng lượng mới, bước tiến mới. Khám phá bộ sưu tập mới nhất của chúng tôi ngay hôm nay!
          </p>
        </div>
      </section>

      {/* 2. NỘI DUNG CHÍNH & TẦM NHÌN */}
      <section className="py-20 container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="w-12 h-1 bg-orange-500" />
            <h2 className="text-2xl md:text-3xl font-black text-blue-950 uppercase">Chúng tôi là ai?</h2>
            <p className="text-gray-700 text-sm md:text-base leading-relaxed font-light">
              Xuất phát từ niềm đam mê cháy bỏng với thể thao và mong muốn mang lại những trang phục chất lượng nhất, **Dynova Sport** ra đời để định nghĩa lại khái niệm thời trang thể thao cao cấp: **Đẹp trong thiết kế - Bền trong chất liệu - Đột phá trong công nghệ**.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed font-light">
              Chúng tôi không chỉ bán quần áo, giày dép tập luyện. Dynova đem đến giải pháp tối ưu cho từng chuyển động của bạn, giúp bạn luôn thoải mái, tự tin để tập trung hoàn toàn vào việc chinh phục mục tiêu của mình.
            </p>

            {/* Các thông số ấn tượng mini */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-2xl md:text-3xl font-black text-orange-500">100%</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Chính hãng</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-blue-950">10k+</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Khách hàng</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-blue-950">06</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Thành viên sáng lập</p>
              </div>
            </div>
          </div>

          {/* Khối hình ảnh thiết kế ấn tượng bên phải */}
          <div className="relative h-[350px] md:h-[450px] rounded-2xl overflow-hidden shadow-2xl group">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* 3. GIÁ TRỊ CỐT LÕI (CORE VALUES) */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-6 max-w-7xl text-center space-y-12">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-blue-950 uppercase">Giá trị cốt lõi</h2>
            <p className="text-xs text-gray-500 tracking-wider uppercase font-bold">Kim chỉ nam cho mọi hoạt động của Dynova</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreValues.map((value, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-left space-y-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-orange-50 rounded-xl w-fit">
                  {value.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{value.title}</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LỊCH SỬ PHÁT TRIỂN (TIMELINE) */}
      <section className="py-20 container mx-auto px-6 max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-black text-blue-950 text-center uppercase mb-16">Hành trình phát triển</h2>

        <div className="relative border-l-2 border-gray-200 ml-4 md:ml-32 space-y-12">
          {milestones.map((stone, idx) => (
            <div key={idx} className="relative pl-8 md:pl-12 group">
              {/* Nút mốc thời gian */}
              <div className="absolute -left-[9px] top-1 w-4 h-4 bg-white border-4 border-orange-500 rounded-full group-hover:bg-orange-500 transition-colors" />

              {/* Năm hiển thị bên trái trên màn hình lớn */}
              <div className="hidden md:block absolute -left-32 top-0 w-24 text-right font-black text-2xl text-blue-950 group-hover:text-orange-500 transition-colors">
                {stone.year}
              </div>

              {/* Nội dung cột mốc */}
              <div className="space-y-1">
                <span className="inline-block md:hidden font-black text-orange-500 text-lg mb-1">{stone.year}</span>
                <h3 className="font-bold text-gray-900 text-base md:text-lg">{stone.title}</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed">{stone.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CALL TO ACTION (CTA) */}
      <section className="py-16 bg-blue-950 text-white text-center rounded-3xl max-w-7xl mx-6 xl:mx-auto mb-20 p-8 md:p-12 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">Sẵn sàng trải nghiệm cùng Dynova?</h2>
          <p className="text-sm text-gray-300 font-light">
            Khám phá ngay hàng trăm sản phẩm quần áo và phụ kiện thể thao thiết kế cao cấp độc quyền từ chúng tôi.
          </p>
          <a
            href="/shop"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-8 py-3.5 rounded-sm uppercase tracking-wider transition-all group mx-auto"
          >
            Đến cửa hàng ngay <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

    </div>
  );
}