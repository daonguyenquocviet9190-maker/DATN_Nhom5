'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, Ticket, ShieldCheck, Truck } from 'lucide-react';

export default function CartPage() {
    // 1. Khởi tạo State danh sách sản phẩm giả lập ban đầu trong giỏ hàng
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            name: 'Áo Thun Thể Thao Dynova Pro Dry',
            category: 'Áo',
            price: 350000,
            image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&q=80',
            size: 'M',
            color: 'Đen bản sắc',
            quantity: 1
        },
        {
            id: 3,
            name: 'Giày Chạy Bộ Dynova SpeedRun v1',
            category: 'Giày',
            price: 1250000,
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
            size: '41',
            color: 'Xám xi măng',
            quantity: 1
        }
    ]);

    // 2. State quản lý mã giảm giá
    const [couponCode, setCouponCode] = useState('');
    const [discountValue, setDiscountValue] = useState(0);
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');

    // Mốc miễn phí vận chuyển toàn quốc
    const FREE_SHIPPING_THRESHOLD = 799000;

    // 3. Hàm xử lý tăng/giảm số lượng sản phẩm trong giỏ
    const updateQuantity = (id, type) => {
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.id === id) {
                    const newQty = type === 'plus' ? item.quantity + 1 : item.quantity - 1;
                    return { ...item, quantity: newQty > 0 ? newQty : 1 };
                }
                return item;
            })
        );
    };

    // 4. Hàm xử lý xóa sản phẩm ra khỏi giỏ hàng
    const removeItem = (id) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    // 5. Hàm xử lý áp dụng mã giảm giá giả lập
    const handleApplyCoupon = (e) => {
        e.preventDefault();
        setCouponError('');
        setCouponSuccess('');

        if (couponCode.toUpperCase() === 'DYNOVANEW') {
            setDiscountValue(100000); // Giảm 100k
            setCouponSuccess('Áp dụng mã thành công! Bạn được giảm 100.000đ cho đơn hàng này.');
        } else if (couponCode.toUpperCase() === 'FREESHIP') {
            setDiscountValue(30000); // Giảm tương đương tiền ship
            setCouponSuccess('Áp dụng mã thành công! Giảm ngay 30.000đ phí vận chuyển.');
        } else if (!couponCode.trim()) {
            setCouponError('Vui lòng nhập mã giảm giá.');
        } else {
            setCouponError('Mã giảm giá không tồn tại hoặc đã hết hạn.');
            setDiscountValue(0);
        }
    };

    // 6. Tính toán các thông số tiền tệ tự động
    const subTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingFee = subTotal >= FREE_SHIPPING_THRESHOLD || subTotal === 0 ? 0 : 30000;
    const grandTotal = Math.max(0, subTotal + shippingFee - discountValue);
    const progressToFreeShip = Math.min(100, (subTotal / FREE_SHIPPING_THRESHOLD) * 100);

    return (
        <div className="bg-gray-50/60 min-h-screen py-10 px-4 md:px-12">
            <div className="container mx-auto max-w-7xl">

                {/* TIÊU ĐỀ TRANG */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <ShoppingBag className="text-orange-500" /> Giỏ hàng của bạn
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                        Quản lý các sản phẩm thể thao Dynova Sport bạn đã chọn
                    </p>
                </div>

                {cartItems.length === 0 ? (
                    /* TRẠNG THÁI GIỎ HÀNG TRỐNG */
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm max-w-2xl mx-auto space-y-6">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-500">
                            <ShoppingBag size={36} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-black text-slate-900 uppercase">Giỏ hàng đang trống!</h2>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                                Có vẻ như bạn chưa thêm bất kỳ sản phẩm nào vào giỏ hàng của mình. Hãy quay lại cửa hàng để chọn những sản phẩm ưng ý nhất nhé!
                            </p>
                        </div>
                        <Link href="/shop" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-colors shadow-md">
                            <ArrowLeft size={14} /> Quay lại cửa hàng mua sắm
                        </Link>
                    </div>
                ) : (
                    /* GIAO DIỆN CHÍNH KHI CÓ SẢN PHẨM */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM SẮP XẾP VÀ THANH PROGRESS BAR */}
                        <div className="lg:col-span-8 space-y-4">

                            {/* THANH THÔNG BÁO FREE SHIPPING ĐỘNG */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                    <Truck size={16} className="text-orange-500" />
                                    {subTotal >= FREE_SHIPPING_THRESHOLD ? (
                                        <span className="text-emerald-600">🎉 Tuyệt vời! Đơn hàng của bạn đã đủ điều kiện được <span className="font-black">MIỄN PHÍ VẬN CHUYỂN</span></span>
                                    ) : (
                                        <span>Mua thêm <span className="text-orange-500 font-black">{(FREE_SHIPPING_THRESHOLD - subTotal).toLocaleString('vi-VN')}đ</span> nữa để được Miễn phí vận chuyển toàn quốc</span>
                                    )}
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-orange-400 to-orange-500 h-full transition-all duration-500"
                                        style={{ width: `${progressToFreeShip}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* LƯỚI DANH SÁCH ITEM */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-gray-50/40">

                                        {/* Khối ảnh và thông tin thuộc tính */}
                                        <div className="flex gap-4 items-center flex-1">
                                            <div className="w-20 h-20 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 flex-shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase bg-orange-50 text-orange-600 px-2 py-0.5 rounded">{item.category}</span>
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide line-clamp-1">{item.name}</h3>
                                                <p className="text-xs text-gray-400 font-semibold">
                                                    Phân loại: <span className="text-gray-700">{item.color}</span> / Size: <span className="text-gray-700">{item.size}</span>
                                                </p>
                                                <p className="text-sm font-black text-orange-500 sm:hidden pt-1">
                                                    {item.price.toLocaleString('vi-VN')}đ
                                                </p>
                                            </div>
                                        </div>

                                        {/* Bộ tăng giảm số lượng số lượng */}
                                        <div className="flex sm:flex-col md:flex-row items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                                                <button
                                                    onClick={() => updateQuantity(item.id, 'minus')}
                                                    className="p-2.5 text-gray-500 hover:bg-gray-50 active:text-orange-500"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className="w-8 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 'plus')}
                                                    className="p-2.5 text-gray-500 hover:bg-gray-50 active:text-orange-500"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>

                                            {/* Hiển thị giá tiền thành phần trên Desktop */}
                                            <div className="text-right hidden sm:block min-w-[100px]">
                                                <p className="text-sm font-black text-slate-900">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                                                <p className="text-[10px] text-gray-400 font-bold">{item.price.toLocaleString('vi-VN')}đ / cái</p>
                                            </div>

                                            {/* Nút hủy bỏ item khỏi giỏ */}
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-2.5 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                                                title="Xóa sản phẩm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                    </div>
                                ))}
                            </div>

                            {/* NÚT QUAY LẠI TIẾP TỤC MUA SẮM */}
                            <Link href="/shop" className="inline-flex items-center gap-2 text-xs font-black uppercase text-gray-500 hover:text-orange-500 tracking-wider pt-2 transition-colors">
                                <ArrowLeft size={14} /> Tiếp tục tìm kiếm sản phẩm khác
                            </Link>
                        </div>

                        {/* CỘT PHẢI: ÁP MÃ GIẢM GIÁ & TÓM TẮT TÍNH TIỀN HÓA ĐƠN */}
                        <div className="lg:col-span-4 space-y-4">

                            {/* KHỐI NHẬP MÃ GIẢM GIÁ COUPON */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <Ticket size={14} className="text-orange-500" /> Mã giảm giá khuyến mãi
                                </h3>
                                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nhập VD: DYNOVANEW, FREESHIP"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-orange-500 font-bold uppercase placeholder:normal-case tracking-wider"
                                    />
                                    <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase px-4 rounded-xl tracking-wider transition-colors">
                                        Áp dụng
                                    </button>
                                </form>
                                {couponError && <p className="text-[11px] text-red-500 font-bold">{couponError}</p>}
                                {couponSuccess && <p className="text-[11px] text-emerald-600 font-bold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">{couponSuccess}</p>}
                            </div>

                            {/* KHỐI TÍNH TOÁN BẢNG HÓA ĐƠN CHI TIẾT */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                                    Tóm tắt đơn hàng
                                </h3>

                                <div className="space-y-2.5 text-xs font-bold text-gray-500">
                                    <div className="flex justify-between">
                                        <span>Tạm tính sản phẩm:</span>
                                        <span className="text-slate-900 font-extrabold">{subTotal.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Phí vận chuyển giao hàng:</span>
                                        <span className="text-slate-900 font-extrabold">
                                            {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}đ`}
                                        </span>
                                    </div>
                                    {discountValue > 0 && (
                                        <div className="flex justify-between text-red-500 bg-red-50/50 p-2 rounded-lg">
                                            <span>Khấu trừ giảm giá:</span>
                                            <span className="font-black">-{discountValue.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-baseline">
                                    <span className="text-sm font-black text-slate-950 uppercase tracking-wide">Tổng số tiền:</span>
                                    <span className="text-2xl font-black text-orange-500">{grandTotal.toLocaleString('vi-VN')}đ</span>
                                </div>

                                {/* Nút trigger tiến hành đặt hàng */}
                                <button
                                    onClick={() => alert(`🚀 Đơn hàng trị giá ${grandTotal.toLocaleString('vi-VN')}đ đang chuyển hướng sang cổng thanh toán của Dynova Sport!`)}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-colors shadow-md text-center block"
                                >
                                    Tiến hành thanh toán hóa đơn
                                </button>

                                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-bold pt-1 border-t border-gray-50">
                                    <ShieldCheck size={14} className="text-emerald-500" /> Hệ thống bảo mật thông tin đơn hàng 100%
                                </div>
                            </div>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}