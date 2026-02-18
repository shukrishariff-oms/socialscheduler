"""
Threads API Service
Official Meta Threads API integration for posting
"""

import httpx
import asyncio
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ThreadsAPIService:
    """Service for interacting with official Threads API"""
    
    BASE_URL = "https://graph.threads.net/v1.0"
    
    def __init__(self, access_token: str):
        """
        Initialize Threads API service
        
        Args:
            access_token: User's Threads access token
        """
        self.access_token = access_token
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def create_post(
        self, 
        text: str, 
        media_url: Optional[str] = None,
        media_type: str = "TEXT"
    ) -> Dict[str, Any]:
        """
        Create a post on Threads
        
        Args:
            text: Post content
            media_url: Optional media URL
            media_type: "TEXT", "IMAGE", or "VIDEO"
        
        Returns:
            Dict with success status and post ID or error
        """
        try:
            # Step 1: Create media container
            container_id = await self._create_container(text, media_url, media_type)
            
            if not container_id:
                return {"success": False, "error": "Failed to create media container"}
            
            # Step 2: Publish the container
            post_id = await self._publish_container(container_id)
            
            if not post_id:
                return {"success": False, "error": "Failed to publish post"}
            
            logger.info(f"[THREADS API] Successfully posted: {post_id}")
            return {"success": True, "post_id": post_id}
            
        except Exception as e:
            logger.error(f"[THREADS API] Error creating post: {e}")
            return {"success": False, "error": str(e)}
    
    async def _create_container(
        self, 
        text: str, 
        media_url: Optional[str],
        media_type: str
    ) -> Optional[str]:
        """
        Create a media container (Step 1 of posting)
        
        Returns:
            Container ID or None if failed
        """
        endpoint = f"{self.BASE_URL}/me/threads"
        
        payload = {
            "media_type": media_type,
            "text": text,
            "access_token": self.access_token
        }
        
        # Add media URL if provided
        if media_url:
            if media_type == "IMAGE":
                payload["image_url"] = media_url
            elif media_type == "VIDEO":
                payload["video_url"] = media_url
        
        try:
            response = await self.client.post(endpoint, json=payload)
            response.raise_for_status()
            
            data = response.json()
            container_id = data.get("id")
            
            logger.info(f"[THREADS API] Created container: {container_id}")
            return container_id
            
        except httpx.HTTPStatusError as e:
            logger.error(f"[THREADS API] HTTP error creating container: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"[THREADS API] Error creating container: {e}")
            return None
    
    async def _publish_container(self, container_id: str) -> Optional[str]:
        """
        Publish a media container (Step 2 of posting)
        
        Args:
            container_id: ID from create_container
        
        Returns:
            Post ID or None if failed
        """
        endpoint = f"{self.BASE_URL}/me/threads_publish"
        
        payload = {
            "creation_id": container_id,
            "access_token": self.access_token
        }
        
        try:
            response = await self.client.post(endpoint, json=payload)
            response.raise_for_status()
            
            data = response.json()
            post_id = data.get("id")
            
            logger.info(f"[THREADS API] Published post: {post_id}")
            return post_id
            
        except httpx.HTTPStatusError as e:
            logger.error(f"[THREADS API] HTTP error publishing: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"[THREADS API] Error publishing: {e}")
            return None
    
    async def get_user_profile(self, user_id: str = "me") -> Optional[Dict[str, Any]]:
        """
        Get user profile information
        
        Args:
            user_id: User ID or "me" for current user
        
        Returns:
            User profile data or None
        """
        endpoint = f"{self.BASE_URL}/{user_id}"
        
        params = {
            "fields": "id,username,threads_profile_picture_url,threads_biography",
            "access_token": self.access_token
        }
        
        try:
            response = await self.client.get(endpoint, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"[THREADS API] Error getting profile: {e}")
            return None
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


async def test_threads_api(access_token: str, text: str):
    """
    Test function for Threads API
    
    Args:
        access_token: User's access token
        text: Test post content
    """
    async with ThreadsAPIService(access_token) as api:
        # Get profile
        profile = await api.get_user_profile()
        if profile:
            print(f"Profile: @{profile.get('username')}")
        
        # Create post
        result = await api.create_post(text)
        if result["success"]:
            print(f"Post created: {result['post_id']}")
        else:
            print(f"Error: {result['error']}")


if __name__ == "__main__":
    # For testing
    import sys
    if len(sys.argv) > 2:
        token = sys.argv[1]
        text = sys.argv[2]
        asyncio.run(test_threads_api(token, text))
    else:
        print("Usage: python threads_api_service.py <access_token> <text>")
