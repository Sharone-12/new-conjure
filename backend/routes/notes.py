import json
import os
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models
from auth_utils import get_current_user
from database import get_db

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class NoteCreate(BaseModel):
    title: str = "Untitled"
    content: str = ""
    tags: List[str] = []


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    is_archived: Optional[bool] = None


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    content: str
    tags: List[str] = []
    is_archived: bool
    is_public: bool
    share_id: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_action_items: Optional[List[str]] = None
    ai_suggested_title: Optional[str] = None
    ai_generated_count: int
    created_at: datetime
    updated_at: datetime

    @field_validator("tags", "ai_action_items", mode="before")
    @classmethod
    def ensure_list(cls, v):
        return v if v is not None else []


# ── Public routes (no auth) ───────────────────────────────────────────────────

@router.get("/shared/{share_id}")
def get_shared_note(share_id: str, db: Session = Depends(get_db)):
    note = (
        db.query(models.Note)
        .filter(
            models.Note.share_id == share_id,
            models.Note.is_public == True,
            models.Note.deleted_at == None,
        )
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or not public")
    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "tags": note.tags or [],
        "created_at": note.created_at,
        "updated_at": note.updated_at,
    }


# ── Authenticated routes ──────────────────────────────────────────────────────

@router.get("", response_model=List[NoteOut])
def list_notes(
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    sort: str = Query("newest"),
    archived: bool = Query(False),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.Note).filter(
        models.Note.user_id == current_user.id,
        models.Note.deleted_at == None,
        models.Note.is_archived == archived,
    )
    if search:
        q = q.filter(
            or_(
                models.Note.title.ilike(f"%{search}%"),
                models.Note.content.ilike(f"%{search}%"),
            )
        )
    if sort == "oldest":
        q = q.order_by(models.Note.updated_at.asc())
    elif sort == "az":
        q = q.order_by(models.Note.title.asc())
    else:
        q = q.order_by(models.Note.updated_at.desc())

    notes = q.all()
    if tag:
        notes = [n for n in notes if tag in (n.tags or [])]
    return notes


