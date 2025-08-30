#!/usr/bin/env python3
"""
Test script to verify all required imports work correctly
"""

def test_imports():
    try:
        print("Testing imports...")
        
        # Test basic imports
        import cv2
        print("✅ OpenCV imported successfully")
        
        import numpy as np
        print("✅ NumPy imported successfully")
        
        import fastapi
        print("✅ FastAPI imported successfully")
        
        import uvicorn
        print("✅ Uvicorn imported successfully")
        
        # Test ultralytics (YOLO)
        from ultralytics import YOLO
        print("✅ Ultralytics YOLO imported successfully")
        
        # Test versions
        print(f"\nVersions:")
        print(f"OpenCV: {cv2.__version__}")
        print(f"NumPy: {np.__version__}")
        print(f"FastAPI: {fastapi.__version__}")
        
        print("\n🎉 All imports successful! Server dependencies are ready.")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    test_imports()
