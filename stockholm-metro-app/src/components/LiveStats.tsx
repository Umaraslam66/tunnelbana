import React from 'react';
import { TrainPosition } from '../types/animation';

interface LiveStatsProps {
  trainPositions: TrainPosition[];
}

const LiveStats: React.FC<LiveStatsProps> = ({ trainPositions }) => {
  // Count trains by line
  const counts = trainPositions.reduce((acc, train) => {
    const color = train.lineColor;
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const blueCount = counts['blue'] || 0;
  const redCount = counts['red'] || 0;
  const greenCount = counts['green'] || 0;
  const total = blueCount + redCount + greenCount;

  return (
    <div className="live-stats">
      <div className="stats-header">
        <h3>🚇 Live Trains</h3>
        <div className="total-count">{total}</div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-item blue-line">
          <div className="stat-color-bar"></div>
          <div className="stat-info">
            <span className="stat-label">Blue Line</span>
            <span className="stat-count">{blueCount}</span>
          </div>
        </div>
        
        <div className="stat-item red-line">
          <div className="stat-color-bar"></div>
          <div className="stat-info">
            <span className="stat-label">Red Line</span>
            <span className="stat-count">{redCount}</span>
          </div>
        </div>
        
        <div className="stat-item green-line">
          <div className="stat-color-bar"></div>
          <div className="stat-info">
            <span className="stat-label">Green Line</span>
            <span className="stat-count">{greenCount}</span>
          </div>
        </div>
      </div>

      {/* Visual bar chart */}
      <div className="stats-chart">
        <div className="chart-bars">
          <div className="chart-bar-container">
            <div 
              className="chart-bar blue-bar" 
              style={{ height: `${Math.max(5, (blueCount / Math.max(total, 1)) * 100)}%` }}
            >
              <span className="bar-value">{blueCount}</span>
            </div>
            <span className="bar-label">Blue</span>
          </div>
          
          <div className="chart-bar-container">
            <div 
              className="chart-bar red-bar" 
              style={{ height: `${Math.max(5, (redCount / Math.max(total, 1)) * 100)}%` }}
            >
              <span className="bar-value">{redCount}</span>
            </div>
            <span className="bar-label">Red</span>
          </div>
          
          <div className="chart-bar-container">
            <div 
              className="chart-bar green-bar" 
              style={{ height: `${Math.max(5, (greenCount / Math.max(total, 1)) * 100)}%` }}
            >
              <span className="bar-value">{greenCount}</span>
            </div>
            <span className="bar-label">Green</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStats;

