import React, { useState, useEffect, useCallback, useRef } from 'react';
import MetroMap from './components/MetroMap';
import Controls from './components/Controls';
import TrainAnimation from './components/TrainAnimation';
import AnimationControlsCompact from './components/AnimationControlsCompact';
import { MetroData, MultiLineStations, TrackData } from './types/metro';
import { AnimationData, AnimationState, AnimationControls as AnimationControlsType } from './types/animation';
import './App.css';

const App: React.FC = () => {
  const [metroData, setMetroData] = useState<MetroData | null>(null);
  const [multiLineStations, setMultiLineStations] = useState<MultiLineStations | null>(null);
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [visibleLines, setVisibleLines] = useState<Set<string>>(new Set(['blue', 'red', 'green']));
  const [showBackgroundMap, setShowBackgroundMap] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Animation state - 8:00 AM to 10:00 AM window
  const [animationData, setAnimationData] = useState<AnimationData | null>(null);
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    speed: 5,
    currentTime: '08:00:00',
    startTime: '08:00:00',
    endTime: '10:00:00',
    progress: 0
  });
  const [showAnimation, setShowAnimation] = useState(false);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load metro data
        const metroResponse = await fetch('/metro_clean.json');
        if (!metroResponse.ok) {
          throw new Error('Failed to load metro data');
        }
        const metro = await metroResponse.json();
        setMetroData(metro);

        // Load multi-line stations data
        const multiLineResponse = await fetch('/multi_line_stations_clean.json');
        if (!multiLineResponse.ok) {
          throw new Error('Failed to load multi-line stations data');
        }
        const multiLine = await multiLineResponse.json();
        setMultiLineStations(multiLine);

        // Load track data
        const trackResponse = await fetch('/metro_tracks.json');
        if (!trackResponse.ok) {
          throw new Error('Failed to load track data');
        }
        const tracks = await trackResponse.json();
        setTrackData(tracks);

        // Load animation data with tracks
        console.log('🔄 Loading animation data with tracks...');
        const animationResponse = await fetch('/morning_schedules_with_tracks.json');
        if (!animationResponse.ok) {
          throw new Error('Failed to load animation data');
        }
        const animation = await animationResponse.json();
        setAnimationData(animation);
        console.log(`✅ Loaded ${animation.trips.length} trips for animation (8-10 AM)`);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLineToggle = (line: string) => {
    setVisibleLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(line)) {
        newSet.delete(line);
      } else {
        newSet.add(line);
      }
      return newSet;
    });
  };

  const handleBackgroundMapToggle = () => {
    setShowBackgroundMap(prev => !prev);
  };

  // Animation controls
  const handlePlay = useCallback(() => {
    console.log('▶️ Starting animation...');
    setAnimationState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const handlePause = useCallback(() => {
    console.log('⏸️ Pausing animation...');
    setAnimationState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const handleStop = useCallback(() => {
    console.log('⏹️ Stopping animation...');
    setAnimationState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: '08:00:00',
      progress: 0
    }));
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    console.log(`⚡ Speed changed to ${speed}x`);
    setAnimationState(prev => ({ ...prev, speed }));
  }, []);

  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);
  }, []);

  const handleTimeSeek = useCallback((time: string) => {
    console.log(`⏱️ Seeking to time ${time}`);
    setAnimationState(prev => {
      const startMinutes = 8 * 60; // 08:00
      const endMinutes = 10 * 60; // 10:00
      const [hours, minutes] = time.split(':').map(Number);
      const currentMinutes = hours * 60 + minutes;
      
      const totalMinutes = endMinutes - startMinutes;
      const elapsedMinutes = currentMinutes - startMinutes;
      const progress = Math.min(Math.max(elapsedMinutes / totalMinutes, 0), 1);
      
      return {
        ...prev,
        currentTime: time,
        progress
      };
    });
  }, []);

  // Time progression effect
  useEffect(() => {
    if (animationState.isPlaying) {
      timeIntervalRef.current = setInterval(() => {
        setAnimationState(prev => {
          // Parse current time to seconds
          const [hours, mins, secs] = prev.currentTime.split(':').map(Number);
          const currentSeconds = hours * 3600 + mins * 60 + secs;
          
          // Add time increment based on speed
          // 100ms interval, speed multiplier applies to simulation time
          // At 1x: advance 1 second of simulation time per 1 second of real time
          // At 5x: advance 5 seconds of simulation time per 1 second of real time
          const secondsToAdd = (0.1) * prev.speed; // 0.1 real seconds * speed
          const newSeconds = currentSeconds + secondsToAdd;
          
          // Convert back to time
          const newHours = Math.floor(newSeconds / 3600);
          const newMins = Math.floor((newSeconds % 3600) / 60);
          const newSecs = Math.floor(newSeconds % 60);
          const newTime = `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:${newSecs.toString().padStart(2, '0')}`;
          
          // Calculate progress (8 AM to 10 AM window)
          const startSeconds = 8 * 3600; // 08:00:00
          const endSeconds = 10 * 3600; // 10:00:00
          const totalSeconds = endSeconds - startSeconds;
          const elapsedSeconds = newSeconds - startSeconds;
          const progress = Math.min(Math.max(elapsedSeconds / totalSeconds, 0), 1);
          
          // Stop at end time
          if (newSeconds >= endSeconds) {
            return {
              ...prev,
              isPlaying: false,
              currentTime: '10:00:00',
              progress: 1
            };
          }
          
          return {
            ...prev,
            currentTime: newTime,
            progress
          };
        });
      }, 100); // 100ms interval for smoother updates
    } else {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    }
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    };
  }, [animationState.isPlaying, animationState.speed]);

  const animationControls: AnimationControlsType = {
    onPlay: handlePlay,
    onPause: handlePause,
    onStop: handleStop,
    onSpeedChange: handleSpeedChange
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="loading-spinner">🚇</div>
          <h1>Stockholm Metro Visualization</h1>
          <p>Loading metro network data...</p>
          <div className="loading-progress">
            <div className="loading-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="error">
          <div className="error-icon">⚠️</div>
          <h1>Stockholm Metro Visualization</h1>
          <p>Error: {error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metroData || !multiLineStations) {
    return (
      <div className="app-container">
        <div className="error">
          <h1>Stockholm Metro Visualization</h1>
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Toggle controls button */}
      <button
        className="toggle-controls-btn"
        onClick={toggleControls}
        title={showControls ? 'Hide Controls' : 'Show Controls'}
      >
        {showControls ? '◀' : '▶'}
      </button>

      {/* Main controls overlay */}
      {showControls && (
        <div className="controls-overlay">
          <Controls
            visibleLines={visibleLines}
            showBackgroundMap={showBackgroundMap}
            onLineToggle={handleLineToggle}
            onBackgroundMapToggle={handleBackgroundMapToggle}
          />
          
          {/* Animation mode toggle */}
          <div className="animation-mode-toggle">
            <button
              className={`mode-toggle-btn ${!showAnimation ? 'active' : ''}`}
              onClick={() => setShowAnimation(false)}
            >
              <span className="mode-icon">🗺️</span>
              <span>Static Map</span>
            </button>
            <button
              className={`mode-toggle-btn ${showAnimation ? 'active' : ''}`}
              onClick={() => setShowAnimation(true)}
              disabled={!animationData}
            >
              <span className="mode-icon">🚇</span>
              <span>Live Animation</span>
            </button>
          </div>
        </div>
      )}

      {/* Animation controls overlay */}
      {animationData && showAnimation && (
        <div className="animation-controls-overlay">
          <AnimationControlsCompact
            state={animationState}
            controls={animationControls}
            onTimeSeek={handleTimeSeek}
          />
        </div>
      )}

      {/* Map container */}
      <div id="map-container" className="map-container">
        {showAnimation && animationData ? (
          <>
            <TrainAnimation
              animationData={animationData}
              animationState={animationState}
              visibleLines={visibleLines}
              showBackgroundMap={showBackgroundMap}
              metroData={metroData}
              multiLineStations={multiLineStations}
              trackData={trackData}
            />
          </>
        ) : (
          <MetroMap
            metroData={metroData}
            multiLineStations={multiLineStations}
            visibleLines={visibleLines}
            showBackgroundMap={showBackgroundMap}
          />
        )}
      </div>
    </div>
  );
};

export default App;
