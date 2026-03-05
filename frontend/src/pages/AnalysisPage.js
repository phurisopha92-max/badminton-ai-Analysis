import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, TrendingUp, Target, Activity, AlertCircle, Loader2, Play, Zap, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalysis();
    fetchTrainingPlan();
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      const response = await axios.get(`${API}/analyses/${id}`);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setError('ไม่สามารถโหลดข้อมูลการวิเคราะห์ได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainingPlan = async () => {
    try {
      const response = await axios.get(`${API}/training-plans/${id}`);
      setTrainingPlan(response.data);
    } catch (error) {
      console.log('No training plan found');
    }
  };

  const generateTrainingPlan = async () => {
    setGeneratingPlan(true);
    try {
      const response = await axios.post(`${API}/training-plan?analysis_id=${id}`);
      setTrainingPlan(response.data);
    } catch (error) {
      console.error('Error generating training plan:', error);
      alert('เกิดข้อผิดพลาดในการสร้างแผนฝึกซ้อม');
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
          <p className="text-gray-400 mb-4">{error || 'ไม่พบข้อมูลการวิเคราะห์'}</p>
          <Button onClick={() => navigate('/')} data-testid="back-home-button">
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
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

          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight" data-testid="analysis-title">
            ผลการวิเคราะห์
          </h1>
          <p className="text-gray-400 mt-2" data-testid="video-filename">{analysis.video_filename}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Video Player Section */}
        {analysis.video_id && (
          <Card className="bg-[#0A0A0A] border-white/10 p-6 rounded-sm mb-12" data-testid="video-player-card">
            <h3 className="font-heading text-2xl uppercase mb-6">วิดีโอที่วิเคราะห์</h3>
            <div className="relative bg-black rounded-sm overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <video
                controls
                className="absolute inset-0 w-full h-full"
                data-testid="video-player"
                src={`${API}/videos/${analysis.video_id}`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Scores */}
          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm" data-testid="technique-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-xl uppercase mb-2">ท่าทาง</h3>
                <p className="text-2xl font-bold text-primary mb-2" data-testid="technique-score">
                  {analysis.technique_score}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm" data-testid="footwork-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-sm flex items-center justify-center flex-shrink-0">
                <Activity className="w-6 h-6 text-secondary" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-xl uppercase mb-2">ฟุตเวิร์ค</h3>
                <p className="text-2xl font-bold text-secondary mb-2" data-testid="footwork-score">
                  {analysis.footwork_score}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm" data-testid="strengths-card">
            <h3 className="font-heading text-2xl uppercase mb-6 text-primary">จุดแข็ง</h3>
            <div className="space-y-3">
              {analysis.strengths && analysis.strengths.length > 0 ? (
                analysis.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3" data-testid={`strength-${index}`}>
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-gray-300">{strength}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">ไม่มีข้อมูล</p>
              )}
            </div>
          </Card>

          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm" data-testid="weaknesses-card">
            <h3 className="font-heading text-2xl uppercase mb-6 text-accent">จุดอ่อน</h3>
            <div className="space-y-3">
              {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                analysis.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-start gap-3" data-testid={`weakness-${index}`}>
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <p className="text-gray-300">{weakness}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">ไม่มีข้อมูล</p>
              )}
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm mb-12" data-testid="recommendations-card">
          <h3 className="font-heading text-2xl uppercase mb-6">คำแนะนำ</h3>
          <div className="space-y-4">
            {analysis.recommendations && analysis.recommendations.length > 0 ? (
              analysis.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3" data-testid={`recommendation-${index}`}>
                  <Badge className="bg-white/5 text-white border border-white/10 rounded-none px-3 py-1 text-xs font-mono uppercase tracking-wider">
                    {index + 1}
                  </Badge>
                  <p className="text-gray-300 flex-1">{rec}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">ไม่มีข้อมูล</p>
            )}
          </div>
        </Card>

        {/* Timeline Analysis */}
        {analysis.timeline_analysis && analysis.timeline_analysis.length > 0 && (
          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm mb-12" data-testid="timeline-card">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-primary" strokeWidth={1.5} />
              <h3 className="font-heading text-2xl uppercase">การวิเคราะห์ตามช่วงเวลา</h3>
            </div>
            <div className="space-y-4">
              {analysis.timeline_analysis.map((item, index) => (
                <div key={index} className="border border-white/10 p-6 rounded-sm hover:border-primary/30 transition-colors" data-testid={`timeline-${index}`}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-primary/10 text-primary border-primary/30 rounded-none" data-testid={`timeline-time-${index}`}>
                      {item.time_range}
                    </Badge>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{item.action}</span>
                  </div>
                  <p className="text-gray-300" data-testid={`timeline-assessment-${index}`}>{item.assessment}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Detailed Analysis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Positioning Analysis */}
          {analysis.positioning_analysis && (
            <Card className="bg-[#0A0A0A] border-white/10 p-6 rounded-sm" data-testid="positioning-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-lg uppercase">การวางตำแหน่ง</h3>
              </div>
              <p className="text-gray-300 text-sm" data-testid="positioning-text">{analysis.positioning_analysis}</p>
            </Card>
          )}

          {/* Power Generation */}
          {analysis.power_generation && (
            <Card className="bg-[#0A0A0A] border-white/10 p-6 rounded-sm" data-testid="power-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-sm flex items-center justify-center">
                  <Zap className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-lg uppercase">การใช้พลัง</h3>
              </div>
              <p className="text-gray-300 text-sm" data-testid="power-text">{analysis.power_generation}</p>
            </Card>
          )}

          {/* Court Coverage */}
          {analysis.court_coverage && (
            <Card className="bg-[#0A0A0A] border-white/10 p-6 rounded-sm" data-testid="coverage-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-sm flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-lg uppercase">การครอบคลุมสนาม</h3>
              </div>
              <p className="text-gray-300 text-sm" data-testid="coverage-text">{analysis.court_coverage}</p>
            </Card>
          )}
        </div>

        {/* Full Analysis */}
        {analysis.full_analysis && (
          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm mb-12" data-testid="full-analysis-card">
            <h3 className="font-heading text-2xl uppercase mb-6">การวิเคราะห์โดยละเอียด</h3>
            <p className="text-gray-300 whitespace-pre-wrap" data-testid="full-analysis-text">{analysis.full_analysis}</p>
          </Card>
        )}

        {/* Training Plan */}
        {!trainingPlan ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <TrendingUp className="w-16 h-16 text-primary mx-auto mb-6" strokeWidth={1.5} />
              <h3 className="font-heading text-2xl uppercase mb-4">พร้อมพัฒนาเกมของคุณ?</h3>
              <p className="text-gray-400 mb-6">
                สร้างแผนการฝึกซ้อมที่ออกแบบมาเฉพาะสำหรับคุณ
              </p>
              <Button
                onClick={generateTrainingPlan}
                disabled={generatingPlan}
                className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest px-8 py-6 rounded-none skew-x-[-10deg] transition-transform hover:-translate-y-1"
                data-testid="generate-plan-button"
              >
                <span className="skew-x-[10deg]">
                  {generatingPlan ? 'กำลังสร้างแผน...' : 'สร้างแผนฝึกซ้อม'}
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm" data-testid="training-plan-card">
            <h3 className="font-heading text-3xl uppercase mb-6 text-primary" data-testid="training-plan-title">
              {trainingPlan.plan_title}
            </h3>

            <div className="flex gap-4 mb-8">
              <Badge className="bg-primary/10 text-primary border-primary/30 px-4 py-2" data-testid="plan-duration">
                {trainingPlan.duration_weeks} สัปดาห์
              </Badge>
              {trainingPlan.focus_areas && trainingPlan.focus_areas.map((area, index) => (
                <Badge key={index} className="bg-white/5 text-white border-white/10 px-4 py-2" data-testid={`focus-area-${index}`}>
                  {area}
                </Badge>
              ))}
            </div>

            <div className="space-y-6">
              {trainingPlan.exercises && trainingPlan.exercises.map((exercise, index) => (
                <div key={index} className="border border-white/10 p-6 rounded-sm hover:border-primary/30 transition-colors" data-testid={`exercise-${index}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge className="bg-white/5 text-white border-white/10 rounded-none mb-2" data-testid={`exercise-week-${index}`}>
                        สัปดาห์ {exercise.week} - {exercise.day}
                      </Badge>
                      <h4 className="font-heading text-xl uppercase" data-testid={`exercise-name-${index}`}>
                        {exercise.exercise_name}
                      </h4>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div data-testid={`exercise-duration-${index}`}>{exercise.duration_minutes} นาที</div>
                      {exercise.sets && exercise.reps && (
                        <div data-testid={`exercise-sets-${index}`}>{exercise.sets} เซ็ต × {exercise.reps} ครั้ง</div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-300" data-testid={`exercise-description-${index}`}>{exercise.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;