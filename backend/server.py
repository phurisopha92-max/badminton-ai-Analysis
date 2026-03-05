from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import gridfs
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import tempfile
import shutil
import io
from emergentintegrations.llm.chat import FileContentWithMimeType, LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# GridFS สำหรับเก็บวิดีโอ
sync_client = MongoClient(mongo_url)
sync_db = sync_client[os.environ['DB_NAME']]
fs = gridfs.GridFS(sync_db)

app = FastAPI()
api_router = APIRouter(prefix="/api")

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'sk-emergent-0E0D2FaAa0bD856040')

class BiomechanicsDetail(BaseModel):
    elbow_position: Optional[str] = None
    elbow_angle: Optional[str] = None
    body_rotation: Optional[str] = None
    hip_rotation: Optional[str] = None
    shoulder_alignment: Optional[str] = None
    feet_spacing: Optional[str] = None
    knee_bend_depth: Optional[str] = None
    knee_bend_timing: Optional[str] = None
    wrist_action: Optional[str] = None
    grip_analysis: Optional[str] = None
    weight_transfer: Optional[str] = None
    jump_technique: Optional[str] = None

class Analysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_filename: str
    video_id: Optional[str] = None
    technique_score: Optional[str] = None
    footwork_score: Optional[str] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    timeline_analysis: Optional[List[dict]] = None
    positioning_analysis: Optional[str] = None
    power_generation: Optional[str] = None
    court_coverage: Optional[str] = None
    biomechanics: Optional[dict] = None
    doubles_analysis: Optional[dict] = None
    full_analysis: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrainingPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    analysis_id: str
    plan_title: str
    exercises: List[dict]
    duration_weeks: int
    focus_areas: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.get("/")
async def root():
    return {"message": "Badminton AI Analyzer API"}

