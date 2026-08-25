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
                if (!Schema::hasColumn('orders', 'province_code')) {
                    $table->string('province_code', 40)->nullable()->after('province');
                }
                if (!Schema::hasColumn('orders', 'district_code')) {
                    $table->string('district_code', 40)->nullable()->after('district');
                }
                if (!Schema::hasColumn('orders', 'ward_code')) {
                    $table->string('ward_code', 40)->nullable()->after('ward');
                }
                if (!Schema::hasColumn('orders', 'ghn_service_id')) {
                    $table->unsignedInteger('ghn_service_id')->nullable()->after('tracking_code');
                }
                if (!Schema::hasColumn('orders', 'ghn_service_type_id')) {
                    $table->unsignedInteger('ghn_service_type_id')->nullable()->after('ghn_service_id');
                }
                if (!Schema::hasColumn('orders', 'ghn_carrier_fee')) {
                    $table->decimal('ghn_carrier_fee', 14, 2)->default(0)->after('ghn_service_type_id');
                }
                if (!Schema::hasColumn('orders', 'ghn_status')) {
                    $table->string('ghn_status', 80)->nullable()->after('ghn_carrier_fee');
                }
                if (!Schema::hasColumn('orders', 'ghn_expected_delivery_at')) {
                    $table->timestamp('ghn_expected_delivery_at')->nullable()->after('ghn_status');
                }
                if (!Schema::hasColumn('orders', 'ghn_created_at')) {
                    $table->timestamp('ghn_created_at')->nullable()->after('ghn_expected_delivery_at');
                }
                if (!Schema::hasColumn('orders', 'ghn_last_synced_at')) {
                    $table->timestamp('ghn_last_synced_at')->nullable()->after('ghn_created_at');
                }
                if (!Schema::hasColumn('orders', 'shipping_weight_grams')) {
                    $table->unsignedInteger('shipping_weight_grams')->nullable()->after('ghn_last_synced_at');
                }
                if (!Schema::hasColumn('orders', 'shipping_length_cm')) {
                    $table->unsignedSmallInteger('shipping_length_cm')->nullable()->after('shipping_weight_grams');
                }
                if (!Schema::hasColumn('orders', 'shipping_width_cm')) {
                    $table->unsignedSmallInteger('shipping_width_cm')->nullable()->after('shipping_length_cm');
                }
                if (!Schema::hasColumn('orders', 'shipping_height_cm')) {
                    $table->unsignedSmallInteger('shipping_height_cm')->nullable()->after('shipping_width_cm');
                }
                if (!Schema::hasColumn('orders', 'ghn_response')) {
                    $table->json('ghn_response')->nullable()->after('shipping_height_cm');
                }
            });
        }

        if (!Schema::hasTable('shipping_status_histories')) {
            Schema::create('shipping_status_histories', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id');
                $table->string('provider', 30)->default('ghn');
                $table->string('tracking_code', 120)->nullable();
                $table->string('status', 80);
                $table->string('description', 500)->nullable();
                $table->json('payload')->nullable();
                $table->timestamp('occurred_at')->nullable();
                $table->timestamps();
                $table->index(['order_id', 'occurred_at']);
                $table->index(['tracking_code', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shipping_status_histories');

        if (Schema::hasTable('orders')) {
            $columns = [
                'province_code', 'district_code', 'ward_code',
                'ghn_service_id', 'ghn_service_type_id', 'ghn_carrier_fee', 'ghn_status',
                'ghn_expected_delivery_at', 'ghn_created_at', 'ghn_last_synced_at',
                'shipping_weight_grams', 'shipping_length_cm', 'shipping_width_cm', 'shipping_height_cm',
                'ghn_response',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    Schema::table('orders', fn (Blueprint $table) => $table->dropColumn($column));
                }
            }
        }
    }
};
