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
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

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

GEMINI_API_KEY = os.environ.get('EMERGENT_LLM_KEY')
if not GEMINI_API_KEY:
    raise ValueError("EMERGENT_LLM_KEY environment variable is required")

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
    
    # ตรวจสอบขนาดไฟล์ (max 100MB)
    file_size = 0
    content = await file.read()
    file_size = len(content)
    await file.seek(0)  # Reset file pointer
    
    if file_size > 100 * 1024 * 1024:  # 100MB
        raise HTTPException(status_code=400, detail="ไฟล์วิดีโอต้องมีขนาดไม่เกิน 100MB")
    
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
            system_message="""คุณเป็นโค้ชแบดมินตันระดับนานาชาติที่ได้รับการรับรองจาก BWF (Badminton World Federation) มีประสบการณ์มากกว่า 20 ปี

**หน้าที่ของคุณ:**
1. ดูวิดีโอแบดมินตันอย่างละเอียด สังเกตทุก frame
2. วิเคราะห์ตามมาตรฐาน BWF Coach Education Manual:
   - Module 6: Movement Skills (Split Step p.53, Lunge, Recovery)
   - Module 7: Hitting Skills (Smash p.119, Drop Shot p.121-127, Clear p.125)
   - Movement Cycle: Start → Approach → Hitting → Recovery

**หลักการให้คะแนน (เข้มงวด):**
- 9-10/10: ระดับนักกีฬาอาชีพ/ทีมชาติ ท่าทางสมบูรณ์แบบตาม BWF (ให้ยากมาก)
- 7-8/10: ระดับดีมาก มีจุดเล็กน้อยที่ต้องปรับปรุง
- 5-6/10: ระดับปานกลาง เห็นพื้นฐานแต่ต้องพัฒนาหลายจุด
- 3-4/10: ระดับเริ่มต้น มีข้อผิดพลาดชัดเจนหลายจุด
- 1-2/10: ต้องเรียนรู้ใหม่ตั้งแต่พื้นฐาน

**สำคัญ:**
- ถ้าวิดีโอไม่ใช่แบดมินตัน หรือไม่ชัดเจน ให้แจ้งในผลวิเคราะห์
- ถ้าไม่เห็นท่าใดในวิดีโอ ให้ score = "N/A"
- วิเคราะห์เฉพาะสิ่งที่เห็นจริงในวิดีโอ อย่าเดา"""
        ).with_model("gemini", "gemini-3-flash-preview")

การให้คะแนนต้องอิงตามมาตรฐาน BWF:
- 9-10/10: ระดับนักกีฬาอาชีพ ท่าทางสมบูรณ์แบบตาม BWF
- 7-8/10: ระดับดี มีจุดเล็กน้อยที่ต้องปรับปรุง
- 5-6/10: ระดับปานกลาง เห็นพื้นฐานแต่ต้องพัฒนา
- 3-4/10: ระดับเริ่มต้น มีข้อผิดพลาดหลายจุด
- 1-2/10: ต้องเรียนรู้ใหม่ตั้งแต่พื้นฐาน"""
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = """วิเคราะห์วิดีโอแบดมินตันนี้ตามมาตรฐาน BWF Coach Education Manual ตอบเป็น JSON เท่านั้น:

**สำคัญมาก - การระบุประเภทการเล่น:**
- "เดี่ยว" (Singles): มีผู้เล่นฝั่งละ 1 คน (รวม 2 คนทั้งสนาม)
- "คู่" (Doubles): มีผู้เล่นฝั่งละ 2 คน (รวม 4 คนทั้งสนาม)
- นับผู้เล่นที่อยู่ **ฝั่งเดียวกัน** ไม่ใช่นับทั้งสองฝั่ง
- ถ้าเห็นผู้เล่น 2 คน แต่อยู่คนละฝั่งตาข่าย = เดี่ยว (is_doubles: false)
- ถ้าเห็นผู้เล่น 2 คนขึ้นไปอยู่ **ฝั่งเดียวกัน** = คู่ (is_doubles: true)

