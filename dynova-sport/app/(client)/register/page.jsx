'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    // Kiểm tra khớp mật khẩu cơ bản trước khi xử lý
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    setIsLoading(true);

    // Giả lập xử lý đăng ký tạo tài khoản trong 1.5 giây
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      // LƯU LẠI TÊN NGƯỜI DÙNG VỪA GÕ VÀO TRÌNH DUYỆT ĐỂ LAYOUT DÙNG
      localStorage.setItem('userDisplayName', formData.fullName);

      // Chuyển hướng sang trang đăng nhập sau khi báo thành công
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }, 1500);
  };

  return (
    <div className="bg-gray-50 min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-900 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-[10px] mx-auto tracking-tighter">DYNOVA</div>
          <h2 className="text-xl font-black text-blue-950 uppercase tracking-wide pt-2">Tạo tài khoản mới</h2>
          <p className="text-xs text-gray-400 font-light">Đăng ký thành viên để nhận hàng ngàn ưu đãi từ Dynova Sport</p>
        </div>

        {/* Thông báo đăng ký thành công */}
        {isSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" /> Đăng ký thành công! Đang chuyển đến trang Đăng nhập...
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Form Đăng ký */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Họ và tên *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                <User size={16} />
              </span>
              <input 
                type="text" required name="fullName" value={formData.fullName} onChange={handleChange}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Địa chỉ Email *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                  <Mail size={16} />
                </span>
                <input 
                  type="email" required name="email" value={formData.email} onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Số điện thoại *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                  <Phone size={16} />
                </span>
                <input 
                  type="tel" required name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="Số điện thoại"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mật khẩu *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                <Lock size={16} />
              </span>
              <input 
                type="password" required name="password" value={formData.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Xác nhận mật khẩu *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                <Lock size={16} />
              </span>
              <input 
                type="password" required name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={isLoading || isSuccess}
            className="w-full bg-blue-950 hover:bg-orange-500 disabled:bg-gray-300 text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] mt-2"
          >
            {isLoading ? 'Đang khởi tạo tài khoản...' : 'Đăng ký ngay'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-50 text-xs text-gray-500">
          Bạn đã có tài khoản rồi?{' '}
          <Link href="/login" className="text-orange-500 font-bold hover:underline">Đăng nhập ngay</Link>
        </div>

      </div>
    </div>
  );
}