import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Upload, Activity, TrendingUp, Target, ArrowRight, BookOpen, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleVideoUpload(e.target.files[0]);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file.type.startsWith('video/')) {
      alert('กรุณาอัปโหลดไฟล์วิดีโอเท่านั้น');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate(`/analysis/${response.data.id}`);
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `radial-gradient(ellipse at top right, rgba(204, 255, 0, 0.08), transparent 50%), 
                             linear-gradient(to bottom, rgba(9, 9, 11, 0.6), rgba(9, 9, 11, 0.95)), 
                             url('https://images.unsplash.com/photo-1595220427358-8cf2ce3d7f89?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          {/* Floating badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium backdrop-blur-sm">
            <Award className="w-4 h-4" />
            <span>ตามมาตรฐาน BWF Coach Education</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6" data-testid="hero-title">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Master Your
            </span>
            <span className="block text-primary mt-2">Game</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed" data-testid="hero-subtitle">
            วิเคราะห์ทักษะแบดมินตันของคุณด้วย AI 
            <br className="hidden md:block" />
            พัฒนาเกมของคุณสู่ระดับมืออาชีพ
          </p>

          {/* Upload Area - Glassmorphism */}
          <div
            className={`max-w-xl mx-auto backdrop-blur-xl bg-black/40 rounded-3xl p-8 border transition-all duration-300 ${
              dragActive 
                ? 'border-primary shadow-[0_0_30px_-5px_rgba(204,255,0,0.3)]' 
                : 'border-white/10 hover:border-white/20'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            data-testid="upload-area"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileInput}
              className="hidden"
              disabled={isUploading}
              data-testid="file-input"
            />

            <div className="flex flex-col items-center">
              <div className={`w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 transition-all ${
                isUploading ? 'animate-pulse' : ''
              }`}>
                {isUploading ? (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : (
                  <Upload className="w-10 h-10 text-primary" strokeWidth={1.5} />
                )}
              </div>

              <h3 className="text-2xl font-semibold mb-2" data-testid="upload-title">
                {isUploading ? 'กำลังวิเคราะห์...' : 'อัปโหลดวิดีโอ'}
              </h3>
              
              <p className="text-zinc-400 mb-6">
                ลากและวางไฟล์ หรือคลิกเพื่อเลือกวิดีโอ
              </p>

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-6 rounded-full text-lg shadow-[0_0_20px_rgba(204,255,0,0.15)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(204,255,0,0.25)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                data-testid="upload-button"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    กำลังประมวลผล...
                  </>
                ) : (
                  'เลือกวิดีโอ'
                )}
              </Button>

              <Button
                onClick={() => navigate('/history')}
                variant="ghost"
                className="mt-4 text-zinc-400 hover:text-white rounded-full px-6"
                data-testid="history-link"
              >
                ดูประวัติการวิเคราะห์
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-24">
        {/* BWF Reference Banner */}
        <Link 
          to="/reference" 
          className="block mb-12 p-6 backdrop-blur-xl bg-gradient-to-r from-yellow-900/20 to-blue-900/20 border border-yellow-500/20 rounded-2xl hover:border-yellow-500/40 transition-all duration-300 group hover:shadow-lg"
          data-testid="bwf-banner"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Award className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">เกณฑ์มาตรฐาน BWF Coach Education</h3>
                <p className="text-zinc-400 text-sm">การวิเคราะห์อ้างอิงตามคู่มือสหพันธ์แบดมินตันโลก</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-yellow-400 group-hover:translate-x-2 transition-transform">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm hidden sm:inline">ดูข้อมูลอ้างอิง</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl hover:border-primary/30 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5" data-testid="feature-technique">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <Target className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold mb-3">วิเคราะห์ท่าทาง</h3>
            <p className="text-zinc-400 leading-relaxed">
              ตรวจสอบท่าทางการตี การจับไม้ และเทคนิคการเล่นตามมาตรฐาน BWF
            </p>
          </Card>

          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl hover:border-blue-500/30 transition-all duration-300 group hover:shadow-lg hover:shadow-blue-500/5" data-testid="feature-footwork">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300">
              <Activity className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold mb-3">ฟุตเวิร์ค</h3>
            <p className="text-zinc-400 leading-relaxed">
              วิเคราะห์การเคลื่อนที่ Split Step, Lunge และความเร็วในการฟื้นตัว
            </p>
          </Card>

          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl hover:border-rose-500/30 transition-all duration-300 group hover:shadow-lg hover:shadow-rose-500/5" data-testid="feature-training">
            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-rose-500/20 group-hover:scale-110 transition-all duration-300">
              <TrendingUp className="w-7 h-7 text-rose-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold mb-3">แผนฝึกซ้อม</h3>
            <p className="text-zinc-400 leading-relaxed">
              รับแผนการฝึกซ้อมที่ออกแบบมาเพื่อพัฒนาจุดอ่อนของคุณโดยเฉพาะ
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