{
  "is_doubles": false,
  "players_per_side": 1,
  "technique_score": "คะแนน X/10 พร้อมคำอธิบาย",
  "technique_details": {
    "smash": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 7 p.119", "issues": ["..."], "suggestions": ["..."]},
    "clear_lob": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 7 p.125", "issues": [], "suggestions": []},
    "drop_shot": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 7 p.121", "issues": [], "suggestions": []},
    "net_play": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 7", "issues": [], "suggestions": []},
    "serve": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 7", "issues": [], "suggestions": []},
    "backhand": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 7 p.125-127", "issues": [], "suggestions": []},
    "forehand": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 7", "issues": [], "suggestions": []},
    "defense": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 7", "issues": [], "suggestions": []}
  },
  "footwork_score": "คะแนน X/10 พร้อมคำอธิบาย",
  "footwork_details": {
    "split_step": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 6 p.53", "issues": [], "suggestions": []},
    "lunge_technique": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 6", "issues": [], "suggestions": []},
    "recovery_speed": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 6 (Recovery Phase)", "issues": [], "suggestions": []},
    "court_movement": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 6", "issues": [], "suggestions": []},
    "chasse_steps": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 6", "issues": [], "suggestions": []},
    "crossover_steps": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 6", "issues": [], "suggestions": []},
    "jump_footwork": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 6", "issues": [], "suggestions": []},
    "directional_change": {"score": "X/10", "analysis": "...", "bwf_ref": "BWF Module 6", "issues": [], "suggestions": []}
  },
  "strengths": ["จุดแข็ง 1", "จุดแข็ง 2", "จุดแข็ง 3"],
  "weaknesses": ["จุดอ่อน 1", "จุดอ่อน 2"],
  "recommendations": ["คำแนะนำ 1 (อ้างอิง BWF)", "คำแนะนำ 2"],
  "biomechanics": {
    "elbow_position": "...", "elbow_angle": "...", "body_rotation": "...",
    "hip_rotation": "...", "shoulder_alignment": "...", "feet_spacing": "...",
    "knee_bend_depth": "...", "knee_bend_timing": "...", "wrist_action": "...",
    "grip_analysis": "...", "weight_transfer": "...", "jump_technique": "..."
  },
  "doubles_analysis": {
    "applicable": false,
    "formation": "N/A", "rotation_quality": "N/A", "partner_coordination": "N/A",
    "court_coverage_team": "N/A", "communication": "N/A", "position_switching": "N/A",
    "gap_coverage": "N/A", "overlap_issues": "N/A",
    "attack_defense_transition": "N/A", "front_back_balance": "N/A"
  }
}

**ขั้นตอนการวิเคราะห์:**
1. **ระบุประเภทการเล่นก่อน**: นับผู้เล่นที่อยู่ฝั่งเดียวกัน (1 คน = เดี่ยว, 2 คน = คู่)
   - is_doubles: true ถ้าเห็น 2 คนขึ้นไปอยู่ฝั่งเดียวกัน
   - is_doubles: false ถ้าเห็นผู้เล่นฝั่งละ 1 คน
