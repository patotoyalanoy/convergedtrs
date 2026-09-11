import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoLocation } from '@/types';
import { Navigation, Crosshair } from 'lucide-react';
import { calculateDistance } from '@/lib/geolocation/haversine';

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

  // Function to recenter map directly on user location
  const handleRecenter = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([userLocation.latitude, userLocation.longitude], 16, {
        animate: true,
      });
    }
  };

  // Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    let isMounted = true;
    if (!mapRef.current || leafletMapRef.current) return;

    const userLat = userLocation.latitude;
    const userLng = userLocation.longitude;
    const siteLat = siteLocation.latitude;
    const siteLng = siteLocation.longitude;

    const distance = calculateDistance(userLat, userLng, siteLat, siteLng);

    // Create Leaflet Map instance centered on user
    const map = L.map(mapRef.current, {
      center: [userLat, userLng],
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    leafletMapRef.current = map;

    // Add OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // User Location Circle (Pulse) & Marker
    L.circle([userLat, userLng], {
      color: '#0EA5E9',
      fillColor: '#0EA5E9',
      fillOpacity: 0.2,
      radius: Math.max(userLocation.accuracy || 30, 20),
    }).addTo(map);

    L.marker([userLat, userLng])
      .addTo(map)
      .bindPopup(`
        <b>Your GPS Location</b><br/>
        Lat: <b>${userLat.toFixed(6)}</b><br/>
        Lng: <b>${userLng.toFixed(6)}</b><br/>
        Accuracy: ±${Math.round(userLocation.accuracy)}m
      `)
      .openPopup();

    // Site Geofence Circle & Marker
    L.circle([siteLat, siteLng], {
      color: '#F97316',
      fillColor: '#F97316',
      fillOpacity: 0.15,
      radius: siteLocation.geofenceRadius || 100,
    }).addTo(map);

    const siteMarker = L.marker([siteLat, siteLng])
      .addTo(map)
      .bindPopup(`<b>${siteLocation.name}</b><br/>Site Radius: ${siteLocation.geofenceRadius}m`);
    siteMarkerRef.current = siteMarker;

    // Smart Bounds: If user & site are close (< 10km), fit both markers. Otherwise, focus on User Location!
    if (distance <= 10000) {
      const bounds = L.latLngBounds([userLat, userLng], [siteLat, siteLng]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else {
      map.setView([userLat, userLng], 16);
    }

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

      {/* Recenter on My Location Floating Button */}
      <button
        onClick={handleRecenter}
        className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-md text-slate-700 hover:text-primary p-2.5 rounded-xl shadow-md border border-neutral-200 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        title="Recenter Map on My Location"
      >
        <Crosshair size={16} className="text-primary" />
        <span>My Location</span>
      </button>

      {/* Lat/Lng Badge Overlay */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-neutral-200 flex items-center justify-between text-xs">
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
