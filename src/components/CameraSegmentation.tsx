import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Inline store definition
interface CapturedFrame {
  id: string;
  timestamp: Date;
  coverage: number;
  imageData: string;
}

interface DeviceState {
  lightOn: boolean;
  pumpOn: boolean;
  fanOn: boolean;
  valveOpen: boolean;
  duckweedCoverage: number;
  temperature: number;
  ph: number;
  ec: number;
  connectivity: 'connected' | 'poor' | 'disconnected';
  systemHealth: 'good' | 'warning' | 'critical';
  aiMode: 'off' | 'segmentation';
  cameraEnabled: boolean;
  valveClosed: boolean | null;
  threshold: number;
  phAdjustmentActive: boolean | null;
  settings: {
    greenThreshold: number;
    showOverlay: boolean;
    defaultPumpMode: boolean;
    defaultLightMode: boolean;
    defaultFanMode: boolean;
    alarmVolume: number;
    updateFrequency: number;
    dataRetention: number;
  };
  thresholds: {
    phMin: number;
    phMax: number;
    tempMin: number;
    tempMax: number;
    ecTarget: number;
  };
  capturedFrames: CapturedFrame[];
}

interface DeviceActions {
  toggleLight: () => void;
  togglePump: () => void;
  toggleFan: () => void;
  toggleValve: () => void;
  updateMetric: (key: keyof DeviceState, value: any) => void;
  setDuckweedCoverage: (pct: number) => void;
  setValveClosed: (closed: boolean | null) => void;
  setThreshold: (n: number) => void;
  updateSetting: (key: keyof DeviceState['settings'], value: any) => void;
  updateThreshold: (key: keyof DeviceState['thresholds'], value: number) => void;
  addCapturedFrame: (frame: CapturedFrame) => void;
  clearCapturedFrames: () => void;
  resetToDefaults: () => void;
}

const initialState: DeviceState = {
  lightOn: false,
  pumpOn: false,
  fanOn: false,
  valveOpen: true,
  duckweedCoverage: 0,
  temperature: 24.5,
  ph: 6.8,
  ec: 850,
  connectivity: 'connected',
  systemHealth: 'good',
  aiMode: 'off',
  cameraEnabled: true,
  valveClosed: null,
  threshold: 40,
  phAdjustmentActive: null,
  settings: {
    greenThreshold: 0.3,
    showOverlay: true,
    defaultPumpMode: false,
    defaultLightMode: false,
    defaultFanMode: false,
    alarmVolume: 0.7,
    updateFrequency: 5,
    dataRetention: 30,
  },
  thresholds: {
    phMin: 6.0,
    phMax: 7.5,
    tempMin: 20,
    tempMax: 28,
    ecTarget: 800,
  },
  capturedFrames: [],
};

const useDeviceStore = create<DeviceState & DeviceActions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      toggleLight: () => set((state) => ({ lightOn: !state.lightOn })),
      togglePump: () => set((state) => ({ pumpOn: !state.pumpOn })),
      toggleFan: () => set((state) => ({ fanOn: !state.fanOn })),
      toggleValve: () => set((state) => ({ valveOpen: !state.valveOpen })),
      updateMetric: (key, value) => set((state) => ({ [key]: value })),
      setDuckweedCoverage: (pct) => set({ duckweedCoverage: pct }),
      setValveClosed: (closed) => set({ valveClosed: closed }),
      setThreshold: (n) => set({ threshold: n }),
      updateSetting: (key, value) => 
        set((state) => ({ 
          settings: { ...state.settings, [key]: value } 
        })),
      updateThreshold: (key, value) => 
        set((state) => ({ 
          thresholds: { ...state.thresholds, [key]: value } 
        })),
      addCapturedFrame: (frame) => 
        set((state) => ({ 
          capturedFrames: [...state.capturedFrames, frame].slice(-50)
        })),
      clearCapturedFrames: () => set({ capturedFrames: [] }),
      resetToDefaults: () => set(initialState),
    }),
    { name: 'device-store' }
  )
);

// Inline segmentation utilities
interface SegmentationResult {
  coverage: number;
  maskData: ImageData;
}

function computeGreenMask(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  threshold: number = 0.3
): SegmentationResult {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let greenPixels = 0;
  let totalPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const total = r + g + b;
    if (total > 0) {
      const greenRatio = g / total;
      const isGreen = greenRatio > threshold && g > Math.max(r, b);
      
      if (isGreen) {
        greenPixels++;
        data[i] = 0;
        data[i + 1] = 255;
        data[i + 2] = 0;
        data[i + 3] = 180;
      } else {
        data[i + 3] = 0;
      }
      totalPixels++;
    }
  }

  const coverage = totalPixels > 0 ? (greenPixels / totalPixels) * 100 : 0;
  return {
    coverage: Math.round(coverage * 10) / 10,
    maskData: imageData
  };
}

