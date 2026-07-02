'use client';

import { useEffect, useMemo, useState } from "react";
import { Search, Package, RefreshCw, AlertTriangle, CheckCircle, Eye, History } from "lucide-react";
import { inventoryService } from "@/services/inventory.service";

export default function InventoryAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  
  // State cho Modal lịch sử
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  useEffect(() => { fetchInventory(); }, []);

  // Mở modal lịch sử
  const openHistory = async (item) => {
    setSelectedProduct(item.product?.name);
    try {
      const logs = await inventoryService.getHistory(item.product_id);
      setHistory(logs);
      setShowModal(true);
    } catch (error) {
      alert("Không thể tải lịch sử!");
    }
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const name = item.product?.name?.toLowerCase() || "";
      const stock = item.quantity_on_hand ?? 0;
      const matchesQuery = name.includes(query.toLowerCase());
      
      if (stockFilter === "low") return matchesQuery && stock <= 5 && stock > 0;
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
      await inventoryService.updateStock(id, { quantity_on_hand: newStock });
      fetchInventory();
    } catch (error) { alert("Cập nhật thất bại!"); }
  };

  return (
    <div className="space-y-6 p-2">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Inventory</p>
        <h2 className="mt-2 text-3xl font-black uppercase text-white">Quản lý kho hàng</h2>
      </div>

      <div className="admin-card rounded-3xl p-5 bg-[#161616] border border-[#222222]">
        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
            <input 
              value={query} onChange={(e) => setQuery(e.target.value)} 
              className="w-full pl-10 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl py-2.5 text-sm text-white outline-none" 
              placeholder="Tìm kiếm sản phẩm..." 
            />
          </div>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white">
            <option value="all">Tất cả sản phẩm</option>
            <option value="low">Sắp hết hàng (≤ 5)</option>
            <option value="out">Đã hết hàng (0)</option>
          </select>
        </div>

        {/* Bảng dữ liệu */}
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs uppercase text-slate-500 bg-[#1c1c1c]">
            <tr>
              <th className="p-3">Sản phẩm</th>
              <th className="p-3">Số lượng tồn</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors">
                <td className="p-3 font-bold text-white">{item.product?.name}</td>
                <td className="p-3 font-mono font-bold text-white">{item.quantity_on_hand}</td>
                <td className="p-3">
                  {item.quantity_on_hand === 0 ? <span className="text-rose-400 text-xs">Hết hàng</span> : <span className="text-emerald-400 text-xs">Còn hàng</span>}
                </td>
                <td className="p-3 text-right flex justify-end gap-2">
                  <button onClick={() => openHistory(item)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-xl" title="Xem lịch sử"><History size={16}/></button>
                  <button onClick={() => handleUpdateStock(item.id, item.quantity_on_hand)} className="p-2 text-orange-400 hover:bg-orange-500/10 rounded-xl" title="Cập nhật kho"><RefreshCw size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Lịch sử */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1c] p-6 rounded-2xl w-full max-w-md border border-[#333]">
            <h3 className="text-lg font-bold text-white mb-4">Lịch sử: {selectedProduct}</h3>
            <div className="max-h-[300px] overflow-y-auto pr-2">
              {history.map((log) => (
                <div key={log.id} className="flex justify-between py-2 border-b border-white/5 text-xs">
                  <span className={log.type === 'import' ? 'text-emerald-400' : 'text-rose-400'}>{log.type === 'import' ? 'Nhập' : 'Xuất'} {Math.abs(log.change_quantity)}</span>
                  <span className="text-slate-500">{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowModal(false)} className="mt-6 w-full py-2 bg-white/10 rounded-xl text-white">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}