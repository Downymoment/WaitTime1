from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Models ───────────────────────────────────────────────────────

class LocationCreate(BaseModel):
    name: str
    category: str
    address: str
    city: str
    avg_service_time: int = 15  # minutes per person

class LocationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category: str
    address: str
    city: str
    avg_service_time: int
    active_checkins: int = 0
    estimated_wait_min: int = 0
    crowd_level: str = "unknown"
    created_at: str

class LocationDetail(LocationResponse):
    recent_checkins: List[dict] = []
    total_checkins_today: int = 0

class CheckInCreate(BaseModel):
    nickname: Optional[str] = None

class CheckInResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    location_id: str
    nickname: str
    timestamp: str
    position_in_queue: int

class BestTimeSlot(BaseModel):
    hour: int
    label: str
    avg_checkins: float
    crowd_level: str

# ─── Helpers ──────────────────────────────────────────────────────

CATEGORIES = [
    {"id": "rto", "name": "RTO Office", "icon": "car"},
    {"id": "bank", "name": "Public Bank", "icon": "landmark"},
    {"id": "post_office", "name": "Post Office", "icon": "mail"},
    {"id": "electricity", "name": "Electricity Board", "icon": "zap"},
    {"id": "municipal", "name": "Municipal Corp", "icon": "building-2"},
    {"id": "passport", "name": "Passport Office", "icon": "book-open"},
    {"id": "court", "name": "Court/Tribunal", "icon": "scale"},
    {"id": "other", "name": "Other", "icon": "map-pin"},
]

def calc_crowd_level(active: int) -> str:
    if active == 0:
        return "unknown"
    if active <= 5:
        return "low"
    if active <= 15:
        return "medium"
    return "high"

def hour_label(h: int) -> str:
    if h == 0:
        return "12 AM"
    if h < 12:
        return f"{h} AM"
    if h == 12:
        return "12 PM"
    return f"{h - 12} PM"

async def get_active_checkins(location_id: str) -> int:
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=90)).isoformat()
    count = await db.checkins.count_documents({
        "location_id": location_id,
        "timestamp": {"$gte": cutoff}
    })
    return count

async def enrich_location(loc: dict) -> dict:
    active = await get_active_checkins(loc["id"])
    avg_time = loc.get("avg_service_time", 15)
    wait = max(0, (active - 1)) * avg_time if active > 0 else 0
    loc["active_checkins"] = active
    loc["estimated_wait_min"] = wait
    loc["crowd_level"] = calc_crowd_level(active)
    return loc

# ─── Routes ───────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "WaitTime API is running"}

@api_router.get("/categories")
async def get_categories():
    return CATEGORIES

@api_router.get("/locations", response_model=List[LocationResponse])
async def get_locations(
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = Query(None, description="sort by: wait_asc, wait_desc, name"),
    city: Optional[str] = None,
):
    query = {}
    if category:
        query["category"] = category
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"address": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
        ]

    locations = await db.locations.find(query, {"_id": 0}).to_list(200)
    enriched = []
    for loc in locations:
        enriched.append(await enrich_location(loc))

    if sort == "wait_asc":
        enriched.sort(key=lambda x: x["estimated_wait_min"])
    elif sort == "wait_desc":
        enriched.sort(key=lambda x: x["estimated_wait_min"], reverse=True)
    elif sort == "name":
        enriched.sort(key=lambda x: x["name"])
    else:
        enriched.sort(key=lambda x: x["active_checkins"], reverse=True)

    return enriched

