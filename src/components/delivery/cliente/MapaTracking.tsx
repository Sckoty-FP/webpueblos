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
  clienteLat:     number;
  clienteLon:     number;
  negocioLat?:    number | null;
  negocioLon?:    number | null;
  repartidorLat?: number | null;
  repartidorLon?: number | null;
}

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize:   [28, 28],
    iconAnchor: [14, 28],
  });
}

export default function MapaTracking({ clienteLat, clienteLon, negocioLat, negocioLon, repartidorLat, repartidorLon }: Props) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const repartidorRef   = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const bounds = L.latLngBounds([[clienteLat, clienteLon]]);
    if (negocioLat && negocioLon) bounds.extend([negocioLat, negocioLon]);
    if (repartidorLat && repartidorLon) bounds.extend([repartidorLat, repartidorLon]);

    const map = L.map(containerRef.current, { zoomControl: false });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // Marcador cliente (naranja)
    L.marker([clienteLat, clienteLon], { icon: makeIcon("#d53b00"), interactive: false }).addTo(map);

    // Marcador negocio (azul)
    if (negocioLat && negocioLon) {
      L.marker([negocioLat, negocioLon], { icon: makeIcon("#0070cc"), interactive: false }).addTo(map);
    }

    // Marcador repartidor (verde)
    if (repartidorLat && repartidorLon) {
      const m = L.marker([repartidorLat, repartidorLon], { icon: makeIcon("#059669") }).addTo(map);
      repartidorRef.current = m;
    }

    map.fitBounds(bounds.pad(0.3));

    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar posición del repartidor en tiempo real
  useEffect(() => {
    if (!mapRef.current) return;
    if (repartidorLat && repartidorLon) {
      if (repartidorRef.current) {
        repartidorRef.current.setLatLng([repartidorLat, repartidorLon]);
      } else {
        repartidorRef.current = L.marker([repartidorLat, repartidorLon], { icon: makeIcon("#059669") })
          .addTo(mapRef.current);
      }
    }
  }, [repartidorLat, repartidorLon]);

  return <div ref={containerRef} style={{ width: "100%", height: "260px", isolation: "isolate" }} />;
}
