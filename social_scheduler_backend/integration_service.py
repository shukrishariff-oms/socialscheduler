import asyncio
import os
import httpx
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def send_to_social(platform: str, content: str, media_url: str = None, db=None) -> tuple[bool, str | None, str | None]:
    """
    Sends content to social media platforms.
    Returns: (success, post_id, error_message)
    """
    print(f"[{platform.upper()}] Preparing to send: {content[:30]}...")

    # --- LinkedIn Integration ---
    if platform == 'linkedin':
        token = os.getenv('LINKEDIN_ACCESS_TOKEN')
        person_urn = os.getenv('LINKEDIN_PERSON_URN')
        
        if not token or not person_urn:
            msg = "Missing credentials. LinkedIN Token or Person URN not set."
            print(f"[{platform.upper()}] ERROR: {msg}")
            return False, None, msg

        url = 'https://api.linkedin.com/v2/ugcPosts'
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
        }
        
        # Construct simplified text-only payload for MVP
        payload = {
            "author": f"urn:li:person:{person_urn}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": content
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code in [201, 200]:
                    post_id = response.json().get('id')
                    print(f"[{platform.upper()}] SUCCESS: Posted to LinkedIn. ID: {post_id}")
                    return True, post_id, None
                else:
                    print(f"[{platform.upper()}] FAILED: {response.text}")
                    return False, None, response.text
            except Exception as e:
                print(f"[{platform.upper()}] ERROR: {e}")
                return False, None, str(e)

    # --- Threads Integration (Official API with OAuth) ---
    elif platform == 'threads':
        from threads_api_service import ThreadsAPIService
        from encryption import get_encryptor
        from sqlalchemy import select
        from models import ConnectedAccount
        from datetime import datetime
        
        access_token = None
        username = None

        # 1. Try Environment Variable (Priority/Backup)
        if os.getenv("THREADS_ACCESS_TOKEN"):
            access_token = os.getenv("THREADS_ACCESS_TOKEN")
            username = os.getenv("THREADS_USERNAME", "env_user")
            print(f"[{platform.upper()}] Using token from Environment Variables for @{username}")

        # 2. Try Database (if no env var)
        if not access_token and db:
            result = await db.execute(
                select(ConnectedAccount).where(
                    ConnectedAccount.platform == 'threads',
                    ConnectedAccount.is_active == True
                )
            )
            account = result.scalar_one_or_none()
            
            if account and account.access_token:
                try:
                    encryptor = get_encryptor()
                    access_token = encryptor.decrypt(account.access_token)
                    username = account.username
                    print(f"[{platform.upper()}] Using connected account from DB: @{username}")
                except Exception as e:
                    print(f"[{platform.upper()}] Error decrypting DB token: {e}")

        if not access_token:
            msg = "No access token found (checked Env Var & DB)"
            print(f"[{platform.upper()}] ERROR: {msg}")
            return False, None, msg
            
        try:
            # Initialize API service
            print(f"[{platform.upper()}] Using connected account: @{username}")
            
            # Initialize API service
            api = ThreadsAPIService(access_token)
            
            # Determine media type
            media_type = "TEXT"
            if media_url:
                media_type = "IMAGE"  # Could add logic for VIDEO detection
            
            # Create post via API
            result = await api.create_post(content, media_url, media_type)
            
            if result["success"]:
                post_id = result.get('post_id')
                print(f"[{platform.upper()}] ✓ Successfully posted! ID: {post_id}")
                
                # Update last_used_at ONLY if account exists in DB
                if account:
                    account.last_used_at = datetime.utcnow()
                    await db.commit()
                
                return True, post_id, None
            else:
                error_msg = result.get('error')
                print(f"[{platform.upper()}] ✗ Failed to post: {error_msg}")
                return False, None, error_msg
                
        except Exception as e:
            print(f"[{platform.upper()}] ERROR: {e}")
            return False, None, str(e)


    # --- Generic/Mock for Others (Twitter/X, Facebook) ---
    else:
        print(f"[{platform.upper()}] Simulation Mode (Real API not configured for this demo).")
        await asyncio.sleep(1)
        return True, "mock_id_123", None