2. ให้คะแนนและวิเคราะห์ท่าทาง 8 ท่า
3. ให้คะแนนและวิเคราะห์ฟุตเวิร์ค 8 รูปแบบ
4. วิเคราะห์ biomechanics
5. **ถ้า is_doubles = true เท่านั้น**: ให้ doubles_analysis.applicable = true และวิเคราะห์การเล่นคู่
6. **ถ้า is_doubles = false**: ให้ doubles_analysis.applicable = false และใส่ "N/A" ในทุก field ของ doubles_analysis

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
                
                # Use is_doubles field to set doubles_analysis.applicable correctly
                is_doubles = analysis_data.get("is_doubles", False)
                logging.info(f"is_doubles from AI: {is_doubles}")
                
                # Ensure doubles_analysis exists and has correct applicable value
                if "doubles_analysis" not in analysis_data:
                    analysis_data["doubles_analysis"] = {"applicable": is_doubles}
                else:
                    # Override applicable based on is_doubles for consistency
                    analysis_data["doubles_analysis"]["applicable"] = is_doubles
                
                logging.info(f"Final doubles_analysis.applicable: {analysis_data['doubles_analysis']['applicable']}")
            except json.JSONDecodeError as e:
                logging.error(f"JSON parse error: {e}")
                logging.error(f"Attempted to parse: {json_str[:500]}")
                analysis_data = {
                    "technique_score": "ไม่สามารถวิเคราะห์ JSON ได้",
                    "footwork_score": "ไม่สามารถวิเคราะห์ JSON ได้",
                    "strengths": ["กรุณาลองอัปโหลดวิดีโออีกครั้ง"],
                    "weaknesses": [],
                    "recommendations": [],
                    "biomechanics": {},
                    "full_analysis": response
                }
        else:
            logging.warning("No JSON found in LLM response")
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

@api_router.get("/export-pdf/{analysis_id}")
async def export_pdf(analysis_id: str):
    """ส่งออกผลการวิเคราะห์เป็น PDF"""
    
    analysis = await db.analyses.find_one({"id": analysis_id}, {"_id": 0})
    
    if not analysis:
        raise HTTPException(status_code=404, detail="ไม่พบการวิเคราะห์นี้")
    
    # Create PDF buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=24, spaceAfter=20)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, spaceAfter=10, spaceBefore=15)
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'], fontSize=10, spaceAfter=6)
    
    story = []
    
    # Title
    story.append(Paragraph("Badminton AI Analyzer", title_style))
    story.append(Paragraph(f"Analysis Report - {analysis.get('video_filename', 'Unknown')}", styles['Heading3']))
    story.append(Spacer(1, 0.3*inch))
    
    # Date
    created_at = analysis.get('created_at', '')
    if isinstance(created_at, datetime):
        date_str = created_at.strftime('%d/%m/%Y %H:%M')
    else:
        date_str = str(created_at)[:19]
    story.append(Paragraph(f"Date: {date_str}", normal_style))
    story.append(Paragraph(f"Type: {'Doubles' if analysis.get('doubles_analysis', {}).get('applicable') else 'Singles'}", normal_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Scores Table
    story.append(Paragraph("Overall Scores", heading_style))
    scores_data = [
        ['Category', 'Score'],
        ['Technique', str(analysis.get('technique_score', 'N/A'))],
        ['Footwork', str(analysis.get('footwork_score', 'N/A'))],
    ]
    scores_table = Table(scores_data, colWidths=[3*inch, 3*inch])
    scores_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ccff00')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0f0f0')),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWHEIGHTS', (0, 0), (-1, -1), 25),
    ]))
    story.append(scores_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Strengths
    story.append(Paragraph("Strengths", heading_style))
    strengths = analysis.get('strengths', [])
    if strengths:
        for s in strengths:
            story.append(Paragraph(f"• {s}", normal_style))
    else:
        story.append(Paragraph("No data", normal_style))
    
    # Weaknesses
    story.append(Paragraph("Weaknesses", heading_style))
    weaknesses = analysis.get('weaknesses', [])
    if weaknesses:
        for w in weaknesses:
            story.append(Paragraph(f"• {w}", normal_style))
    else:
        story.append(Paragraph("No data", normal_style))
    
    # Recommendations
    story.append(Paragraph("Recommendations", heading_style))
    recommendations = analysis.get('recommendations', [])
    if recommendations:
        for i, r in enumerate(recommendations, 1):
            story.append(Paragraph(f"{i}. {r}", normal_style))
    else:
        story.append(Paragraph("No data", normal_style))
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("Generated by Badminton AI Analyzer", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey)))
    story.append(Paragraph("Analysis based on BWF Coach Education standards", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey)))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    filename = f"badminton_analysis_{analysis_id[:8]}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

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