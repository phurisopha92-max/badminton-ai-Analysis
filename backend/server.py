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
    technique_details: Optional[dict] = None
    footwork_score: Optional[str] = None
    footwork_details: Optional[dict] = None
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
  "technique_score": "คะแนนท่าทางรวม (X/10) พร้อมคำอธิบายสั้นๆ",
  "technique_details": {
    "smash": {
      "score": "X/10",
      "analysis": "วิเคราะห์: จังหวะ, แรงตี, มุมตี, การควบคุม, จุดสัมผัสลูก",
      "issues": ["ปัญหา 1", "ปัญหา 2"],
      "suggestions": ["ข้อแนะนำ 1", "ข้อแนะนำ 2"]
    },
    "clear_lob": {
      "score": "X/10",
      "analysis": "วิเคราะห์: ความสูง, ความลึก, accuracy, การควบคุมพลัง",
      "issues": [],
      "suggestions": []
    },
    "drop_shot": {
      "score": "X/10", 
      "analysis": "วิเคราะห์: ความนุ่ม, การหลอก, placement, จังหวะ",
      "issues": [],
      "suggestions": []
    },
    "net_play": {
      "score": "X/10",
      "analysis": "วิเคราะห์: การตัดลูก, การรอน, ความเร็วมือ, touch",
      "issues": [],
      "suggestions": []
    },
    "serve": {
      "score": "X/10",
      "analysis": "วิเคราะห์: ความสูง, placement, variation, consistency",
      "issues": [],
      "suggestions": []
    },
    "backhand": {
      "score": "X/10",
      "analysis": "วิเคราะห์: เทคนิค, พลัง, ความถี่ในการใช้, ความมั่นใจ",
      "issues": [],
      "suggestions": []
    },
    "forehand": {
      "score": "X/10",
      "analysis": "วิเคราะห์: ความแข็งแรง, accuracy, variety, timing",
      "issues": [],
      "suggestions": []
    },
    "defense": {
      "score": "X/10",
      "analysis": "วิเคราะห์: การรับลูกตี, การบล็อค, reflex, positioning",
      "issues": [],
      "suggestions": []
    }
  },
  "footwork_score": "คะแนนฟุตเวิร์ครวม (X/10) พร้อมคำอธิบายสั้นๆ",
  "footwork_details": {
    "split_step": {
      "score": "X/10",
      "analysis": "วิเคราะห์: จังหวะ, ความสูง, การลงพื้น, ความพร้อม",
      "issues": [],
      "suggestions": []
    },
    "lunge_technique": {
      "score": "X/10",
      "analysis": "วิเคราะห์: ระยะก้าว, ความลึก, การย่อ, การกลับตำแหน่ง",
      "issues": [],
      "suggestions": []
    },
    "recovery_speed": {
      "score": "X/10",
      "analysis": "วิเคราะห์: ความเร็วกลับศูนย์, แรงผลัก, ความราบรื่น",
      "issues": [],
      "suggestions": []
    },
    "court_movement": {
      "score": "X/10",
      "analysis": "วิเคราะห์: รูปแบบการเคลื่อนที่, efficiency, การครอบคลุมสนาม",
      "issues": [],
      "suggestions": []
    },
    "chasse_steps": {
      "score": "X/10",
      "analysis": "วิเคราะห์: ความเร็ว, จังหวะ, การใช้ในสถานการณ์ต่างๆ",
      "issues": [],
      "suggestions": []
    },
    "crossover_steps": {
      "score": "X/10",
      "analysis": "วิเคราะห์: การข้ามเท้า, ความเร็ว, ความถูกต้อง",
      "issues": [],
      "suggestions": []
    },
    "jump_footwork": {
      "score": "X/10",
      "analysis": "วิเคราะห์: การกระโดด-ตี, ความสูง, balance, การลงพื้น",
      "issues": [],
      "suggestions": []
    },
    "directional_change": {
      "score": "X/10",
      "analysis": "วิเคราะห์: ความเร็วเปลี่ยนทิศ, การหยุด-เริ่มใหม่, agility",
      "issues": [],
      "suggestions": []
    }
  },
  "strengths": ["จุดแข็ง 1", "จุดแข็ง 2", "จุดแข็ง 3"],
  "weaknesses": ["จุดอ่อน 1", "จุดอ่อน 2", "จุดอ่อน 3"],
  "recommendations": ["คำแนะนำ 1", "คำแนะนำ 2", "คำแนะนำ 3"],
  "timeline_analysis": [...],
  "positioning_analysis": "...",
  "power_generation": "...",
  "court_coverage": "...",
  "biomechanics": {...},
  "doubles_analysis": {...},
  "full_analysis": "..."
}

