'use client';
import React, { useState } from 'react';
import { Archivo, Inter } from 'next/font/google';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Zap, ArrowUpRight } from 'lucide-react';

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

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' });
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  return (
    <div className={`${archivo.variable} ${inter.variable} min-h-screen bg-white text-[#0F0F0F] antialiased pb-20`} style={{ fontFamily: 'var(--font-inter)' }}>

      {/* HERO — DIAGONAL ENERGY BLOCK */}
      <section className="relative bg-[#0F0F0F] text-white overflow-hidden">
        {/* diagonal accent confined to far corner so it never sits behind text */}
        <div
          className="hidden md:block absolute -right-24 -top-24 w-[28%] h-[160%] bg-[#FF5A1F] pointer-events-none"
          style={{ transform: 'skewX(-12deg)' }}
        />
        <div
          className="hidden md:block absolute right-[14%] -top-24 w-[5%] h-[160%] bg-[#FFB088] pointer-events-none"
          style={{ transform: 'skewX(-12deg)' }}
        />

        <div className="relative z-10 px-6 md:px-10 py-16 md:py-20 max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-5">
            <Zap size={15} className="text-[#FF5A1F] fill-[#FF5A1F]" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-white">Kết nối với chúng tôi</span>
          </div>
          <h1
            className="uppercase leading-[0.9] tracking-tight text-white"
            style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900, fontSize: 'clamp(2.5rem, 7vw, 4.5rem)' }}
          >
            Liên hệ <span className="underline decoration-[#FF5A1F] decoration-4 underline-offset-8">Dynova</span>
          </h1>
          <p className="mt-5 text-sm md:text-base text-neutral-300 max-w-md mx-auto font-medium">
            Dynova luôn sẵn sàng lắng nghe mọi ý kiến đóng góp, thắc mắc hay yêu cầu hợp tác từ phía khách hàng.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 md:px-10 mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* THÔNG TIN LIÊN HỆ & CHI NHÁNH */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <h2 className="uppercase font-extrabold text-xl tracking-tight" style={{ fontFamily: 'var(--font-archivo)' }}>
              Thông tin <span className="text-[#FF5A1F]">liên hệ</span>
            </h2>
            <div className="w-12 h-1 bg-[#FF5A1F] mt-3" />
          </div>

          {/* Danh sách thông tin nhanh */}
          <div className="border-2 border-neutral-200 divide-y divide-neutral-200">
            <div className="flex items-start gap-4 p-5">
              <div className="w-11 h-11 bg-[#FF5A1F] text-white flex items-center justify-center shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide">Hotline CSKH</h4>
                <p className="text-[#FF5A1F] font-extrabold text-lg mt-0.5" style={{ fontFamily: 'var(--font-archivo)' }}>1900 9201</p>
                <p className="text-[12px] text-neutral-500 mt-0.5">Hỗ trợ 24/7 đối với tất cả các ngày trong tuần</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5">
              <div className="w-11 h-11 bg-[#0F0F0F] text-[#FF5A1F] flex items-center justify-center shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide">Email góp ý / hợp tác</h4>
                <p className="text-neutral-700 text-sm mt-0.5 font-semibold">cskh@dynova.vn</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5">
              <div className="w-11 h-11 bg-[#0F0F0F] text-[#FF5A1F] flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide">Giờ làm việc cửa hàng</h4>
                <p className="text-neutral-700 text-sm mt-0.5 font-semibold">08:00 — 22:00</p>
                <p className="text-[12px] text-neutral-500 mt-0.5">Áp dụng cho tất cả showroom trên toàn quốc</p>
              </div>
            </div>
          </div>

          {/* Chi tiết hệ thống Showroom */}
          <div className="space-y-4">
            <h3 className="uppercase font-extrabold text-sm tracking-wide" style={{ fontFamily: 'var(--font-archivo)' }}>
              Hệ thống <span className="text-[#FF5A1F]">showroom</span>
            </h3>

            <div className="bg-neutral-50 p-5 border-l-4 border-[#FF5A1F] space-y-2">
              <h4 className="font-bold text-sm flex items-center gap-1.5">
                <MapPin size={15} className="text-[#FF5A1F]" /> Chi nhánh TP. Hồ Chí Minh
              </h4>
              <p className="text-[12px] text-neutral-600 leading-relaxed pl-[22px]">
                Số 1, Đường B, Khu ADC, Phường Trung Mỹ Tây, Quận 12, Thành phố Hồ Chí Minh.
              </p>
            </div>

            <div className="bg-neutral-50 p-5 border-l-4 border-[#FF5A1F] space-y-2">
              <h4 className="font-bold text-sm flex items-center gap-1.5">
                <MapPin size={15} className="text-[#FF5A1F]" /> Văn phòng Head Office
              </h4>
              <p className="text-[12px] text-neutral-600 leading-relaxed pl-[22px]">
                Tỉnh lộ 510, Thị trấn Bút Sơn, Huyện Hoằng Hóa, Tỉnh Thanh Hóa.
              </p>
            </div>
          </div>
        </div>

        {/* FORM GỬI TIN NHẮN GÓP Ý */}
        <div className="lg:col-span-7 border-2 border-neutral-200 p-7 md:p-9 space-y-6">
          <div>
            <h3 className="uppercase font-extrabold text-xl" style={{ fontFamily: 'var(--font-archivo)' }}>
              Gửi tin nhắn <span className="text-[#FF5A1F]">cho chúng tôi</span>
            </h3>
            <p className="text-[12px] text-neutral-500 mt-1.5">Nếu bạn cần hỗ trợ về đơn hàng hoặc có khiếu nại dịch vụ, hãy điền thông tin bên dưới.</p>
          </div>

          {isSubmitted && (
            <div className="bg-[#0F0F0F] text-white p-4 flex items-center gap-3 text-sm font-medium border-l-4 border-[#FF5A1F]">
              <CheckCircle size={18} className="text-[#FF5A1F] shrink-0" />
              <span>Cảm ơn bạn! Lời nhắn của bạn đã được gửi thành công. Đội ngũ Dynova sẽ phản hồi trong vòng 24h.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">Họ và tên *</label>
                <input
                  type="text" required name="fullName" value={formData.fullName} onChange={handleChange}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full bg-neutral-50 border-2 border-neutral-200 p-3 text-sm focus:outline-none focus:border-[#FF5A1F] focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">Địa chỉ Email *</label>
                <input
                  type="email" required name="email" value={formData.email} onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full bg-neutral-50 border-2 border-neutral-200 p-3 text-sm focus:outline-none focus:border-[#FF5A1F] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">Số điện thoại *</label>
                <input
                  type="tel" required name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="Số điện thoại cá nhân"
                  className="w-full bg-neutral-50 border-2 border-neutral-200 p-3 text-sm focus:outline-none focus:border-[#FF5A1F] focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">Chủ đề cần liên hệ</label>
                <input
                  type="text" name="subject" value={formData.subject} onChange={handleChange}
                  placeholder="Hỏi về đơn hàng, chính sách đổi trả..."
                  className="w-full bg-neutral-50 border-2 border-neutral-200 p-3 text-sm focus:outline-none focus:border-[#FF5A1F] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">Nội dung tin nhắn *</label>
              <textarea
                required rows="4" name="message" value={formData.message} onChange={handleChange}
                placeholder="Nhập nội dung tin nhắn chi tiết tại đây..."
                className="w-full bg-neutral-50 border-2 border-neutral-200 p-3 text-sm focus:outline-none focus:border-[#FF5A1F] focus:bg-white transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#FF5A1F] hover:bg-[#E54E18] text-white font-extrabold py-4 px-6 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              style={{ fontFamily: 'var(--font-archivo)' }}
            >
              Gửi lời nhắn ngay <Send size={14} />
            </button>
          </form>
        </div>

      </div>

      {/* GOOGLE MAPS EMBED */}
      <section className="max-w-6xl mx-6 xl:mx-auto mt-16 border-2 border-neutral-200 overflow-hidden h-[350px] md:h-[450px] relative">
        <span
          className="absolute top-4 left-4 z-10 bg-[#0F0F0F] text-[#FF5A1F] text-[11px] font-extrabold uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5"
          style={{ fontFamily: 'var(--font-archivo)' }}
        >
          <MapPin size={12} /> Showroom Location
        </span>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4749787803244!2d106.62340577590623!3d10.851432457805177!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752a210e57bb9b%3A0x81ffe69af45656b2!2zVHLGsOG7nW5nIENhbyDEkeG6s25nIEZQVCBQb2x5dGVjaG5pYw!5e0!3m2!1svi!2s!4v1716900000000!5m2!1svi!2s"
          className="w-full h-full border-0"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>
    </div>
  );
}