import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, Lock, User, Loader2, LogIn, UserPlus, Chrome, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const GOOGLE_CLIENT_ID = "173029425847-2ffb4l3bp3o4n2e9ge58g3l8v68ahdoh.apps.googleusercontent.com";

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      
      if (onLogin) onLogin(response.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API}/auth/register`,
        { email, password, name },
        { withCredentials: true }
      );
      
      if (onLogin) onLogin(response.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = encodeURIComponent("email profile");
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    
    window.location.href = googleAuthUrl;
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API}/auth/guest`,
        {},
        { withCredentials: true }
      );
      
      if (onLogin) onLogin(response.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-[#121214] border-white/5 p-8 rounded-3xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏸</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Badminton AI Analyzer</h1>
          <p className="text-zinc-400 mt-2">
            {mode === "login" ? "เข้าสู่ระบบเพื่อดูผลวิเคราะห์ของคุณ" : "สมัครสมาชิกเพื่อเริ่มต้นใช้งาน"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Google Login Button */}
        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full mb-6 py-6 border-white/10 text-white hover:bg-white/5 rounded-xl"
          disabled={loading}
        >
          <Chrome className="w-5 h-5 mr-3" />
          ดำเนินการต่อด้วย Google
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-zinc-500 text-sm">หรือ</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={mode === "login" ? handleEmailLogin : handleRegister}>
          {mode === "register" && (
            <div className="mb-4">
              <label className="text-zinc-400 text-sm mb-2 block">ชื่อ</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อของคุณ"
                  className="pl-11 py-6 bg-white/5 border-white/10 rounded-xl text-white"
                  required
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="text-zinc-400 text-sm mb-2 block">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="pl-11 py-6 bg-white/5 border-white/10 rounded-xl text-white"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-zinc-400 text-sm mb-2 block">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-11 py-6 bg-white/5 border-white/10 rounded-xl text-white"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-black hover:bg-primary/90 font-bold py-6 rounded-xl"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "login" ? (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                เข้าสู่ระบบ
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                สมัครสมาชิก
              </>
            )}
          </Button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-6">
          {mode === "login" ? (
            <p className="text-zinc-400">
              ยังไม่มีบัญชี?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-primary hover:underline font-medium"
              >
                สมัครสมาชิก
              </button>
            </p>
          ) : (
            <p className="text-zinc-400">
              มีบัญชีอยู่แล้ว?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-primary hover:underline font-medium"
              >
                เข้าสู่ระบบ
              </button>
            </p>
          )}
        </div>

        {/* Guest Login Divider */}
        <div className="flex items-center gap-4 mt-6 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-zinc-500 text-sm">หรือ</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Guest Login Button */}
        <Button
          onClick={handleGuestLogin}
          variant="ghost"
          className="w-full py-5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl border border-dashed border-white/10"
          disabled={guestLoading || loading}
        >
          {guestLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <UserX className="w-5 h-5 mr-2" />
              ทดลองใช้งานแบบไม่ระบุตัวตน
            </>
          )}
        </Button>
        <p className="text-center text-xs text-zinc-600 mt-2">
          * ข้อมูลจะไม่ถูกบันทึก
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;
