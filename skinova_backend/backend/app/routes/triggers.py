# app/routes/triggers.py
"""
API routes for personalized trigger data.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.auth import get_current_user
from app.db.mongodb import get_db
from app.services.trigger_service import (
    detect_personal_triggers,
    load_triggers,
    save_triggers,
    get_trigger_summary_for_llm,
)

router = APIRouter(prefix="/api/triggers", tags=["triggers"])
logger = logging.getLogger(__name__)


@router.get("/learned")
async def get_learned_triggers(current_user=Depends(get_current_user)):
    """
    Returns all triggers learned from the user's own history.
    Also re-runs detection to incorporate any new logs since last run.

    Response:
    {
      "triggers": [
        {
          "food_name": "chocolate",
          "count": 3,
          "avg_skin_drop": 15.2,
          "last_seen": "2025-07-10",
          "severity": "high",
          "window_hrs": 48
        }
      ],
      "data_points": 47
    }
    """
    db = get_db()
    user_id = str(current_user["_id"])

    # Re-run detection (cheap if no new data; updates if there is)
    try:
        fresh = await detect_personal_triggers(db, user_id)
    except Exception as e:
        logger.warning(f"[triggers/learned] detection error: {e}")
        fresh = []

    # Merge with saved
    saved = await load_triggers(db, user_id)
    saved_map = {t["food_name"]: t for t in saved}
    for t in fresh:
        saved_map[t["food_name"]] = t

    merged = sorted(
        saved_map.values(),
        key=lambda x: (-x["count"], -x["avg_skin_drop"])
    )

    if merged:
        await save_triggers(db, user_id, list(merged))

    # Count total food log entries as "data points"
    data_points = await db["food_logs"].count_documents({"user_id": user_id})

    return {
        "triggers": list(merged),
        "data_points": data_points,
    }


@router.delete("/{food_name}")
async def dismiss_trigger(
    food_name: str, current_user=Depends(get_current_user)
):
    """
    User can dismiss a trigger they disagree with.
    It will be removed from their profile.
    """
    db = get_db()
    user_id = str(current_user["_id"])

    saved = await load_triggers(db, user_id)
    updated = [t for t in saved if t["food_name"].lower() != food_name.lower()]

    await save_triggers(db, user_id, updated)
    return {"status": "dismissed", "food_name": food_name}


@router.get("/summary")
async def get_trigger_summary(current_user=Depends(get_current_user)):
    """
    Returns a plain-text summary of triggers for use in forecast context.
    Used internally by the LLM forecast pipeline.
    """
    db = get_db()
    user_id = str(current_user["_id"])
    summary = await get_trigger_summary_for_llm(db, user_id)
    return {"summary": summary}