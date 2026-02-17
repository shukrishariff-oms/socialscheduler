from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base
import enum

class PostStatus(str, enum.Enum):
    pending = "pending"
    published = "published"
    failed = "failed"

class SocialPost(Base):
    __tablename__ = "social_posts"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    media_url = Column(String, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    platform = Column(String, nullable=False)
    status = Column(String, default=PostStatus.pending.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
