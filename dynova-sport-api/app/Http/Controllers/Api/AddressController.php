<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = Address::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $addresses,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $this->validateAddress($request);

        $address = DB::transaction(function () use ($user, $validated) {
            $hasAddress = Address::query()
                ->where('user_id', $user->id)
                ->exists();

            $makeDefault = (bool) ($validated['is_default'] ?? false) || !$hasAddress;

            if ($makeDefault) {
                Address::query()
                    ->where('user_id', $user->id)
                    ->update(['is_default' => false]);
            }

            return Address::create([
                ...$validated,
                'user_id' => $user->id,
                'is_default' => $makeDefault,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Thêm địa chỉ thành công.',
            'data' => $address->fresh(),
        ], 201);
    }

    public function update(Request $request, Address $address)
    {
        $this->ensureOwner($request, $address);
        $validated = $this->validateAddress($request);

        $address = DB::transaction(function () use ($request, $address, $validated) {
            $wasDefault = (bool) $address->is_default;
            $makeDefault = (bool) ($validated['is_default'] ?? false);

            if ($makeDefault) {
                Address::query()
                    ->where('user_id', $request->user()->id)
                    ->where('id', '!=', $address->id)
                    ->update(['is_default' => false]);
            } elseif ($wasDefault) {
                // Một user luôn phải còn một địa chỉ mặc định nếu vẫn còn địa chỉ.
                $validated['is_default'] = true;
            }

            $address->fill($validated);
            $address->save();
            return $address;
        });

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật địa chỉ thành công.',
            'data' => $address->fresh(),
        ]);
    }

    public function destroy(Request $request, Address $address)
    {
        $this->ensureOwner($request, $address);

        DB::transaction(function () use ($request, $address) {
            $wasDefault = (bool) $address->is_default;
            $address->delete();

            if ($wasDefault) {
                $next = Address::query()
                    ->where('user_id', $request->user()->id)
                    ->latest('updated_at')
                    ->first();

                if ($next) {
                    $next->update(['is_default' => true]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa địa chỉ.',
        ]);
    }

    public function setDefault(Request $request, Address $address)
    {
        $this->ensureOwner($request, $address);

        DB::transaction(function () use ($request, $address) {
            Address::query()
                ->where('user_id', $request->user()->id)
                ->update(['is_default' => false]);

            $address->update(['is_default' => true]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Đã đặt làm địa chỉ mặc định.',
            'data' => $address->fresh(),
        ]);
    }

    private function validateAddress(Request $request): array
    {
        return $request->validate([
            'recipient_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^(0|\\+84)[0-9]{8,10}$/'],
            'province_code' => ['required', 'integer', 'min:1'],
            'province' => ['required', 'string', 'max:255'],
            'district_code' => ['required', 'integer', 'min:1'],
            'district' => ['required', 'string', 'max:255'],
            'ward_code' => ['required', 'string', 'max:50'],
            'ward' => ['required', 'string', 'max:255'],
            'address_line' => ['required', 'string', 'max:255'],
            'is_default' => ['sometimes', 'boolean'],
        ], [
            'recipient_name.required' => 'Vui lòng nhập tên người nhận.',
            'phone.required' => 'Vui lòng nhập số điện thoại.',
            'phone.regex' => 'Số điện thoại chưa đúng định dạng.',
            'province_code.required' => 'Vui lòng chọn tỉnh/thành phố.',
            'district_code.required' => 'Vui lòng chọn quận/huyện.',
            'ward_code.required' => 'Vui lòng chọn phường/xã.',
            'address_line.required' => 'Vui lòng nhập địa chỉ chi tiết.',
        ]);
    }

    private function ensureOwner(Request $request, Address $address): void
    {
        abort_unless((int) $address->user_id === (int) $request->user()->id, 404);
    }
}