@api_router.get("/locations/{location_id}")
async def get_location(location_id: str):
    loc = await db.locations.find_one({"id": location_id}, {"_id": 0})
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    loc = await enrich_location(loc)

    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=90)).isoformat()
    recent = await db.checkins.find(
        {"location_id": location_id, "timestamp": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(20)

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    total_today = await db.checkins.count_documents({
        "location_id": location_id,
        "timestamp": {"$gte": today_start}
    })

    loc["recent_checkins"] = recent
    loc["total_checkins_today"] = total_today
    return loc

@api_router.post("/locations")
async def create_location(data: LocationCreate):
    loc_id = str(uuid.uuid4())
    doc = {
        "id": loc_id,
        "name": data.name,
        "category": data.category,
        "address": data.address,
        "city": data.city,
        "avg_service_time": data.avg_service_time,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.locations.insert_one(doc)
    doc.pop("_id", None)
    return await enrich_location(doc)

@api_router.post("/locations/{location_id}/checkin", response_model=CheckInResponse)
async def checkin(location_id: str, data: CheckInCreate):
    loc = await db.locations.find_one({"id": location_id}, {"_id": 0})
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    active = await get_active_checkins(location_id)
    nickname = data.nickname or f"Citizen #{active + 1}"

    checkin_doc = {
        "id": str(uuid.uuid4()),
        "location_id": location_id,
        "nickname": nickname,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "position_in_queue": active + 1,
    }
    await db.checkins.insert_one(checkin_doc)
    checkin_doc.pop("_id", None)
    return checkin_doc

@api_router.get("/locations/{location_id}/best-times", response_model=List[BestTimeSlot])
async def get_best_times(location_id: str):
    loc = await db.locations.find_one({"id": location_id}, {"_id": 0})
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    # Get all checkins for this location
    all_checkins = await db.checkins.find(
        {"location_id": location_id}, {"_id": 0}
    ).to_list(5000)

    # Aggregate by hour
    hour_counts = {}
    hour_days = {}
    for c in all_checkins:
        try:
            ts = datetime.fromisoformat(c["timestamp"])
            h = ts.hour
            day_key = ts.strftime("%Y-%m-%d")
            if h not in hour_counts:
                hour_counts[h] = 0
                hour_days[h] = set()
            hour_counts[h] += 1
            hour_days[h].add(day_key)
        except (ValueError, KeyError):
            continue

    slots = []
    for h in range(8, 18):  # 8 AM to 5 PM
        if h in hour_counts and len(hour_days[h]) > 0:
            avg = hour_counts[h] / len(hour_days[h])
        else:
            avg = 0
        slots.append(BestTimeSlot(
            hour=h,
            label=hour_label(h),
            avg_checkins=round(avg, 1),
            crowd_level=calc_crowd_level(int(avg))
        ))
    return slots

@api_router.post("/seed")
async def seed_data():
    existing = await db.locations.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded", "count": existing}

    locations = [
        {"name": "RTO Andheri", "category": "rto", "address": "SVP Road, Andheri West", "city": "Mumbai", "avg_service_time": 20},
        {"name": "RTO Kashmere Gate", "category": "rto", "address": "Lala Hardev Sahai Marg", "city": "Delhi", "avg_service_time": 25},
        {"name": "SBI Main Branch", "category": "bank", "address": "MG Road, Fort", "city": "Mumbai", "avg_service_time": 12},
        {"name": "SBI Connaught Place", "category": "bank", "address": "Block A, Connaught Place", "city": "Delhi", "avg_service_time": 15},
        {"name": "PNB Sector 17", "category": "bank", "address": "Sector 17, Chandigarh", "city": "Chandigarh", "avg_service_time": 10},
        {"name": "Post Office GPO", "category": "post_office", "address": "Dalhousie Square", "city": "Kolkata", "avg_service_time": 8},
        {"name": "Post Office Ashram Road", "category": "post_office", "address": "Ashram Road", "city": "Ahmedabad", "avg_service_time": 10},
        {"name": "BESCOM Jayanagar", "category": "electricity", "address": "30th Cross, Jayanagar", "city": "Bangalore", "avg_service_time": 15},
        {"name": "MSEDCL Thane", "category": "electricity", "address": "Naupada, Thane West", "city": "Thane", "avg_service_time": 18},
        {"name": "Municipal Corp Ward Office", "category": "municipal", "address": "Dadar East", "city": "Mumbai", "avg_service_time": 20},
        {"name": "BBMP Whitefield", "category": "municipal", "address": "ITPL Main Road, Whitefield", "city": "Bangalore", "avg_service_time": 22},
        {"name": "Passport Seva Kendra", "category": "passport", "address": "BKC, Bandra East", "city": "Mumbai", "avg_service_time": 30},
        {"name": "Passport Office Anna Salai", "category": "passport", "address": "Anna Salai, Teynampet", "city": "Chennai", "avg_service_time": 25},
        {"name": "District Court Patiala House", "category": "court", "address": "India Gate Circle", "city": "Delhi", "avg_service_time": 35},
        {"name": "SBI Koramangala", "category": "bank", "address": "80 Feet Road, Koramangala", "city": "Bangalore", "avg_service_time": 12},
        {"name": "RTO Perungudi", "category": "rto", "address": "OMR, Perungudi", "city": "Chennai", "avg_service_time": 22},
    ]

    now = datetime.now(timezone.utc)
    for loc_data in locations:
        loc_id = str(uuid.uuid4())
        doc = {
            "id": loc_id,
            "name": loc_data["name"],
            "category": loc_data["category"],
            "address": loc_data["address"],
            "city": loc_data["city"],
            "avg_service_time": loc_data["avg_service_time"],
            "created_at": now.isoformat(),
        }
        await db.locations.insert_one(doc)

        # Seed historical check-ins for past 1-7 days only (NOT today to avoid active window overlap)
        for day_offset in range(1, 8):
            day = now - timedelta(days=day_offset)
            for hour in range(8, 18):
                count = random.randint(1, 10)
                for _ in range(count):
                    minute = random.randint(0, 59)
                    ts = day.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    checkin_doc = {
                        "id": str(uuid.uuid4()),
                        "location_id": loc_id,
                        "nickname": f"Citizen #{random.randint(1, 999)}",
                        "timestamp": ts.isoformat(),
                        "position_in_queue": random.randint(1, 15),
                    }
                    await db.checkins.insert_one(checkin_doc)

        # Seed a few realistic recent check-ins (within last 90 min) for ~60% of locations
        if random.random() > 0.4:
            recent_count = random.randint(1, 8)
            for i in range(recent_count):
                ts = now - timedelta(minutes=random.randint(2, 85))
                checkin_doc = {
                    "id": str(uuid.uuid4()),
                    "location_id": loc_id,
                    "nickname": f"Citizen #{random.randint(1, 999)}",
                    "timestamp": ts.isoformat(),
                    "position_in_queue": i + 1,
                }
                await db.checkins.insert_one(checkin_doc)

    return {"message": "Seeded successfully", "locations": len(locations)}

# ─── App Setup ────────────────────────────────────────────────────

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

@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.locations.create_index("id", unique=True)
    await db.locations.create_index("category")
    await db.locations.create_index("city")
    await db.checkins.create_index("location_id")
    await db.checkins.create_index("timestamp")
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
