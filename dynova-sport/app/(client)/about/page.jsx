'use client';
import React from 'react';
import { Archivo, Inter } from 'next/font/google';
import { ShieldCheck, Target, Award, ArrowRight, Zap } from 'lucide-react';

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

export default function AboutPage() {
  const coreValues = [
    { id: '01', icon: <Target size={26} />, title: 'Sứ mệnh bứt phá', desc: 'Truyền cảm hứng và cung cấp trang bị tối tân nhất để mỗi cá nhân tự tin bứt phá giới hạn bản thân trong thể thao.' },
    { id: '02', icon: <ShieldCheck size={26} />, title: 'Chất lượng tối thượng', desc: 'Mọi sản phẩm của Dynova đều trải qua các quy trình kiểm thử nghiêm ngặt về độ bền, co giãn và công nghệ thấm hút.' },
    { id: '03', icon: <Award size={26} />, title: 'Đột phá công nghệ', desc: 'Ứng dụng các công nghệ vải tiên tiến như Pro-Dry, Ultra-Light giúp tối ưu hóa hiệu suất vận động của vận động viên.' }
  ];

  const milestones = [
    { year: '2024', title: 'Khởi nguồn ý tưởng', desc: 'Họp mặt Group 4, đặt những viên gạch đầu tiên cho thương hiệu thời trang thể thao Dynova.' },
    { year: '2025', title: 'Ra mắt bộ sưu tập đầu tiên', desc: 'Tung ra thị trường dòng sản phẩm Dynova Pro-Dry chuyên dụng cho Gymer và Runner tại TP.HCM.' },
    { year: '2026', title: 'Khẳng định vị thế', desc: 'Trở thành nền tảng mua sắm trang phục thể thao cao cấp được các bạn trẻ và vận động viên bán chuyên tin dùng.' }
  ];

  const productHighlights = [
    { label: 'Trang phục tập luyện', desc: 'Áo thun thoáng khí, quần short năng động, bộ đồ tập yoga/gym co giãn 4 chiều tối ưu.' },
    { label: 'Thời trang Sportstyle', desc: 'Những thiết kế mang đậm tinh thần thể thao đường phố, vừa khỏe khoắn vừa phong cách để bạn tự tin xuống phố.' },
    { label: 'Phụ kiện thể thao', desc: 'Giày chạy bộ, bình nước, balo, găng tay… tất cả những gì bạn cần cho một buổi tập hoàn hảo.' }
  ];

  const whyChooseUs = [
    { label: 'Chất lượng vượt trội', desc: 'Toàn bộ sản phẩm đều được tuyển chọn kỹ lưỡng, sử dụng chất liệu vải cao cấp với công nghệ thấm hút mồ hôi, kháng khuẩn và co giãn tuyệt đối.' },
    { label: 'Trải nghiệm mua sắm thông minh', desc: 'Giao diện website hiện đại, dễ dàng tìm kiếm, đặt hàng nhanh chóng chỉ với vài cú click.' },
    { label: 'Dịch vụ tận tâm', desc: 'Đội ngũ hỗ trợ khách hàng luôn sẵn sàng tư vấn 24/7, chính sách đổi trả linh hoạt và giao hàng siêu tốc trên toàn quốc.' }
  ];

  const stats = [
    { value: '100%', label: 'Chính hãng' },
    { value: '10K+', label: 'Khách hàng' },
    { value: '06', label: 'Founders' },
  ];

  return (
    <div className={`${archivo.variable} ${inter.variable} min-h-screen bg-white text-[#0F0F0F] antialiased`} style={{ fontFamily: 'var(--font-inter)' }}>
<section className="relative bg-[#0F0F0F] text-white overflow-hidden">
<div
          className="absolute -right-32 -top-32 w-[60%] h-[160%] bg-[#FF5A1F]"
          style={{ transform: 'skewX(-12deg)' }}
        />
        <div
          className="absolute -right-16 -top-32 w-[8%] h-[160%] bg-[#FFB088]"
          style={{ transform: 'skewX(-12deg)' }}
        />

        <div className="relative z-10 px-6 md:px-12 pt-20 pb-24 md:pt-28 md:pb-32 max-w-5xl">
          <div className="flex items-center gap-2 mb-6">
            <Zap size={16} className="text-[#FF5A1F] fill-[#FF5A1F]" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF5A1F]">Về chúng tôi</span>
          </div>
          <h1
            className="uppercase leading-[0.88] tracking-tight"
            style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900, fontSize: 'clamp(2.75rem, 9vw, 6.5rem)' }}
          >
            Câu chuyện<br /><span className="text-[#FF5A1F]">Dynova</span> Sport
          </h1>
          <p className="mt-7 max-w-md text-sm md:text-base text-neutral-300 leading-relaxed font-medium">
            Hành trình kiến tạo một thương hiệu thời trang thể thao cao cấp, đồng hành cùng tinh thần chiến binh của người Việt.
          </p>
        </div>
      </section>
