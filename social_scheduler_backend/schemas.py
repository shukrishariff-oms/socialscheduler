from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Existing schemas
class SocialPostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    scheduled_at: datetime
    platform: str

class SocialPostResponse(BaseModel):
    id: int
    content: str
    media_url: Optional[str]
    scheduled_at: datetime
    platform: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Aliases for backward compatibility
PostCreate = SocialPostCreate
PostResponse = SocialPostResponse

# New schemas for account connection
class ConnectAccountRequest(BaseModel):
    username: str
    password: str

class ConnectAccountResponse(BaseModel):
    success: bool
    username: Optional[str] = None
    error: Optional[str] = None

class AccountStatus(BaseModel):
    platform: str
    username: str
    connected_at: str
    last_used: Optional[str] = None

class AccountsStatusResponse(BaseModel):
    accounts: list[AccountStatus]

class DisconnectAccountResponse(BaseModel):
    success: bool
    error: Optional[str] = None
