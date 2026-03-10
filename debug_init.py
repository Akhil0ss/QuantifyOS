import traceback

try:
    from app.core.tool_engine import init_tools
    init_tools()
    print("SUCCESS")
except Exception as e:
    print("FAILED")
    traceback.print_exc()
