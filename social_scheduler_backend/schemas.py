from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime, timezone
from typing import Optional
from models import PostStatus

class PostBase(BaseModel):
    content: str
    media_url: Optional[str] = None
    scheduled_at: datetime
    platform: str

class PostCreate(PostBase):
    @field_validator('scheduled_at')
    def validate_scheduled_at(cls, v):
        if v.tzinfo is None:
             v = v.replace(tzinfo=timezone.utc)
        if v <= datetime.now(timezone.utc):
            raise ValueError('Scheduled time must be in the future')
        return v

class PostResponse(PostBase):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
