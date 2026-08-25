<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminChatController extends Controller
{
    private function ensureTables(): ?JsonResponse
    {
        if (!Schema::hasTable('chat_conversations') || !Schema::hasTable('chat_messages')) {
            return response()->json([
                'success' => false,
                'message' => 'Hệ thống chat chưa được khởi tạo. Vui lòng chạy migration.',
            ], 503);
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        if ($error = $this->ensureTables()) {
            return $error;
        }

        $query = DB::table('chat_conversations as c')
            ->leftJoin('users as u', 'u.id', '=', 'c.user_id')
            ->select([
                'c.*',
                'u.name as customer_name',
                'u.email as customer_email',
                'u.phone as customer_phone',
            ]);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('c.status', $request->status);
        }

        $items = $query
            ->orderByRaw('c.last_message_at IS NULL')
            ->orderByDesc('c.last_message_at')
            ->orderByDesc('c.id')
            ->limit(min((int) $request->input('per_page', 200), 500))
            ->get()
            ->map(function ($item) {
                $item->unread_count = DB::table('chat_messages')
                    ->where('conversation_id', $item->id)
                    ->where('sender_role', 'customer')
                    ->whereNull('read_at')
                    ->count();

                $item->last_message = DB::table('chat_messages')
                    ->where('conversation_id', $item->id)
                    ->orderByDesc('id')
                    ->first();

                return $item;
            });

        return response()->json([
            'success' => true,
            'data' => [
                'conversations' => $items,
                'total' => $items->count(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        if ($error = $this->ensureTables()) {
            return $error;
        }

        $conversation = DB::table('chat_conversations as c')
            ->leftJoin('users as u', 'u.id', '=', 'c.user_id')
            ->where('c.id', $id)
            ->select(['c.*', 'u.name as customer_name', 'u.email as customer_email', 'u.phone as customer_phone'])
            ->first();

        if (!$conversation) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy cuộc trò chuyện.'], 404);
        }

        DB::table('chat_messages')
            ->where('conversation_id', $id)
            ->where('sender_role', 'customer')
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        $messages = DB::table('chat_messages')
            ->where('conversation_id', $id)
            ->orderBy('id')
            ->limit(1000)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => $conversation,
                'messages' => $messages,
            ],
        ]);
    }

    public function send(Request $request, int $id): JsonResponse
    {
        if ($error = $this->ensureTables()) {
            return $error;
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:4000'],
        ]);

        $conversation = DB::table('chat_conversations')->where('id', $id)->first();
        if (!$conversation) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy cuộc trò chuyện.'], 404);
        }

        $messageId = DB::transaction(function () use ($request, $id, $validated) {
            $messageId = DB::table('chat_messages')->insertGetId([
                'conversation_id' => $id,
                'sender_id' => $request->user()->id,
                'sender_role' => 'admin',
                'message' => trim($validated['message']),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('chat_conversations')->where('id', $id)->update([
                'assigned_admin_id' => $request->user()->id,
                'status' => 'open',
                'last_message_at' => now(),
                'updated_at' => now(),
            ]);

            return $messageId;
        });

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi phản hồi.',
            'data' => [
                'message' => DB::table('chat_messages')->where('id', $messageId)->first(),
            ],
        ], 201);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:open,closed'],
        ]);

        $updated = DB::table('chat_conversations')->where('id', $id)->update([
            'status' => $validated['status'],
            'assigned_admin_id' => $request->user()->id,
            'updated_at' => now(),
        ]);

        if (!$updated && !DB::table('chat_conversations')->where('id', $id)->exists()) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy cuộc trò chuyện.'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật trạng thái chat.',
            'data' => DB::table('chat_conversations')->where('id', $id)->first(),
        ]);
    }
}
