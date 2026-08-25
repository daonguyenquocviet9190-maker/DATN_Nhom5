<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if (!Schema::hasTable('contact_messages')) {
            return response()->json([
                'success' => false,
                'message' => 'Hệ thống liên hệ chưa được khởi tạo. Vui lòng chạy migration.',
            ], 503);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'subject' => ['nullable', 'string', 'max:220'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        $id = DB::table('contact_messages')->insertGetId([
            'user_id' => $request->user()?->id,
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'subject' => $validated['subject'] ?? null,
            'message' => $validated['message'],
            'status' => 'new',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dynova đã nhận được nội dung liên hệ của bạn.',
            'data' => [
                'id' => $id,
            ],
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $query = DB::table('contact_messages')->orderByDesc('id');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $items = $query->limit(min((int) $request->input('per_page', 100), 300))->get();

        return response()->json([
            'success' => true,
            'data' => [
                'messages' => $items,
                'total' => $items->count(),
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:new,in_progress,resolved'],
            'admin_note' => ['nullable', 'string', 'max:5000'],
        ]);

        $payload = array_filter([
            'status' => $validated['status'] ?? null,
            'admin_note' => array_key_exists('admin_note', $validated) ? $validated['admin_note'] : null,
        ], static fn ($value) => $value !== null);
        $payload['updated_at'] = now();

        $updated = DB::table('contact_messages')->where('id', $id)->update($payload);

        if (!$updated && !DB::table('contact_messages')->where('id', $id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy nội dung liên hệ.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật liên hệ.',
            'data' => DB::table('contact_messages')->where('id', $id)->first(),
        ]);
    }
}
