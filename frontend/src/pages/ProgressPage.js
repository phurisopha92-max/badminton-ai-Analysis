import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { TrendingUp, BarChart3, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProgressPage = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const response = await axios.get(`${API}/analyses`);
      setAnalyses(response.data);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // Extract numeric score from string like "7/10" or "6.5/10"
  const extractScore = (scoreStr) => {
    if (!scoreStr || scoreStr === 'N/A') return null;
    const match = scoreStr.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  };

  // Prepare chart data
  const prepareChartData = () => {
    return analyses
      .slice()
      .reverse() // Oldest first
      .map((analysis, index) => ({
        name: `#${index + 1}`,
        date: new Date(analysis.created_at).toLocaleDateString('th-TH', { 
          day: 'numeric', 
          month: 'short' 
        }),
        technique: extractScore(analysis.technique_score),
        footwork: extractScore(analysis.footwork_score),
        filename: analysis.video_filename
      }))
      .filter(item => item.technique !== null || item.footwork !== null);
  };

  const chartData = prepareChartData();

  // Calculate improvement
  const calculateImprovement = (field) => {
    if (chartData.length < 2) return null;
    const first = chartData[0][field];
    const last = chartData[chartData.length - 1][field];
    if (first === null || last === null) return null;
    return (last - first).toFixed(1);
  };

  const techniqueImprovement = calculateImprovement('technique');
  const footworkImprovement = calculateImprovement('footwork');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="border-b border-white/5">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="progress-title">
            📊 พัฒนาการของคุณ
          </h1>
          <p className="text-zinc-400 mt-2">ติดตามความก้าวหน้าจากการวิเคราะห์ทั้งหมด</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <p className="text-zinc-400">{error}</p>
          </div>
        ) : chartData.length < 2 ? (
          <div className="text-center py-12" data-testid="not-enough-data">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-zinc-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-zinc-400">
              ยังไม่มีข้อมูลเพียงพอ
            </h3>
            <p className="text-zinc-500 mb-8">
              ต้องมีการวิเคราะห์อย่างน้อย 2 ครั้ง จึงจะแสดงกราฟพัฒนาการได้
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-6 rounded-full"
              data-testid="upload-button"
            >
              อัปโหลดวิดีโอ
            </Button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl" data-testid="total-analyses-card">
                <p className="text-zinc-400 text-sm mb-1">จำนวนการวิเคราะห์</p>
                <p className="text-4xl font-bold text-white">{chartData.length}</p>
                <p className="text-zinc-500 text-sm mt-1">ครั้ง</p>
              </Card>

              <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl" data-testid="technique-improvement-card">
                <p className="text-zinc-400 text-sm mb-1">พัฒนาการท่าทาง</p>
                <p className={`text-4xl font-bold ${
                  techniqueImprovement > 0 ? 'text-emerald-400' : 
                  techniqueImprovement < 0 ? 'text-rose-400' : 'text-zinc-400'
                }`}>
                  {techniqueImprovement !== null ? (
                    <>
                      {techniqueImprovement > 0 ? '+' : ''}{techniqueImprovement}
                    </>
                  ) : '-'}
                </p>
                <p className="text-zinc-500 text-sm mt-1">คะแนน (เทียบครั้งแรก)</p>
              </Card>

              <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl" data-testid="footwork-improvement-card">
                <p className="text-zinc-400 text-sm mb-1">พัฒนาการฟุตเวิร์ค</p>
                <p className={`text-4xl font-bold ${
                  footworkImprovement > 0 ? 'text-emerald-400' : 
                  footworkImprovement < 0 ? 'text-rose-400' : 'text-zinc-400'
                }`}>
                  {footworkImprovement !== null ? (
                    <>
                      {footworkImprovement > 0 ? '+' : ''}{footworkImprovement}
                    </>
                  ) : '-'}
                </p>
                <p className="text-zinc-500 text-sm mt-1">คะแนน (เทียบครั้งแรก)</p>
              </Card>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-zinc-400">แสดงกราฟ:</span>
              <div className="flex bg-white/5 rounded-full p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChartType('line')}
                  className={`rounded-full px-4 ${
                    chartType === 'line' 
                      ? 'bg-primary text-black' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  data-testid="line-chart-btn"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Line
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChartType('bar')}
                  className={`rounded-full px-4 ${
                    chartType === 'bar' 
                      ? 'bg-primary text-black' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  data-testid="bar-chart-btn"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Bar
                </Button>
              </div>
            </div>

            {/* Chart */}
            <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl mb-10" data-testid="progress-chart">
              <h3 className="text-xl font-bold mb-6">กราฟพัฒนาการคะแนน</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666" 
                        tick={{ fill: '#999', fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        stroke="#666" 
                        tick={{ fill: '#999', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid #333',
                          borderRadius: '12px'
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="technique" 
                        name="ท่าทาง"
                        stroke="#ccff00" 
                        strokeWidth={3}
                        dot={{ fill: '#ccff00', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="footwork" 
                        name="ฟุตเวิร์ค"
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666" 
                        tick={{ fill: '#999', fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        stroke="#666" 
                        tick={{ fill: '#999', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid #333',
                          borderRadius: '12px'
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="technique" 
                        name="ท่าทาง"
                        fill="#ccff00" 
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        dataKey="footwork" 
                        name="ฟุตเวิร์ค"
                        fill="#3b82f6" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Analysis History Table */}
            <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl" data-testid="history-table">
              <h3 className="text-xl font-bold mb-6">ประวัติการวิเคราะห์</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-zinc-400 font-medium">#</th>
                      <th className="text-left py-3 px-4 text-zinc-400 font-medium">วันที่</th>
                      <th className="text-left py-3 px-4 text-zinc-400 font-medium">ไฟล์</th>
                      <th className="text-center py-3 px-4 text-zinc-400 font-medium">ท่าทาง</th>
                      <th className="text-center py-3 px-4 text-zinc-400 font-medium">ฟุตเวิร์ค</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((item, index) => (
                      <tr 
                        key={index} 
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4 text-zinc-500">{index + 1}</td>
                        <td className="py-3 px-4 text-white">{item.date}</td>
                        <td className="py-3 px-4 text-zinc-400 truncate max-w-[200px]">
                          {item.filename}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                            {item.technique || '-'}/10
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                            {item.footwork || '-'}/10
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
