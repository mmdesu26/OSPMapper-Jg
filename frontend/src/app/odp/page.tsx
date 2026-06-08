'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { odpApi, odcApi, siteApi } from '@/lib/api';
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

const statusColor: Record<string, string> = {
  aktif: 'badge-aktif',
  penuh: 'badge-penuh',
  maintenance: 'badge-maintenance',
  non_aktif: 'badge-nonaktif',
};

const initialForm = {
  kode_odp: '',
  nama_odp: '',
  site_id: '',
  latitude: '',
  longitude: '',
  alamat: '',
  kapasitas_port: 8,
  port_terpakai: 0,
  status: 'aktif',
  catatan: '',
  parent_odc_id: '',
  foto_url: '',
  pelanggan_list: '',
  pelanggan: Array(8).fill(''),
};

export default function OdpPage() {
  const qc = useQueryClient();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm');
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

  const { data: odcList } = useQuery({
    queryKey: ['odcList'],
    queryFn: () => odcApi.list({ limit: 1000 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['odp', q, status, page],
    queryFn: () => odpApi.list({ q, status, page, limit: 20 }),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => odpApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['odp'] });
      setShowForm(false);
      setForm(initialForm);
      setIsEditing(false);
      setSelectedId(null);
      toast.success('ODP berhasil disimpan');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal menyimpan ODP'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: any) => odpApi.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['odp'] });
      setShowForm(false);
      setForm(initialForm);
      setIsEditing(false);
      setSelectedId(null);
      toast.success('ODP berhasil diperbarui');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal memperbarui ODP'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => odpApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['odp'] });
      toast.success('ODP dihapus');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal menghapus ODP'),
  });

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setSelectedId(null);
    setForm(initialForm);
  };

  const openEdit = (odp: any) => {
    setSelectedId(odp.id);
    setIsEditing(true);
    setShowForm(true);

    const initialPelanggan = Array(odp.kapasitas_port || 8).fill('');

    if (Array.isArray(odp.ports)) {
      odp.ports.forEach((p: any) => {
        if (p.port_number >= 1 && p.port_number <= initialPelanggan.length) {
          initialPelanggan[p.port_number - 1] = p.customer_name || '';
        }
      });
    }

    setForm({
      kode_odp: odp.kode_odp || '',
      nama_odp: odp.nama_odp || '',
      site_id: odp.site?.id || odp.site_id || '',
      latitude: odp.latitude?.toString() || '',
      longitude: odp.longitude?.toString() || '',
      alamat: odp.alamat || '',
      kapasitas_port: odp.kapasitas_port || 8,
      port_terpakai: odp.port_terpakai || 0,
      status: odp.status || 'aktif',
      catatan: odp.catatan || '',
      parent_odc_id: odp.parentOdc?.id || odp.parent_odc_id || '',
      foto_url: odp.foto_url || '',
      pelanggan_list: '',
      pelanggan: initialPelanggan,
    });
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

  const handleMapClick = (lat: number, lng: number) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  const handlePortChange = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.pelanggan];
      next[index] = value;

      return {
        ...prev,
        pelanggan: next,
      };
    });
  };

  const customers = useMemo(() => {
    return (form.pelanggan || []).map((s: string) => s.trim());
  }, [form.pelanggan]);

  const usedPortCount = useMemo(
    () => customers.filter(Boolean).length,
    [customers]
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
            asset_type: 'odp',
            kode: form.kode_odp || 'ODP Lokasi',
            status: form.status || 'aktif',
            kapasitas_port: form.kapasitas_port,
            port_terpakai: usedPortCount,
          },
        },
      ],
    };
  }, [
    form.latitude,
    form.longitude,
    form.kode_odp,
    form.status,
    form.kapasitas_port,
    usedPortCount,
  ]);

  const activeLayers = useMemo(() => new Set(['odp']), []);

  const submit = (e: any) => {
    e.preventDefault();

    const latitude = parseFloat(form.latitude);
    const longitude = parseFloat(form.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.error('Latitude atau Longitude tidak valid');
      return;
    }

    const { pelanggan, ...restForm } = form;

    const payload = {
      ...restForm,
      latitude,
      longitude,
      kapasitas_port: Number(form.kapasitas_port),
      port_terpakai: usedPortCount,
      pelanggan_list: (form.pelanggan || [])
        .map((s: string) => s || '')
        .join('\n'),
    };

    if (isEditing && selectedId) {
      updateMut.mutate({ id: selectedId, d: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ODP / Distribution Point</div>
          <h2 className="display-title">ODP Management</h2>
          <p className="section-subtitle">
            Kelola data Optical Distribution Point, parent ODC, lokasi koordinat,
            kapasitas port, dan pelanggan per port.
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
          {showForm ? 'Tutup Form' : 'Tambah ODP'}
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
            {isEditing ? 'Edit ODP' : 'Form Tambah ODP'}
          </h3>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <form onSubmit={submit} className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                <div>
                  <label className="label">Pilih ODC Parent</label>
                  <select
                    className="input"
                    value={form.parent_odc_id}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        parent_odc_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">-- pilih ODC --</option>
                    {(odcList?.data || []).map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.kode_odc} - {o.nama_odc}
                      </option>
                    ))}
                  </select>
                </div>

                {[
                  ['Kode ODP', 'kode_odp', 'text', 'ODP-JKT-021'],
                  ['Nama ODP', 'nama_odp', 'text', 'ODP Sudirman'],
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
                    onChange={(e) => {
                      const newCap = Number(e.target.value);

                      setForm((p) => ({
                        ...p,
                        kapasitas_port: newCap,
                        pelanggan: [...p.pelanggan]
                          .slice(0, newCap)
                          .concat(
                            Array(
                              Math.max(0, newCap - p.pelanggan.length)
                            ).fill('')
                          ),
                      }));
                    }}
                  >
                    <option value={8}>8</option>
                    <option value={16}>16</option>
                    <option value={32}>32</option>
                  </select>
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
                  >
                    {['aktif', 'penuh', 'maintenance', 'non_aktif'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Foto ODP</label>
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
                      alt="Preview Foto ODP"
                      className="h-28 w-full max-w-xs rounded-xl border border-orange-100 object-cover dark:border-orange-500/20"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
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
              </div>

              <div>
                <label className="label">Pelanggan per Port</label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: form.kapasitas_port }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        Port P{index + 1}
                      </div>
                      <input
                        type="text"
                        className="input"
                        placeholder={`Nama pelanggan P${index + 1}`}
                        value={form.pelanggan[index] || ''}
                        onChange={(e) =>
                          handlePortChange(index, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-xs text-slate-400 dark:text-zinc-500">
                  Port terpakai: {usedPortCount} dari {form.kapasitas_port}.
                </div>
              </div>

              <div>
                <label className="label">Visual Port</label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 xl:grid-cols-8">
                  {Array.from({ length: form.kapasitas_port }).map((_, i) => {
                    const name = customers[i];
                    const used = Boolean(name);

                    return (
                      <div
                        key={i}
                        className={`min-h-[70px] rounded-2xl border p-2 text-xs transition ${
                          used
                            ? 'border-orange-200 bg-orange-500 text-white dark:border-orange-500/30'
                            : 'border-slate-100 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400'
                        }`}
                      >
                        <div className="mb-1 font-bold">P{i + 1}</div>
                        <div className="truncate text-[11px]">
                          {used ? name : 'Kosong'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 text-xs text-slate-400 dark:text-zinc-500">
                  Nama pelanggan langsung terlihat di port. Port kosong ditandai
                  sebagai Kosong.
                </div>
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
                      : 'Perbarui ODP'
                    : createMut.isPending
                      ? 'Menyimpan...'
                      : 'Simpan ODP'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">
                    Pilih Koordinat ODP
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

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-white/5 dark:text-zinc-300">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Ringkasan Port
                </div>
                <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                  {usedPortCount}/{form.kapasitas_port}
                </div>
                <div className="text-xs text-slate-400 dark:text-zinc-500">
                  Port sedang digunakan.
                </div>
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
                  'ODC',
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
                  <td colSpan={10} className="text-center text-xs text-slate-400">
                    <RefreshCw size={16} className="mx-auto animate-spin" />
                  </td>
                </tr>
              )}

              {(data?.data || []).map((odp: any) => {
                const pct = odp.kapasitas_port
                  ? Math.round((odp.port_terpakai / odp.kapasitas_port) * 100)
                  : 0;

                const barColor =
                  pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#FF6A3D';

                const parentOdc =
                  (odcList?.data || []).find(
                    (o: any) => o.id === (odp.parentOdc?.id || odp.parent_odc_id)
                  )?.kode_odc || '—';

                return (
                  <tr key={odp.id}>
                    <td className="whitespace-nowrap font-mono text-xs font-bold text-orange-600">
                      {odp.kode_odp}
                    </td>

                    <td className="text-slate-800 dark:text-zinc-200">
                      {odp.nama_odp}
                    </td>

                    <td className="whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
                      {odp.site?.nama_site || '—'}
                    </td>

                    <td className="max-w-48 truncate text-xs text-slate-500 dark:text-zinc-400">
                      {odp.alamat || '—'}
                    </td>

                    <td className="whitespace-nowrap text-xs text-slate-600 dark:text-zinc-400">
                      {parentOdc}
                    </td>

                    <td>
                      {odp.foto_url ? (
                        <button
                          onClick={() =>
                            setPhotoModal({
                              show: true,
                              url: odp.foto_url,
                            })
                          }
                          className="inline-block h-9 w-12 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
                        >
                          <img
                            src={odp.foto_url}
                            alt={`Foto ${odp.nama_odp}`}
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
                      {odp.port_terpakai}/{odp.kapasitas_port}
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
                          statusColor[odp.status] || 'badge-nonaktif'
                        }`}
                      >
                        {odp.status}
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(odp)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => {
                            confirmAction('Hapus ODP ini?', () =>
                              deleteMut.mutate(odp.id)
                            );
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>

                        <a
                          href={`https://maps.google.com/?q=${odp.latitude},${odp.longitude}`}
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
                    colSpan={10}
                    className="py-12 text-center text-xs text-slate-400"
                  >
                    Belum ada data ODP.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-zinc-400">
            <span>Total: {data.meta.total} ODP</span>

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
                  alt="Foto ODP"
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