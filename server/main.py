from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import json
from datetime import datetime

# Try optional YOLO (works only if installed + weights present)
try:
    from ultralytics import YOLO
except Exception:
    YOLO = None

# Try GPIO relay (works on Pi if installed)
try:
    from gpiozero import OutputDevice
    GPIO_AVAILABLE = True
except Exception:
    GPIO_AVAILABLE = False
    # Create a dummy class for type annotation when GPIO is not available
    class OutputDevice:
        pass

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("duckweed")

app = FastAPI(title="Duckweed Segmentation API", version="1.3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Config (via ENV) ---
RELAY_PIN = int(os.getenv("VALVE_RELAY_PIN", "17"))               # BCM numbering
RELAY_ACTIVE_LOW = os.getenv("VALVE_ACTIVE_LOW", "1") == "1"      # most relay boards are active-low
THRESHOLD = float(os.getenv("DUCKWEED_CLOSE_THRESHOLD", "50"))    # % coverage to close valve
PH_RELAY_PIN = int(os.getenv("PH_RELAY_PIN", "18"))              # BCM numbering for pH control
PH_THRESHOLD_LOW = float(os.getenv("PH_THRESHOLD_LOW", "30"))     # % coverage to activate pH adjustment
PH_THRESHOLD_HIGH = float(os.getenv("PH_THRESHOLD_HIGH", "70"))   # % coverage to deactivate pH adjustment
WEIGHTS = Path(__file__).parent / "weights" / "duckweed-seg.pt"   # YOLO weights (optional)

# --- GPIO devices ---
_valve: Optional[OutputDevice] = None
_ph_relay: Optional[OutputDevice] = None

if GPIO_AVAILABLE:
    try:
        # active_high=False means .on() energizes the relay for active-low modules
        _valve = OutputDevice(RELAY_PIN, active_high=not RELAY_ACTIVE_LOW, initial_value=False)
        log.info(f"Valve relay ready on BCM{RELAY_PIN} (active_low={RELAY_ACTIVE_LOW})")
        
        # Initialize pH control relay
        _ph_relay = OutputDevice(PH_RELAY_PIN, active_high=not RELAY_ACTIVE_LOW, initial_value=False)
        log.info(f"pH relay ready on BCM{PH_RELAY_PIN} (active_low={RELAY_ACTIVE_LOW})")
    except Exception as e:
        log.warning(f"GPIO init failed: {e}")
        _valve = None
        _ph_relay = None
else:
    log.warning("GPIO not available (running off Pi or library not installed).")

def set_valve_closed(closed: bool) -> bool:
    """True=close valve (energize relay); False=open valve."""
    if _valve is None:
        return False
    if closed:
        _valve.on()
    else:
        _valve.off()
    return True

def get_valve_closed() -> Optional[bool]:
    if _valve is None:
        return None
    return bool(_valve.value)

def set_ph_adjustment_active(active: bool) -> bool:
    """True=activate pH adjustment (energize relay); False=deactivate pH adjustment."""
    if _ph_relay is None:
        return False
    if active:
        _ph_relay.on()
    else:
        _ph_relay.off()
    return True

def get_ph_adjustment_active() -> Optional[bool]:
    if _ph_relay is None:
        return None
    return bool(_ph_relay.value)

def determine_ph_control(coverage_pct: float, ph_sensor_value: float = None) -> bool:
    """
    Determine if pH adjustment should be active based on duckweed coverage and pH sensor.
    Priority: pH sensor reading > duckweed coverage thresholds
    """
    # If pH sensor is available and provides a reading, use it for control
    if ph_sensor_value is not None:
        # Optimal pH range for duckweed is typically 6.5-7.5
        target_ph_min = float(os.getenv("TARGET_PH_MIN", "6.5"))
        target_ph_max = float(os.getenv("TARGET_PH_MAX", "7.5"))
        
        if ph_sensor_value < target_ph_min or ph_sensor_value > target_ph_max:
            return True  # pH out of range, activate adjustment
        else:
            return False  # pH in optimal range, deactivate adjustment
    
    # Fallback to duckweed coverage-based control when no pH sensor
    if coverage_pct <= PH_THRESHOLD_LOW:
        return True  # Low coverage, activate pH adjustment
    elif coverage_pct >= PH_THRESHOLD_HIGH:
        return False  # High coverage, deactivate pH adjustment
    else:
        # In between thresholds, maintain current state to avoid oscillation
        current_state = get_ph_adjustment_active()
        return current_state if current_state is not None else False

def read_ph_sensor() -> float:
    """
    Read pH value from sensor. This is a placeholder for future sensor integration.
    Returns None if no sensor is connected or reading fails.
    """
    # TODO: Implement actual pH sensor reading
    # Example implementations:
    # - ADC reading from analog pH sensor
    # - I2C communication with digital pH sensor
    # - Serial communication with pH probe
    
    # For now, return None to indicate no sensor available
    return None

# --- YOLO lazy loader ---
_model = None
def ensure_model():
    global _model
    if _model is not None:
        return _model
    if YOLO is None or not WEIGHTS.exists():
        return None
    _model = YOLO(WEIGHTS.as_posix())
    log.info(f"Loaded YOLO weights: {WEIGHTS.name}")
    return _model

# --- HSV fallback segmentation (% green coverage) ---
def hsv_coverage(img_bgr: np.ndarray) -> float:
    H, W = img_bgr.shape[:2]
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    low  = np.array([35, 40, 40], dtype=np.uint8)    # tune to your lighting/bucket
    high = np.array([85,255,255], dtype=np.uint8)
    mask = cv2.inRange(hsv, low, high)
    k = np.ones((5,5), np.uint8)                     # denoise a bit more
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k)
    return 100.0 * (cv2.countNonZero(mask) / float(H * W))

