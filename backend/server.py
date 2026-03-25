from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Request, Response, Depends
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
from datetime import datetime, timezone, timedelta
import tempfile
import shutil
import io
import httpx
import hashlib
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

# ============ AUTH MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    auth_type: str = "google"  # "google" or "email"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class SessionRequest(BaseModel):
    session_id: str

# ============ AUTH HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    """Hash password with SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

async def get_current_user(request: Request) -> User:
    """Get current authenticated user from cookie or header"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="ไม่ได้เข้าสู่ระบบ")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Session ไม่ถูกต้อง")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session หมดอายุ")
    
    # Find user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="ไม่พบผู้ใช้")
    
    return User(**user_doc)

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(request: RegisterRequest, response: Response):
    """Register new user with email/password"""
    # Check if email already exists
    existing = await db.users.find_one({"email": request.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="อีเมลนี้ถูกใช้แล้ว")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = User(
        user_id=user_id,
        email=request.email,
        name=request.name,
        auth_type="email"
    )
    
    user_doc = user.model_dump()
    user_doc["password_hash"] = hash_password(request.password)
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    
    session_doc = session.model_dump()
    session_doc["expires_at"] = session_doc["expires_at"].isoformat()
    session_doc["created_at"] = session_doc["created_at"].isoformat()
    
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {"user_id": user_id, "email": request.email, "name": request.name}

@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response):
    """Login with email/password"""
    user_doc = await db.users.find_one(
        {"email": request.email, "auth_type": "email"},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")
    
    if user_doc.get("password_hash") != hash_password(request.password):
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    session = UserSession(
        user_id=user_doc["user_id"],
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    
    session_doc = session.model_dump()
    session_doc["expires_at"] = session_doc["expires_at"].isoformat()
    session_doc["created_at"] = session_doc["created_at"].isoformat()
    
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user_doc["user_id"],
        "email": user_doc["email"],
        "name": user_doc["name"],
        "picture": user_doc.get("picture")
    }

@api_router.post("/auth/google/session")
async def google_session(request: SessionRequest, response: Response):
    """Exchange Google OAuth session_id for session_token"""
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": request.session_id}
            )
            
            if res.status_code != 200:
                raise HTTPException(status_code=401, detail="Google session ไม่ถูกต้อง")
            
            data = res.json()
    except Exception as e:
        logging.error(f"Google auth error: {e}")
        raise HTTPException(status_code=401, detail="ไม่สามารถยืนยันตัวตนกับ Google ได้")
    
    email = data.get("email")
    name = data.get("name")
    picture = data.get("picture")
    
    # Check if user exists
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing:
        user_id = existing["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = User(
            user_id=user_id,
            email=email,
            name=name,
            picture=picture,
            auth_type="google"
        )
        
        user_doc = user.model_dump()
        user_doc["created_at"] = user_doc["created_at"].isoformat()
        
        await db.users.insert_one(user_doc)
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    
    session_doc = session.model_dump()
    session_doc["expires_at"] = session_doc["expires_at"].isoformat()
    session_doc["created_at"] = session_doc["created_at"].isoformat()
    
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture
    }

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    
    return {"message": "ออกจากระบบสำเร็จ"}

# ============ END AUTH ============

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
async def analyze_video(file: UploadFile = File(...), user: User = Depends(get_current_user)):
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
            session_id=f"analysis_fixed_seed",
            system_message="""คุณเป็นโค้ชแบดมินตันระดับนานาชาติที่ได้รับการรับรองจาก BWF (Badminton World Federation) มีประสบการณ์มากกว่า 20 ปี

**หน้าที่ของคุณ:**
1. ดูวิดีโอแบดมินตันอย่างละเอียด สังเกตทุก frame
2. วิเคราะห์ตามมาตรฐาน BWF Coach Education Manual:
   - Module 6: Movement Skills (Split Step p.53, Lunge, Recovery)
   - Module 7: Hitting Skills (Smash p.119, Drop Shot p.121-127, Clear p.125)
   - Movement Cycle: Start → Approach → Hitting → Recovery