@router.post("", response_model=NoteOut, status_code=201)
def create_note(
    body: NoteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    note = models.Note(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=body.title,
        content=body.content,
        tags=body.tags,
        created_at=now,
        updated_at=now,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: str,
    body: NoteUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = (
        db.query(models.Note)
        .filter(
            models.Note.id == note_id,
            models.Note.user_id == current_user.id,
            models.Note.deleted_at == None,
        )
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if body.title is not None:
        note.title = body.title
    if body.content is not None:
        note.content = body.content
    if body.tags is not None:
        note.tags = body.tags
    if body.is_archived is not None:
        note.is_archived = body.is_archived
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}")
def delete_note(
    note_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = (
        db.query(models.Note)
        .filter(
            models.Note.id == note_id,
            models.Note.user_id == current_user.id,
            models.Note.deleted_at == None,
        )
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.deleted_at = datetime.utcnow()
    db.commit()
    return {"success": True}


@router.post("/{note_id}/share")
def share_note(
    note_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = (
        db.query(models.Note)
        .filter(
            models.Note.id == note_id,
            models.Note.user_id == current_user.id,
            models.Note.deleted_at == None,
        )
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if not note.share_id:
        note.share_id = str(uuid.uuid4())
    note.is_public = True
    db.commit()
    db.refresh(note)
    return {"share_id": note.share_id}


@router.post("/{note_id}/generate-summary")
def generate_summary(
    note_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = (
        db.query(models.Note)
        .filter(
            models.Note.id == note_id,
            models.Note.user_id == current_user.id,
            models.Note.deleted_at == None,
        )
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if not (note.content or "").strip():
        raise HTTPException(status_code=400, detail="Add some content before summarising")

    api_key = os.getenv("AI_API_KEY")
    ai_base_url = os.getenv("AI_BASE_URL")        # e.g. https://api.oxlo.ai/v1
    ai_model = os.getenv("AI_MODEL", "gpt-4o-mini")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI not configured — add AI_API_KEY to backend/.env",
        )

    try:
        from openai import OpenAI

        ac = OpenAI(api_key=api_key, base_url=ai_base_url or None)
        prompt = (
            "Analyse this note and return ONLY a JSON object with exactly these three keys:\n"
            '{"summary": "2-3 sentence summary", "action_items": ["item 1", "..."], '
            '"suggested_title": "concise title"}\n\n'
            f"Title: {note.title}\n\n{note.content}"
        )
        msg = ac.chat.completions.create(
            model=ai_model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.choices[0].message.content.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1][4:] if parts[1].startswith("json") else parts[1]
        result = json.loads(raw.strip())

        note.ai_summary = result.get("summary", "")
        note.ai_action_items = result.get("action_items", [])
        note.ai_suggested_title = result.get("suggested_title", "")
        note.ai_generated_count += 1
        note.updated_at = datetime.utcnow()
        db.commit()

        return {
            "summary": note.ai_summary,
            "action_items": note.ai_action_items,
            "suggested_title": note.ai_suggested_title,
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON — try again")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{note_id}/quiz")
def generate_quiz(
    note_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = (
        db.query(models.Note)
        .filter(
            models.Note.id == note_id,
            models.Note.user_id == current_user.id,
            models.Note.deleted_at == None,
        )
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if not (note.content or "").strip():
        raise HTTPException(status_code=400, detail="Add some content before generating a quiz")

    api_key = os.getenv("AI_API_KEY")
    ai_base_url = os.getenv("AI_BASE_URL")
    ai_model = os.getenv("AI_MODEL", "llama-3.1-8b-instant")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI not configured — add AI_API_KEY to backend/.env")

    try:
        from openai import OpenAI
        ac = OpenAI(api_key=api_key, base_url=ai_base_url or None)
        prompt = (
            "Generate exactly 3 multiple-choice quiz questions based on the note below.\n"
            "Return ONLY a JSON array with this exact structure:\n"
            '[{"question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}]\n'
            "Rules: answer is the 0-based index of the correct option. "
            "Make questions test real understanding, not trivial recall.\n\n"
            f"Title: {note.title}\n\n{note.content}"
        )
        msg = ac.chat.completions.create(
            model=ai_model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.choices[0].message.content.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1][4:] if parts[1].startswith("json") else parts[1]
        questions = json.loads(raw.strip())
        if not isinstance(questions, list) or len(questions) == 0:
            raise ValueError("Expected a list of questions")
        return {"questions": questions}
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON — try again")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AIActionBody(BaseModel):
    action: str
    selected_text: str


@router.post("/{note_id}/ai-action")
def ai_action(
    note_id: str,
    body: AIActionBody,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = (
        db.query(models.Note)
        .filter(
            models.Note.id == note_id,
            models.Note.user_id == current_user.id,
            models.Note.deleted_at == None,
        )
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if not body.selected_text.strip():
        raise HTTPException(status_code=400, detail="No text selected")

    api_key = os.getenv("AI_API_KEY")
    ai_base_url = os.getenv("AI_BASE_URL")
    ai_model = os.getenv("AI_MODEL", "llama-3.1-8b-instant")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI not configured")

    prompts = {
        "rewrite": (
            "Rewrite the following text to be clearer, more engaging, and better structured. "
            "Return ONLY the rewritten text, no explanations or preamble:\n\n"
            + body.selected_text
        ),
        "simplify": (
            "Simplify the following text to be more concise and easier to understand. "
            "Return ONLY the simplified text, no explanations:\n\n"
            + body.selected_text
        ),
        "extract_tasks": (
            "Extract all action items and tasks from the following text. "
            'Return ONLY a JSON array of strings like ["task 1", "task 2"]. '
            "If none found, return [].\n\n"
            + body.selected_text
        ),
    }

    prompt = prompts.get(body.action)
    if not prompt:
        raise HTTPException(status_code=400, detail="Invalid action")

    try:
        from openai import OpenAI
        ac = OpenAI(api_key=api_key, base_url=ai_base_url or None)
        msg = ac.chat.completions.create(
            model=ai_model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.choices[0].message.content.strip()

        if body.action == "extract_tasks":
            if raw.startswith("```"):
                parts = raw.split("```")
                raw = parts[1][4:] if parts[1].startswith("json") else parts[1]
            try:
                tasks = json.loads(raw.strip())
            except Exception:
                tasks = [l.strip("- •*").strip() for l in raw.splitlines() if l.strip()]
            return {"action": body.action, "result": tasks}

        return {"action": body.action, "result": raw}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
