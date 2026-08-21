<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('settings')) {
            return;
        }

        Schema::table('settings', function (Blueprint $table) {
            if (!Schema::hasColumn('settings', 'bank_name')) {
                $table->string('bank_name', 120)->nullable();
            }
            if (!Schema::hasColumn('settings', 'bank_code')) {
                $table->string('bank_code', 40)->nullable();
            }
            if (!Schema::hasColumn('settings', 'bank_account_number')) {
                $table->string('bank_account_number', 80)->nullable();
            }
            if (!Schema::hasColumn('settings', 'bank_account_name')) {
                $table->string('bank_account_name', 180)->nullable();
            }
            if (!Schema::hasColumn('settings', 'bank_branch')) {
                $table->string('bank_branch', 180)->nullable();
            }
        });
    }

    public function down(): void
    {
        // Không xóa dữ liệu cấu hình ngân hàng khi rollback.
    }
};