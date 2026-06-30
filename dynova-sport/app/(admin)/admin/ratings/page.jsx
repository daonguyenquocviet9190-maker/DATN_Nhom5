'use client';

import { useEffect, useState } from "react";
import { Search, Star, Trash2, MessageSquare } from "lucide-react";
import { ratingService } from "../../../../services/rating.service";

export default function RatingsAdmin() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const data = await ratingService.getAll();
      // Sửa setUsers thành setRatings để đồng bộ đúng với biến state bên trên
      setRatings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy danh sách đánh giá:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const filteredRatings = ratings.filter((r) => {
    const customerName = r.customer_name || "";
    const productName = r.product_name || "";
    const comment = r.comment || "";
    return (
      customerName.toLowerCase().includes(query.toLowerCase()) ||
      productName.toLowerCase().includes(query.toLowerCase()) ||
      comment.toLowerCase().includes(query.toLowerCase())
    );
  });

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) return;
    try {
      await ratingService.delete(id);
      alert("Xóa đánh giá thành công!");
      fetchRatings();
    } catch (error) {
      alert("Xóa đánh giá thất bại!");
    }
  };

  // Hàm hiển thị các ngôi sao icon dựa trên số điểm (1-5)
  const renderStars = (ratingNumber) => {
    const stars = [];
    const count = ratingNumber || 5;
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          className={i < count ? "text-amber-400 fill-amber-400" : "text-slate-600"}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-10">Đang tải danh sách đánh giá...</div>;
  }

  return (
    <div className="space-y-6 p-2">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Feedback</p>
        <h2 className="mt-2 text-3xl font-black uppercase text-white">Quản lý đánh giá</h2>
      </div>

      <div className="admin-card rounded-3xl p-5 bg-[#161616] border border-[#222222]">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            className="w-full pl-10 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl py-2.5 text-sm text-white outline-none focus:border-orange-500" 
            placeholder="Tìm kiếm theo tên khách hàng, sản phẩm hoặc nội dung..." 
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase text-slate-500 bg-[#1c1c1c]">
              <tr>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Đánh giá</th>
                <th className="p-3">Nội dung bình luận</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredRatings.length > 0 ? (
                filteredRatings.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-bold text-white">{r.customer_name || "Ẩn danh"}</td>
                    <td className="p-3 text-slate-300 max-w-[180px] truncate">{r.product_name || "Sản phẩm không rõ"}</td>
                    <td className="p-3">{renderStars(r.rating)}</td>
                    <td className="p-3 text-slate-400 font-light italic max-w-[300px] truncate">
                      "{r.comment || "Không có nội dung bình luận."}"
                    </td>
                    <td className="p-3 text-right flex justify-end">
                      <button 
                        onClick={() => handleDelete(r.id)} 
                        className="text-rose-400 p-2 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Xóa phản hồi"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <MessageSquare className="mx-auto mb-2 opacity-30" size={24} /> Không có đánh giá nào từ người dùng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}