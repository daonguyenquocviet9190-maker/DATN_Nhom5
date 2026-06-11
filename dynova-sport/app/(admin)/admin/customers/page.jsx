'use client';
import React, { useState } from 'react';

export default function CustomersAdmin() {
  // 1. Giả lập danh sách khách hàng của hệ thống Dynova Sport
  const [customers, setCustomers] = useState([
    { id: 'CUST-001', name: 'Nguyễn Văn A', email: 'vana@gmail.com', phone: '0901234567', totalOrders: 12, totalSpent: 15450000, status: 'Hoạt động', avatar: '👨‍🦱' },
    { id: 'CUST-002', name: 'Lê Hoàng Nam', email: 'namle@gmail.com', phone: '0918765432', totalOrders: 5, totalSpent: 2150000, status: 'Hoạt động', avatar: '👦' },
    { id: 'CUST-003', name: 'Trần Thị Bích', email: 'bichtran@gmail.com', phone: '0933445566', totalOrders: 28, totalSpent: 42800000, status: 'Hoạt động', avatar: '👩' },
    { id: 'CUST-004', name: 'Phạm Minh Tuấn', email: 'tuanpham@gmail.com', phone: '0977889900', totalOrders: 0, totalSpent: 0, status: 'Bị khóa', avatar: '👨' },
    { id: 'CUST-005', name: 'Hoàng Thu Thảo', email: 'thaohoang@gmail.com', phone: '0981122334', totalOrders: 2, totalSpent: 850000, status: 'Hoạt động', avatar: '👩‍🦰' },
  ]);

  // 2. State quản lý Tìm kiếm và Bộ lọc trạng thái tài khoản
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  // 3. Hàm xử lý Khóa / Mở khóa tài khoản khách hàng nhanh
  const toggleStatus = (id) => {
    setCustomers(customers.map(cust => {
      if (cust.id === id) {
        const newStatus = cust.status === 'Hoạt động' ? 'Bị khóa' : 'Hoạt động';
        return { ...cust, status: newStatus };
      }
      return cust;
    }));
  };

  // 4. Bộ lọc danh sách khách hàng dựa trên dữ liệu nhập vào
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'Tất cả' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-white">
      {/* TIÊU ĐỀ TRANG & KHÁI QUÁT */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Quản lý khách hàng</h2>
          <p className="text-xs text-gray-500 mt-0.5">Quản lý thông tin tài khoản, lịch sử mua hàng và trạng thái thành viên</p>
        </div>
        <div className="bg-[#161616] border border-[#222222] px-4 py-2 rounded-xl text-xs text-gray-400">
          Tổng thành viên: <span className="text-orange-500 font-bold text-sm ml-1">{customers.length}</span>
        </div>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC TRẠNG THÁI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#161616] border border-[#222222] p-4 rounded-2xl">
        {/* Nhập ô tìm kiếm */}
        <div className="relative md:col-span-2">
          <input
            type="text"
            placeholder="Tìm theo tên, email hoặc số điện thoại khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder-gray-500 text-white"
          />
        </div>
        
        {/* Bộ lọc trạng thái tài khoản */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white cursor-pointer"
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="Hoạt động">Đang hoạt động</option>
            <option value="Bị khóa">Đang bị khóa</option>
          </select>
        </div>
      </div>

      {/* BẢNG DANH SÁCH KHÁCH HÀNG */}
      <div className="bg-[#161616] border border-[#222222] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-[#1c1c1c] text-gray-500 font-bold">
              <tr>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Mã số</th>
                <th className="p-4">Liên hệ</th>
                <th className="p-4 text-center">Đơn mua</th>
                <th className="p-4">Tổng chi tiêu</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#1c1c1c]/40 transition-colors">
                    {/* Cột thông tin cá nhân đại diện */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#222222] rounded-full flex items-center justify-center text-lg border border-[#2d2d2d]">
                          {customer.avatar}
                        </div>
                        <div>
                          <p className="text-white font-medium">{customer.name}</p>
                          <span className="text-[11px] text-gray-500">{customer.email}</span>
                        </div>
                      </div>
                    </td>
                    {/* Mã khách hàng */}
                    <td className="p-4 font-semibold text-xs text-gray-500">{customer.id}</td>
                    {/* Số điện thoại */}
                    <td className="p-4 text-gray-300 text-xs">{customer.phone}</td>
                    {/* Số đơn hàng đã đặt */}
                    <td className="p-4 text-center text-white font-medium">{customer.totalOrders} đơn</td>
                    {/* Số tiền tích lũy định dạng tiền Việt Nam */}
                    <td className="p-4 text-orange-400 font-semibold">
                      {customer.totalSpent.toLocaleString('vi-VN')}đ
                    </td>
                    {/* Nhãn trạng thái */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        customer.status === 'Hoạt động' ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    {/* Nút thao tác chặn / bỏ chặn nhanh */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleStatus(customer.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          customer.status === 'Hoạt động' 
                            ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' 
                            : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {customer.status === 'Hoạt động' ? '🔒 Khóa nick' : '🔓 Mở khóa'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                /* Thông báo khi không tìm thấy kết quả */
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    🔍 Không tìm thấy thành viên nào khớp với từ khóa tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER BẢNG PHÂN TRANG */}
        <div className="p-4 bg-[#1c1c1c] border-t border-[#222222] flex justify-between items-center text-xs text-gray-500">
          <p>Hiển thị {filteredCustomers.length} trên tổng số {customers.length} thành viên</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 bg-[#222222] rounded hover:text-white transition-colors" disabled>Trước</button>
            <button className="px-3 py-1 bg-orange-500 text-white rounded font-bold">1</button>
            <button className="px-3 py-1 bg-[#222222] rounded hover:text-white transition-colors" disabled>Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}