#!/usr/bin/env python3
"""
Seed MongoDB with 20 realistic historical incidents.
Run from project root:  python scripts/seed_demo_data.py
"""
import asyncio, sys, os, uuid, random
from datetime import datetime, timedelta

_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(_dir, '..', 'backend')))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv(os.path.join(_dir, '..', 'backend', '.env'))

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DATABASE", "morpheus")

SERVICES = ["payments-api","auth-service","checkout-service","order-processor","inventory-api","notification-worker"]
ROOT_CAUSES = [
    "Memory leak in HikariCP connection pool after v{v} deployment",
    "Database connection pool exhaustion — max_pool_size too low for traffic spike",
    "Upstream auth-service rate limiting causing retry storms",
    "Redis cache TTL misconfiguration causing cache stampede",
    "GC pause cascade due to large object allocation in order processing",
    "N+1 query pattern introduced in {v} causing latency spike",
    "Thread pool exhaustion under peak load — executor queue backed up",
    "DNS resolution timeout causing cascading failures across service mesh",
]

async def seed():
    client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    col = db["incidents"]

    print(f"Seeding 20 historical incidents into {DB_NAME}...")
    now = datetime.utcnow()

    for i in range(20):
        svc = random.choice(SERVICES)
        rc_template = random.choice(ROOT_CAUSES)
        version = f"v{random.randint(1,3)}.{random.randint(0,9)}.{random.randint(0,9)}"
        root_cause = rc_template.format(v=version)
        conf = round(random.uniform(0.72, 0.94), 2)
        mttr = random.randint(80, 420)
        detected = now - timedelta(days=random.randint(2, 180), hours=random.randint(0, 23))
        resolved = detected + timedelta(seconds=mttr)

        doc = {
            "id": f"INC-{detected.strftime('%Y-%m-%d')}-{str(uuid.uuid4())[:4].upper()}",
            "title": f"Response time degradation on {svc}",
            "status": "resolved",
            "severity": random.choice(["high", "critical", "medium"]),
            "detected_at": detected.isoformat(),
            "resolved_at": resolved.isoformat(),
            "mttr_seconds": mttr,
            "affected_services": [svc],
            "root_cause": root_cause,
            "root_cause_confidence": conf,
            "hypotheses": [{"title": root_cause, "confidence": conf}],
            "reasoning_steps": [],
            "actions": [
                {"type": "slack_notification", "status": "success"},
                {"type": "github_issue", "status": "success"},
            ],
            "dynatrace_id": f"P-{random.randint(1000000, 9999999)}",
            "mcp_used": True,
            "gemini_used": True,
        }
        await col.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
        print(f"  [{i+1:02d}/20] {doc['id']}  {svc}  {root_cause[:60]}...")

    # Create text index for similarity search
    try:
        await col.create_index([("root_cause", "text"), ("title", "text")])
        print("✅ Text index created for similarity search")
    except Exception as e:
        print(f"ℹ️  Text index: {e}")

    count = await col.count_documents({})
    print(f"\n✅ Done — {count} total incidents in database")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
