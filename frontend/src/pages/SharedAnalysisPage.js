import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { TrendingUp, Target, Activity, AlertCircle, Loader2, Hand, Footprints, RotateCw, Move, Users, Swords, MessageSquare, Award, UserCircle, Clock, Trophy, Zap, BookOpen, Dumbbell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// คำอธิบายความสำคัญของแต่ละทักษะ
const TECHNIQUE_INFO = {
  grip: {
    name: "การจับแร็คเกต (Grip)",
    importance: "พื้นฐานสำคัญที่สุดของการตีแบดมินตัน การจับที่ถูกต้องช่วยให้ควบคุมทิศทางและความแรงได้แม่นยำ"
  },
  swing: {
    name: "การสวิง (Swing)",
    importance: "การเคลื่อนไหวแขนที่ถูกต้องสร้างพลังและความแม่นยำ การสวิงที่ดีช่วยลดการบาดเจ็บข้อศอก"
  },
  stance: {
    name: "ท่ายืน (Stance)",
    importance: "ท่ายืนที่สมดุลช่วยให้เคลื่อนที่ได้เร็วและตอบโต้ได้ทันท่วงที"
  },
  clear: {
    name: "ลูกหลัง (Clear)",
    importance: "ช็อตพื้นฐานสำหรับสร้างระยะและเวลา ช่วยรีเซ็ตตำแหน่งเมื่อถูกกดดัน"
  },
  smash: {
    name: "สแมช (Smash)",
    importance: "ช็อตโจมตีที่ทรงพลังที่สุด ความเร็วและมุมที่ถูกต้องช่วยเพิ่มโอกาสจบเกม"
  },
  drop: {
    name: "ลูกดรอป (Drop)",
    importance: "ช็อตที่ต้องใช้ความละเอียดอ่อน ช่วยสร้างช่องว่างและบังคับคู่ต่อสู้ให้เคลื่อนที่"
  },
  net_play: {
    name: "เกมหน้าเน็ต (Net Play)",
    importance: "การเล่นหน้าเน็ตที่ดีสร้างโอกาสโจมตีและควบคุมจังหวะเกม"
  },
  serve: {
    name: "การเสิร์ฟ (Serve)",
    importance: "จุดเริ่มต้นของทุกแต้ม การเสิร์ฟที่ดีสร้างความได้เปรียบตั้งแต่แรก"
  }
};

const FOOTWORK_INFO = {
  split_step: {
    name: "Split Step",
    importance: "การกระโดดเล็กๆ ก่อนคู่ต่อสู้ตี ช่วยให้พร้อมเคลื่อนที่ได้ทุกทิศทาง"
  },
  lunge: {
    name: "ก้าวยื่น (Lunge)",
    importance: "การก้าวเข้าหาลูกอย่างมีประสิทธิภาพ ช่วยให้เอื้อมถึงลูกที่ไกลโดยไม่เสียสมดุล"
  },
  recovery: {
    name: "การกลับตำแหน่ง (Recovery)",
    importance: "การกลับสู่จุดกลางคอร์ทหลังตีลูก สำคัญมากสำหรับการตั้งรับ"
  },
  side_step: {
    name: "ก้าวข้าง (Side Step)",
    importance: "การเคลื่อนที่ด้านข้างอย่างรวดเร็ว ใช้ในการเล่นหน้าเน็ต"
  },
  chasse: {
    name: "Chassé Step",
    importance: "การก้าวสลับเท้าอย่างรวดเร็ว ช่วยเคลื่อนที่ระยะกลางได้มีประสิทธิภาพ"
  },
  jump: {
    name: "การกระโดด (Jump)",
    importance: "การกระโดดตีลูกสูงช่วยเพิ่มมุมโจมตีและความเร็วของช็อต"
  },
  direction_change: {
    name: "เปลี่ยนทิศทาง",
    importance: "ความสามารถในการเปลี่ยนทิศทางอย่างรวดเร็ว สำคัญเมื่อถูกหลอก"
  },
  court_coverage: {
    name: "การครอบคลุมคอร์ท",
    importance: "ประสิทธิภาพในการเคลื่อนที่ครอบคลุมพื้นที่ ลดจุดอ่อนบนคอร์ท"
  }
};

const parseScore = (scoreStr) => {
  if (!scoreStr || scoreStr === "N/A") return null;
  const match = scoreStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

const getScoreBgColor = (score) => {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-primary";
  if (score >= 4) return "bg-yellow-500";
  return "bg-rose-500";
};

const SharedAnalysisPage = () => {
  const { shareId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTimestamp, setActiveTimestamp] = useState(null);
  const videoRef = useRef(null);

  // Function to seek video to specific timestamp
  const seekToTimestamp = (seconds, index) => {
    const video = videoRef.current;
    if (!video) return;
    
    setActiveTimestamp(index);
    
    // Scroll to video first
    video.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Function to actually seek
    const doSeek = () => {
      video.currentTime = seconds;
      video.play().catch(e => console.log('Autoplay prevented:', e));
    };
    
    // Check if video is ready to seek
    if (video.readyState >= 2) {
      setTimeout(doSeek, 300);
    } else {
      const handleCanPlay = () => {
        doSeek();
        video.removeEventListener('canplay', handleCanPlay);
      };
      video.addEventListener('canplay', handleCanPlay);
      video.load();
    }
    
    setTimeout(() => setActiveTimestamp(null), 3000);
  };

  const fetchSharedAnalysis = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/share/${shareId}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching shared analysis:', error);
      if (error.response?.status === 410) {
        setError('ลิงก์แชร์หมดอายุแล้ว');
      } else if (error.response?.status === 404) {
        setError('ไม่พบลิงก์แชร์นี้');
      } else {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  useEffect(() => {
    fetchSharedAnalysis();
  }, [fetchSharedAnalysis]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">{error}</h2>
          <p className="text-zinc-400">ลิงก์แชร์อาจไม่ถูกต้องหรือหมดอายุแล้ว</p>
        </div>
      </div>
    );
  }

  const analysis = data?.analysis;
  const analysisType = data?.analysis_type;
  const sharedBy = data?.shared_by;
  const trainingPlan = data?.training_plan;

  if (!analysis) {
    return null;
  }

  // Check if it's a game analysis
  const isGameAnalysis = analysisType === 'game';

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="container mx-auto px-6 py-8">
          {/* Shared Badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-900/30 border border-cyan-500/30 rounded-full">
              <UserCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm">แชร์โดย {sharedBy}</span>
            </div>
            {isGameAnalysis && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 rounded-full">
                <Trophy className="w-3 h-3 mr-1" />
                วิเคราะห์เกม
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="analysis-title">
              ผลการวิเคราะห์
            </h1>
            {/* Match Type Badge (for clip analysis) */}
            {!isGameAnalysis && analysis.doubles_analysis && (
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
            {/* Match Type for game analysis */}
            {isGameAnalysis && analysis.match_type && (
              <Badge 
                className={`text-base px-4 py-2 rounded-full ${
                  analysis.match_type === 'คู่' 
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                    : 'bg-primary/20 text-primary border-primary/30'
                }`}
              >
                {analysis.match_type === 'คู่' ? '🏸🏸 คู่' : '🏸 เดี่ยว'}
              </Badge>
            )}
          </div>
          <p className="text-zinc-400 mt-2" data-testid="video-filename">{analysis.video_filename}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Video Player Section */}
        {analysis.video_id && (
          <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl mb-12 overflow-hidden" data-testid="video-player-card">
            <h3 className="text-xl font-semibold mb-6">วิดีโอที่วิเคราะห์</h3>
            <div className="relative bg-black rounded-2xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <video
                ref={videoRef}
                controls
                preload="auto"
                className="absolute inset-0 w-full h-full"
                data-testid="video-player"
                src={`${API}/share/${shareId}/video/${analysis.video_id}`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            {/* Timestamp Markers */}
            {analysis.timestamps && analysis.timestamps.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  จุดสำคัญในวิดีโอ (คลิกเพื่อดู)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.timestamps.map((ts, index) => {
                    const isIssue = ts.type === 'issue' || ts.type === 'ปัญหา';
                    return (
                      <button
                        key={index}
                        onClick={() => seekToTimestamp(ts.seconds, index)}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all hover:scale-105 ${
                          activeTimestamp === index 
                            ? 'ring-2 ring-white scale-105' 
                            : ''
                        } ${
                          isIssue 
                            ? 'bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20' 
                            : 'bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                        data-testid={`timestamp-${index}`}
                      >
                        <span className={`font-mono font-bold ${
                          isIssue ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {ts.time}
                        </span>
                        <span className="text-zinc-300 group-hover:text-white">
                          {ts.title}
                        </span>
                        {isIssue ? (
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Different layout for Game vs Clip analysis */}
        {isGameAnalysis ? (
          // Game Analysis Layout
          <>
            {/* Overall Scores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl hover:border-primary/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-7 h-7 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-zinc-400 mb-1">ท่าทางภาพรวม</h3>
                    <p className="text-3xl font-bold text-primary">
                      {analysis.overall_technique || '-'}/10
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl hover:border-blue-500/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-zinc-400 mb-1">ฟุตเวิร์คภาพรวม</h3>
                    <p className="text-3xl font-bold text-blue-400">
                      {analysis.overall_footwork || '-'}/10
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Game Summary */}
            {analysis.game_summary && (
              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12">
                <h3 className="text-xl font-bold mb-4">สรุปภาพรวมการแข่งขัน</h3>
                <p className="text-zinc-300 leading-relaxed">{analysis.game_summary}</p>
              </Card>
            )}

            {/* Timeline */}
            {analysis.timeline && analysis.timeline.length > 0 && (
              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold">Timeline การเล่น</h3>
                </div>
                <div className="space-y-4">
                  {analysis.timeline.map((item, index) => (
                    <div key={index} className={`p-4 rounded-2xl border-l-4 ${
                      item.performance === 'good' ? 'bg-emerald-500/10 border-emerald-500' :
                      item.performance === 'poor' ? 'bg-rose-500/10 border-rose-500' :
                      'bg-white/5 border-zinc-500'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`rounded-full ${
                          item.performance === 'good' ? 'bg-emerald-500/20 text-emerald-400' :
                          item.performance === 'poor' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-white/10 text-zinc-400'
                        }`}>
                          {item.time_range}
                        </Badge>
                        <span className="text-sm text-zinc-500">
                          {item.performance === 'good' ? 'เล่นได้ดี' :
                           item.performance === 'poor' ? 'ต้องปรับปรุง' : 'ปานกลาง'}
                        </span>
                      </div>
                      <p className="text-zinc-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Patterns */}
            {analysis.patterns && analysis.patterns.length > 0 && (
              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12">
                <h3 className="text-xl font-bold mb-6">Pattern ที่พบ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.patterns.map((pattern, index) => (
                    <div key={index} className={`p-5 rounded-2xl ${
                      pattern.type === 'strength' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                      'bg-rose-500/10 border border-rose-500/20'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold ${
                          pattern.type === 'strength' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {pattern.title}
                        </h4>
                        <Badge className="bg-white/10 text-zinc-400 rounded-full">
                          {pattern.frequency}x
                        </Badge>
                      </div>
                      <p className="text-zinc-400 text-sm">{pattern.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12">
                <h3 className="text-xl font-bold mb-6">คำแนะนำ</h3>
                <div className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <Badge className="bg-primary/20 text-primary border-0 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                        {index + 1}
                      </Badge>
                      <p className="text-zinc-300 flex-1">{rec}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        ) : (
          // Clip Analysis Layout
          <>
            {/* Scores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl hover:border-primary/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-7 h-7 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-zinc-400 mb-1">ท่าทาง</h3>
                    <p className="text-2xl font-bold text-primary">
                      {analysis.technique_score || '-'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl hover:border-blue-500/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-zinc-400 mb-1">ฟุตเวิร์ค</h3>
                    <p className="text-2xl font-bold text-blue-400">
                      {analysis.footwork_score || '-'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Technique Details */}
            {analysis.technique_details && Object.keys(analysis.technique_details).length > 0 && (
              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-primary">รายละเอียดท่าทาง</h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <BookOpen className="w-4 h-4" />
                    <span>มาตรฐาน BWF</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {Object.entries(analysis.technique_details).map(([key, detail]) => {
                    const info = TECHNIQUE_INFO[key] || { name: key.replace(/_/g, ' '), importance: '' };
                    const score = parseScore(detail?.score);
                    
                    return detail && detail.score !== "N/A" && (
                      <div key={key} className="bg-white/5 border border-white/5 p-5 rounded-2xl hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-lg text-white">{info.name}</h4>
                          <Badge className={`${score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-primary' : 'bg-rose-500'} text-black font-bold rounded-full px-4 py-1 text-sm`}>
                            {detail.score}
                          </Badge>
                        </div>
                        
                        {/* Progress bar */}
                        {score !== null && (
                          <div className="mb-4">
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${getScoreBgColor(score)}`}
                                style={{ width: `${(score / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Why this matters */}
                        {info.importance && (
                          <div className="mb-4 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                            <div className="flex items-start gap-2">
                              <Zap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-xs text-blue-400 font-semibold block mb-1">ทำไมสำคัญ?</span>
                                <p className="text-xs text-zinc-400 leading-relaxed">{info.importance}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
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
                              <span className="text-sm text-rose-400 font-semibold">จุดที่ต้องปรับปรุง</span>
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
                              <span className="text-sm text-emerald-400 font-semibold">วิธีพัฒนา</span>
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
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Footwork Details */}
            {analysis.footwork_details && Object.keys(analysis.footwork_details).length > 0 && (
              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-blue-400">รายละเอียดฟุตเวิร์ค</h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <BookOpen className="w-4 h-4" />
                    <span>มาตรฐาน BWF</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {Object.entries(analysis.footwork_details).map(([key, detail]) => {
                    const info = FOOTWORK_INFO[key] || { name: key.replace(/_/g, ' '), importance: '' };
                    const score = parseScore(detail?.score);
                    
                    return detail && detail.score !== "N/A" && (
                      <div key={key} className="bg-white/5 border border-white/5 p-5 rounded-2xl hover:border-blue-500/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-lg text-white">{info.name}</h4>
                          <Badge className={`${score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-blue-500' : 'bg-rose-500'} text-white font-bold rounded-full px-4 py-1 text-sm`}>
                            {detail.score}
                          </Badge>
                        </div>
                        
                        {/* Progress bar */}
                        {score !== null && (
                          <div className="mb-4">
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-blue-500' : 'bg-rose-500'}`}
                                style={{ width: `${(score / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Why this matters */}
                        {info.importance && (
                          <div className="mb-4 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                            <div className="flex items-start gap-2">
                              <Zap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-xs text-blue-400 font-semibold block mb-1">ทำไมสำคัญ?</span>
                                <p className="text-xs text-zinc-400 leading-relaxed">{info.importance}</p>
                              </div>
                            </div>
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
                              <span className="text-sm text-rose-400 font-semibold">จุดที่ต้องปรับปรุง</span>
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
                              <span className="text-sm text-emerald-400 font-semibold">วิธีพัฒนา</span>
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
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-6 text-primary">จุดแข็ง</h3>
                <div className="space-y-3">
                  {analysis.strengths && analysis.strengths.length > 0 ? (
                    analysis.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p className="text-zinc-300">{strength}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500">ไม่มีข้อมูล</p>
                  )}
                </div>
              </Card>

              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-6 text-rose-400">จุดอ่อน</h3>
                <div className="space-y-3">
                  {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                    analysis.weaknesses.map((weakness, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-rose-500/5 rounded-xl">
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
            <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12">
              <h3 className="text-xl font-bold mb-6">คำแนะนำ</h3>
              <div className="space-y-3">
                {analysis.recommendations && analysis.recommendations.length > 0 ? (
                  analysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
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

            {/* Biomechanics */}
            {analysis.biomechanics && Object.keys(analysis.biomechanics).length > 0 && (
              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12">
                <h3 className="text-2xl font-bold mb-8 text-purple-400">การวิเคราะห์ Biomechanics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analysis.biomechanics).map(([key, value]) => {
                    if (!value || value === "N/A" || value === "...") return null;
                    
                    const keyLabels = {
                      'elbow_position': 'ตำแหน่งศอก',
                      'ตำแหน่งศอก': 'ตำแหน่งศอก',
                      'elbow_angle': 'มุมศอก',
                      'มุมศอก': 'มุมศอก',
                      'body_rotation': 'การหมุนลำตัว',
                      'การหมุนลำตัว': 'การหมุนลำตัว',
                      'hip_rotation': 'การหมุนสะโพก',
                      'การหมุนสะโพก': 'การหมุนสะโพก',
                      'shoulder_alignment': 'แนวไหล่',
                      'แนวไหล่': 'แนวไหล่',
                      'feet_spacing': 'ระยะห่างเท้า',
                      'ระยะห่างเท้า': 'ระยะห่างเท้า',
                      'knee_bend_depth': 'การย่อเข่า',
                      'การย่อเข่า': 'การย่อเข่า',
                      'knee_bend_timing': 'จังหวะย่อเข่า',
                      'จังหวะย่อเข่า': 'จังหวะย่อเข่า',
                      'wrist_action': 'การใช้ข้อมือ',
                      'การใช้ข้อมือ': 'การใช้ข้อมือ',
                      'grip_analysis': 'การจับแร็กเกต',
                      'การจับแร็กเกต': 'การจับแร็กเกต',
                      'weight_transfer': 'การถ่ายน้ำหนัก',
                      'การถ่ายน้ำหนัก': 'การถ่ายน้ำหนัก',
                      'jump_technique': 'เทคนิคการกระโดด',
                      'เทคนิคการกระโดด': 'เทคนิคการกระโดด'
                    };
                    
                    const label = keyLabels[key] || key.replace(/_/g, ' ');
                    
                    return (
                      <div key={key} className="bg-white/5 p-5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                          <Activity className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                          <h4 className="font-semibold text-white">{label}</h4>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed">{value}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Doubles Analysis */}
            {analysis.doubles_analysis && analysis.doubles_analysis.applicable && (
              <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12">
                <div className="flex items-center gap-4 mb-8">
                  <Users className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
                  <h3 className="text-2xl font-bold text-blue-400">การวิเคราะห์การเล่นคู่</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(analysis.doubles_analysis).map(([key, value]) => (
                    key !== 'applicable' && value && value !== 'N/A' && (
                      <div key={key} className="bg-white/5 p-5 rounded-2xl">
                        <h4 className="font-semibold text-blue-400 mb-2 capitalize">{key.replace(/_/g, ' ')}</h4>
                        <p className="text-zinc-400 text-sm">{value}</p>
                      </div>
                    )
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Training Plan Section */}
        {trainingPlan && (
          <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl mb-12" data-testid="shared-training-plan">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary">แผนฝึกซ้อม</h3>
                <p className="text-zinc-400 text-sm">สร้างโดย AI ตามผลวิเคราะห์</p>
              </div>
            </div>

            {trainingPlan.plan_title && (
              <h4 className="text-xl font-semibold mb-4">{trainingPlan.plan_title}</h4>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              {trainingPlan.duration_weeks && (
                <Badge className="bg-primary/10 text-primary border-primary/30 px-4 py-2 rounded-full">
                  {trainingPlan.duration_weeks} สัปดาห์
                </Badge>
              )}
              {trainingPlan.focus_areas && trainingPlan.focus_areas.map((area, index) => (
                <Badge key={index} className="bg-white/5 text-white border-white/10 px-4 py-2 rounded-full">
                  {area}
                </Badge>
              ))}
            </div>

            {trainingPlan.exercises && trainingPlan.exercises.length > 0 && (
              <div className="space-y-4">
                {trainingPlan.exercises.map((exercise, index) => (
                  <div key={index} className="bg-white/5 p-5 rounded-2xl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Badge className="bg-white/10 text-white border-white/10 rounded-full mb-2">
                          สัปดาห์ {exercise.week} - {exercise.day}
                        </Badge>
                        <h5 className="text-lg font-bold">{exercise.exercise_name}</h5>
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        <div>{exercise.duration_minutes} นาที</div>
                        {exercise.sets && exercise.reps && (
                          <div>{exercise.sets} เซ็ต × {exercise.reps} ครั้ง</div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">{exercise.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Footer - App Promo */}
        <div className="text-center py-12 border-t border-white/5 mt-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl">🏸</span>
            <h3 className="text-xl font-bold text-white">Badminton AI Analyzer</h3>
          </div>
          <p className="text-zinc-500">วิเคราะห์ท่าทางและฟุตเวิร์คด้วย AI ตามมาตรฐาน BWF</p>
        </div>
      </div>
    </div>
  );
};

export default SharedAnalysisPage;
