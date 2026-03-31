import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle } from "lucide-react";

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Redirect to subscription page with session_id to handle payment verification
    if (sessionId) {
      navigate(`/subscription?session_id=${sessionId}`, { replace: true });
    } else {
      navigate('/subscription', { replace: true });
    }
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">กำลังตรวจสอบการชำระเงิน...</p>
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;
