from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, default="Untitled")
    content = Column(Text, default="")
    tags = Column(JSON, default=list)
    is_archived = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)
    share_id = Column(String, nullable=True, unique=True)
    ai_summary = Column(Text, nullable=True)
    ai_action_items = Column(JSON, nullable=True)
    ai_suggested_title = Column(String, nullable=True)
    ai_generated_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
