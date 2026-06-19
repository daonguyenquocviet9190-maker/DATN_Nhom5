'use client';
import './register.css'; // 1. Hãy chắc chắn rằng bạn đã import file css này vào
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

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      localStorage.setItem('userDisplayName', formData.fullName);

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }, 1500);
  };

  return (
    /* Đổi thành: register-container */
    <div className="register-container min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Đổi thành: register-card */}
      <div className="max-w-md w-full register-card rounded-3xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          {/* Đổi thành: logo-dynova-premium */}
          <div className="w-12 h-12 logo-dynova-premium rounded-full flex items-center justify-center text-white font-black text-[10px] mx-auto tracking-tighter">DYNOVA</div>
          <h2 className="text-xl font-black text-blue-950 uppercase tracking-wide pt-2">Tạo tài khoản mới</h2>
          <p className="text-xs text-gray-400 font-light">Đăng ký thành viên để nhận hàng ngàn ưu đãi từ Dynova Sport</p>
        </div>

        {/* Thông báo thành công */}
        {isSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all">
            <ShieldCheck size={16} className="text-emerald-500" /> Đăng ký thành công! Đang chuyển đến trang Đăng nhập...
          </div>
        )}

        {/* Thông báo lỗi */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs font-semibold text-center animate-shake">
            {error}
          </div>
        )}

        {/* Form Đăng ký */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Họ và tên *</label>
            {/* Thêm bao bọc: input-wrapper-premium */}
            <div className="input-wrapper-premium">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                <User size={16} />
              </span>
              {/* Thêm class: register-input */}
              <input 
                type="text" required name="fullName" value={formData.fullName} onChange={handleChange}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all text-gray-800 font-medium register-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Địa chỉ Email *</label>
              <div className="input-wrapper-premium">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                  <Mail size={16} />
                </span>
                <input 
                  type="email" required name="email" value={formData.email} onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all text-gray-800 font-medium register-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số điện thoại *</label>
              <div className="input-wrapper-premium">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                  <Phone size={16} />
                </span>
                <input 
                  type="tel" required name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="Số điện thoại"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all text-gray-800 font-medium register-input"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mật khẩu *</label>
            <div className="input-wrapper-premium">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                <Lock size={16} />
              </span>
              <input 
                type="password" required name="password" value={formData.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all text-gray-800 font-medium register-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Xác nhận mật khẩu *</label>
            <div className="input-wrapper-premium">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                <Lock size={16} />
              </span>
              <input 
                type="password" required name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all text-gray-800 font-medium register-input"
              />
            </div>
          </div>

          {/* Đổi thành class nút bấm mới: btn-register-premium */}
          <button 
            type="submit" disabled={isLoading || isSuccess}
            className="w-full btn-register-premium text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md mt-4 disabled:bg-gray-300"
          >
            {isLoading ? 'Đang khởi tạo tài khoản...' : 'Đăng ký ngay'} <ArrowRight size={14} />
          </button>
        </form>

        {/* Đổi link thành: login-link-premium */}
        <div className="text-center pt-2 border-t border-gray-50 text-xs text-gray-400">
          Bạn đã có tài khoản rồi?{' '}
          <Link href="/login" className="text-orange-500 font-bold login-link-premium">Đăng nhập ngay</Link>
        </div>

      </div>
    </div>
  );
}