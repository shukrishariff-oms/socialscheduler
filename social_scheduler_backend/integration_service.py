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

    # --- Threads Integration (Browser Automation) ---
    elif platform == 'threads':
        # Use browser automation instead of API
        from threads_automation import ThreadsAutomation
        
        username = os.getenv('THREADS_USERNAME')
        password = os.getenv('THREADS_PASSWORD')
        
        print(f"[DEBUG] Threads Username Present: {bool(username)}")
        print(f"[DEBUG] Threads Password Present: {bool(password)}")
        
        if not username or not password:
            print(f"[{platform.upper()}] ERROR: Missing credentials (THREADS_USERNAME or THREADS_PASSWORD).")
            print(f"[{platform.upper()}] Please set THREADS_USERNAME and THREADS_PASSWORD environment variables.")
            return False
        
        try:
            automation = ThreadsAutomation()
            success = await automation.post_to_threads(username, password, content, media_url)
            
            if success:
                print(f"[{platform.upper()}] SUCCESS: Posted via browser automation")
            else:
                print(f"[{platform.upper()}] FAILED: Browser automation failed")
            
            return success
            
        except Exception as e:
            print(f"[{platform.upper()}] ERROR: {e}")
            import traceback
            traceback.print_exc()
            return False


    # --- Generic/Mock for Others (Twitter/X, Facebook) ---
    else:
        print(f"[{platform.upper()}] Simulation Mode (Real API not configured for this demo).")
        await asyncio.sleep(1)
        return True
