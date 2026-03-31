# Badminton AI Analyzer - Product Requirements Document

## Original Problem Statement
สร้าง Badminton AI Analyzer สำหรับวิเคราะห์การเคลื่อนที่ของนักกีฬาแบมินตัน ประเมินว่าใช้ท่าที่ถูกหรือไม่ ฟุตเวิร์คดีไหม มีจุดอ่อน จุดดีอะไร แล้วนำข้อมูลมาต่อยอดเป็นแผนการฝึกซ้อมเพื่อพัฒนาต่อไป โดยนำเข้าผ่านการอัปโหลดคลิปวิดีโอ แล้วให้ AI ประเมิน

## User Personas
- นักกีฬาแบมินตันทุกระดับที่ต้องการพัฒนาทักษะ
- โค้ชที่ต้องการเครื่องมือวิเคราะห์และดูแลนักกีฬาหลายคน
- ภาษาหลัก: ภาษาไทย

## Implemented Features ✅

### Core Features
- [x] Video upload และเก็บใน GridFS
- [x] AI analysis ด้วย Gemini (technique, footwork, biomechanics)
- [x] Singles/Doubles detection
- [x] Training plan generation
- [x] History page with past analyses

### Advanced Features
- [x] BWF Reference Page
- [x] Progress Tracking (charts)
- [x] Video Comparison (side-by-side)
- [x] Export PDF
- [x] Game Analysis (500MB videos)

### Authentication System
- [x] Email/Password registration & login
- [x] Google Social Login (Emergent-managed)
- [x] Guest Mode
- [x] User-isolated data
- [x] **Public homepage** (ไม่ต้อง login ก่อนเข้า)
- [x] **Login button ที่ Sidebar ซ้ายล่าง**

### Share & Coach Features ✅
- [x] Share Link Feature - แชร์ผลวิเคราะห์ให้โค้ช
- [x] Coach Mode - ดูแลนักกีฬาหลายคน
- [x] Coach Dashboard

### Subscription System ✅ NEW (March 31, 2026)
- [x] **Free Tier**: 5 วิดีโอ/เดือน
- [x] **Coach Monthly**: $10/เดือน - ไม่จำกัดวิดีโอ + โหมดโค้ช
- [x] **Coach Yearly**: $99/ปี (ประหยัด $21)
- [x] **Stripe Payment**: Credit Card checkout
- [x] **PromptPay**: Manual verification (Thai banking)
- [x] Usage tracking และ limit enforcement
- [x] Subscription status page
- [x] Usage indicator ใน Sidebar

## Technology Stack
- **Frontend**: React, React Router, Tailwind CSS, Shadcn UI, axios, recharts
- **Backend**: FastAPI, Motor (async MongoDB), Pydantic
- **Database**: MongoDB with GridFS
- **AI**: emergentintegrations library + Gemini gemini-3-flash-preview
- **Payment**: Stripe + PromptPay manual

## API Endpoints

### Subscription (NEW)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/subscription/packages | แสดงแพ็คเกจทั้งหมด |
| GET | /api/subscription/status | สถานะ subscription และ usage |
| POST | /api/subscription/checkout | สร้าง Stripe checkout |
| GET | /api/subscription/checkout/status/{session_id} | ตรวจสอบการจ่ายเงิน |
| POST | /api/subscription/promptpay | สร้าง PromptPay payment |
| POST | /api/webhook/stripe | Stripe webhook |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | สมัครสมาชิก |
| POST | /api/auth/login | เข้าสู่ระบบ |
| POST | /api/auth/google/session | Login ด้วย Google |
| POST | /api/auth/guest | ทดสอบแบบ Guest |
| GET | /api/auth/me | ข้อมูลผู้ใช้ |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/analyze | อัปโหลดและวิเคราะห์ (จำกัด 5/เดือน สำหรับ free) |
| POST | /api/game-analyze | วิเคราะห์เกมยาว |
| GET | /api/analyses | รายการการวิเคราะห์ |

### Share Links & Coach
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/share/create | สร้างลิงก์แชร์ |
| GET | /api/share/{share_id} | ดูผลวิเคราะห์ (ไม่ต้อง auth) |
| POST | /api/coach/upgrade | อัปเกรดเป็นโค้ช |
| POST | /api/coach/invite/create | สร้างรหัสเชิญ |
| GET | /api/coach/athletes | รายการนักกีฬา |

## Database Collections
- **users**: user_id, email, name, role, coach_id
- **user_sessions**: session_token, user_id, expires_at
- **analyses** / **game_analyses**: user_id, scores, details
- **share_links**: share_id, analysis_id, user_id, expires_at
- **coach_invites**: invite_code, coach_id, used_by, expires_at
- **coach_athletes**: coach_id, athlete_id, athlete_name
- **subscriptions**: subscription_id, user_id, plan, expires_at, status
- **payment_transactions**: transaction_id, user_id, amount, payment_status
- **usage_tracking**: user_id, month_year, video_count

## Routes
| Path | Component | Auth Required |
|------|-----------|---------------|
| / | HomePage | ❌ No |
| /login | LoginPage | ❌ No |
| /reference | ReferencePage | ❌ No |
| /subscription | SubscriptionPage | ❌ No |
| /shared/:shareId | SharedAnalysisPage | ❌ No |
| /current-analysis | CurrentAnalysisPage | ✅ Yes |
| /analysis/:id | AnalysisPage | ✅ Yes |
| /history | HistoryPage | ✅ Yes |
| /progress | ProgressPage | ✅ Yes |
| /compare | ComparePage | ✅ Yes |
| /game-analysis | GameAnalysisPage | ✅ Yes |
| /coach | CoachDashboardPage | ✅ Yes |

## Upcoming Tasks (P1)
- [ ] Video Timestamp Marking - ทำเครื่องหมายจุดเวลาที่มีปัญหาในวิดีโอ
- [ ] Training Reminders - แจ้งเตือนการฝึกซ้อม
- [ ] Coach Comments - โค้ชให้ feedback นักกีฬา

## Future Tasks (P2-P4)
- [ ] Pro Athlete Comparison
- [ ] Admin Dashboard for manual PromptPay verification
- [ ] Multi-language support

## Test Reports
- /app/test_reports/iteration_1.json - Initial testing
- /app/test_reports/iteration_2.json - Auth testing
- /app/test_reports/iteration_3.json - Share & Coach features
- /app/test_reports/iteration_4.json - Subscription system

## Test Credentials
- Coach: testcoach@test.com / test123
- Athlete: athlete@test.com / test123
- Guest Mode: Available via "ทดลองใช้งาน" button
