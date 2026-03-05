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

## Bug Fixes (March 5, 2026)
- [x] **FIXED**: AI analysis returning incomplete data (null values) - Fixed JSON parsing regex

## Upcoming Tasks (P1)
- [ ] Video Comparison Feature - เปรียบเทียบการวิเคราะห์ 2 ครั้งพร้อมกัน
- [ ] Progress Tracking - แสดงกราฟพัฒนาการของผู้เล่นตามเวลา

## Future Tasks (P2)
- [ ] Enhanced Shot Analysis - วิเคราะห์ท่าตีละเอียดยิ่งขึ้น
- [ ] Export reports (PDF)
- [ ] Share results

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
    │   │   ├── HomePage.js
    │   │   ├── HistoryPage.js
    │   │   └── AnalysisPage.js
    │   └── components/ui/
    └── .env
```

## Test Reports
- /app/test_reports/iteration_1.json - All tests passed (Backend 100%, Frontend 100%)