<section className="px-6 md:px-12 py-16 md:py-20 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <h2
            className="uppercase leading-tight mb-8"
            style={{ fontFamily: 'var(--font-archivo)', fontWeight: 800, fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}
          >
            Chào mừng bạn đến với Dynova <span className="text-[#FF5A1F]">— Bứt phá giới hạn, làm chủ cuộc chơi!</span>
          </h2>
          <div className="space-y-4 text-sm md:text-[15px] leading-relaxed text-neutral-600">
            <p>
              Tại Dynova, chúng tôi tin rằng thể thao không chỉ là một hoạt động rèn luyện thân thể, mà còn là một phong cách sống, là hành trình khám phá và vượt qua những giới hạn của chính bản thân mình. Chính từ nguồn cảm hứng bất tận đó, Dynova đã ra đời với sứ mệnh trở thành người bạn đồng hành tin cậy, tiếp sức cho ngọn lửa đam mê bên trong bạn.
            </p>
            <p>
              Chúng tôi tự hào là website mua sắm thời trang thể thao trực tuyến uy tín, nơi bạn có thể tìm thấy sự kết hợp hoàn hảo giữa hiệu suất vận động đỉnh cao và xu hướng thời trang thời thượng.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-neutral-50 border-l-4 border-[#FF5A1F] p-6 md:p-8 space-y-3">
            <h3 className="font-extrabold uppercase text-sm tracking-wide" style={{ fontFamily: 'var(--font-archivo)' }}>
              Câu chuyện thương hiệu
            </h3>
            <p className="text-[13px] leading-relaxed text-neutral-600">
              Cái tên Dynova được kết hợp từ <strong className="text-[#0F0F0F]">Dynamic</strong> (sự năng động) và <strong className="text-[#0F0F0F]">Innovation</strong> (sự đổi mới). Chúng tôi không ngừng sáng tạo và cập nhật những xu hướng mới nhất để mang đến cho cộng đồng yêu thể thao những trang phục chất lượng, giúp bạn luôn tự tin và tràn đầy năng lượng.
            </p>
          </div>
          <div className="bg-neutral-50 border-l-4 border-[#FF5A1F] p-6 md:p-8 space-y-3">
            <h3 className="font-extrabold uppercase text-sm tracking-wide" style={{ fontFamily: 'var(--font-archivo)' }}>
              Chúng tôi là ai?
            </h3>
            <p className="text-[13px] leading-relaxed text-neutral-600">
              Dynova Sport ra đời để định nghĩa lại khái niệm thời trang thể thao cao cấp: <strong className="text-[#0F0F0F]">đẹp trong thiết kế — bền trong chất liệu — đột phá trong công nghệ</strong>. Chúng tôi đem đến giải pháp tối ưu cho từng chuyển động, giúp bạn tập trung hoàn toàn vào việc chinh phục mục tiêu.
            </p>
          </div>
        </div>
<div className="grid grid-cols-3 mt-10 bg-[#0F0F0F] text-white rounded-sm overflow-hidden">
          {stats.map((s, i) => (
            <div key={i} className={`py-8 px-4 text-center ${i !== stats.length - 1 ? 'border-r border-neutral-800' : ''}`}>
              <p
                className="text-3xl md:text-4xl text-[#FF5A1F]"
                style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900 }}
              >
                {s.value}
              </p>
              <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-400 mt-2 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
<section className="bg-neutral-50 border-y border-neutral-100">
        <div className="grid md:grid-cols-2 max-w-6xl mx-auto divide-y md:divide-y-0 md:divide-x divide-neutral-200">
          <div className="p-6 md:p-10 lg:p-12 space-y-6">
            <h3 className="font-extrabold uppercase text-xl" style={{ fontFamily: 'var(--font-archivo)' }}>
              Danh mục <span className="text-[#FF5A1F]">sản phẩm</span>
            </h3>
            <ul className="space-y-5">
              {productHighlights.map((item, idx) => (
                <li key={idx} className="flex gap-4">
                  <span
                    className="shrink-0 w-9 h-9 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center text-xs font-extrabold"
                    style={{ fontFamily: 'var(--font-archivo)' }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-[13px] text-neutral-600 leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 md:p-10 lg:p-12 space-y-6">
            <h3 className="font-extrabold uppercase text-xl" style={{ fontFamily: 'var(--font-archivo)' }}>
              Tại sao chọn <span className="text-[#FF5A1F]">Dynova?</span>
            </h3>
            <ul className="space-y-5">
              {whyChooseUs.map((item, idx) => (
                <li key={idx} className="flex gap-4">
                  <span
                    className="shrink-0 w-9 h-9 rounded-full bg-[#0F0F0F] text-[#FF5A1F] flex items-center justify-center text-xs font-extrabold"
                    style={{ fontFamily: 'var(--font-archivo)' }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-[13px] text-neutral-600 leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-[13px] font-semibold text-[#FF5A1F] pt-3 border-t border-neutral-200">
              "Dynova không chỉ bán trang phục, chúng tôi bán sự tự tin và tinh thần chiến binh."
            </p>
          </div>
        </div>
      </section>
<section className="px-6 md:px-12 py-16 md:py-20 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <h2 className="uppercase font-extrabold text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-archivo)' }}>
            Giá trị <span className="text-[#FF5A1F]">cốt lõi</span>
          </h2>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400 hidden sm:block">Kim chỉ nam</span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {coreValues.map((value) => (
            <div
              key={value.id}
              className="relative p-7 border-2 border-[#0F0F0F] hover:bg-[#0F0F0F] hover:text-white transition-colors group"
            >
              <span
                className="absolute top-4 right-5 text-4xl text-neutral-100 group-hover:text-neutral-800 transition-colors"
                style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900 }}
              >
                {value.id}
              </span>
              <div className="text-[#FF5A1F] mb-5">{value.icon}</div>
              <h3 className="font-extrabold uppercase text-sm tracking-wide mb-3" style={{ fontFamily: 'var(--font-archivo)' }}>
                {value.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-neutral-600 group-hover:text-neutral-300 transition-colors">
                {value.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
<section className="px-6 md:px-12 py-16 md:py-20 bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="uppercase font-extrabold text-2xl md:text-3xl mb-14 text-center" style={{ fontFamily: 'var(--font-archivo)' }}>
            Hành trình <span className="text-[#FF5A1F]">phát triển</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {milestones.map((stone, idx) => (
              <div key={idx} className="relative bg-white p-7 pt-10 border border-neutral-200">
                <span
                  className="absolute -top-5 left-7 bg-[#FF5A1F] text-white text-sm font-extrabold px-4 py-1.5"
                  style={{ fontFamily: 'var(--font-archivo)' }}
                >
                  {stone.year}
                </span>
                <h3 className="font-bold text-base mb-2 mt-1">{stone.title}</h3>
                <p className="text-[13px] leading-relaxed text-neutral-600">{stone.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
<section className="relative bg-[#FF5A1F] text-white px-6 md:px-12 py-16 md:py-24 overflow-hidden">
        <div className="absolute -left-16 -bottom-24 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute right-10 top-10 w-24 h-24 rounded-full bg-[#0F0F0F]/10" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2
            className="uppercase leading-[0.95] mb-6"
            style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900, fontSize: 'clamp(1.75rem, 5vw, 3.25rem)' }}
          >
            Sẵn sàng trải nghiệm cùng Dynova?
          </h2>
          <p className="text-sm md:text-base font-medium text-white/90 max-w-md mx-auto mb-9">
            Khám phá ngay hàng trăm sản phẩm quần áo và phụ kiện thể thao thiết kế cao cấp độc quyền từ chúng tôi.
          </p>
          <a
            href="/shop"
            className="inline-flex items-center gap-2 bg-[#0F0F0F] hover:bg-black text-white text-sm font-extrabold px-9 py-4 uppercase tracking-wider transition-all group"
            style={{ fontFamily: 'var(--font-archivo)' }}
          >
            Đến cửa hàng ngay
            <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </a>
        </div>
      </section>
<footer className="px-6 md:px-12 py-6 text-center text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400">
        Dynova Sport — Năng lượng mới, bước tiến mới — 2026
      </footer>
    </div>
  );
}