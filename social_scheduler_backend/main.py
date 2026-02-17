from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from contextlib import asynccontextmanager
from typing import List, Union
from datetime import datetime, timezone

from database import engine, Base, get_db, AsyncSessionLocal
from models import SocialPost, PostStatus
from schemas import PostCreate, PostResponse
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
    
    # Startup: Start Scheduler
    scheduler.add_job(
        check_scheduled_posts,
        IntervalTrigger(seconds=60),
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

# --- API Endpoints ---

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
    # Sort by scheduled_at desc
    result = await db.execute(select(SocialPost).order_by(SocialPost.scheduled_at.desc()))
    return result.scalars().all()

@app.delete("/posts/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SocialPost).where(SocialPost.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    await db.delete(post)
    await db.commit()
    return {"message": "Post deleted successfully"}

@app.get("/")
async def root():
    return {"message": "Social Media Scheduler API is running"}

