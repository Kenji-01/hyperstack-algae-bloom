
import { useEffect, useRef } from 'react';

interface GrowthChartProps {
  growthRate: number;
}

export const GrowthChart = ({ growthRate }: GrowthChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 200;

    // Generate sample data points
    const dataPoints = [];
    for (let i = 0; i < 24; i++) {
      const baseRate = 8 + Math.sin(i * 0.3) * 3;
      const noise = (Math.random() - 0.5) * 2;
      dataPoints.push(Math.max(0, baseRate + noise + (i === 23 ? growthRate - baseRate : 0)));
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = (i / 5) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw area under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    dataPoints.forEach((point, index) => {
      const x = (index / (dataPoints.length - 1)) * canvas.width;
      const y = canvas.height - (point / 20) * canvas.height;
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Draw main line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    dataPoints.forEach((point, index) => {
      const x = (index / (dataPoints.length - 1)) * canvas.width;
      const y = canvas.height - (point / 20) * canvas.height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw current point
    const currentX = canvas.width;
    const currentY = canvas.height - (growthRate / 20) * canvas.height;
    
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(currentX - 10, currentY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(currentX - 10, currentY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

  }, [growthRate]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-400">24h Growth Trend</span>
        <span className="text-emerald-300 font-medium">{growthRate.toFixed(1)}% current</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg"
        style={{ maxWidth: '100%' }}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>24h ago</span>
        <span>12h ago</span>
        <span>Now</span>
      </div>
    </div>
  );
};
