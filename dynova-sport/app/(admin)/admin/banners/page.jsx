'use client';
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Layers, 
  Link2, 
  BarChart3, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2,
  SlidersHorizontal,
  X,
  UploadCloud,
  Image as ImageIcon
} from 'lucide-react';
import { bannerService } from '@/services/banner.service'; // Tích hợp file dịch vụ của bạn

export default function BannersAdmin() {
  // 1. Khởi tạo danh sách dữ liệu rỗng để đón nhận dữ liệu từ Laravel API
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Các State quản lý bộ lọc và đóng mở Modal
  const [positionFilter, setPositionFilter] = useState('Tất cả');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form State cho việc Thêm/Sửa
  const [formData, setFormData] = useState({ title: '', position: 'Slide Trang Chủ (Chính)', link: '', image: '', status: 'Hiển thị' });

  // Hàm gọi API lấy danh sách banners từ Laravel
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await bannerService.getAll();
      setBanners(data);
    } catch (error) {
      console.error("Lỗi khi kết nối API lấy danh sách banner:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tự động gọi API ngay khi cấu trúc giao diện Admin vừa render xong
  useEffect(() => {
    fetchBanners();
  }, []);

  // 2. Các hàm xử lý logic nghiệp vụ kết nối trực tiếp đến API Backend
  const toggleStatus = async (banner) => {
    const updatedStatus = banner.status === 'Hiển thị' ? 'Đang ẩn' : 'Hiển thị';
    try {
      // Gọi API cập nhật trạng thái
      await bannerService.update(banner.id, {
        ...banner,
        status: updatedStatus
      });
      // Tải lại danh sách mới
      fetchBanners();
    } catch (error) {
      alert("Cập nhật trạng thái hiển thị thất bại!");
      console.error(error);
    }
  };

  const deleteBanner = async (id) => {
    if(confirm("Bạn có chắc chắn muốn xóa banner này vĩnh viễn khỏi Database?")) {
      try {
        await bannerService.delete(id);
        alert("Đã xóa banner thành công!");
        fetchBanners(); // Cập nhật lại danh sách sau khi xóa
      } catch (error) {
        alert("Xóa banner thất bại. Vui lòng kiểm tra lại hệ thống.");
        console.error(error);
      }
    }
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setFormData({ title: '', position: 'Slide Trang Chủ (Chính)', link: '', image: '', status: 'Hiển thị' });
    setIsModalOpen(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({ 
      title: banner.title || '', 
      position: banner.position || 'Slide Trang Chủ (Chính)', 
      link: banner.link || '', 
      image: banner.image || banner.image_url || '', 
      status: banner.status || 'Hiển thị' 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        // Logic Cập nhật thông qua API PUT
        await bannerService.update(editingBanner.id, formData);
        alert("Cập nhật thông tin banner thành công!");
      } else {
        // Logic Thêm mới thông qua API POST
        await bannerService.create({ ...formData, clicks: 0 });
        alert("Tạo banner mới thành công!");
      }
      setIsModalOpen(false);
      fetchBanners(); // Tải lại danh sách dữ liệu thực tế mới nhất
    } catch (error) {
      alert("Lưu thiết lập banner thất bại. Bạn hãy kiểm tra lại kết nối Laravel.");
      console.error(error);
    }
  };

  // Bộ lọc Client-side mượt mà dựa trên dữ liệu trả về từ API
  const filteredBanners = banners.filter(b => positionFilter === 'Tất cả' || b.position === positionFilter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-neutral-400 font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mb-4"></div>
        <p className="text-xs uppercase tracking-widest">Đang tải dữ liệu từ hệ thống Laravel API...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-neutral-200 p-2 max-w-7xl mx-auto font-sans antialiased">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-2xl font-light tracking-widest text-white uppercase">
            QUẢN LÝ <span className="font-semibold text-orange-500">BANNERS</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-light tracking-wider">
            Hệ thống tối ưu hóa hình ảnh chiến dịch, tracking lượt click và vị trí hiển thị (Dữ liệu từ API).
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="group bg-white hover:bg-orange-500 hover:text-white text-neutral-900 text-xs font-semibold uppercase tracking-widest px-5 py-3 rounded-none flex items-center gap-2 transition-all duration-300 shadow-xl active:scale-95"
        >
          <Plus size={14} className="transition-transform group-hover:rotate-90" /> 
          Thêm Banner Mới
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-[#0f0f0f] border border-neutral-800/60 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 text-neutral-400">
          <SlidersHorizontal size={14} className="text-orange-500" />
          <span className="text-xs uppercase tracking-wider font-medium">Vị trí hiển thị</span>
        </div>
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {['Tất cả', 'Slide Trang Chủ (Chính)', 'Slide Trang Chủ (Phụ)', 'Banner Giữa Trang'].map((pos) => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`text-xs px-4 py-2 font-light tracking-wide transition-all duration-200 ${
                positionFilter === pos 
                  ? 'bg-neutral-800 border border-neutral-700 text-white font-medium' 
                  : 'bg-transparent border border-transparent text-neutral-400 hover:text-white hover:border-neutral-800'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* BANNER GRID SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredBanners.length > 0 ? (
          filteredBanners.map((banner) => (
            <div 
              key={banner.id} 
              className="group bg-[#0d0d0d] border border-neutral-900 rounded-none overflow-hidden flex flex-col justify-between transition-all duration-500 hover:border-neutral-700 hover:shadow-[0_0_40px_rgba(0,0,0,0.7)]"
            >
              {/* IMAGE WRAPPER WITH REAL BANNER IMAGE */}
              <div className="h-52 p-6 flex flex-col justify-between relative overflow-hidden bg-neutral-950">
                {(banner.image || banner.image_url) ? (
                  <img 
                    src={banner.image || banner.image_url} 
                    alt={banner.title} 
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-70"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-neutral-700"><ImageIcon size={40}/></div>
                )}
                {/* Luxury Matte Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-black/50"></div>
                
                {/* Meta Header */}
                <div className="relative z-10 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-semibold tracking-widest bg-black/70 text-white/90 border border-white/10 px-2.5 py-1 backdrop-blur-md">
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 bg-orange-500"></span>
                    {banner.position || 'Slide Trang Chủ (Chính)'}
                  </span>
                  <span className="font-mono text-[10px] tracking-wider text-white/50 bg-black/50 px-2 py-0.5 border border-white/5">
                    ID: {banner.id}
                  </span>
                </div>

                {/* Info Text */}
                <div className="relative z-10 space-y-1.5">
                  <h3 className="text-lg font-light text-white tracking-wide leading-snug group-hover:text-orange-400 transition-colors duration-300">
                    {banner.title || 'Không có tiêu đề'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-white/60 font-mono text-[11px] bg-black/40 w-fit px-2 py-0.5 backdrop-blur-sm border border-white/5">
                    <Link2 size={10} className="text-neutral-400" />
                    <span className="truncate max-w-[280px] sm:max-w-md">{banner.link || 'Chưa gán link'}</span>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER BAR */}
              <div className="p-4 bg-[#080808] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs border-t border-neutral-900">
                <div className="flex items-center gap-2 text-neutral-400 font-light tracking-wide">
                  <BarChart3 size={13} className="text-neutral-500" />
                  Lượt tương tác: <span className="text-white font-mono font-medium">{(banner.clicks || 0).toLocaleString('vi-VN')} click</span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-900">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium ${
                    banner.status === 'Hiển thị' ? 'text-emerald-400' : 'text-neutral-500'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${banner.status === 'Hiển thị' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`}></span>
                    {banner.status || 'Hiển thị'}
                  </span>

                  <div className="flex items-center gap-1 pl-3 border-l border-neutral-800">
                    <button 
                      onClick={() => openEditModal(banner)}
                      className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all active:scale-90" 
                      title="Chỉnh sửa cấu hình"
                    >
                      <Edit3 size={13} />
                    </button>
                    
                    <button 
                      onClick={() => toggleStatus(banner)}
                      className={`p-2 transition-all active:scale-90 ${
                        banner.status === 'Hiển thị' ? 'text-neutral-400 hover:text-rose-400' : 'text-neutral-400 hover:text-emerald-400'
                      }`}
                      title={banner.status === 'Hiển thị' ? 'Tạm ẩn' : 'Kích hoạt hiển thị'}
                    >
                      {banner.status === 'Hiển thị' ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>

                    <button 
                      onClick={() => deleteBanner(banner.id)}
                      className="p-2 text-neutral-600 hover:text-rose-500 hover:bg-rose-950/20 transition-all active:scale-90" 
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-1 lg:col-span-2 bg-[#0d0d0d] border border-neutral-900 py-20 text-center text-neutral-500 font-light tracking-wide">
            <Layers className="mx-auto mb-3 text-neutral-700" size={24} />
            Không có banner nào được phân bổ tại hệ thống hoặc vị trí này.
          </div>
        )}
      </div>

      {/* LUXURY GLASSMORPHIC POPUP MODAL (Thêm/Sửa Banner) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-[#0d0d0d] border border-neutral-800 w-full max-w-xl rounded-none overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-[#0a0a0a]">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-white">
                {editingBanner ? 'Cập Nhật Cấu Hình Banner' : 'Khởi Tạo Thiết Lập Banner Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-light">Tiêu đề chiến dịch</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ví dụ: Giáng Sinh Rực Rỡ 2026..." 
                  className="w-full bg-[#141414] border border-neutral-800 focus:border-neutral-600 text-xs text-white px-4 py-3 rounded-none outline-none transition-all font-light"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-light">Vị trí phân bổ</label>
                  <select 
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full bg-[#141414] border border-neutral-800 focus:border-neutral-600 text-xs text-white px-3 py-3 rounded-none outline-none transition-all font-light"
                  >
                    <option value="Slide Trang Chủ (Chính)">Slide Trang Chủ (Chính)</option>
                    <option value="Slide Trang Chủ (Phụ)">Slide Trang Chủ (Phụ)</option>
                    <option value="Banner Giữa Trang">Banner Giữa Trang</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-light">Trạng thái ban đầu</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-[#141414] border border-neutral-800 focus:border-neutral-600 text-xs text-white px-3 py-3 rounded-none outline-none transition-all font-light"
                  >
                    <option value="Hiển thị">Hiển thị ngay</option>
                    <option value="Đang ẩn">Ẩn tạm thời</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-light">Đường dẫn điều hướng (URL / Link)</label>
                <input 
                  type="text" 
                  value={formData.link}
                  onChange={(e) => setFormData({...formData, link: e.target.value})}
                  placeholder="Ví dụ: /collections/hot-deals" 
                  className="w-full bg-[#141414] border border-neutral-800 focus:border-neutral-600 text-xs text-white px-4 py-3 rounded-none outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-light">Hình ảnh Banner (Image URL)</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    placeholder="Dán link ảnh Unsplash hoặc link CDN vào đây..." 
                    className="w-full bg-[#141414] border border-neutral-800 focus:border-neutral-600 text-xs text-white px-4 py-3 rounded-none outline-none transition-all font-light"
                  />
                </div>
                <p className="text-[10px] text-neutral-500 font-light italic">Mẹo: Thử dán một link ảnh bất kỳ trên internet để xem hình hiển thị lập tức.</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-2 text-xs font-medium uppercase tracking-widest">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-3 bg-white text-neutral-900 hover:bg-orange-500 hover:text-white transition-colors"
                >
                  Lưu Thiết Lập
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}