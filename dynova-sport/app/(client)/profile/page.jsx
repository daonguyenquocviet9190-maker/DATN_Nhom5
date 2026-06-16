'use client';
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const [fullName, setFullName] = useState('Khách hàng');
  const [email, setEmail] = useState('chưa cập nhật');
  const [phone, setPhone] = useState('chưa cập nhật');
  const [isSaved, setIsSaved] = useState(false);

  // TỰ ĐỘNG ĐỌC TÊN ĐỘNG TỪ LOCALSTORAGE KHI VÀO TRANG CÁ NHÂN
  useEffect(() => {
    const savedName = localStorage.getItem('userDisplayName');
    if (savedName) {
      setFullName(savedName);
    }
  }, []);

  // Xử lý khi người dùng nhấn lưu thay đổi thông tin cá nhân
  const handleSaveProfile = (e) => {
    e.preventDefault();
    
    // Cập nhật lại tên mới vào localStorage nếu người dùng sửa đổi trực tiếp tại đây
    localStorage.setItem('userDisplayName', fullName);
    
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      // Tải lại trang nhẹ để thanh Header (layout.jsx) cập nhật ngay lập tức theo tên mới
      window.location.reload(); 
    }, 1500);
  };

  return (
    <div className="bg-gray-50 min-h-[80vh] py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-6">
        
        {/* Tiêu đề trang */}
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-xl font-black text-blue-950 uppercase tracking-wide">Hồ sơ cá nhân</h2>
          <p className="text-xs text-gray-400 font-light mt-1">Quản lý thông tin tài khoản và bảo mật của bạn tại Dynova</p>
        </div>

        {/* Thông báo cập nhật thành công */}
        {isSaved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-bold uppercase tracking-wide flex items-center gap-2 animate-fadeIn">
            <ShieldCheck size={16} className="text-emerald-500" /> Cập nhật hồ sơ thành công!
          </div>
        )}

        {/* Form thông tin chi tiết */}
        <form onSubmit={handleSaveProfile} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Họ và tên</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <User size={16} />
              </span>
              <input 
                type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Địa chỉ Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail size={16} />
                </span>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Số điện thoại</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Phone size={16} />
                </span>
                <input 
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="0866xxxxxx"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Địa chỉ nhận hàng</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <MapPin size={16} />
              </span>
              <input 
                type="text" placeholder="Số nhà, tên đường, quận/huyện, thành phố..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 font-medium"
              />
            </div>
          </div>

          {/* Nút bấm lưu thay đổi */}
          <div className="pt-2 flex justify-end">
            <button 
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-[0.99]"
            >
              <Save size={14} /> Lưu thay đổi
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}