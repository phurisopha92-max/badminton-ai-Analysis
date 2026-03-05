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
        
        prompt = """วิเคราะห์วิดีโอแบมินตันนี้แบบละเอียด ตอบเป็น JSON เท่านั้น:

{
  "player_count": 1 หรือ 2,
  "technique_score": "คะแนน X/10 พร้อมคำอธิบาย",
  "technique_details": {
    "smash": {"score": "X/10", "analysis": "...", "issues": ["..."], "suggestions": ["..."]},
    "clear_lob": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "drop_shot": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "net_play": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "serve": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "backhand": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "forehand": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "defense": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []}
  },
  "footwork_score": "คะแนน X/10 พร้อมคำอธิบาย",
  "footwork_details": {
    "split_step": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "lunge_technique": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "recovery_speed": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "court_movement": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "chasse_steps": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "crossover_steps": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "jump_footwork": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []},
    "directional_change": {"score": "X/10", "analysis": "...", "issues": [], "suggestions": []}
  },
  "strengths": ["จุดแข็ง 1", "จุดแข็ง 2", "จุดแข็ง 3"],
  "weaknesses": ["จุดอ่อน 1", "จุดอ่อน 2"],
  "recommendations": ["คำแนะนำ 1", "คำแนะนำ 2"],
  "biomechanics": {
    "elbow_position": "...", "elbow_angle": "...", "body_rotation": "...",
    "hip_rotation": "...", "shoulder_alignment": "...", "feet_spacing": "...",
    "knee_bend_depth": "...", "knee_bend_timing": "...", "wrist_action": "...",
    "grip_analysis": "...", "weight_transfer": "...", "jump_technique": "..."
  },
  "doubles_analysis": {
    "applicable": true/false,
    "formation": "...", "rotation_quality": "...", "partner_coordination": "...",
    "court_coverage_team": "...", "communication": "...", "position_switching": "...",
    "gap_coverage": "...", "overlap_issues": "...",
    "attack_defense_transition": "...", "front_back_balance": "..."
  }
}

**วิเคราะห์:**
1. นับผู้เล่น (1=เดี่ยว, 2=คู่)
2. ให้คะแนนและวิเคราะห์ท่าทาง 8 ท่า: smash, clear/lob, drop, net play, serve, backhand, forehand, defense
3. ให้คะแนนและวิเคราะห์ฟุตเวิร์ค 8 ท่า: split step, lunge, recovery, movement, chasse, crossover, jump, direction change
4. วิเคราะห์ biomechanics: ศอก, ตัว, สะโพก, ไหล่, เท้า, เข่า, ข้อมือ, จับไม้, น้ำหนัก, กระโดด
5. ถ้าเป็นคู่ (player_count=2) ให้วิเคราะห์ doubles: formation, rotation, coordination, coverage, communication, switching, gaps, overlaps, transition, balance
6. ถ้าเป็นเดี่ยว ให้ doubles_analysis.applicable = false

ถ้าไม่เห็นท่าไหนในวิดีโอ ให้ score = "N/A"

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายอื่น"""
        
        user_message = UserMessage(
            text=prompt,
            file_contents=[video_file_obj]
        )
        
        response = await chat.send_message(user_message)
        
        import json
        import re
        
        logging.info(f"LLM Response (first 2000 chars): {response[:2000] if response else 'Empty response'}")
        
        # Extract JSON from response - improved regex for nested objects
        # Try to find JSON block between ```json and ``` first
        code_block_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', response, re.DOTALL)
        if code_block_match:
            json_str = code_block_match.group(1)
            logging.info("Found JSON in code block")
        else:
            # Try to find raw JSON object
            json_str = None
            # Find the first { and match to the last }
            start_idx = response.find('{')
            if start_idx != -1:
                depth = 0
                end_idx = start_idx
                for i, char in enumerate(response[start_idx:], start_idx):
                    if char == '{':
                        depth += 1
                    elif char == '}':
                        depth -= 1
                        if depth == 0:
                            end_idx = i
                            break
                json_str = response[start_idx:end_idx+1]
                logging.info(f"Found raw JSON from index {start_idx} to {end_idx}")
        
        if json_str:
            try:
                analysis_data = json.loads(json_str)
                logging.info(f"Successfully parsed JSON with keys: {list(analysis_data.keys())}")
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
            technique_details=analysis_data.get("technique_details"),
            footwork_score=analysis_data.get("footwork_score"),
            footwork_details=analysis_data.get("footwork_details"),
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