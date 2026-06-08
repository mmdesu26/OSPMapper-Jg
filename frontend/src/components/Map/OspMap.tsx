'use client';
import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TILE_LAYERS = {
  osm:       'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

const ASSET_STYLE: Record<string, { color: string; radius: number; shape: 'circle'|'square' }> = {
  odc:   { color: '#2563EB', radius: 9,  shape: 'circle' },
  odp:   { color: '#059669', radius: 7,  shape: 'circle' },
  jc:    { color: '#D97706', radius: 6,  shape: 'square' },
  tiang: { color: '#9CA3AF', radius: 4,  shape: 'circle' },
};

const STATUS_COLOR: Record<string, string> = {
  penuh: '#EF4444', kritis: '#F59E0B', maintenance: '#F59E0B', rusak: '#EF4444',
};

const makeIcon = (type: string, status?: string, isSelectedForm?: boolean) => {
  if (isSelectedForm) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.5" />
        <circle cx="12" cy="10" r="3" fill="#FFFFFF" />
      </svg>`;
    return L.divIcon({ html: svg, iconSize: [36, 36], iconAnchor: [18, 36], className: 'bg-transparent border-0' });
  }

  const cfg = ASSET_STYLE[type] || { color: '#6B7280', radius: 5, shape: 'circle' };
  const color = STATUS_COLOR[status || ''] || cfg.color;
  const size  = cfg.radius * 2 + 4;
  const isSquare = cfg.shape === 'square';
  const svg = isSquare
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
         <rect x="2" y="2" width="${size-4}" height="${size-4}" rx="2" fill="${color}" fill-opacity=".2" stroke="${color}" stroke-width="1.5"/>
         <rect x="5" y="5" width="${size-10}" height="${size-10}" rx="1" fill="${color}"/>
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
         <circle cx="${size/2}" cy="${size/2}" r="${cfg.radius}" fill="${color}" fill-opacity=".2" stroke="${color}" stroke-width="1.5"/>
         <circle cx="${size/2}" cy="${size/2}" r="${cfg.radius-3}" fill="${color}"/>
       </svg>`;
  return L.divIcon({ html: svg, iconSize: [size, size], iconAnchor: [size/2, size/2], className: '' });
};

interface Props {
  geoData: any;
  activeLayers: Set<string>;
  mapType: 'osm' | 'satellite';
  onSelectAsset: (f: any) => void;
  onMapClick?: (lat: number, lng: number) => void;
  draftPoints?: { latitude: number; longitude: number }[];
}

export default function OspMap({ geoData, activeLayers, mapType, onSelectAsset, onMapClick, draftPoints = [] }: Props) {
  const mapRef    = useRef<L.Map | null>(null);
  const tileRef   = useRef<L.TileLayer | null>(null);
  const layersRef = useRef<Map<string, L.LayerGroup>>(new Map());
  const draftLayerRef = useRef<L.LayerGroup | null>(null);
  const onMapClickRef = useRef<typeof onMapClick>(onMapClick);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-6.2088, 106.8456],
      zoom: 13,
      zoomControl: false,
    });
    tileRef.current = L.tileLayer(TILE_LAYERS.osm, {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    // Wire up manual zoom buttons
    const ziBtn = document.getElementById('zoom-in');
    const zoBtn = document.getElementById('zoom-out');
    if (ziBtn) ziBtn.onclick = () => map.zoomIn();
    if (zoBtn) zoBtn.onclick = () => map.zoomOut();

    map.on('click', (event: L.LeafletMouseEvent) => {
      onMapClickRef.current?.(event.latlng.lat, event.latlng.lng);
    });

    // Handle initial size rendering issues
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Center map on coordinates when a single point is loaded or changes
  useEffect(() => {
    if (!mapRef.current || !geoData?.features || geoData.features.length !== 1) return;
    const firstFeature = geoData.features[0];
    if (firstFeature.geometry?.type === 'Point') {
      const [lng, lat] = firstFeature.geometry.coordinates;
      if (lat && lng && !Number.isNaN(lat) && !Number.isNaN(lng)) {
        const map = mapRef.current;
        const currentBounds = map.getBounds();
        const latLng = L.latLng(lat, lng);
        if (!currentBounds.contains(latLng)) {
          map.setView(latLng, 15);
        }
      }
    }
  }, [geoData]);

  // Swap tile layer
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return;
    tileRef.current.setUrl(TILE_LAYERS[mapType]);
  }, [mapType]);

  // Render draft route points on the map
  useEffect(() => {
    if (!mapRef.current) return;
    if (!draftLayerRef.current) {
      draftLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    const layer = draftLayerRef.current;
    layer.clearLayers();

    if (draftPoints.length) {
      const latLngs = draftPoints.map((point) => [point.latitude, point.longitude] as [number, number]);
      layer.addLayer(L.polyline(latLngs, {
        color: '#F97316', weight: 4, opacity: 0.8, dashArray: '8,6', lineCap: 'round', lineJoin: 'round', interactive: false,
      }));
      draftPoints.forEach((point) => {
        layer.addLayer(L.circleMarker([point.latitude, point.longitude], {
          radius: 5, fillColor: '#F97316', fillOpacity: 1, color: '#fff', weight: 2,
        }));
      });
    }
  }, [draftPoints]);

  // Render features
  useEffect(() => {
    if (!mapRef.current || !geoData?.features) return;
    const map = mapRef.current;

    // Clear existing layers
    layersRef.current.forEach(lg => lg.clearLayers());

    const groups: Record<string, L.LayerGroup> = {};
    const ensure = (key: string) => {
      if (!groups[key]) {
        groups[key] = layersRef.current.get(key) || L.layerGroup();
        if (!layersRef.current.has(key)) {
          layersRef.current.set(key, groups[key]);
          groups[key].addTo(map);
        }
      }
      return groups[key];
    };

    const isSingleFeature = geoData.features.length === 1;

    geoData.features.forEach((f: any) => {
      const p    = f.properties;
      const type = p.asset_type;

      if (f.geometry.type === 'LineString') {
        const points = f.geometry.coordinates.map((coord: any) => [coord[1], coord[0]]);
        const line = L.polyline(points, {
          color: p.warna_kabel || '#7C3AED', weight: 3, opacity: 0.85, dashArray: '6,6', lineJoin: 'round', lineCap: 'round', interactive: true,
        });
        line.on('click', () => onSelectAsset(f));
        const group = ensure('kabel');
        group.addLayer(line);
        return;
      }

      const [lng, lat] = f.geometry.coordinates;
      if (type === 'tiang') {
        const marker = L.circleMarker([lat, lng], {
          radius: 3, fillColor: '#9CA3AF', fillOpacity: 0.9,
          color: '#fff', weight: 1,
        });
        marker.on('click', () => onSelectAsset(f));
        ensure('tiang').addLayer(marker);
      } else {
        const marker = L.marker([lat, lng], { icon: makeIcon(type, p.status, isSingleFeature) });
        const popupHtml = `
          <div style="font-size:12px;min-width:140px">
            <div style="font-weight:600;margin-bottom:4px;color:#111">${p.kode}</div>
            <div style="color:#6b7280;margin-bottom:2px;text-transform:capitalize">${type}</div>
            ${p.status ? `<span style="background:${STATUS_COLOR[p.status]||'#EFF6FF'};color:${STATUS_COLOR[p.status]?'#fff':'#1D4ED8'};padding:1px 6px;border-radius:4px;font-size:10px">${p.status}</span>` : ''}
            ${p.kapasitas_port ? `<div style="margin-top:4px;color:#374151">Port: ${p.port_terpakai}/${p.kapasitas_port}</div>` : ''}
          </div>`;
        marker.bindPopup(popupHtml, { maxWidth: 200, closeButton: false });
        marker.on('click', () => { onSelectAsset(f); marker.openPopup(); });
        ensure(type).addLayer(marker);
      }
    });

    layersRef.current.forEach((lg, key) => {
      if (activeLayers.has(key)) {
        if (!map.hasLayer(lg)) lg.addTo(map);
      } else if (map.hasLayer(lg)) {
        lg.remove();
      }
    });
  }, [geoData, onSelectAsset, activeLayers]);

  // Toggle layer visibility
  useEffect(() => {
    if (!mapRef.current) return;
    layersRef.current.forEach((lg, key) => {
      if (activeLayers.has(key)) { if (!mapRef.current!.hasLayer(lg)) lg.addTo(mapRef.current!); }
      else { if (mapRef.current!.hasLayer(lg)) lg.remove(); }
    });
  }, [activeLayers]);

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: 400 }} />;
}