function captureFrame(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

function analyzeFrame(video: HTMLVideoElement, threshold: number = 0.3): number {
  const canvas = document.createElement('canvas');
  const result = computeGreenMask(video, canvas, threshold);
  return result.coverage;
}

// Inline analyzer hook
function useDuckweedAnalyzer(videoRef: React.RefObject<HTMLVideoElement>) {
  const [running, setRunning] = useState(false);
  const [coverage, setCoverage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [valveClosed, setValveClosed] = useState<boolean | null>(null);
  const [phAdjustmentActive, setPhAdjustmentActive] = useState<boolean | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { setDuckweedCoverage, setValveClosed: setStoreValveClosed, threshold, setThreshold } = useDeviceStore();

  const analyzeVideo = useCallback(async () => {
    if (!videoRef.current || !running) return;

    try {
      const currentCoverage = analyzeFrame(videoRef.current, 0.3);
      setCoverage(currentCoverage);
      setDuckweedCoverage(currentCoverage);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx && videoRef.current) {
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          
          const formData = new FormData();
          formData.append('frame', blob, 'frame.jpg');
          
          try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/analyze`, {
              method: 'POST',
              body: formData
            });
            
            if (response.ok) {
              const result = await response.json();
              setCoverage(result.coverage_pct || currentCoverage);
              setDuckweedCoverage(result.coverage_pct || currentCoverage);
              setStoreValveClosed(result.valve_closed);
              setValveClosed(result.valve_closed);
              if (result.threshold) {
                setThreshold(result.threshold);
              }
            }
          } catch (err) {
            console.error('Analysis request failed:', err);
          }
        }, 'image/jpeg', 0.8);
      }

      setError(null);
    } catch (err) {
      console.error('Video analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    }
  }, [running, videoRef, setDuckweedCoverage, setStoreValveClosed, setThreshold]);

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    setError(null);
    intervalRef.current = setInterval(analyzeVideo, 1000);
  }, [running, analyzeVideo]);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const openValve = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/valve/open`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setValveClosed(false);
        setStoreValveClosed(false);
      }
    } catch (err) {
      console.error('Failed to open valve:', err);
    }
  }, [setStoreValveClosed]);

  const closeValve = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/valve/close`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setValveClosed(true);
        setStoreValveClosed(true);
      }
    } catch (err) {
      console.error('Failed to close valve:', err);
    }
  }, [setStoreValveClosed]);

  const activatePhAdjustment = useCallback(() => {
    setPhAdjustmentActive(true);
  }, []);

  const deactivatePhAdjustment = useCallback(() => {
    setPhAdjustmentActive(false);
  }, []);

  return {
    running,
    coverage,
    mode: running ? 'camera' : 'off',
    threshold,
    valveClosed,
    phAdjustmentActive,
    phThresholdLow: 6.0,
    phThresholdHigh: 7.5,
    error,
    start,
    stop,
    openValve,
    closeValve,
    activatePhAdjustment,
    deactivatePhAdjustment
  };
}

export const CameraSegmentation = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coverage, setCoverage] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const { toast } = useToast();
  
  const { 
    aiMode, 
    cameraEnabled, 
    settings, 
    updateMetric, 
    addCapturedFrame
  } = useDeviceStore();

  // Use reactive selectors for live updates
  const duckweedCoverage = useDeviceStore(s => s.duckweedCoverage ?? 0);
  const valveClosed = useDeviceStore(s => s.valveClosed ?? null);

  const { 
    running: analyzerRunning, 
    coverage: localCoverage, 
    mode, 
    threshold, 
    valveClosed: hookValveClosed, 
    phAdjustmentActive: hookPhAdjustmentActive,
    phThresholdLow,
    phThresholdHigh,
    error: analyzerError, 
    start: startAnalyzer, 
    stop: stopAnalyzer, 
    openValve, 
    closeValve,
    activatePhAdjustment,
    deactivatePhAdjustment
  } = useDuckweedAnalyzer(videoRef);

  // Use store values for unified display, fallback to hook values
  const unifiedCoverage = duckweedCoverage || localCoverage;
  const unifiedValveClosed = valveClosed !== null ? valveClosed : hookValveClosed;
  const unifiedPhAdjustmentActive = useDeviceStore(s => s.phAdjustmentActive) !== null ? 
    useDeviceStore(s => s.phAdjustmentActive) : hookPhAdjustmentActive;

  useEffect(() => {
    if (cameraEnabled && videoRef.current) {
      startCamera();
    }
    return () => stopCamera();
  }, [cameraEnabled]);

  useEffect(() => {
    if (isVideoActive && aiMode === 'segmentation' && settings.showOverlay) {
      const interval = setInterval(processFrame, 100);
      return () => clearInterval(interval);
    }
  }, [isVideoActive, aiMode, settings.showOverlay, settings.greenThreshold]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsVideoActive(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      toast({
        title: 'Camera Access',
        description: 'Using fallback demo mode. Camera access was denied.',
        variant: 'destructive'
      });
      // Use sample video as fallback
      if (videoRef.current) {
        videoRef.current.src = '/sample-duckweed.mp4';
        videoRef.current.loop = true;
        videoRef.current.play();
        setIsVideoActive(true);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsVideoActive(false);
  };

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || aiMode === 'off') return;

    try {
      const result = computeGreenMask(
        videoRef.current, 
        canvasRef.current, 
        settings.greenThreshold
      );
      setCoverage(result.coverage);
      
      if (settings.showOverlay) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.putImageData(result.maskData, 0, 0);
        }
      }
    } catch (error) {
      console.error('Segmentation error:', error);
    }
  };

  const sendThreshold = async (n: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/threshold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: n })
      });
      if (response.ok) {
        updateMetric('threshold', n);
      }
    } catch (error) {
      console.error('Failed to update threshold:', error);
    }
  };

  const handleCapture = () => {
    if (!canvasRef.current) return;

    const imageData = captureFrame(canvasRef.current);
    addCapturedFrame({
      id: Date.now().toString(),
      timestamp: new Date(),
      coverage: unifiedCoverage,
      imageData
    });

    toast({
      title: 'Frame Captured',
      description: `Saved with ${unifiedCoverage.toFixed(1)}% coverage`,
    });
  };

  const toggleAiMode = () => {
    const newMode = aiMode === 'off' ? 'segmentation' : 'off';
    updateMetric('aiMode', newMode);
    
    toast({
      title: 'AI Mode',
      description: `Segmentation ${newMode === 'off' ? 'disabled' : 'enabled'}`,
    });
  };

  return (
    <Card className="hyperstack-card hyperstack-card-glow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Duckweed Camera
          </span>
          <Badge variant={aiMode === 'off' ? 'secondary' : 'default'}>
            AI {aiMode === 'off' ? 'OFF' : 'ON'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-80 bg-black rounded-lg object-cover"
            muted
            playsInline
          />
          {aiMode === 'segmentation' && settings.showOverlay && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-80 rounded-lg pointer-events-none opacity-70"
            />
          )}
          
          {!isVideoActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <p className="text-white text-sm">Camera Inactive</p>
            </div>
          )}
        </div>

        {/* Camera Analysis Display */}
        <div className="mt-3 text-sm space-y-2">
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <span className="font-medium">Duckweed Coverage</span>
            <span className="text-lg font-bold text-primary">{unifiedCoverage.toFixed(1)}%</span>
          </div>
          
          {/* Control Strip */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg text-xs">
            <div>Valve: <span className={unifiedValveClosed === null ? 'text-gray-500' : unifiedValveClosed ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
              {unifiedValveClosed === null ? 'N/A' : unifiedValveClosed ? 'CLOSED' : 'OPEN'}
            </span></div>
            
            <label className="flex items-center gap-1">
              Threshold (%): 
              <input 
                type="number" 
                min={0} 
                max={100} 
                value={threshold}
                onChange={(e) => sendThreshold(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                className="w-16 px-1 py-0.5 text-xs border rounded"
              />
            </label>
            
            <Button 
              onClick={openValve} 
              size="sm" 
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-50 h-6 px-2 text-xs"
              disabled={unifiedValveClosed === false}
            >
              Open
            </Button>
            
            <Button 
              onClick={closeValve} 
              size="sm" 
              variant="outline"
              className="text-red-700 border-red-300 hover:bg-red-50 h-6 px-2 text-xs"
              disabled={unifiedValveClosed === true}
            >
              Close
            </Button>
          </div>
          
          {analyzerError && <div className="text-red-500 text-xs">{analyzerError}</div>}
        </div>

        {/* Analysis Control */}
        <div className="flex gap-2 mt-4">
          {!analyzerRunning ? (
            <Button onClick={startAnalyzer} size="sm" className="flex-1">
              Start Camera Analysis
            </Button>
          ) : (
            <Button onClick={stopAnalyzer} size="sm" variant="secondary" className="flex-1">
              Stop Analysis
            </Button>
          )}
          
          <Button 
            onClick={handleCapture} 
            disabled={!isVideoActive}
            size="sm"
            variant="outline"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
