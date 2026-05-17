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

spec3 = importlib.util.spec_from_file_location("backend.src.automation", os.path.join(src_dir, "automation.py"))
automation_mod = importlib.util.module_from_spec(spec3)
sys.modules["backend.src.automation"] = automation_mod
spec3.loader.exec_module(automation_mod)
OuraAutomator = automation_mod.OuraAutomator

async def main():
    cfg = config_manager.get_config()
    email = cfg.get("email", "")
    otp_code = "175598"
    
    if not email:
        print("No email configured in settings.")
        return
    
    print(f"Using email: {email}")
    print(f"Submitting OTP: {otp_code}")
    
    automator = OuraAutomator()
    automator.email = email
    
    try:
        await automator.initialize(headless=False)
        
        # Perform login actions (fill email, submit)
        res = await automator.login()
        
        if res and res.get("status") == "otp_required":
            print("OTP screen detected. Submitting code...")
            
            # Monkey-patch to debug: take screenshot after OTP fill
            original_submit_otp = automator.submit_otp
            async def debug_submit_otp(otp):
                print(f"[DEBUG] Inside submit_otp with {otp}")
                if not automator.page:
                    return {"status": "error", "message": "Page not initialized"}
                
                otp_selectors = [
                    "input[name='otp']",
                    "#otp-code",
                    "input[name='verification_code']",
                    "input[autocomplete='one-time-code']",
                    "input[inputmode='numeric']",
                ]
                
                target_frame = None
                otp_selector = None
                
                for frame in automator.page.frames:
                    for selector in otp_selectors:
                        locator = frame.locator(selector).first
                        try:
                            if await locator.is_visible(timeout=800):
                                target_frame = frame
                                otp_selector = selector
                                break
                        except Exception:
                            continue
                    if otp_selector:
                        break
                
                if not target_frame or not otp_selector:
                    return {"status": "error", "message": "Could not find OTP input field"}
                
                await target_frame.fill(otp_selector, otp)
                await target_frame.dispatch_event(otp_selector, 'input')
                
                submitted = False
                submit_selectors = [
                    "button[type='submit']",
                    "#submit-button",
                    "button:has-text('Verify')",
                    "button:has-text('Continue')",
                    "button:has-text('Submit')",
                    "button:has-text('Sign in')",
                    "button:has-text('Log in')",
                ]
                for selector in submit_selectors:
                    btn = target_frame.locator(selector).first
                    try:
                        if await btn.is_visible(timeout=500):
                            print(f"[DEBUG] Clicking submit: {selector}")
                            await btn.click()
                            submitted = True
                            break
                    except Exception:
                        continue
                
                if not submitted:
                    print("[DEBUG] No submit button found, pressing Enter")
                    await automator.page.keyboard.press("Enter")
                
                await automator.page.wait_for_timeout(3000)
                await automator.page.wait_for_load_state("networkidle")
                
                # DEBUG: screenshot and HTML
                screenshot_path = os.path.join(backend_dir, "otp_debug.png")
                await automator.page.screenshot(path=screenshot_path, full_page=True)
                print(f"[DEBUG] Screenshot saved to {screenshot_path}")
                
                html = await automator.page.content()
                html_path = os.path.join(backend_dir, "otp_debug.html")
                with open(html_path, "w", encoding="utf-8") as f:
                    f.write(html)
                print(f"[DEBUG] HTML saved to {html_path}")
                print(f"[DEBUG] Current URL: {automator.page.url}")
                
                # Check page title
                title = await automator.page.title()
                print(f"[DEBUG] Page title: {title}")
                
                # Check for any visible text that might indicate state
                body_text = await automator.page.locator("body").text_content()
                print(f"[DEBUG] Body text snippet: {body_text[:500] if body_text else 'None'}")
                
                # Now check logged in
                if automator._is_logged_in():
                    print("[DEBUG] _is_logged_in returned True")
                    await automator.save_context()
                    automator._login_in_progress = False
                    config_manager.update_config(logged_in=True)
                    return {"status": "success", "message": "Login successful!"}
                
                print("[DEBUG] _is_logged_in returned False")
                
                # Check for invalid code
                invalid_code = False
                for err_text in ["Virheellinen koodi", "Invalid code", "incorrect code", "wrong code"]:
                    try:
                        if await automator.page.get_by_text(err_text).first.is_visible(timeout=500):
                            invalid_code = True
                            break
                    except Exception:
                        continue
                
                if invalid_code:
                    return {"status": "error", "message": "Invalid OTP code."}
                
                return {"status": "error", "message": f"Login failed (Unknown state). Current URL: {automator.page.url}"}
            
            otp_res = await debug_submit_otp(otp_code)
            print(f"OTP result: {otp_res}")
            
            if otp_res.get("status") == "success":
                print("Login successful! Session saved.")
            else:
                print(f"OTP failed: {otp_res.get('message')}")
        elif res is None:
            print("Already logged in (no OTP needed).")
            config_manager.update_config(logged_in=True)
            config_manager.update_status("Idle", message="Session verified.")
        else:
            print(f"Unexpected result: {res}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await automator.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
