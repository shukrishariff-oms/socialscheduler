import asyncio
import os
import httpx
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def send_to_social(platform: str, content: str, media_url: str = None) -> bool:
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

    # --- Threads Integration ---
    elif platform == 'threads':
        user_id = os.getenv('THREADS_USER_ID')
        token = os.getenv('THREADS_ACCESS_TOKEN')
        
        print(f"[DEBUG] Threads User ID Present: {bool(user_id)}")
        print(f"[DEBUG] Threads Token Present: {bool(token)}")
        
        if not user_id or not token:
            print(f"[{platform.upper()}] ERROR: Missing credentials (THREADS_USER_ID or THREADS_ACCESS_TOKEN).")
            return False

        base_url = "https://graph.threads.net/v1.0"
        
        async with httpx.AsyncClient() as client:
            try:
                # Step 1: Create Container
                create_url = f"{base_url}/{user_id}/threads"
                create_params = {
                    'media_type': 'TEXT',
                    'text': content,
                    'access_token': token
                }
                
                resp1 = await client.post(create_url, params=create_params)
                if resp1.status_code != 200:
                    print(f"[{platform.upper()}] FAILED (Container): {resp1.text}")
                    return False
                
                container_id = resp1.json().get('id')
                
                # Step 2: Publish Container
                publish_url = f"{base_url}/{user_id}/threads_publish"
                publish_params = {
                    'creation_id': container_id,
                    'access_token': token
                }
                
                resp2 = await client.post(publish_url, params=publish_params)
                if resp2.status_code == 200:
                    print(f"[{platform.upper()}] SUCCESS: Published to Threads.")
                    return True
                else:
                    print(f"[{platform.upper()}] FAILED (Publish): {resp2.text}")
                    return False
                    
            except Exception as e:
                print(f"[{platform.upper()}] ERROR: {e}")
                return False

    # --- Generic/Mock for Others (Twitter/X, Facebook) ---
    else:
        print(f"[{platform.upper()}] Simulation Mode (Real API not configured for this demo).")
        await asyncio.sleep(1)
        return True
