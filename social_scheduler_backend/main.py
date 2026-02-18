from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from contextlib import asynccontextmanager
from typing import List, Union
from datetime import datetime, timezone, timedelta
import logging
import json
import os
import urllib.parse
import httpx

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

# --- Background Task: Check & Publish Posts ---
async def check_scheduled_posts():
    """
    Checks the database for posts that are 'pending' and scheduled_at <= now.
    """
    print(f"[Check] Checking for pending posts at {datetime.now(timezone.utc)}")
    async with AsyncSessionLocal() as session:
        now = datetime.now(timezone.utc)
        # Select posts that are pending and due
        result = await session.execute(
            select(SocialPost).where(
                SocialPost.status == PostStatus.pending,
                SocialPost.scheduled_at <= now
            )
        )
        posts_to_publish = result.scalars().all()

        for post in posts_to_publish:
            try:
                # Execute the post via integration service
                success = await send_to_social(post.platform, post.content, post.media_url)
                if success:
                    post.status = PostStatus.published
                    print(f"[OK] Published post {post.id}")
                else:
                    post.status = PostStatus.failed
                    print(f"[FAIL] Failed to publish post {post.id}")
            except Exception as e:
                print(f"[ERROR] Error publishing post {post.id}: {e}")
                post.status = PostStatus.failed
            
            # Commit the status update
            await session.commit()

# --- Lifespan & Scheduler Setup ---
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # debug: Check Env Vars on Startup
    import os
    print("--- STARTUP CONFIG CHECK ---")
    print(f"[DEBUG] THREADS_USERNAME Present: {bool(os.getenv('THREADS_USERNAME'))}")
    print(f"[DEBUG] THREADS_PASSWORD Present: {bool(os.getenv('THREADS_PASSWORD'))}")
    
    # Note: Threads now uses browser automation instead of API
    username = os.getenv('THREADS_USERNAME')
    password = os.getenv('THREADS_PASSWORD')
    
    if username and password:
        print(f"[STARTUP] ✓ Threads credentials configured for user: {username}")
        print(f"[STARTUP] Browser automation will be used for Threads posting")
    else:
        print("[STARTUP] ⚠ Threads credentials not configured")
        print("[STARTUP] Set THREADS_USERNAME and THREADS_PASSWORD to enable Threads posting")
    
    print("--- END CHECK ---")
    
    # Startup: Start Scheduler
    scheduler.add_job(
        check_scheduled_posts,
        IntervalTrigger(seconds=10),
        id="check_posts",
        replace_existing=True,
    )
    scheduler.start()
    print("[INFO] Scheduler started.")
    
    yield
    
    # Shutdown
    scheduler.shutdown()
    print("[INFO] Scheduler shut down.")

