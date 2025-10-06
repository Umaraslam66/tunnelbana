export interface TrainPosition {
  tripId: string;
  lineColor: string;
  direction: string;
  trackId: string;
  currentStop?: string;
  nextStop?: string;
  lat: number;
  lon: number;
  progress?: number; // 0-1 between current and next stop
  time: number; // seconds since midnight
}

export interface AnimationPosition {
  time: number; // seconds since midnight
  lat: number;
  lon: number;
  stop_name: string | null;
}

export interface AnimationTrip {
  trip_id: string;
  route_id: string;
  line_color: string;
  direction: string;
  direction_id?: number;
  direction_str?: string;
  track_id: string;
  trip_headsign: string;
  stops: AnimationStop[];
  positions: AnimationPosition[];
  start_time: string;
  end_time: string;
}

export interface AnimationStop {
  stop_id: string;
  stop_name: string;
  lat: number;
  lon: number;
  arrival_time: string;
  departure_time: string;
  sequence: number;
}

export interface AnimationData {
  metadata: {
    extraction_time: string;
    time_range: string;
    total_trips: number;
    interpolation_interval?: string;
    description?: string;
  };
  trips: AnimationTrip[];
}

export interface AnimationState {
  isPlaying: boolean;
  speed: number; // 1x, 2x, 4x, 8x
  currentTime: string; // Current simulation time
  startTime: string; // 07:00:00
  endTime: string; // 10:00:00
  progress: number; // 0-1
}

export interface AnimationControls {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
}