@api_router.post("/analyze", response_model=Analysis)
async def analyze_video(file: UploadFile = File(...)):
    """รับวิดีโอแบมินตัน วิเคราะห์ด้วย Gemini AI และส่งกลับผลการวิเคราะห์"""
    
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="กรุณาอัปโหลดไฟล์วิดีโอเท่านั้น")
    
    temp_file = None
    video_id = None
    
    try:
        suffix = Path(file.filename).suffix
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        
        shutil.copyfileobj(file.file, temp_file)
        temp_file.close()
        
        # เก็บวิดีโอใน GridFS
        with open(temp_file.name, 'rb') as video_file:
            video_id = fs.put(
                video_file,
                filename=file.filename,
                content_type=file.content_type
            )
        
        video_file_obj = FileContentWithMimeType(
            file_path=temp_file.name,
            mime_type=file.content_type
        )
        
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=f"analysis_{uuid.uuid4()}",
            system_message="คุณเป็นโค้ชแบมินตันระดับนานาชาติที่เชี่ยวชาญด้าน biomechanics และการวิเคราะห์ท่าทางแบบละเอียด คุณสามารถสังเกตรายละเอียดเล็กน้อยที่ส่งผลต่อประสิทธิภาพการเล่น"
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = """วิเคราะห์วิดีโอการเล่นแบมินตันนี้อย่างละเอียดมากในระดับ BIOMECHANICS โดยให้คำตอบในรูปแบบ JSON ดังนี้:

{
  "player_count": จำนวนผู้เล่นที่เห็นในวิดีโอ (1=เดี่ยว, 2=คู่),
  "technique_score": "คะแนนท่าทาง (X/10) พร้อมคำอธิบายละเอียด",
  "footwork_score": "คะแนนฟุตเวิร์ค (X/10) พร้อมคำอธิบายละเอียด",
  "strengths": ["จุดแข็ง 1", "จุดแข็ง 2", "จุดแข็ง 3"],
  "weaknesses": ["จุดอ่อน 1", "จุดอ่อน 2", "จุดอ่อน 3"],
  "recommendations": ["คำแนะนำ 1", "คำแนะนำ 2", "คำแนะนำ 3"],
  "timeline_analysis": [
    {
      "time_range": "0:00-0:10",
      "action": "คำอธิบายการเคลื่อนไหว",
      "assessment": "การประเมิน"
    }
  ],
  "positioning_analysis": "วิเคราะห์การวางตำแหน่งร่างกาย การยืน การเตรียมตัว",
  "power_generation": "วิเคราะห์การใช้พลังงาน การหมุนสะโพก การถ่ายน้ำหนัก",
  "court_coverage": "วิเคราะห์การครอบคลุมพื้นที่สนาม การเคลื่อนที่",
  "biomechanics": {
    "elbow_position": "วิเคราะห์ตำแหน่งศอก: สูง/ต่ำ/พอดี, การยกศอก, ระยะห่างจากลำตัว",
    "elbow_angle": "วิเคราะห์มุมศอก: มุมเมื่อเตรียมตี, มุมเมื่อสัมผัสลูก, การเปลี่ยนมุม",
    "body_rotation": "วิเคราะห์การพลิกตัว: ระดับการหมุนลำตัว, จังหวะการหมุน, ความเร็วการหมุน",
    "hip_rotation": "วิเคราะห์การหมุนสะโพก: การเริ่มต้น, ช่วงการหมุน, การหมุนตาม",
    "shoulder_alignment": "วิเคราะห์การจัดแนวไหล่: ความสมดุล, การหมุน, ระดับสูง-ต่ำ",
    "feet_spacing": "วิเคราะห์ระยะห่างเท้า: กว้าง/แคบ/พอดี, ทิศทาง, การปรับเปลี่ยน",
    "knee_bend_depth": "วิเคราะห์ระดับการย่อ: ตื้น/ลึก/พอดี, ความสม่ำเสมอ, มุมหัวเข่า",
    "knee_bend_timing": "วิเคราะห์จังหวะการย่อ: เวลาที่ย่อ, ระยะเวลา, การลุกขึ้น",
    "wrist_action": "วิเคราะห์การใช้ข้อมือ: การ snap, การหมุน, ความยืดหยุ่น, timing",
    "grip_analysis": "วิเคราะห์การจับไม้: แบบจับ (forehand/backhand), ความแน่น, ตำแหน่งนิ้ว",
    "weight_transfer": "วิเคราะห์การถ่ายน้ำหนัก: ทิศทาง, เวลา, ความราบรื่น, แรงกด",
    "jump_technique": "วิเคราะห์เทคนิคการกระโดด: ความสูง, การออกแรง, การลงพื้น, ทิศทาง"
  },
  "doubles_analysis": {
    "applicable": true/false (ถ้าเป็นวิดีโอคู่ ให้ true, เดี่ยวให้ false),
    "formation": "การจัดรูปแบบ: Attack (หน้า-หลัง), Defense (เคียงบ่า), Mixed, การเปลี่ยนรูปแบบ",
    "rotation_quality": "คุณภาพการหมุนเวียนตำแหน่ง: ราบรื่น/ติดขัด, ความเร็ว, ความถูกต้อง",
    "partner_coordination": "การประสานงานคู่: จังหวะการเคลื่อนไหว, การตอบสนองซึ่งกันและกัน, ความเข้าใจ",
    "court_coverage_team": "การครอบคลุมสนามเป็นทีม: การแบ่งพื้นที่, การช่วยเหลือกัน, ช่องว่างที่เหลือ",
    "communication": "การสื่อสาร: การเรียกลูก, eye contact, body language, ความชัดเจน",
    "position_switching": "การสลับตำแหน่ง: ความเหมาะสม, ความเร็ว, การตัดสินใจ",
    "gap_coverage": "การปิดช่องว่าง: การระบุช่องว่าง, ความเร็วในการปิด, ประสิทธิภาพ",
    "overlap_issues": "ปัญหาการทับซ้อน: ความถี่, สาเหตุ, ผลกระทบ, ข้อเสนอแนะ",
    "attack_defense_transition": "การเปลี่ยนจากรุกเป็นรับ: ความเร็ว, ความราบรื่น, การปรับตัว",
    "front_back_balance": "สมดุลหน้า-หลัง: การแบ่งหน้าที่, ความสมดุลในการโจมตี-รับ"
  },
  "full_analysis": "สรุปการวิเคราะห์โดยรวมแบบละเอียด"
}

**หลักการวิเคราะห์แบบละเอียด:**

**ส่วนที่ 1: BIOMECHANICS (ทุกประเภท)**
[เหมือนเดิม - วิเคราะห์ศอก, การพลิกตัว, เท้า, การย่อ, ข้อมือ, จับไม้, ถ่ายน้ำหนัก, กระโดด]

**ส่วนที่ 2: DOUBLES ANALYSIS (เฉพาะคู่)**
ให้ตรวจสอบก่อนว่า:
- มีผู้เล่น 2 คนในวิดีโอหรือไม่?
- ถ้าใช่ ให้วิเคราะห์ doubles_analysis แบบละเอียด
- ถ้าเป็นเดี่ยว (1 คน) ให้ doubles_analysis.applicable = false

**การวิเคราะห์คู่ (DOUBLES):**

1. **Formation (รูปแบบการตั้ง)**
   - Attack Formation: คนหนึ่งหน้าเน็ต คนหนึ่งหลัง (aggressive)
   - Defense Formation: เคียงบ่ากัน (side-by-side) รับลูกแบน
   - Mixed/Rotating: เปลี่ยนไปมาตามสถานการณ์
   - ประเมิน: เหมาะสมกับสถานการณ์หรือไม่?

2. **Rotation (การหมุนเวียน)**
   - ราบรื่น: เปลี่ยนตำแหน่งโดยไม่สับสน
   - ติดขัด: มีช่วงที่ไม่รู้ว่าใครรับ
   - เวลา: เร็วพอหรือช้าเกินไป
   - ความถูกต้อง: หมุนไปถูกทิศหรือไม่

3. **Partner Coordination (การประสานงาน)**
   - จังหวะการเคลื่อนไหว: พร้อมกันหรือแยกส่วน
   - การตอบสนอง: เข้าใจการเคลื่อนไหวของคู่
   - ความเข้าใจ: มี chemistry หรือยังไม่ลงตัว

4. **Court Coverage (ครอบคลุมสนาม)**
   - การแบ่งพื้นที่: ชัดเจนหรือเหลื่อมซ้อน
   - ช่องว่าง: มีช่องว่างเสี่ยงหรือไม่
   - การช่วยเหลือ: ช่วยกันครอบคลุมตอนคู่ไปไม่ทัน

5. **Communication (การสื่อสาร)**
   - การเรียกลูก: ชัดเจน "ของฉัน" / "ของเธอ"
   - Eye contact: มองหากันก่อนตี
   - Body language: ใช้สัญญาณมือ/ร่างกาย
   - ความชัดเจน: เข้าใจกันหรือสับสน

6. **Position Switching (สลับตำแหน่ง)**
   - ความเหมาะสม: สลับเมื่อจำเป็น
   - ความเร็ว: สลับทันเวลาหรือไม่
   - การตัดสินใจ: รู้เมื่อไหร่ควรสลับ

7. **Gap Coverage (ปิดช่องว่าง)**
   - การระบุ: เห็นช่องว่างหรือไม่
   - ความเร็ว: ปิดทันหรือช้า
   - ประสิทธิภาพ: ปิดได้ดีหรือยังมีช่องเสี่ยง

8. **Overlap Issues (ทับซ้อน)**
   - ความถี่: บ่อยแค่ไหนที่ทั้งคู่ไปรับลูกเดียวกัน
   - สาเหตุ: การสื่อสารไม่ดี, ไม่รู้หน้าที่
   - ผลกระทบ: เสียจังหวะ, เสียแต้ม
   - แก้ไข: ข้อเสนอแนะการปรับปรุง

9. **Attack-Defense Transition (เปลี่ยนรุก-รับ)**
   - ความเร็ว: จาก defense → attack เร็วไหม
   - ความราบรื่น: เปลี่ยนโดยไม่สะดุด
   - การปรับตัว: ทั้งคู่เปลี่ยนพร้อมกันหรือไม่

10. **Front-Back Balance (สมดุลหน้า-หลัง)**
    - การแบ่งหน้าที่: ชัดเจนว่าใครหน้า ใครหลัง
    - ความสมดุล: ไม่ปล่อยให้ฝ่ายใดฝ่ายหนึ่งทำงานหนักเกินไป
    - การหมุนเปลี่ยน: เปลี่ยนกันเพื่อความสมดุล

**สิ่งที่ต้องมอง:**
- มุมต่างๆ ของข้อต่อ
- ลำดับการเคลื่อนไหว (kinetic chain)
- จังหวะและ timing
- ความสมดุลของร่างกาย
- การใช้พลังอย่างมีประสิทธิภาพ
- **สำหรับคู่: การทำงานเป็นทีม, การประสานงาน, การครอบคลุมสนามร่วมกัน**

ตอบกลับเป็น JSON เท่านั้น ไม่ต้องมีข้อความอื่น"""
        
        user_message = UserMessage(
            text=prompt,
            file_contents=[video_file_obj]
        )
        
        response = await chat.send_message(user_message)
        
        import json
        import re
        
        # Extract JSON from response
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response, re.DOTALL)
        if json_match:
            analysis_data = json.loads(json_match.group())
        else:
            analysis_data = {
                "technique_score": "ไม่สามารถวิเคราะห์ได้",
                "footwork_score": "ไม่สามารถวิเคราะห์ได้",
                "strengths": [],
                "weaknesses": [],
                "recommendations": [],
                "timeline_analysis": [],
                "positioning_analysis": "ไม่สามารถวิเคราะห์ได้",
                "power_generation": "ไม่สามารถวิเคราะห์ได้",
                "court_coverage": "ไม่สามารถวิเคราะห์ได้",
                "biomechanics": {},
                "full_analysis": response
            }
        
        analysis = Analysis(
            video_filename=file.filename,
            video_id=str(video_id),
            technique_score=analysis_data.get("technique_score"),
            footwork_score=analysis_data.get("footwork_score"),
            strengths=analysis_data.get("strengths", []),
            weaknesses=analysis_data.get("weaknesses", []),
            recommendations=analysis_data.get("recommendations", []),
            timeline_analysis=analysis_data.get("timeline_analysis", []),
            positioning_analysis=analysis_data.get("positioning_analysis"),
            power_generation=analysis_data.get("power_generation"),
            court_coverage=analysis_data.get("court_coverage"),
            biomechanics=analysis_data.get("biomechanics", {}),
            doubles_analysis=analysis_data.get("doubles_analysis"),
            full_analysis=analysis_data.get("full_analysis")
        )
        
        doc = analysis.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.analyses.insert_one(doc)
        
        return analysis
        
    except Exception as e:
        logging.error(f"Error analyzing video: {str(e)}")
        if video_id:
            fs.delete(video_id)
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการวิเคราะห์: {str(e)}")
    
    finally:
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

