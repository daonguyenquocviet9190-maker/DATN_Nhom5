<?php
namespace App\Services\Payments;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use RuntimeException;
class DynovaSandboxProvider implements PaymentProviderInterface
{
    public function createPendingForOrder(int $orderId): void
    {
        $this->assertReady();
        DB::transaction(function() use($orderId){
            $order=DB::table('orders')->where('id',$orderId)->lockForUpdate()->first();
            if(!$order) throw new RuntimeException('Không tìm thấy đơn hàng.');
            if(($order->payment_method??'')!=='bank') throw new RuntimeException('Đơn hàng không sử dụng thanh toán QR.');
            $exists=DB::table('payment_transactions')->where('order_id',$orderId)->where('provider','dynova_sandbox')->lockForUpdate()->first();
            if($exists) return;
            DB::table('payment_transactions')->insert([
                'order_id'=>$orderId,'provider'=>'dynova_sandbox',
                'transaction_ref'=>'DSBX-'.(string)$order->order_code,
                'amount'=>(float)($order->grand_total??0),'status'=>'pending',
                'request_payload'=>json_encode(['order_code'=>(string)$order->order_code,'payment_mode'=>'sandbox'],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),
                'created_at'=>now(),'updated_at'=>now(),
            ]);
        },3);
    }
    public function stateForOrder(int $orderId, ?int $userId=null): array
    {
        $this->assertReady(); $this->assertOrderAccess($orderId,$userId); $this->createPendingIfMissing($orderId); return $this->buildState($orderId);
    }
    public function refreshForOrder(int $orderId, ?int $userId=null): array
    {
        $this->assertReady(); $this->assertOrderAccess($orderId,$userId); return $this->buildState($orderId);
    }
    public function confirmScan(int $orderId,string $token): array
    {
        $this->assertReady();
        if(!filter_var(config('services.payment_sandbox.enabled',false),FILTER_VALIDATE_BOOL)) throw new RuntimeException('Thanh toán sandbox hiện chưa được bật.');
        $order=DB::table('orders')->where('id',$orderId)->first();
        $tx=DB::table('payment_transactions')->where('order_id',$orderId)->where('provider','dynova_sandbox')->orderByDesc('id')->first();
        if(!$order||!$tx) throw new RuntimeException('Không tìm thấy giao dịch thanh toán.');
        if(($order->status??'')==='cancelled') throw new RuntimeException('Đơn hàng đã hủy.');
        $expected=$this->makeToken($order,$tx);
        if(!hash_equals($expected,trim($token))) throw new RuntimeException('Mã thanh toán không hợp lệ.');
        if(($order->payment_status??'')!=='paid'){
            $ref='DSBX-'.strtoupper(substr(hash('sha256',$tx->transaction_ref.'|'.$expected),0,18));
            $this->markPaid($orderId,$ref);
        }
        return $this->buildState($orderId);
    }
    private function markPaid(int $orderId,string $ref): void
    {
        DB::transaction(function()use($orderId,$ref){
            $tx=DB::table('payment_transactions')->where('order_id',$orderId)->where('provider','dynova_sandbox')->lockForUpdate()->first();
            $order=DB::table('orders')->where('id',$orderId)->lockForUpdate()->first();
            if(!$tx||!$order) throw new RuntimeException('Không tìm thấy giao dịch.');
            if(($tx->status??'')==='paid'&&($order->payment_status??'')==='paid') return;
            if(($order->status??'')==='cancelled') throw new RuntimeException('Đơn hàng đã hủy.');
            if(abs((float)($order->grand_total??0)-(float)($tx->amount??0))>0.01) throw new RuntimeException('Số tiền giao dịch không khớp.');
            if(DB::table('payment_transactions')->where('provider','dynova_sandbox')->where('provider_transaction_no',$ref)->where('id','<>',$tx->id)->where('status','paid')->exists()) throw new RuntimeException('Giao dịch đã được sử dụng.');
            DB::table('payment_transactions')->where('id',$tx->id)->update([
                'provider_transaction_no'=>$ref,'status'=>'paid',
                'response_payload'=>json_encode(['provider'=>'dynova_sandbox','status'=>'paid','reference'=>$ref],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),
                'paid_at'=>now(),'updated_at'=>now(),
            ]);
            $from=strtolower((string)($order->status??'pending'));
            $update=['payment_status'=>'paid','updated_at'=>now()]; if($from==='pending') $update['status']='confirmed';
            DB::table('orders')->where('id',$orderId)->update($update);
            if($from==='pending'&&Schema::hasTable('order_status_histories')) DB::table('order_status_histories')->insert(['order_id'=>$orderId,'changed_by'=>null,'from_status'=>'pending','to_status'=>'confirmed','source'=>'payment','note'=>'Thanh toán QR đã được xác nhận.','created_at'=>now(),'updated_at'=>now()]);
        },3);
    }
    private function buildState(int $orderId): array
    {
        $order=DB::table('orders')->where('id',$orderId)->first();
        $tx=DB::table('payment_transactions')->where('order_id',$orderId)->where('provider','dynova_sandbox')->orderByDesc('id')->first();
        if(!$order||!$tx) throw new RuntimeException('Không tìm thấy giao dịch thanh toán.');
        $s=$this->bankSettings(); $amount=(float)($tx->amount??$order->grand_total??0);
        return [
            'order_id'=>(int)$order->id,'order_code'=>(string)$order->order_code,'order_status'=>(string)$order->status,
            'payment_status'=>(string)$order->payment_status,'transaction_status'=>(string)$tx->status,
            'transaction_ref'=>(string)$tx->transaction_ref,'provider_transaction_no'=>$tx->provider_transaction_no??null,'amount'=>$amount,
            'transfer_content'=>(string)$order->order_code,'qr_url'=>$this->buildQrImageUrl($this->buildScanUrl($order,$tx)),
            'payment_mode'=>'sandbox','simulated'=>true,'money_transfer_required'=>false,
            'bank'=>['name'=>$s['bank_name'],'code'=>$s['bank_code'],'account_number'=>$s['account_number'],'account_name'=>$s['account_name'],'branch'=>$s['branch']],
            'paid_at'=>$tx->paid_at??null,
        ];
    }
    private function buildScanUrl(object $order,object $tx): string { return rtrim((string)config('services.payment_sandbox.base_url',config('app.url')),'/').'/api/payments/sandbox/scan/'.$order->id.'/'.$this->makeToken($order,$tx); }
    private function buildQrImageUrl(string $url): string { return rtrim((string)config('services.payment_sandbox.qr_image_url','https://quickchart.io/qr'),'?&').'?'.http_build_query(['text'=>$url,'size'=>360,'margin'=>2,'ecLevel'=>'M','format'=>'png'],'','&',PHP_QUERY_RFC3986); }
    private function makeToken(object $order,object $tx): string
    {
        $secret=trim((string)config('services.payment_sandbox.secret','')); if($secret==='') throw new RuntimeException('PAYMENT_SANDBOX_SECRET chưa được cấu hình.');
        return hash_hmac('sha256',implode('|',[(string)$order->id,(string)$order->order_code,(string)$tx->transaction_ref,number_format((float)($tx->amount??$order->grand_total??0),2,'.','')]),$secret);
    }
    private function bankSettings(): array
    {
        if(!Schema::hasTable('settings')) throw ValidationException::withMessages(['payment'=>'Chưa có cấu hình ngân hàng.']);
        $s=DB::table('settings')->orderBy('id')->first(); $bank_name=trim((string)($s->bank_name??'')); $bank_code=trim((string)($s->bank_code??'')); $account_number=preg_replace('/\s+/','',(string)($s->bank_account_number??'')); $account_name=trim((string)($s->bank_account_name??'')); $branch=trim((string)($s->bank_branch??''));
        if($bank_name===''||$account_number===''||$account_name==='') throw ValidationException::withMessages(['payment'=>'Cấu hình ngân hàng chưa đầy đủ.']);
        return compact('bank_name','bank_code','account_number','account_name','branch');
    }
    private function createPendingIfMissing(int $orderId): void { if(!DB::table('payment_transactions')->where('order_id',$orderId)->where('provider','dynova_sandbox')->exists()) $this->createPendingForOrder($orderId); }
    private function assertOrderAccess(int $orderId,?int $userId): void { $q=DB::table('orders')->where('id',$orderId); if($userId!==null)$q->where('user_id',$userId); if(!$q->first()) throw new RuntimeException('Không tìm thấy đơn hàng.'); }
    private function assertReady(): void { if(!Schema::hasTable('orders')||!Schema::hasTable('payment_transactions')) throw new RuntimeException('Hệ thống thanh toán chưa sẵn sàng.'); }
}