export interface Station {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  sequence: number;
}

export interface MetroLine {
  [direction: string]: Station[];
}

export interface MetroData {
  blue: MetroLine;
  red: MetroLine;
  green: MetroLine;
}

export interface MultiLineStation {
  name: string;
  lat: number;
  lon: number;
  lines: string[];
}

export interface MultiLineStations {
  [stationId: string]: MultiLineStation;
}

export interface TrackCoordinate {
  lat: number;
  lon: number;
  stop_id: string;
  stop_name: string;
  sequence: number;
}

export interface TrackData {
  metadata: {
    description: string;
    base_offset_degrees: number;
    approximate_offset_meters: number;
    tracks_per_direction: number;
  };
  lines: {
    [lineColor: string]: {
      [trackId: string]: TrackCoordinate[];
    };
  };
}

