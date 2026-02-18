import asyncio
import os
import httpx
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def send_to_social(platform: str, content: str, media_url: str = None, db=None) -> bool:
    """
    Sends content to social media platforms using real APIs.
    Falls back to mock mode if tokens are missing.
    """
    print(f"[{platform.upper()}] Preparing to send: {content[:30]}...")

    # --- LinkedIn Integration ---
    if platform == 'linkedin':
        token = os.getenv('LINKEDIN_ACCESS_TOKEN')
        person_urn = os.getenv('LINKEDIN_PERSON_URN')
        
        if not token or not person_urn:
            print(f"[{platform.upper()}] ERROR: Missing credentials. LinkedIN Token or Person URN not set.")
            return False

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
                    print(f"[{platform.upper()}] SUCCESS: Posted to LinkedIn. ID: {response.json().get('id')}")
                    return True
                else:
                    print(f"[{platform.upper()}] FAILED: {response.text}")
                    return False
            except Exception as e:
                print(f"[{platform.upper()}] ERROR: {e}")
                return False

    # --- Threads Integration (Official API with OAuth) ---
    elif platform == 'threads':
        from threads_api_service import ThreadsAPIService
        from encryption import get_encryptor
        from sqlalchemy import select
        from models import ConnectedAccount
        from datetime import datetime
        
        # Fetch account from database
        result = await db.execute(
            select(ConnectedAccount).where(
                ConnectedAccount.platform == 'threads',
                ConnectedAccount.is_active == True
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            print(f"[{platform.upper()}] ERROR: No connected Threads account found")
            print(f"[{platform.upper()}] Please connect your Threads account first via the UI")
            return False
        
        if not account.access_token:
            print(f"[{platform.upper()}] ERROR: No access token found - please reconnect account")
            return False
        
        try:
            # Decrypt access token
            encryptor = get_encryptor()
            access_token = encryptor.decrypt(account.access_token)
            
            print(f"[{platform.upper()}] Using connected account: @{account.username}")
            
            # Initialize API service
            api = ThreadsAPIService(access_token)
            
            # Determine media type
            media_type = "TEXT"
            if media_url:
                media_type = "IMAGE"  # Could add logic for VIDEO detection
            
            # Create post via API
            result = await api.create_post(content, media_url, media_type)
            
            if result["success"]:
                print(f"[{platform.upper()}] ✓ Successfully posted! ID: {result.get('post_id')}")
                # Update last_used_at
                account.last_used_at = datetime.utcnow()
                await db.commit()
                return True
            else:
                print(f"[{platform.upper()}] ✗ Failed to post: {result.get('error')}")
                return False
                
        except Exception as e:
            print(f"[{platform.upper()}] ERROR: {e}")
            return False


    # --- Generic/Mock for Others (Twitter/X, Facebook) ---
    else:
        print(f"[{platform.upper()}] Simulation Mode (Real API not configured for this demo).")
        await asyncio.sleep(1)
        return True
