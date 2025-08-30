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

  const handleCapture = () => {
    if (!canvasRef.current) return;

    const imageData = captureFrame(canvasRef.current);
    addCapturedFrame({
      timestamp: new Date(),
      coverage,
      imageData
    });

    toast({
      title: 'Frame Captured',
      description: `Saved with ${coverage.toFixed(1)}% coverage`,
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

        {/* Unified Analysis Status */}
        <div className="mt-3 text-sm space-y-2">
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <span className="font-medium">Duckweed Coverage ({mode.toUpperCase()})</span>
            <span className="text-lg font-bold text-primary">{unifiedCoverage.toFixed(1)}%</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Threshold: {threshold}% (server ENV)
          </div>
          <div className="text-xs">
            Valve: <span className={unifiedValveClosed === null ? 'text-gray-500' : unifiedValveClosed ? 'text-red-500' : 'text-green-500'}>
              {unifiedValveClosed === null ? 'N/A' : unifiedValveClosed ? 'CLOSED' : 'OPEN'}
            </span>
          </div>
          <div className="text-xs">
            pH Control: <span className={unifiedPhAdjustmentActive === null ? 'text-gray-500' : unifiedPhAdjustmentActive ? 'text-blue-500' : 'text-gray-400'}>
              {unifiedPhAdjustmentActive === null ? 'N/A' : unifiedPhAdjustmentActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            pH Thresholds: {phThresholdLow}% - {phThresholdHigh}%
          </div>
          {analyzerError && <div className="text-red-500 text-xs">{analyzerError}</div>}
          {/* Unified AI coverage indicator */}
          <div className="text-xs mt-1 opacity-80 border-t pt-2">
            <div><b>AI Coverage (Unified):</b> {unifiedCoverage.toFixed(1)}%</div>
            <div><b>Valve Status:</b> {unifiedValveClosed === null ? "N/A" : unifiedValveClosed ? "Closed" : "Open"}</div>
            <div><b>pH Control:</b> {unifiedPhAdjustmentActive === null ? "N/A" : unifiedPhAdjustmentActive ? "Active" : "Inactive"}</div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2 mt-4">
          {!analyzerRunning ? (
            <Button onClick={startAnalyzer} size="sm" className="flex-1">
              Start Analysis
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

        {/* Valve Controls */}
        <div className="flex gap-2 mt-2">
          <Button 
            onClick={openValve} 
            size="sm" 
            variant="outline"
            className="flex-1 text-green-700 border-green-300 hover:bg-green-50"
            disabled={unifiedValveClosed === false}
          >
            Open Valve
          </Button>
          <Button 
            onClick={closeValve} 
            size="sm" 
            variant="outline"
            className="flex-1 text-red-700 border-red-300 hover:bg-red-50"
            disabled={unifiedValveClosed === true}
          >
            Close Valve
          </Button>
        </div>

        {/* pH Control Buttons */}
        <div className="flex gap-2 mt-2">
          <Button 
            onClick={activatePhAdjustment} 
            size="sm" 
            variant="outline"
            className="flex-1 text-blue-700 border-blue-300 hover:bg-blue-50"
            disabled={unifiedPhAdjustmentActive === true}
          >
            Activate pH Control
          </Button>
          <Button 
            onClick={deactivatePhAdjustment} 
            size="sm" 
            variant="outline"
            className="flex-1 text-gray-700 border-gray-300 hover:bg-gray-50"
            disabled={unifiedPhAdjustmentActive === false}
          >
            Deactivate pH Control
          </Button>
        </div>

        {/* Legacy AI Mode Controls */}
        {aiMode === 'segmentation' && (
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg mt-4">
            <span className="text-sm font-medium">Local Coverage (Legacy)</span>
            <span className="text-lg font-bold text-primary">{coverage.toFixed(1)}%</span>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <Button 
            onClick={toggleAiMode} 
            variant={aiMode === 'off' ? 'default' : 'secondary'}
            size="sm"
            className="flex-1"
          >
            {aiMode === 'off' ? 'Enable Local AI' : 'Disable Local AI'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
