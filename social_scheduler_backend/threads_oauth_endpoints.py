"""
OAuth endpoints for Threads API
Add these to main.py after the disconnect_account endpoint
"""

import os
import httpx
from fastapi.responses import RedirectResponse, HTMLResponse
from datetime import datetime, timedelta

# Environment variables for Threads OAuth
THREADS_APP_ID = os.getenv("THREADS_APP_ID", "")
THREADS_APP_SECRET = os.getenv("THREADS_APP_SECRET", "")
THREADS_REDIRECT_URI = os.getenv("THREADS_REDIRECT_URI", "http://localhost:8000/api/auth/threads/callback")

@app.get("/api/auth/threads/authorize")
async def threads_authorize():
    """
    Redirect user to Threads OAuth authorization page
    """
    if not THREADS_APP_ID:
        raise HTTPException(status_code=500, detail="Threads App ID not configured")
    
    # Build authorization URL
    auth_url = (
        f"https://threads.net/oauth/authorize"
        f"?client_id={THREADS_APP_ID}"
        f"&redirect_uri={THREADS_REDIRECT_URI}"
        f"&scope=threads_basic,threads_content_publish"
        f"&response_type=code"
    )
    
    logger.info(f"[THREADS OAUTH] Redirecting to authorization: {auth_url}")
    return RedirectResponse(auth_url)


@app.get("/api/auth/threads/callback")
async def threads_callback(
    code: str = None,
    error: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle OAuth callback from Threads
    Exchange authorization code for access token
    """
    # Handle error from OAuth provider
    if error:
        logger.error(f"[THREADS OAUTH] Authorization error: {error}")
        return HTMLResponse(
            content=f"""
            <html>
                <body>
                    <h2>Connection Failed</h2>
                    <p>Error: {error}</p>
                    <script>
                        setTimeout(() => window.close(), 3000);
                    </script>
                </body>
            </html>
            """,
            status_code=400
        )
    
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")
    
    try:
        # Exchange code for access token
        token_url = "https://graph.threads.net/oauth/access_token"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
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
            expires_in = token_data.get("expires_in", 3600)  # Default 1 hour
            
            if not access_token or not user_id:
                raise HTTPException(status_code=400, detail="Invalid token response")
            
            # Get user profile information
            profile_response = await client.get(
                f"https://graph.threads.net/v1.0/{user_id}",
                params={
                    "fields": "id,username,threads_profile_picture_url",
                    "access_token": access_token
                }
            )
            
            if profile_response.status_code != 200:
                logger.error(f"[THREADS OAUTH] Failed to get profile: {profile_response.text}")
                username = f"user_{user_id}"  # Fallback
            else:
                profile_data = profile_response.json()
                username = profile_data.get("username", f"user_{user_id}")
            
            logger.info(f"[THREADS OAUTH] Successfully authenticated: @{username}")
            
            # Encrypt and save access token
            from encryption import get_encryptor
            encryptor = get_encryptor()
            encrypted_token = encryptor.encrypt(access_token)
            
            # Calculate token expiration
            token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            
            # Check if account already exists
            result = await db.execute(
                select(ConnectedAccount).where(
                    ConnectedAccount.platform == 'threads',
                    ConnectedAccount.username == username
                )
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                # Update existing account
                existing.access_token = encrypted_token
                existing.token_expires_at = token_expires_at
                existing.is_active = True
                existing.last_used_at = datetime.now(timezone.utc)
                logger.info(f"[THREADS OAUTH] Updated existing account: @{username}")
            else:
                # Create new account
                new_account = ConnectedAccount(
                    platform='threads',
                    username=username,
                    access_token=encrypted_token,
                    token_expires_at=token_expires_at,
                    is_active=True
                )
                db.add(new_account)
                logger.info(f"[THREADS OAUTH] Created new account: @{username}")
            
            await db.commit()
            
            # Return success page that closes the popup
            return HTMLResponse(
                content=f"""
                <html>
                    <head>
                        <style>
                            body {{
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                height: 100vh;
                                margin: 0;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                            }}
                            .container {{
                                text-align: center;
                                padding: 2rem;
                                background: rgba(255, 255, 255, 0.1);
                                border-radius: 20px;
                                backdrop-filter: blur(10px);
                            }}
                            .checkmark {{
                                font-size: 64px;
                                margin-bottom: 1rem;
                            }}
                            h2 {{ margin: 0 0 0.5rem 0; }}
                            p {{ margin: 0; opacity: 0.9; }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="checkmark">✓</div>
                            <h2>Connected Successfully!</h2>
                            <p>@{username} is now connected</p>
                            <p style="margin-top: 1rem; font-size: 0.9rem;">This window will close automatically...</p>
                        </div>
                        <script>
                            // Notify parent window
                            if (window.opener) {{
                                window.opener.postMessage({{ type: 'threads_connected', username: '{username}' }}, '*');
                            }}
                            // Close popup after 2 seconds
                            setTimeout(() => window.close(), 2000);
                        </script>
                    </body>
                </html>
                """
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[THREADS OAUTH] Callback error: {str(e)}")
        return HTMLResponse(
            content=f"""
            <html>
                <body>
                    <h2>Connection Failed</h2>
                    <p>Error: {str(e)}</p>
                    <script>
                        setTimeout(() => window.close(), 3000);
                    </script>
                </body>
            </html>
            """,
            status_code=500
        )
