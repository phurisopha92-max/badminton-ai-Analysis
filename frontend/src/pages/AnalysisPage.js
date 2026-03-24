import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, TrendingUp, Target, Activity, AlertCircle, Loader2, Play, Zap, MapPin, Clock, Hand, Footprints, RotateCw, Move, Users, Shield, Swords, MessageSquare, BookOpen, Award, Download, GitCompare, BarChart3 } from "lucide-react";
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

  const fetchAnalysis = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/analyses/${id}`);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setError('ไม่สามารถโหลดข้อมูลการวิเคราะห์ได้');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTrainingPlan = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/training-plans/${id}`);
      setTrainingPlan(response.data);
    } catch (error) {
      console.log('No training plan found');
    }
  }, [id]);

  useEffect(() => {
    fetchAnalysis();
    fetchTrainingPlan();
  }, [fetchAnalysis, fetchTrainingPlan]);

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

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="analysis-title">
              ผลการวิเคราะห์
            </h1>
            {/* Match Type Badge */}
            {analysis.doubles_analysis && (
              <Badge 
                className={`text-base px-4 py-2 rounded-full ${
                  analysis.doubles_analysis.applicable 
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                    : 'bg-primary/20 text-primary border-primary/30'
                }`}
                data-testid="match-type-badge"
              >
                {analysis.doubles_analysis.applicable ? '🏸🏸 คู่' : '🏸 เดี่ยว'}
              </Badge>
            )}
          </div>
          <p className="text-zinc-400 mt-2" data-testid="video-filename">{analysis.video_filename}</p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {/* BWF Reference Badge */}
            <Link to="/reference" className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-900/20 border border-yellow-500/20 rounded-full hover:bg-yellow-900/30 hover:border-yellow-500/30 transition-all" data-testid="bwf-reference-link">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm">BWF Reference</span>
            </Link>
            
            {/* Export PDF Button */}
            <a 
              href={`${API}/export-pdf/${id}`}
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-900/20 border border-emerald-500/20 rounded-full hover:bg-emerald-900/30 hover:border-emerald-500/30 transition-all"
              data-testid="export-pdf-btn"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm">Export PDF</span>
            </a>
            
            {/* Progress Link */}
            <Link to="/progress" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900/20 border border-blue-500/20 rounded-full hover:bg-blue-900/30 hover:border-blue-500/30 transition-all" data-testid="progress-link">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm">Progress</span>
            </Link>
            
            {/* Compare Link */}
            <Link to="/compare" className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-900/20 border border-purple-500/20 rounded-full hover:bg-purple-900/30 hover:border-purple-500/30 transition-all" data-testid="compare-link">
              <GitCompare className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-sm">Compare</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Video Player Section */}
        {analysis.video_id && (
          <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl mb-12 overflow-hidden" data-testid="video-player-card">
            <h3 className="text-xl font-semibold mb-6">วิดีโอที่วิเคราะห์</h3>
            <div className="relative bg-black rounded-2xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Scores */}
          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl hover:border-primary/20 transition-all" data-testid="technique-card">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Target className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-zinc-400 mb-1">ท่าทาง</h3>
                <p className="text-2xl font-bold text-primary" data-testid="technique-score">
                  {analysis.technique_score}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl hover:border-blue-500/20 transition-all" data-testid="footwork-card">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Activity className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-zinc-400 mb-1">ฟุตเวิร์ค</h3>
                <p className="text-2xl font-bold text-blue-400" data-testid="footwork-score">
                  {analysis.footwork_score}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Technique Details */}
        {analysis.technique_details && Object.keys(analysis.technique_details).length > 0 && (
          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12" data-testid="technique-details-card">
            <h3 className="text-2xl font-bold mb-8 text-primary">รายละเอียดท่าทาง</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Object.entries(analysis.technique_details).map(([key, detail]) => (
                detail && detail.score !== "N/A" && (
                  <div key={key} className="bg-white/5 border border-white/5 p-5 rounded-2xl hover:border-primary/20 transition-all" data-testid={`tech-${key}`}>
                    {/* Header with score */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <h4 className="font-bold text-lg text-white capitalize">{key.replace(/_/g, ' ')}</h4>
                      <Badge className="bg-primary text-black font-bold rounded-full px-4 py-1 text-sm">{detail.score}</Badge>
                    </div>
                    
                    {/* BWF Reference */}
                    {detail.bwf_ref && (
                      <div className="mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-yellow-500 font-medium">{detail.bwf_ref}</span>
                      </div>
                    )}
                    
                    {/* Analysis - Main highlight */}
                    {detail.analysis && (
                      <div className="mb-4 p-4 bg-white/10 rounded-xl border-l-4 border-primary">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="text-sm text-primary font-semibold">ผลวิเคราะห์</span>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{detail.analysis}</p>
                      </div>
                    )}
                    
                    {/* Issues */}
                    {detail.issues && detail.issues.length > 0 && (
                      <div className="mb-3 p-3 bg-rose-500/10 rounded-xl border-l-4 border-rose-500">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          <span className="text-sm text-rose-400 font-semibold">ปัญหาที่พบ</span>
                        </div>
                        <ul className="text-sm text-zinc-300 space-y-1">
                          {detail.issues.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-rose-400 mt-1">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {detail.suggestions && detail.suggestions.length > 0 && (
                      <div className="p-3 bg-emerald-500/10 rounded-xl border-l-4 border-emerald-500">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-emerald-400 font-semibold">คำแนะนำ</span>
                        </div>
                        <ul className="text-sm text-zinc-300 space-y-1">
                          {detail.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-400 mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          </Card>
        )}

        {/* Footwork Details */}
        {analysis.footwork_details && Object.keys(analysis.footwork_details).length > 0 && (
          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12" data-testid="footwork-details-card">
            <h3 className="text-2xl font-bold mb-8 text-blue-400">รายละเอียดฟุตเวิร์ค</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Object.entries(analysis.footwork_details).map(([key, detail]) => (
                detail && detail.score !== "N/A" && (
                  <div key={key} className="bg-white/5 border border-white/5 p-5 rounded-2xl hover:border-blue-500/20 transition-all" data-testid={`footwork-${key}`}>
                    {/* Header with score */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <h4 className="font-bold text-lg text-white capitalize">{key.replace(/_/g, ' ')}</h4>
                      <Badge className="bg-blue-500 text-white font-bold rounded-full px-4 py-1 text-sm">{detail.score}</Badge>
                    </div>
                    
                    {/* BWF Reference */}
                    {detail.bwf_ref && (
                      <div className="mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-yellow-500 font-medium">{detail.bwf_ref}</span>
                      </div>
                    )}
                    
                    {/* Analysis - Main highlight */}
                    {detail.analysis && (
                      <div className="mb-4 p-4 bg-white/10 rounded-xl border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-2">
                          <Footprints className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-blue-400 font-semibold">ผลวิเคราะห์</span>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{detail.analysis}</p>
                      </div>
                    )}
                    
                    {/* Issues */}
                    {detail.issues && detail.issues.length > 0 && (
                      <div className="mb-3 p-3 bg-rose-500/10 rounded-xl border-l-4 border-rose-500">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          <span className="text-sm text-rose-400 font-semibold">ปัญหาที่พบ</span>
                        </div>
                        <ul className="text-sm text-zinc-300 space-y-1">
                          {detail.issues.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-rose-400 mt-1">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {detail.suggestions && detail.suggestions.length > 0 && (
                      <div className="p-3 bg-emerald-500/10 rounded-xl border-l-4 border-emerald-500">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-emerald-400 font-semibold">คำแนะนำ</span>
                        </div>
                        <ul className="text-sm text-zinc-300 space-y-1">
                          {detail.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-400 mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          </Card>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl" data-testid="strengths-card">
            <h3 className="text-xl font-bold mb-6 text-primary">จุดแข็ง</h3>
            <div className="space-y-3">
              {analysis.strengths && analysis.strengths.length > 0 ? (
                analysis.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl" data-testid={`strength-${index}`}>
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-zinc-300">{strength}</p>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500">ไม่มีข้อมูล</p>
              )}
            </div>
          </Card>

          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl" data-testid="weaknesses-card">
            <h3 className="text-xl font-bold mb-6 text-rose-400">จุดอ่อน</h3>
            <div className="space-y-3">
              {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                analysis.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-rose-500/5 rounded-xl" data-testid={`weakness-${index}`}>
                    <div className="w-2 h-2 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                    <p className="text-zinc-300">{weakness}</p>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500">ไม่มีข้อมูล</p>
              )}
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12" data-testid="recommendations-card">
          <h3 className="text-xl font-bold mb-6">คำแนะนำ</h3>
          <div className="space-y-3">
            {analysis.recommendations && analysis.recommendations.length > 0 ? (
              analysis.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl" data-testid={`recommendation-${index}`}>
                  <Badge className="bg-primary/20 text-primary border-0 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                    {index + 1}
                  </Badge>
                  <p className="text-zinc-300 flex-1">{rec}</p>
                </div>
              ))
            ) : (
              <p className="text-zinc-500">ไม่มีข้อมูล</p>
            )}
          </div>
        </Card>

        {/* Timeline Analysis */}
        {analysis.timeline_analysis && analysis.timeline_analysis.length > 0 && (
          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12" data-testid="timeline-card">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-xl font-bold">การวิเคราะห์ตามช่วงเวลา</h3>
            </div>
            <div className="space-y-4">
              {analysis.timeline_analysis.map((item, index) => (
                <div key={index} className="bg-white/5 p-5 rounded-2xl hover:border-primary/20 transition-all" data-testid={`timeline-${index}`}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-primary/20 text-primary border-0 rounded-full" data-testid={`timeline-time-${index}`}>
                      {item.time_range}
                    </Badge>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">{item.action}</span>
                  </div>
                  <p className="text-zinc-300" data-testid={`timeline-assessment-${index}`}>{item.assessment}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Detailed Analysis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Positioning Analysis */}
          {analysis.positioning_analysis && (
            <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl" data-testid="positioning-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold">การวางตำแหน่ง</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed" data-testid="positioning-text">{analysis.positioning_analysis}</p>
            </Card>
          )}

          {/* Power Generation */}
          {analysis.power_generation && (
            <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl" data-testid="power-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold">การใช้พลัง</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed" data-testid="power-text">{analysis.power_generation}</p>
            </Card>
          )}

          {/* Court Coverage */}
          {analysis.court_coverage && (
            <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl" data-testid="coverage-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-rose-400" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold">การครอบคลุมสนาม</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed" data-testid="coverage-text">{analysis.court_coverage}</p>
            </Card>
          )}
        </div>

        {/* Biomechanics Analysis */}
        {analysis.biomechanics && Object.keys(analysis.biomechanics).length > 0 && (
          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12" data-testid="biomechanics-card">
            <h3 className="text-2xl font-bold mb-8 text-purple-400">การวิเคราะห์ Biomechanics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Elbow Position */}
              {analysis.biomechanics.elbow_position && (
                <div className="bg-white/5 p-5 rounded-2xl hover:border-purple-500/20 transition-all" data-testid="bio-elbow-position">
                  <div className="flex items-center gap-3 mb-3">
                    <Hand className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">ตำแหน่งศอก</h4>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{analysis.biomechanics.elbow_position}</p>
                </div>
              )}

              {/* Elbow Angle */}
              {analysis.biomechanics.elbow_angle && (
                <div className="bg-white/5 p-5 rounded-2xl hover:border-purple-500/20 transition-all" data-testid="bio-elbow-angle">
                  <div className="flex items-center gap-3 mb-3">
                    <RotateCw className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">มุมศอก</h4>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{analysis.biomechanics.elbow_angle}</p>
                </div>
              )}

              {/* Body Rotation */}
              {analysis.biomechanics.body_rotation && (
                <div className="bg-white/5 p-5 rounded-2xl hover:border-purple-500/20 transition-all" data-testid="bio-body-rotation">
                  <div className="flex items-center gap-3 mb-3">
                    <RotateCw className="w-5 h-5 text-accent" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">การพลิกตัว</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.biomechanics.body_rotation}</p>
                </div>
              )}

              {/* Hip Rotation */}
              {analysis.biomechanics.hip_rotation && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-primary/30 transition-colors" data-testid="bio-hip-rotation">
                  <div className="flex items-center gap-3 mb-3">
                    <Move className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">การหมุนสะโพก</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.biomechanics.hip_rotation}</p>
                </div>
              )}

              {/* Shoulder Alignment */}
              {analysis.biomechanics.shoulder_alignment && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-primary/30 transition-colors" data-testid="bio-shoulder">
                  <div className="flex items-center gap-3 mb-3">
                    <Move className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">การจัดแนวไหล่</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.biomechanics.shoulder_alignment}</p>
                </div>
              )}

              {/* Feet Spacing */}
              {analysis.biomechanics.feet_spacing && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-primary/30 transition-colors" data-testid="bio-feet">
                  <div className="flex items-center gap-3 mb-3">
                    <Footprints className="w-5 h-5 text-accent" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">ระยะห่างเท้า</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.biomechanics.feet_spacing}</p>
                </div>
              )}

              {/* Knee Bend Depth */}
              {analysis.biomechanics.knee_bend_depth && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-primary/30 transition-colors" data-testid="bio-knee-depth">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">ระดับการย่อ</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.biomechanics.knee_bend_depth}</p>
                </div>
              )}

              {/* Knee Bend Timing */}
              {analysis.biomechanics.knee_bend_timing && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-primary/30 transition-colors" data-testid="bio-knee-timing">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">จังหวะการย่อ</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.biomechanics.knee_bend_timing}</p>
                </div>
              )}

              {/* Wrist Action */}
              {analysis.biomechanics.wrist_action && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-primary/30 transition-colors" data-testid="bio-wrist">
                  <div className="flex items-center gap-3 mb-3">
                    <Hand className="w-5 h-5 text-accent" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">การใช้ข้อมือ</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.biomechanics.wrist_action}</p>
                </div>
              )}

              {/* Grip Analysis */}
              {analysis.biomechanics.grip_analysis && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-primary/30 transition-colors" data-testid="bio-grip">
                  <div className="flex items-center gap-3 mb-3">
                    <Hand className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">การจับไม้</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.biomechanics.grip_analysis}</p>
                </div>
              )}

              {/* Weight Transfer */}
              {analysis.biomechanics.weight_transfer && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-primary/30 transition-colors" data-testid="bio-weight">
                  <div className="flex items-center gap-3 mb-3">
                    <Move className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">การถ่ายน้ำหนัก</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.biomechanics.weight_transfer}</p>
                </div>
              )}

              {/* Jump Technique */}
              {analysis.biomechanics.jump_technique && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-primary/30 transition-colors" data-testid="bio-jump">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="w-5 h-5 text-accent" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">เทคนิคกระโดด</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.biomechanics.jump_technique}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Doubles Analysis */}
        {analysis.doubles_analysis && analysis.doubles_analysis.applicable && (
          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm mb-12" data-testid="doubles-card">
            <div className="flex items-center gap-4 mb-8">
              <Users className="w-8 h-8 text-secondary" strokeWidth={1.5} />
              <h3 className="font-heading text-3xl uppercase text-secondary">การวิเคราะห์การเล่นคู่</h3>
              <Badge className="bg-secondary/20 text-secondary border-secondary">DOUBLES ONLY</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formation */}
              {analysis.doubles_analysis.formation && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-secondary/30 transition-colors" data-testid="doubles-formation">
                  <div className="flex items-center gap-3 mb-3">
                    <Swords className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">Formation</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.doubles_analysis.formation}</p>
                </div>
              )}

              {/* Rotation Quality */}
              {analysis.doubles_analysis.rotation_quality && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-secondary/30 transition-colors" data-testid="doubles-rotation">
                  <div className="flex items-center gap-3 mb-3">
                    <RotateCw className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">การหมุนเวียน</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.doubles_analysis.rotation_quality}</p>
                </div>
              )}

              {/* Partner Coordination */}
              {analysis.doubles_analysis.partner_coordination && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-secondary/30 transition-colors" data-testid="doubles-coordination">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-5 h-5 text-accent" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">การประสานงาน</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.doubles_analysis.partner_coordination}</p>
                </div>
              )}

              {/* Court Coverage Team */}
              {analysis.doubles_analysis.court_coverage_team && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-secondary/30 transition-colors" data-testid="doubles-coverage">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">ครอบคลุมสนาม</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.doubles_analysis.court_coverage_team}</p>
                </div>
              )}

              {/* Communication */}
              {analysis.doubles_analysis.communication && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-secondary/30 transition-colors" data-testid="doubles-communication">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageSquare className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">การสื่อสาร</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.doubles_analysis.communication}</p>
                </div>
              )}

              {/* Position Switching */}
              {analysis.doubles_analysis.position_switching && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-secondary/30 transition-colors" data-testid="doubles-switching">
                  <div className="flex items-center gap-3 mb-3">
                    <Move className="w-5 h-5 text-accent" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">การสลับตำแหน่ง</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.doubles_analysis.position_switching}</p>
                </div>
              )}

              {/* Gap Coverage */}
              {analysis.doubles_analysis.gap_coverage && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-secondary/30 transition-colors" data-testid="doubles-gap">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">การปิดช่องว่าง</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.doubles_analysis.gap_coverage}</p>
                </div>
              )}

              {/* Overlap Issues */}
              {analysis.doubles_analysis.overlap_issues && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-secondary/30 transition-colors" data-testid="doubles-overlap">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">ปัญหาทับซ้อน</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.doubles_analysis.overlap_issues}</p>
                </div>
              )}

              {/* Attack Defense Transition */}
              {analysis.doubles_analysis.attack_defense_transition && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-secondary/30 transition-colors" data-testid="doubles-transition">
                  <div className="flex items-center gap-3 mb-3">
                    <Swords className="w-5 h-5 text-accent" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">เปลี่ยนรุก-รับ</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.doubles_analysis.attack_defense_transition}</p>
                </div>
              )}

              {/* Front Back Balance */}
              {analysis.doubles_analysis.front_back_balance && (
                <div className="border border-white/10 p-6 rounded-sm hover:border-secondary/30 transition-colors" data-testid="doubles-balance">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <h4 className="font-heading text-lg uppercase">สมดุลหน้า-หลัง</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.doubles_analysis.front_back_balance}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Singles Info - Show when it's singles match */}
        {analysis.doubles_analysis && !analysis.doubles_analysis.applicable && (
          <Card className="bg-[#0A0A0A] border-white/10 p-8 rounded-sm mb-12 text-center" data-testid="singles-info">
            <div className="max-w-md mx-auto">
              <Target className="w-16 h-16 text-primary mx-auto mb-4" strokeWidth={1.5} />
              <h3 className="font-heading text-2xl uppercase mb-4 text-primary">การเล่นเดี่ยว</h3>
              <p className="text-gray-400">
                วิดีโอนี้เป็นการเล่นเดี่ยว การวิเคราะห์จะเน้นที่ทักษะส่วนบุคคล Biomechanics และการเคลื่อนไหวของผู้เล่นคนเดียว
              </p>
            </div>
          </Card>
        )}

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