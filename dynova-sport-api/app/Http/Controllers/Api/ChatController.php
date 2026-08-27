<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ChatController extends Controller
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

    private function getOrCreateConversation(int $userId): object
    {
        $conversation = DB::table('chat_conversations')
            ->where('user_id', $userId)
            ->first();

        if ($conversation) {
            return $conversation;
        }

        $id = DB::table('chat_conversations')->insertGetId([
            'user_id' => $userId,
            'assigned_admin_id' => null,
            'status' => 'open',
            'last_message_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('chat_conversations')->where('id', $id)->first();
    }

    private function payload(object $conversation): array
    {
        $messages = DB::table('chat_messages')
            ->where('conversation_id', $conversation->id)
            ->orderBy('id')
            ->limit(500)
            ->get();

        return [
            'conversation' => $conversation,
            'messages' => $messages,
        ];
    }

    public function show(Request $request): JsonResponse
    {
        if ($error = $this->ensureTables()) {
            return $error;
        }

        $conversation = $this->getOrCreateConversation((int) $request->user()->id);

        DB::table('chat_messages')
            ->where('conversation_id', $conversation->id)
            ->where('sender_role', 'admin')
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        return response()->json([
            'success' => true,
            'data' => $this->payload($conversation),
        ]);
    }

    public function send(Request $request): JsonResponse
    {
        if ($error = $this->ensureTables()) {
            return $error;
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:4000'],
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $conversation = $this->getOrCreateConversation((int) $request->user()->id);

            if (($conversation->status ?? 'open') === 'closed') {
                DB::table('chat_conversations')
                    ->where('id', $conversation->id)
                    ->update([
                        'status' => 'open',
                        'updated_at' => now(),
                    ]);
            }

            $messageId = DB::table('chat_messages')->insertGetId([
                'conversation_id' => $conversation->id,
                'sender_id' => $request->user()->id,
                'sender_role' => 'customer',
                'message' => trim($validated['message']),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('chat_conversations')
                ->where('id', $conversation->id)
                ->update([
                    'last_message_at' => now(),
                    'updated_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Đã gửi tin nhắn.',
                'data' => [
                    'message' => DB::table('chat_messages')->where('id', $messageId)->first(),
                ],
            ], 201);
        });
    }
}
