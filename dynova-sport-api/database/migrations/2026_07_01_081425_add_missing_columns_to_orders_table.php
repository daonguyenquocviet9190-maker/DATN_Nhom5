<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function addColumnIfMissing(string $column, callable $callback): void
    {
        if (!Schema::hasColumn('orders', $column)) {
            Schema::table('orders', function (Blueprint $table) use ($callback) {
                $callback($table);
            });
        }
    }

    public function up(): void
    {
        $this->addColumnIfMissing('user_id', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable();
        });

        $this->addColumnIfMissing('order_code', function (Blueprint $table) {
            $table->string('order_code')->nullable();
        });

        $this->addColumnIfMissing('customer_name', function (Blueprint $table) {
            $table->string('customer_name')->nullable();
        });

        $this->addColumnIfMissing('email', function (Blueprint $table) {
            $table->string('email')->nullable();
        });

        $this->addColumnIfMissing('phone', function (Blueprint $table) {
            $table->string('phone')->nullable();
        });

        $this->addColumnIfMissing('address', function (Blueprint $table) {
            $table->string('address')->nullable();
        });

        $this->addColumnIfMissing('province', function (Blueprint $table) {
            $table->string('province')->nullable();
        });

        $this->addColumnIfMissing('district', function (Blueprint $table) {
            $table->string('district')->nullable();
        });

        $this->addColumnIfMissing('ward', function (Blueprint $table) {
            $table->string('ward')->nullable();
        });

        $this->addColumnIfMissing('note', function (Blueprint $table) {
            $table->text('note')->nullable();
        });

        $this->addColumnIfMissing('payment_method', function (Blueprint $table) {
            $table->string('payment_method')->nullable();
        });

        $this->addColumnIfMissing('payment_status', function (Blueprint $table) {
            $table->string('payment_status')->default('pending');
        });

        $this->addColumnIfMissing('status', function (Blueprint $table) {
            $table->string('status')->default('pending');
        });

        $this->addColumnIfMissing('coupon', function (Blueprint $table) {
            $table->string('coupon')->nullable();
        });

        $this->addColumnIfMissing('subtotal', function (Blueprint $table) {
            $table->decimal('subtotal', 12, 0)->default(0);
        });

        $this->addColumnIfMissing('discount', function (Blueprint $table) {
            $table->decimal('discount', 12, 0)->default(0);
        });

        $this->addColumnIfMissing('shipping_fee', function (Blueprint $table) {
            $table->decimal('shipping_fee', 12, 0)->default(0);
        });

        $this->addColumnIfMissing('total', function (Blueprint $table) {
            $table->decimal('total', 12, 0)->default(0);
        });
    }

    public function down(): void
    {
        $columns = [
            'user_id',
            'order_code',
            'customer_name',
            'email',
            'phone',
            'address',
            'province',
            'district',
            'ward',
            'note',
            'payment_method',
            'payment_status',
            'status',
            'coupon',
            'subtotal',
            'discount',
            'shipping_fee',
            'total',
        ];

        foreach ($columns as $column) {
            if (Schema::hasColumn('orders', $column)) {
                Schema::table('orders', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
};