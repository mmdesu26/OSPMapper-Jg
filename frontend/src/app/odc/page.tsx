'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { odcApi, siteApi } from '@/lib/api';
import {
  Plus,
  Search,
  RefreshCw,
  MapPin,
  Edit2,
  Trash2,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmAction } from '@/lib/confirmAction';

const OspMap = dynamic(() => import('@/components/Map/OspMap'), {
  ssr: false,
  loading: () => <div className="h-[360px] bg-slate-100 dark:bg-white/5" />,
});

const initialForm = {
  kode_odc: '',
  nama_odc: '',
  site_id: '',
  latitude: '',
  longitude: '',
  alamat: '',
  kapasitas_port: 16,
  foto_url: '',
  catatan: '',
};

const statusColor: Record<string, string> = {
  aktif: 'badge-aktif',
  penuh: 'badge-penuh',
  maintenance: 'badge-maintenance',
  non_aktif: 'badge-nonaktif',
};

export default function OdcPage() {
  const qc = useQueryClient();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm');
  const [form, setForm] = useState(initialForm);
  const [photoModal, setPhotoModal] = useState<{
    show: boolean;
    url: string | null;
  }>({
    show: false,
    url: null,
  });

  const { data: siteList } = useQuery({
    queryKey: ['site-options'],
    queryFn: () => siteApi.list({ limit: 1000 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['odc', q, status, page],
    queryFn: () => odcApi.list({ q, status, page, limit: 20 }),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => odcApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['odc'] });
      setShowForm(false);
      setIsEditing(false);
      setSelectedId(null);
      setForm(initialForm);
      toast.success('ODC berhasil disimpan');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal menyimpan ODC'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: any) => odcApi.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['odc'] });
      setShowForm(false);
      setIsEditing(false);
      setSelectedId(null);
      setForm(initialForm);
      toast.success('ODC berhasil diperbarui');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal memperbarui ODC'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => odcApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['odc'] });
      toast.success('ODC dihapus');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal menghapus ODC'),
  });

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setSelectedId(null);
    setForm(initialForm);
  };

  const submit = (e: any) => {
    e.preventDefault();

    const latitude = parseFloat(form.latitude);
    const longitude = parseFloat(form.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.error('Latitude atau Longitude tidak valid');
      return;
    }

    const payload = {
      ...form,
      latitude,
      longitude,
      kapasitas_port: Number(form.kapasitas_port),
    };

    if (isEditing && selectedId) {
      updateMut.mutate({ id: selectedId, d: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  const handlePhotoChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({
          ...prev,
          foto_url: reader.result as string,
        }));
      }
    };

    reader.readAsDataURL(file);
  };

  const openEdit = (odc: any) => {
    setSelectedId(odc.id);
    setIsEditing(true);
    setShowForm(true);

    setForm({
      kode_odc: odc.kode_odc || '',
      nama_odc: odc.nama_odc || '',
      site_id: odc.site?.id || odc.site_id || '',
      latitude: odc.latitude?.toString() || '',
      longitude: odc.longitude?.toString() || '',
      alamat: odc.alamat || '',
      kapasitas_port: odc.kapasitas_port || 16,
      foto_url: odc.foto_url || '',
      catatan: odc.catatan || '',
    });
  };

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
            asset_type: 'odc',
            kode: form.kode_odc || 'ODC Lokasi',
            status: 'aktif',
            kapasitas_port: form.kapasitas_port,
            port_terpakai: 0,
          },
        },
      ],
    };
  }, [form.latitude, form.longitude, form.kode_odc, form.kapasitas_port]);

  const activeLayers = useMemo(() => new Set(['odc']), []);

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ODC / Cabinet</div>
          <h2 className="display-title">ODC Management</h2>
          <p className="section-subtitle">
            Kelola data Optical Distribution Cabinet, lokasi koordinat, kapasitas port,
            foto, dan informasi site.
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
          {showForm ? 'Tutup Form' : 'Tambah ODC'}
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
            {isEditing ? 'Edit ODC' : 'Form Tambah ODC'}
          </h3>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <form onSubmit={submit} className="grid grid-cols-1 gap-4">
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
                ['Kode ODC', 'kode_odc', 'text', 'ODC-JKT-001'],
                ['Nama ODC', 'nama_odc', 'text', 'ODC Sudirman'],
                ['Latitude', 'latitude', 'text', '-6.2088'],
                ['Longitude', 'longitude', 'text', '106.8456'],
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
                        [key]: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              ))}

              <div>
                <label className="label">Kapasitas Port</label>
                <select
                  className="input"
                  value={form.kapasitas_port}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      kapasitas_port: Number(e.target.value),
                    }))
                  }
                >
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                  <option value={32}>32</option>
                </select>
              </div>

              <div>
                <label className="label">Foto ODC</label>
                <input
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={handlePhotoChange}
                />
              </div>

              {form.foto_url && (
                <div className="space-y-2 rounded-2xl bg-orange-50 p-4 text-sm text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                  <div className="text-xs font-bold uppercase tracking-wider">
                    Preview Foto
                  </div>
                  <img
                    src={form.foto_url}
                    alt="Preview Foto ODC"
                    className="h-36 w-full max-w-xs rounded-xl border border-orange-100 object-cover dark:border-orange-500/20"
                  />
                </div>
              )}

              <div>
                <label className="label">Alamat</label>
                <input
                  className="input"
                  placeholder="Alamat lengkap"
                  value={form.alamat}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      alamat: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="label">Catatan</label>
                <textarea
                  className="input h-24 resize-none"
                  value={form.catatan}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      catatan: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-2 dark:border-white/10">
                <button type="button" onClick={resetForm} className="btn btn-ghost">
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                  className="btn btn-primary"
                >
                  {isEditing
                    ? updateMut.isPending
                      ? 'Menyimpan...'
                      : 'Perbarui ODC'
                    : createMut.isPending
                      ? 'Menyimpan...'
                      : 'Simpan ODC'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">
                    Pilih Koordinat ODC
                  </div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    Klik titik peta untuk mengisi Latitude dan Longitude secara otomatis.
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
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10">
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

          <select
            className="input max-w-40 text-xs"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua status</option>
            {['aktif', 'penuh', 'maintenance', 'non_aktif'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {[
                  'Kode',
                  'Nama',
                  'Site',
                  'Alamat',
                  'Foto',
                  'Port',
                  'Utilisasi',
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
                    <RefreshCw size={16} className="mx-auto animate-spin" />
                  </td>
                </tr>
              )}

              {(data?.data || []).map((odc: any) => {
                const used = odc.port_terpakai ?? 0;
                const cap = odc.kapasitas_port ?? 0;
                const pct = cap ? Math.round((used / cap) * 100) : 0;
                const barColor =
                  pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#FF6A3D';

                return (
                  <tr key={odc.id}>
                    <td className="whitespace-nowrap font-mono text-xs font-bold text-orange-600">
                      {odc.kode_odc}
                    </td>

                    <td className="text-slate-800 dark:text-zinc-200">
                      {odc.nama_odc}
                    </td>

                    <td className="whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
                      {odc.site?.nama_site || '—'}
                    </td>

                    <td className="max-w-48 truncate text-xs text-slate-500 dark:text-zinc-400">
                      {odc.alamat || '—'}
                    </td>

                    <td>
                      {odc.foto_url ? (
                        <button
                          onClick={() =>
                            setPhotoModal({
                              show: true,
                              url: odc.foto_url,
                            })
                          }
                          className="inline-block h-9 w-12 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
                        >
                          <img
                            src={odc.foto_url}
                            alt={`Foto ${odc.nama_odc}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ) : (
                        <span className="flex h-9 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 dark:bg-white/5">
                          —
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap text-slate-600 dark:text-zinc-400">
                      {odc.port_terpakai}/{odc.kapasitas_port}
                    </td>

                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: barColor,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-zinc-400">
                          {pct}%
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          statusColor[odc.status] || 'badge-nonaktif'
                        }`}
                      >
                        {odc.status}
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(odc)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => {
                            confirmAction('Hapus ODC ini?', () =>
                              deleteMut.mutate(odc.id)
                            );
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>

                        <a
                          href={`https://maps.google.com/?q=${odc.latitude},${odc.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
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
                  <td
                    colSpan={9}
                    className="py-12 text-center text-xs text-slate-400"
                  >
                    Belum ada data ODC.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-zinc-400">
            <span>Total: {data.meta.total} ODC</span>

            <div className="flex gap-1">
              {Array.from(
                {
                  length: Math.min(data.meta.pages || 1, 5),
                },
                (_, i) => i + 1
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold ${
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

      {photoModal.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() =>
            setPhotoModal({
              show: false,
              url: null,
            })
          }
        >
          <div
            className="w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-950">
              <div className="flex justify-end border-b border-slate-100 p-3 dark:border-white/10">
                <button
                  onClick={() =>
                    setPhotoModal({
                      show: false,
                      url: null,
                    })
                  }
                  className="btn btn-ghost"
                >
                  Tutup
                </button>
              </div>

              {photoModal.url ? (
                <img
                  src={photoModal.url}
                  alt="Foto ODC"
                  className="h-[60vh] w-full bg-black object-contain"
                />
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  Tidak ada foto.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}