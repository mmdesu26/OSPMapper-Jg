'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kabelApi, siteApi, odpApi, odcApi } from '@/lib/api';
import { Plus, Search, RefreshCw, Edit2, Trash2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmAction } from '@/lib/confirmAction';

const OspMap = dynamic(() => import('@/components/Map/OspMap'), {
  ssr: false,
  loading: () => <div className="h-[360px] bg-slate-100 dark:bg-white/5" />,
});

const statusColor: Record<string, string> = {
  aktif: 'badge-aktif',
  maintenance: 'badge-maintenance',
  rusak: 'badge-rusak',
  kritis: 'badge-kritis',
};

const initialForm = {
  kode_kabel: '',
  nama_kabel: '',
  site_id: '',
  jumlah_core: 12,
  core_terpakai: 0,
  panjang_meter: 100,
  harga_per_meter: 0,
  source_type: 'odc',
  source_id: '',
  dest_type: 'odp',
  dest_id: '',
  route_points:
    '[{"latitude":-7.6493,"longitude":111.3382},{"latitude":-7.6500,"longitude":111.3420}]',
  warna_kabel: '#FF6A3D',
  status: 'aktif',
  catatan: '',
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function KabelPage() {
  const qc = useQueryClient();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm');

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

  const { data, isLoading } = useQuery({
    queryKey: ['kabel', q, page],
    queryFn: () => kabelApi.list({ q, page, limit: 20 }),
  });

  const getAssetOptions = (type: string) => {
    if (type === 'odp') {
      return odpList?.data || [];
    }

    if (type === 'odc') {
      return odcList?.data || [];
    }

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

  const createMut = useMutation({
    mutationFn: (d: any) => kabelApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kabel'] });
      setShowForm(false);
      setForm(initialForm);
      setIsEditing(false);
      toast.success('Kabel berhasil disimpan');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal menyimpan kabel'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: any) => kabelApi.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kabel'] });
      setShowForm(false);
      setForm(initialForm);
      setIsEditing(false);
      setSelectedId(null);
      toast.success('Kabel berhasil diperbarui');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal memperbarui kabel'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => kabelApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kabel'] });
      toast.success('Kabel dihapus');
    },
    onError: (e: any) =>
  toast.error(e.response?.data?.message || 'Gagal menghapus kabel'),
  });

  const openEdit = (kabel: any) => {
    setSelectedId(kabel.id);
    setIsEditing(true);
    setShowForm(true);

    setForm({
      kode_kabel: kabel.kode_kabel || '',
      nama_kabel: kabel.nama_kabel || '',
      site_id: kabel.site?.id || kabel.site_id || '',
      jumlah_core: Number(kabel.jumlah_core || 12),
      core_terpakai: Number(kabel.core_terpakai || 0),
      panjang_meter: Number(kabel.panjang_meter || 100),
      harga_per_meter: Number(kabel.harga_per_meter || 0),
      source_type: kabel.source_type || 'odc',
      source_id: kabel.source_id || '',
      dest_type: kabel.dest_type || 'odp',
      dest_id: kabel.dest_id || '',
      route_points: JSON.stringify(kabel.route_points || [], null, 2) || initialForm.route_points,
      warna_kabel: kabel.warna_kabel || '#FF6A3D',
      status: kabel.status || 'aktif',
      catatan: kabel.catatan || '',
    });
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

  useEffect(() => {
    try {
      const rp = JSON.parse(form.route_points || '[]');

      if (!Array.isArray(rp) || rp.length < 2) {
        return;
      }

      let total = 0;

      for (let i = 1; i < rp.length; i++) {
        total += haversine(rp[i - 1], rp[i]);
      }

      setForm((f) => ({
        ...f,
        panjang_meter: Number(total.toFixed(2)),
      }));
    } catch {}
  }, [form.route_points]);

  const handleMapClick = (lat: number, lng: number) => {
    setForm((prev) => {
      let points: any[] = [];

      try {
        const parsed = JSON.parse(prev.route_points || '[]');
        points = Array.isArray(parsed) ? parsed : [];
      } catch {
        points = [];
      }

      const nextPoints = [
        ...points,
        {
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
        },
      ];

      return {
        ...prev,
        route_points: JSON.stringify(nextPoints, null, 2),
      };
    });
  };

  const clearRoutePoints = () => {
    setForm((prev) => ({
      ...prev,
      route_points: '[]',
      panjang_meter: 0,
    }));
  };

  const selectedGeoData = useMemo(() => {
    let points: any[] = [];

    try {
      const parsed = JSON.parse(form.route_points || '[]');
      points = Array.isArray(parsed) ? parsed : [];
    } catch {
      points = [];
    }

    const validPoints = points
      .map((p) => ({
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      }))
      .filter((p) => !Number.isNaN(p.latitude) && !Number.isNaN(p.longitude));

    const features: any[] = [];

    if (validPoints.length > 0) {
      validPoints.forEach((p, index) => {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [p.longitude, p.latitude],
          },
          properties: {
            asset_type: 'kabel',
            kode: `Titik ${index + 1}`,
            status: form.status || 'aktif',
          },
        });
      });
    }

    if (validPoints.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: validPoints.map((p) => [p.longitude, p.latitude]),
        },
        properties: {
          asset_type: 'kabel',
          kode: form.kode_kabel || 'Jalur Kabel',
          status: form.status || 'aktif',
          warna: form.warna_kabel,
        },
      });
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [form.route_points, form.kode_kabel, form.status, form.warna_kabel]);

  const activeLayers = useMemo(() => new Set(['kabel']), []);

  const submit = (e: any) => {
    e.preventDefault();

    if (Number(form.core_terpakai) > Number(form.jumlah_core)) {
      toast.error('Core terpakai tidak boleh lebih besar dari jumlah core');
      return;
    }

    if (!form.source_type || !form.source_id) {
      toast.error('Source Type dan Source ID wajib dipilih');
      return;
    }

    if (!form.dest_type || !form.dest_id) {
      toast.error('Dest Type dan Dest ID wajib dipilih');
      return;
    }

    let routePoints = [];

    try {
      routePoints = JSON.parse(form.route_points);
    } catch {
      toast.error('Route points harus format JSON yang valid');
      return;
    }

    const payload = {
      ...form,
      jumlah_core: Number(form.jumlah_core),
      core_terpakai: Number(form.core_terpakai),
      panjang_meter: Number(form.panjang_meter),
      harga_per_meter: Number(form.harga_per_meter),
      route_points: routePoints,
    };

    if (isEditing && selectedId) {
      updateMut.mutate({ id: selectedId, d: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setSelectedId(null);
    setForm(initialForm);
  };

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Kabel FO</div>
          <h2 className="display-title">Kabel Management</h2>
          <p className="section-subtitle">
            Harga kabel dihitung dari panjang kabel dikali harga per meter.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setIsEditing(false);
            setSelectedId(null);
            setForm(initialForm);
          }}
          className="btn btn-primary w-full sm:w-auto"
        >
          <Plus size={15} />
          {showForm ? 'Tutup Form' : 'Tambah Kabel'}
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">
            {isEditing ? 'Edit Kabel' : 'Form Tambah Kabel'}
          </h3>

          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Site</label>
              <select
                className="input"
                value={form.site_id}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    site_id: e.target.value,
                  }))
                }
                required
              >
                <option value="">-- pilih site --</option>
                {(siteList?.data || []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_site}
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
                value={form.kode_kabel}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
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
                value={form.nama_kabel}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
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
                className="input bg-slate-50 dark:bg-white/5"
                placeholder="250"
                value={form.panjang_meter}
                readOnly
                disabled
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Panjang dihitung otomatis dari titik jalur pada map.
              </p>
            </div>

            <div>
              <label className="label">Harga / Meter</label>
              <input
                type="number"
                className="input"
                placeholder="8000"
                value={form.harga_per_meter}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    harga_per_meter: +e.target.value,
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
                placeholder="12"
                min={1}
                value={form.jumlah_core}
                onChange={(e) => {
                  const value = Number(e.target.value);

                  setForm((p) => ({
                    ...p,
                    jumlah_core: value,
                    core_terpakai:
                      Number(p.core_terpakai) > value ? value : p.core_terpakai,
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
                placeholder="0"
                min={0}
                max={form.jumlah_core}
                value={form.core_terpakai}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const jumlahCore = Number(form.jumlah_core);

                  if (value > jumlahCore) {
                    toast.error('Core terpakai tidak boleh lebih besar dari jumlah core');

                    setForm((p) => ({
                      ...p,
                      core_terpakai: jumlahCore,
                    }));

                    return;
                  }

                  setForm((p) => ({
                    ...p,
                    core_terpakai: value,
                  }));
                }}
                required
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Maksimal {form.jumlah_core} core.
              </p>
            </div>

            <div>
              <label className="label">Source Type</label>
              <select
                className="input"
                value={form.source_type}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
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
                value={form.dest_type}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
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
                value={form.source_id}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    source_id: e.target.value,
                  }))
                }
                required
              >
                <option value="">-- pilih {form.source_type.toUpperCase()} --</option>

                {getAssetOptions(form.source_type).map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {getAssetLabel(item, form.source_type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Dest ID</label>
              <select
                className="input"
                value={form.dest_id}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    dest_id: e.target.value,
                  }))
                }
                required
              >
                <option value="">-- pilih {form.dest_type.toUpperCase()} --</option>

                {getAssetOptions(form.dest_type).map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {getAssetLabel(item, form.dest_type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Warna Jalur</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.warna_kabel}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      warna_kabel: e.target.value,
                    }))
                  }
                  className="w-11 h-11 p-0 border rounded-lg"
                />

                <input
                  type="text"
                  className="input flex-1"
                  value={form.warna_kabel}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      warna_kabel: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    status: e.target.value,
                  }))
                }
                required
              >
                {['aktif', 'maintenance', 'rusak', 'kritis'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
              <div className="text-xs font-bold uppercase tracking-wider">
                Estimasi Harga
              </div>

              <div className="mt-1 text-xl font-extrabold">
                {formatRupiah(
                  Number(form.panjang_meter) * Number(form.harga_per_meter)
                )}
              </div>

              <div className="text-xs opacity-80">
                {Number(form.panjang_meter).toLocaleString('id-ID')} m ×{' '}
                {formatRupiah(Number(form.harga_per_meter))}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="label">Pilih Jalur Kabel dari Map</label>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Klik beberapa titik pada map untuk membuat jalur kabel.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMapType((prev) =>
                        prev === 'osm' ? 'satellite' : 'osm'
                      )
                    }
                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                  >
                    <Globe size={14} />
                    {mapType === 'osm' ? 'Satellite' : 'OSM'}
                  </button>

                  <button
                    type="button"
                    onClick={clearRoutePoints}
                    className="btn btn-ghost text-xs"
                  >
                    Reset Titik
                  </button>
                </div>
              </div>

              <div className="h-[360px] overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                <OspMap
                  geoData={selectedGeoData}
                  activeLayers={activeLayers}
                  mapType={mapType}
                  onSelectAsset={() => {}}
                  onMapClick={handleMapClick}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                Panjang kabel akan dihitung otomatis dari route points.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="label">Route Points (JSON)</label>
              <textarea
                className="input h-28 resize-none"
                value={form.route_points}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    route_points: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-slate-500 mt-1 dark:text-zinc-400">
                Contoh:{' '}
                {`[{"latitude":-7.6493,"longitude":111.3382},{"latitude":-7.6500,"longitude":111.3420}]`}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="label">Catatan</label>
              <textarea
                className="input h-16 resize-none"
                value={form.catatan}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    catatan: e.target.value,
                  }))
                }
              />
            </div>

            <div className="md:col-span-2 flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-white/10">
              <button type="button" onClick={resetForm} className="btn btn-ghost">
                Batal
              </button>

              <button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending}
                className="btn btn-primary"
              >
                {isEditing ? 'Perbarui Kabel' : 'Simpan Kabel'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap dark:border-white/10">
          <div className="search-box max-w-sm">
            <Search size={14} />
            <input
              placeholder="Cari kode, nama..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {[
                  'Kode',
                  'Nama',
                  'Site',
                  'Core',
                  'Source',
                  'Dest',
                  'Panjang',
                  'Harga /m',
                  'Total',
                  'Status',
                  'Aksi',
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={11} className="text-center text-xs text-slate-400">
                    <RefreshCw size={16} className="animate-spin mx-auto" />
                  </td>
                </tr>
              )}

              {(data?.data || []).map((kabel: any) => {
                const total =
                  Number(kabel.panjang_meter || 0) *
                  Number(kabel.harga_per_meter || 0);

                return (
                  <tr key={kabel.id}>
                    <td className="font-mono text-xs text-orange-600 font-bold whitespace-nowrap">
                      {kabel.kode_kabel}
                    </td>

                    <td className="text-slate-800 dark:text-zinc-200">
                      {kabel.nama_kabel}
                    </td>

                    <td className="text-slate-500 text-xs whitespace-nowrap dark:text-zinc-400">
                      {kabel.site?.nama_site || '—'}
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {kabel.core_terpakai}/{kabel.jumlah_core}
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {kabel.source_type?.toUpperCase() || '—'} -{' '}
                      {kabel.source_id || '—'}
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {kabel.dest_type?.toUpperCase() || '—'} -{' '}
                      {kabel.dest_id || '—'}
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {Number(kabel.panjang_meter || 0).toLocaleString('id-ID')} m
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {formatRupiah(Number(kabel.harga_per_meter || 0))}
                    </td>

                    <td className="font-bold text-slate-800 dark:text-zinc-200">
                      {formatRupiah(total)}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          statusColor[kabel.status] || 'badge-nonaktif'
                        }`}
                      >
                        {kabel.status}
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(kabel)}
                          className="p-1.5 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-orange-600 dark:hover:bg-orange-500/10"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => {
                            confirmAction('Hapus kabel ini?', () =>
                              deleteMut.mutate(kabel.id)
                            );
                          }}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 dark:hover:bg-red-500/10"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && !data?.data?.length && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-slate-400">
                    Belum ada data kabel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 dark:border-white/10 dark:text-zinc-400">
            <span>Total: {data.meta.total} kabel</span>

            <div className="flex gap-1">
              {Array.from(
                { length: Math.min(data.meta.pages || 1, 5) },
                (_, i) => i + 1
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold ${
                    p === page
                      ? 'bg-orange-500 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}