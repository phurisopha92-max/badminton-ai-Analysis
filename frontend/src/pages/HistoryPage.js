import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Calendar, FileVideo, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HistoryPage = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const response = await axios.get(`${API}/analyses`);
      setAnalyses(response.data);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      setError('ไม่สามารถโหลดประวัติได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">กำลังโหลดประวัติ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="border-b border-white/5">
        <div className="container mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-zinc-400 hover:text-white rounded-full"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ย้อนกลับ
          </Button>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="history-title">
            ประวัติการวิเคราะห์
          </h1>
          <p className="text-zinc-400 mt-2">ดูผลการวิเคราะห์ย้อนหลังทั้งหมด</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <p className="text-zinc-400">{error}</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-12" data-testid="no-history">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileVideo className="w-10 h-10 text-zinc-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-zinc-400">
              ยังไม่มีประวัติการวิเคราะห์
            </h3>
            <p className="text-zinc-500 mb-8">
              เริ่มต้นโดยการอัปโหลดวิดีโอแบดมินตันของคุณ
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-6 rounded-full shadow-[0_0_20px_rgba(204,255,0,0.15)] hover:shadow-[0_0_30px_rgba(204,255,0,0.25)] transition-all"
              data-testid="upload-first-button"
            >
              อัปโหลดวิดีโอ
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyses.map((analysis, index) => (
              <Card
                key={analysis.id}
                className="bg-[#121214] border-white/5 p-6 rounded-3xl hover:border-primary/30 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-primary/5"
                onClick={() => navigate(`/analysis/${analysis.id}`)}
                data-testid={`analysis-card-${index}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    <FileVideo className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate mb-1" data-testid={`analysis-filename-${index}`}>
                      {analysis.video_filename}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar className="w-3 h-3" />
                      <span data-testid={`analysis-date-${index}`}>{formatDate(analysis.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl">
                    <span className="text-sm text-zinc-400">ท่าทาง</span>
                    <Badge className="bg-primary/10 text-primary border-0 rounded-full text-xs" data-testid={`analysis-technique-${index}`}>
                      {analysis.technique_score || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl">
                    <span className="text-sm text-zinc-400">ฟุตเวิร์ค</span>
                    <Badge className="bg-blue-500/10 text-blue-400 border-0 rounded-full text-xs" data-testid={`analysis-footwork-${index}`}>
                      {analysis.footwork_score || 'N/A'}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="text-xs text-zinc-500 mb-2 font-medium">จุดแข็ง</div>
                  <div className="text-sm text-zinc-300 line-clamp-2 leading-relaxed" data-testid={`analysis-strengths-${index}`}>
                    {analysis.strengths && analysis.strengths.length > 0
                      ? analysis.strengths.join(', ')
                      : 'ไม่มีข้อมูล'}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
