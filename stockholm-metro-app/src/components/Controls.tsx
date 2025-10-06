import React from 'react';

interface ControlsProps {
  visibleLines: Set<string>;
  showBackgroundMap: boolean;
  onLineToggle: (line: string) => void;
  onBackgroundMapToggle: () => void;
  showTracks?: boolean;
  onShowTracksToggle?: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  visibleLines,
  showBackgroundMap,
  onLineToggle,
  onBackgroundMapToggle,
  showTracks = true,
  onShowTracksToggle
}) => {
  const lines = [
    { id: 'blue', name: 'Blue Line', color: '#2196f3', icon: '🔵' },
    { id: 'red', name: 'Red Line', color: '#ff5252', icon: '🔴' },
    { id: 'green', name: 'Green Line', color: '#66bb6a', icon: '🟢' }
  ];

  return (
    <div className="controls">
      <div className="control-header">
        <h2 className="control-title">🚇 Stockholm Metro</h2>
        <p className="control-subtitle">Network Visualization</p>
      </div>

      <div className="control-section">
        <h3>Metro Lines</h3>
        <div className="toggle-group">
          {lines.map(line => (
            <button
              key={line.id}
              className={`toggle-btn line-btn ${line.id}-btn ${visibleLines.has(line.id) ? 'active' : ''}`}
              onClick={() => onLineToggle(line.id)}
              style={{
                '--line-color': line.color,
              } as React.CSSProperties}
            >
              <span className="btn-icon">{line.icon}</span>
              <span className="btn-text">{line.name}</span>
              {visibleLines.has(line.id) && <span className="btn-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h3>Display Options</h3>
        <div className="toggle-group">
          <button
            className={`toggle-btn feature-btn ${showBackgroundMap ? 'active' : ''}`}
            onClick={onBackgroundMapToggle}
          >
            <span className="btn-icon">🗺️</span>
            <span className="btn-text">Background Map</span>
            {showBackgroundMap && <span className="btn-check">✓</span>}
          </button>
          
          {onShowTracksToggle && (
            <button
              className={`toggle-btn feature-btn ${showTracks ? 'active' : ''}`}
              onClick={onShowTracksToggle}
            >
              <span className="btn-icon">🛤️</span>
              <span className="btn-text">Track Separation</span>
              {showTracks && <span className="btn-check">✓</span>}
            </button>
          )}
        </div>
      </div>

      <div className="control-footer">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{visibleLines.size}</span>
            <span className="stat-label">Active Lines</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">100</span>
            <span className="stat-label">Stations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
