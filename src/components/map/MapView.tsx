import { type ReactNode, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapViewProps {
  center: [number, number];
  zoom: number;
  children: ReactNode;
  className?: string;
  bounds?: [number, number][];
  minZoom?: number;
  maxZoom?: number;
}

const FitBounds: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = ne.lat - sw.lat;
      const lngDiff = ne.lng - sw.lng;
      const avgLat = (ne.lat + sw.lat) / 2;
      const latMeters = latDiff * 111320;
      const lngMeters = lngDiff * 111320 * Math.cos(avgLat * Math.PI / 180);
      const diagonalMeters = Math.sqrt(latMeters * latMeters + lngMeters * lngMeters);
      
      let padding: [number, number];
      let maxZoom: number;
      
      if (diagonalMeters < 10) {
        padding = [120, 120];
        maxZoom = 24;
      } else if (diagonalMeters < 50) {
        padding = [100, 100];
        maxZoom = 23;
      } else if (diagonalMeters < 200) {
        padding = [80, 80];
        maxZoom = 22;
      } else if (diagonalMeters < 1000) {
        padding = [60, 60];
        maxZoom = 21;
      } else {
        padding = [50, 50];
        maxZoom = 20;
      }
      
      map.fitBounds(bounds, { padding, maxZoom });
    }
  }, [coords, map]);
  return null;
};

const MapView = ({ center, zoom, children, className = "h-full w-full", bounds, minZoom = 3, maxZoom = 24 }: MapViewProps) => {
  return (
    <div className="relative w-full h-full">
      <style>{`
        .leaflet-container {
          z-index: 0;
          font-family: inherit;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 1000;
        }
        .leaflet-control {
          z-index: 1000;
        }
        .leaflet-popup {
          z-index: 2000;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .custom-plan-marker {
          background: transparent !important;
          border: none !important;
        }
        .plan-popup .leaflet-popup-content {
          padding: 12px;
        }
        .leaflet-popup-close-button {
          padding: 4px 8px;
          font-size: 18px;
          color: #6b7280;
        }
        .leaflet-popup-close-button:hover {
          color: #1f2937;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        scrollWheelZoom={true}
        className={className}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={24}
          maxNativeZoom={19}
        />
        {bounds && bounds.length > 0 && <FitBounds coords={bounds} />}
        {children}
      </MapContainer>
    </div>
  );
};

export default MapView;

