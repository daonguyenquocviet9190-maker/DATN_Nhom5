'use client';

import { useEffect, useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { promotionService } from "@/services/promotion.service";

export default function PromotionsAdmin() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const data = await promotionService.getAll();
      setPromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!code || !discount) return alert("Vui lòng điền đầy đủ!");
    try {
      await promotionService.create({ code, discount: Number(discount) });
      setCode("");
      setDiscount("");
      alert("Thêm mã giảm giá mới thành công!");
      fetchPromotions();
    } catch (error) {
      alert("Không thể thêm mã mới!");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn muốn xóa mã giảm giá này?")) return;
    try {
      await promotionService.delete(id);
      fetchPromotions();
    } catch (error) {
      alert("Xóa thất bại!");
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-10">Đang tải mã khuyến mãi...</div>;
  }

  return (
    <div className="space-y-6 p-2">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Offers</p>
        <h2 className="mt-2 text-3xl font-black uppercase text-white">Mã giảm giá (Promotions)</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <form onSubmit={handleCreate} className="admin-card rounded-3xl p-5 bg-[#161616] border border-[#222222] h-fit space-y-4">
          <h3 className="font-bold text-white">Tạo mã mới</h3>
          <div>
            <label className="text-xs text-slate-400">Mã CODE</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} className="admin-input w-full mt-1 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl p-2 text-white outline-none" placeholder="VD: DYNOVA50" />
          </div>
          <div>
            <label className="text-xs text-slate-400">Giảm (%) hoặc Số tiền</label>
            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="admin-input w-full mt-1 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl p-2 text-white outline-none" placeholder="VD: 10" />
          </div>
          <button type="submit" className="w-full py-2 bg-orange-500 hover:bg-orange-600 font-bold rounded-xl text-white text-sm flex items-center justify-center gap-1">
            <Plus size={16}/> Thêm mã
          </button>
        </form>

        <div className="admin-card rounded-3xl p-5 bg-[#161616] border border-[#222222]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase text-slate-500 bg-[#1c1c1c]">
                <tr>
                  <th className="p-3">Mã Code</th>
                  <th className="p-3">Mức giảm</th>
                  <th className="p-3 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {promotions.length > 0 ? (
                  promotions.map((promo) => (
                    <tr key={promo.id} className="hover:bg-white/5">
                      <td className="p-3 font-mono font-bold text-orange-300">{promo.code}</td>
                      <td className="p-3 font-mono text-white">{promo.discount}%</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDelete(promo.id)} className="text-rose-400 p-2 hover:bg-rose-500/10 rounded-xl">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-slate-500">
                      <Tag className="mx-auto mb-2 opacity-30" size={24} /> Chưa có chương trình khuyến mãi nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}