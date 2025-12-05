import React from "react";
import { Polygon, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Plan } from "../../types/plan";

interface PlanMarkerProps {
  plan: Plan;
  color?: string;
  onPlanClick?: (plan: Plan) => void;
}

const PlanMarker = ({ plan, color = "#10b981", onPlanClick }: PlanMarkerProps) => {
  if (!plan.coordinates || plan.coordinates.length < 3) return null;

  const coords = plan.coordinates.map((coord) => [coord.latitude, coord.longitude] as [number, number]);
  
  const centerLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length;
  const centerLng = coords.reduce((sum, [, lng]) => sum + lng, 0) / coords.length;

  const planLabel = plan.planId || plan.deedNumber;
  const shortLabel = planLabel.length > 15 ? planLabel.substring(0, 13) + '...' : planLabel;
  
  const markerIcon = L.divIcon({
    className: "custom-plan-marker",
    html: `<div style="background-color: ${color}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); text-align: center; white-space: nowrap; pointer-events: auto; text-shadow: 0 1px 2px rgba(0,0,0,0.3); line-height: 1.2;">${shortLabel}</div>`,
    iconSize: [120, 40],
    iconAnchor: [60, 20],
  });

  const handleClick = (e: L.LeafletMouseEvent) => {
    e.originalEvent.stopPropagation();
    onPlanClick?.(plan);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlanClick?.(plan);
  };

  return (
    <>
      <Polygon
        positions={coords}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 2.5,
        }}
        eventHandlers={{
          click: handleClick,
        }}
      />
      <Marker
        position={[centerLat, centerLng]}
        icon={markerIcon}
        zIndexOffset={1000}
        eventHandlers={{
          click: handleClick,
        }}
      >
        <Popup className="plan-popup" maxWidth={280} closeButton={true}>
          <div className="text-sm">
            <div className="font-semibold text-gray-900 mb-2">Plan: {plan.planId || plan.deedNumber}</div>
            <div className="text-xs text-gray-600 mb-1">Deed: {plan.deedNumber}</div>
            {plan.areaSize && (
              <div className="text-xs text-gray-600 mb-1">
                Area: {plan.areaSize} {plan.areaType}
              </div>
            )}
            {plan.status && (
              <div className="text-xs text-gray-600 capitalize mb-2">Status: {plan.status}</div>
            )}
            <button
              onClick={handleButtonClick}
              className="w-full mt-2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
            >
              View Full Details
            </button>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default PlanMarker;

