from playwright.async_api import async_playwright
import asyncio
import random
import os
import json
from pathlib import Path

class ThreadsAutomation:
    def __init__(self):
        self.session_dir = Path("./sessions/threads")
        self.session_dir.mkdir(parents=True, exist_ok=True)
    
    async def post_to_threads(self, username: str, password: str, content: str, media_url: str = None):
        """
        Automate posting to Threads using Playwright
        Returns: True if successful, False otherwise
        """
        print(f"[THREADS_AUTO] Starting automation for user: {username}")
        
        async with async_playwright() as p:
            try:
                # Launch browser
                print("[THREADS_AUTO] Launching browser...")
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-blink-features=AutomationControlled'
                    ]
                )
                
                # Load or create context with session
                context = await self._get_or_create_context(browser, username)
                page = await context.new_page()
                
                # Set viewport
                await page.set_viewport_size({"width": 1280, "height": 720})
                
                # Check if logged in
                print("[THREADS_AUTO] Checking login status...")
                is_logged_in = await self._check_login_status(page)
                
                if not is_logged_in:
                    print("[THREADS_AUTO] Not logged in, performing login...")
                    await self._login(page, username, password)
                    # Save session
                    await self._save_session(context, username)
                    print("[THREADS_AUTO] Login successful, session saved")
                else:
                    print("[THREADS_AUTO] Already logged in (using saved session)")
                
                # Navigate to compose
                print("[THREADS_AUTO] Navigating to compose...")
                await self._navigate_to_compose(page)
                
                # Create post
                print("[THREADS_AUTO] Creating post...")
                await self._create_post(page, content, media_url)
                
                # Verify success
                print("[THREADS_AUTO] Verifying post success...")
                success = await self._verify_post_success(page)
                
                if success:
                    print("[THREADS_AUTO] ✓ Post successful!")
                else:
                    print("[THREADS_AUTO] ✗ Post verification failed")
                
                await browser.close()
                return success
                
            except Exception as e:
                print(f"[THREADS_AUTO] ✗ Error: {e}")
                import traceback
                traceback.print_exc()
                try:
                    await browser.close()
                except:
                    pass
                return False
    
    async def _get_or_create_context(self, browser, username):
        """Load saved session or create new context"""
        session_file = self.session_dir / f"{username}_session.json"
        
        if session_file.exists():
            try:
                # Load saved session
                with open(session_file, 'r') as f:
                    session_data = json.load(f)
                context = await browser.new_context(storage_state=session_data)
                print(f"[THREADS_AUTO] Loaded saved session for {username}")
            except Exception as e:
                print(f"[THREADS_AUTO] Failed to load session: {e}, creating new")
                context = await browser.new_context()
        else:
            print(f"[THREADS_AUTO] No saved session, creating new context")
            context = await browser.new_context()
        
        return context
    
    async def _save_session(self, context, username):
        """Save browser session for reuse"""
        try:
            session_file = self.session_dir / f"{username}_session.json"
            session_data = await context.storage_state()
            with open(session_file, 'w') as f:
                json.dump(session_data, f)
            print(f"[THREADS_AUTO] Session saved to {session_file}")
        except Exception as e:
            print(f"[THREADS_AUTO] Failed to save session: {e}")
    
    async def _check_login_status(self, page):
        """Check if already logged in"""
        try:
            await page.goto('https://www.threads.net', wait_until='networkidle', timeout=30000)
            await asyncio.sleep(random.uniform(2, 3))
            
            # Check for compose button or new post button (indicates logged in)
            # Threads uses different selectors, try multiple
            selectors = [
                'button[aria-label*="Create"]',
                'button[aria-label*="New"]',
                'a[href="/"]',  # Home link when logged in
                'svg[aria-label="Home"]'
            ]
            
            for selector in selectors:
                element = await page.query_selector(selector)
                if element:
                    print(f"[THREADS_AUTO] Found logged-in indicator: {selector}")
                    return True
            
            # Check URL - if redirected to login, not logged in
            current_url = page.url
            if 'login' in current_url.lower():
                return False
            
            # Default to logged in if we're on threads.net and not redirected
            return 'threads.net' in current_url and 'login' not in current_url.lower()
            
        except Exception as e:
            print(f"[THREADS_AUTO] Error checking login status: {e}")
            return False
    
    async def _login(self, page, username, password):
        """Perform login to Threads"""
        try:
            # Navigate to Threads login
            await page.goto('https://www.threads.net/login', wait_until='networkidle', timeout=30000)
            await asyncio.sleep(random.uniform(2, 4))
            
            # Threads login uses Instagram credentials
            # Try to find username input
            username_selectors = [
                'input[name="username"]',
                'input[type="text"]',
                'input[placeholder*="username"]',
                'input[placeholder*="Username"]'
            ]
            
            username_input = None
            for selector in username_selectors:
                username_input = await page.query_selector(selector)
                if username_input:
                    break
            
            if not username_input:
                raise Exception("Could not find username input field")
            
            # Fill username with human-like typing
            await username_input.click()
            await asyncio.sleep(random.uniform(0.3, 0.7))
            await username_input.type(username, delay=random.randint(50, 150))
            await asyncio.sleep(random.uniform(0.5, 1.5))
            
            # Find password input
            password_selectors = [
                'input[name="password"]',
                'input[type="password"]'
            ]
            
            password_input = None
            for selector in password_selectors:
                password_input = await page.query_selector(selector)
                if password_input:
                    break
            
            if not password_input:
                raise Exception("Could not find password input field")
            
            # Fill password
            await password_input.click()
            await asyncio.sleep(random.uniform(0.3, 0.7))
            await password_input.type(password, delay=random.randint(50, 150))
            await asyncio.sleep(random.uniform(0.5, 1.5))
            
            # Click login button
            login_button_selectors = [
                'button[type="submit"]',
                'button:has-text("Log in")',
                'button:has-text("Log In")',
                'div[role="button"]:has-text("Log in")'
            ]
            
            for selector in login_button_selectors:
                try:
                    await page.click(selector, timeout=5000)
                    break
                except:
                    continue
            
            # Wait for navigation after login
            await asyncio.sleep(random.uniform(4, 6))
            
            # Check if login was successful
            current_url = page.url
            if 'login' in current_url.lower():
                # Still on login page - might be 2FA or error
                print("[THREADS_AUTO] Warning: Still on login page after submit")
                # Take screenshot for debugging
                await page.screenshot(path='login_debug.png')
            
        except Exception as e:
            print(f"[THREADS_AUTO] Login error: {e}")
            raise
    
    async def _navigate_to_compose(self, page):
        """Navigate to compose/new post page"""
        try:
            # Look for compose button
            compose_selectors = [
                'button[aria-label*="Create"]',
                'button[aria-label*="New"]',
                'a[href*="new"]',
                'svg[aria-label*="Create"]'
            ]
            
            for selector in compose_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        await element.click()
                        await asyncio.sleep(random.uniform(1, 2))
                        return
                except:
                    continue
            
            # If no compose button found, try navigating directly
            await page.goto('https://www.threads.net/new', wait_until='networkidle', timeout=30000)
            await asyncio.sleep(random.uniform(1, 2))
            
        except Exception as e:
            print(f"[THREADS_AUTO] Error navigating to compose: {e}")
            raise
    
    async def _create_post(self, page, content, media_url):
        """Create and submit post"""
        try:
            # Find text input area
            # Threads uses contenteditable div
            textarea_selectors = [
                '[contenteditable="true"]',
                'textarea',
                '[role="textbox"]',
                'div[data-contents="true"]'
            ]
            
            textarea = None
            for selector in textarea_selectors:
                textarea = await page.query_selector(selector)
                if textarea:
                    print(f"[THREADS_AUTO] Found textarea: {selector}")
                    break
            
            if not textarea:
                raise Exception("Could not find text input area")
            
            # Click and type content
            await textarea.click()
            await asyncio.sleep(random.uniform(0.5, 1))
            await textarea.type(content, delay=random.randint(50, 150))
            await asyncio.sleep(random.uniform(1, 2))
            
            # Handle media upload if provided
            if media_url:
                print(f"[THREADS_AUTO] Media upload not yet implemented: {media_url}")
                # TODO: Implement media upload
            
            # Find and click post button
            post_button_selectors = [
                'button:has-text("Post")',
                'div[role="button"]:has-text("Post")',
                'button[type="submit"]',
                'button:has-text("Share")'
            ]
            
            for selector in post_button_selectors:
                try:
                    await page.click(selector, timeout=5000)
                    print(f"[THREADS_AUTO] Clicked post button: {selector}")
                    break
                except:
                    continue
            
            # Wait for post to complete
            await asyncio.sleep(random.uniform(3, 5))
            
        except Exception as e:
            print(f"[THREADS_AUTO] Error creating post: {e}")
            raise
    
    async def _verify_post_success(self, page):
        """Verify post was successful"""
        try:
            # Check current URL - successful post usually redirects
            current_url = page.url
            
            # Look for success indicators
            # - URL changed from /new
            # - Success message
            # - Back on home/profile
            
            if '/new' not in current_url:
                print(f"[THREADS_AUTO] URL changed to: {current_url} (likely success)")
                return True
            
            # Look for success message or toast
            success_selectors = [
                'text="Posted"',
                'text="Your thread was posted"',
                '[role="alert"]'
            ]
            
            for selector in success_selectors:
                element = await page.query_selector(selector)
                if element:
                    print(f"[THREADS_AUTO] Found success indicator: {selector}")
                    return True
            
            # If still on compose page, might have failed
            if '/new' in current_url or 'create' in current_url.lower():
                print("[THREADS_AUTO] Still on compose page - might have failed")
                return False
            
            # Default to success if we're not on compose page anymore
            return True
            
        except Exception as e:
            print(f"[THREADS_AUTO] Error verifying post: {e}")
            return False
