from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import tempfile
import shutil
from emergentintegrations.llm.chat import FileContentWithMimeType, LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'sk-emergent-0E0D2FaAa0bD856040')

class Analysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_filename: str
    technique_score: Optional[str] = None
    footwork_score: Optional[str] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
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
    try:
        suffix = Path(file.filename).suffix
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        
        shutil.copyfileobj(file.file, temp_file)
        temp_file.close()
        
        video_file = FileContentWithMimeType(
            file_path=temp_file.name,
            mime_type=file.content_type
        )
        
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=f"analysis_{uuid.uuid4()}",
            system_message="คุณเป็นโค้ชแบมินตันมืออาชีพที่เชี่ยวชาญในการวิเคราะห์ท่าทางและการเคลื่อนไหวของนักกีฬา ให้วิเคราะห์อย่างละเอียดและให้คำแนะนำเชิงลึก"
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = """วิเคราะห์วิดีโอการเล่นแบมินตันนี้อย่างละเอียด โดยให้คำตอบในรูปแบบ JSON ดังนี้:

{
  "technique_score": "คะแนนท่าทาง (0-10) พร้อมคำอธิบาย",
  "footwork_score": "คะแนนฟุตเวิร์ค (0-10) พร้อมคำอธิบาย",
  "strengths": ["จุดแข็ง 1", "จุดแข็ง 2", "จุดแข็ง 3"],
  "weaknesses": ["จุดอ่อน 1", "จุดอ่อน 2", "จุดอ่อน 3"],
  "recommendations": ["คำแนะนำ 1", "คำแนะนำ 2", "คำแนะนำ 3"],
  "full_analysis": "การวิเคราะห์โดยละเอียดทั้งหมด"
}

โปรดวิเคราะห์:
1. ท่าทาง (Technique): การจับไม้, การตี, การสวิง
2. ฟุตเวิร์ค (Footwork): การเคลื่อนที่, การวางตัว, ความเร็ว
3. จุดแข็ง: สิ่งที่ทำได้ดี
4. จุดอ่อน: สิ่งที่ควรปรับปรุง
5. คำแนะนำ: แนวทางการฝึกซ้อมเพื่อพัฒนา

ตอบกลับเป็น JSON เท่านั้น ไม่ต้องมีข้อความอื่น"""
        
        user_message = UserMessage(
            text=prompt,
            file_contents=[video_file]
        )
        
        response = await chat.send_message(user_message)
        
        import json
        import re
        
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response, re.DOTALL)
        if json_match:
            analysis_data = json.loads(json_match.group())
        else:
            analysis_data = {
                "technique_score": "ไม่สามารถประเมินได้",
                "footwork_score": "ไม่สามารถประเมินได้",
                "strengths": [],
                "weaknesses": [],
                "recommendations": [],
                "full_analysis": response
            }
        
        analysis = Analysis(
            video_filename=file.filename,
            technique_score=analysis_data.get("technique_score"),
            footwork_score=analysis_data.get("footwork_score"),
            strengths=analysis_data.get("strengths", []),
            weaknesses=analysis_data.get("weaknesses", []),
            recommendations=analysis_data.get("recommendations", []),
            full_analysis=analysis_data.get("full_analysis")
        )
        
        doc = analysis.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.analyses.insert_one(doc)
        
        return analysis
        
    except Exception as e:
        logging.error(f"Error analyzing video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการวิเคราะห์: {str(e)}")
    
    finally:
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

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
    ).with_model("gemini", "gemini-2.5-pro-preview-05-06")
    
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