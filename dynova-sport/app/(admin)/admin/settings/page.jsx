'use client';

import { useEffect, useState } from "react";
import { Save, Globe, Mail, Phone, MapPin, Sliders, RefreshCw } from "lucide-react";

export default function SettingsAdmin() {
  const [settings, setSettings] = useState({
    site_name: "Dynova Sport",
    site_title: "Dynova Sport - Cửa hàng đồ thể thao cao cấp",
    email: "contact@dynovasport.com",
    phone: "0901234567",
    address: "Ho Chi Minh City, Vietnam",
    maintenance_mode: false,
    allow_registration: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tự động lấy dữ liệu từ localStorage khi trang được tải
  useEffect(() => {
    const fetchSettings = () => {
      try {
        setLoading(true);
        if (typeof window !== 'undefined') {
          const localData = localStorage.getItem('dynova_settings');
          if (localData) {
            setSettings(JSON.parse(localData));
          }
        }
      } catch (error) {
        console.error("Lỗi lấy cấu hình hệ thống:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Lưu trực tiếp dữ liệu cấu hình vào localStorage khi nhấn Save
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // Giả lập độ trễ mạng ngắn để tạo hiệu ứng mượt mà
      await new Promise(resolve => setTimeout(resolve, 600));
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('dynova_settings', JSON.stringify(settings));
      }
      alert("Cập nhật cấu hình hệ thống thành công!");
    } catch (error) {
      alert("Cập nhật cấu hình thất bại!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-10">Đang tải cấu hình hệ thống...</div>;
  }

  return (
    <div className="space-y-6 p-2">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">System</p>
        <h2 className="mt-2 text-3xl font-black uppercase text-white">Cấu hình hệ thống</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CỘT TRÁI & GIỮA: THÔNG TIN CHÍNH */}
        <div className="lg:col-span-2 space-y-6">
          {/* Khối 1: Thông tin Website */}
          <div className="admin-card rounded-3xl p-6 bg-[#161616] border border-[#222222] space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Globe size={18} className="text-orange-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Thông tin Website</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Tên viết tắt hệ thống</label>
                <input 
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Tiêu đề SEO</label>
                <input 
                  value={settings.site_title}
                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Khối 2: Thông tin liên hệ */}
          <div className="admin-card rounded-3xl p-6 bg-[#161616] border border-[#222222] space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Phone size={18} className="text-orange-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Thông tin liên hệ</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Mail size={12} /> Email</label>
                <input 
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Phone size={12} /> Hotline</label>
                <input 
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><MapPin size={12} /> Địa chỉ chính</label>
              <input 
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TRẠNG THÁI VẬN HÀNH */}
        <div className="space-y-6">
          <div className="admin-card rounded-3xl p-6 bg-[#161616] border border-[#222222] space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Sliders size={18} className="text-orange-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Vận hành</h3>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1c1c1c] border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">Chế độ bảo trì</p>
                <p className="text-[10px] text-slate-500">Khóa giao diện công khai</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.maintenance_mode}
                  onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 peer-checked:after:bg-white"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1c1c1c] border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">Đăng ký thành viên</p>
                <p className="text-[10px] text-slate-500">Cho phép tạo tài khoản mới</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.allow_registration}
                  onChange={(e) => setSettings({ ...settings, allow_registration: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 peer-checked:after:bg-white"></div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-800 disabled:text-slate-500 font-bold rounded-2xl text-white text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/10 active:scale-98"
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Đang cập nhật...
              </>
            ) : (
              <>
                <Save size={16} /> Lưu cấu hình
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}