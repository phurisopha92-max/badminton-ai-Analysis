# Badminton AI Analyzer - Product Requirements Document

## Original Problem Statement
สร้าง Badminton AI Analyzer สำหรับวิเคราะห์การเคลื่อนที่ของนักกีฬาแบมินตัน ประเมินว่าใช้ท่าที่ถูกหรือไม่ ฟุตเวิร์คดีไหม มีจุดอ่อน จุดดีอะไร แล้วนำข้อมูลมาต่อยอดเป็นแผนการฝึกซ้อมเพื่อพัฒนาต่อไป โดยนำเข้าผ่านการอัปโหลดคลิปวิดีโอ แล้วให้ AI ประเมิน

## User Personas
- นักกีฬาแบมินตันทุกระดับที่ต้องการพัฒนาทักษะ
- โค้ชที่ต้องการเครื่องมือวิเคราะห์นักกีฬา
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
- [x] Video upload และเก็บใน GridFS
- [x] AI analysis ด้วย Gemini (technique, footwork, biomechanics)
- [x] Singles/Doubles detection และ conditional UI
- [x] Detailed technique analysis (8 ท่า: smash, clear, drop, net, serve, backhand, forehand, defense)
- [x] Detailed footwork analysis (8 รูปแบบ: split step, lunge, recovery, movement, chasse, crossover, jump, direction change)
- [x] Biomechanics analysis (12 จุด)
- [x] Doubles play analysis (formation, rotation, coordination, etc.)
- [x] Training plan generation
- [x] History page with past analyses
- [x] Video playback on results page
- [x] BWF Reference Page with PDF downloads
- [x] **Progress Tracking** - Line & Bar charts แสดงพัฒนาการ
- [x] **Video Comparison** - เปรียบเทียบ 2 วิดีโอ side-by-side
- [x] **Export PDF** - ดาวน์โหลดรายงานเป็น PDF
- [x] **AI Accuracy Enhancement** - ปรับ prompt และ validation

## Bug Fixes (March 5, 2026)
- [x] **FIXED**: AI analysis returning incomplete data (null values) - Fixed JSON parsing regex
- [x] **FIXED**: Singles/Doubles classification incorrect - Enhanced prompt with clear instructions for counting players per side

## New Features (March 7, 2026)
- [x] **BWF Reference Page** - หน้าข้อมูลอ้างอิงจาก Badminton World Federation
- [x] **BWF Standards in AI Prompt** - AI ใช้เกณฑ์ประเมินตามมาตรฐาน BWF Coach Education Manual
- [x] **BWF Badge on Analysis Page** - แสดงลิงก์อ้างอิง BWF ในหน้าผลวิเคราะห์
- [x] **BWF Banner on Homepage** - แบนเนอร์แสดงว่าใช้มาตรฐาน BWF
- [x] **UI Redesign - Rounded Corners** - ปรับ UI ทุกหน้าให้นุ่มนวลขึ้นด้วย rounded-3xl, rounded-2xl, rounded-full

## UI Design System (Kinetic Flow)
- **Buttons**: rounded-full (pill shape) พร้อม glow effect
- **Cards**: rounded-3xl พร้อม hover effects
- **Badges**: rounded-full 
- **Containers**: rounded-2xl หรือ rounded-xl
- **Colors**: Primary (#ccff00), Blue (#3b82f6), Rose (#f43f5e), Purple (#a855f7)
- **Background**: Dark theme (#09090b, #121214)

## Upcoming Tasks (P1)
- [ ] User Account/Login - เก็บประวัติส่วนตัว
- [ ] Share results - แชร์ผลวิเคราะห์ผ่าน link

## Future Tasks (P2)
- [ ] Enhanced Shot Analysis - วิเคราะห์ท่าตีละเอียดยิ่งขึ้น
- [ ] Multi-language support

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/analyze | Upload video and get analysis |
| GET | /api/analyses | List all analyses |
| GET | /api/analyses/{id} | Get specific analysis |
| GET | /api/videos/{id} | Stream video |
| POST | /api/training-plan | Generate training plan |
| GET | /api/training-plans/{id} | Get training plan |

## File Structure
```
/app/
├── backend/
│   ├── server.py      # Main FastAPI app
│   ├── tests/         # pytest test files
│   └── .env           # Environment variables
└── frontend/
    ├── src/
    │   ├── App.js
    │   ├── pages/
    │   │   ├── HomePage.js      # + BWF Banner
    │   │   ├── HistoryPage.js
    │   │   ├── AnalysisPage.js  # + BWF Reference Link
    │   │   └── ReferencePage.js # NEW - BWF Reference Info
    │   └── components/ui/
    └── .env
```

## BWF Reference Sources
- **Level 1**: https://development.bwfbadminton.com/coaches/level-1
- **Level 2**: https://development.bwfbadminton.com/coaches/level-2
- **Level 3**: https://development.bwfbadminton.com/coaches/level-3
- **Module 6**: Movement Skills (Split Step p.53, Lunge, Recovery)
- **Module 7**: Hitting Skills (Smash p.119, Drop Shot p.121-127, Clear p.125)

## Test Reports
- /app/test_reports/iteration_1.json - All tests passed (Backend 100%, Frontend 100%)
