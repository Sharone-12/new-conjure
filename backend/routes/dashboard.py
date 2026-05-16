from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
from auth_utils import get_current_user
from database import get_db

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notes = (
        db.query(models.Note)
        .filter(
            models.Note.user_id == current_user.id,
            models.Note.deleted_at == None,
        )
        .all()
    )

    total_notes = len(notes)
    total_words = sum(len((n.content or "").split()) for n in notes)
    ai_summaries = sum(n.ai_generated_count or 0 for n in notes)

    all_tags = [t for n in notes for t in (n.tags or [])]
    unique_tags = list(set(all_tags))
    tag_counter = Counter(all_tags)
    top_tags = [{"tag": t, "count": c} for t, c in tag_counter.most_common(5)]

    today = datetime.utcnow().date()
    weekly = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        created = sum(
            1 for n in notes
            if n.created_at and n.created_at.date() == day
        )
        edited = sum(
            1 for n in notes
            if n.updated_at and n.updated_at.date() == day
            and n.created_at and n.created_at.date() != day
        )
        weekly.append({"day": day.strftime("%a"), "created": created, "edited": edited})

    sorted_notes = sorted(
        notes, key=lambda n: n.updated_at or datetime.min, reverse=True
    )
    recent_notes = [
        {
            "id": n.id,
            "title": n.title or "Untitled",
            "content": (n.content or "")[:120],
            "tags": n.tags or [],
            "updated_at": n.updated_at.isoformat() if n.updated_at else None,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "is_public": n.is_public,
        }
        for n in sorted_notes[:5]
    ]

    total_action_items = sum(len(n.ai_action_items or []) for n in notes)
    total_suggested_titles = sum(1 for n in notes if n.ai_suggested_title)

    return {
        "total_notes": total_notes,
        "total_words": total_words,
        "ai_summaries_generated": ai_summaries,
        "unique_tags": unique_tags,
        "weekly_activity": weekly,
        "top_tags": top_tags,
        "recent_notes": recent_notes,
        "total_action_items": total_action_items,
        "total_suggested_titles": total_suggested_titles,
    }
