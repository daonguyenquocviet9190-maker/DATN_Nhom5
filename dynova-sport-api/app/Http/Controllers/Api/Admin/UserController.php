<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 1. Lấy danh sách thành viên (Xử lý mượt mà, fix lỗi 500)
     */
    public function index()
    {
        return response()->json(User::orderBy('id', 'asc')->get(), 200);
    }

    /**
     * 2. Thêm mới thành viên từ Admin
     */
    public function store(Request $request)
    {
        $data = $request->all();

        if (User::where('email', $data['email'] ?? '')->exists()) {
            return response()->json(['message' => 'Email này đã được sử dụng!'], 400);
        }

        $data['password'] = bcrypt($data['password'] ?? '123456');
        if (!isset($data['role_id'])) $data['role_id'] = 2; // Khách hàng
        if (!isset($data['status'])) $data['status'] = 'active';

        $user = User::create($data);
        return response()->json($user, 201);
    }

    /**
     * 3. Chi tiết thành viên
     */
    public function show($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy thành viên'], 404);
        }
        return response()->json($user, 200);
    }

    /**
     * 4. Cập nhật thông tin / Thay đổi trạng thái (Kích hoạt / Khóa)
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy thành viên'], 404);
        }

        $data = $request->all();
        
        if (!empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        
        return response()->json($user, 200);
    }

    /**
     * 5. Xóa thành viên
     */
    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy thành viên'], 404);
        }
        
        $user->delete();
        return response()->json(['success' => true, 'message' => 'Xóa thành viên thành công'], 200);
    }
}