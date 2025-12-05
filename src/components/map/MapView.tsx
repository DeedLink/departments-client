import { type ReactNode } from "react";
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
  if (coords.length > 0) {
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [50, 50] });
  }
  return null;
};

const MapView = ({ center, zoom, children, className = "h-full w-full", bounds }: MapViewProps) => {
  return (
    <div className="relative w-full h-full">
      <style>{`
        .leaflet-container {
          z-index: 0;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 1000;
        }
        .leaflet-popup {
          z-index: 2000;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .custom-plan-marker {
          background: transparent !important;
          border: none !important;
        }
        .plan-popup .leaflet-popup-content {
          margin: 12px;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className={className}
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

