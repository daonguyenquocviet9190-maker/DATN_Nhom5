<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
        } else {
            Schema::table('settings', function (Blueprint $table) {
                if (!Schema::hasColumn('settings', 'site_name')) $table->string('site_name', 160)->default('Dynova Sport');
                if (!Schema::hasColumn('settings', 'hotline')) $table->string('hotline', 40)->nullable();
                if (!Schema::hasColumn('settings', 'email')) $table->string('email', 160)->nullable();
                if (!Schema::hasColumn('settings', 'address')) $table->string('address', 500)->nullable();
                if (!Schema::hasColumn('settings', 'facebook')) $table->string('facebook', 600)->nullable();
                if (!Schema::hasColumn('settings', 'instagram')) $table->string('instagram', 600)->nullable();
                if (!Schema::hasColumn('settings', 'tiktok')) $table->string('tiktok', 600)->nullable();
                if (!Schema::hasColumn('settings', 'shipping_note')) $table->text('shipping_note')->nullable();
                if (!Schema::hasColumn('settings', 'return_policy')) $table->text('return_policy')->nullable();
                if (!Schema::hasColumn('settings', 'free_shipping_threshold')) $table->decimal('free_shipping_threshold', 14, 2)->default(500000);
                if (!Schema::hasColumn('settings', 'default_shipping_fee')) $table->decimal('default_shipping_fee', 14, 2)->default(30000);
                if (!Schema::hasColumn('settings', 'return_days')) $table->unsignedInteger('return_days')->default(30);
                if (!Schema::hasColumn('settings', 'currency')) $table->string('currency', 10)->default('VND');
                if (!Schema::hasColumn('settings', 'locale')) $table->string('locale', 20)->default('vi-VN');
                if (!Schema::hasColumn('settings', 'bank_name')) $table->string('bank_name', 120)->nullable();
                if (!Schema::hasColumn('settings', 'bank_code')) $table->string('bank_code', 40)->nullable();
                if (!Schema::hasColumn('settings', 'bank_account_number')) $table->string('bank_account_number', 80)->nullable();
                if (!Schema::hasColumn('settings', 'bank_account_name')) $table->string('bank_account_name', 180)->nullable();
                if (!Schema::hasColumn('settings', 'bank_branch')) $table->string('bank_branch', 180)->nullable();
                if (!Schema::hasColumn('settings', 'created_at')) $table->timestamp('created_at')->nullable();
                if (!Schema::hasColumn('settings', 'updated_at')) $table->timestamp('updated_at')->nullable();
            });
        }

        if (DB::table('settings')->count() === 0) {
            DB::table('settings')->insert([
                'site_name' => 'Dynova Sport',
                'hotline' => '0866 347 730',
                'email' => 'cskh@dynova.vn',
                'address' => 'TP. Hồ Chí Minh',
                'shipping_note' => 'Miễn phí giao hàng cho đơn từ 500K',
                'return_policy' => 'Đổi trả 30 ngày',
                'free_shipping_threshold' => 500000,
                'default_shipping_fee' => 30000,
                'return_days' => 30,
                'currency' => 'VND',
                'locale' => 'vi-VN',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Không xóa bảng settings để tránh mất cấu hình hiện có.
    }
};