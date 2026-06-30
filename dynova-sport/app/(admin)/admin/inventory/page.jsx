'use client';

import { useEffect, useMemo, useState } from "react";
import { Search, Package, RefreshCw, AlertTriangle } from "lucide-react";
import { inventoryService } from "@/services/inventory.service";

export default function InventoryAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu kho:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const name = item.name || "";
      const stock = item.stock ?? 0;
      const matchesQuery = name.toLowerCase().includes(query.toLowerCase());
      
      if (stockFilter === "low") return matchesQuery && stock <= 5;
      if (stockFilter === "out") return matchesQuery && stock === 0;
      return matchesQuery;
    });
  }, [items, query, stockFilter]);

  const handleUpdateStock = async (id, currentStock) => {
    const newStockStr = prompt("Nhập số lượng tồn kho mới:", currentStock);
    if (newStockStr === null) return;
    const newStock = parseInt(newStockStr, 10);
    if (isNaN(newStock) || newStock < 0) return alert("Số lượng không hợp lệ!");

    try {
      await inventoryService.updateStock(id, newStock);
      alert("Cập nhật số lượng tồn kho thành công!");
      fetchInventory();
    } catch (error) {
      alert("Cập nhật thất bại!");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mb-4"></div>
        <p className="text-xs uppercase tracking-widest">Đang tải dữ liệu kho hàng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Inventory</p>
        <h2 className="mt-2 text-3xl font-black uppercase text-white">Quản lý kho hàng</h2>
        <p className="mt-2 text-sm text-slate-400">Theo dõi hàng tồn kho, cập nhật số lượng sản phẩm nhanh chóng.</p>
      </div>

      <div className="admin-card rounded-3xl p-5 bg-[#161616] border border-[#222222]">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              className="admin-input w-full pl-10 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl py-2.5 text-sm text-white outline-none focus:border-orange-500" 
              placeholder="Tìm kiếm tên sản phẩm trong kho..." 
            />
          </div>
          <select 
            value={stockFilter} 
            onChange={(e) => setStockFilter(e.target.value)} 
            className="admin-input bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">Tất cả sản phẩm</option>
            <option value="low">Sắp hết hàng (≤ 5)</option>
            <option value="out">Đã hết hàng (0)</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase text-slate-500 bg-[#1c1c1c]">
              <tr>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Giá bán</th>
                <th className="p-3">Số lượng tồn</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt="" className="w-10 h-10 object-cover rounded-lg bg-neutral-800" />
                      )}
                      <div>
                        <p className="font-bold text-white line-clamp-1">{item.name}</p>
                        <p className="text-xs text-slate-500 font-mono">ID: {item.id}</p>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-orange-300">{formatCurrency(item.price || 0)}</td>
                    <td className="p-3 font-mono">
                      <span className={`font-bold ${
                        (item.stock ?? 0) === 0 ? "text-rose-400" : (item.stock ?? 0) <= 5 ? "text-amber-400" : "text-white"
                      }`}>
                        {item.stock ?? 0}
                      </span>
                    </td>
                    <td className="p-3">
                      {(item.stock ?? 0) === 0 ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-rose-500/10 text-rose-400 flex items-center gap-1 w-fit"><AlertTriangle size={12}/> Hết hàng</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400">Còn hàng</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => handleUpdateStock(item.id, item.stock ?? 0)}
                        className="rounded-xl bg-orange-500/10 p-2 text-orange-400 hover:bg-orange-500/20 transition-all"
                        title="Điều chỉnh kho"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <Package className="mx-auto mb-2 opacity-30" size={24} /> Kho hàng trống.
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