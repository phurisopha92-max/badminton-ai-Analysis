import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ArrowRight, TrendingUp, Target, Activity, Clock, FileVideo, 
  BarChart3, GitCompare, Upload, Loader2, Trophy, AlertTriangle,
  ChevronRight, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardPage = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    avgTechnique: 0,
    avgFootwork: 0,
    improvement: { technique: 0, footwork: 0 }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/analyses`);
      const data = response.data;
      setAnalyses(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractScore = (scoreStr) => {
    if (!scoreStr || scoreStr === 'N/A') return null;
    const match = scoreStr.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) return;

    const validTechnique = data.map(a => extractScore(a.technique_score)).filter(s => s !== null);
    const validFootwork = data.map(a => extractScore(a.footwork_score)).filter(s => s !== null);

    const avgTechnique = validTechnique.length > 0 
      ? (validTechnique.reduce((a, b) => a + b, 0) / validTechnique.length).toFixed(1)
      : 0;
    const avgFootwork = validFootwork.length > 0 
      ? (validFootwork.reduce((a, b) => a + b, 0) / validFootwork.length).toFixed(1)
      : 0;

    // Calculate improvement (first vs last)
    let techImprovement = 0;
    let footImprovement = 0;
    if (data.length >= 2) {
      const oldest = data[data.length - 1];
      const newest = data[0];
      const oldTech = extractScore(oldest.technique_score);
      const newTech = extractScore(newest.technique_score);
      const oldFoot = extractScore(oldest.footwork_score);
      const newFoot = extractScore(newest.footwork_score);
      
      if (oldTech && newTech) techImprovement = (newTech - oldTech).toFixed(1);
      if (oldFoot && newFoot) footImprovement = (newFoot - oldFoot).toFixed(1);
    }

    setStats({
      totalAnalyses: data.length,
      avgTechnique,
      avgFootwork,
      improvement: { technique: techImprovement, footwork: footImprovement }
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const latestAnalysis = analyses[0];
  const recentAnalyses = analyses.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">กำลังโหลด Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="dashboard-title">
                🏸 Dashboard
              </h1>
              <p className="text-zinc-400 mt-2">สรุปภาพรวมการวิเคราะห์ของคุณ</p>
            </div>
            <Button
              onClick={() => navigate('/')}
              className="bg-primary text-black hover:bg-primary/90 font-bold px-6 py-3 rounded-full"
              data-testid="upload-new-btn"
            >
              <Upload className="w-4 h-4 mr-2" />
              อัปโหลดใหม่
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {analyses.length === 0 ? (
          /* No Data State */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileVideo className="w-12 h-12 text-zinc-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-zinc-400">
              ยังไม่มีการวิเคราะห์
            </h3>
            <p className="text-zinc-500 mb-8">
              เริ่มต้นโดยการอัปโหลดวิดีโอแบดมินตันของคุณ
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-6 rounded-full text-lg"
            >
              อัปโหลดวิดีโอแรก
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-[#121214] border-white/5 p-5 rounded-2xl" data-testid="stat-total">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FileVideo className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-zinc-400 text-sm">วิเคราะห์แล้ว</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalAnalyses}</p>
                <p className="text-zinc-500 text-xs">ครั้ง</p>
              </Card>

              <Card className="bg-[#121214] border-white/5 p-5 rounded-2xl" data-testid="stat-avg-tech">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-zinc-400 text-sm">ท่าทางเฉลี่ย</span>
                </div>
                <p className="text-3xl font-bold text-primary">{stats.avgTechnique}/10</p>
                <p className={`text-xs ${stats.improvement.technique > 0 ? 'text-emerald-400' : stats.improvement.technique < 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                  {stats.improvement.technique > 0 ? '+' : ''}{stats.improvement.technique} จากครั้งแรก
                </p>
              </Card>

              <Card className="bg-[#121214] border-white/5 p-5 rounded-2xl" data-testid="stat-avg-foot">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-zinc-400 text-sm">ฟุตเวิร์คเฉลี่ย</span>
                </div>
                <p className="text-3xl font-bold text-blue-400">{stats.avgFootwork}/10</p>
                <p className={`text-xs ${stats.improvement.footwork > 0 ? 'text-emerald-400' : stats.improvement.footwork < 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                  {stats.improvement.footwork > 0 ? '+' : ''}{stats.improvement.footwork} จากครั้งแรก
                </p>
              </Card>

              <Card className="bg-[#121214] border-white/5 p-5 rounded-2xl" data-testid="stat-trend">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-zinc-400 text-sm">แนวโน้ม</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400">
                  {(parseFloat(stats.improvement.technique) + parseFloat(stats.improvement.footwork)) > 0 ? '📈' : 
                   (parseFloat(stats.improvement.technique) + parseFloat(stats.improvement.footwork)) < 0 ? '📉' : '➡️'}
                </p>
                <p className="text-zinc-500 text-xs">
                  {(parseFloat(stats.improvement.technique) + parseFloat(stats.improvement.footwork)) > 0 ? 'กำลังพัฒนา' : 
                   (parseFloat(stats.improvement.technique) + parseFloat(stats.improvement.footwork)) < 0 ? 'ต้องปรับปรุง' : 'คงที่'}
                </p>
              </Card>
            </div>

            {/* Latest Analysis */}
            {latestAnalysis && (
              <Card 
                className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20 p-6 rounded-3xl mb-8 cursor-pointer hover:border-primary/40 transition-all"
                onClick={() => navigate(`/analysis/${latestAnalysis.id}`)}
                data-testid="latest-analysis-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">ผลวิเคราะห์ล่าสุด</h3>
                      <p className="text-zinc-400 text-sm">{latestAnalysis.video_filename}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <span className="text-sm">ดูรายละเอียด</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-zinc-400 text-xs mb-1">ท่าทาง</p>
                    <p className="text-xl font-bold text-primary">{extractScore(latestAnalysis.technique_score) || '-'}/10</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-zinc-400 text-xs mb-1">ฟุตเวิร์ค</p>
                    <p className="text-xl font-bold text-blue-400">{extractScore(latestAnalysis.footwork_score) || '-'}/10</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-zinc-400 text-xs mb-1">จุดแข็ง</p>
                    <p className="text-xl font-bold text-emerald-400">{latestAnalysis.strengths?.length || 0}</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-zinc-400 text-xs mb-1">จุดอ่อน</p>
                    <p className="text-xl font-bold text-rose-400">{latestAnalysis.weaknesses?.length || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 text-zinc-500 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(latestAnalysis.created_at)}</span>
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Button
                onClick={() => navigate('/progress')}
                variant="outline"
                className="h-auto py-4 rounded-2xl border-white/10 hover:border-primary/30 hover:bg-primary/5 flex flex-col items-center gap-2"
                data-testid="quick-progress"
              >
                <BarChart3 className="w-6 h-6 text-primary" />
                <span>📊 ดูพัฒนาการ</span>
              </Button>

              <Button
                onClick={() => navigate('/compare')}
                variant="outline"
                className="h-auto py-4 rounded-2xl border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 flex flex-col items-center gap-2"
                data-testid="quick-compare"
              >
                <GitCompare className="w-6 h-6 text-blue-400" />
                <span>🎬 เปรียบเทียบ</span>
              </Button>

              <Button
                onClick={() => navigate('/history')}
                variant="outline"
                className="h-auto py-4 rounded-2xl border-white/10 hover:border-purple-500/30 hover:bg-purple-500/5 flex flex-col items-center gap-2"
                data-testid="quick-history"
              >
                <Clock className="w-6 h-6 text-purple-400" />
                <span>📋 ประวัติทั้งหมด</span>
              </Button>

              <Button
                onClick={() => navigate('/game-analysis')}
                variant="outline"
                className="h-auto py-4 rounded-2xl border-white/10 hover:border-yellow-500/30 hover:bg-yellow-500/5 flex flex-col items-center gap-2"
                data-testid="quick-game"
              >
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span>🏆 วิเคราะห์ทั้งเกม</span>
              </Button>
            </div>

            {/* Recent Analyses */}
            <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl" data-testid="recent-analyses">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">การวิเคราะห์ล่าสุด</h3>
                <Button
                  onClick={() => navigate('/history')}
                  variant="ghost"
                  className="text-zinc-400 hover:text-white rounded-full"
                >
                  ดูทั้งหมด
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="space-y-3">
                {recentAnalyses.map((analysis, index) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 cursor-pointer transition-all"
                    onClick={() => navigate(`/analysis/${analysis.id}`)}
                    data-testid={`recent-${index}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white truncate max-w-[200px]">{analysis.video_filename}</p>
                        <p className="text-xs text-zinc-500">{formatDate(analysis.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/20 text-primary border-0 rounded-full">
                        {extractScore(analysis.technique_score) || '-'}/10
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-400 border-0 rounded-full">
                        {extractScore(analysis.footwork_score) || '-'}/10
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
