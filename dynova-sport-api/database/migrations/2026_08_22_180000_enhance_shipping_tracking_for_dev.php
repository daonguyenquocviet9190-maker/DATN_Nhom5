<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('shipping_status_histories')) return;

        Schema::table('shipping_status_histories', function (Blueprint $table) {
            if (!Schema::hasColumn('shipping_status_histories', 'source')) {
                $table->string('source', 40)->nullable()->after('provider');
            }
            if (!Schema::hasColumn('shipping_status_histories', 'location')) {
                $table->string('location', 255)->nullable()->after('description');
            }
            if (!Schema::hasColumn('shipping_status_histories', 'is_simulated')) {
                $table->boolean('is_simulated')->default(false)->after('location');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('shipping_status_histories')) return;

        foreach (['source', 'location', 'is_simulated'] as $column) {
            if (Schema::hasColumn('shipping_status_histories', $column)) {
                Schema::table('shipping_status_histories', fn (Blueprint $table) => $table->dropColumn($column));
            }
        }
    }
};
