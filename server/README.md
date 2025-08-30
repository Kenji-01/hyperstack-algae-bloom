# FastAPI Backend for Algae Bloom Detection

This FastAPI backend provides YOLOv8 segmentation capabilities for detecting algae blooms in water bodies, specifically optimized for Raspberry Pi and ARM-based systems.

## Features

- **YOLOv8 Segmentation**: Uses Ultralytics YOLOv8 for precise algae detection
- **FastAPI Framework**: High-performance async API with automatic documentation
- **Raspberry Pi Compatible**: Uses `opencv-python-headless` for ARM compatibility
- **File Upload Support**: Handles image uploads for analysis
- **CORS Enabled**: Ready for frontend integration

## Requirements

- Python 3.11+
- Virtual environment support
- Raspberry Pi 4+ (recommended) or any ARM64/x86_64 system

## Installation

### 1. Create Virtual Environment
```bash
cd server
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Verify Installation
```bash
python test_imports.py
```

## Dependencies

The `requirements.txt` includes:

- **ultralytics==8.3.0** - YOLOv8 implementation for segmentation
- **fastapi** - Modern web framework for building APIs
- **uvicorn** - ASGI server for running FastAPI
- **opencv-python-headless** - Computer vision library (headless for server environments)
- **numpy** - Numerical computing library
- **python-multipart** - For handling file uploads

## Usage

### Start the Server

#### Option 1: Using the startup script
```bash
./start_server.sh
```

#### Option 2: Manual startup
```bash
source .venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Access the API

- **Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## API Endpoints

### POST /analyze
Analyzes an uploaded image for algae bloom detection.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `file` (image file)

**Response:**
```json
{
  "filename": "image.jpg",
  "algae_detected": true,
  "confidence": 0.85,
  "segmentation_masks": [...],
  "processing_time": 1.23
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Model

The system uses a custom-trained YOLOv8 segmentation model (`duckweed-seg.pt`) located in the `weights/` directory. This model is specifically trained for detecting algae/duckweed in water bodies.

## Development

### Project Structure
```
server/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── test_imports.py      # Import verification script
├── start_server.sh      # Server startup script
├── weights/
│   └── duckweed-seg.pt  # YOLOv8 model weights
└── .venv/               # Virtual environment
```

### Testing
```bash
# Test imports
python test_imports.py

# Test server startup
python -c "import main; print('✅ Server imports successfully')"
```

## Raspberry Pi Optimization

This setup is optimized for Raspberry Pi deployment:

- Uses `opencv-python-headless` instead of full OpenCV (no GUI dependencies)
- Lightweight dependencies suitable for ARM architecture
- Efficient memory usage for resource-constrained environments

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure virtual environment is activated and all dependencies are installed
2. **Model Loading**: Verify `duckweed-seg.pt` exists in the `weights/` directory
3. **Port Conflicts**: Change port in startup command if 8000 is occupied
4. **Memory Issues**: On Raspberry Pi, consider reducing model batch size

### Logs
Server logs are displayed in the terminal. For production deployment, consider using proper logging configuration.

## Production Deployment

For production deployment:

1. Use a production ASGI server like Gunicorn with Uvicorn workers
2. Set up proper logging and monitoring
3. Configure environment variables for sensitive settings
4. Use a reverse proxy (nginx) for better performance
5. Set up SSL/TLS certificates

```bash
# Example production command
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
