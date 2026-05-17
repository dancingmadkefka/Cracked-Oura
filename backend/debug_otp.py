import asyncio
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(backend_dir, "src")
sys.path.insert(0, src_dir)
os.chdir(backend_dir)

import importlib.util
spec = importlib.util.spec_from_file_location("backend.src.paths", os.path.join(src_dir, "paths.py"))
paths_mod = importlib.util.module_from_spec(spec)
sys.modules["backend.src.paths"] = paths_mod
sys.modules["backend"] = type(sys)("backend")
sys.modules["backend.src"] = type(sys)("backend.src")
spec.loader.exec_module(paths_mod)

spec2 = importlib.util.spec_from_file_location("backend.src.config", os.path.join(src_dir, "config.py"))
config_mod = importlib.util.module_from_spec(spec2)
sys.modules["backend.src.config"] = config_mod
spec2.loader.exec_module(config_mod)
config_manager = config_mod.config_manager

from playwright.async_api import async_playwright

async def main():
    email = "henderson.daniel10@yahoo.com"
    otp_code = "175598"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Go to login
            await page.goto("https://membership.ouraring.com/login", timeout=30000)
            await page.wait_for_timeout(2000)
            
            # Fill email
            await page.locator("input[name='username']").fill(email)
            await page.dispatch_event("input[name='username']", 'input')
            
            # Click submit
            submit = page.locator("button[type='submit']")
            if await submit.is_visible():
                await submit.click()
            else:
                await page.keyboard.press("Enter")
            
            await page.wait_for_timeout(3000)
            
            # Check for send code button
            send_code = page.locator("button[name='selectedId']")
            otp_input = page.locator("input[name='otp']")
            
            if await send_code.is_visible() and not await otp_input.is_visible():
                print("Clicking Send code button...")
                await send_code.click()
                await page.wait_for_timeout(3000)
            
            # Fill OTP
            otp_input = page.locator("input[name='otp']")
            if await otp_input.is_visible():
                print("OTP input visible. Filling code...")
                await otp_input.fill(otp_code)
                await otp_input.dispatch_event('input')
                await page.wait_for_timeout(500)
                
                # Try to find submit button
                for sel in ["button[type='submit']", "#submit-button", "button:has-text('Verify')", "button:has-text('Continue')", "button:has-text('Submit')", "button:has-text('Sign in')", "button:has-text('Log in')"]:
                    btn = page.locator(sel).first
                    try:
                        if await btn.is_visible(timeout=500):
                            print(f"Found submit button: {sel}")
                            await btn.click()
                            break
                    except:
                        continue
                else:
                    print("No submit button found, pressing Enter")
                    await page.keyboard.press("Enter")
                
                await page.wait_for_timeout(3000)
                
                # Take screenshot
                screenshot_path = os.path.join(backend_dir, "otp_debug.png")
                await page.screenshot(path=screenshot_path, full_page=True)
                print(f"Screenshot saved to {screenshot_path}")
                
                # Get page content
                content = await page.content()
                with open(os.path.join(backend_dir, "otp_debug.html"), "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"HTML saved. URL: {page.url}")
                
                # Check for errors
                for err in ["Virheellinen koodi", "Invalid code", "incorrect code", "wrong code", "error", "failed"]:
                    try:
                        el = page.get_by_text(err, exact=False).first
                        if await el.is_visible(timeout=500):
                            text = await el.text_content()
                            print(f"Error text found: {text}")
                    except:
                        pass
                
                # Check if logged in
                url = page.url.lower()
                if "membership.ouraring.com" in url and "login" not in url and "authn" not in url:
                    print("SUCCESS: Logged in!")
                    await context.storage_state(path=os.path.join(paths_mod.get_user_data_dir(), "oura_session.json"))
                    config_manager.update_config(logged_in=True)
                    config_manager.update_status("Idle", message="Login restored.")
                else:
                    print(f"Not detected as logged in. URL: {page.url}")
            else:
                print("OTP input not found")
                screenshot_path = os.path.join(backend_dir, "otp_debug.png")
                await page.screenshot(path=screenshot_path, full_page=True)
                print(f"Screenshot saved to {screenshot_path}")
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
