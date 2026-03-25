import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthCallbackPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const sessionId = searchParams.get("session_id");
      
      // Handle Emergent OAuth callback (session_id)
      if (sessionId) {
        try {
          const response = await axios.post(
            `${API}/auth/google/session`,
            { session_id: sessionId },
            { withCredentials: true }
          );
          
          if (onLogin) onLogin(response.data);
          setStatus("success");
          setTimeout(() => navigate("/"), 1500);
        } catch (err) {
          console.error("Auth error:", err);
          setStatus("error");
          setError(err.response?.data?.detail || "การยืนยันตัวตนล้มเหลว");
        }
        return;
      }

      // Handle Google OAuth callback (code)
      if (code) {
        // For Google OAuth, we need to redirect to Emergent's OAuth handler
        const redirectUri = `${window.location.origin}/auth/callback`;
        const emergentOAuthUrl = `https://demobackend.emergentagent.com/auth/v1/env/oauth/google?code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`;
        
        try {
          const response = await axios.get(emergentOAuthUrl);
          const session_id = response.data?.session_id;
          
          if (session_id) {
            // Exchange session_id for our session token
            const tokenResponse = await axios.post(
              `${API}/auth/google/session`,
              { session_id },
              { withCredentials: true }
            );
            
            if (onLogin) onLogin(tokenResponse.data);
            setStatus("success");
            setTimeout(() => navigate("/"), 1500);
          } else {
            throw new Error("No session_id received");
          }
        } catch (err) {
          console.error("Auth error:", err);
          setStatus("error");
          setError("การยืนยันตัวตนกับ Google ล้มเหลว");
        }
        return;
      }

      // No code or session_id
      setStatus("error");
      setError("ไม่พบข้อมูลการยืนยันตัวตน");
    };

    handleCallback();
  }, [searchParams, navigate, onLogin]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-[#121214] border-white/5 p-8 rounded-3xl text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">กำลังยืนยันตัวตน...</h2>
            <p className="text-zinc-400">กรุณารอสักครู่</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">เข้าสู่ระบบสำเร็จ!</h2>
            <p className="text-zinc-400">กำลังนำคุณไปยังหน้าหลัก...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-rose-400 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-zinc-400 mb-6">{error}</p>
            <Button
              onClick={() => navigate("/login")}
              className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-4 rounded-xl"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default AuthCallbackPage;