@api_router.get("/videos/{video_id}")
async def get_video(video_id: str):
    """ดาวน์โหลดวิดีโอจาก GridFS"""
    try:
        from bson import ObjectId
        video = fs.get(ObjectId(video_id))
        
        def iterfile():
            yield from video
        
        return StreamingResponse(
            iterfile(),
            media_type=video.content_type or "video/mp4",
            headers={
                "Content-Disposition": f"inline; filename={video.filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="ไม่พบวิดีโอนี้")

@api_router.get("/analyses", response_model=List[Analysis])
async def get_analyses():
    """ดึงรายการการวิเคราะห์ทั้งหมด"""
    analyses = await db.analyses.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for analysis in analyses:
        if isinstance(analysis['created_at'], str):
            analysis['created_at'] = datetime.fromisoformat(analysis['created_at'])
    
    return analyses

@api_router.get("/analyses/{analysis_id}", response_model=Analysis)
async def get_analysis(analysis_id: str):
    """ดึงการวิเคราะห์เฉพาะรายการ"""
    analysis = await db.analyses.find_one({"id": analysis_id}, {"_id": 0})
    
    if not analysis:
        raise HTTPException(status_code=404, detail="ไม่พบการวิเคราะห์นี้")
    
    if isinstance(analysis['created_at'], str):
        analysis['created_at'] = datetime.fromisoformat(analysis['created_at'])
    
    return Analysis(**analysis)

@api_router.post("/training-plan", response_model=TrainingPlan)
async def create_training_plan(analysis_id: str):
    """สร้างแผนการฝึกซ้อมจากผลการวิเคราะห์"""
    
    analysis = await db.analyses.find_one({"id": analysis_id}, {"_id": 0})
    
    if not analysis:
        raise HTTPException(status_code=404, detail="ไม่พบการวิเคราะห์นี้")
    
    chat = LlmChat(
        api_key=GEMINI_API_KEY,
        session_id=f"training_{uuid.uuid4()}",
        system_message="คุณเป็นโค้ชแบมินตันที่เชี่ยวชาญในการออกแบบแผนการฝึกซ้อม"
    ).with_model("gemini", "gemini-3-flash-preview")
    
    prompt = f"""จากผลการวิเคราะห์นี้:

จุดแข็ง: {', '.join(analysis.get('strengths', []))}
จุดอ่อน: {', '.join(analysis.get('weaknesses', []))}
คำแนะนำ: {', '.join(analysis.get('recommendations', []))}

โปรดสร้างแผนการฝึกซ้อม 4 สัปดาห์ ในรูปแบบ JSON:

{{
  "plan_title": "ชื่อแผนการฝึก",
  "duration_weeks": 4,
  "focus_areas": ["พื้นที่ที่เน้น 1", "พื้นที่ที่เน้น 2"],
  "exercises": [
    {{
      "week": 1,
      "day": "จันทร์",
      "exercise_name": "ชื่อกิจกรรม",
      "description": "คำอธิบาย",
      "duration_minutes": 30,
      "sets": 3,
      "reps": 10
    }}
  ]
}}

สร้างแผนฝึกที่ครอบคลุม 4 สัปดาห์ อย่างน้อย 3 วัน/สัปดาห์ ตอบกลับเป็น JSON เท่านั้น"""
    
    try:
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        import json
        import re
        
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response, re.DOTALL)
        if json_match:
            plan_data = json.loads(json_match.group())
        else:
            raise ValueError("ไม่สามารถแปลงผลลัพธ์เป็น JSON ได้")
        
        training_plan = TrainingPlan(
            analysis_id=analysis_id,
            plan_title=plan_data.get("plan_title", "แผนการฝึกซ้อมแบมินตัน"),
            exercises=plan_data.get("exercises", []),
            duration_weeks=plan_data.get("duration_weeks", 4),
            focus_areas=plan_data.get("focus_areas", [])
        )
        
        doc = training_plan.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.training_plans.insert_one(doc)
        
        return training_plan
        
    except Exception as e:
        logging.error(f"Error creating training plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการสร้างแผนฝึกซ้อม: {str(e)}")

@api_router.get("/training-plans/{analysis_id}", response_model=TrainingPlan)
async def get_training_plan(analysis_id: str):
    """ดึงแผนการฝึกซ้อมสำหรับการวิเคราะห์"""
    plan = await db.training_plans.find_one({"analysis_id": analysis_id}, {"_id": 0})
    
    if not plan:
        raise HTTPException(status_code=404, detail="ไม่พบแผนการฝึกซ้อมนี้")
    
    if isinstance(plan['created_at'], str):
        plan['created_at'] = datetime.fromisoformat(plan['created_at'])
    
    return TrainingPlan(**plan)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    sync_client.close()