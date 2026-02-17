from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, UniqueConstraint
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

class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False)  # 'threads', 'linkedin', etc.
    username = Column(String(255), nullable=False)
    encrypted_password = Column(Text, nullable=False)  # AES encrypted
    session_data = Column(Text, nullable=True)  # JSON: browser cookies/session
    is_active = Column(Boolean, default=True)
    connected_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    __table_args__ = (
        UniqueConstraint('platform', 'username', name='unique_platform_username'),
    )
