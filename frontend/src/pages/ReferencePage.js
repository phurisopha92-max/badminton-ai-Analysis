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
      color: "text-blue-400"
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
      color: "text-yellow-400"
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับหน้าหลัก
        </Button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/20 rounded-xl">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-4xl uppercase text-primary" data-testid="page-title">
              ข้อมูลอ้างอิง BWF
            </h1>
            <p className="text-muted-foreground">
              มาตรฐานจาก Badminton World Federation (สหพันธ์แบดมินตันโลก)
            </p>
          </div>
        </div>

        {/* BWF Official Badge */}
        <Card className="bg-gradient-to-r from-blue-900/50 to-green-900/50 border-primary/30 p-6 mb-8">
          <div className="flex items-center gap-4">
            <Award className="w-12 h-12 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold text-white">BWF Coach Education Program</h2>
              <p className="text-gray-300">
                แอปพลิเคชันนี้ใช้เกณฑ์การประเมินตามมาตรฐาน BWF Coach Education Manual
                ซึ่งเป็นคู่มือการสอนแบดมินตันอย่างเป็นทางการจากสหพันธ์แบดมินตันโลก
              </p>
            </div>
          </div>
        </Card>

        {/* BWF Levels */}
        <h2 className="font-heading text-2xl uppercase text-secondary mb-4">
          คู่มือ BWF Coach Education
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {bwfLevels.map((item, index) => (
            <Card key={index} className="bg-card/50 border-border/50 p-5 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                  {item.level}
                </span>
                <span className="text-muted-foreground text-sm">{item.year}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
                data-testid={`bwf-link-${item.level.toLowerCase().replace(' ', '-')}`}
              >
                <ExternalLink className="w-4 h-4" />
                ดาวน์โหลดฟรี
              </a>
            </Card>
          ))}
        </div>

        {/* Technical References */}
        <h2 className="font-heading text-2xl uppercase text-secondary mb-4">
          เกณฑ์การวิเคราะห์ตาม BWF Level 1
        </h2>
        <div className="space-y-6 mb-8">
          {bwfModules.map((module, index) => (
            <Card key={index} className="bg-card/50 border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <module.icon className={`w-6 h-6 ${module.color}`} />
                <div>
                  <h3 className="text-lg font-bold text-white">{module.title}</h3>
                  <p className="text-muted-foreground text-sm">{module.description}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {module.techniques.map((tech, techIndex) => (
                  <div
                    key={techIndex}
                    className="bg-background/50 rounded-lg p-3 border border-border/30"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{tech.name}</span>
                      <span className="text-xs text-primary bg-primary/20 px-2 py-0.5 rounded">
                        {tech.page}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Movement Cycle */}
        <h2 className="font-heading text-2xl uppercase text-secondary mb-4">
          Movement Cycle (วงจรการเคลื่อนไหว)
        </h2>
        <Card className="bg-card/50 border-border/50 p-6 mb-8">
          <p className="text-muted-foreground mb-4">
            BWF กำหนดวงจรการเคลื่อนไหว 4 ขั้นตอนสำหรับทุกการตีลูก:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "1", name: "Start", desc: "Split Step เตรียมพร้อม", color: "bg-blue-500" },
              { step: "2", name: "Approach", desc: "เคลื่อนที่เข้าหาลูก", color: "bg-green-500" },
              { step: "3", name: "Hitting", desc: "ตีลูก", color: "bg-yellow-500" },
              { step: "4", name: "Recovery", desc: "กลับตำแหน่ง", color: "bg-red-500" },
            ].map((phase, index) => (
              <div key={index} className="text-center">
                <div className={`w-12 h-12 ${phase.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <span className="text-white font-bold text-lg">{phase.step}</span>
                </div>
                <h4 className="font-medium text-white">{phase.name}</h4>
                <p className="text-muted-foreground text-xs">{phase.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-yellow-900/20 border-yellow-500/30 p-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-400 mb-1">หมายเหตุ</h4>
              <p className="text-muted-foreground text-sm">
                แอปพลิเคชันนี้ใช้ AI วิเคราะห์ตามเกณฑ์มาตรฐาน BWF แต่ไม่ได้รับการรับรองอย่างเป็นทางการจาก BWF
                ผลการวิเคราะห์เป็นเพียงข้อเสนอแนะเพื่อการพัฒนา ควรปรึกษาโค้ชผู้เชี่ยวชาญสำหรับการฝึกซ้อมจริง
              </p>
            </div>
          </div>
        </Card>

        {/* Official Links */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">ลิงก์อย่างเป็นทางการ</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://bwfbadminton.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:text-primary/80"
              data-testid="bwf-official-link"
            >
              <ExternalLink className="w-4 h-4" />
              BWF Official Website
            </a>
            <a
              href="https://development.bwfbadminton.com/coaches"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:text-primary/80"
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
