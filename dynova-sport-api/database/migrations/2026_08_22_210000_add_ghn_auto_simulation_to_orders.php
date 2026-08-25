<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'ghn_simulation_status')) {
                $table->string('ghn_simulation_status', 20)->nullable();
            }

            if (!Schema::hasColumn('orders', 'ghn_simulation_started_at')) {
                $table->timestamp('ghn_simulation_started_at')->nullable();
            }

            if (!Schema::hasColumn('orders', 'ghn_simulation_paused_at')) {
                $table->timestamp('ghn_simulation_paused_at')->nullable();
            }

            if (!Schema::hasColumn('orders', 'ghn_simulation_elapsed_seconds')) {
                $table->decimal('ghn_simulation_elapsed_seconds', 10, 2)->default(0);
            }

            if (!Schema::hasColumn('orders', 'ghn_simulation_duration_seconds')) {
                $table->unsignedInteger('ghn_simulation_duration_seconds')->default(240);
            }

            if (!Schema::hasColumn('orders', 'ghn_simulation_speed')) {
                $table->decimal('ghn_simulation_speed', 4, 2)->default(1);
            }

            if (!Schema::hasColumn('orders', 'ghn_simulation_progress')) {
                $table->decimal('ghn_simulation_progress', 5, 2)->default(0);
            }

            if (!Schema::hasColumn('orders', 'ghn_simulation_updated_at')) {
                $table->timestamp('ghn_simulation_updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        $columns = [
            'ghn_simulation_status',
            'ghn_simulation_started_at',
            'ghn_simulation_paused_at',
            'ghn_simulation_elapsed_seconds',
            'ghn_simulation_duration_seconds',
            'ghn_simulation_speed',
            'ghn_simulation_progress',
            'ghn_simulation_updated_at',
        ];

        Schema::table('orders', function (Blueprint $table) use ($columns) {
            foreach ($columns as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
