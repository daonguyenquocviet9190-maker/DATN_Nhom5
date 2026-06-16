'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Giả lập xử lý kết nối kiểm tra đăng nhập trong 1.5 giây
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      // 1. LƯU TRẠNG THÁI ĐĂNG NHẬP VÀO TRÌNH DUYỆT
      localStorage.setItem('isLoggedIn', 'true');

      // 2. NẾU KHÁCH VÀO THẲNG LOGIN (CHƯA QUA REGISTER), LẤY TẠM TÊN TỪ EMAIL ĐỂ HIỂN THỊ
      if (!localStorage.getItem('userDisplayName')) {
        const nameFromEmail = email.split('@')[0];
        localStorage.setItem('userDisplayName', nameFromEmail);
      }

      // Đợi hiệu ứng báo thành công xong chuyển hướng về Trang Chủ
      setTimeout(() => {
        router.push('/');
        // Làm mới nhẹ trình duyệt để layout.jsx đọc lại dữ liệu mới từ bộ nhớ
        window.location.reload(); 
      }, 1000);
    }, 1500);
  };

  return (
    <div className="bg-gray-50 min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-6">
        
        {/* Header Form */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-900 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-[10px] mx-auto tracking-tighter">DYNOVA</div>
          <h2 className="text-xl font-black text-blue-950 uppercase tracking-wide pt-2">Đăng nhập tài khoản</h2>
          <p className="text-xs text-gray-400 font-light">Chào mừng bạn quay trở lại với Dynova Sport Shop</p>
        </div>

        {/* Thông báo đăng nhập thành công */}
        {isSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" /> Đăng nhập thành công! Đang chuyển hướng...
          </div>
        )}

        {/* Form nhập liệu */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Địa chỉ Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                <Mail size={16} />
              </span>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mật khẩu</label>
              <a href="#/forgot-password" className="text-[11px] text-gray-400 hover:text-orange-500 font-medium">Quên mật khẩu?</a>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                <Lock size={16} />
              </span>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={isLoading || isSuccess}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/10 active:scale-[0.99] mt-2"
          >
            {isLoading ? 'Chờ trong giây lát...' : 'Đăng nhập ngay'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-50 text-xs text-gray-500">
          Bạn chưa có tài khoản?{' '}
          <Link href="/register" className="text-orange-500 font-bold hover:underline">Tạo tài khoản mới</Link>
        </div>

      </div>
    </div>
  );
}