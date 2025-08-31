import { useEffect, useRef, useState } from 'react';
import { Camera, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeviceStore } from '@/lib/store';
import { computeGreenMask, captureFrame } from '@/lib/segmentation';
import { useToast } from '@/hooks/use-toast';
import { useDuckweedAnalyzer } from '@/lib/useDuckweedAnalyzer';

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
