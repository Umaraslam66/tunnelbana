import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import { AnimationData, AnimationState, TrainPosition } from '../types/animation';
import { MetroData, MultiLineStations, Station, TrackData } from '../types/metro';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface TrainAnimationProps {
  animationData: AnimationData;
  animationState: AnimationState;
  visibleLines: Set<string>;
  showBackgroundMap: boolean;
  metroData: MetroData;
  multiLineStations: MultiLineStations;
  trackData: TrackData | null;
  onTrainPositionsUpdate?: (positions: TrainPosition[]) => void;
}

const TrainAnimation: React.FC<TrainAnimationProps> = ({
  animationData,
  animationState,
  visibleLines,
  showBackgroundMap,
  metroData,
  multiLineStations,
  trackData,
  onTrainPositionsUpdate
}) => {
  const [trainPositions, setTrainPositions] = useState<TrainPosition[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);

  // Line colors
  const lineColors = useMemo(() => ({
    blue: '#2196f3',
    red: '#ff5252',
    green: '#66bb6a'
  }), []);

  // Get line color
  const getLineColor = useCallback((lineColor: string) => {
    return lineColors[lineColor as keyof typeof lineColors] || '#666';
  }, [lineColors]);

  // Create train icon
  const createTrainIcon = useCallback((lineColor: string) => {
    const color = getLineColor(lineColor);
    
    return L.divIcon({
      html: `
        <div style="
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          width: 10px;
          height: 10px;
          box-shadow: 0 0 6px ${color}, 0 1px 3px rgba(0,0,0,0.5);
        "></div>
      `,
      className: 'train-icon',
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });
  }, [getLineColor]);

  // Convert time string (HH:MM:SS) to seconds since midnight
  const timeToSeconds = useCallback((timeStr: string): number => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }, []);

  // Interpolate position from precomputed positions
  const interpolatePosition = useCallback((positions: any[], currentSeconds: number): { lat: number; lon: number; stop_name: string | null } | null => {
    if (!positions || positions.length === 0) return null;

    // Find the two positions that bracket the current time
    let beforePos = null;
    let afterPos = null;

    for (let i = 0; i < positions.length - 1; i++) {
      if (positions[i].time <= currentSeconds && currentSeconds <= positions[i + 1].time) {
        beforePos = positions[i];
        afterPos = positions[i + 1];
        break;
      }
    }

    // Train hasn't started yet
    if (!beforePos && currentSeconds < positions[0].time) {
      return null;
    }

    // Train has finished
    if (!afterPos && currentSeconds > positions[positions.length - 1].time) {
      return null;
    }

    // At exact position
    if (!afterPos) {
      const pos = positions[positions.length - 1];
      return {
        lat: pos.lat,
        lon: pos.lon,
        stop_name: pos.stop_name
      };
    }

    // Interpolate between two positions
    const duration = afterPos.time - beforePos.time;
    const elapsed = currentSeconds - beforePos.time;
    const ratio = duration > 0 ? elapsed / duration : 0;

    return {
      lat: beforePos.lat + (afterPos.lat - beforePos.lat) * ratio,
      lon: beforePos.lon + (afterPos.lon - beforePos.lon) * ratio,
      stop_name: beforePos.stop_name || afterPos.stop_name
    };
  }, []);

  // Calculate all train positions for current time
  const calculateTrainPositions = useCallback((currentTime: string): TrainPosition[] => {
    const currentSeconds = timeToSeconds(currentTime);
    const positions: TrainPosition[] = [];
    const seenPositions = new Set<string>();

    animationData.trips.forEach(trip => {
      // Skip if line not visible
      if (!visibleLines.has(trip.line_color)) return;

      // Interpolate position
      const position = interpolatePosition(trip.positions, currentSeconds);
      
      if (position) {
        // Create a unique key based on position to avoid duplicate rendering
        // Round to 4 decimal places (~11m precision) - more aggressive deduplication
        // This prevents multiple trains rendering at nearly the same location
        const posKey = `${position.lat.toFixed(4)},${position.lon.toFixed(4)},${trip.line_color}`;
        
        // Skip if we've already seen a train at this position for this line
        // This prevents visual doubling when multiple trips are very close together
        if (seenPositions.has(posKey)) {
          return;
        }
        seenPositions.add(posKey);
        
        positions.push({
          lat: position.lat,
          lon: position.lon,
          time: currentSeconds,
          tripId: trip.trip_id,
          lineColor: trip.line_color,
          direction: trip.direction_str || trip.direction,
          trackId: trip.track_id,
          currentStop: position.stop_name || undefined,
        });
      }
    });

    return positions;
  }, [animationData.trips, visibleLines, timeToSeconds, interpolatePosition]);

  // Render ALL track polylines using trackData
  const trackPolylines = useMemo(() => {
    if (!trackData) {
      // Fallback: show original metro lines
      const lines: React.ReactElement[] = [];
      Object.entries(metroData).forEach(([lineColor, branches]) => {
        if (!visibleLines.has(lineColor)) return;
        
        Object.values(branches).forEach((stations, idx) => {
          const positions = (stations as Station[]).map(s => [s.stop_lat, s.stop_lon] as [number, number]);
          lines.push(
            <Polyline
              key={`fallback-${lineColor}-${idx}`}
              positions={positions}
              pathOptions={{
                color: getLineColor(lineColor),
                weight: 3,
                opacity: 0.6
              }}
            />
          );
        });
      });
      return lines;
    }

    const lines: React.ReactElement[] = [];

    Object.entries(trackData.lines).forEach(([lineColor, tracks]) => {
      if (!visibleLines.has(lineColor)) return;

      // Render ALL tracks for this line with smooth curves
      Object.entries(tracks).forEach(([trackId, coordinates]) => {
        const color = getLineColor(lineColor);
        const positions = coordinates.map(coord => [coord.lat, coord.lon] as [number, number]);

        lines.push(
          <Polyline
            key={trackId}
            positions={positions}
            pathOptions={{
              color: color,
              weight: 3,
              opacity: 0.7,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        );
      });
    });

    return lines;
  }, [trackData, metroData, visibleLines, getLineColor]);

  // Render static stations
  const stationMarkers = useMemo(() => {
    const stationMap = new Map<string, { lat: number, lon: number, name: string, lines: Set<string>, isMultiLine: boolean }>();

    // Collect all stations from metro data
    Object.entries(metroData).forEach(([lineColor, branches]) => {
      if (!visibleLines.has(lineColor)) return;

      Object.values(branches).forEach((stationList) => {
        (stationList as Station[]).forEach(station => {
          if (!stationMap.has(station.stop_id)) {
            stationMap.set(station.stop_id, {
              lat: station.stop_lat,
              lon: station.stop_lon,
              name: station.stop_name,
              lines: new Set([lineColor]),
              isMultiLine: false
            });
          } else {
            stationMap.get(station.stop_id)!.lines.add(lineColor);
          }
        });
      });
    });

    // Mark multi-line stations
    Object.keys(multiLineStations).forEach(stationId => {
      const station = stationMap.get(stationId);
      if (station) {
        station.isMultiLine = true;
      }
    });

    return Array.from(stationMap.values()).map((station, idx) => (
      <CircleMarker
        key={`station-${idx}`}
        center={[station.lat, station.lon]}
        radius={station.isMultiLine ? 4 : 2.5}
        pathOptions={{
          fillColor: station.isMultiLine ? '#ffd700' : '#ffffff',
          color: station.isMultiLine ? '#fff' : '#333',
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.7
        }}
      >
        <Popup>
          <div>
            <strong>{station.name}</strong><br/>
            Lines: {Array.from(station.lines).join(', ')}<br/>
            {station.isMultiLine && <span style={{color: '#ffd700'}}>⭐ Transfer Station</span>}
          </div>
        </Popup>
      </CircleMarker>
    ));
  }, [metroData, multiLineStations, visibleLines]);

  // Animation loop using requestAnimationFrame
  useEffect(() => {
    if (!animationState.isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      // Update at 15 FPS for smooth animation
      if (timestamp - lastUpdateTimeRef.current >= 67) {
        const positions = calculateTrainPositions(animationState.currentTime);
        setTrainPositions(positions);
        lastUpdateTimeRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationState.isPlaying, animationState.currentTime, calculateTrainPositions]);

  // Initial position calculation
  useEffect(() => {
    const positions = calculateTrainPositions(animationState.currentTime);
    setTrainPositions(positions);
  }, [animationState.currentTime, calculateTrainPositions]);

  return (
    <div className="train-animation-container">
      <MapContainer
        center={[59.3293, 18.0686]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Background map */}
        {showBackgroundMap && (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            opacity={0.7}
          />
        )}

        {/* Draw ALL track branches */}
        {trackPolylines}

        {/* Draw stations */}
        {stationMarkers}

        {/* Draw moving trains */}
        {trainPositions.map((train, index) => (
          <Marker
            key={`train-${train.tripId}-${index}-${train.lat.toFixed(6)}-${train.lon.toFixed(6)}`}
            position={[train.lat, train.lon]}
            icon={createTrainIcon(train.lineColor)}
            zIndexOffset={1000}
          >
            <Popup>
              <div>
                <strong>🚇 Train</strong><br/>
                <div style={{color: getLineColor(train.lineColor)}}>
                  {train.lineColor.toUpperCase()} Line
                </div>
                Direction: {train.direction}<br/>
                {train.currentStop && `At: ${train.currentStop}`}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Info overlay */}
      <div className="animation-info-overlay">
        <div className="info-stat">
          <span className="info-label">🚇 Trains</span>
          <span className="info-value">{trainPositions.length}</span>
        </div>
        <div className="info-stat">
          <span className="info-label">⏱️ Time</span>
          <span className="info-value">{animationState.currentTime.substring(0, 5)}</span>
        </div>
        <div className="info-stat">
          <span className="info-label">⚡ Speed</span>
          <span className="info-value">{animationState.speed}x</span>
        </div>
      </div>
    </div>
  );
};

export default TrainAnimation;
