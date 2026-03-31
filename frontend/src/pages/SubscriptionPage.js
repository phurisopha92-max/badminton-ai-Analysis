import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { 
  Crown, Check, Zap, Users, Infinity, CreditCard, QrCode, 
  Loader2, AlertCircle, Sparkles, Calendar, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [processing, setProcessing] = useState(false);
  const [promptPayData, setPromptPayData] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Check for return from Stripe
  const sessionId = searchParams.get('session_id');

  const fetchData = useCallback(async () => {
    try {
      const [packagesRes, statusRes] = await Promise.all([
        axios.get(`${API}/subscription/packages`),
        axios.get(`${API}/subscription/status`)
      ]);
      setPackages(packagesRes.data.packages || []);
      setSubscriptionStatus(statusRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll payment status after returning from Stripe
  const pollPaymentStatus = useCallback(async (sid, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setCheckingPayment(false);
      alert('ไม่สามารถตรวจสอบสถานะการชำระเงินได้ กรุณาติดต่อเรา');
      return;
    }

    try {
      const response = await axios.get(`${API}/subscription/checkout/status/${sid}`);
      
      if (response.data.payment_status === 'paid') {
        setCheckingPayment(false);
        alert('ชำระเงินสำเร็จ! คุณเป็นโค้ชแล้ว 🎉');
        // Clear session_id from URL
        window.history.replaceState({}, '', '/subscription');
        // Refresh data
        fetchData();
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sid, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment:', error);
      setTimeout(() => pollPaymentStatus(sid, attempts + 1), pollInterval);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (sessionId) {
      setCheckingPayment(true);
      pollPaymentStatus(sessionId);
    }
  }, [sessionId, pollPaymentStatus]);

  const handleStripeCheckout = async (packageId) => {
    setProcessing(true);
    try {
      const response = await axios.post(`${API}/subscription/checkout`, {
        package_id: packageId,
        origin_url: window.location.origin
      });
      
      // Redirect to Stripe
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setProcessing(false);
    }
  };

  const handlePromptPay = async (packageId) => {
    setProcessing(true);
    try {
      const response = await axios.post(`${API}/subscription/promptpay`, {
        package_id: packageId
      });
      setPromptPayData(response.data);
    } catch (error) {
      console.error('Error creating PromptPay:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = (packageId) => {
    setSelectedPlan(packageId);
    if (paymentMethod === "stripe") {
      handleStripeCheckout(packageId);
    } else {
      handlePromptPay(packageId);
    }
  };

  if (loading || checkingPayment) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">
            {checkingPayment ? 'กำลังตรวจสอบการชำระเงิน...' : 'กำลังโหลด...'}
          </p>
        </div>
      </div>
    );
  }

  // Active subscription view
  if (subscriptionStatus?.has_subscription) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">คุณเป็น Coach แล้ว!</h1>
            <p className="text-zinc-400">สมาชิกพรีเมียมพร้อมสิทธิประโยชน์เต็มรูปแบบ</p>
          </div>

          <Card className="bg-[#121214] border-primary/30 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-primary">
                  {subscriptionStatus.plan === 'yearly' ? 'แพ็คเกจรายปี' : 'แพ็คเกจรายเดือน'}
                </h3>
                <p className="text-zinc-400 text-sm">กำลังใช้งาน</p>
              </div>
              <Badge className="bg-primary/20 text-primary rounded-full px-4 py-2">
                <Sparkles className="w-4 h-4 mr-1" />
                Active
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-zinc-400" />
                  <span className="text-zinc-300">หมดอายุ</span>
                </div>
                <span className="font-semibold">
                  {new Date(subscriptionStatus.expires_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-zinc-400" />
                  <span className="text-zinc-300">วันที่เหลือ</span>
                </div>
                <span className="font-semibold text-primary">{subscriptionStatus.days_remaining} วัน</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <Infinity className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300">วิดีโอที่วิเคราะห์ได้</span>
                </div>
                <span className="font-semibold text-emerald-400">ไม่จำกัด</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="font-semibold mb-4">สิทธิประโยชน์ที่ได้รับ:</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'วิเคราะห์วิดีโอไม่จำกัด',
                  'โหมดโค้ช',
                  'ดูแลนักกีฬาหลายคน',
                  'แชร์ผลให้ทีม',
                  'Export PDF',
                  'วิเคราะห์เกมยาว'
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-primary" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="text-center mt-6">
            <Button
              onClick={() => navigate('/coach')}
              className="bg-primary text-black hover:bg-primary/90 rounded-full px-8"
            >
              <Users className="w-4 h-4 mr-2" />
              ไปหน้าโค้ช
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // PromptPay instruction view
  if (promptPayData) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white p-6">
        <div className="max-w-md mx-auto">
          <Card className="bg-[#121214] border-white/10 p-6 rounded-3xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">PromptPay</h2>
              <p className="text-zinc-400">โอนเงินตามรายละเอียดด้านล่าง</p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-center">
                <p className="text-sm text-zinc-400 mb-1">จำนวนเงิน</p>
                <p className="text-3xl font-bold text-blue-400">฿{promptPayData.amount_thb?.toFixed(2)}</p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl">
                <p className="text-sm text-zinc-400 mb-1">PromptPay ID</p>
                <p className="text-xl font-mono">{promptPayData.promptpay_id}</p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl">
                <p className="text-sm text-zinc-400 mb-1">Reference</p>
                <p className="text-lg font-mono text-primary">{promptPayData.reference}</p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-semibold mb-1">ขั้นตอนการชำระเงิน:</p>
                    <ol className="list-decimal list-inside space-y-1 text-yellow-200/80">
                      <li>โอนเงินผ่าน PromptPay ตามจำนวนที่แสดง</li>
                      <li>ใส่ Reference ในช่องหมายเหตุ</li>
                      <li>ส่งหลักฐานการโอนมาทาง Line: @badmintonai</li>
                      <li>รอตรวจสอบ 1-24 ชั่วโมง</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setPromptPayData(null)}
                variant="outline"
                className="flex-1 rounded-full border-white/20"
              >
                ย้อนกลับ
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="flex-1 bg-primary text-black hover:bg-primary/90 rounded-full"
              >
                เสร็จสิ้น
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Pricing page
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-primary/20 text-primary rounded-full px-4 py-1 mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            อัปเกรดเป็น Coach
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            ปลดล็อคพลังเต็มรูปแบบ
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            วิเคราะห์วิดีโอไม่จำกัด ดูแลนักกีฬาหลายคน และเข้าถึงฟีเจอร์ทั้งหมด
          </p>
        </div>

        {/* Current Usage */}
        {subscriptionStatus?.usage && (
          <Card className="bg-white/5 border-white/10 p-4 rounded-2xl mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-zinc-300">โควต้าฟรีของคุณเดือนนี้</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${subscriptionStatus.usage.remaining <= 1 ? 'text-rose-400' : 'text-primary'}`}>
                  {subscriptionStatus.usage.video_count}/{subscriptionStatus.usage.limit}
                </span>
                <span className="text-zinc-500">วิดีโอ</span>
              </div>
            </div>
            {subscriptionStatus.usage.remaining <= 2 && (
              <p className="text-rose-400 text-sm mt-2">
                ⚠️ โควต้าใกล้หมด! อัปเกรดเพื่อใช้งานไม่จำกัด
              </p>
            )}
          </Card>
        )}

        {/* Payment Method Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setPaymentMethod("stripe")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              paymentMethod === "stripe"
                ? "bg-primary text-black"
                : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Credit Card
          </button>
          <button
            onClick={() => setPaymentMethod("promptpay")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              paymentMethod === "promptpay"
                ? "bg-blue-500 text-white"
                : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
          >
            <QrCode className="w-4 h-4" />
            PromptPay
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative p-6 rounded-3xl transition-all ${
                pkg.id === 'yearly'
                  ? 'bg-gradient-to-b from-primary/20 to-primary/5 border-primary/30'
                  : 'bg-[#121214] border-white/10'
              }`}
            >
              {pkg.id === 'yearly' && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black rounded-full px-4">
                  ประหยัด $21
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">${pkg.price}</span>
                  <span className="text-zinc-400">
                    /{pkg.id === 'yearly' ? 'ปี' : 'เดือน'}
                  </span>
                </div>
                {pkg.id === 'yearly' && (
                  <p className="text-sm text-primary mt-1">~$8.25/เดือน</p>
                )}
                {paymentMethod === 'promptpay' && (
                  <p className="text-sm text-blue-400 mt-2">
                    ≈ ฿{(pkg.price * 35).toFixed(0)} บาท
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  'วิเคราะห์วิดีโอไม่จำกัด',
                  'โหมดโค้ช - ดูแลนักกีฬาหลายคน',
                  'แชร์ผลวิเคราะห์ให้ทีม',
                  'วิเคราะห์เกมยาว (500MB)',
                  'Export PDF รายงาน',
                  'ติดตามพัฒนาการ'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check className={`w-4 h-4 ${pkg.id === 'yearly' ? 'text-primary' : 'text-emerald-400'}`} />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePayment(pkg.id)}
                disabled={processing && selectedPlan === pkg.id}
                className={`w-full rounded-full py-6 text-lg font-semibold ${
                  pkg.id === 'yearly'
                    ? 'bg-primary text-black hover:bg-primary/90'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                data-testid={`subscribe-${pkg.id}-btn`}
              >
                {processing && selectedPlan === pkg.id ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    เลือกแพ็คเกจนี้
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-8 mt-12 text-zinc-500">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">ชำระเงินปลอดภัย</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm">เปิดใช้งานทันที</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
