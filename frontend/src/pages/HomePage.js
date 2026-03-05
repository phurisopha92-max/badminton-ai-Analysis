import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Upload, Activity, TrendingUp, Target, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(rgba(5, 5, 5, 0.7), rgba(5, 5, 5, 0.9)), url('https://images.unsplash.com/photo-1595220427358-8cf2ce3d7f89?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <h1 className="font-heading text-6xl md:text-8xl font-bold tracking-tighter uppercase mb-6" data-testid="hero-title">
            MASTER YOUR
            <span className="block text-primary">GAME</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12" data-testid="hero-subtitle">
            วิเคราะห์ทักษะแบมินตันของคุณด้วย AI พัฒนาเกมของคุณสู่ระดับมืออาชีพ
          </p>

          {/* Upload Area */}
          <div
            className={`max-w-2xl mx-auto glass-effect rounded-sm p-8 border-2 transition-all duration-300 ${
              dragActive ? 'border-primary neon-glow' : 'border-white/10'
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
              <div className="w-20 h-20 rounded-sm bg-primary/10 flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-primary" strokeWidth={1.5} />
              </div>

              <h3 className="font-heading text-2xl uppercase mb-2" data-testid="upload-title">
                {isUploading ? 'กำลังวิเคราะห์...' : 'อัปโหลดวิดีโอ'}
              </h3>
              
              <p className="text-gray-400 mb-6">
                ลากและวางไฟล์ หรือคลิกเพื่อเลือกวิดีโอ
              </p>

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest px-8 py-6 rounded-none skew-x-[-10deg] transition-transform hover:-translate-y-1"
                data-testid="upload-button"
              >
                <span className="skew-x-[10deg]">
                  {isUploading ? 'กำลังประมวลผล...' : 'เลือกวิดีโอ'}
                </span>
              </Button>

              <Button
                onClick={() => navigate('/history')}
                variant="ghost"
                className="mt-4 text-muted-foreground hover:text-white uppercase tracking-widest text-sm"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm hover:border-primary/50 transition-colors duration-300 group" data-testid="feature-technique">
            <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Target className="w-6 h-6 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading text-2xl uppercase mb-2">วิเคราะห์ท่าทาง</h3>
            <p className="text-gray-400">
              ตรวจสอบท่าทางการตี การจับไม้ และเทคนิคการเล่น
            </p>
          </Card>

          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm hover:border-primary/50 transition-colors duration-300 group" data-testid="feature-footwork">
            <div className="w-12 h-12 bg-secondary/10 rounded-sm flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
              <Activity className="w-6 h-6 text-secondary" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading text-2xl uppercase mb-2">ฟุตเวิร์ค</h3>
            <p className="text-gray-400">
              วิเคราะห์การเคลื่อนที่ การวางตัว และความเร็ว
            </p>
          </Card>

          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm hover:border-primary/50 transition-colors duration-300 group" data-testid="feature-training">
            <div className="w-12 h-12 bg-accent/10 rounded-sm flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <TrendingUp className="w-6 h-6 text-accent" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading text-2xl uppercase mb-2">แผนฝึกซ้อม</h3>
            <p className="text-gray-400">
              รับแผนการฝึกซ้อมที่ออกแบบมาเพื่อคุณโดยเฉพาะ
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;