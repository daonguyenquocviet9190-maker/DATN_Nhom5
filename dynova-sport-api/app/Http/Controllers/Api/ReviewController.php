<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
{
    $request->validate([
        'product_id' => 'required|exists:products,id',
        'status' => 'nullable|in:pending,approved,rejected',
        'per_page' => 'nullable|integer',
    ]);

    $query = Review::where('product_id', $request->product_id);

    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }

    return response()->json([
        'success' => true,
        'data' => $query->paginate($request->per_page ?? 10),
    ]);
}
}
