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
            if (!Schema::hasColumn('orders', 'cod_collected_amount')) {
                $table->decimal('cod_collected_amount', 14, 2)->nullable();
            }
            if (!Schema::hasColumn('orders', 'cod_collection_method')) {
                $table->string('cod_collection_method', 40)->nullable();
            }
            if (!Schema::hasColumn('orders', 'cod_collected_at')) {
                $table->timestamp('cod_collected_at')->nullable();
            }
            if (!Schema::hasColumn('orders', 'cod_collected_by')) {
                $table->unsignedBigInteger('cod_collected_by')->nullable()->index();
            }
            if (!Schema::hasColumn('orders', 'cod_collection_note')) {
                $table->text('cod_collection_note')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        $columns = collect([
            'cod_collected_amount',
            'cod_collection_method',
            'cod_collected_at',
            'cod_collected_by',
            'cod_collection_note',
        ])->filter(fn (string $column) => Schema::hasColumn('orders', $column))->all();

        if ($columns !== []) {
            Schema::table('orders', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
