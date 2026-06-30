'use client';

import { useEffect, useState } from "react";
import { Lock, Search, ShieldCheck, Unlock, Users, Trash2 } from "lucide-react";
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

  const filteredUsers = users.filter((u) => {
    const name = u.name || "";
    const email = u.email || "";
    return name.toLowerCase().includes(query.toLowerCase()) || email.toLowerCase().includes(query.toLowerCase());
  });

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Hoạt động" ? "Bị khóa" : "Hoạt động";
    try {
      await userService.update(id, { status: newStatus });
      alert("Cập nhật trạng thái thành viên thành công!");
      fetchUsers();
    } catch (error) {
      alert("Cập nhật thất bại!");
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
                    <td className="p-3 font-bold text-white">{u.name}</td>
                    <td className="p-3 font-mono">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${u.status === 'Bị khóa' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {u.status || 'Hoạt động'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`p-2 rounded-xl transition-all ${u.status === 'Bị khóa' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10'}`}
                      >
                        {u.status === 'Bị khóa' ? <Unlock size={16}/> : <Lock size={16}/>}
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