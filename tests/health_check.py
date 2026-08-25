import json
import os
import sys
import urllib.request
import urllib.error

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

def check_frontend() -> bool:
    print(f"Checking Frontend at {FRONTEND_URL}...")
    try:
        req = urllib.request.Request(
            FRONTEND_URL,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            code = response.getcode()
            if code == 200:
                print("✅ Frontend is AVAILABLE.")
                return True
            else:
                print(f"❌ Frontend returned status code {code}.")
                return False
    except Exception as e:
        print(f"❌ Frontend is UNAVAILABLE: {e}")
        return False

def check_backend() -> bool:
    health_url = f"{BACKEND_URL}/health"
    print(f"Checking Backend at {health_url}...")
    try:
        with urllib.request.urlopen(health_url, timeout=5) as response:
            code = response.getcode()
            if code != 200:
                print(f"❌ Backend returned status code {code}.")
                return False
            
            data = json.loads(response.read().decode('utf-8'))
            print("✅ Backend is AVAILABLE.")
            
            # Check inner services
            ai_ready = data.get("ai_engine_ready", False)
            routing_ready = data.get("routing_engine_ready", False)
            db_connected = data.get("database_connected", False)
            
            status = True
            if ai_ready:
                print("✅ AI Engine is READY.")
            else:
                print("❌ AI Engine is NOT READY.")
                status = False
                
            if routing_ready:
                print("✅ Routing Engine is READY.")
            else:
                print("❌ Routing Engine is NOT READY.")
                status = False
                
            if db_connected:
                print("✅ Database connection is OK.")
            else:
                print("❌ Database connection FAILED.")
                status = False
                
            return status
            
    except urllib.error.URLError as e:
        print(f"❌ Backend is UNAVAILABLE (URL Error): {e}")
        return False
    except Exception as e:
        print(f"❌ Backend check encountered an error: {e}")
        return False

if __name__ == "__main__":
    print("=== Running NER-SHIELD System Health Check ===")
    frontend_ok = check_frontend()
    backend_ok = check_backend()
    
    print("============================================")
    if frontend_ok and backend_ok:
        print("🎉 ALL SYSTEMS FUNCTIONAL.")
        sys.exit(0)
    else:
        print("⚠️ HEALTH CHECK FAILED. One or more systems are down.")
        sys.exit(1)