**หลักการให้คะแนน (เข้มงวดและคงที่):**
- 9-10/10: ระดับนักกีฬาอาชีพ/ทีมชาติ ท่าทางสมบูรณ์แบบตาม BWF (ให้ยากมาก)
- 7-8/10: ระดับดีมาก มีจุดเล็กน้อยที่ต้องปรับปรุง
- 5-6/10: ระดับปานกลาง เห็นพื้นฐานแต่ต้องพัฒนาหลายจุด
- 3-4/10: ระดับเริ่มต้น มีข้อผิดพลาดชัดเจนหลายจุด
- 1-2/10: ต้องเรียนรู้ใหม่ตั้งแต่พื้นฐาน

**กฎสำคัญ (ต้องปฏิบัติตามเคร่งครัด):**
- ให้คะแนนเป็นตัวเลขทศนิยม 1 ตำแหน่ง เช่น 6.5, 7.0, 5.5
- วิเคราะห์เฉพาะสิ่งที่เห็นจริงในวิดีโอ ห้ามเดา
- ถ้าไม่เห็นท่าใดในวิดีโอ ให้ score = "N/A"
- ตอบให้สั้นกระชับ ตรงประเด็น
- ถ้าวิดีโอไม่ใช่แบดมินตัน ให้แจ้งใน strengths"""
        ).with_model("gemini", "gemini-3-flash-preview").with_params(temperature=0, top_p=0.1, top_k=1)
        
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
        doc['user_id'] = user.user_id  # Add user ownership
        
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
async def get_analyses(user: User = Depends(get_current_user)):
    """ดึงรายการการวิเคราะห์ของผู้ใช้"""
    analyses = await db.analyses.find(
        {"user_id": user.user_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for analysis in analyses:
        if isinstance(analysis['created_at'], str):
            analysis['created_at'] = datetime.fromisoformat(analysis['created_at'])
    
    return analyses

@api_router.get("/analyses/{analysis_id}", response_model=Analysis)
async def get_analysis(analysis_id: str, user: User = Depends(get_current_user)):
    """ดึงการวิเคราะห์เฉพาะรายการ"""
    analysis = await db.analyses.find_one(
        {"id": analysis_id, "user_id": user.user_id}, 
        {"_id": 0}
    )
    
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
    ).with_model("gemini", "gemini-3-flash-preview").with_params(temperature=0)
    
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

class GameAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_filename: str
    video_id: Optional[str] = None
    match_type: Optional[str] = None  # "เดี่ยว" หรือ "คู่"
    match_type_reason: Optional[str] = None  # เหตุผลที่ระบุประเภท
    overall_technique: Optional[float] = None
    overall_footwork: Optional[float] = None
    game_summary: Optional[str] = None
    timeline: Optional[List[dict]] = None  # [{time_range, performance, description}]
    patterns: Optional[List[dict]] = None  # [{type, title, description, frequency}]
    good_periods: Optional[List[str]] = None
    weak_periods: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    match_stats: Optional[dict] = None  # สถิติการแข่งขัน
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.post("/game-analyze", response_model=GameAnalysis)
async def analyze_game(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    """วิเคราะห์วิดีโอการแข่งขันทั้งเกม (รองรับไฟล์ขนาดใหญ่ถึง 500MB)"""
    
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="กรุณาอัปโหลดไฟล์วิดีโอเท่านั้น")
    
    # ตรวจสอบขนาดไฟล์ (max 500MB for game analysis)
    file_size = 0
    content = await file.read()
    file_size = len(content)
    await file.seek(0)
    
    if file_size > 500 * 1024 * 1024:  # 500MB
        raise HTTPException(status_code=400, detail="ไฟล์วิดีโอต้องมีขนาดไม่เกิน 500MB")
    
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
            session_id=f"game_analysis_fixed_seed",
            system_message="""คุณเป็นโค้ชแบดมินตันระดับนานาชาติที่ได้รับการรับรองจาก BWF (Badminton World Federation) มีประสบการณ์มากกว่า 20 ปี

