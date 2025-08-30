# VS Code Python Import Issues - Troubleshooting Guide

## Problem: VS Code shows import errors for fastapi, ultralytics, numpy, etc.

The issue is that VS Code is not using the correct Python interpreter from the virtual environment.

## ✅ Quick Fix

### Step 1: Select the Correct Python Interpreter
1. Open VS Code in the `hyperstack-algae-bloom` folder
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Python: Select Interpreter"
4. Choose the interpreter at: `./server/.venv/bin/python`

### Step 2: Verify the Setup
Run the verification script:
```bash
cd server
source .venv/bin/activate
python setup_vscode.py
```

You should see all imports marked as ✅ successful.

## 🔧 Alternative Solutions

### Option 1: Reload VS Code Window
1. Press `Ctrl+Shift+P`
2. Type "Developer: Reload Window"
3. Select it to reload VS Code

### Option 2: Restart VS Code
Close and reopen VS Code, making sure to open the `hyperstack-algae-bloom` folder.

### Option 3: Manual Python Path
If the above doesn't work, you can manually set the Python path:
1. Open VS Code settings (`Ctrl+,`)
2. Search for "python.pythonPath"
3. Set it to: `./server/.venv/bin/python`

## 🧪 Verification Commands

### Test imports in terminal:
```bash
cd server
source .venv/bin/activate
python -c "import fastapi, ultralytics, cv2, numpy, uvicorn; print('✅ All imports successful')"
```

### Test the FastAPI server:
```bash
cd server
source .venv/bin/activate
python main.py
```

### Run the setup verification:
```bash
cd server
source .venv/bin/activate
python setup_vscode.py
```

## 📁 File Structure Check

Make sure your project structure looks like this:
```
hyperstack-algae-bloom/
├── .vscode/
│   ├── settings.json     ← VS Code Python settings
│   └── launch.json       ← Debug configurations
└── server/
    ├── .venv/            ← Virtual environment
    ├── main.py           ← FastAPI application
    ├── requirements.txt  ← Dependencies
    ├── setup_vscode.py   ← Verification script
    └── weights/
        └── duckweed-seg.pt
```

## 🐛 Common Issues

### Issue 1: "No module named 'fastapi'"
**Solution:** VS Code is using system Python instead of venv Python.
- Follow Step 1 above to select correct interpreter

### Issue 2: "No module named 'ultralytics'"
**Solution:** Dependencies not installed or wrong Python interpreter.
```bash
cd server
source .venv/bin/activate
pip install -r requirements.txt
```

### Issue 3: Import errors persist after selecting interpreter
**Solution:** Reload VS Code window or restart VS Code completely.

### Issue 4: Virtual environment not found
**Solution:** Recreate the virtual environment:
```bash
cd server
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 🎯 Expected Results

When everything is working correctly:
- ✅ No red underlines on import statements in `main.py`
- ✅ VS Code status bar shows: `Python 3.11.2 ('.venv': venv)`
- ✅ `setup_vscode.py` shows all imports successful
- ✅ FastAPI server starts without errors

## 📞 Still Having Issues?

If you're still experiencing problems:

1. **Check Python version**: Make sure you're using Python 3.11+
2. **Check virtual environment**: Ensure `.venv` folder exists in `server/`
3. **Check dependencies**: Run `pip list` in activated venv to see installed packages
4. **Check VS Code extensions**: Ensure Python extension is installed and enabled
5. **Check workspace**: Make sure VS Code is opened at the `hyperstack-algae-bloom` root folder

## 🚀 Quick Start Commands

Once everything is working:
```bash
# Start the server
cd server
./start_server.sh

# Or manually:
cd server
source .venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will be available at: http://localhost:8000
API documentation at: http://localhost:8000/docs
