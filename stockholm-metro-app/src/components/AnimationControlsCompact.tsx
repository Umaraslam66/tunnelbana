import React, { useCallback } from 'react';
import { AnimationState, AnimationControls } from '../types/animation';

interface AnimationControlsProps {
  state: AnimationState;
  controls: AnimationControls;
  onTimeSeek?: (time: string) => void;
}

const AnimationControlsCompact: React.FC<AnimationControlsProps> = ({ 
  state, 
  controls,
  onTimeSeek 
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
  }, [onTimeSeek]);

  return (
    <div className="animation-controls-compact">
      {/* Playback Controls */}
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

      {/* Time Display */}
      <div className="compact-time-display">
        <span className="compact-time">{formatTime(state.currentTime)}</span>
        <span className="compact-time-range">{formatTime(state.startTime)} - {formatTime(state.endTime)}</span>
      </div>

      {/* Progress Bar */}
      {onTimeSeek && (
        <div className="compact-progress-container">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={state.progress}
            onChange={handleProgressChange}
            className="compact-progress-slider"
          />
        </div>
      )}

      {/* Speed Control */}
      <div className="compact-speed-group">
        <span className="compact-label">Speed:</span>
        <input
          type="range"
          min="1"
          max="60"
          step="1"
          value={state.speed}
          onChange={(e) => controls.onSpeedChange(parseInt(e.target.value))}
          className="compact-speed-slider"
          title={`${state.speed}x speed`}
        />
        <span className="compact-speed-value">{state.speed}x</span>
      </div>
    </div>
  );
};

export default AnimationControlsCompact;