@app.get("/status")
def status():
    mode = "yolo" if (YOLO is not None and WEIGHTS.exists()) else "hsv"
    return {
        "ok": True,
        "mode": mode,
        "threshold": THRESHOLD,
        "ph_threshold_low": PH_THRESHOLD_LOW,
        "ph_threshold_high": PH_THRESHOLD_HIGH,
        "weights_present": WEIGHTS.exists(),
        "weights_path": WEIGHTS.as_posix(),
        "gpio_available": GPIO_AVAILABLE,
        "valve_closed": get_valve_closed(),
        "ph_adjustment_active": get_ph_adjustment_active(),
    }

@app.post("/analyze")
async def analyze(image: UploadFile = File(...)):
    data = np.frombuffer(await image.read(), np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Bad image")

    model = ensure_model()
    if model is None:
        pct = hsv_coverage(img)
        should_close = pct >= THRESHOLD
        valve_applied = set_valve_closed(should_close)
        
        # pH control based on duckweed coverage and pH sensor (if available)
        ph_sensor_reading = read_ph_sensor()
        should_ph_active = determine_ph_control(pct, ph_sensor_reading)
        ph_applied = set_ph_adjustment_active(should_ph_active)
        
        log.info(f"HSV Analysis: {pct:.1f}% coverage, valve={'closed' if should_close else 'open'}, pH={'active' if should_ph_active else 'inactive'}")
        
        return {
            "coverage_pct": float(round(pct, 2)),
            "mode": "hsv",
            "threshold": THRESHOLD,
            "valve_closed": should_close,
            "gpio_applied": valve_applied,
            "ph_adjustment_active": should_ph_active,
            "ph_gpio_applied": ph_applied,
            "ph_threshold_low": PH_THRESHOLD_LOW,
            "ph_threshold_high": PH_THRESHOLD_HIGH
        }

    # YOLO segmentation path
    H, W = img.shape[:2]
    res = model.predict(img, imgsz=640, conf=0.15, iou=0.4, device="cpu", verbose=False)[0]
    mask_total = np.zeros((H, W), dtype=np.uint8)
    if getattr(res, "masks", None) is not None:
        for m in res.masks.data:
            m = m.cpu().numpy()
            m = cv2.resize(m, (W, H), interpolation=cv2.INTER_NEAREST)
            mask_total |= (m > 0.5).astype(np.uint8)
    pct = 100.0 * (mask_total.sum() / float(H * W))
    should_close = pct >= THRESHOLD
    valve_applied = set_valve_closed(should_close)
    
    # pH control based on duckweed coverage and pH sensor (if available)
    ph_sensor_reading = read_ph_sensor()
    should_ph_active = determine_ph_control(pct, ph_sensor_reading)
    ph_applied = set_ph_adjustment_active(should_ph_active)
    
    log.info(f"YOLO Analysis: {pct:.1f}% coverage, valve={'closed' if should_close else 'open'}, pH={'active' if should_ph_active else 'inactive'}")
    
    return {
        "coverage_pct": float(round(pct, 2)),
        "mode": "yolo",
        "threshold": THRESHOLD,
        "valve_closed": should_close,
        "gpio_applied": valve_applied,
        "ph_adjustment_active": should_ph_active,
        "ph_gpio_applied": ph_applied,
        "ph_threshold_low": PH_THRESHOLD_LOW,
        "ph_threshold_high": PH_THRESHOLD_HIGH
    }

@app.post("/valve/close")
def valve_close():
    ok = set_valve_closed(True)
    return {"valve_closed": True, "gpio_applied": ok}

@app.post("/valve/open")
def valve_open():
    ok = set_valve_closed(False)
    return {"valve_closed": False, "gpio_applied": ok}

@app.post("/ph/activate")
def ph_activate():
    ok = set_ph_adjustment_active(True)
    return {"ph_adjustment_active": True, "gpio_applied": ok}

@app.post("/ph/deactivate")
def ph_deactivate():
    ok = set_ph_adjustment_active(False)
    return {"ph_adjustment_active": False, "gpio_applied": ok}

@app.get("/ph/status")
def ph_status():
    return {
        "ph_adjustment_active": get_ph_adjustment_active(),
        "ph_threshold_low": PH_THRESHOLD_LOW,
        "ph_threshold_high": PH_THRESHOLD_HIGH,
        "gpio_available": GPIO_AVAILABLE
    }

@app.get("/")
def root():
    return {"message": "Duckweed Segmentation API with pH Control", "docs": "/docs"}
