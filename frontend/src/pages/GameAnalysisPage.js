import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Upload, Loader2, Trophy, Clock, AlertTriangle,
  CheckCircle, XCircle, TrendingUp, TrendingDown, Target, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GameAnalysisPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle, uploading, analyzing, complete, error
  const [gameAnalysis, setGameAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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
      setError('กรุณาอัปโหลดไฟล์วิดีโอเท่านั้น');
      return;
    }

    // Check file size (max 500MB for game analysis)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      setError('ไฟล์วิดีโอต้องมีขนาดไม่เกิน 500MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    setAnalysisStatus('uploading');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload with progress tracking
      const response = await axios.post(`${API}/game-analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          if (progress === 100) {
            setAnalysisStatus('analyzing');
          }
        },
      });

      setGameAnalysis(response.data);
      setAnalysisStatus('complete');
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.detail || 'เกิดข้อผิดพลาดในการวิเคราะห์');
      setAnalysisStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const resetAnalysis = () => {
    setGameAnalysis(null);
    setAnalysisStatus('idle');
    setError(null);
    setUploadProgress(0);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="container mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-zinc-400 hover:text-white rounded-full"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับหน้าหลัก
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="game-analysis-title">
                🏆 Game Analysis
              </h1>
              <p className="text-zinc-400 mt-1">วิเคราะห์การแข่งขันทั้งเกม</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Info Card */}
        <Card className="bg-yellow-900/10 border-yellow-500/20 p-4 rounded-2xl mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-400 mb-1">สำหรับวิดีโอความยาว 10-45 นาที</h4>
              <p className="text-zinc-400 text-sm">
                ระบบจะวิเคราะห์ภาพรวมทั้งเกม รวมถึง Timeline, สถิติ, และ Pattern ที่พบ 
                ใช้เวลาประมวลผล 2-5 นาที ขึ้นอยู่กับความยาววิดีโอ
              </p>
            </div>
          </div>
        </Card>

        {analysisStatus === 'idle' && !gameAnalysis && (
          /* Upload Area */
          <div
            className={`max-w-2xl mx-auto backdrop-blur-xl bg-black/40 rounded-3xl p-10 border transition-all duration-300 cursor-pointer ${
              dragActive 
                ? 'border-yellow-500 shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)]' 
                : 'border-white/10 hover:border-white/20 hover:bg-black/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="game-upload-area"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileInput}
              className="hidden"
              data-testid="game-file-input"
            />

            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-3xl bg-yellow-500/10 flex items-center justify-center mb-6">
                <Upload className="w-12 h-12 text-yellow-400" strokeWidth={1.5} />
              </div>

              <h3 className="text-2xl font-semibold mb-2">อัปโหลดวิดีโอการแข่งขัน</h3>
              <p className="text-zinc-400 mb-6">
                ลากและวางไฟล์ หรือคลิกเพื่อเลือกวิดีโอ
                <br />
                <span className="text-zinc-500 text-sm">รองรับไฟล์สูงสุด 500MB (ประมาณ 30-45 นาที)</span>
              </p>

              <Button
                className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold px-8 py-6 rounded-full text-lg pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                เลือกวิดีโอการแข่งขัน
              </Button>
            </div>
          </div>
        )}

        {/* Upload/Analyzing Progress */}
        {(analysisStatus === 'uploading' || analysisStatus === 'analyzing') && (
          <Card className="max-w-2xl mx-auto bg-[#121214] border-white/5 p-8 rounded-3xl">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-yellow-500/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
              </div>

              <h3 className="text-2xl font-semibold mb-2">
                {analysisStatus === 'uploading' ? 'กำลังอัปโหลด...' : 'กำลังวิเคราะห์...'}
              </h3>
              <p className="text-zinc-400 mb-6">
                {analysisStatus === 'uploading' 
                  ? 'กรุณารอสักครู่ กำลังอัปโหลดวิดีโอ'
                  : 'AI กำลังวิเคราะห์การแข่งขันทั้งเกม อาจใช้เวลา 2-5 นาที'}
              </p>

              <div className="mb-4">
                <Progress value={analysisStatus === 'uploading' ? uploadProgress : 50} className="h-2" />
              </div>
              <p className="text-zinc-500 text-sm">
                {analysisStatus === 'uploading' ? `${uploadProgress}%` : 'กำลังประมวลผล...'}
              </p>
            </div>
          </Card>
        )}

        {/* Error State */}
        {analysisStatus === 'error' && (
          <Card className="max-w-2xl mx-auto bg-rose-900/10 border-rose-500/20 p-8 rounded-3xl">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-rose-500/10 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-rose-400" />
              </div>

              <h3 className="text-2xl font-semibold mb-2 text-rose-400">เกิดข้อผิดพลาด</h3>
              <p className="text-zinc-400 mb-6">{error}</p>

              <Button
                onClick={resetAnalysis}
                className="bg-white/10 hover:bg-white/20 rounded-full px-6"
              >
                ลองใหม่อีกครั้ง
              </Button>
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisStatus === 'complete' && gameAnalysis && (
          <div className="space-y-6">
            {/* Success Header */}
            <Card className="bg-emerald-900/10 border-emerald-500/20 p-6 rounded-3xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-emerald-400">วิเคราะห์เสร็จสิ้น!</h3>
                  <p className="text-zinc-400">{gameAnalysis.video_filename}</p>
                </div>
                <Button
                  onClick={resetAnalysis}
                  variant="outline"
                  className="rounded-full border-white/10"
                >
                  วิเคราะห์ใหม่
                </Button>
              </div>
            </Card>

            {/* Overall Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[#121214] border-white/5 p-5 rounded-2xl text-center">
                <Target className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-zinc-400 text-sm mb-1">ท่าทางเฉลี่ย</p>
                <p className="text-3xl font-bold text-primary">{gameAnalysis.overall_technique}/10</p>
              </Card>
              <Card className="bg-[#121214] border-white/5 p-5 rounded-2xl text-center">
                <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm mb-1">ฟุตเวิร์คเฉลี่ย</p>
                <p className="text-3xl font-bold text-blue-400">{gameAnalysis.overall_footwork}/10</p>
              </Card>
              <Card className="bg-[#121214] border-white/5 p-5 rounded-2xl text-center">
                <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm mb-1">ช่วงเล่นดี</p>
                <p className="text-3xl font-bold text-emerald-400">{gameAnalysis.good_periods?.length || 0}</p>
              </Card>
              <Card className="bg-[#121214] border-white/5 p-5 rounded-2xl text-center">
                <TrendingDown className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm mb-1">ช่วงต้องปรับปรุง</p>
                <p className="text-3xl font-bold text-rose-400">{gameAnalysis.weak_periods?.length || 0}</p>
              </Card>
            </div>

            {/* Game Summary */}
            <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4">📝 สรุปภาพรวมการแข่งขัน</h3>
              <p className="text-zinc-300 leading-relaxed">{gameAnalysis.game_summary}</p>
            </Card>

            {/* Timeline */}
            {gameAnalysis.timeline && gameAnalysis.timeline.length > 0 && (
              <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">⏱️ Timeline การแข่งขัน</h3>
                <div className="space-y-3">
                  {gameAnalysis.timeline.map((period, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-2xl border-l-4 ${
                        period.performance === 'good' 
                          ? 'bg-emerald-500/10 border-emerald-500' 
                          : period.performance === 'poor'
                          ? 'bg-rose-500/10 border-rose-500'
                          : 'bg-white/5 border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`rounded-full ${
                          period.performance === 'good' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : period.performance === 'poor'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-white/10 text-zinc-400'
                        }`}>
                          {period.time_range}
                        </Badge>
                        <span className={`text-sm font-medium ${
                          period.performance === 'good' ? 'text-emerald-400' :
                          period.performance === 'poor' ? 'text-rose-400' : 'text-zinc-400'
                        }`}>
                          {period.performance === 'good' ? '✅ เล่นดี' :
                           period.performance === 'poor' ? '⚠️ ต้องปรับปรุง' : '➡️ ปกติ'}
                        </span>
                      </div>
                      <p className="text-zinc-300 text-sm">{period.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Patterns Found */}
            {gameAnalysis.patterns && gameAnalysis.patterns.length > 0 && (
              <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">🔄 Pattern ที่พบ</h3>
                <div className="space-y-3">
                  {gameAnalysis.patterns.map((pattern, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          pattern.type === 'weakness' ? 'bg-rose-500/20' : 'bg-primary/20'
                        }`}>
                          {pattern.type === 'weakness' ? '⚠️' : '💪'}
                        </div>
                        <div>
                          <p className="font-medium text-white">{pattern.title}</p>
                          <p className="text-zinc-400 text-sm mt-1">{pattern.description}</p>
                          {pattern.frequency && (
                            <p className="text-zinc-500 text-xs mt-2">เกิดขึ้น {pattern.frequency} ครั้ง</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recommendations */}
            {gameAnalysis.recommendations && gameAnalysis.recommendations.length > 0 && (
              <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">💡 คำแนะนำสำหรับเกมถัดไป</h3>
                <div className="space-y-2">
                  {gameAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                      <Badge className="bg-primary text-black rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                        {index + 1}
                      </Badge>
                      <p className="text-zinc-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameAnalysisPage;
