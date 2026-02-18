# ============================================================
# main.py - Social Media Scheduler API
# ============================================================

# --- Standard Library Imports ---
import os
import json
import logging
import urllib.parse
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from typing import List, Union, Optional

# --- Third-Party Imports ---
import httpx
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

# --- Local Imports ---
from database import engine, Base, get_db, AsyncSessionLocal
from models import SocialPost, PostStatus, ConnectedAccount
from schemas import (
    PostCreate,
    PostResponse,
    ConnectAccountRequest,
    ConnectAccountResponse,
    AccountsStatusResponse,
    AccountStatus,
    DisconnectAccountResponse
)
from integration_service import send_to_social
from encryption import get_encryptor

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Threads OAuth Config (read once at startup) ---
THREADS_APP_ID = os.getenv("THREADS_APP_ID", "").strip()
THREADS_APP_SECRET = os.getenv("THREADS_APP_SECRET", "").strip()
THREADS_REDIRECT_URI = os.getenv(
    "THREADS_REDIRECT_URI",
    "http://localhost:8000/api/auth/threads/callback"
).strip()


# ============================================================
# Background Task: Check & Publish Scheduled Posts
# ============================================================

async def check_scheduled_posts():
    """Checks the database for posts that are 'pending' and scheduled_at <= now."""
    async with AsyncSessionLocal() as session:
        now = datetime.now(timezone.utc)
        result = await session.execute(
            select(SocialPost).where(
                SocialPost.status == PostStatus.pending,
                SocialPost.scheduled_at <= now
            )
        )
        posts_to_publish = result.scalars().all()

        for post in posts_to_publish:
            try:
                success = await send_to_social(post.platform, post.content, post.media_url)
                post.status = PostStatus.published if success else PostStatus.failed
                logger.info(f"[SCHEDULER] Post {post.id} -> {'published' if success else 'failed'}")
            except Exception as e:
                logger.error(f"[SCHEDULER] Error publishing post {post.id}: {e}")
                post.status = PostStatus.failed
            await session.commit()


