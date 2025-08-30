#!/usr/bin/env python3
"""
VS Code Python Interpreter Setup Script
This script helps verify that VS Code is using the correct Python interpreter.
"""

import sys
import os
from pathlib import Path

def main():
    print("🔍 VS Code Python Interpreter Setup")
    print("=" * 50)
    
    # Get current Python executable
    current_python = sys.executable
    print(f"📍 Current Python executable: {current_python}")
    
    # Check if we're in virtual environment
    venv_path = Path(__file__).parent / ".venv"
    expected_python = venv_path / "bin" / "python"
    
    print(f"📁 Expected venv Python: {expected_python}")
    print(f"✅ Virtual environment exists: {venv_path.exists()}")
    print(f"✅ Python executable exists: {expected_python.exists()}")
    
    # Check if current Python is from venv
    if str(expected_python.resolve()) in current_python:
        print("✅ Currently using virtual environment Python!")
    else:
        print("⚠️  NOT using virtual environment Python!")
        print("\n📋 To fix this in VS Code:")
        print("1. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)")
        print("2. Type 'Python: Select Interpreter'")
        print("3. Choose the interpreter at:")
        print(f"   {expected_python}")
    
    print("\n🧪 Testing imports...")
    
    # Test critical imports
    imports_to_test = [
        ("fastapi", "FastAPI web framework"),
        ("ultralytics", "YOLOv8 for segmentation"),
        ("cv2", "OpenCV for image processing"),
        ("numpy", "Numerical computing"),
        ("uvicorn", "ASGI server")
    ]
    
    all_imports_ok = True
    
    for module_name, description in imports_to_test:
        try:
            __import__(module_name)
            print(f"✅ {module_name:12} - {description}")
        except ImportError as e:
            print(f"❌ {module_name:12} - FAILED: {e}")
            all_imports_ok = False
    
    print("\n" + "=" * 50)
    
    if all_imports_ok:
        print("🎉 All imports successful! Your environment is ready.")
        print("🚀 You can now run: python main.py")
    else:
        print("⚠️  Some imports failed. Please check your virtual environment.")
        print("💡 Try running: pip install -r requirements.txt")
    
    print(f"\n📊 Python version: {sys.version}")
    print(f"📦 Installed packages: {len(list(sys.modules))} modules loaded")

if __name__ == "__main__":
    main()
