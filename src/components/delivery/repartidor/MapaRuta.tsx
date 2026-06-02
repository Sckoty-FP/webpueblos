"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Props {
  origen:           { lat: number; lon: number } | null;
  destino:          { lat: number; lon: number };
  ruta:             { geometry: GeoJSON.LineString } | null;
  nombreDestino:    string;
  direccionDestino: string;
}

function makeIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative">
        <div style="width:32px;height:32px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>
        <div style="position:absolute;top:4px;left:0;width:32px;text-align:center;color:#fff;font-size:11px;font-weight:700;font-family:Barlow,sans-serif;transform:rotate(0)">${label}</div>
      </div>
    `,
    iconSize:   [32, 40],
    iconAnchor: [16, 40],
  });
}

export default function MapaRuta({ origen, destino, ruta }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const bounds = L.latLngBounds([[destino.lat, destino.lon]]);
    if (origen) bounds.extend([origen.lat, origen.lon]);

    const map = L.map(containerRef.current, { zoomControl: true });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // Marcador destino (cliente) — naranja
    L.marker([destino.lat, destino.lon], { icon: makeIcon("#f97316", "2") }).addTo(map);

    // Marcador origen (negocio) — negro
    if (origen) {
      L.marker([origen.lat, origen.lon], { icon: makeIcon("#0a0a0a", "1") }).addTo(map);
    }

    // Polilínea de ruta
    if (ruta?.geometry?.coordinates) {
      const coords = ruta.geometry.coordinates.map(
        ([lon, lat]) => [lat, lon] as [number, number],
      );
      L.polyline(coords, {
        color:     "#0070cc",
        weight:    5,
        opacity:   0.85,
        lineJoin:  "round",
        lineCap:   "round",
      }).addTo(map);
    }

    map.fitBounds(bounds.pad(0.25));

    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: "100dvh" }} />;
}
