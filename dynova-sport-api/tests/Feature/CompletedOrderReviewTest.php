<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CompletedOrderReviewTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
        });
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->nullable();
            $table->string('image')->nullable();
            $table->decimal('price', 14, 2)->default(0);
        });
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('status');
        });
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
        });
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('order_item_id');
            $table->unsignedTinyInteger('rating');
            $table->text('content');
            $table->string('status');
            $table->timestamps();
        });
    }

    public function test_customer_can_review_each_item_once_only_after_order_is_completed(): void
    {
        DB::table('users')->insert(['id' => 4, 'name' => 'Khách hàng']);
        DB::table('products')->insert([
            'id' => 8,
            'name' => 'Áo thể thao',
            'slug' => 'ao-the-thao',
            'price' => 350000,
        ]);
        DB::table('orders')->insert([
            'id' => 10,
            'user_id' => 4,
            'status' => 'shipping',
        ]);
        DB::table('order_items')->insert([
            'id' => 20,
            'order_id' => 10,
            'product_id' => 8,
        ]);

        $user = new User();
        $user->id = 4;
        Sanctum::actingAs($user);

        $payload = [
            'product_id' => 8,
            'order_id' => 10,
            'order_item_id' => 20,
            'rating' => 5,
            'content' => 'Sản phẩm tốt và đúng mô tả.',
        ];

        $this->postJson('/api/reviews', $payload)
            ->assertUnprocessable();

        DB::table('orders')->where('id', 10)->update(['status' => 'completed']);

        $this->postJson('/api/reviews', $payload)
            ->assertCreated()
            ->assertJsonPath('data.review.verified_purchase', true)
            ->assertJsonPath('data.review.order_item_id', 20);

        $this->postJson('/api/reviews', $payload)
            ->assertUnprocessable();

        $this->assertDatabaseCount('reviews', 1);
    }
}
