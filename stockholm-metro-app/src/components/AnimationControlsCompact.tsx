import React, { useCallback } from 'react';
import { AnimationState, AnimationControls } from '../types/animation';

interface AnimationControlsProps {
  state: AnimationState;
  controls: AnimationControls;
  onTimeSeek?: (time: string) => void;
  trainCount?: number;
}

const AnimationControlsCompact: React.FC<AnimationControlsProps> = ({ 
  state, 
  controls,
  onTimeSeek,
  trainCount = 0
}) => {
  const formatTime = (time: string) => {
    return time.substring(0, 5); // Show HH:MM
  };

  const progressToTime = (progress: number): string => {
    const startMinutes = 8 * 60;
    const endMinutes = 10 * 60;
    const totalMinutes = endMinutes - startMinutes;
    const currentMinutes = startMinutes + (totalMinutes * progress);
    const hours = Math.floor(currentMinutes / 60);
    const mins = Math.round(currentMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  };

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onTimeSeek) return;
    const progress = parseFloat(e.target.value);
    const newTime = progressToTime(progress);
    onTimeSeek(newTime);
  }, [onTimeSeek, progressToTime]);

  return (
    <div className="animation-controls-card">
      {/* Header */}
      <div className="animation-card-header">
        <h3>⏱️ Animation</h3>
      </div>

      {/* Playback Controls */}
      <div className="animation-card-section">
        <div className="compact-controls-group">
        <button
          className={`compact-btn ${state.isPlaying ? 'active' : ''}`}
          onClick={state.isPlaying ? controls.onPause : controls.onPlay}
          title={state.isPlaying ? 'Pause' : 'Play'}
        >
          {state.isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <button
          className="compact-btn"
          onClick={controls.onStop}
          title="Stop"
        >
          ⏹️
        </button>
        </div>
      </div>

      {/* Time Display */}
      <div className="animation-card-section">
        <div className="time-display-large">
          <span className="time-large">{formatTime(state.currentTime)}</span>
          <span className="time-range-small">{formatTime(state.startTime)} - {formatTime(state.endTime)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      {onTimeSeek && (
        <div className="animation-card-section">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={state.progress}
            onChange={handleProgressChange}
            className="progress-slider-vertical"
          />
        </div>
      )}

      {/* Speed Control */}
      <div className="animation-card-section">
        <label className="card-label">Speed</label>
        <div className="speed-display">
          <span className="speed-value-large">{state.speed}x</span>
        </div>
        <input
          type="range"
          min="1"
          max="60"
          step="1"
          value={state.speed}
          onChange={(e) => controls.onSpeedChange(parseInt(e.target.value))}
          className="speed-slider-vertical"
          title={`${state.speed}x speed`}
        />
      </div>

      {/* Stats Info */}
      <div className="animation-card-section stats-section">
        <div className="stat-card-item">
          <span className="stat-icon-large">🚇</span>
          <span className="stat-value-large">{trainCount}</span>
          <span className="stat-label-small">Trains</span>
        </div>
        <div className="stat-card-item">
          <span className="stat-icon-large">📊</span>
          <span className="stat-value-large">{Math.round(state.progress * 100)}%</span>
          <span className="stat-label-small">Progress</span>
        </div>
      </div>
    </div>
  );
};

export default AnimationControlsCompact;

