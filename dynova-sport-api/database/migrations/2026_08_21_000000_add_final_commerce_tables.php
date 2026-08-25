<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'stock_deducted_at')) {
                    $table->timestamp('stock_deducted_at')->nullable()->after('status');
                }
                if (!Schema::hasColumn('orders', 'stock_restored_at')) {
                    $table->timestamp('stock_restored_at')->nullable()->after('stock_deducted_at');
                }
                if (!Schema::hasColumn('orders', 'cancelled_at')) {
                    $table->timestamp('cancelled_at')->nullable()->after('stock_restored_at');
                }
                if (!Schema::hasColumn('orders', 'completed_at')) {
                    $table->timestamp('completed_at')->nullable()->after('cancelled_at');
                }
                if (!Schema::hasColumn('orders', 'shipping_provider')) {
                    $table->string('shipping_provider', 40)->nullable()->after('shipping_fee');
                }
                if (!Schema::hasColumn('orders', 'tracking_code')) {
                    $table->string('tracking_code', 120)->nullable()->after('shipping_provider');
                }
            });
        }

        if (Schema::hasTable('vouchers')) {
            Schema::table('vouchers', function (Blueprint $table) {
                if (!Schema::hasColumn('vouchers', 'per_user_limit')) {
                    $table->unsignedInteger('per_user_limit')->nullable()->after('usage_limit');
                }
            });
        }

        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                if (!Schema::hasColumn('reviews', 'order_item_id')) {
                    $table->unsignedBigInteger('order_item_id')->nullable()->after('order_id')->index();
                }
            });
        }

        if (!Schema::hasTable('voucher_usages')) {
            Schema::create('voucher_usages', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('voucher_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('order_id')->nullable();
                $table->decimal('discount_amount', 14, 2)->default(0);
                $table->enum('status', ['used', 'cancelled'])->default('used');
                $table->timestamps();
                $table->index(['voucher_id', 'user_id']);
                $table->index('order_id');
            });
        }

        if (!Schema::hasTable('payment_transactions')) {
            Schema::create('payment_transactions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id');
                $table->string('provider', 30);
                $table->string('transaction_ref', 120)->unique();
                $table->string('provider_transaction_no', 120)->nullable();
                $table->decimal('amount', 14, 2);
                $table->enum('status', ['pending', 'paid', 'failed', 'cancelled', 'refunded'])->default('pending');
                $table->json('request_payload')->nullable();
                $table->json('response_payload')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->timestamps();
                $table->index(['order_id', 'provider']);
            });
        }

        if (!Schema::hasTable('order_status_histories')) {
            Schema::create('order_status_histories', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id');
                $table->unsignedBigInteger('changed_by')->nullable();
                $table->string('from_status', 40)->nullable();
                $table->string('to_status', 40);
                $table->string('source', 30)->default('system');
                $table->text('note')->nullable();
                $table->timestamps();
                $table->index(['order_id', 'created_at']);
            });
        }

        if (!Schema::hasTable('settings')) {
            Schema::create('settings', function (Blueprint $table) {
                $table->id();
                $table->string('site_name', 160)->default('Dynova Sport');
                $table->string('hotline', 40)->nullable();
                $table->string('email', 160)->nullable();
                $table->string('address', 500)->nullable();
                $table->string('logo', 600)->nullable();
                $table->string('facebook', 600)->nullable();
                $table->string('instagram', 600)->nullable();
                $table->string('tiktok', 600)->nullable();
                $table->text('shipping_note')->nullable();
                $table->text('return_policy')->nullable();
                $table->decimal('free_shipping_threshold', 14, 2)->default(500000);
                $table->decimal('default_shipping_fee', 14, 2)->default(30000);
                $table->unsignedInteger('return_days')->default(30);
                $table->string('currency', 10)->default('VND');
                $table->string('locale', 20)->default('vi-VN');
                $table->string('bank_name', 120)->nullable();
                $table->string('bank_code', 40)->nullable();
                $table->string('bank_account_number', 80)->nullable();
                $table->string('bank_account_name', 180)->nullable();
                $table->string('bank_branch', 180)->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('contact_messages')) {
            Schema::create('contact_messages', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('name', 150);
                $table->string('email', 150)->nullable();
                $table->string('phone', 30)->nullable();
                $table->string('subject', 220)->nullable();
                $table->text('message');
                $table->enum('status', ['new', 'in_progress', 'resolved'])->default('new');
                $table->text('admin_note')->nullable();
                $table->timestamps();
                $table->index(['status', 'created_at']);
            });
        }

        if (!Schema::hasTable('chat_conversations')) {
            Schema::create('chat_conversations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('assigned_admin_id')->nullable();
                $table->enum('status', ['open', 'closed'])->default('open');
                $table->timestamp('last_message_at')->nullable();
                $table->timestamps();
                $table->unique('user_id');
                $table->index(['status', 'last_message_at']);
            });
        }

        if (!Schema::hasTable('chat_messages')) {
            Schema::create('chat_messages', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('conversation_id');
                $table->unsignedBigInteger('sender_id');
                $table->enum('sender_role', ['customer', 'admin']);
                $table->text('message');
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
                $table->index(['conversation_id', 'created_at']);
            });
        }

        if (!Schema::hasTable('banners')) {
            Schema::create('banners', function (Blueprint $table) {
                $table->id();
                $table->string('title', 220)->nullable();
                $table->string('subtitle', 220)->nullable();
                $table->text('description')->nullable();
                $table->string('image_url', 600)->nullable();
                $table->string('cta_text', 120)->nullable();
                $table->string('cta_link', 600)->nullable();
                $table->string('secondary_text', 120)->nullable();
                $table->string('secondary_link', 600)->nullable();
                $table->string('position', 80)->default('home_hero');
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->dateTime('start_at')->nullable();
                $table->dateTime('end_at')->nullable();
                $table->timestamps();
                $table->index(['position', 'is_active', 'sort_order']);
            });
        }
    }

    public function down(): void
    {
        foreach (['chat_messages', 'chat_conversations', 'contact_messages', 'order_status_histories', 'payment_transactions', 'voucher_usages'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
