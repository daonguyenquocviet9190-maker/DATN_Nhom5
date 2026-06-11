'use client';
import React, { useState } from 'react';

export default function ReviewsAdmin() {
  // 1. Giả lập danh sách đánh giá từ khách hàng cho Dynova Sport
  const [reviews, setReviews] = useState([
    { id: 'REV-101', customer: 'Nguyễn Văn A', product: 'Giày Chạy Bộ Dynova X-Pro', rating: 5, comment: 'Giày đi êm chân lắm shop ơi, đế bám đường tốt, đáng tiền nhen!', date: '11/06/2026', status: 'Đã duyệt' },
    { id: 'REV-102', customer: 'Lê Hoàng Nam', email: 'namle@gmail.com', product: 'Áo T-Shirt Thể Thao Pro-Dry', rating: 4, comment: 'Áo thấm hút mồ hôi tốt, form đẹp nhưng giao hàng hơi chậm tí.', date: '10/06/2026', status: 'Đã duyệt' },
    { id: 'REV-103', customer: 'Trần Thị Bích', product: 'Thảm Tập Yoga TPE Cao Cấp', rating: 5, comment: 'Thảm dày dặn, không bị hôi mùi nhựa, đóng gói rất cẩn thận.', date: '09/06/2026', status: 'Đã duyệt' },
    { id: 'REV-104', customer: 'Phạm Minh Tuấn', product: 'Quần Short Tập Luyện Co Giãn', rating: 2, comment: 'Quần bị chật so với size đùi của mình, chất vải thì okay.', date: '08/06/2026', status: 'Chờ duyệt' },
    { id: 'REV-105', customer: 'Hoàng Thu Thảo', product: 'Giày Chạy Bộ Dynova X-Pro', rating: 1, comment: 'Giao sai màu giày cho mình rồi shop, nhắn tin chưa thấy rep đổi hàng...', date: '07/06/2026', status: 'Chờ duyệt' },
  ]);

  // 2. State quản lý Tìm kiếm sản phẩm và Lọc số sao (Rating Filter)
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('Tất cả');

  // 3. Hàm xử lý Duyệt hoặc Ẩn đánh giá nhanh
  const handleToggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'Đã duyệt' ? 'Đã ẩn' : 'Đã duyệt';
    setReviews(reviews.map(rev => {
      if (rev.id === id) {
        return { ...rev, status: nextStatus };
      }
      return rev;
    }));
  };

  // 4. Bộ lọc dữ liệu theo từ khóa và số sao
  const filteredReviews = reviews.filter(rev => {
    const matchesSearch = rev.product.toLowerCase().includes(searchTerm.toLowerCase()) || rev.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = ratingFilter === 'Tất cả' || rev.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  // Hàm hiển thị số sao bằng icon ⭐️
  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  return (
    <div className="space-y-6 text-white">
      {/* TIÊU ĐỀ TRANG */}
      <div>
        <h2 className="text-xl font-bold">Quản lý đánh giá</h2>
        <p className="text-xs text-gray-500 mt-0.5">Phản hồi của khách hàng về chất lượng sản phẩm và dịch vụ Dynova Sport</p>
      </div>

      {/* THANH BỘ LỌC SAO & TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#161616] border border-[#222222] p-4 rounded-2xl">
        {/* Tìm kiếm theo tên hoặc sản phẩm */}
        <div className="relative md:col-span-2">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên khách hàng hoặc tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder-gray-500 text-white"
          />
        </div>
        
        {/* Lọc theo số sao */}
        <div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white cursor-pointer"
          >
            <option value="Tất cả">Tất cả số sao</option>
            <option value="5">5 Sao ⭐⭐⭐⭐⭐</option>
            <option value="4">4 Sao ⭐⭐⭐⭐</option>
            <option value="3">3 Sao ⭐⭐⭐</option>
            <option value="2">2 Sao ⭐⭐</option>
            <option value="1">1 Sao ⭐</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH ĐÁNH GIÁ (DẠNG GRID / LIST ĐỂ DỄ ĐỌC NỘI DUNG) */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((rev) => (
            <div key={rev.id} className="bg-[#161616] border border-[#222222] p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-4 transition-all hover:border-[#333333]">
              
              {/* Bên trái: Thông tin người dùng, số sao và nội dung bình luận */}
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-white">{rev.customer}</span>
                  <span className="text-xs text-gray-500">{rev.date}</span>
                  <span className="text-xs font-mono text-gray-600">[{rev.id}]</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    rev.status === 'Đã duyệt' ? 'text-emerald-500 bg-emerald-500/10' :
                    rev.status === 'Chờ duyệt' ? 'text-amber-500 bg-amber-500/10' :
                    'text-rose-500 bg-rose-500/10'
                  }`}>
                    {rev.status}
                  </span>
                </div>

                {/* Tên sản phẩm được đánh giá */}
                <p className="text-xs text-orange-400 font-medium">Sản phẩm: {rev.product}</p>

                {/* Hiển thị số sao */}
                <div className="text-sm tracking-tighter">{renderStars(rev.rating)}</div>

                {/* Nội dung bình luận thực tế */}
                <p className="text-sm text-gray-300 leading-relaxed bg-[#1c1c1c] p-3 rounded-xl border border-[#222222]/60">
                  "{rev.comment}"
                </p>
              </div>

              {/* Bên phải: Các nút duyệt hành động nhanh */}
              <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                {rev.status === 'Chờ duyệt' ? (
                  <button
                    onClick={() => handleToggleStatus(rev.id, 'Chờ duyệt')}
                    className="w-full md:w-28 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl transition-colors"
                  >
                    ✓ Duyệt hiện
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(rev.id, rev.status)}
                    className={`w-full md:w-28 text-xs font-semibold py-2 px-3 rounded-xl border transition-all ${
                      rev.status === 'Đã duyệt'
                        ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                        : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    {rev.status === 'Đã duyệt' ? '🔒 Ẩn bình luận' : '🔓 Hiện lại'}
                  </button>
                )}
              </div>

            </div>
          ))
        ) : (
          <div className="bg-[#161616] border border-[#222222] p-8 rounded-2xl text-center text-gray-500">
            🔍 Không tìm thấy đánh giá nào khớp với điều kiện lọc.
          </div>
        )}
      </div>

      {/* PHÂN TRANG GIẢ LẬP */}
      <div className="p-4 bg-[#161616] border border-[#222222] rounded-2xl flex justify-between items-center text-xs text-gray-500">
        <p>Hiển thị {filteredReviews.length} đánh giá khách hàng</p>
        <div className="flex gap-1">
          <button className="px-3 py-1 bg-[#222222] rounded hover:text-white transition-colors" disabled>Trước</button>
          <button className="px-3 py-1 bg-orange-500 text-white rounded font-bold">1</button>
          <button className="px-3 py-1 bg-[#222222] rounded hover:text-white transition-colors" disabled>Sau</button>
        </div>
      </div>
    </div>
  );
}