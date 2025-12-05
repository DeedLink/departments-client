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
}

const FitBounds: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
};

const MapView = ({ center, zoom, children, className = "h-full w-full", bounds }: MapViewProps) => {
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
        scrollWheelZoom={true}
        className={className}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {bounds && bounds.length > 0 && <FitBounds coords={bounds} />}
        {children}
      </MapContainer>
    </div>
  );
};

export default MapView;

