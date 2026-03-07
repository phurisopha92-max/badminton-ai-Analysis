import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ExternalLink, Award, Users, Target, Footprints, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ReferencePage = () => {
  const navigate = useNavigate();

  const bwfModules = [
    {
      title: "Module 6: Movement Skills",
      description: "ทักษะการเคลื่อนไหว - Split Step, Lunge, Recovery",
      techniques: [
        { name: "Split Step", page: "p.53", desc: "ท่าเตรียมพร้อมก่อนเคลื่อนที่ทุกทิศทาง" },
        { name: "Lunge", page: "Module 6", desc: "การก้าวเข้าหาลูก - เข่าและเท้าต้องอยู่ในแนวที่ถูกต้อง" },
        { name: "Recovery", page: "Module 6", desc: "การกลับตำแหน่งหลังตีลูก" },
      ],
      icon: Footprints,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Module 7: Hitting Skills",
      description: "ทักษะการตีลูก - Smash, Clear, Drop Shot, Net Play",
      techniques: [
        { name: "Forehand Smash", page: "p.119", desc: "ลูกตบจากหลังสนาม" },
        { name: "Forehand Drop Shot", page: "p.121", desc: "ลูกหยอดโฟร์แฮนด์" },
        { name: "Backhand Clear", page: "p.125", desc: "ลูกโยนแบ็คแฮนด์" },
        { name: "Backhand Drop Shot", page: "p.127", desc: "ลูกหยอดแบ็คแฮนด์" },
      ],
      icon: Zap,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10"
    }
  ];

  const bwfLevels = [
    {
      level: "Level 1",
      title: "Foundation",
      description: "พื้นฐาน 13 โมดูล - เทคนิค, ฟุตเวิร์ค, วิธีการสอน",
      url: "https://development.bwfbadminton.com/coaches/level-1",
      year: "2012"
    },
    {
      level: "Level 2",
      title: "Advanced",
      description: "ขั้นสูง 11 โมดูล - โปรแกรมฝึกประจำปี",
      url: "https://development.bwfbadminton.com/coaches/level-2",
      year: "2013"
    },
    {
      level: "Level 3",
      title: "Specialized",
      description: "เฉพาะทาง - พัฒนานักกีฬาระดับสูง",
      url: "https://development.bwfbadminton.com/coaches/level-3",
      year: "2018"
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-zinc-400 hover:text-white rounded-full"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับหน้าหลัก
        </Button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-primary/10 rounded-2xl">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white" data-testid="page-title">
              ข้อมูลอ้างอิง BWF
            </h1>
            <p className="text-zinc-400">
              มาตรฐานจาก Badminton World Federation
            </p>
          </div>
        </div>

        {/* BWF Official Badge */}
        <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20 p-6 mb-10 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-2xl">
              <Award className="w-10 h-10 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">BWF Coach Education Program</h2>
              <p className="text-zinc-400 leading-relaxed">
                แอปพลิเคชันนี้ใช้เกณฑ์การประเมินตามมาตรฐาน BWF Coach Education Manual
                ซึ่งเป็นคู่มือการสอนแบดมินตันอย่างเป็นทางการจากสหพันธ์แบดมินตันโลก
              </p>
            </div>
          </div>
        </Card>

        {/* BWF Levels */}
        <h2 className="text-2xl font-bold mb-6">คู่มือ BWF Coach Education</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {bwfLevels.map((item, index) => (
            <Card key={index} className="bg-[#121214] border-white/5 p-6 rounded-3xl hover:border-primary/20 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {item.level}
                </span>
                <span className="text-zinc-500 text-sm">{item.year}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm mb-5 leading-relaxed">{item.description}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium group-hover:translate-x-1 transition-transform"
                data-testid={`bwf-link-${item.level.toLowerCase().replace(' ', '-')}`}
              >
                <ExternalLink className="w-4 h-4" />
                ดาวน์โหลดฟรี
              </a>
            </Card>
          ))}
        </div>

        {/* Technical References */}
        <h2 className="text-2xl font-bold mb-6">เกณฑ์การวิเคราะห์ตาม BWF Level 1</h2>
        <div className="space-y-6 mb-10">
          {bwfModules.map((module, index) => (
            <Card key={index} className="bg-[#121214] border-white/5 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-3 ${module.bgColor} rounded-2xl`}>
                  <module.icon className={`w-6 h-6 ${module.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{module.title}</h3>
                  <p className="text-zinc-400 text-sm">{module.description}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {module.techniques.map((tech, techIndex) => (
                  <div
                    key={techIndex}
                    className="bg-white/5 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{tech.name}</span>
                      <span className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {tech.page}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Movement Cycle */}
        <h2 className="text-2xl font-bold mb-6">Movement Cycle (วงจรการเคลื่อนไหว)</h2>
        <Card className="bg-[#121214] border-white/5 p-8 mb-10 rounded-3xl">
          <p className="text-zinc-400 mb-6 leading-relaxed">
            BWF กำหนดวงจรการเคลื่อนไหว 4 ขั้นตอนสำหรับทุกการตีลูก:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "1", name: "Start", desc: "Split Step เตรียมพร้อม", color: "bg-blue-500" },
              { step: "2", name: "Approach", desc: "เคลื่อนที่เข้าหาลูก", color: "bg-primary" },
              { step: "3", name: "Hitting", desc: "ตีลูก", color: "bg-yellow-500" },
              { step: "4", name: "Recovery", desc: "กลับตำแหน่ง", color: "bg-rose-500" },
            ].map((phase, index) => (
              <div key={index} className="text-center p-4 bg-white/5 rounded-2xl">
                <div className={`w-14 h-14 ${phase.color} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-white font-bold text-xl">{phase.step}</span>
                </div>
                <h4 className="font-semibold text-white mb-1">{phase.name}</h4>
                <p className="text-zinc-400 text-sm">{phase.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-yellow-900/10 border-yellow-500/20 p-5 rounded-2xl mb-8">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-400 mb-1">หมายเหตุ</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                แอปพลิเคชันนี้ใช้ AI วิเคราะห์ตามเกณฑ์มาตรฐาน BWF แต่ไม่ได้รับการรับรองอย่างเป็นทางการจาก BWF
                ผลการวิเคราะห์เป็นเพียงข้อเสนอแนะเพื่อการพัฒนา ควรปรึกษาโค้ชผู้เชี่ยวชาญสำหรับการฝึกซ้อมจริง
              </p>
            </div>
          </div>
        </Card>

        {/* Official Links */}
        <div className="text-center py-8">
          <p className="text-zinc-500 mb-4">ลิงก์อย่างเป็นทางการ</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://bwfbadminton.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-full text-primary hover:bg-white/10 transition-colors"
              data-testid="bwf-official-link"
            >
              <ExternalLink className="w-4 h-4" />
              BWF Official Website
            </a>
            <a
              href="https://development.bwfbadminton.com/coaches"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-full text-primary hover:bg-white/10 transition-colors"
              data-testid="bwf-coaches-link"
            >
              <ExternalLink className="w-4 h-4" />
              BWF Coach Education
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferencePage;
