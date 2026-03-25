# Badminton AI Analyzer - Product Requirements Document

## Original Problem Statement
สร้าง Badminton AI Analyzer สำหรับวิเคราะห์การเคลื่อนที่ของนักกีฬาแบมินตัน ประเมินว่าใช้ท่าที่ถูกหรือไม่ ฟุตเวิร์คดีไหม มีจุดอ่อน จุดดีอะไร แล้วนำข้อมูลมาต่อยอดเป็นแผนการฝึกซ้อมเพื่อพัฒนาต่อไป โดยนำเข้าผ่านการอัปโหลดคลิปวิดีโอ แล้วให้ AI ประเมิน

## User Personas
- นักกีฬาแบมินตันทุกระดับที่ต้องการพัฒนาทักษะ
- โค้ชที่ต้องการเครื่องมือวิเคราะห์และดูแลนักกีฬาหลายคน
- ภาษาหลัก: ภาษาไทย

## Core Requirements
1. **Video Upload**: ผู้ใช้สามารถอัปโหลดวิดีโอแบมินตัน
2. **AI Analysis**: วิเคราะห์ท่าทาง ฟุตเวิร์ค biomechanics ด้วย Gemini AI
3. **Results Display**: แสดงผลวิเคราะห์พร้อมคะแนน จุดแข็ง จุดอ่อน
4. **Training Plan**: สร้างแผนฝึกซ้อมจากผลวิเคราะห์
5. **History**: ดูประวัติการวิเคราะห์ที่ผ่านมา

## Technology Stack
- **Frontend**: React, React Router, Tailwind CSS, Shadcn UI, axios
- **Backend**: FastAPI, Motor (async MongoDB), Pydantic
- **Database**: MongoDB with GridFS for video storage
- **AI**: emergentintegrations library + Gemini gemini-3-flash-preview

## Implemented Features ✅

### Core Features
- [x] Video upload และเก็บใน GridFS
- [x] AI analysis ด้วย Gemini (technique, footwork, biomechanics)
- [x] Singles/Doubles detection และ conditional UI
- [x] Detailed technique analysis (8 ท่า)
- [x] Detailed footwork analysis (8 รูปแบบ)
- [x] Biomechanics analysis (12 จุด)
- [x] Doubles play analysis
- [x] Training plan generation
- [x] History page with past analyses
- [x] Video playback on results page

### Advanced Features
- [x] **BWF Reference Page** - ข้อมูลอ้างอิงจาก BWF
- [x] **Progress Tracking** - กราฟแสดงพัฒนาการ
- [x] **Video Comparison** - เปรียบเทียบ 2 วิดีโอ side-by-side
- [x] **Export PDF** - ดาวน์โหลดรายงานเป็น PDF
- [x] **Game Analysis** - วิเคราะห์วิดีโอการแข่งขันทั้งเกม (รองรับ 500MB)

### Authentication System
- [x] Email/Password registration & login
- [x] Google Social Login (Emergent-managed)
- [x] Guest Mode (ทดสอบแบบไม่ต้องสมัคร)
- [x] User-isolated data

### Share & Coach Features (March 25, 2026) ✅ NEW
- [x] **Share Link Feature** - สร้างลิงก์แชร์ผลวิเคราะห์ให้โค้ชดู
  - สร้างลิงก์แชร์ (POST /api/share/create)
  - ดูผลวิเคราะห์โดยไม่ต้อง login (GET /api/share/{share_id})
  - ลบลิงก์แชร์ (DELETE /api/share/{share_id})
  - รองรับลิงก์หมดอายุ
- [x] **Coach Mode** - โหมดโค้ชสำหรับดูแลนักกีฬาหลายคน
  - อัปเกรดเป็นโค้ช (POST /api/coach/upgrade)
  - สร้างรหัสเชิญ (POST /api/coach/invite/create)
  - นักกีฬาเข้าร่วมทีม (POST /api/coach/join)
  - ดูรายการนักกีฬา (GET /api/coach/athletes)
  - ดูผลวิเคราะห์ของนักกีฬา (GET /api/coach/athlete/{id}/analyses)
  - นักกีฬาออกจากทีม (POST /api/coach/leave)
- [x] **Coach Dashboard** - หน้าจัดการทีมสำหรับโค้ช
- [x] **Public Shared Analysis Page** - หน้าแสดงผลวิเคราะห์สาธารณะ

