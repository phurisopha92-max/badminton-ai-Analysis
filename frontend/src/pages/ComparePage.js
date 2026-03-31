import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GitCompare, Loader2, AlertCircle, ChevronDown, Check, ArrowUp, ArrowDown, Minus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ComparePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [showLeftDropdown, setShowLeftDropdown] = useState(false);
  const [showRightDropdown, setShowRightDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAnalyses = async () => {
    try {
      const response = await axios.get(`${API}/analyses`);
      setAnalyses(response.data);
      // Auto-select first two if available
      if (response.data.length >= 2) {
        setSelectedLeft(response.data[1]); // Second most recent (older)
        setSelectedRight(response.data[0]); // Most recent (newer)
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const extractScore = (scoreStr) => {
    if (!scoreStr || scoreStr === 'N/A') return null;
    const match = scoreStr.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  };

  const ComparisonIndicator = ({ left, right }) => {
    const leftScore = extractScore(left);
    const rightScore = extractScore(right);
    
    if (leftScore === null || rightScore === null) return <Minus className="w-4 h-4 text-zinc-500" />;
    
    const diff = rightScore - leftScore;
    
    if (diff > 0) {
      return (
        <div className="flex items-center gap-1 text-emerald-400">
          <ArrowUp className="w-4 h-4" />
          <span className="text-sm font-medium">+{diff.toFixed(1)}</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center gap-1 text-rose-400">
          <ArrowDown className="w-4 h-4" />
          <span className="text-sm font-medium">{diff.toFixed(1)}</span>
        </div>
      );
    }
    return <Minus className="w-4 h-4 text-zinc-500" />;
  };

  const SelectDropdown = ({ selected, setSelected, show, setShow, analyses, otherId, label }) => (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShow(!show)}
        className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 rounded-xl h-auto py-3"
        data-testid={`select-${label}`}
      >
        <span className="truncate">
          {selected ? (
            <span className="flex flex-col items-start">
              <span className="text-white truncate">{selected.video_filename}</span>
              <span className="text-xs text-zinc-500">{formatDate(selected.created_at)}</span>
            </span>
          ) : (
            <span className="text-zinc-500">เลือกวิดีโอ</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${show ? 'rotate-180' : ''}`} />
      </Button>
      
      {show && (
        <div className="absolute z-10 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {analyses.filter(a => a.id !== otherId).map((analysis) => (
            <button
              key={analysis.id}
              onClick={() => {
                setSelected(analysis);
                setShow(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white truncate">{analysis.video_filename}</p>
                <p className="text-xs text-zinc-500">{formatDate(analysis.created_at)}</p>
              </div>
              {selected?.id === analysis.id && (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="compare-title">
            🎬 เปรียบเทียบวิดีโอ
          </h1>
          <p className="text-zinc-400 mt-2">เลือก 2 วิดีโอเพื่อเปรียบเทียบผลการวิเคราะห์</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {!user ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-10 h-10 text-zinc-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-zinc-400">
              เข้าสู่ระบบเพื่อเปรียบเทียบวิดีโอ
            </h3>
            <p className="text-zinc-500 mb-8">
              เข้าสู่ระบบเพื่อเปรียบเทียบผลการวิเคราะห์ของคุณ
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-6 rounded-full"
            >
              <LogIn className="w-5 h-5 mr-2" />
              เข้าสู่ระบบ
            </Button>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <p className="text-zinc-400">{error}</p>
          </div>
        ) : analyses.length < 2 ? (
          <div className="text-center py-12" data-testid="not-enough-data">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <GitCompare className="w-10 h-10 text-zinc-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-zinc-400">
              ยังไม่มีข้อมูลเพียงพอ
            </h3>
            <p className="text-zinc-500 mb-8">
              ต้องมีการวิเคราะห์อย่างน้อย 2 ครั้ง จึงจะเปรียบเทียบได้
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-primary text-black hover:bg-primary/90 font-bold px-8 py-6 rounded-full"
            >
              อัปโหลดวิดีโอ
            </Button>
          </div>
        ) : (
          <>
            {/* Selection Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
                <p className="text-zinc-400 text-sm mb-3">วิดีโอ A (เก่ากว่า)</p>
                <SelectDropdown
                  selected={selectedLeft}
                  setSelected={setSelectedLeft}
                  show={showLeftDropdown}
                  setShow={setShowLeftDropdown}
                  analyses={analyses}
                  otherId={selectedRight?.id}
                  label="left"
                />
              </Card>

              <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
                <p className="text-zinc-400 text-sm mb-3">วิดีโอ B (ใหม่กว่า)</p>
                <SelectDropdown
                  selected={selectedRight}
                  setSelected={setSelectedRight}
                  show={showRightDropdown}
                  setShow={setShowRightDropdown}
                  analyses={analyses}
                  otherId={selectedLeft?.id}
                  label="right"
                />
              </Card>
            </div>

            {/* Comparison Results */}
            {selectedLeft && selectedRight && (
              <>
                {/* Overall Scores Comparison */}
                <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl mb-6" data-testid="scores-comparison">
                  <h3 className="text-xl font-bold mb-6">เปรียบเทียบคะแนนรวม</h3>
                  
                  <div className="space-y-6">
                    {/* Technique Score */}
                    <div className="grid grid-cols-3 items-center gap-4 p-4 bg-white/5 rounded-2xl">
                      <div className="text-center">
                        <p className="text-zinc-500 text-xs mb-1">วิดีโอ A</p>
                        <Badge className="bg-primary/20 text-primary border-0 rounded-full px-4 py-2 text-lg font-bold">
                          {extractScore(selectedLeft.technique_score) || '-'}/10
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium mb-2">ท่าทาง</p>
                        <ComparisonIndicator 
                          left={selectedLeft.technique_score} 
                          right={selectedRight.technique_score} 
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-zinc-500 text-xs mb-1">วิดีโอ B</p>
                        <Badge className="bg-primary/20 text-primary border-0 rounded-full px-4 py-2 text-lg font-bold">
                          {extractScore(selectedRight.technique_score) || '-'}/10
                        </Badge>
                      </div>
                    </div>

                    {/* Footwork Score */}
                    <div className="grid grid-cols-3 items-center gap-4 p-4 bg-white/5 rounded-2xl">
                      <div className="text-center">
                        <p className="text-zinc-500 text-xs mb-1">วิดีโอ A</p>
                        <Badge className="bg-blue-500/20 text-blue-400 border-0 rounded-full px-4 py-2 text-lg font-bold">
                          {extractScore(selectedLeft.footwork_score) || '-'}/10
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium mb-2">ฟุตเวิร์ค</p>
                        <ComparisonIndicator 
                          left={selectedLeft.footwork_score} 
                          right={selectedRight.footwork_score} 
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-zinc-500 text-xs mb-1">วิดีโอ B</p>
                        <Badge className="bg-blue-500/20 text-blue-400 border-0 rounded-full px-4 py-2 text-lg font-bold">
                          {extractScore(selectedRight.footwork_score) || '-'}/10
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Strengths & Weaknesses Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Video A Details */}
                  <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl" data-testid="video-a-details">
                    <h3 className="text-lg font-bold mb-4 text-primary">วิดีโอ A</h3>
                    <p className="text-zinc-500 text-sm mb-4">{selectedLeft.video_filename}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-emerald-400 text-sm font-medium mb-2">จุดแข็ง</p>
                        <ul className="space-y-1">
                          {selectedLeft.strengths?.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-zinc-400 text-sm flex items-start gap-2">
                              <span className="text-emerald-400">•</span> {s}
                            </li>
                          )) || <li className="text-zinc-500 text-sm">-</li>}
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-rose-400 text-sm font-medium mb-2">จุดอ่อน</p>
                        <ul className="space-y-1">
                          {selectedLeft.weaknesses?.slice(0, 3).map((w, i) => (
                            <li key={i} className="text-zinc-400 text-sm flex items-start gap-2">
                              <span className="text-rose-400">•</span> {w}
                            </li>
                          )) || <li className="text-zinc-500 text-sm">-</li>}
                        </ul>
                      </div>
                    </div>
                  </Card>

                  {/* Video B Details */}
                  <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl" data-testid="video-b-details">
                    <h3 className="text-lg font-bold mb-4 text-blue-400">วิดีโอ B</h3>
                    <p className="text-zinc-500 text-sm mb-4">{selectedRight.video_filename}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-emerald-400 text-sm font-medium mb-2">จุดแข็ง</p>
                        <ul className="space-y-1">
                          {selectedRight.strengths?.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-zinc-400 text-sm flex items-start gap-2">
                              <span className="text-emerald-400">•</span> {s}
                            </li>
                          )) || <li className="text-zinc-500 text-sm">-</li>}
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-rose-400 text-sm font-medium mb-2">จุดอ่อน</p>
                        <ul className="space-y-1">
                          {selectedRight.weaknesses?.slice(0, 3).map((w, i) => (
                            <li key={i} className="text-zinc-400 text-sm flex items-start gap-2">
                              <span className="text-rose-400">•</span> {w}
                            </li>
                          )) || <li className="text-zinc-500 text-sm">-</li>}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* View Full Analysis Buttons */}
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                    onClick={() => navigate(`/analysis/${selectedLeft.id}`)}
                    variant="outline"
                    className="rounded-full border-primary/30 hover:bg-primary/10"
                  >
                    ดูผลวิเคราะห์ A แบบเต็ม
                  </Button>
                  <Button
                    onClick={() => navigate(`/analysis/${selectedRight.id}`)}
                    variant="outline"
                    className="rounded-full border-blue-500/30 hover:bg-blue-500/10"
                  >
                    ดูผลวิเคราะห์ B แบบเต็ม
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
