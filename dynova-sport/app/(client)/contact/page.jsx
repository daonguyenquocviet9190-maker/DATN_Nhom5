'use client';
import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  // Trạng thái lưu trữ dữ liệu Form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Xử lý khi người dùng nhập dữ liệu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Xử lý khi nhấn nút gửi tin nhắn
  const handleSubmit = (e) => {
    e.preventDefault();
    // Giả lập gửi API thành công
    setIsSubmitted(true);
    // Xóa trắng form sau khi gửi thành công
    setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' });
    // Tự động tắt thông báo sau 4 giây
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      
      {/* 1. HERO BANNER HEADER TRANG LIÊN HỆ */}
      <section className="bg-gradient-to-r from-blue-950 to-blue-900 py-16 text-center text-white px-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <p className="text-xs text-orange-500 font-black uppercase tracking-widest">Kết nối với chúng tôi</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">LIÊN HỆ <span className="text-orange-500">DYNOVA</span></h1>
          <p className="text-sm text-gray-400 max-w-md mx-auto font-light">
            Dynova luôn sẵn sàng lắng nghe mọi ý kiến đóng góp, thắc mắc hay yêu cầu hợp tác từ phía khách hàng.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* 2. THÔNG TIN LIÊN HỆ & CHI NHÁNH (Lg: 5 columns) */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-blue-950 uppercase tracking-wide">Thông tin liên hệ chính thức</h2>
            <div className="w-12 h-1 bg-orange-500" />
          </div>

          {/* Danh sách thông tin nhanh */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-50 text-orange-500 rounded-xl shrink-0"><Phone className="w-5 h-5" /></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Hotline CSKH</h4>
                <p className="text-orange-500 font-extrabold text-base mt-0.5">1900 9201</p>
                <p className="text-xs text-gray-400 font-light mt-0.5">Hỗ trợ 24/7 đối với tất cả các ngày trong tuần</p>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-gray-50 pt-6">
              <div className="p-3 bg-orange-50 text-orange-500 rounded-xl shrink-0"><Mail className="w-5 h-5" /></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Email Góp Ý / Hợp Tác</h4>
                <p className="text-gray-700 text-sm mt-0.5 font-medium">cskh@dynova.vn</p>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-gray-50 pt-6">
              <div className="p-3 bg-orange-50 text-orange-500 rounded-xl shrink-0"><Clock className="w-5 h-5" /></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Thời gian làm việc tại cửa hàng</h4>
                <p className="text-gray-700 text-sm mt-0.5 font-medium">08:00 AM - 10:00 PM</p>
                <p className="text-xs text-gray-400 font-light mt-0.5">Áp dụng cho tất cả showroom trên toàn quốc</p>
              </div>
            </div>
          </div>

          {/* Chi tiết hệ thống Showroom */}
          <div className="space-y-4">
            <h3 className="font-bold text-blue-950 text-base uppercase tracking-wide">Hệ thống showroom</h3>
            
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-500" /> Chi nhánh TP. Hồ Chí Minh</h4>
              <p className="text-xs text-gray-600 font-light leading-relaxed pl-5">
                Số 1, Đường B, Khu ADC, Phường Trung Mỹ Tây, Quận 12, Thành phố Hồ Chí Minh.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-500" /> Văn phòng Head Office</h4>
              <p className="text-xs text-gray-600 font-light leading-relaxed pl-5">
                Tỉnh lộ 510, Thị trấn Bút Sơn, Huyện Hoằng Hóa, Tỉnh Thanh Hóa.
              </p>
            </div>
          </div>
        </div>

        {/* 3. FORM GỬI TIN NHẮN GÓP Ý (Lg: 7 columns) */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-blue-950 uppercase">Gửi tin nhắn cho chúng tôi</h3>
            <p className="text-xs text-gray-400 font-light">Nếu bạn cần hỗ trợ về đơn hàng hoặc có khiếu nại dịch vụ, hãy điền thông tin bên dưới.</p>
          </div>

          {/* Alert thông báo gửi thành công */}
          {isSubmitted && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-sm font-medium animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Cảm ơn bạn! Lời nhắn của bạn đã được gửi thành công. Đội ngũ Dynova sẽ phản hồi trong vòng 24h.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Họ và tên *</label>
                <input 
                  type="text" required name="fullName" value={formData.fullName} onChange={handleChange}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Địa chỉ Email *</label>
                <input 
                  type="email" required name="email" value={formData.email} onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Số điện thoại *</label>
                <input 
                  type="tel" required name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="Số điện thoại cá nhân"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Chủ đề cần liên hệ</label>
                <input 
                  type="text" name="subject" value={formData.subject} onChange={handleChange}
                  placeholder="Hỏi về đơn hàng, chính sách đổi trả..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Nội dung tin nhắn *</label>
              <textarea 
                required rows="4" name="message" value={formData.message} onChange={handleChange}
                placeholder="Nhập nội dung tin nhắn chi tiết tại đây..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/10 active:scale-[0.99]"
            >
              Gửi lời nhắn ngay <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* 4. GOOGLE MAPS EMBED TRÀN VIỀN PHÍA DƯỚI */}
      <section className="max-w-7xl mx-6 xl:mx-auto mt-16 rounded-3xl overflow-hidden shadow-sm border border-gray-200 h-[350px] md:h-[450px]">
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