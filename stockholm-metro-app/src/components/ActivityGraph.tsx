import React, { useEffect, useRef } from 'react';

interface ActivityGraphProps {
  currentTime: string;
  trainPositions: Array<{ lineColor: string }>;
  maxTrains?: number;
}

interface DataPoint {
  time: string;
  blue: number;
  red: number;
  green: number;
  total: number;
}

const ActivityGraph: React.FC<ActivityGraphProps> = ({ 
  currentTime, 
  trainPositions,
  maxTrains = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<DataPoint[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Count current trains
    const counts = trainPositions.reduce((acc, train) => {
      acc[train.lineColor] = (acc[train.lineColor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const blue = counts['blue'] || 0;
    const red = counts['red'] || 0;
    const green = counts['green'] || 0;
    const total = blue + red + green;

    // Add to history (keep last 60 data points)
    historyRef.current.push({ time: currentTime, blue, red, green, total });
    if (historyRef.current.length > 60) {
      historyRef.current.shift();
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const history = historyRef.current;
    if (history.length < 2) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (graphHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw Y-axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = Math.round(maxTrains * (4 - i) / 4);
      const y = padding + (graphHeight * i) / 4;
      ctx.fillText(value.toString(), padding - 5, y + 3);
    }

    // Draw lines for each color
    const drawLine = (color: string, dataKey: keyof DataPoint, strokeColor: string) => {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();

      history.forEach((point, index) => {
        const x = padding + (graphWidth * index) / (history.length - 1);
        const value = typeof point[dataKey] === 'number' ? point[dataKey] as number : 0;
        const y = padding + graphHeight - (graphHeight * value) / maxTrains;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = strokeColor;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Draw total (background)
    drawLine('total', 'total', 'rgba(255, 255, 255, 0.2)');
    
    // Draw individual lines
    drawLine('blue', 'blue', '#0088cc');
    drawLine('red', 'red', '#ee2e24');
    drawLine('green', 'green', '#16a34a');

    // Draw current time marker
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(width - padding, padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [currentTime, trainPositions, maxTrains]);

  return (
    <div className="activity-graph">
      <div className="graph-header">
        <h3>📊 Activity Timeline</h3>
        <div className="graph-legend">
          <span className="legend-item">
            <span className="legend-dot blue"></span> Blue
          </span>
          <span className="legend-item">
            <span className="legend-dot red"></span> Red
          </span>
          <span className="legend-item">
            <span className="legend-dot green"></span> Green
          </span>
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={150}
        className="graph-canvas"
      />
    </div>
  );
};

export default ActivityGraph;