**การวิเคราะห์ TECHNIQUE (ท่าทาง) แบบละเอียด:**

1. **SMASH (สแมช)**
   - จังหวะ: การเตรียมตัว, การจับจังหวะ
   - แรงตี: การใช้พลังทั้งตัว
   - มุมตี: steep/flat, ความหลากหลาย
   - การควบคุม: placement accuracy
   - จุดสัมผัส: contact point ที่เหมาะสม

2. **CLEAR/LOB (ลูกยาว)**
   - ความสูง: สูงพอป้องกันการตัดหรือไม่
   - ความลึก: ถึงเส้นหลังหรือสั้นเกินไป
   - Accuracy: ตรงเป้าหรือเบี่ยงไป
   - การควบคุมพลัง: แรงเหมาะสม

3. **DROP SHOT (ดรอป)**
   - ความนุ่ม: touch ที่ดี
   - การหลอก: disguise เหมือนลูกยาว
   - Placement: placement ใกล้เน็ต
   - จังหวะ: timing ที่เหมาะสม

4. **NET PLAY (เล่นหน้าเน็ต)**
   - การตัดลูก: net kill sharp
   - การรอน: tumbling net
   - ความเร็วมือ: hand speed
   - Touch: ความนุ่มนวล

5. **SERVE (เสิร์ฟ)**
   - ความสูง: short/high serve
   - Placement: มุมต่างๆ
   - Variation: หลากหลาย
   - Consistency: สม่ำเสมอ

6. **BACKHAND (แบ็คแฮนด์)**
   - เทคนิค: การจับ, การตี
   - พลัง: แรงพอหรือไม่
   - ความถี่: ใช้บ่อยแค่ไหน
   - ความมั่นใจ: comfort level

7. **FOREHAND (ฟอร์แฮนด์)**
   - ความแข็งแรง: power
   - Accuracy: แม่นยำ
   - Variety: หลากหลาย
   - Timing: จังหวะ

8. **DEFENSE (การรับ)**
   - การรับลูกตี: defense against smash
   - การบล็อค: blocking
   - Reflex: ปฏิกิริยา
   - Positioning: การยืนรับ

**การวิเคราะห์ FOOTWORK (ฟุตเวิร์ค) แบบละเอียด:**

1. **SPLIT STEP (จังหวะขาแยก)**
   - จังหวะ: ตรงเวลาที่คู่ต่อสู้ตีหรือไม่
   - ความสูง: กระโดดสูงเกินหรือต่ำเกิน
   - การลงพื้น: เบาและพร้อม
   - ความพร้อม: พร้อมวิ่งทุกทิศ

2. **LUNGE (ก้าวยาว)**
   - ระยะก้าว: ยาวพอถึงลูก
   - ความลึก: ย่อต่ำพอ
   - การย่อ: หัวเข่าไม่เกิน 90 องศา
   - การกลับ: recovery ได้เร็ว

3. **RECOVERY (การกลับ)**
   - ความเร็ว: กลับศูนย์เร็วแค่ไหน
   - แรงผลัก: push-off ดี
   - ความราบรื่น: smooth movement

4. **COURT MOVEMENT (การเคลื่อนที่)**
   - รูปแบบ: เป็นรูปดาว/วงกลม
   - Efficiency: ประหยัดพลังงาน
   - Coverage: ครอบคลุมทั่วสนาม

5. **CHASSE STEPS (ก้าวซ้อน)**
   - ความเร็ว: เร็วแค่ไหน
   - จังหวะ: ถูกต้อง
   - การใช้: ใช้ในสถานการณ์เหมาะสม

6. **CROSSOVER (ข้ามเท้า)**
   - การข้าม: smooth crossover
   - ความเร็ว: เพิ่มความเร็ว
   - ความถูกต้อง: ไม่สะดุด

7. **JUMP FOOTWORK (กระโดด)**
   - การกระโดด-ตี: jump smash
   - ความสูง: สูงพอ
   - Balance: สมดุล
   - การลงพื้น: ปลอดภัย

8. **DIRECTIONAL CHANGE (เปลี่ยนทิศ)**
   - ความเร็ว: เปลี่ยนทิศเร็ว
   - การหยุด-เริ่ม: quick stop & go
   - Agility: ความคล่องตัว

ให้วิเคราะห์แต่ละท่าที่เห็นในวิดีโอ ถ้าไม่มีท่าไหนเลย ให้ใส่ "ไม่มีในวิดีโอ" หรือ score = "N/A"

ตอบกลับเป็น JSON เท่านั้น"""
        
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