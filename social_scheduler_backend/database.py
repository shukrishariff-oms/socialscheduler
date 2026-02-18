from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

import os

DATABASE_URL = "sqlite+aiosqlite:////app/social_posts.db"

# Ensure database directory exists
db_path = "/app/social_posts.db"
db_dir = os.path.dirname(db_path)
if db_dir and not os.path.exists(db_dir):
    try:
        os.makedirs(db_dir, exist_ok=True)
        print(f"Created database directory: {db_dir}")
    except Exception as e:
        print(f"Error creating database directory: {e}")

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"check_same_thread": False}
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
