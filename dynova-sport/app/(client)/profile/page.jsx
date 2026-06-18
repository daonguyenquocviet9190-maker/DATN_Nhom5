'use client';
import './profile.css';
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const [fullName, setFullName] = useState('Khách hàng');
  const [email, setEmail] = useState('chưa cập nhật');
  const [phone, setPhone] = useState('chưa cập nhật');
  const [address, setAddress] = useState('');
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
    <div className="profile-container min-h-[85vh] py-16 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full profile-card-premium rounded-3xl p-8 md:p-10 space-y-8">
        
        {/* Tiêu đề trang + Khu vực Avatar Luxury */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl avatar-badge-premium flex items-center justify-center text-orange-500 relative group overflow-hidden">
            <User size={28} className="group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-black text-blue-950 uppercase tracking-wide">Hồ sơ cá nhân</h2>
            <p className="text-xs text-gray-400 font-light">Quản lý thông tin tài khoản và bảo mật của bạn tại Dynova Sport</p>
          </div>
        </div>

        {/* Thông báo cập nhật thành công */}
        {isSaved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-bold uppercase tracking-wide flex items-center gap-2 animate-fadeIn shadow-sm">
            <ShieldCheck size={16} className="text-emerald-500" /> Cập nhật hồ sơ thành công!
          </div>
        )}

        {/* Form thông tin chi tiết */}
        <form onSubmit={handleSaveProfile} className="space-y-5">
          
          {/* Họ và tên */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Họ và tên</label>
            <div className="profile-input-wrapper">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
                <User size={16} />
              </span>
              <input 
                type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none text-gray-800 font-medium profile-input-premium"
              />
            </div>
          </div>

          {/* Grid Email & Số điện thoại */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Địa chỉ Email</label>
              <div className="profile-input-wrapper">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
                  <Mail size={16} />
                </span>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none text-gray-800 font-medium profile-input-premium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số điện thoại</label>
              <div className="profile-input-wrapper">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
                  <Phone size={16} />
                </span>
                <input 
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="0866xxxxxx"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none text-gray-800 font-medium profile-input-premium"
                />
              </div>
            </div>
          </div>

          {/* Địa chỉ nhận hàng */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Địa chỉ nhận hàng</label>
            <div className="profile-input-wrapper">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
                <MapPin size={16} />
              </span>
              <input 
                type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, tên đường, quận/huyện, thành phố..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none text-gray-800 font-medium profile-input-premium"
              />
            </div>
          </div>

          {/* Nút bấm lưu thay đổi */}
          <div className="pt-4 flex justify-end">
            <button 
              type="submit"
              className="btn-save-premium font-bold py-3.5 px-7 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 shadow-md active:scale-[0.99]"
            >
              <Save size={14} /> Lưu thay đổi
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}