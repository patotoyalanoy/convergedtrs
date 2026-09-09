import { useEffect, useRef } from 'react';

interface SiteItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

interface Props {
  sites: SiteItem[];
  onSelectSite?: (site: SiteItem) => void;
}

export default function SitesMap({ sites, onSelectSite }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    if (!mapRef.current) return;

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

      const defaultCenter: [number, number] = sites.length > 0
        ? [sites[0].lat, sites[0].lng]
        : [14.5547, 121.0244];

      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const bounds: [number, number][] = [];

      sites.forEach((site) => {
        if (site.lat && site.lng) {
          bounds.push([site.lat, site.lng]);

          // Geofence Circle
          L.circle([site.lat, site.lng], {
            color: '#F97316',
            fillColor: '#F97316',
            fillOpacity: 0.2,
            radius: site.radius || 100,
          }).addTo(map);

          // Marker
          const marker = L.marker([site.lat, site.lng])
            .addTo(map)
            .bindPopup(`
              <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
                <b style="font-size: 13px; color: #1e293b;">${site.name}</b><br/>
                <span style="color: #64748b;">Geofence Radius: <b>${site.radius}m</b></span><br/>
                <span style="color: #94a3b8; font-family: monospace;">${site.lat.toFixed(5)}, ${site.lng.toFixed(5)}</span>
              </div>
            `);

          if (onSelectSite) {
            marker.on('click', () => onSelectSite(site));
          }
        }
      });

      if (bounds.length > 1) {
        map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 14);
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
  }, [sites]);

  return (
    <div className="w-full h-[320px] rounded-2xl overflow-hidden border border-neutral-200 shadow-sm relative bg-slate-100">
      <div ref={mapRef} className="w-full h-full z-0" />
      <div className="absolute top-3 right-3 z-[400] bg-white/90 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-700 shadow-xs border border-neutral-200">
        📍 {sites.length} Active Site Geofences
      </div>
    </div>
  );
}
