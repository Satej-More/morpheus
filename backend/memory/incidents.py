import logging
import ssl
import certifi
from datetime import datetime, timedelta
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import DESCENDING, TEXT
from pymongo.server_api import ServerApi
from config.settings import get_settings

logger = logging.getLogger(__name__)


class IncidentMemory:
    """
    MongoDB-backed memory system for Morpheus.

    Stores:
    - Full incident records
    - Service baselines (normal metric ranges)
    - Incident pattern signatures (for similarity matching)
    """

    def __init__(self):
        s = get_settings()
        # Fix for Windows SSL TLSV1_ALERT_INTERNAL_ERROR with MongoDB Atlas:
        # Use certifi CA bundle + explicit TLS settings
        self.client = AsyncIOMotorClient(
            s.mongodb_uri,
            server_api=ServerApi("1"),
            tls=True,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=20000,
            socketTimeoutMS=20000,
        )
        self.db = self.client[s.mongodb_database]
        self.incidents = self.db["incidents"]
        self.baselines = self.db["service_baselines"]
        self.patterns = self.db["incident_patterns"]

    async def initialize_indexes(self):
        """Create indexes on startup — wrapped in try/except so startup
        never crashes even if Atlas is temporarily unreachable."""
        try:
            await self.incidents.create_index([("dynatrace_id", 1)], unique=True, sparse=True)
            await self.incidents.create_index([("detected_at", DESCENDING)])
            await self.incidents.create_index([("status", 1)])
            await self.incidents.create_index([("affected_services", 1)])
            # Text index for similarity search
            try:
                await self.incidents.create_index([("root_cause", TEXT), ("title", TEXT)])
            except Exception:
                pass  # index may already exist
            try:
                await self.patterns.create_index([("pattern_signature", TEXT)])
            except Exception:
                pass
            logger.info("MongoDB indexes initialized")
        except Exception as e:
            logger.error("MongoDB index creation failed: %s", e)
            logger.warning("Continuing without indexes — app will still work")

    # -------------------------------------------------------------------------
    # Incident CRUD
    # -------------------------------------------------------------------------

    async def save_incident(self, incident: dict) -> str:
        """Insert or update an incident record."""
        incident["updated_at"] = datetime.utcnow()
        result = await self.incidents.update_one(
            {"id": incident["id"]},
            {"$set": incident},
            upsert=True,
        )
        return str(result.upserted_id or incident["id"])

    async def get_incident(self, incident_id: str) -> Optional[dict]:
        doc = await self.incidents.find_one({"id": incident_id}, {"_id": 0})
        return doc

    async def list_incidents(
        self,
        limit: int = 50,
        status: Optional[str] = None,
        severity: Optional[str] = None,
    ) -> list[dict]:
        query: dict = {}
        if status:
            query["status"] = status
        if severity:
            query["severity"] = severity

        cursor = self.incidents.find(query, {"_id": 0}).sort("detected_at", DESCENDING).limit(limit)
        return [doc async for doc in cursor]

    async def update_incident_status(
        self,
        incident_id: str,
        status: str,
        extra: Optional[dict] = None,
    ) -> None:
        update = {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        if extra:
            update["$set"].update(extra)
        await self.incidents.update_one({"id": incident_id}, update)

    async def add_reasoning_step(self, incident_id: str, step: dict) -> None:
        await self.incidents.update_one(
            {"id": incident_id},
            {"$push": {"reasoning_steps": step}, "$set": {"updated_at": datetime.utcnow()}},
        )

    async def add_action(self, incident_id: str, action: dict) -> None:
        await self.incidents.update_one(
            {"id": incident_id},
            {"$push": {"actions": action}, "$set": {"updated_at": datetime.utcnow()}},
        )

    # -------------------------------------------------------------------------
    # Pattern matching (the "memory" that makes Morpheus smarter over time)
    # -------------------------------------------------------------------------

    async def find_similar_incidents(
        self,
        service: str,
        symptom_keywords: list[str],
        limit: int = 3,
    ) -> list[dict]:
        """
        Find historically similar incidents using keyword matching on
        pattern signatures. Returns resolved incidents sorted by similarity.
        Falls back to service-only matching if text index isn't ready yet.
        """
        base_query = {
            "affected_services": service,
            "status": "resolved",
            "root_cause": {"$exists": True, "$ne": None},
        }

        if symptom_keywords:
            text_query = dict(base_query)
            text_query["$text"] = {"$search": " ".join(symptom_keywords)}
            try:
                cursor = self.incidents.find(
                    text_query,
                    {"_id": 0, "id": 1, "title": 1, "root_cause": 1,
                     "root_cause_confidence": 1, "mttr_seconds": 1,
                     "detected_at": 1, "actions": 1},
                ).sort("detected_at", DESCENDING).limit(limit)
                results = [doc async for doc in cursor]
                if results:
                    return results
            except Exception:
                pass

        cursor = self.incidents.find(
            base_query,
            {"_id": 0, "id": 1, "title": 1, "root_cause": 1,
             "root_cause_confidence": 1, "mttr_seconds": 1,
             "detected_at": 1, "actions": 1},
        ).sort("detected_at", DESCENDING).limit(limit)
        return [doc async for doc in cursor]

    async def save_pattern(self, incident: dict) -> None:
        """Extract and save the incident's pattern signature for future matching."""
        if not incident.get("root_cause"):
            return

        signature = self._build_signature(incident)
        await self.patterns.update_one(
            {"pattern_signature": signature},
            {
                "$inc": {"frequency": 1},
                "$set": {
                    "last_seen": datetime.utcnow(),
                    "root_cause": incident.get("root_cause"),
                    "avg_mttr": incident.get("mttr_seconds", 0),
                },
            },
            upsert=True,
        )

    def _build_signature(self, incident: dict) -> str:
        """Build a normalized signature string from incident characteristics."""
        services = sorted(incident.get("affected_services", []))
        root_cause_words = (incident.get("root_cause", "") or "").lower().split()
        keywords = [w for w in root_cause_words if len(w) > 4][:5]
        return f"{','.join(services)}|{','.join(sorted(keywords))}"

    # -------------------------------------------------------------------------
    # Service baselines
    # -------------------------------------------------------------------------

    async def get_baseline(self, service: str, metric: str) -> Optional[dict]:
        return await self.baselines.find_one(
            {"service_name": service, "metric": metric},
            {"_id": 0},
        )

    async def update_baseline(self, service: str, metric: str, value: float) -> None:
        """Update a service metric baseline with exponential moving average."""
        existing = await self.get_baseline(service, metric)
        alpha = 0.1
        if existing:
            new_val = alpha * value + (1 - alpha) * existing.get("baseline_value", value)
        else:
            new_val = value

        await self.baselines.update_one(
            {"service_name": service, "metric": metric},
            {"$set": {"baseline_value": new_val, "last_updated": datetime.utcnow()}},
            upsert=True,
        )

    async def close(self):
        self.client.close()