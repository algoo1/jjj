import uvicorn
import os
import sys

# Ensure current directory is in path
sys.path.append(os.getcwd())

try:
    from api.index import app
    print("Application imported successfully.")
except ImportError as e:
    print(f"Failed to import app: {e}")
    sys.exit(1)

if __name__ == "__main__":
    print("Starting server via run_server.py...")
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception as e:
        print(f"Server crashed: {e}")
