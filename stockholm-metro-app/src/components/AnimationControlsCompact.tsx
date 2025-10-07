import React, { useCallback, useState, useRef, useEffect } from 'react';
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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag if clicking on the drag handle or time display
    const target = e.target as HTMLElement;
    if (target.classList.contains('drag-handle') || target.classList.contains('compact-time-display') || target.classList.contains('compact-time') || target.classList.contains('compact-time-range')) {
      setIsDragging(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start drag if touching the drag handle or time display
    const target = e.target as HTMLElement;
    if (target.classList.contains('drag-handle') || target.classList.contains('compact-time-display') || target.classList.contains('compact-time') || target.classList.contains('compact-time-range')) {
      setIsDragging(true);
      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        setPosition({
          x: touch.clientX - dragOffset.x,
          y: touch.clientY - dragOffset.y
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  return (
    <div 
      ref={containerRef}
      className={`animation-controls-compact ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: position.x !== 0 || position.y !== 0 ? `translate(${position.x}px, ${position.y}px)` : undefined,
      }}
    >
      {/* Main Controls */}
      <div 
        className="animation-controls-main"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Drag Handle */}
        <div className="drag-handle" title="Drag to move">⋮⋮</div>
        
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

      {/* Stats Info */}
      <div className="animation-stats-info">
        <div className="stat-info-item">
          <span className="stat-info-icon">🚇</span>
          <span className="stat-info-value">{trainCount}</span>
          <span>trains</span>
        </div>
        <div className="stat-info-item">
          <span className="stat-info-icon">⚡</span>
          <span className="stat-info-value">{state.speed}x</span>
          <span>speed</span>
        </div>
        <div className="stat-info-item">
          <span className="stat-info-icon">📊</span>
          <span className="stat-info-value">{Math.round(state.progress * 100)}%</span>
          <span>progress</span>
        </div>
      </div>
    </div>
  );
};

export default AnimationControlsCompact;

