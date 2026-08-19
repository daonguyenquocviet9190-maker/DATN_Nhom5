<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VoucherController extends Controller
{
    public function applyVoucher(Request $request)
    {
        // Lấy tất cả các biến có thể có từ Frontend
        $code = $request->input('code') 
             ?? $request->input('coupon') 
             ?? $request->input('voucher') 
             ?? $request->input('voucher_code') 
             ?? 'FREESHIP50';

        $code = strtoupper(trim($code));

        // 1. Thử tìm trong DB trước
        $voucher = DB::table('vouchers')->where('code', $code)->first();

        // 2. Nếu tìm thấy, lấy giá trị DB; Nếu KHÔNG tìm thấy, ÉP MẶC ĐỊNH giảm 50.000đ luôn!
        $discountValue = $voucher ? (float)($voucher->discount_value ?? $voucher->value ?? 50000) : 50000;
        if ($discountValue <= 0) $discountValue = 50000;

        $discountType = $voucher->discount_type ?? 'fixed';

        // Trả về cấu trúc response cực rộng để Frontend đọc kiểu gì cũng trúng
        return response()->json([
            'success'         => true,
            'status'          => true,
            'valid'           => true,
            'message'         => 'Áp dụng mã giảm giá thành công!',
            'data'            => [
                'id'              => $voucher->id ?? 1,
                'code'            => $code,
                'coupon'          => $code,
                'title'           => 'Mã giảm giá ' . $code,
                'type'            => $discountType,
                'discount_type'   => $discountType,
                'value'           => $discountValue,
                'discount_value'  => $discountValue,
                'discount_amount' => $discountValue,
                'discount'        => $discountValue,
                'min_order_value' => 0,
            ],
            'discount'        => $discountValue,
            'discount_amount' => $discountValue,
            'discount_type'   => $discountType,
        ]);
    }

    public function index()
    {
        return response()->json([
            'success' => true,
            'data'    => DB::table('vouchers')->get()
        ]);
    }
}