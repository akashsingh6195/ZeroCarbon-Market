import { useEffect, useRef } from 'react';
import L from 'leaflet';

const pinIcon = (color = '#1E5B3A') =>
  L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:3px solid #F7F5EE;box-shadow:0 4px 10px rgba(0,0,0,.3)"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });

export const OSM = { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors' };
export const SAT = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
};

export function PinMap({ lat, lon, label, className }: { lat: number; lon: number; label?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView([lat, lon], 9);
    L.tileLayer(OSM.url, { attribution: OSM.attribution, maxZoom: 18 }).addTo(map);
    const m = L.marker([lat, lon], { icon: pinIcon() }).addTo(map);
    if (label) m.bindPopup(label);
    return () => { map.remove(); };
  }, [lat, lon, label]);
  return <div ref={ref} className={className} data-testid="map-listing" />;
}

export type ScanShape = { lat: number; lon: number; polygon: [number, number][] | null };

export function ScanMap({ mode, points, pin, onTap, className }: {
  mode: 'pin' | 'draw'; points: [number, number][]; pin: [number, number] | null; onTap: (lat: number, lon: number) => void; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const tapRef = useRef(onTap);
  tapRef.current = onTap;

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView([14.6, 76.2], 7);
    L.tileLayer(SAT.url, { attribution: SAT.attribution, maxZoom: 18 }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => tapRef.current(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const g = layerRef.current;
    if (!g) return;
    g.clearLayers();
    if (mode === 'pin' && pin) L.marker(pin, { icon: pinIcon('#E9A23B') }).addTo(g);
    if (mode === 'draw' && points.length) {
      points.forEach((p) => L.circleMarker(p, { radius: 6, color: '#F7F5EE', weight: 2, fillColor: '#E9A23B', fillOpacity: 1 }).addTo(g));
      if (points.length >= 2) L.polygon(points, { color: '#E9A23B', weight: 2, fillColor: '#E9A23B', fillOpacity: 0.2 }).addTo(g);
    }
  }, [mode, points, pin]);

  return <div ref={ref} className={className} data-testid="map-scan" />;
}