# ============================================================
# App Lifespan (Startup / Shutdown)
# ============================================================

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Create DB tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[STARTUP] Database tables created/verified.")
    except Exception as e:
        logger.error(f"[STARTUP] CRITICAL: Database init failed: {e}")
        raise

    # Log Threads config on startup
    logger.info("--- STARTUP CONFIG CHECK ---")
    logger.info(f"[THREADS] App ID present: {bool(THREADS_APP_ID)} (len={len(THREADS_APP_ID)})")
    logger.info(f"[THREADS] App Secret present: {bool(THREADS_APP_SECRET)}")
    logger.info(f"[THREADS] Redirect URI: {THREADS_REDIRECT_URI}")
    logger.info("--- END CHECK ---")

    # Start scheduler
    try:
        scheduler.add_job(
            check_scheduled_posts,
            IntervalTrigger(seconds=10),
            id="check_posts",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("[SCHEDULER] Started.")
    except Exception as e:
        logger.error(f"[STARTUP] CRITICAL: Scheduler failed to start: {e}")
        raise

    yield

    scheduler.shutdown()
    logger.info("[SCHEDULER] Shut down.")


# ============================================================
# FastAPI App
# ============================================================

app = FastAPI(title="Social Media Scheduler", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Debug Endpoint
# ============================================================

@app.get("/api/debug/threads-config")
async def debug_threads_config():
    """Debug endpoint to check Threads configuration."""
    app_id = os.getenv("THREADS_APP_ID", "")
    secret = os.getenv("THREADS_APP_SECRET", "")
    redirect = os.getenv("THREADS_REDIRECT_URI", "")
    return {
        "app_id_present": bool(app_id),
        "app_id_length": len(app_id),
        "app_id_preview": f"{app_id[:3]}...{app_id[-3:]}" if len(app_id) > 6 else app_id,
        "app_id_has_spaces": " " in app_id,
        "app_id_is_digit": app_id.strip().isdigit() if app_id else False,
        "secret_present": bool(secret),
        "secret_length": len(secret),
        "redirect_uri": redirect,
    }


# ============================================================
# Account Connection Endpoints
# ============================================================

@app.get("/api/accounts/status")
async def get_accounts_status(db: AsyncSession = Depends(get_db)):
    """Get connection status for all platforms."""
    try:
        result = await db.execute(
            select(ConnectedAccount).where(ConnectedAccount.is_active == True)
        )
        accounts = result.scalars().all()
        return AccountsStatusResponse(
            accounts=[
                AccountStatus(
                    platform=acc.platform,
                    username=acc.username,
                    connected_at=acc.connected_at.isoformat(),
                    last_used=acc.last_used_at.isoformat() if acc.last_used_at else None
                )
                for acc in accounts
            ]
        )
    except Exception as e:
        logger.error(f"[STATUS] Error: {e}")
        return AccountsStatusResponse(accounts=[])


@app.delete("/api/accounts/disconnect/{platform}")
async def disconnect_account(platform: str, db: AsyncSession = Depends(get_db)):
    """Disconnect a platform account."""
    try:
        result = await db.execute(
            select(ConnectedAccount).where(
                ConnectedAccount.platform == platform,
                ConnectedAccount.is_active == True
            )
        )
        account = result.scalar_one_or_none()
        if account:
            account.is_active = False
            await db.commit()
            return DisconnectAccountResponse(success=True)
        return DisconnectAccountResponse(success=False, error="Account not found")
    except Exception as e:
        logger.error(f"[DISCONNECT] Error: {e}")
        return DisconnectAccountResponse(success=False, error=str(e))


# ============================================================
# Threads OAuth Endpoints
# ============================================================

@app.get("/api/auth/threads/authorize")
async def threads_authorize():
    """Redirect user to Threads OAuth authorization page."""
    if not THREADS_APP_ID:
        logger.error("[THREADS OAUTH] THREADS_APP_ID is not configured!")
        raise HTTPException(status_code=500, detail="Threads App ID not configured")

    params = {
        "client_id": THREADS_APP_ID,
        "redirect_uri": THREADS_REDIRECT_URI,
        "scope": "threads_basic,threads_content_publish",
        "response_type": "code"
    }
    auth_url = f"https://www.threads.net/oauth/authorize?{urllib.parse.urlencode(params)}"

    logger.info(f"[THREADS OAUTH] App ID (first 4): {THREADS_APP_ID[:4]}...")
    logger.info(f"[THREADS OAUTH] Redirect URI: {THREADS_REDIRECT_URI}")
    logger.info(f"[THREADS OAUTH] Full URL: {auth_url}")

    return RedirectResponse(auth_url)


@app.get("/api/auth/threads/callback")
async def threads_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Handle OAuth callback from Threads."""
    if error:
        logger.error(f"[THREADS OAUTH] Authorization error: {error}")
        return HTMLResponse(
            content=f"<html><body><h2>Connection Failed</h2><p>Error: {error}</p>"
                    f"<script>setTimeout(() => window.close(), 3000);</script></body></html>",
            status_code=400
        )

    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")

    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for access token
            response = await client.post(
                "https://graph.threads.net/oauth/access_token",
                data={
                    "client_id": THREADS_APP_ID,
                    "client_secret": THREADS_APP_SECRET,
                    "grant_type": "authorization_code",
                    "redirect_uri": THREADS_REDIRECT_URI,
                    "code": code
                }
            )

            if response.status_code != 200:
                logger.error(f"[THREADS OAUTH] Token exchange failed: {response.text}")
                raise HTTPException(status_code=400, detail="Failed to exchange authorization code")

            token_data = response.json()
            access_token = token_data.get("access_token")
            user_id = token_data.get("user_id")
            expires_in = token_data.get("expires_in", 3600)

            # Get user profile
            profile_response = await client.get(
                f"https://graph.threads.net/v1.0/{user_id}",
                params={"fields": "id,username", "access_token": access_token}
            )

            username = f"user_{user_id}"
            if profile_response.status_code == 200:
                username = profile_response.json().get("username", username)

            logger.info(f"[THREADS OAUTH] Authenticated: @{username}")

            # Encrypt and save token
            encryptor = get_encryptor()
            encrypted_token = encryptor.encrypt(access_token)
            token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

            # Save to database
            result = await db.execute(
                select(ConnectedAccount).where(
                    ConnectedAccount.platform == 'threads',
                    ConnectedAccount.username == username
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                existing.access_token = encrypted_token
                existing.token_expires_at = token_expires_at
                existing.is_active = True
            else:
                db.add(ConnectedAccount(
                    platform='threads',
                    username=username,
                    access_token=encrypted_token,
                    token_expires_at=token_expires_at
                ))

            await db.commit()

            return HTMLResponse(content=f"""
<html>
<head><style>
body{{font-family:sans-serif;display:flex;align-items:center;justify-content:center;
height:100vh;background:linear-gradient(135deg,#667eea,#764ba2);color:white;}}
.box{{text-align:center;padding:2rem;background:rgba(255,255,255,0.1);border-radius:20px;}}
</style></head>
<body><div class="box">
<div style="font-size:64px">✓</div>
<h2>Connected!</h2><p>@{username}</p>
</div>
<script>
if(window.opener){{window.opener.postMessage({{type:'threads_connected',username:'{username}'}},'*');}}
setTimeout(()=>window.close(),2000);
</script>
</body></html>""")

    except Exception as e:
        logger.error(f"[THREADS OAUTH] Error: {str(e)}")
        return HTMLResponse(
            content=f"<html><body><h2>Connection Failed</h2><p>{str(e)}</p>"
                    f"<script>setTimeout(()=>window.close(),3000);</script></body></html>",
            status_code=500
        )


# ============================================================
# Posts Endpoints
# ============================================================

@app.post("/posts", response_model=List[PostResponse])
async def create_posts(posts: Union[PostCreate, List[PostCreate]], db: AsyncSession = Depends(get_db)):
    """Create one or multiple posts."""
    if not isinstance(posts, list):
        posts = [posts]

    LIMITS = {'twitter': 280, 'threads': 500, 'linkedin': 3000, 'facebook': 63206}
    created_posts = []

    for post_data in posts:
        if len(post_data.content) > LIMITS.get(post_data.platform, 3000):
            raise HTTPException(
                status_code=400,
                detail=f"Content too long for {post_data.platform.capitalize()}."
            )
        new_post = SocialPost(
            content=post_data.content,
            media_url=post_data.media_url,
            scheduled_at=post_data.scheduled_at,
            platform=post_data.platform,
            status=PostStatus.pending
        )
        db.add(new_post)
        created_posts.append(new_post)

    await db.commit()
    for p in created_posts:
        await db.refresh(p)
    return created_posts


@app.get("/posts", response_model=List[PostResponse])
async def list_posts(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(SocialPost).order_by(SocialPost.scheduled_at))
        posts = result.scalars().all()
        for post in posts:
            if post.scheduled_at and post.scheduled_at.tzinfo is None:
                post.scheduled_at = post.scheduled_at.replace(tzinfo=timezone.utc)
            if post.created_at and post.created_at.tzinfo is None:
                post.created_at = post.created_at.replace(tzinfo=timezone.utc)
        return posts
    except Exception as e:
        logger.error(f"Error fetching posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/posts/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SocialPost).where(SocialPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(post)
    await db.commit()
    return {"message": "Post deleted successfully"}


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Social Media Scheduler API is running"}


# ============================================================
# Static Files & SPA Catch-All
# ============================================================

if os.path.exists("static/assets"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api") or full_path.startswith("posts"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "Frontend not found. Please build the frontend."}
