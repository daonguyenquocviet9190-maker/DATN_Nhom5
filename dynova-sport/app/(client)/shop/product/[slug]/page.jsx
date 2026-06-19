'use client';
import React, { useState, use } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, CheckCircle, ArrowLeft, Star, Heart, User, Calendar, MessageSquare } from 'lucide-react';

// Mảng dữ liệu gốc đồng bộ với trang danh sách của bạn
const DUMMY_PRODUCTS = [
    { id: 1, name: 'Áo Thun Thể Thao Dynova Pro Dry', category: 'Áo', price: 350000, oldPrice: 450000, image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&q=80', isNew: true },
    { id: 2, name: 'Quần Short Tập Gym Ultra-Light', category: 'Quần', price: 280000, image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80', tag: '-15%' },
    { id: 3, name: 'Giày Chạy Bộ Dynova SpeedRun v1', category: 'Giày', price: 1250000, oldPrice: 1500000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', isNew: false },
    { id: 4, name: 'Balo Thể Thao Chống Nước Pro', category: 'Phụ kiện', price: 450000, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80' },
    { id: 5, name: 'Áo Khoác Gió Thể Thao WindBreaker', category: 'Áo', price: 590000, image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&q=80' },
    { id: 6, name: 'Dép Clog Thể Thao Recovery Soft', category: 'Dép', price: 190000, oldPrice: 250000, image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&q=80' },
    { id: 7, name: 'Quần Dài Thể Thao Jogger Premium', category: 'Quần', price: 420000, image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=500&q=80', isNew: true },
    { id: 8, name: 'Bình Nước Giữ Nhiệt Dynova 1L', category: 'Phụ kiện', price: 220000, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80' }
];

export default function ProductDetailPage({ params }) {
    // Giải nén params theo chuẩn Next.js 15
    const resolvedParams = use(params);
    const { slug } = resolvedParams;

    // Tìm sản phẩm hiện tại
    const currentProduct = DUMMY_PRODUCTS.find(p => p.id === Number(slug)) || DUMMY_PRODUCTS[0];

    // 1. Quản lý State thuộc tính sản phẩm
    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedColor, setSelectedColor] = useState('Đen bản sắc');
    const [quantity, setQuantity] = useState(1);
    const [isWishlist, setIsWishlist] = useState(false);
    const [mainImage, setMainImage] = useState(currentProduct.image);
    const [activeTab, setActiveTab] = useState('mota');

    // 2. State Giỏ hàng giả lập (Hiện thông báo trực quan)
    const [cartAlert, setCartAlert] = useState(null);

    // 3. State Hệ thống Đánh giá thực tế (Interactive Review)
    const [reviews, setReviews] = useState([
        { id: 1, name: 'Nguyễn Văn Hùng', rating: 5, date: '12/06/2026', content: 'Vải mặc cực kì mát, thấm hút mồ hôi tốt khi chạy bộ. Form áo tôn dáng thể thao, rất đáng tiền!' },
        { id: 2, name: 'Trần Minh Tâm', rating: 4, date: '05/06/2026', content: 'Giao hàng nhanh, đóng gói hộp Dynova rất đẹp chỉn chu. Sản phẩm đúng như mô tả.' }
    ]);
    const [newReviewName, setNewReviewName] = useState('');
    const [newReviewContent, setNewReviewContent] = useState('');
    const [newReviewRating, setNewReviewRating] = useState(5);
    const [reviewError, setReviewError] = useState('');

    // Tự động sinh danh sách ảnh phụ từ ảnh gốc
    const productImages = [
        currentProduct.image,
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80'
    ];

    // Lọc sản phẩm liên quan (cùng Category ngoại trừ sản phẩm hiện tại)
    const relatedProducts = DUMMY_PRODUCTS
        .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
        .slice(0, 4);

    // Xử lý tăng giảm số lượng
    const handleQuantityChange = (type) => {
        if (type === 'plus') setQuantity(prev => prev + 1);
        if (type === 'minus' && quantity > 1) setQuantity(prev => prev - 1);
    };

    // Xử lý Thêm vào giỏ hàng / Mua ngay
    const handleAddToCart = (isBuyNow = false) => {
        const totalPrice = currentProduct.price * quantity;
        setCartAlert({
            type: isBuyNow ? 'success_buy' : 'success_cart',
            message: isBuyNow
                ? `⚡ Tiến hành thanh toán đơn hàng: ${quantity}x ${currentProduct.name} - Tổng: ${totalPrice.toLocaleString('vi-VN')}đ`
                : `🛒 Đã thêm thành công ${quantity} sản phẩm vào giỏ hàng Dynova của bạn!`
        });
        // Tự động tắt thông báo sau 4 giây
        setTimeout(() => setCartAlert(null), 4000);
    };

    // Xử lý gửi đánh giá mới
    const handleAddReview = (e) => {
        e.preventDefault();
        if (!newReviewName.trim() || !newReviewContent.trim()) {
            setReviewError('Vui lòng nhập đầy đủ tên và nội dung đánh giá của bạn.');
            return;
        }

        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

        const item = {
            id: Date.now(),
            name: newReviewName,
            rating: newReviewRating,
            date: formattedDate,
            content: newReviewContent
        };

        setReviews([item, ...reviews]);
        setNewReviewName('');
        setNewReviewContent('');
        setNewReviewRating(5);
        setReviewError('');
    };

    return (
        <div className="space-y-12 pb-24 pt-6 bg-gray-50/50 min-h-screen relative">

            {/* THÔNG BÁO POPUP GIỎ HÀNG TOAST */}
            {cartAlert && (
                <div className="fixed top-5 right-5 z-50 max-w-md bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-orange-500 flex flex-col gap-2 transition-all duration-300 animate-bounce">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                        <p className="text-xs font-black uppercase tracking-wider text-orange-400">Hệ thống Dynova Sport</p>
                    </div>
                    <p className="text-sm font-semibold">{cartAlert.message}</p>
                </div>
            )}

            {/* 1. BREADCRUMB */}
            <nav className="container mx-auto px-4 max-w-7xl">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <Link href="/shop" className="hover:text-orange-500 transition-colors flex items-center gap-1">
                        <ArrowLeft size={12} /> Cửa hàng
                    </Link>
                    <span>/</span>
                    <span className="text-gray-400">{currentProduct.category}</span>
                    <span>/</span>
                    <span className="text-gray-800 line-clamp-1">{currentProduct.name}</span>
                </div>
            </nav>

            {/* 2. CHI TIẾT SẢN PHẨM CHÍNH */}
            <main className="container mx-auto px-4 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white p-6 md:p-10 rounded-3xl border border-gray-100 shadow-sm">

                    {/* Cột trái: Gallery Ảnh */}
                    <div className="lg:col-span-6 space-y-4">
                        <div className="overflow-hidden rounded-2xl border border-gray-50 bg-gray-50 flex items-center justify-center h-[520px] relative group">
                            <img src={mainImage} alt={currentProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            {currentProduct.isNew && (
                                <span className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow">New</span>
                            )}
                        </div>
                        <div className="flex gap-4 justify-center">
                            {productImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setMainImage(img)}
                                    onMouseEnter={() => setMainImage(img)}
                                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-white transition-all ${mainImage === img ? 'border-orange-500 scale-105 shadow-md' : 'border-gray-100 opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cột phải: Form đặt mua tương tác */}
                    <div className="lg:col-span-6 space-y-6 flex flex-col justify-between py-2">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start gap-4">
                                <p className="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-md w-fit">{currentProduct.category} chuyên dụng</p>
                                <button
                                    onClick={() => setIsWishlist(!isWishlist)}
                                    className={`p-2.5 rounded-full border transition-colors ${isWishlist ? 'bg-red-50 border-red-200 text-red-500' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-red-500'}`}
                                    title="Thêm vào danh sách yêu thích"
                                >
                                    <Heart size={18} className={isWishlist ? 'fill-current' : ''} />
                                </button>
                            </div>
                            <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-wide leading-snug">{currentProduct.name}</h1>

                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                <div className="flex text-amber-400 gap-0.5">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                                </div>
                                <span>({reviews.length} đánh giá thực tế)</span>
                            </div>
                        </div>

                        {/* Bảng giá */}
                        <div className="flex items-baseline gap-4 bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100 w-full">
                            <span className="text-3xl font-black text-orange-500">{currentProduct.price.toLocaleString('vi-VN')}đ</span>
                            {currentProduct.oldPrice && (
                                <>
                                    <span className="text-sm font-bold text-gray-400 line-through">{currentProduct.oldPrice.toLocaleString('vi-VN')}đ</span>
                                    <span className="text-xs font-black text-red-500 bg-red-50 px-2 py-0.5 rounded">-{Math.round(((currentProduct.oldPrice - currentProduct.price) / currentProduct.oldPrice) * 100)}%</span>
                                </>
                            )}
                        </div>

                        {/* Chọn Màu Sắc */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Màu sắc phối: <span className="text-orange-500">{selectedColor}</span></h3>
                            <div className="flex gap-2">
                                {['Đen bản sắc', 'Trắng tinh khôi', 'Xám xi măng'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${selectedColor === color ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-extrabold shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chọn Kích Thước */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Kích thước (Size):</h3>
                            <div className="flex gap-2">
                                {['S', 'M', 'L', 'XL'].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`w-12 h-12 flex items-center justify-center text-xs font-black rounded-xl border transition-all ${selectedSize === size ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105' : 'bg-white border-gray-200 text-gray-700 hover:border-orange-500 hover:text-orange-500'}`}
                                    >
                                        {size}
                                    </button>
                                ))}
                                {/* Size hết hàng giả lập */}
                                <button disabled className="w-12 h-12 flex items-center justify-center text-xs font-bold rounded-xl border border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed">XXL</button>
                            </div>
                        </div>

                        {/* Số lượng & Nút Mua */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Số lượng:</span>
                                <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                                    <button onClick={() => handleQuantityChange('minus')} className="p-3 text-gray-500 hover:bg-gray-50 active:text-orange-500"><Minus size={12} /></button>
                                    <span className="w-10 text-center text-xs font-black text-slate-900">{quantity}</span>
                                    <button onClick={() => handleQuantityChange('plus')} className="p-3 text-gray-500 hover:bg-gray-50 active:text-orange-500"><Plus size={12} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button onClick={() => handleAddToCart(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-md active:scale-[0.99]">
                                    Mua ngay
                                </button>
                                <button onClick={() => handleAddToCart(false)} className="border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99]">
                                    <ShoppingBag size={14} /> Thêm vào giỏ hàng
                                </button>
                            </div>
                        </div>

                        {/* Cam kết thương hiệu */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 text-[11px] font-bold text-gray-500">
                            <div className="flex items-center gap-1.5 text-emerald-600"><CheckCircle size={14} /> Giao hàng hỏa tốc 2h</div>
                            <div className="flex items-center gap-1.5 text-slate-800"><CheckCircle size={14} /> Đổi trả 30 ngày tận nơi</div>
                        </div>
                    </div>

                </div>
            </main>

            {/* 3. TABS CHI TIẾT & HỆ THỐNG ĐÁNH GIÁ (INTERACTIVE) */}
            <section className="container mx-auto px-4 max-w-7xl bg-white py-8 px-6 md:px-10 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex gap-6 border-b border-gray-200 text-xs font-black uppercase tracking-wider mb-8 overflow-x-auto">
                    <button onClick={() => setActiveTab('mota')} className={`pb-4 border-b-2 transition-all whitespace-nowrap ${activeTab === 'mota' ? 'border-orange-500 text-orange-500 font-black' : 'border-transparent text-gray-400'}`}>Mô tả chi tiết</button>
                    <button onClick={() => setActiveTab('danhgia')} className={`pb-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'danhgia' ? 'border-orange-500 text-orange-500 font-black' : 'border-transparent text-gray-400'}`}>
                        Đánh giá từ khách hàng ({reviews.length})
                    </button>
                </div>

                {/* NỘI DUNG TAB: MÔ TẢ */}
                {activeTab === 'mota' && (
                    <div className="space-y-6 text-sm text-gray-600 max-w-4xl leading-relaxed font-normal">
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Trải nghiệm đỉnh cao cùng {currentProduct.name}</h3>
                        <p>Dòng sản phẩm thể thao Dynova Pro chuyên biệt được tích hợp công nghệ dệt liên kết thế hệ mới, tối ưu hóa khả năng thoát khí tại các vùng tích tụ nhiệt lớn trên cơ thể. Sợi vải mang đặc tính siêu nhẹ, co giãn 4 chiều hoàn hảo, giảm thiểu ma sát tối đa lên bề mặt da khi vận động liên tục.</p>
                        <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs font-semibold text-slate-700 border border-gray-100">
                            <p>• <span className="text-gray-400">Thương hiệu:</span> Dynova Sport Việt Nam</p>
                            <p>• <span className="text-gray-400">Chất liệu:</span> 85% Polyester Cao Cấp, 15% Spandex co giãn</p>
                            <p>• <span className="text-gray-400">Ứng dụng:</span> Chạy bộ, Training phòng Gym, Cầu lông, Bóng đá, Đời sống thường nhật</p>
                        </div>
                    </div>
                )}

                {/* NỘI DUNG TAB: ĐÁNH GIÁ CÓ INTERACTIVE FORM */}
                {activeTab === 'danhgia' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                        {/* Form viết đánh giá mới */}
                        <div className="lg:col-span-5 bg-gray-50/70 p-6 rounded-2xl border border-gray-100 space-y-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1"><MessageSquare size={14} /> Gửi đánh giá của bạn</h3>

                            <form onSubmit={handleAddReview} className="space-y-3.5">
                                <div>
                                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Họ và tên của bạn</label>
                                    <input
                                        type="text"
                                        value={newReviewName}
                                        onChange={(e) => setNewReviewName(e.target.value)}
                                        placeholder="VD: Nguyễn Văn A..."
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-orange-500 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Chọn mức độ hài lòng</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                type="button"
                                                key={star}
                                                onClick={() => setNewReviewRating(star)}
                                                className={`transition-transform active:scale-110 ${star <= newReviewRating ? 'text-amber-400' : 'text-gray-200'}`}
                                            >
                                                <Star size={20} className="fill-current" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Nội dung bình luận</label>
                                    <textarea
                                        rows="3"
                                        value={newReviewContent}
                                        onChange={(e) => setNewReviewContent(e.target.value)}
                                        placeholder="Chia sẻ trải nghiệm chân thực của bạn về form dáng, chất liệu sản phẩm..."
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-orange-500 font-medium"
                                    ></textarea>
                                </div>

                                {reviewError && <p className="text-[11px] text-red-500 font-bold">{reviewError}</p>}

                                <button type="submit" className="w-full bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest py-3 rounded-xl hover:bg-slate-800 transition-colors">
                                    Gửi đánh giá lên hệ thống
                                </button>
                            </form>
                        </div>

                        {/* Danh sách hiển thị các đánh giá */}
                        <div className="lg:col-span-7 space-y-4 max-h-[450px] overflow-y-auto pr-2">
                            {reviews.map((rev) => (
                                <div key={rev.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><User size={12} /></div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-800">{rev.name}</h4>
                                                <div className="flex text-amber-400 gap-0.5">
                                                    {[...Array(rev.rating)].map((_, i) => <Star key={i} size={10} className="fill-current" />)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold"><Calendar size={10} /> {rev.date}</div>
                                    </div>
                                    <p className="text-xs text-gray-600 pl-9 font-normal leading-relaxed">{rev.content}</p>
                                </div>
                            ))}
                        </div>

                    </div>
                )}
            </section>

            {/* 4. GỢI Ý SẢN PHẨM LIÊN QUAN ĐỘNG (Dựa theo cùng Danh mục) */}
            {relatedProducts.length > 0 && (
                <section className="container mx-auto px-4 max-w-7xl space-y-6">
                    <div className="flex justify-between items-end border-b border-gray-200 pb-3">
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Sản phẩm liên quan bạn có thể thích</h2>
                        <Link href="/shop" className="text-xs font-black text-orange-500 hover:underline">Xem tất cả</Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {relatedProducts.map(prod => (
                            <Link
                                key={prod.id}
                                href={`/shop/product/${prod.id}`}
                                className="bg-white border border-gray-100 rounded-2xl p-3 space-y-3 relative shadow-sm hover:shadow-md transition-shadow group cursor-pointer block"
                            >
                                <div className="overflow-hidden rounded-xl bg-gray-50 h-44 flex items-center justify-center">
                                    <img src={prod.image} alt={prod.name} className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{prod.category}</p>
                                    <h3 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[32px] group-hover:text-orange-500 transition-colors">{prod.name}</h3>
                                    <p className="text-xs font-black text-slate-900 pt-1">{prod.price.toLocaleString('vi-VN')}đ</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

        </div>
    );
}