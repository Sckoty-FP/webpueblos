"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet marker icons con webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Props {
  lat:          number;
  lon:          number;
  negocioLat?:  number | null;
  negocioLon?:  number | null;
  onMarkerMove: (lat: number, lon: number) => void;
}

export default function MapaDireccion({ lat, lon, negocioLat, negocioLon, onMarkerMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markerRef    = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true }).setView([lat, lon], 15);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // Marcador del negocio (fijo, azul)
    if (negocioLat && negocioLon) {
      const negocioIcon = L.divIcon({
        className: "",
        html: `<div style="width:32px;height:32px;background:#0070cc;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
        iconSize:   [32, 32],
        iconAnchor: [16, 32],
      });
      L.marker([negocioLat, negocioLon], { icon: negocioIcon, interactive: false }).addTo(map);
    }

    // Marcador arrastrable del cliente (naranja)
    const clienteIcon = L.divIcon({
      className: "",
      html: `<div style="width:32px;height:32px;background:#d53b00;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
      iconSize:   [32, 32],
      iconAnchor: [16, 32],
    });
    const marker = L.marker([lat, lon], { draggable: true, icon: clienteIcon }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const { lat: newLat, lng: newLon } = marker.getLatLng();
      onMarkerMove(newLat, newLon);
    });

    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar marcador cuando cambia lat/lon desde fuera (sin recrear el mapa)
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
      mapRef.current?.setView([lat, lon], mapRef.current.getZoom());
    }
  }, [lat, lon]);

  return <div ref={containerRef} style={{ width: "100%", height: "220px", borderRadius: "16px", overflow: "hidden", isolation: "isolate" }} />;
}
