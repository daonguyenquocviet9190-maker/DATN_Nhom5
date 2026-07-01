'use client';

import { useEffect, useState } from "react";
import { Lock, Search, Unlock, Users, Trash2 } from "lucide-react";
import { userService } from "../../../../services/user.service";

export default function CustomersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy danh sách thành viên:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // FIX: Thay u.name bằng u.full_name để khớp với database của bạn
  const filteredUsers = users.filter((u) => {
    const name = u.full_name || "";
    const email = u.email || "";
    return name.toLowerCase().includes(query.toLowerCase()) || email.toLowerCase().includes(query.toLowerCase());
  });

  // FIX: Chuyển đổi trạng thái bằng 'active' và 'blocked' đồng bộ với MySQL Enum
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    const confirmMsg = currentStatus === "active" ? "Bạn có chắc chắn muốn KHÓA tài khoản này?" : "Bạn có muốn MỞ KHÓA tài khoản này?";
    
    if (!confirm(confirmMsg)) return;

    try {
      await userService.update(id, { status: newStatus });
      alert("Cập nhật trạng thái thành viên thành công!");
      fetchUsers(); // Tải lại danh sách sau khi update thành công
    } catch (error) {
      alert("Cập nhật thất bại!");
    }
  };

  // BỔ SUNG: Tính năng xóa thành viên kết nối trực tiếp với hàm destroy ở Back-end
  const handleDeleteUser = async (id, fullName) => {
    if (!confirm(`Bạn có chắc chắn muốn XÓA thành viên [${fullName}] không? Hành động này không thể hoàn tác.`)) return;
    
    try {
      await userService.delete(id); // Gọi đến route API Delete của Laravel
      alert("Xóa thành viên thành công!");
      fetchUsers();
    } catch (error) {
      alert("Xóa thành viên thất bại hoặc tài khoản không tồn tại!");
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-10">Đang tải danh sách thành viên...</div>;
  }

  return (
    <div className="space-y-6 p-2">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Customers</p>
        <h2 className="mt-2 text-3xl font-black uppercase text-white">Quản lý thành viên</h2>
      </div>

      <div className="admin-card rounded-3xl p-5 bg-[#161616] border border-[#222222]">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            className="w-full pl-10 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl py-2.5 text-sm text-white outline-none focus:border-orange-500" 
            placeholder="Tìm kiếm theo tên hoặc email thành viên..." 
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase text-slate-500 bg-[#1c1c1c]">
              <tr>
                <th className="p-3">Thành viên</th>
                <th className="p-3">Email</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    {/* FIX: Hiển thị đúng trường full_name */}
                    <td className="p-3 font-bold text-white">{u.full_name}</td>
                    <td className="p-3 font-mono">{u.email}</td>
                    <td className="p-3">
                      {/* FIX: So sánh trạng thái 'blocked' theo DB */}
                      <span className={`px-2 py-0.5 rounded text-xs ${u.status === 'blocked' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {u.status === 'blocked' ? 'Bị khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {/* Nút Khóa / Mở khóa tài khoản */}
                      <button 
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`p-2 rounded-xl transition-all ${u.status === 'blocked' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10'}`}
                        title={u.status === 'blocked' ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                      >
                        {u.status === 'blocked' ? <Unlock size={16}/> : <Lock size={16}/>}
                      </button>

                      {/* Nút Xóa tài khoản hoàn chỉnh */}
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.full_name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        title="Xóa thành viên"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    <Users className="mx-auto mb-2 opacity-30" size={24} /> Không tìm thấy thành viên nào.
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