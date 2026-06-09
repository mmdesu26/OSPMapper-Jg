'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tiangApi, siteApi } from '@/lib/api';
import { Plus, Search, RefreshCw, MapPin, Edit2, Trash2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmAction } from '@/lib/confirmAction';

const OspMap = dynamic(() => import('@/components/Map/OspMap'), {
  ssr: false,
  loading: () => <div className="h-[360px] bg-slate-100 dark:bg-white/5" />,
});

const statusColor: Record<string, string> = {
  baik: 'badge-aktif',
  rusak: 'badge-rusak',
  maintenance: 'badge-maintenance',
};

const initialForm = {
  kode_tiang: '',
  nomor_tiang: '',
  site_id: '',
  tinggi_meter: 7,
  jumlah_tiang: 1,
  harga_per_unit: 0,
  latitude: '',
  longitude: '',
  status: 'baik',
  catatan: '',
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const hitungTotalHargaTiang = (
  hargaPerUnit: number,
  tinggiMeter: number,
  jumlahUnit: number
) => {
  return Number(hargaPerUnit || 0) * Number(tinggiMeter || 0) * Number(jumlahUnit || 0);
};

export default function TiangPage() {
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

  const { data, isLoading } = useQuery({
    queryKey: ['tiang', q, page],
    queryFn: () => tiangApi.list({ q, page, limit: 20 }),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => tiangApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiang'] });
      setShowForm(false);
      setForm(initialForm);
      setIsEditing(false);
      toast.success('Tiang berhasil disimpan');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal menyimpan tiang'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: any) => tiangApi.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiang'] });
      setShowForm(false);
      setForm(initialForm);
      setIsEditing(false);
      setSelectedId(null);
      toast.success('Tiang berhasil diperbarui');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal memperbarui tiang'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => tiangApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiang'] });
      toast.success('Tiang berhasil dihapus');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal menghapus tiang'),
  });

  const openEdit = (tiang: any) => {
    setSelectedId(tiang.id);
    setIsEditing(true);
    setShowForm(true);

    setForm({
      kode_tiang: tiang.kode_tiang || '',
      nomor_tiang: tiang.nomor_tiang || '',
      site_id: tiang.site?.id || tiang.site_id || '',
      tinggi_meter: Number(tiang.tinggi_meter || 0),
      jumlah_tiang: Number(tiang.jumlah_tiang || 1),
      harga_per_unit: Number(tiang.harga_per_unit || 0),
      latitude: tiang.latitude?.toString() || '',
      longitude: tiang.longitude?.toString() || '',
      status: tiang.status || 'baik',
      catatan: tiang.catatan || '',
    });
  };

  const handleMapClick = (lat: number, lng: number) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  const totalHargaForm = hitungTotalHargaTiang(
    Number(form.harga_per_unit || 0),
    Number(form.tinggi_meter || 0),
    Number(form.jumlah_tiang || 0)
  );

  const selectedGeoData = useMemo(() => {
    if (!form.latitude.trim() || !form.longitude.trim()) {
      return {
        type: 'FeatureCollection',
        features: [],
      };
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return {
        type: 'FeatureCollection',
        features: [],
      };
    }

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          properties: {
            asset_type: 'tiang',
            kode: form.kode_tiang || 'Tiang Lokasi',
            status: form.status || 'baik',
          },
        },
      ],
    };
  }, [form.latitude, form.longitude, form.kode_tiang, form.status]);

  const activeLayers = useMemo(() => new Set(['tiang']), []);

  const submit = (e: any) => {
    e.preventDefault();

    const payload = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      tinggi_meter: Number(form.tinggi_meter),
      jumlah_tiang: Number(form.jumlah_tiang),
      harga_per_unit: Number(form.harga_per_unit),
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
          <div className="eyebrow">Tiang / Pole (Besi)</div>
          <h2 className="display-title">Tiang Management</h2>
          <p className="section-subtitle">
            Harga tiang dihitung berdasarkan harga per (m) tinggi dikali jumlah unit tiang
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
          {showForm ? 'Tutup Form' : 'Tambah Tiang'}
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">
            {isEditing ? 'Edit Tiang' : 'Form Tambah Tiang'}
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

            {[
              ['Kode Tiang', 'kode_tiang', 'text', 'TG-MGT-001'],
              ['Nomor Tiang', 'nomor_tiang', 'text', '001'],
              ['Tinggi (m)', 'tinggi_meter', 'number', '7.0'],
              ['Jumlah Unit', 'jumlah_tiang', 'number', '1'],
              ['Harga / Unit', 'harga_per_unit', 'number', '1250000'],
              ['Latitude', 'latitude', 'text', '-7.6493'],
              ['Longitude', 'longitude', 'text', '111.3382'],
            ].map(([label, key, type, placeholder]: any) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  type={type}
                  className="input"
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                    }))
                  }
                  required
                />
              </div>
            ))}

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
              >
                {['baik', 'maintenance', 'rusak'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
              <div className="text-xs font-bold uppercase tracking-wider">
                Total Harga Tiang
              </div>

              <div className="mt-1 text-xl font-extrabold">
                {formatRupiah(totalHargaForm)}
              </div>

              <div className="text-xs opacity-80">
                {formatRupiah(Number(form.harga_per_unit || 0))} ×{' '}
                {Number(form.tinggi_meter || 0).toLocaleString('id-ID')} m ×{' '}
                {Number(form.jumlah_tiang || 0).toLocaleString('id-ID')} unit
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="label">Pilih Lokasi Tiang dari Map</label>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Klik pada map untuk mengisi Latitude dan Longitude secara otomatis.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMapType((prev) => (prev === 'osm' ? 'satellite' : 'osm'))
                  }
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                >
                  <Globe size={14} />
                  {mapType === 'osm' ? 'Satellite' : 'OSM'}
                </button>
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
            </div>

            <div className="md:col-span-2">
              <label className="label">Catatan</label>
              <textarea
                className="input h-20 resize-none"
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
                {isEditing ? 'Perbarui Tiang' : 'Simpan Tiang'}
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
              placeholder="Cari kode, nomor..."
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
                  'Site',
                  'Nomor',
                  'Jumlah Unit',
                  'Tinggi',
                  'Harga / Unit',
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
                  <td colSpan={9} className="text-center text-xs text-slate-400">
                    <RefreshCw size={16} className="animate-spin mx-auto" />
                  </td>
                </tr>
              )}

              {(data?.data || []).map((tiang: any) => {
                const jumlahUnit = Number(tiang.jumlah_tiang || 0);
                const tinggiMeter = Number(tiang.tinggi_meter || 0);
                const hargaPerUnit = Number(tiang.harga_per_unit || 0);

                const totalHarga = hitungTotalHargaTiang(
                  hargaPerUnit,
                  tinggiMeter,
                  jumlahUnit
                );

                return (
                  <tr key={tiang.id}>
                    <td className="font-mono text-xs text-orange-600 font-bold whitespace-nowrap">
                      {tiang.kode_tiang}
                    </td>

                    <td className="text-slate-500 text-xs whitespace-nowrap dark:text-zinc-400">
                      {tiang.site?.nama_site || '—'}
                    </td>

                    <td className="text-slate-800 dark:text-zinc-200">
                      {tiang.nomor_tiang || '—'}
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {jumlahUnit.toLocaleString('id-ID')}
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {tinggiMeter.toLocaleString('id-ID')} m
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {formatRupiah(hargaPerUnit)}
                    </td>

                    <td className="font-bold text-slate-800 dark:text-zinc-200">
                      {formatRupiah(totalHarga)}
                    </td>

                    <td>
                      <span className={`badge ${statusColor[tiang.status] || 'badge-nonaktif'}`}>
                        {tiang.status}
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(tiang)}
                          className="p-1.5 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-orange-600 dark:hover:bg-orange-500/10"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => {
                            confirmAction('Hapus tiang ini?', () =>
                              deleteMut.mutate(tiang.id)
                            );
                          }}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 dark:hover:bg-red-500/10"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>

                        <a
                          href={`https://maps.google.com/?q=${tiang.latitude},${tiang.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                          title="Buka di Maps"
                        >
                          <MapPin size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && !data?.data?.length && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    Belum ada data tiang.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 dark:border-white/10 dark:text-zinc-400">
            <span>Total: {data.meta.total} tiang</span>

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