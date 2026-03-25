import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FileCheck, Loader2, AlertCircle, Play, Target, Activity,
  CheckCircle, XCircle, Lightbulb, ArrowRight, FileVideo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CurrentAnalysisPage = () => {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestAnalysis = async () => {
      try {
        const response = await axios.get(`${API}/analyses`);
        if (response.data && response.data.length > 0) {
          const sorted = response.data.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          // Fetch full details of the latest analysis
          const detailResponse = await axios.get(`${API}/analyses/${sorted[0].id}`);
          setAnalysis(detailResponse.data);
        }
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };
    fetchLatestAnalysis();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-primary';
    if (score >= 4) return 'text-yellow-400';
    return 'text-rose-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-zinc-400">กำลังโหลดผลวิเคราะห์...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileVideo className="w-10 h-10 text-zinc-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">ยังไม่มีผลวิเคราะห์</h2>
            <p className="text-zinc-400 mb-8">อัปโหลดวิดีโอเพื่อเริ่มต้นวิเคราะห์</p>
            <Button
              onClick={() => navigate('/')}
              className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-6 rounded-full"
            >
              อัปโหลดวิดีโอ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                <FileCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  ผลการวิเคราะห์
                </h1>
                <p className="text-zinc-400 mt-1">
                  {analysis.filename} • {formatDate(analysis.created_at)}
                </p>
              </div>
            </div>
            
            {/* Match Type Badge */}
            {analysis.analysis_type && (
              <Badge 
                className={`px-4 py-2 text-sm font-bold rounded-full ${
                  analysis.analysis_type === 'เดี่ยว' 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                {analysis.analysis_type === 'เดี่ยว' ? '🏸 เดี่ยว' : '👥 คู่'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Scores Section */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-6 h-6 text-primary" />
              <span className="text-zinc-400">คะแนนท่าทาง</span>
            </div>
            <p className={`text-5xl font-bold ${getScoreColor(analysis.technique_score)}`}>
              {typeof analysis.technique_score === 'number' ? analysis.technique_score.toFixed(1) : '-'}
              <span className="text-xl text-zinc-500">/10</span>
            </p>
          </Card>
          
          <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-6 h-6 text-blue-400" />
              <span className="text-zinc-400">คะแนนฟุตเวิร์ค</span>
            </div>
            <p className={`text-5xl font-bold ${getScoreColor(analysis.footwork_score)}`}>
              {typeof analysis.footwork_score === 'number' ? analysis.footwork_score.toFixed(1) : '-'}
              <span className="text-xl text-zinc-500">/10</span>
            </p>
          </Card>
        </div>

        {/* Video Player */}
        {analysis.video_id && (
          <Card className="bg-[#121214] border-white/5 p-4 rounded-3xl mb-8">
            <video
              controls
              className="w-full rounded-2xl"
              src={`${API}/videos/${analysis.video_id}`}
            >
              เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
            </video>
          </Card>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <Card className="bg-emerald-900/10 border-emerald-500/20 p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl font-bold text-emerald-400">จุดแข็ง</h3>
            </div>
            <ul className="space-y-3">
              {analysis.strengths?.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span className="text-zinc-300">{strength}</span>
                </li>
              )) || <li className="text-zinc-500">ไม่มีข้อมูล</li>}
            </ul>
          </Card>

          {/* Weaknesses */}
          <Card className="bg-rose-900/10 border-rose-500/20 p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-rose-400" />
              <h3 className="text-xl font-bold text-rose-400">จุดที่ต้องปรับปรุง</h3>
            </div>
            <ul className="space-y-3">
              {analysis.weaknesses?.map((weakness, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-rose-400 mt-1">•</span>
                  <span className="text-zinc-300">{weakness}</span>
                </li>
              )) || <li className="text-zinc-500">ไม่มีข้อมูล</li>}
            </ul>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="bg-blue-900/10 border-blue-500/20 p-6 rounded-3xl mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-blue-400">คำแนะนำ</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
            {analysis.recommendations || 'ไม่มีคำแนะนำ'}
          </p>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => navigate('/')}
            className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-6 rounded-full"
          >
            อัปโหลดวิดีโอใหม่
          </Button>
          <Button
            onClick={() => navigate(`/analysis/${analysis.id}`)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 py-6"
          >
            ดูรายละเอียดเพิ่มเติม
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CurrentAnalysisPage;
