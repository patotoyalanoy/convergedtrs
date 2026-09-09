import { useEffect, useRef } from 'react';

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  siteName?: string;
  locationName?: string;
  distanceFromSite?: number | null;
}

export default function AdminRecordMap({ latitude, longitude, siteName, locationName, distanceFromSite }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  const lat = latitude && latitude !== 0 ? latitude : 14.5547;
  const lng = longitude && longitude !== 0 ? longitude : 121.0244;
  const hasCoords = !!(latitude && longitude && latitude !== 0 && longitude !== 0);

  useEffect(() => {
    let isMounted = true;
    if (!mapRef.current) return;

    // Clean up previous map if exists
    if (leafletMapRef.current) {
      try {
        leafletMapRef.current.off();
        leafletMapRef.current.remove();
      } catch (e) {}
      leafletMapRef.current = null;
    }

    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current || !isMounted) return;

      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      if (hasCoords) {
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px;">
              <b>${locationName || siteName || 'Attendance GPS Position'}</b><br/>
              Lat: <b>${lat.toFixed(5)}</b><br/>
              Lng: <b>${lng.toFixed(5)}</b>
              ${distanceFromSite !== undefined && distanceFromSite !== null ? `<br/>Dist from Site: <b>${Math.round(distanceFromSite)}m</b>` : ''}
            </div>
          `)
          .openPopup();
      } else {
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`<b>Default Location (No GPS recorded)</b>`);
      }

      setTimeout(() => {
        if (isMounted && leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 300);
    });

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.off();
          leafletMapRef.current.remove();
        } catch (e) {}
        leafletMapRef.current = null;
      }
    };
  }, [lat, lng, hasCoords, siteName, locationName, distanceFromSite]);

  return (
    <div className="w-full h-[200px] rounded-xl overflow-hidden border border-neutral-200 shadow-xs relative bg-slate-100">
      <div ref={mapRef} className="w-full h-full z-0" />
      <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-none px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-neutral-700 border border-neutral-300 shadow-xs">
        📍 {hasCoords ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'No GPS Data Recorded'}
      </div>
    </div>
  );
}
