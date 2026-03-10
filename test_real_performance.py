
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.tools.market_reporter import run

async def execute_real_test():
    print("🚀 SOVEREIGN OS: REAL PERFORMANCE TEST INITIATED")
    print("Task: XAUUSD Market Analysis PDF & Cinematic MP4")
    
    workspace_id = "demo_workspace"
    
    # Run the real tool (acting as the current AI provider using gathered data)
    result = await run(workspace_id=workspace_id)
    
    print("\n📊 TEST RESULTS:")
    print(f"Status: {result.get('status')}")
    print(f"PDF Generated: {result.get('pdf_path')}")
    print(f"Video Generated: {result.get('video_path')}")
    print(f"Intelligence Summary: {result.get('message')}")
    
    # Verify files exist on disk
    if os.path.exists(result.get("pdf_path")) and os.path.exists(result.get("video_path")):
        print("\n✅ VERIFICATION SUCCESS: All high-fidelity artifacts produced.")
    else:
        print("\n❌ VERIFICATION FAILURE: Some artifacts missing.")

if __name__ == "__main__":
    asyncio.run(execute_real_test())
