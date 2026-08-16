"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { SchoolSummary } from "@/lib/types";
import { getComplianceStatus, formatGap, formatPhysicalCapacityGap } from "@/lib/compliance";

const NYC_CENTER: [number, number] = [40.7128, -73.98];

function FitToSchools({ schools }: { schools: SchoolSummary[] }) {
  const map = useMap();
  useEffect(() => {
    if (schools.length === 0) return;
    // The map container's size isn't final on first mount (flex layout still
    // settling), which throws off fitBounds' zoom math -- invalidateSize first.
    map.invalidateSize();
    const bounds = schools.map((s) => [s.lat, s.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [schools, map]);
  return null;
}

/**
 * CircleMarker radii are in screen pixels, so a size that reads well zoomed in
 * turns the whole city into one blob at citywide zoom with ~1,500 schools.
 * Track zoom and scale the dots with it.
 */
function useZoomRadius(): number {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  if (zoom <= 11) return 3.5;
  if (zoom <= 12) return 5;
  if (zoom <= 14) return 6.5;
  return 8;
}

function SchoolMarkers({
  schools,
  highlightedDbn,
}: {
  schools: SchoolSummary[];
  highlightedDbn?: string | null;
}) {
  const radius = useZoomRadius();
  return (
    <>
      {schools.map((s) => {
        const status = getComplianceStatus(s.maxGap);
        const isHighlighted = s.dbn === highlightedDbn;
        return (
          <CircleMarker
            key={s.dbn}
            center={[s.lat, s.lng]}
            radius={isHighlighted ? radius + 4 : radius}
            pathOptions={{
              color: isHighlighted ? "#f4f2fb" : status.color,
              weight: isHighlighted ? 3 : 0.5,
              fillColor: status.color,
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-white">{s.name}</div>
                <div className="text-white/45 text-xs mb-1">
                  {s.dbn} &middot; District {s.district} &middot; {s.borough}
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-white/80">{status.label}</span>
                </div>
                <div className="text-xs text-white/60 mb-2">
                  {s.physicalCapacityCheck
                    ? `${s.worstBand}: ${formatPhysicalCapacityGap(s.physicalCapacityCheck)}`
                    : s.worstBand
                      ? `${s.worstBand}: ${formatGap(s.maxGap)}`
                      : "No class size data"}
                </div>
                <Link
                  href={`/school/${s.dbn}`}
                  className="text-violet-300 hover:text-violet-200 hover:underline text-xs font-medium"
                >
                  View school details →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export default function SchoolMap({
  schools,
  highlightedDbn,
}: {
  schools: SchoolSummary[];
  highlightedDbn?: string | null;
}) {
  return (
    <MapContainer
      center={NYC_CENTER}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FitToSchools schools={schools} />
      <SchoolMarkers schools={schools} highlightedDbn={highlightedDbn} />
    </MapContainer>
  );
}
