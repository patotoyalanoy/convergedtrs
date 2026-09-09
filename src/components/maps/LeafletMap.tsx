import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoLocation } from '@/types';
import { Navigation } from 'lucide-react';

// Fix standard Leaflet icon path issues in bundled React apps
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Props {
  userLocation: GeoLocation;
  siteLocation: { latitude: number; longitude: number; name: string; geofenceRadius: number };
}

export default function LeafletMap({ userLocation, siteLocation }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const siteMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    let isMounted = true;
    if (!mapRef.current || leafletMapRef.current) return;

    const userLat = userLocation.latitude;
    const userLng = userLocation.longitude;
    const siteLat = siteLocation.latitude;
    const siteLng = siteLocation.longitude;

    // Create Leaflet Map instance
    const map = L.map(mapRef.current, {
      center: [userLat, userLng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    leafletMapRef.current = map;

    // Add OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Site Geofence Circle
    L.circle([siteLat, siteLng], {
      color: '#F97316',
      fillColor: '#F97316',
      fillOpacity: 0.15,
      radius: siteLocation.geofenceRadius || 100,
    }).addTo(map);

    // Site Center Marker
    const siteMarker = L.marker([siteLat, siteLng])
      .addTo(map)
      .bindPopup(`<b>${siteLocation.name}</b><br/>Site Radius: ${siteLocation.geofenceRadius}m`);
    siteMarkerRef.current = siteMarker;

    // User Location Marker
    L.marker([userLat, userLng])
      .addTo(map)
      .bindPopup(`
        <b>Your GPS Location</b><br/>
        Lat: <b>${userLat.toFixed(6)}</b><br/>
        Lng: <b>${userLng.toFixed(6)}</b><br/>
        Accuracy: ±${Math.round(userLocation.accuracy)}m
      `);

    // Initial bounds fit
    const bounds = L.latLngBounds([userLat, userLng], [siteLat, siteLng]);
    map.fitBounds(bounds, { padding: [30, 30] });

    // Invalidate size to ensure clean rendering
    const timer = setTimeout(() => {
      if (isMounted && leafletMapRef.current && (leafletMapRef.current as any)._loaded) {
        leafletMapRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.off();
          leafletMapRef.current.remove();
        } catch (e) {
          // ignore cleanup errors during unmount
        }
        leafletMapRef.current = null;
      }
    };
  }, []); // Run once on mount!

  // Smoothly update site popup name without re-initializing the map
  useEffect(() => {
    if (siteMarkerRef.current) {
      siteMarkerRef.current.setPopupContent(`<b>${siteLocation.name}</b><br/>Site Radius: ${siteLocation.geofenceRadius}m`);
    }
  }, [siteLocation.name, siteLocation.geofenceRadius]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-neutral-200 shadow-inner bg-slate-100">
      {/* Leaflet Container */}
      <div ref={mapRef} className="w-full h-full min-h-[220px] z-0" />

      {/* Lat/Lng Badge Overlay */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[400] bg-white px-3 py-1.5 rounded-xl shadow-md border border-neutral-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-mono text-neutral-800 font-bold">
          <Navigation size={13} className="text-primary animate-pulse" />
          <span>Lat: {userLocation.latitude.toFixed(6)}</span>
          <span className="text-neutral-300">|</span>
          <span>Lng: {userLocation.longitude.toFixed(6)}</span>
        </div>
        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-extrabold text-[10px] uppercase border border-emerald-200">
          ±{Math.round(userLocation.accuracy)}m
        </span>
      </div>
    </div>
  );
}
