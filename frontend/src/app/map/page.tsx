'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mapApi, kabelApi, siteApi, odpApi, odcApi } from '@/lib/api';
import {
  Layers,
  Search,
  X,
  RefreshCw,
  Plus,
  Upload,
  Download,
  Undo2,
  RotateCcw,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

const OspMap = dynamic(() => import('@/components/Map/OspMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-zinc-950">
      <div className="text-sm text-gray-400">Memuat peta...</div>
    </div>
  ),
});

const LAYERS = [
  { key: 'odc', label: 'ODC', color: '#2563EB' },
  { key: 'odp', label: 'ODP', color: '#059669' },
  { key: 'jc', label: 'Joint Closure', color: '#D97706' },
  { key: 'tiang', label: 'Tiang / Pole', color: '#6B7280' },
  { key: 'kabel', label: 'Jalur Kabel', color: '#7C3AED' },
];

const initialCableForm = {
  kode_kabel: '',
  nama_kabel: '',
  site_id: '',
  jenis_kabel: 'FO',
  jumlah_core: 12,
  tube_core: 4,
  core_terpakai: 0,
  panjang_meter: 0,
  harga_per_meter: 0,
  source_type: 'odc',
  source_id: '',
  dest_type: 'odp',
  dest_id: '',
  warna_kabel: '#2563EB',
  route_points: '[]',
  status: 'aktif',
  catatan: '',
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function MapPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeLayers, setActiveLayers] = useState<Set<string>>(
    new Set(['odc', 'odp', 'jc', 'tiang', 'kabel'])
  );

  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [rightOpen, setRightOpen] = useState(true);
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm');

  const [drawingCable, setDrawingCable] = useState(false);
  const [draftPoints, setDraftPoints] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  const [showCableForm, setShowCableForm] = useState(false);
  const [cableForm, setCableForm] = useState(initialCableForm);

  const { data: siteList } = useQuery({
    queryKey: ['site-options'],
    queryFn: () => siteApi.list({ limit: 1000 }),
  });

  const { data: odpList } = useQuery({
    queryKey: ['odp-options'],
    queryFn: () => odpApi.list({ limit: 1000 }),
  });

  const { data: odcList } = useQuery({
    queryKey: ['odc-options'],
    queryFn: () => odcApi.list({ limit: 1000 }),
  });

  const { data: geoData, isLoading } = useQuery({
    queryKey: ['map-assets'],
    queryFn: mapApi.assets,
    refetchInterval: 60_000,
  });

  const getAssetOptions = (type: string) => {
    if (type === 'odp') return odpList?.data || [];
    if (type === 'odc') return odcList?.data || [];
    return [];
  };

  const getAssetLabel = (item: any, type: string) => {
    if (type === 'odp') {
      return item.kode_odp || item.nama_odp || item.nama || item.id;
    }

    if (type === 'odc') {
      return item.kode_odc || item.nama_odc || item.nama || item.id;
    }

    return item.nama || item.kode || item.id;
  };

  const haversine = (
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number }
  ) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000;

    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);

    const aa =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  };

  const calculateRouteLength = (
    points: { latitude: number; longitude: number }[]
  ) => {
    if (points.length < 2) return 0;

    let total = 0;

    for (let i = 1; i < points.length; i++) {
      total += haversine(points[i - 1], points[i]);
    }

    return Number(total.toFixed(2));
  };

  useEffect(() => {
    const panjangMeter = calculateRouteLength(draftPoints);

    setCableForm((prev) => ({
      ...prev,
      panjang_meter: panjangMeter,
      route_points: JSON.stringify(draftPoints, null, 2),
    }));
  }, [draftPoints]);

  const previewGeoData = useMemo(() => {
    const baseFeatures = geoData?.features || [];
    const draftFeatures: any[] = [];

    if (draftPoints.length > 0) {
      draftPoints.forEach((point, index) => {
        draftFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.longitude, point.latitude],
          },
          properties: {
            asset_type: 'kabel',
            kode: `Titik ${index + 1}`,
            status: 'draft',
            is_draft: true,
          },
        });
      });
    }

    if (draftPoints.length >= 2) {
      draftFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: draftPoints.map((point) => [
            point.longitude,
            point.latitude,
          ]),
        },
        properties: {
          asset_type: 'kabel',
          kode: cableForm.kode_kabel || 'Draft Jalur Kabel',
          status: 'draft',
          is_draft: true,
          warna: cableForm.warna_kabel || '#2563EB',
        },
      });
    }

    return {
      type: 'FeatureCollection',
      features: [...baseFeatures, ...draftFeatures],
    };
  }, [geoData, draftPoints, cableForm.kode_kabel, cableForm.warna_kabel]);

  const handleStartCable = () => {
    setDraftPoints([]);
    setCableForm(initialCableForm);
    setDrawingCable(true);
    setShowCableForm(false);
    toast.success('Mode gambar jalur aktif. Klik peta untuk menambah titik.');
  };

  const handleCancelMode = () => {
    setDrawingCable(false);
    setDraftPoints([]);
    setShowCableForm(false);
    setCableForm(initialCableForm);
    toast('Mode gambar jalur dibatalkan.');
  };

  const handleUndoPoint = () => {
    setDraftPoints((prev) => prev.slice(0, -1));
  };

  const handleResetPoints = () => {
    setDraftPoints([]);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!drawingCable) return;

    const point = {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
    };

    setDraftPoints((prev) => [...prev, point]);
  };

  const openCableForm = () => {
    if (draftPoints.length < 2) {
      toast.error('Minimal pilih 2 titik untuk membuat jalur kabel.');
      return;
    }

    const panjangMeter = calculateRouteLength(draftPoints);

    setCableForm((prev) => ({
      ...prev,
      panjang_meter: panjangMeter,
      route_points: JSON.stringify(draftPoints, null, 2),
    }));

    setShowCableForm(true);
  };

  const handleExport = () => {
    if (!geoData) return;

    const blob = new Blob([JSON.stringify(geoData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'osp-assets.json';
    a.click();

    URL.revokeObjectURL(url);
    toast.success('Data peta diekspor');
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed?.features) {
        throw new Error('Format GeoJSON tidak valid');
      }

      qc.setQueryData(['map-assets'], parsed);
      toast.success('Data peta berhasil diimpor');
    } catch {
      toast.error('File JSON tidak valid');
    }
  };

  const createCableMut = useMutation({
    mutationFn: (data: any) => kabelApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['map-assets'] });
      qc.invalidateQueries({ queryKey: ['kabel'] });

      setShowCableForm(false);
      setDrawingCable(false);
      setDraftPoints([]);
      setCableForm(initialCableForm);

      toast.success('Jalur kabel berhasil dibuat dan masuk ke menu Kabel.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal membuat jalur kabel');
    },
  });

  const handleCreateCable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (Number(cableForm.core_terpakai) > Number(cableForm.jumlah_core)) {
      toast.error('Core terpakai tidak boleh lebih besar dari jumlah core');
      return;
    }

    if (!cableForm.source_type || !cableForm.source_id) {
      toast.error('Source Type dan Source ID wajib dipilih');
      return;
    }

    if (!cableForm.dest_type || !cableForm.dest_id) {
      toast.error('Dest Type dan Dest ID wajib dipilih');
      return;
    }

    let routePoints: any[] = [];

    try {
      routePoints = JSON.parse(cableForm.route_points || '[]');
    } catch {
      toast.error('Route points harus format JSON valid');
      return;
    }

    if (!Array.isArray(routePoints) || routePoints.length < 2) {
      toast.error('Minimal jalur kabel harus memiliki 2 titik.');
      return;
    }

    const payload = {
      ...cableForm,
      jumlah_core: Number(cableForm.jumlah_core),
      tube_core: Number(cableForm.tube_core),
      core_terpakai: Number(cableForm.core_terpakai),
      panjang_meter: Number(cableForm.panjang_meter),
      harga_per_meter: Number(cableForm.harga_per_meter),
      route_points: routePoints,
    };

    createCableMut.mutate(payload);
  };

  const toggleLayer = (key: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  const statusColor: Record<string, string> = {
    aktif: 'badge-aktif',
    penuh: 'badge-penuh',
    maintenance: 'badge-maintenance',
    kritis: 'badge-kritis',
    baik: 'badge-baik',
    rusak: 'badge-rusak',
    draft: 'bg-yellow-100 text-yellow-700 dark:bg-amber-500/20 dark:text-amber-200',
  };

  return (
    <div className="flex h-full overflow-hidden relative">
      <div className="flex-1 relative z-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-zinc-950/70 z-[9999]">
            <RefreshCw size={20} className="animate-spin text-blue-500" />
          </div>
        )}

        <OspMap
          geoData={previewGeoData}
          activeLayers={activeLayers}
          mapType={mapType}
          onSelectAsset={setSelectedAsset}
          onMapClick={handleMapClick}
        />

        <div className="absolute top-3 left-3 right-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between z-[9999] pointer-events-none">
          <div className="pointer-events-auto">
            {drawingCable && (
              <div className="rounded-3xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900 shadow-xl dark:border-orange-400/40 dark:bg-orange-300/100 dark:text-orange-50">
                <div className="font-bold">Mode gambar jalur aktif</div>

                <div className="mt-1 text-xs text-orange-800 dark:text-orange-100">
                  Klik peta untuk menambahkan titik jalur kabel.
                </div>

                <div className="mt-2 text-xs font-semibold text-orange-900 dark:text-white">
                  Titik: {draftPoints.length} | Panjang:{' '}
                  {Number(cableForm.panjang_meter || 0).toLocaleString('id-ID')} m
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
            {!drawingCable && (
              <>
                <button onClick={handleStartCable} className="tb-btn">
                  <Plus size={14} />
                  Gambar Jalur
                </button>

                <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />

                <button onClick={handleImport} className="tb-btn">
                  <Upload size={14} />
                  Import
                </button>

                <button onClick={handleExport} className="tb-btn">
                  <Download size={14} />
                  Export
                </button>
              </>
            )}

            {drawingCable && (
              <>
                <button
                  onClick={openCableForm}
                  className={`tb-btn ${
                    draftPoints.length >= 2 ? '' : 'opacity-70 cursor-not-allowed'
                  }`}
                  disabled={draftPoints.length < 2}
                >
                  <Check size={14} />
                  Selesai
                </button>

                <button
                  onClick={handleUndoPoint}
                  className={`tb-btn ${
                    draftPoints.length ? '' : 'opacity-70 cursor-not-allowed'
                  }`}
                  disabled={!draftPoints.length}
                >
                  <Undo2 size={14} />
                  Undo Titik
                </button>

                <button
                  onClick={handleResetPoints}
                  className={`tb-btn ${
                    draftPoints.length ? '' : 'opacity-70 cursor-not-allowed'
                  }`}
                  disabled={!draftPoints.length}
                >
                  <RotateCcw size={14} />
                  Reset Titik
                </button>

                <button onClick={handleCancelMode} className="tb-btn">
                  <X size={14} />
                  Batal
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="search-box w-64">
              <Search size={14} />
              <input
                placeholder="Cari kode aset, alamat..."
                className="text-xs outline-none flex-1 bg-transparent text-gray placeholder-gray-400"
              />
            </div>

            <button
              onClick={() => setRightOpen(!rightOpen)}
              className={`bg-white border border-gray-200 rounded-lg p-2 shadow-sm hover:bg-gray-50 dark:bg-zinc-900 dark:border-white/10 dark:hover:bg-white/10 ${
                rightOpen ? 'ring-2 ring-blue-200' : ''
              }`}
              title="Layer"
            >
              <Layers size={14} className="text-gray-500 dark:text-zinc-300" />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={onImportFile}
        />

        <div className="absolute bottom-8 right-4 flex gap-1 z-[9999] bg-white border border-gray-200 rounded-lg p-1 shadow-sm dark:bg-zinc-900 dark:border-white/10">
          {(['osm', 'satellite'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setMapType(type)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                mapType === type
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-white/10'
              }`}
            >
              {type === 'osm' ? 'Default' : 'Satelit'}
            </button>
          ))}
        </div>
      </div>

      {selectedAsset && (
        <div className="absolute top-3 left-3 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] overflow-hidden dark:bg-zinc-950 dark:border-white/10">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
            <div>
              <div className="text-xs font-semibold text-gray-900 dark:text-white">
                {selectedAsset.properties?.kode}
              </div>

              <div className="text-xs text-gray-400 capitalize">
                {selectedAsset.properties?.asset_type}
              </div>
            </div>

            <button
              onClick={() => setSelectedAsset(null)}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 dark:hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-4 space-y-2 text-xs">
            {Object.entries(selectedAsset.properties || {}).map(([key, value]: any) => {
              if (
                ['kode', 'asset_type'].includes(key) ||
                value === null ||
                value === undefined
              ) {
                return null;
              }

              if (key === 'status') {
                return (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-zinc-400 capitalize">
                      {key}
                    </span>

                    <span
                      className={`badge ${
                        statusColor[value] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {value}
                    </span>
                  </div>
                );
              }

              return (
                <div key={key} className="flex justify-between gap-3">
                  <span className="text-gray-500 dark:text-zinc-400 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>

                  <span className="font-medium text-gray-800 dark:text-zinc-200 text-right">
                    {String(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {rightOpen && (
        <div className="absolute top-3 right-3 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] overflow-hidden dark:bg-zinc-950 dark:border-white/10">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between dark:border-white/10">
            <span className="text-xs font-semibold text-gray-700 dark:text-white">
              Layer Peta
            </span>

            <button
              onClick={() => setRightOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X size={13} />
            </button>
          </div>

          <div className="p-3 space-y-1">
            {LAYERS.map((layer) => (
              <label
                key={layer.key}
                className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-gray-50 cursor-pointer dark:hover:bg-white/10"
              >
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={activeLayers.has(layer.key)}
                    onChange={() => toggleLayer(layer.key)}
                  />

                  <div
                    className={`w-8 h-4 rounded-full transition-colors ${
                      activeLayers.has(layer.key) ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                        activeLayers.has(layer.key)
                          ? 'translate-x-4'
                          : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>

                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: layer.color }}
                />

                <span className="text-xs text-gray-700 dark:text-zinc-300">
                  {layer.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {showCableForm && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200 dark:bg-zinc-950 dark:border-white/10">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:bg-zinc-950 dark:border-white/10">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Buat Jalur Kabel
                </h3>

                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Data yang disimpan akan masuk ke menu Kabel.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCableForm(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleCreateCable}
              className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6"
            >
              <div>
                <label className="label">Site</label>
                <select
                  className="input"
                  value={cableForm.site_id}
                  onChange={(e) =>
                    setCableForm((prev) => ({
                      ...prev,
                      site_id: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">-- pilih site --</option>
                  {(siteList?.data || []).map((site: any) => (
                    <option key={site.id} value={site.id}>
                      {site.nama_site}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Kode Kabel</label>
                <input
                  type="text"
                  className="input"
                  placeholder="KB-MGT-001"
                  value={cableForm.kode_kabel}
                  onChange={(e) =>
                    setCableForm((prev) => ({
                      ...prev,
                      kode_kabel: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Nama Kabel</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Backbone Magetan A"
                  value={cableForm.nama_kabel}
                  onChange={(e) =>
                    setCableForm((prev) => ({
                      ...prev,
                      nama_kabel: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Panjang (m)</label>
                <input
                  type="number"
                  className="input bg-slate-50 dark:bg-white/5 dark:text-zinc-200"
                  value={cableForm.panjang_meter}
                  readOnly
                  disabled
                />

                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Panjang dihitung otomatis dari titik yang digambar.
                </p>
              </div>

              <div>
                <label className="label">Harga / Meter</label>
                <input
                  type="number"
                  className="input"
                  placeholder="8000"
                  value={cableForm.harga_per_meter}
                  onChange={(e) =>
                    setCableForm((prev) => ({
                      ...prev,
                      harga_per_meter: Number(e.target.value),
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Jumlah Core</label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  value={cableForm.jumlah_core}
                  onChange={(e) => {
                    const value = Number(e.target.value);

                    setCableForm((prev) => ({
                      ...prev,
                      jumlah_core: value,
                      core_terpakai:
                        Number(prev.core_terpakai) > value
                          ? value
                          : prev.core_terpakai,
                    }));
                  }}
                  required
                />
              </div>

              <div>
                <label className="label">Core Terpakai</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={cableForm.jumlah_core}
                  value={cableForm.core_terpakai}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const jumlahCore = Number(cableForm.jumlah_core);

                    if (value > jumlahCore) {
                      toast.error(
                        'Core terpakai tidak boleh lebih besar dari jumlah core'
                      );

                      setCableForm((prev) => ({
                        ...prev,
                        core_terpakai: jumlahCore,
                      }));

                      return;
                    }

                    setCableForm((prev) => ({
                      ...prev,
                      core_terpakai: value,
                    }));
                  }}
                  required
                />

                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Maksimal {cableForm.jumlah_core} core.
                </p>
              </div>

              <div>
                <label className="label">Tube / Core</label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  value={cableForm.tube_core}
                  onChange={(e) =>
                    setCableForm((prev) => ({
                      ...prev,
                      tube_core: Number(e.target.value),
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Source Type</label>
                <select
                  className="input"
                  value={cableForm.source_type}
                  onChange={(e) =>
                    setCableForm((prev) => ({
                      ...prev,
                      source_type: e.target.value,
                      source_id: '',
                    }))
                  }
                  required
                >
                  <option value="odc">ODC</option>
                  <option value="odp">ODP</option>
                </select>
              </div>

              <div>
                <label className="label">Dest Type</label>
                <select
                  className="input"
                  value={cableForm.dest_type}
                  onChange={(e) =>
                    setCableForm((prev) => ({
                      ...prev,
                      dest_type: e.target.value,
                      dest_id: '',
                    }))
                  }
                  required
                >
                  <option value="odc">ODC</option>
                  <option value="odp">ODP</option>
                </select>
              </div>

              <div>
                <label className="label">Source ID</label>
                <select
                  className="input"
                  value={cableForm.source_id}
                  onChange={(e) =>
                    setCableForm((prev) => ({
                      ...prev,
                      source_id: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">
                    -- pilih {cableForm.source_type.toUpperCase()} --
                  </option>

                  {getAssetOptions(cableForm.source_type).map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {getAssetLabel(item, cableForm.source_type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Dest ID</label>
                <select
                  className="input"
                  value={cableForm.dest_id}
                  onChange={(e) =>
                    setCableForm((prev) => ({
                      ...prev,
                      dest_id: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">
                    -- pilih {cableForm.dest_type.toUpperCase()} --
                  </option>

                  {getAssetOptions(cableForm.dest_type).map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {getAssetLabel(item, cableForm.dest_type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={cableForm.status}
                  onChange={(e) =>
                    setCableForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  required
                >
                  {['aktif', 'maintenance', 'rusak', 'kritis'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Warna Jalur</label>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={cableForm.warna_kabel}
                    onChange={(e) =>
                      setCableForm((prev) => ({
                        ...prev,
                        warna_kabel: e.target.value,
                      }))
                    }
                    className="w-10 h-10 p-0 border rounded-md"
                  />

                  <input
                    type="text"
                    className="input flex-1"
                    value={cableForm.warna_kabel}
                    onChange={(e) =>
                      setCableForm((prev) => ({
                        ...prev,
                        warna_kabel: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="label">Route Points</label>

                <textarea
                  readOnly
                  className="input h-28 resize-none bg-slate-50 dark:bg-white/5 dark:text-zinc-200"
                  value={cableForm.route_points}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Catatan</label>

                <textarea
                  className="input h-20 resize-none"
                  value={cableForm.catatan}
                  onChange={(e) =>
                    setCableForm((prev) => ({
                      ...prev,
                      catatan: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                  <div className="font-semibold text-slate-800 dark:text-white">
                    Rangkuman Jalur
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-700 dark:text-zinc-300">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Titik
                      </span>

                      <div>{draftPoints.length}</div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Panjang
                      </span>

                      <div>
                        {Number(cableForm.panjang_meter || 0).toLocaleString(
                          'id-ID'
                        )}{' '}
                        m
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Harga/m
                      </span>

                      <div>{formatRupiah(Number(cableForm.harga_per_meter))}</div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Estimasi
                      </span>

                      <div>
                        {formatRupiah(
                          Number(cableForm.harga_per_meter || 0) *
                            Number(cableForm.panjang_meter || 0)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCableForm(false)}
                  className="btn btn-ghost"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={createCableMut.isPending}
                  className="btn btn-primary"
                >
                  {createCableMut.isPending ? 'Menyimpan...' : 'Simpan Jalur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}