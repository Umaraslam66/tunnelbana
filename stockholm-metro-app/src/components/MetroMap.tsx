import React, { useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { MetroData, MultiLineStations, Station } from '../types/metro';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface MetroMapProps {
  metroData: MetroData;
  multiLineStations: MultiLineStations;
  visibleLines: Set<string>;
  showBackgroundMap: boolean;
}

interface ProcessedStation {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  lines: Set<string>;
  isMultiLine: boolean;
}

const MetroMap: React.FC<MetroMapProps> = ({
  metroData,
  multiLineStations,
  visibleLines,
  showBackgroundMap
}) => {
  // Memoized line color function
  const getLineColor = useCallback((line: string) => {
    const colors = {
      'blue': '#2196f3',
      'red': '#ff5252',
      'green': '#66bb6a'
    };
    return colors[line as keyof typeof colors] || '#666';
  }, []);

  // Memoized station processing
  const { allStations, allConnections, endStations } = useMemo(() => {
    const stations = new Map<string, ProcessedStation>();
    const connections: any[] = [];
    const endStationIds = new Set<string>();

    // Process each line
    Object.entries(metroData).forEach(([lineColor, directions]) => {
      if (!visibleLines.has(lineColor)) return;

      Object.entries(directions).forEach(([directionName, stationList]) => {
        const routeStations = stationList as Station[];
        
        // Mark first and last stations as end stations
        if (routeStations.length > 0) {
          endStationIds.add(routeStations[0].stop_id);
          endStationIds.add(routeStations[routeStations.length - 1].stop_id);
        }

        routeStations.forEach((station: Station, index: number) => {
          if (!stations.has(station.stop_id)) {
            stations.set(station.stop_id, {
              stop_id: station.stop_id,
              stop_name: station.stop_name,
              stop_lat: station.stop_lat,
              stop_lon: station.stop_lon,
              lines: new Set([lineColor]),
              isMultiLine: false
            });
          } else {
            const existingStation = stations.get(station.stop_id);
            if (existingStation) {
              existingStation.lines.add(lineColor);
            }
          }

          // Create connections
          if (index < routeStations.length - 1) {
            connections.push({
              source: station.stop_id,
              target: routeStations[index + 1].stop_id,
              line: lineColor,
              direction: directionName
            });
          }
        });
      });
    });

    // Mark multi-line stations
    Object.keys(multiLineStations).forEach(stationId => {
      if (stations.has(stationId)) {
        const station = stations.get(stationId);
        if (station) {
          station.isMultiLine = true;
          station.lines = new Set(multiLineStations[stationId].lines);
        }
      }
    });

    return { allStations: stations, allConnections: connections, endStations: endStationIds };
  }, [metroData, multiLineStations, visibleLines]);

  const getStationColor = useCallback((station: ProcessedStation) => {
    if (station.isMultiLine) return '#ffd700';
    const lineColors = Array.from(station.lines);
    return getLineColor(lineColors[0]);
  }, [getLineColor]);

  const getStationRadius = useCallback((station: ProcessedStation) => {
    return station.isMultiLine ? 8 : 5;
  }, []);


  return (
    <MapContainer
      center={[59.3293, 18.0686]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
        {showBackgroundMap && (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            opacity={0.7}
          />
        )}

      {/* Draw connections */}
      {allConnections.map((connection, index) => {
        const source = allStations.get(connection.source);
        const target = allStations.get(connection.target);
        
        if (!source || !target || !visibleLines.has(connection.line)) return null;

        return (
          <Polyline
            key={`connection-${index}`}
            positions={[
              [source.stop_lat, source.stop_lon],
              [target.stop_lat, target.stop_lon]
            ]}
            color={getLineColor(connection.line)}
            weight={4}
            opacity={0.8}
          />
        );
      })}

      {/* Draw stations */}
      {Array.from(allStations.values()).map((station) => {
        const isVisible = Array.from(station.lines).some((line: string) => visibleLines.has(line));
        if (!isVisible) return null;
        
        const isEndStation = endStations.has(station.stop_id);

        return (
          <React.Fragment key={station.stop_id}>
            <CircleMarker
              center={[station.stop_lat, station.stop_lon]}
              radius={getStationRadius(station)}
              pathOptions={{
                fillColor: getStationColor(station),
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
              }}
            >
              <Popup>
                <div>
                  <strong>{station.stop_name}</strong><br/>
                  Lines: {Array.from(station.lines).join(', ')}<br/>
                  {station.isMultiLine ? 'Transfer Station' : 'Regular Station'}
                </div>
              </Popup>
              
              {/* Show tooltip only for end stations */}
              {isEndStation && (
                <Tooltip 
                  permanent 
                  direction="top" 
                  className="station-label"
                  offset={[0, -10]}
                >
                  {station.stop_name}
                </Tooltip>
              )}
            </CircleMarker>

          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};

export default MetroMap;