**หน้าที่ของคุณ:**
1. ดูวิดีโอการแข่งขันแบดมินตันทั้งเกม
2. **สำคัญมาก: ระบุประเภทการแข่งขันให้ถูกต้อง (เดี่ยว หรือ คู่)**
3. วิเคราะห์ภาพรวมการเล่นตลอดทั้งเกม
4. ระบุช่วงเวลาที่เล่นได้ดี และช่วงที่ต้องปรับปรุง
5. หา Pattern ที่พบซ้ำๆ ในการเล่น
6. ให้คำแนะนำสำหรับเกมถัดไป

**วิธีแยกประเภทการแข่งขัน (สำคัญมาก - ต้องนับจำนวนผู้เล่นให้ถูกต้อง):**
- **เดี่ยว (Singles)**: มีผู้เล่นเพียง 2 คน บนสนาม (ฝั่งละ 1 คน) - แต่ละฝั่งมีคนเดียว ต้องวิ่งครอบคลุมทั้งสนามคนเดียว
- **คู่ (Doubles)**: มีผู้เล่น 4 คน บนสนาม (ฝั่งละ 2 คน) - มีการสลับตำแหน่ง หน้า-หลัง หรือ ซ้าย-ขวา

**เทคนิคการนับ:**
1. หยุดที่ frame ใดก็ได้ นับจำนวนคนในสนาม
2. ถ้าเห็น 2 คนฝั่งเดียวกัน = คู่
3. ถ้าเห็นคนเดียววิ่งทั่วสนาม = เดี่ยว
4. ถ้าไม่แน่ใจ ให้ดูความกว้างของพื้นที่ที่ผู้เล่นครอบคลุม - เดี่ยวจะวิ่งกว้างกว่า

**หลักการให้คะแนน (คงที่):**
- 9-10/10: ระดับนักกีฬาอาชีพ ควบคุมเกมได้ตลอด
- 7-8/10: เล่นได้ดี มีจังหวะอ่อนบ้าง
- 5-6/10: ปานกลาง มีจุดที่ต้องพัฒนาชัดเจน
- 3-4/10: ต้องปรับปรุงหลายจุด
- 1-2/10: ต้องฝึกพื้นฐานใหม่

**กฎสำคัญ:** ให้คะแนนเป็นทศนิยม 1 ตำแหน่ง วิเคราะห์สั้นกระชับ"""
        ).with_model("gemini", "gemini-3-flash-preview").with_params(temperature=0, top_p=0.1, top_k=1)
        
        prompt = """วิเคราะห์วิดีโอการแข่งขันแบดมินตันทั้งเกมนี้ 

**ขั้นตอนแรก - สำคัญที่สุด:**
1. นับจำนวนผู้เล่นในสนามให้ชัดเจน
2. ถ้าฝั่งละ 1 คน (รวม 2 คน) = "เดี่ยว"
3. ถ้าฝั่งละ 2 คน (รวม 4 คน) = "คู่"

ตอบเป็น JSON เท่านั้น:

{
  "match_type": "เดี่ยว หรือ คู่ (ระบุตามที่เห็นจริง)",
  "match_type_reason": "อธิบายสั้นๆ ว่าทำไมถึงระบุว่าเป็นเดี่ยวหรือคู่ เช่น 'เห็นผู้เล่นฝั่งละ 1 คน รวม 2 คนในสนาม'",
  "overall_technique": 7.5,
  "overall_footwork": 7.0,
  "game_summary": "สรุปภาพรวมการแข่งขัน 2-3 ประโยค อธิบายลักษณะการเล่น จุดเด่น และผลลัพธ์โดยรวม",
  "timeline": [
    {"time_range": "0:00-5:00", "performance": "good", "description": "เปิดเกมได้ดี ควบคุมจังหวะได้"},
    {"time_range": "5:00-10:00", "performance": "normal", "description": "เล่นสม่ำเสมอ ไม่มีจุดเด่น"},
    {"time_range": "10:00-15:00", "performance": "poor", "description": "เริ่มเหนื่อย footwork ช้าลง"}
  ],
  "patterns": [
    {"type": "strength", "title": "Smash หลังหลอกได้ผล", "description": "ใช้ Drop Shot หลอกแล้ว Smash ได้แต้มหลายครั้ง", "frequency": 5},
    {"type": "weakness", "title": "Backhand Clear อ่อน", "description": "ตีกลับมาสั้น ทำให้คู่แข่ง Smash ได้", "frequency": 8}
  ],
  "good_periods": ["0:00-5:00", "20:00-25:00"],
  "weak_periods": ["10:00-15:00", "35:00-40:00"],
  "recommendations": [
    "ฝึก Backhand Clear ให้ไกลขึ้น",
    "พักระหว่างแต้มให้นานขึ้นเพื่อลดความเหนื่อย",
    "เพิ่มการใช้ Net Play เพื่อสร้างโอกาส"
  ],
  "match_stats": {
    "estimated_duration": "30 นาที",
    "play_style": "เกมบุก/เกมรับ/เกมผสม",
    "dominant_shots": ["Smash", "Drop Shot"],
    "weak_shots": ["Backhand Clear", "Defense"]
  }
}

