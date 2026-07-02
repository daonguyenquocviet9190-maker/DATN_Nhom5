<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function addColumnIfMissing(string $column, callable $callback): void
    {
        if (!Schema::hasColumn('users', $column)) {
            Schema::table('users', function (Blueprint $table) use ($callback) {
                $callback($table);
            });
        }
    }

    public function up(): void
    {
        $this->addColumnIfMissing('address', function (Blueprint $table) {
            $table->string('address')->nullable();
        });

        $this->addColumnIfMissing('province', function (Blueprint $table) {
            $table->string('province')->nullable();
        });

        $this->addColumnIfMissing('ward', function (Blueprint $table) {
            $table->string('ward')->nullable();
        });

        $this->addColumnIfMissing('avatar_url', function (Blueprint $table) {
            $table->text('avatar_url')->nullable();
        });
    }

    public function down(): void
    {
        foreach (['address', 'province', 'ward', 'avatar_url'] as $column) {
            if (Schema::hasColumn('users', $column)) {
                Schema::table('users', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
};