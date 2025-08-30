
import { useEffect, useRef } from 'react';

interface AlgaeAnimationProps {
  mood: 'bad' | 'neutral' | 'happy';
}

export const AlgaeAnimation = ({ mood }: AlgaeAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    let frame = 0;
    let bubbles: Array<{ x: number; y: number; size: number; speed: number; alpha: number }> = [];

    // Initialize bubbles
    for (let i = 0; i < 8; i++) {
      bubbles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.2,
        alpha: Math.random() * 0.5 + 0.3
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Draw background water effect
      const gradient = ctx.createRadialGradient(150, 150, 0, 150, 150, 150);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
      gradient.addColorStop(1, 'rgba(5, 150, 105, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and animate bubbles
      bubbles.forEach((bubble, index) => {
        bubble.y -= bubble.speed;
        if (bubble.y < -10) {
          bubble.y = canvas.height + 10;
          bubble.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.globalAlpha = bubble.alpha;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw main algae body
      const centerX = 150;
      const centerY = 150;
      const baseSize = 40;
      const pulse = Math.sin(frame * 0.1) * 5;

      // Determine colors and expressions based on mood
      let bodyColor, eyeColor, mouthPath;
      
      switch (mood) {
        case 'bad':
          bodyColor = '#ef4444'; // red
          eyeColor = '#fbbf24'; // yellow eyes for stressed look
          break;
        case 'neutral':
          bodyColor = '#10b981'; // emerald
          eyeColor = '#065f46'; // dark green
          break;
        case 'happy':
          bodyColor = '#22c55e'; // bright green
          eyeColor = '#064e3b'; // very dark green
          break;
      }

      // Draw algae body (multiple cells)
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const distance = baseSize + pulse;
        const x = centerX + Math.cos(angle) * distance * 0.6;
        const y = centerY + Math.sin(angle) * distance * 0.6;
        const cellSize = baseSize * (mood === 'bad' ? 0.7 : mood === 'happy' ? 1.2 : 1) + pulse * 0.5;

        // Cell body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Cell highlight
        ctx.fillStyle = `${bodyColor}40`;
        ctx.beginPath();
        ctx.arc(x - cellSize * 0.2, y - cellSize * 0.2, cellSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw central algae face
      const faceSize = baseSize * (mood === 'bad' ? 0.8 : mood === 'happy' ? 1.3 : 1.1) + pulse;
      
      // Face body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, faceSize, 0, Math.PI * 2);
      ctx.fill();

      // Face highlight
      ctx.fillStyle = `${bodyColor}60`;
      ctx.beginPath();
      ctx.arc(centerX - faceSize * 0.3, centerY - faceSize * 0.3, faceSize * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      const eyeOffset = faceSize * 0.3;
      const eyeSize = mood === 'bad' ? 3 : mood === 'happy' ? 6 : 4;
      
      ctx.fillStyle = eyeColor;
      // Left eye
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
      ctx.fill();

      // Mouth based on mood
      ctx.strokeStyle = eyeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      if (mood === 'happy') {
        // Happy smile
        ctx.arc(centerX, centerY + eyeOffset * 0.3, eyeOffset * 0.7, 0, Math.PI);
      } else if (mood === 'bad') {
        // Sad frown
        ctx.arc(centerX, centerY + eyeOffset * 0.8, eyeOffset * 0.7, Math.PI, 0);
      } else {
        // Neutral line
        ctx.moveTo(centerX - eyeOffset * 0.5, centerY + eyeOffset * 0.5);
        ctx.lineTo(centerX + eyeOffset * 0.5, centerY + eyeOffset * 0.5);
      }
      ctx.stroke();

      // Add sparkles for happy mood
      if (mood === 'happy') {
        for (let i = 0; i < 5; i++) {
          const sparkleX = centerX + Math.cos(frame * 0.05 + i) * 80;
          const sparkleY = centerY + Math.sin(frame * 0.05 + i) * 80;
          const sparkleSize = Math.sin(frame * 0.1 + i) * 2 + 3;
          
          ctx.fillStyle = '#fbbf24';
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.translate(sparkleX, sparkleY);
          ctx.rotate(frame * 0.02);
          
          // Draw star shape
          ctx.beginPath();
          for (let j = 0; j < 8; j++) {
            const angle = (j * Math.PI) / 4;
            const radius = j % 2 === 0 ? sparkleSize : sparkleSize * 0.5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.fill();
          ctx.restore();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mood]);

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        className="rounded-xl border border-emerald-500/30 bg-slate-900/50"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
};
