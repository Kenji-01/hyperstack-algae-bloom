# CLINE: Full Camera Segmentation + Auto Valve System

A complete Raspberry Pi-friendly system for duckweed coverage monitoring with automatic valve control.

## 🎯 Features

- **Real-time Camera Segmentation**: HSV-based green coverage detection with optional YOLO support
- **Automatic Valve Control**: GPIO relay control that auto-closes valve when coverage exceeds threshold
- **Manual Override**: Web interface for manual valve control
- **Raspberry Pi Optimized**: Lightweight dependencies, GPIO support, network accessible
- **Dual Mode**: HSV fallback (always works) + optional YOLO (if weights available)
- **Live Dashboard**: Real-time coverage monitoring with visual feedback

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   Hardware      │
│   (React/Vite)  │◄──►│   (FastAPI)      │◄──►│  GPIO Relay     │
│                 │    │                  │    │  Camera         │
│ - Camera UI     │    │ - HSV Analysis   │    │  Valve          │
│ - Valve Control │    │ - YOLO (opt)     │    │                 │
│ - Dashboard     │    │ - Auto Control   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
cd hyperstack-algae-bloom
chmod +x start_system.sh
./start_system.sh
```

### Option 2: Manual Setup

#### Backend Setup
```bash
# Create virtual environment
python3 -m venv server/.venv
source server/.venv/bin/activate

# Install dependencies
pip install -r server/requirements.txt

# Start backend
cd server
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev -- --host
```

## ⚙️ Configuration

### Environment Variables (Backend)
Set these before starting the backend:

```bash
export DUCKWEED_CLOSE_THRESHOLD=50    # Coverage % to auto-close valve
export VALVE_RELAY_PIN=17             # GPIO pin (BCM numbering)
export VALVE_ACTIVE_LOW=1             # 1 for active-low relay, 0 for active-high
```

### Frontend Environment
File: `.env.local`
```
VITE_BACKEND_URL=http://127.0.0.1:8000
```

## 🔧 Hardware Setup

### GPIO Relay Connection (Raspberry Pi)
```
Pi GPIO 17 ──► Relay IN
Pi 5V      ──► Relay VCC
Pi GND     ──► Relay GND

Relay NO/NC ──► Valve Control Wires
```

### Camera
- USB webcam or Pi Camera
- Accessible via browser's `getUserMedia()` API

## 📡 API Endpoints

### Backend (Port 8000)
- `GET /status` - System status and configuration
- `POST /analyze` - Analyze uploaded image for coverage
- `POST /valve/open` - Manually open valve
- `POST /valve/close` - Manually close valve
- `GET /docs` - Interactive API documentation

### Frontend (Port 5173)
- Dashboard with live camera feed
- Real-time coverage monitoring
- Manual valve controls
- System health indicators

## 🧪 Testing

### Backend API Tests
```bash
# Check system status
curl -s http://127.0.0.1:8000/status

# Manual valve control
curl -X POST http://127.0.0.1:8000/valve/open
curl -X POST http://127.0.0.1:8000/valve/close

# Test image analysis (requires image file)
curl -X POST -F "image=@test_image.jpg" http://127.0.0.1:8000/analyze
```

### Frontend Testing
1. Open browser to Vite's Network URL (e.g., `http://192.168.1.100:5173`)
2. Navigate to Dashboard
3. Click "Start" in Duckweed Coverage card
4. Allow camera access
5. Observe real-time coverage percentage
6. Test manual valve controls

## 🔍 Segmentation Modes

### HSV Mode (Default)
- **Always Available**: No additional dependencies
- **Method**: HSV color space filtering for green detection
- **Tunable**: Adjust HSV ranges in `server/main.py`
- **Performance**: Fast, lightweight

### YOLO Mode (Optional)
- **Requirements**: 
  - `pip install ultralytics`
  - Place weights at `server/weights/duckweed-seg.pt`
- **Method**: Deep learning segmentation
- **Performance**: More accurate but resource intensive

## 🎛️ Dashboard Features

### Real-time Monitoring
- Live camera feed
- Coverage percentage with color coding
- Current threshold display
- Valve status indicator

### Manual Controls
- Start/Stop camera analysis
- Open/Close valve buttons
- Visual feedback for all actions

### System Integration
- Updates main dashboard metrics
- Integrates with existing Zustand store
- Maintains system health indicators

## 🐛 Troubleshooting

### Backend Issues
```bash
# Check if backend is running
curl http://127.0.0.1:8000/status

# Check logs
# (Backend logs appear in terminal where uvicorn was started)

# GPIO issues on Pi
sudo apt update
sudo apt install python3-gpiozero python3-lgpio
```

### Frontend Issues
```bash
# Check if frontend is accessible
# Look for "Network:" URL in Vite output

# Camera access issues
# - Ensure HTTPS or localhost
# - Check browser permissions
# - Try different browsers
```

### Common Issues
1. **Camera not working**: Check browser permissions and HTTPS requirements
2. **GPIO errors**: Ensure running on Pi with proper GPIO libraries
3. **CORS errors**: Backend CORS is configured for development
4. **Network access**: Use Network URL from Vite, not localhost

## 📊 System Behavior

### Automatic Valve Control
1. Camera captures frame every 1.5 seconds
2. Backend analyzes coverage percentage
3. If coverage ≥ threshold: valve closes automatically
4. If coverage < threshold: valve remains open
5. Manual override always available

### Coverage Calculation
- **HSV Mode**: Percentage of pixels in green HSV range
- **YOLO Mode**: Percentage of pixels in segmentation mask
- **Smoothing**: Frontend applies 70/30 smoothing for stable display

## 🔒 Security Notes

- **Development Mode**: CORS allows all origins
- **Production**: Tighten CORS settings in `server/main.py`
- **GPIO Access**: May require sudo on some Pi configurations
- **Network**: Backend binds to 0.0.0.0 for LAN access

## 📈 Performance

### Resource Usage
- **Backend**: ~50-100MB RAM (HSV mode)
- **Frontend**: Standard React/Vite requirements
- **Analysis**: ~1.5 second intervals (configurable)

### Optimization Tips
- Use HSV mode for lower resource usage
- Adjust analysis interval in `DuckweedSegClient.tsx`
- Consider image resolution for Pi performance

## 🔄 Updates and Maintenance

### Adding YOLO Support
1. Install ultralytics: `pip install ultralytics`
2. Place trained weights at `server/weights/duckweed-seg.pt`
3. Restart backend - will auto-detect and switch to YOLO mode

### Threshold Adjustment
- Set `DUCKWEED_CLOSE_THRESHOLD` environment variable
- Restart backend to apply changes
- Value represents coverage percentage (0-100)

### GPIO Pin Changes
- Set `VALVE_RELAY_PIN` environment variable (BCM numbering)
- Set `VALVE_ACTIVE_LOW` for relay type
- Restart backend to apply changes

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Verify hardware connections
3. Check browser console for frontend errors
4. Check backend terminal for API errors