app = FastAPI(title="Social Media Scheduler", lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== ACCOUNT CONNECTION ENDPOINTS ====================

from encryption import get_encryptor

# Legacy password-based endpoint removed - now using OAuth via /api/auth/threads/authorize & /callback


@app.get("/api/accounts/status")
async def get_accounts_status(db: AsyncSession = Depends(get_db)):
    """Get connection status for all platforms"""
    try:
        result = await db.execute(
            select(ConnectedAccount).where(
                ConnectedAccount.is_active == True
            )
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
        print(f"[STATUS] Error: {e}")
        return AccountsStatusResponse(accounts=[])

@app.delete("/api/accounts/disconnect/{platform}")
async def disconnect_account(
    platform: str,
    db: AsyncSession = Depends(get_db)
):
    """Disconnect a platform account"""
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
        
        return DisconnectAccountResponse(
            success=False,
            error="Account not found"
        )
    except Exception as e:
        print(f"[DISCONNECT] Error: {e}")
        return DisconnectAccountResponse(
            success=False,
            error=str(e)
        )


# --- Threads OAuth Endpoints ---

import httpx
from fastapi.responses import RedirectResponse, HTMLResponse
from datetime import timedelta

# Environment variables for Threads OAuth
THREADS_APP_ID = os.getenv("THREADS_APP_ID", "")
THREADS_APP_SECRET = os.getenv("THREADS_APP_SECRET", "")
THREADS_REDIRECT_URI = os.getenv("THREADS_REDIRECT_URI", "http://localhost:8000/api/auth/threads/callback")

import urllib.parse

@app.get("/api/auth/threads/authorize")
async def threads_authorize():
    """Redirect user to Threads OAuth authorization page"""
    app_id = THREADS_APP_ID.strip()
    redirect_uri = THREADS_REDIRECT_URI.strip()
    
    if not app_id:
        raise HTTPException(status_code=500, detail="Threads App ID not configured")
    
    # URL encode params
    params = {
        "client_id": app_id,
        "redirect_uri": redirect_uri,
        "scope": "threads_basic,threads_content_publish",
        "response_type": "code"
    }
    encoded_params = urllib.parse.urlencode(params)
    
    auth_url = f"https://www.threads.net/oauth/authorize?{encoded_params}"
    
    logger.info(f"[THREADS OAUTH] App ID: {app_id}")
    logger.info(f"[THREADS OAUTH] Redirect URI: {redirect_uri}")
    logger.info(f"[THREADS OAUTH] Generated URL: {auth_url}")
    
    return RedirectResponse(auth_url)

@app.get("/api/auth/threads/callback")
async def threads_callback(
    code: str = None,
    error: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Handle OAuth callback from Threads"""
    if error:
        logger.error(f"[THREADS OAUTH] Authorization error: {error}")
        return HTMLResponse(
            content=f"<html><body><h2>Connection Failed</h2><p>Error: {error}</p><script>setTimeout(() => window.close(), 3000);</script></body></html>",
            status_code=400
        )
    
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")
    
    try:
        # Exchange code for access token
        async with httpx.AsyncClient() as client:
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
            from encryption import get_encryptor
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
                new_account = ConnectedAccount(
                    platform='threads',
                    username=username,
                    access_token=encrypted_token,
                    token_expires_at=token_expires_at
                )
                db.add(new_account)
            
            await db.commit()
            
            return HTMLResponse(
                content=f"""<html><head><style>body{{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:linear-gradient(135deg,#667eea,#764ba2);color:white;}}.container{{text-align:center;padding:2rem;background:rgba(255,255,255,0.1);border-radius:20px;}}</style></head><body><div class="container"><div style="font-size:64px;margin-bottom:1rem;">✓</div><h2>Connected!</h2><p>@{username}</p></div><script>if(window.opener){{window.opener.postMessage({{type:'threads_connected',username:'{username}'}},'*');}}setTimeout(()=>window.close(),2000);</script></body></html>"""
            )
            
    except Exception as e:
        logger.error(f"[THREADS OAUTH] Error: {str(e)}")
        return HTMLResponse(
            content=f"<html><body><h2>Connection Failed</h2><p>{str(e)}</p><script>setTimeout(()=>window.close(),3000);</script></body></html>",
            status_code=500
        )

# --- API Endpoints ---

@app.get("/api/debug/threads-config")
async def debug_threads_config():
    """Debug endpoint to check Threads configuration (Remove in production)"""
    app_id = os.getenv("THREADS_APP_ID", "")
    secret = os.getenv("THREADS_APP_SECRET", "")
    redirect = os.getenv("THREADS_REDIRECT_URI", "")
    
    return {
        "app_id_present": bool(app_id),
        "app_id_length": len(app_id),
        "app_id_preview": f"{app_id[:3]}...{app_id[-3:]}" if len(app_id) > 6 else "Too short",
        "app_id_has_spaces": " " in app_id,
        "app_id_is_digit": app_id.strip().isdigit() if app_id else False,
        "secret_present": bool(secret),
        "secret_length": len(secret),
        "redirect_uri": redirect,
        "redirect_uri_matches_env": redirect == THREADS_REDIRECT_URI
    }


@app.post("/posts", response_model=List[PostResponse])
async def create_posts(posts: Union[PostCreate, List[PostCreate]], db: AsyncSession = Depends(get_db)):
    """
    Create one or multiple posts.
    Enforces strict character limits for each platform.
    Returns 400 Bad Request if any post exceeds its limit.
    """
    # Normalize to list if single object
    if not isinstance(posts, list):
        posts = [posts]
        
    created_posts = []
    
    # Platform limits
    LIMITS = {
        'twitter': 280,
        'threads': 500,
        'linkedin': 3000,
        'facebook': 63206
    }
    
    for post_data in posts:
        content = post_data.content
        platform = post_data.platform
        limit = LIMITS.get(platform, 3000)
        
        # Hard Validation
        if len(content) > limit:
            raise HTTPException(
                status_code=400, 
                detail=f"Content too long for {platform.capitalize()}. Limit is {limit} characters."
            )
            
        new_post = SocialPost(
            content=content,
            media_url=post_data.media_url,
            scheduled_at=post_data.scheduled_at,
            platform=platform,
            status=PostStatus.pending 
        )
        db.add(new_post)
        created_posts.append(new_post)
    
    await db.commit()
    
    # Refresh all to get IDs
    for p in created_posts:
        await db.refresh(p)
        
    return created_posts

@app.get("/posts", response_model=List[PostResponse])
async def list_posts(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(SocialPost).order_by(SocialPost.scheduled_at))
        posts = result.scalars().all()
        # Force UTC timezone if missing (SQLite fix)
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
    return {"message": "Social Media Scheduler API is running"}

# Mount assets (JS/CSS built by Vite)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Ensure static/assets exists before mounting to avoid errors during dev if not built
if os.path.exists("static/assets"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

# Catch-all for SPA (Serve index.html)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Allow API routes to pass through (in case some are not caught above)
    if full_path.startswith("api") or full_path.startswith("posts"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
        
    # Serve index.html if exists
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "Frontend not found. Please build the frontend."}