## UI Design System (Kinetic Flow)
- **Buttons**: rounded-full (pill shape) พร้อม glow effect
- **Cards**: rounded-3xl พร้อม hover effects
- **Badges**: rounded-full 
- **Containers**: rounded-2xl หรือ rounded-xl
- **Colors**: Primary (#ccff00), Blue (#3b82f6), Rose (#f43f5e), Purple (#a855f7), Cyan (#06b6d4)
- **Background**: Dark theme (#09090b, #121214)

## Upcoming Tasks (P1)
- [ ] Video Timestamp Marking - ทำเครื่องหมายจุดเวลาที่มีปัญหาในวิดีโอ
- [ ] Training Reminders - แจ้งเตือนการฝึกซ้อม

## Future Tasks (P2-P4)
- [ ] Pro Athlete Comparison - เปรียบเทียบกับนักกีฬามืออาชีพ
- [ ] Subscription System - ระบบ Free/Pro/Team
- [ ] Multi-language support

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | สมัครสมาชิก |
| POST | /api/auth/login | เข้าสู่ระบบ |
| POST | /api/auth/google/session | Login ด้วย Google |
| POST | /api/auth/guest | ทดสอบแบบ Guest |
| POST | /api/auth/logout | ออกจากระบบ |
| GET | /api/auth/me | ข้อมูลผู้ใช้ปัจจุบัน |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/analyze | อัปโหลดและวิเคราะห์คลิปสั้น |
| POST | /api/game-analyze | วิเคราะห์เกมยาว |
| GET | /api/analyses | รายการการวิเคราะห์ |
| GET | /api/analyses/{id} | รายละเอียดการวิเคราะห์ |
| GET | /api/videos/{id} | สตรีมวิดีโอ |
| GET | /api/export-pdf/{id} | ดาวน์โหลด PDF |

### Share Links
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/share/create | สร้างลิงก์แชร์ |
| GET | /api/share/{share_id} | ดูผลวิเคราะห์ (ไม่ต้อง auth) |
| GET | /api/share/{share_id}/video/{video_id} | ดูวิดีโอจากลิงก์แชร์ |
| DELETE | /api/share/{share_id} | ลบลิงก์แชร์ |

### Coach Mode
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/coach/upgrade | อัปเกรดเป็นโค้ช |
| POST | /api/coach/invite/create | สร้างรหัสเชิญ |
| POST | /api/coach/join | นักกีฬาเข้าร่วมทีม |
| GET | /api/coach/athletes | รายการนักกีฬาในทีม |
| GET | /api/coach/athlete/{id}/analyses | ผลวิเคราะห์ของนักกีฬา |
| GET | /api/coach/me | ดูโค้ชของตัวเอง |
| POST | /api/coach/leave | ออกจากทีม |

## File Structure
```
/app/
├── backend/
│   ├── server.py      # Main FastAPI app (1400+ lines)
│   ├── tests/         # pytest test files
│   └── .env           # Environment variables
└── frontend/
    ├── src/
    │   ├── App.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── components/
    │   │   ├── Sidebar.js
    │   │   └── ui/
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── HomePage.js           # Upload คลิปสั้น
    │   │   ├── GameAnalysisPage.js   # Upload เกมยาว
    │   │   ├── CurrentAnalysisPage.js
    │   │   ├── AnalysisPage.js       # + Share button
    │   │   ├── HistoryPage.js
    │   │   ├── ProgressPage.js
    │   │   ├── ComparePage.js
    │   │   ├── ReferencePage.js
    │   │   ├── SharedAnalysisPage.js # NEW - Public shared view
    │   │   └── CoachDashboardPage.js # NEW - Coach management
    └── .env
```

## Routes
| Path | Component | Description |
|------|-----------|-------------|
| /login | LoginPage | หน้าเข้าสู่ระบบ |
| / | HomePage | อัปโหลดคลิปสั้น |
| /game-analysis | GameAnalysisPage | อัปโหลดเกมยาว |
| /current-analysis | CurrentAnalysisPage | ผลวิเคราะห์ล่าสุด |
| /analysis/:id | AnalysisPage | รายละเอียดการวิเคราะห์ |
| /history | HistoryPage | ประวัติการวิเคราะห์ |
| /progress | ProgressPage | กราฟพัฒนาการ |
| /compare | ComparePage | เปรียบเทียบ 2 วิดีโอ |
| /reference | ReferencePage | ข้อมูล BWF |
| /coach | CoachDashboardPage | โค้ช & ทีม |
| /shared/:shareId | SharedAnalysisPage | ดูผลแชร์ (ไม่ต้อง login) |

## Database Collections
- **users**: user_id, email, name, picture, auth_type, role, coach_id
- **user_sessions**: session_token, user_id, expires_at
- **analyses**: id, video_filename, video_id, technique_score, footwork_score, user_id, ...
- **game_analyses**: id, video_filename, overall_technique, overall_footwork, user_id, ...
- **training_plans**: id, analysis_id, plan_title, exercises, ...
- **share_links**: share_id, analysis_id, user_id, expires_at
- **coach_invites**: invite_code, coach_id, used_by, expires_at
- **coach_athletes**: coach_id, athlete_id, athlete_name, athlete_email, joined_at

## Test Reports
- /app/test_reports/iteration_1.json - Initial testing
- /app/test_reports/iteration_2.json - Auth testing
- /app/test_reports/iteration_3.json - Share & Coach features (23 backend + 15 frontend tests, 100% pass)

## Test Credentials
- Coach: testcoach@test.com / test123
- Athlete: athlete@test.com / test123
- Guest Mode: Available via "ทดลองใช้งาน" button
