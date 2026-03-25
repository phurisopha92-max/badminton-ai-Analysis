import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { TrendingUp, Target, Activity, AlertCircle, Loader2, Hand, Footprints, RotateCw, Move, Users, Swords, MessageSquare, Award, Download, FileVideo, Share2, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CurrentAnalysisPage = () => {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [noUpload, setNoUpload] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [creatingShare, setCreatingShare] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    // Check localStorage for current analysis ID
    const storedId = localStorage.getItem('currentAnalysisId');
    
    if (!storedId) {
      setNoUpload(true);
      setLoading(false);
      return;
    }

    try {
      setAnalysisId(storedId);
      
      // Fetch full details
      const response = await axios.get(`${API}/analyses/${storedId}`);
      setAnalysis(response.data);
      
      // Try to fetch training plan
      try {
        const planResponse = await axios.get(`${API}/training-plans/${storedId}`);
        setTrainingPlan(planResponse.data);
      } catch (e) {
        console.log('No training plan found');
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      // If analysis not found, clear localStorage and show upload message
      localStorage.removeItem('currentAnalysisId');
      setNoUpload(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const generateTrainingPlan = async () => {
    if (!analysisId) return;
    setGeneratingPlan(true);
    try {
      const response = await axios.post(`${API}/training-plan?analysis_id=${analysisId}`);
      setTrainingPlan(response.data);
    } catch (error) {
      console.error('Error generating training plan:', error);
      alert('เกิดข้อผิดพลาดในการสร้างแผนฝึกซ้อม');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const createShareLink = async () => {
    if (!analysisId) return;
    setCreatingShare(true);
    try {
      const response = await axios.post(`${API}/share/create`, { analysis_id: analysisId });
      const shareUrl = `${window.location.origin}/shared/${response.data.share_id}`;
      setShareLink({
        ...response.data,
        url: shareUrl
      });
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('เกิดข้อผิดพลาดในการสร้างลิงก์แชร์');
    } finally {
      setCreatingShare(false);
    }
  };

  const copyShareLink = async () => {
    if (shareLink?.url) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareLink.url);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = shareLink.url;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = shareLink.url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          setCopiedShare(true);
          setTimeout(() => setCopiedShare(false), 2000);
        } catch (e) {
          alert(`ลิงก์แชร์: ${shareLink.url}`);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (noUpload || !analysis) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <FileVideo className="w-12 h-12 text-zinc-600" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">กรุณาอัปโหลดวิดีโอก่อน</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            อัปโหลดวิดีโอการเล่นแบดมินตันของคุณ เพื่อให้ AI วิเคราะห์ท่าทางและฟุตเวิร์ค
          </p>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-6 rounded-full text-lg"
          >
            อัปโหลดวิดีโอ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                แชร์ให้โค้ช
              </h3>
              <button 
                onClick={() => {
                  setShareModalOpen(false);
                  setShareLink(null);
                }}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {shareLink ? (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm">
                  คัดลอกลิงก์ด้านล่างส่งให้โค้ช โค้ชสามารถดูผลการวิเคราะห์ได้โดยไม่ต้อง Login
                </p>
                <div className="bg-black/50 p-3 rounded-xl">
                  <code className="text-primary text-sm break-all">{shareLink.url}</code>
                </div>
                <Button
                  onClick={copyShareLink}
                  className="w-full bg-cyan-500 text-black hover:bg-cyan-400 rounded-full"
                  data-testid="copy-share-link-btn"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      คัดลอกแล้ว!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      คัดลอกลิงก์
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm">
                  สร้างลิงก์เพื่อแชร์ผลการวิเคราะห์นี้ให้โค้ชดู โค้ชไม่จำเป็นต้องมีบัญชีหรือ Login
                </p>
                <Button
                  onClick={createShareLink}
                  disabled={creatingShare}
                  className="w-full bg-primary text-black hover:bg-primary/90 rounded-full"
                  data-testid="create-share-link-btn"
                >
                  {creatingShare ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      สร้างลิงก์แชร์
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="container mx-auto px-6 py-8">
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
            {/* Export PDF Button */}
            {analysisId && (
              <a 
                href={`${API}/export-pdf/${analysisId}`}
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-900/20 border border-emerald-500/20 rounded-full hover:bg-emerald-900/30 hover:border-emerald-500/30 transition-all"
                data-testid="export-pdf-btn"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm">Export PDF</span>
              </a>
            )}
            
            {/* Share Button */}
            {analysisId && (
              <button 
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-900/20 border border-cyan-500/20 rounded-full hover:bg-cyan-900/30 hover:border-cyan-500/30 transition-all"
                data-testid="share-coach-btn"
              >
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm">แชร์ให้โค้ช</span>
              </button>
            )}
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
                  {analysis.technique_score || '-'}
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
                  {analysis.footwork_score || '-'}
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
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <h4 className="font-bold text-lg text-white capitalize">{key.replace(/_/g, ' ')}</h4>
                      <Badge className="bg-primary text-black font-bold rounded-full px-4 py-1 text-sm">{detail.score}</Badge>
                    </div>
                    
                    {detail.bwf_ref && (
                      <div className="mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-yellow-500 font-medium">{detail.bwf_ref}</span>
                      </div>
                    )}
                    
                    {detail.analysis && (
                      <div className="mb-4 p-4 bg-white/10 rounded-xl border-l-4 border-primary">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="text-sm text-primary font-semibold">ผลวิเคราะห์</span>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{detail.analysis}</p>
                      </div>
                    )}
                    
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
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <h4 className="font-bold text-lg text-white capitalize">{key.replace(/_/g, ' ')}</h4>
                      <Badge className="bg-blue-500 text-white font-bold rounded-full px-4 py-1 text-sm">{detail.score}</Badge>
                    </div>
                    
                    {detail.bwf_ref && (
                      <div className="mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-yellow-500 font-medium">{detail.bwf_ref}</span>
                      </div>
                    )}
                    
                    {detail.analysis && (
                      <div className="mb-4 p-4 bg-white/10 rounded-xl border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-2">
                          <Footprints className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-blue-400 font-semibold">ผลวิเคราะห์</span>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{detail.analysis}</p>
                      </div>
                    )}
                    
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

        {/* Biomechanics Analysis */}
        {analysis.biomechanics && Object.keys(analysis.biomechanics).length > 0 && (
          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12" data-testid="biomechanics-card">
            <h3 className="text-2xl font-bold mb-8 text-purple-400">การวิเคราะห์ Biomechanics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.biomechanics.elbow_position && (
                <div className="bg-white/5 p-5 rounded-2xl hover:border-purple-500/20 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <Hand className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">ตำแหน่งศอก</h4>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{analysis.biomechanics.elbow_position}</p>
                </div>
              )}

              {analysis.biomechanics.body_rotation && (
                <div className="bg-white/5 p-5 rounded-2xl hover:border-purple-500/20 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <RotateCw className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">การพลิกตัว</h4>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{analysis.biomechanics.body_rotation}</p>
                </div>
              )}

              {analysis.biomechanics.weight_transfer && (
                <div className="bg-white/5 p-5 rounded-2xl hover:border-purple-500/20 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <Move className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">การถ่ายน้ำหนัก</h4>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{analysis.biomechanics.weight_transfer}</p>
                </div>
              )}

              {analysis.biomechanics.wrist_action && (
                <div className="bg-white/5 p-5 rounded-2xl hover:border-purple-500/20 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <Hand className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">การใช้ข้อมือ</h4>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{analysis.biomechanics.wrist_action}</p>
                </div>
              )}

              {analysis.biomechanics.grip_analysis && (
                <div className="bg-white/5 p-5 rounded-2xl hover:border-purple-500/20 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <Hand className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">การจับไม้</h4>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{analysis.biomechanics.grip_analysis}</p>
                </div>
              )}

              {analysis.biomechanics.jump_technique && (
                <div className="bg-white/5 p-5 rounded-2xl hover:border-purple-500/20 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">เทคนิคกระโดด</h4>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{analysis.biomechanics.jump_technique}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Doubles Analysis */}
        {analysis.doubles_analysis && analysis.doubles_analysis.applicable && (
          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12" data-testid="doubles-card">
            <div className="flex items-center gap-4 mb-8">
              <Users className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-blue-400">การวิเคราะห์การเล่นคู่</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.doubles_analysis.formation && (
                <div className="bg-white/5 p-5 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Swords className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">Formation</h4>
                  </div>
                  <p className="text-zinc-400 text-sm">{analysis.doubles_analysis.formation}</p>
                </div>
              )}

              {analysis.doubles_analysis.rotation_quality && (
                <div className="bg-white/5 p-5 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <RotateCw className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">การหมุนเวียน</h4>
                  </div>
                  <p className="text-zinc-400 text-sm">{analysis.doubles_analysis.rotation_quality}</p>
                </div>
              )}

              {analysis.doubles_analysis.partner_coordination && (
                <div className="bg-white/5 p-5 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">การประสานงาน</h4>
                  </div>
                  <p className="text-zinc-400 text-sm">{analysis.doubles_analysis.partner_coordination}</p>
                </div>
              )}

              {analysis.doubles_analysis.communication && (
                <div className="bg-white/5 p-5 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageSquare className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                    <h4 className="font-semibold">การสื่อสาร</h4>
                  </div>
                  <p className="text-zinc-400 text-sm">{analysis.doubles_analysis.communication}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Training Plan Section */}
        {!trainingPlan ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <TrendingUp className="w-16 h-16 text-primary mx-auto mb-6" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold mb-4">พร้อมพัฒนาเกมของคุณ?</h3>
              <p className="text-gray-400 mb-6">
                สร้างแผนการฝึกซ้อมที่ออกแบบมาเฉพาะสำหรับคุณ
              </p>
              <Button
                onClick={generateTrainingPlan}
                disabled={generatingPlan}
                className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-6 rounded-full"
                data-testid="generate-plan-button"
              >
                {generatingPlan ? 'กำลังสร้างแผน...' : 'สร้างแผนฝึกซ้อม'}
              </Button>
            </div>
          </div>
        ) : (
          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl" data-testid="training-plan-card">
            <h3 className="text-2xl font-bold mb-6 text-primary" data-testid="training-plan-title">
              {trainingPlan.plan_title}
            </h3>

            <div className="flex flex-wrap gap-4 mb-8">
              <Badge className="bg-primary/10 text-primary border-primary/30 px-4 py-2 rounded-full" data-testid="plan-duration">
                {trainingPlan.duration_weeks} สัปดาห์
              </Badge>
              {trainingPlan.focus_areas && trainingPlan.focus_areas.map((area, index) => (
                <Badge key={index} className="bg-white/5 text-white border-white/10 px-4 py-2 rounded-full" data-testid={`focus-area-${index}`}>
                  {area}
                </Badge>
              ))}
            </div>

            <div className="space-y-6">
              {trainingPlan.exercises && trainingPlan.exercises.map((exercise, index) => (
                <div key={index} className="bg-white/5 p-6 rounded-2xl" data-testid={`exercise-${index}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge className="bg-white/10 text-white border-white/10 rounded-full mb-2" data-testid={`exercise-week-${index}`}>
                        สัปดาห์ {exercise.week} - {exercise.day}
                      </Badge>
                      <h4 className="text-lg font-bold" data-testid={`exercise-name-${index}`}>
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

export default CurrentAnalysisPage;
