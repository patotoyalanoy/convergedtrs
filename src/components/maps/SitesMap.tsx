import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

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
  const mapRef        = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Destroy previous map instance
    if (leafletMapRef.current) {
      try { leafletMapRef.current.off(); leafletMapRef.current.remove(); } catch (_) {}
      leafletMapRef.current = null;
    }

    if (!mapRef.current) return;

    /** Build the Leaflet map once we have a center coordinate */
    const buildMap = (centerLat: number, centerLng: number) => {
      if (!mapRef.current || !isMounted) return;

      import('leaflet').then((L) => {
        import('leaflet/dist/leaflet.css');

        if (!mapRef.current || !isMounted) return;

        // Fix default icon paths
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const map = L.map(mapRef.current, {
          center: [centerLat, centerLng],
          zoom: sites.length > 0 ? 12 : 15,
          zoomControl: true,
          scrollWheelZoom: false,
        });
        leafletMapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const bounds: [number, number][] = [];

        sites.forEach((site) => {
          // Skip sites without valid real GPS coordinates
          if (!site.lat || !site.lng || site.lat === 0 || site.lng === 0) return;
          bounds.push([site.lat, site.lng]);

          // Geofence circle
          L.circle([site.lat, site.lng], {
            color:       '#F97316',
            fillColor:   '#F97316',
            fillOpacity: 0.18,
            weight:      2,
            radius:      site.radius || 100,
          }).addTo(map);

          // Pin marker with popup
          const marker = L.marker([site.lat, site.lng])
            .addTo(map)
            .bindPopup(`
              <div style="font-family:sans-serif;font-size:12px;padding:2px;min-width:160px">
                <b style="font-size:13px;color:#1e293b">${site.name}</b><br/>
                <span style="color:#64748b">Geofence: <b>${site.radius} m</b></span><br/>
                <span style="color:#94a3b8;font-family:monospace;font-size:11px">
                  ${site.lat.toFixed(6)}, ${site.lng.toFixed(6)}
                </span>
              </div>
            `);

          if (onSelectSite) {
            marker.on('click', () => onSelectSite(site));
          }
        });

        // Fit map to show all site markers
        if (bounds.length > 1) {
          map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 15);
        }

        // Force tile refresh after container renders
        setTimeout(() => {
          if (isMounted && leafletMapRef.current) {
            leafletMapRef.current.invalidateSize();
          }
        }, 300);
      });
    };

    if (sites.length > 0) {
      // ── Sites exist: centre on first site, fitBounds handles the rest
      buildMap(sites[0].lat, sites[0].lng);
    } else {
      // ── No sites yet: use browser GPS for the centre
      if ('geolocation' in navigator) {
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!isMounted) return;
            setLocating(false);
            buildMap(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            // Permission denied or unavailable — use Philippines centre as fallback
            if (!isMounted) return;
            setLocating(false);
            buildMap(12.8797, 121.7740); // geographic center of the Philippines
          },
          { timeout: 8000 }
        );
      } else {
        buildMap(12.8797, 121.7740);
      }
    }

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        try { leafletMapRef.current.off(); leafletMapRef.current.remove(); } catch (_) {}
        leafletMapRef.current = null;
      }
    };
  }, [sites]);

  return (
    <div className="w-full h-[340px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-100">
      {/* Loading overlay while acquiring GPS */}
      {locating && (
        <div className="absolute inset-0 z-[500] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-xs font-bold text-slate-600">Acquiring your location…</p>
        </div>
      )}

      {/* Leaflet container */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Badge */}
      <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold text-navy-900 shadow-sm border border-slate-200 flex items-center gap-1.5">
        📍 {sites.length} Active Site{sites.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