**คำแนะนำ:**
- match_type: ต้องระบุให้ถูกต้อง นับจำนวนคนในวิดีโอก่อน!
- timeline: แบ่งตามช่วงเวลาที่สังเกตได้ ใช้ performance: "good", "normal", หรือ "poor"
- patterns: ระบุ type เป็น "strength" หรือ "weakness" พร้อม frequency ที่พบ
- ให้คะแนนตามที่เห็นจริงๆ ในวิดีโอ อย่าเดา
- ถ้าวิดีโอไม่ใช่แบดมินตัน ให้แจ้งใน game_summary

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายอื่น"""
        
        user_message = UserMessage(
            text=prompt,
            file_contents=[video_file_obj]
        )
        
        response = await chat.send_message(user_message)
        
        import json
        import re
        
        logging.info(f"Game Analysis LLM Response (first 2000 chars): {response[:2000] if response else 'Empty response'}")
        
        # Extract JSON from response
        code_block_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', response, re.DOTALL)
        if code_block_match:
            json_str = code_block_match.group(1)
            logging.info("Found JSON in code block")
        else:
            json_str = None
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
                logging.info(f"Successfully parsed Game Analysis JSON with keys: {list(analysis_data.keys())}")
            except json.JSONDecodeError as e:
                logging.error(f"JSON parse error: {e}")
                analysis_data = {
                    "overall_technique": 0,
                    "overall_footwork": 0,
                    "game_summary": "ไม่สามารถวิเคราะห์ JSON ได้ กรุณาลองใหม่",
                    "timeline": [],
                    "patterns": [],
                    "good_periods": [],
                    "weak_periods": [],
                    "recommendations": ["กรุณาลองอัปโหลดวิดีโออีกครั้ง"],
                    "match_stats": {}
                }
        else:
            logging.warning("No JSON found in Game Analysis LLM response")
            analysis_data = {
                "overall_technique": 0,
                "overall_footwork": 0,
                "game_summary": "ไม่สามารถวิเคราะห์ได้",
                "timeline": [],
                "patterns": [],
                "good_periods": [],
                "weak_periods": [],
                "recommendations": [],
                "match_stats": {}
            }
        
        game_analysis = GameAnalysis(
            video_filename=file.filename,
            video_id=str(video_id),
            match_type=analysis_data.get("match_type"),
            match_type_reason=analysis_data.get("match_type_reason"),
            overall_technique=analysis_data.get("overall_technique"),
            overall_footwork=analysis_data.get("overall_footwork"),
            game_summary=analysis_data.get("game_summary"),
            timeline=analysis_data.get("timeline", []),
            patterns=analysis_data.get("patterns", []),
            good_periods=analysis_data.get("good_periods", []),
            weak_periods=analysis_data.get("weak_periods", []),
            recommendations=analysis_data.get("recommendations", []),
            match_stats=analysis_data.get("match_stats", {})
        )
        
        doc = game_analysis.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['user_id'] = user.user_id  # Add user ownership
        
        await db.game_analyses.insert_one(doc)
        
        return game_analysis
        
    except Exception as e:
        logging.error(f"Error analyzing game: {str(e)}")
        if video_id:
            fs.delete(video_id)
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการวิเคราะห์: {str(e)}")
    
    finally:
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)


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