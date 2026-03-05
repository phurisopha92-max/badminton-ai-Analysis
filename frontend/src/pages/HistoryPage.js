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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">กำลังโหลดประวัติ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="border-b border-white/10">
        <div className="container mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-gray-400 hover:text-white"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับหน้าหลัก
          </Button>

          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight" data-testid="history-title">
            ประวัติการวิเคราะห์
          </h1>
          <p className="text-gray-400 mt-2">ดูผลการวิเคราะห์ย้อนหลังทั้งหมด</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
            <p className="text-gray-400">{error}</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-12" data-testid="no-history">
            <FileVideo className="w-16 h-16 text-gray-600 mx-auto mb-6" strokeWidth={1.5} />
            <h3 className="font-heading text-2xl uppercase mb-4 text-gray-400">
              ยังไม่มีประวัติการวิเคราะห์
            </h3>
            <p className="text-gray-500 mb-6">
              เริ่มต้นโดยการอัปโหลดวิดีโอแบมินตันของคุณ
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest px-8 py-4"
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
                className="bg-[#0A0A0A] border-white/10 p-6 rounded-sm hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/analysis/${analysis.id}`)}
                data-testid={`analysis-card-${index}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <FileVideo className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg uppercase truncate mb-1" data-testid={`analysis-filename-${index}`}>
                      {analysis.video_filename}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span data-testid={`analysis-date-${index}`}>{formatDate(analysis.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">ท่าทาง</span>
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-xs" data-testid={`analysis-technique-${index}`}>
                      {analysis.technique_score || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">ฟุตเวิร์ค</span>
                    <Badge className="bg-secondary/10 text-secondary border-secondary/30 text-xs" data-testid={`analysis-footwork-${index}`}>
                      {analysis.footwork_score || 'N/A'}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="text-xs text-gray-500 mb-2">จุดแข็ง</div>
                  <div className="text-sm text-gray-300 line-clamp-2" data-testid={`analysis-strengths-${index}`}>
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