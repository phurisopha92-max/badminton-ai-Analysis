import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Users, UserPlus, Copy, Check, Clock, Target, Activity, 
  ChevronRight, Loader2, AlertCircle, Trophy, Key, UserMinus, Dumbbell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CoachDashboardPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [athletes, setAthletes] = useState([]);
  const [inviteCode, setInviteCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [athleteAnalyses, setAthleteAnalyses] = useState([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  
  // Athlete mode states
  const [myCoach, setMyCoach] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const fetchCoachData = useCallback(async () => {
    try {
      // Check if user is coach
      const meResponse = await axios.get(`${API}/auth/me`);
      const userData = meResponse.data;
      
      // We need to check the role from the database
      // Since /auth/me doesn't return role, we'll check based on coach endpoints
      try {
        const athletesResponse = await axios.get(`${API}/coach/athletes`);
        setIsCoach(true);
        setAthletes(athletesResponse.data.athletes || []);
      } catch (error) {
        if (error.response?.status === 403) {
          setIsCoach(false);
        }
      }
      
      // Check if user has a coach
      const coachResponse = await axios.get(`${API}/coach/me`);
      if (coachResponse.data.has_coach) {
        setMyCoach(coachResponse.data.coach);
      }
    } catch (error) {
      console.error('Error fetching coach data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoachData();
  }, [fetchCoachData]);

  const upgradeToCoach = async () => {
    setUpgrading(true);
    try {
      await axios.post(`${API}/coach/upgrade`);
      setIsCoach(true);
      setAthletes([]);
    } catch (error) {
      console.error('Error upgrading to coach:', error);
      alert('เกิดข้อผิดพลาดในการอัปเกรดเป็นโค้ช');
    } finally {
      setUpgrading(false);
    }
  };

  const generateInviteCode = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`${API}/coach/invite/create`);
      setInviteCode(response.data);
    } catch (error) {
      console.error('Error generating invite:', error);
      alert('เกิดข้อผิดพลาดในการสร้างรหัสเชิญ');
    } finally {
      setGenerating(false);
    }
  };

  const copyInviteCode = async () => {
    if (inviteCode?.invite_code) {
      try {
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(inviteCode.invite_code);
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement('textarea');
          textArea.value = inviteCode.invite_code;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = inviteCode.invite_code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (e) {
          alert(`รหัสเชิญ: ${inviteCode.invite_code}`);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  const viewAthleteAnalyses = async (athlete) => {
    setSelectedAthlete(athlete);
    setLoadingAnalyses(true);
    try {
      const response = await axios.get(`${API}/coach/athlete/${athlete.athlete_id}/analyses`);
      setAthleteAnalyses(response.data.analyses || []);
    } catch (error) {
      console.error('Error fetching athlete analyses:', error);
      setAthleteAnalyses([]);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const joinCoach = async () => {
    if (!joinCode.trim()) {
      alert('กรุณาใส่รหัสเชิญ');
      return;
    }
    
    setJoining(true);
    try {
      const response = await axios.post(`${API}/coach/join`, { invite_code: joinCode });
      setMyCoach({ name: response.data.coach_name, user_id: response.data.coach_id });
      setJoinCode('');
      alert(response.data.message);
    } catch (error) {
      console.error('Error joining coach:', error);
      alert(error.response?.data?.detail || 'เกิดข้อผิดพลาดในการเข้าร่วมกับโค้ช');
    } finally {
      setJoining(false);
    }
  };

  const leaveCoach = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะออกจากโค้ช?')) return;
    
    setLeaving(true);
    try {
      await axios.post(`${API}/coach/leave`);
      setMyCoach(null);
    } catch (error) {
      console.error('Error leaving coach:', error);
      alert('เกิดข้อผิดพลาดในการออกจากโค้ช');
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="coach-page-title">
            {isCoach ? 'โหมดโค้ช' : 'โค้ช & นักกีฬา'}
          </h1>
          <p className="text-zinc-400">
            {isCoach ? 'จัดการและติดตามความก้าวหน้าของนักกีฬาในทีม' : 'เชื่อมต่อกับโค้ชหรืออัปเกรดเป็นโค้ช'}
          </p>
        </div>

        {/* Coach View */}
        {isCoach ? (
          <div className="space-y-8">
            {/* Invite Section */}
            <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">เชิญนักกีฬาเข้าร่วม</h2>
                  <p className="text-sm text-zinc-400">สร้างรหัสเชิญให้นักกีฬาเข้ามาในทีมของคุณ</p>
                </div>
              </div>
              
              {inviteCode ? (
                <div className="bg-white/5 p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-zinc-400">รหัสเชิญ</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 rounded-full">
                      หมดอายุใน 7 วัน
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 bg-black/50 px-4 py-3 rounded-xl text-2xl font-mono text-primary tracking-widest">
                      {inviteCode.invite_code}
                    </code>
                    <Button
                      onClick={copyInviteCode}
                      className="bg-primary text-black hover:bg-primary/90 rounded-xl px-4"
                      data-testid="copy-invite-btn"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={generateInviteCode}
                  disabled={generating}
                  className="bg-cyan-500 text-black hover:bg-cyan-400 rounded-full px-6"
                  data-testid="generate-invite-btn"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  {generating ? 'กำลังสร้าง...' : 'สร้างรหัสเชิญ'}
                </Button>
              )}
            </Card>

            {/* Athletes List */}
            <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">นักกีฬาในทีม</h2>
                  <p className="text-sm text-zinc-400">{athletes.length} คน</p>
                </div>
              </div>

              {athletes.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">ยังไม่มีนักกีฬาในทีม</p>
                  <p className="text-zinc-600 text-sm">สร้างรหัสเชิญเพื่อเพิ่มนักกีฬา</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {athletes.map((athlete) => (
                    <div
                      key={athlete.athlete_id}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedAthlete?.athlete_id === athlete.athlete_id
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                      onClick={() => viewAthleteAnalyses(athlete)}
                      data-testid={`athlete-${athlete.athlete_id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-xl font-bold">
                            {athlete.athlete_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{athlete.athlete_name}</h3>
                            <p className="text-sm text-zinc-400">{athlete.athlete_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">{athlete.analysis_count || 0}</p>
                            <p className="text-xs text-zinc-500">การวิเคราะห์</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-zinc-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Selected Athlete Analyses */}
            {selectedAthlete && (
              <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedAthlete.athlete_name}</h2>
                      <p className="text-sm text-zinc-400">ผลการวิเคราะห์ทั้งหมด</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedAthlete(null)}
                    className="text-zinc-400 rounded-full"
                  >
                    ปิด
                  </Button>
                </div>

                {loadingAnalyses ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  </div>
                ) : athleteAnalyses.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">ยังไม่มีผลการวิเคราะห์</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {athleteAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-white">{analysis.video_filename}</h4>
                              <Badge className={`rounded-full text-xs ${
                                analysis.type === 'game' 
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {analysis.type === 'game' ? 'เกม' : 'คลิป'}
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-500">
                              {new Date(analysis.created_at).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            {analysis.type === 'clip' ? (
                              <>
                                <div>
                                  <p className="text-primary font-bold">{analysis.technique_score || '-'}</p>
                                  <p className="text-xs text-zinc-500">ท่าทาง</p>
                                </div>
                                <div>
                                  <p className="text-blue-400 font-bold">{analysis.footwork_score || '-'}</p>
                                  <p className="text-xs text-zinc-500">ฟุตเวิร์ค</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <p className="text-primary font-bold">{analysis.overall_technique || '-'}/10</p>
                                  <p className="text-xs text-zinc-500">ท่าทาง</p>
                                </div>
                                <div>
                                  <p className="text-blue-400 font-bold">{analysis.overall_footwork || '-'}/10</p>
                                  <p className="text-xs text-zinc-500">ฟุตเวิร์ค</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        ) : (
          /* Non-Coach View */
          <div className="space-y-8">
            {/* My Coach Section */}
            <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">โค้ชของฉัน</h2>
                  <p className="text-sm text-zinc-400">
                    {myCoach ? 'เชื่อมต่อกับโค้ชแล้ว' : 'ยังไม่มีโค้ช'}
                  </p>
                </div>
              </div>

              {myCoach ? (
                <div className="bg-white/5 p-4 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl font-bold text-blue-400">
                        {myCoach.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{myCoach.name}</h3>
                        <p className="text-sm text-zinc-400">{myCoach.email}</p>
                      </div>
                    </div>
                    <Button
                      onClick={leaveCoach}
                      disabled={leaving}
                      variant="ghost"
                      className="text-rose-400 hover:bg-rose-500/10 rounded-full"
                      data-testid="leave-coach-btn"
                    >
                      {leaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          ออกจากโค้ช
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-zinc-400">ใส่รหัสเชิญจากโค้ชเพื่อเข้าร่วมทีม</p>
                  <div className="flex gap-3">
                    <Input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ใส่รหัสเชิญ (เช่น ABC12345)"
                      className="flex-1 bg-white/5 border-white/10 rounded-xl text-lg uppercase tracking-widest"
                      maxLength={8}
                      data-testid="join-code-input"
                    />
                    <Button
                      onClick={joinCoach}
                      disabled={joining || !joinCode.trim()}
                      className="bg-blue-500 text-white hover:bg-blue-400 rounded-xl px-6"
                      data-testid="join-coach-btn"
                    >
                      {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'เข้าร่วม'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Become Coach Section */}
            <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">เป็นโค้ช</h2>
                  <p className="text-sm text-zinc-400">อัปเกรดเป็นโค้ชเพื่อดูแลนักกีฬาหลายคน</p>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl mb-6">
                <h3 className="font-semibold mb-4">สิทธิประโยชน์ของโค้ช:</h3>
                <ul className="space-y-3 text-zinc-300">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    ดูผลการวิเคราะห์ของนักกีฬาทุกคนในทีม
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    ติดตามความก้าวหน้าแบบ Real-time
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    สร้างรหัสเชิญเพื่อเพิ่มนักกีฬา
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => navigate('/subscription')}
                className="w-full bg-primary text-black hover:bg-primary/90 rounded-full py-6 text-lg font-bold"
                data-testid="upgrade-coach-btn"
              >
                <Trophy className="w-5 h-5 mr-2" />
                อัปเกรดเป็นโค้ช ($10/เดือน)
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachDashboardPage;
