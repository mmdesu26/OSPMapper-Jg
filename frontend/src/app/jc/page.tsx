'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jcApi, siteApi, kabelApi } from '@/lib/api';
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Network,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmAction } from '@/lib/confirmAction';

type SpliceRow = {
  in_core: number;
  out_core: number;
  catatan?: string;
};

const OspMap = dynamic(() => import('@/components/Map/OspMap'), {
  ssr: false,
  loading: () => <div className="h-[360px] bg-slate-100 dark:bg-white/5" />,
});

const coreOptions = [12, 24];

const corePalette = [
  '#2563EB',
  '#F97316',
  '#10B981',
  '#A855F7',
  '#64748B',
  '#FFFFFF',
  '#EF4444',
  '#111827',
  '#FACC15',
  '#EC4899',
  '#14B8A6',
  '#0EA5E9',
];

const initialConnections: SpliceRow[] = [
  { in_core: 1, out_core: 1, catatan: 'Tube biru' },
  { in_core: 2, out_core: 2, catatan: 'Tube biru' },
  { in_core: 3, out_core: 5, catatan: 'Cross splice' },
];

const initialForm = {
  kode_jc: '',
  tipe_jc: 'dome',
  site_id: '',
  latitude: '',
  longitude: '',
  kabel_in_id: '',
  kabel_out_id: '',
  jumlah_core_in: 24,
  jumlah_core_out: 24,
  splice_connections: initialConnections,
  catatan: '',
};

const getKabelLabel = (kabel: any) => {
  return kabel.kode_kabel || kabel.nama_kabel || kabel.nama || kabel.id;
};

const getCoreList = (count: number) => {
  return Array.from({ length: Number(count || 0) }, (_, index) => index + 1);
};

function CoreColumn({
  title,
  selected,
  side,
  totalCore,
  kabelName,
}: {
  title: string;
  selected: number[];
  side: 'in' | 'out';
  totalCore: number;
  kabelName?: string;
}) {
  const totalBuffer = Math.ceil(Number(totalCore || 0) / 12);

  return (
    <div className="min-w-[180px] rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-200">
            {title}
          </div>

          <div className="mt-1 max-w-[150px] truncate text-[10px] text-slate-500 dark:text-zinc-400">
            {kabelName || 'Belum pilih kabel'}
          </div>
        </div>

        <div className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
          {totalBuffer} Buffer
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: totalBuffer }).map((_, buffer) => (
          <div
            key={buffer}
            className="overflow-hidden rounded-xl border border-slate-100 dark:border-white/10"
          >
            <div className="bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase text-slate-500 dark:bg-white/5 dark:text-zinc-400">
              Buffer {buffer + 1}
            </div>

            {Array.from({ length: 12 }).map((_, idx) => {
              const core = buffer * 12 + idx + 1;

              if (core > totalCore) return null;

              const active = selected.includes(core);

              return (
                <div
                  key={core}
                  className={`flex w-full items-center gap-2 border-t border-slate-100 px-2 py-1.5 text-left text-xs transition dark:border-white/10 ${
                    active
                      ? 'bg-orange-50 dark:bg-orange-500/15'
                      : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-slate-300"
                    style={{ background: corePalette[idx] }}
                  />

                  <span className="w-8 font-mono font-bold text-slate-500 dark:text-zinc-400">
                    {String(core).padStart(2, '0')}
                  </span>

                  <span
                    className={`h-1 flex-1 rounded-full ${
                      side === 'in' ? 'bg-sky-300' : 'bg-emerald-300'
                    } ${active ? 'animate-pulse-line' : 'opacity-30'}`}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SpliceVisual({
  connections,
  setConnections,
  jumlahCoreIn,
  jumlahCoreOut,
  kabelInId,
  kabelOutId,
  setKabelInId,
  setKabelOutId,
  kabelOptions,
}: {
  connections: SpliceRow[];
  setConnections: (rows: SpliceRow[]) => void;
  jumlahCoreIn: number;
  jumlahCoreOut: number;
  kabelInId: string;
  kabelOutId: string;
  setKabelInId: (value: string) => void;
  setKabelOutId: (value: string) => void;
  kabelOptions: any[];
}) {
  const selectedIn = connections.map((c) => Number(c.in_core));
  const selectedOut = connections.map((c) => Number(c.out_core));

  const selectedKabelIn = kabelOptions.find((item) => item.id === kabelInId);
  const selectedKabelOut = kabelOptions.find((item) => item.id === kabelOutId);

  const updateRow = (index: number, key: keyof SpliceRow, value: any) => {
    setConnections(
      connections.map((row, i) =>
        i === index
          ? {
              ...row,
              [key]: ['in_core', 'out_core'].includes(key)
                ? Number(value)
                : value,
            }
          : row
      )
    );
  };

  const addRow = () => {
    const nextIn = Math.min(connections.length + 1, Number(jumlahCoreIn || 1));
    const nextOut = Math.min(connections.length + 1, Number(jumlahCoreOut || 1));

    setConnections([
      ...connections,
      {
        in_core: nextIn,
        out_core: nextOut,
        catatan: '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    setConnections(connections.filter((_, i) => i !== index));
  };

  return (
    <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Network size={16} className="text-orange-500" />
            Visual Mapping JC
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Pilih kabel masuk, kabel keluar, lalu tentukan pasangan core yang
            tersambung.
          </p>
        </div>

        <button type="button" onClick={addRow} className="btn btn-ghost text-xs">
          <Plus size={14} />
          Tambah Pair
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="label">Kabel In</label>
          <select
            className="input"
            value={kabelInId}
            onChange={(e) => setKabelInId(e.target.value)}
            required
          >
            <option value="">-- pilih kabel masuk --</option>
            {kabelOptions.map((kabel: any) => (
              <option key={kabel.id} value={kabel.id}>
                {getKabelLabel(kabel)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Kabel Out</label>
          <select
            className="input"
            value={kabelOutId}
            onChange={(e) => setKabelOutId(e.target.value)}
            required
          >
            <option value="">-- pilih kabel keluar --</option>
            {kabelOptions.map((kabel: any) => (
              <option key={kabel.id} value={kabel.id}>
                {getKabelLabel(kabel)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[210px_1fr_210px]">
        <CoreColumn
          title="Kabel In"
          side="in"
          selected={selectedIn}
          totalCore={Number(jumlahCoreIn)}
          kabelName={selectedKabelIn ? getKabelLabel(selectedKabelIn) : ''}
        />

        <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-3 dark:border-orange-500/30 dark:bg-[#121516]">
          <div className="mb-3 text-xs font-bold text-slate-700 dark:text-zinc-200">
            Daftar Pasangan Core
          </div>

          <div className="space-y-2">
            {connections.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2 text-xs md:grid-cols-[1fr_1fr_1.3fr_auto] dark:border-white/10 dark:bg-white/5"
              >
                <div>
                  <label className="label">Core In</label>
                  <select
                    className="input"
                    value={row.in_core}
                    onChange={(e) => updateRow(i, 'in_core', e.target.value)}
                  >
                    {getCoreList(jumlahCoreIn).map((core) => (
                      <option key={core} value={core}>
                        Core {String(core).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Core Out</label>
                  <select
                    className="input"
                    value={row.out_core}
                    onChange={(e) => updateRow(i, 'out_core', e.target.value)}
                  >
                    {getCoreList(jumlahCoreOut).map((core) => (
                      <option key={core} value={core}>
                        Core {String(core).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Catatan</label>
                  <input
                    className="input"
                    placeholder="Ket."
                    value={row.catatan || ''}
                    onChange={(e) => updateRow(i, 'catatan', e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="btn btn-ghost px-2 text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!connections.length && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400 dark:border-white/10 dark:bg-white/5">
              Belum ada pasangan core.
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-3 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Preview Jalur Pasangan
            </div>

            <div className="space-y-2">
              {connections.map((row, i) => (
                <div
                  key={`preview-${i}`}
                  className="grid grid-cols-[52px_1fr_52px] items-center gap-2 text-xs"
                >
                  <div className="rounded-lg bg-sky-50 px-2 py-1 text-center font-mono font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                    IN {String(row.in_core).padStart(2, '0')}
                  </div>

                  <div className="relative h-5">
                    <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-orange-300" />
                  </div>

                  <div className="rounded-lg bg-emerald-50 px-2 py-1 text-center font-mono font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    OUT {String(row.out_core).padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <CoreColumn
          title="Kabel Out"
          side="out"
          selected={selectedOut}
          totalCore={Number(jumlahCoreOut)}
          kabelName={selectedKabelOut ? getKabelLabel(selectedKabelOut) : ''}
        />
      </div>
    </div>
  );
}

export default function JcPage() {
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

  const { data: kabelList } = useQuery({
    queryKey: ['kabel-options'],
    queryFn: () => kabelApi.list({ limit: 1000 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['jc', q, page],
    queryFn: () => jcApi.list({ q, page, limit: 20 }),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => jcApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jc'] });
      setShowForm(false);
      setForm(initialForm);
      setIsEditing(false);
      toast.success('JC berhasil disimpan');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal menyimpan JC'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: any) => jcApi.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jc'] });
      setShowForm(false);
      setForm(initialForm);
      setIsEditing(false);
      setSelectedId(null);
      toast.success('JC berhasil diperbarui');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Gagal memperbarui JC'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => jcApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jc'] });
      toast.success('JC dihapus');
    },
    onError: (e: any) =>
  toast.error(e.response?.data?.message || 'Gagal menghapus JC'),
  });

  const kabelOptions = kabelList?.data || [];

  const getKabelNameById = (id: string) => {
    const found = kabelOptions.find((item: any) => item.id === id);
    return found ? getKabelLabel(found) : id || '—';
  };

  const openEdit = (jc: any) => {
    setSelectedId(jc.id);
    setIsEditing(true);
    setShowForm(true);

    setForm({
      kode_jc: jc.kode_jc || '',
      tipe_jc: jc.tipe_jc || 'dome',
      site_id: jc.site?.id || jc.site_id || '',
      latitude: jc.latitude?.toString() || '',
      longitude: jc.longitude?.toString() || '',
      kabel_in_id: jc.kabel_in_id || '',
      kabel_out_id: jc.kabel_out_id || '',
      jumlah_core_in: Number(jc.jumlah_core_in || 24),
      jumlah_core_out: Number(jc.jumlah_core_out || 24),
      splice_connections: Array.isArray(jc.splice_connections)
        ? jc.splice_connections
        : initialConnections,
      catatan: jc.catatan || '',
    });
  };

  const handleMapClick = (lat: number, lng: number) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
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
            asset_type: 'jc',
            kode: form.kode_jc || 'JC Lokasi',
            status: 'aktif',
          },
        },
      ],
    };
  }, [form.latitude, form.longitude, form.kode_jc]);

  const activeLayers = useMemo(() => new Set(['jc']), []);

  const submit = (e: any) => {
    e.preventDefault();

    if (!form.kabel_in_id) {
      toast.error('Kabel In wajib dipilih');
      return;
    }

    if (!form.kabel_out_id) {
      toast.error('Kabel Out wajib dipilih');
      return;
    }

    const cleanedConnections = form.splice_connections.map((row) => ({
      in_core: Number(row.in_core),
      out_core: Number(row.out_core),
      catatan: row.catatan || '',
    }));

    const payload = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      jumlah_core_in: Number(form.jumlah_core_in),
      jumlah_core_out: Number(form.jumlah_core_out),
      splice_connections: cleanedConnections,
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
          <div className="eyebrow">Joint Closure</div>
          <h2 className="display-title">JC Visual Management</h2>
          <p className="section-subtitle">
            Kelola Joint Closure sekaligus visual pasangan core in dan core out.
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
          {showForm ? 'Tutup Form' : 'Tambah JC'}
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
            {isEditing ? 'Edit JC' : 'Form Tambah JC'}
          </h3>

          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <label className="label">Kode JC</label>
              <input
                type="text"
                className="input"
                placeholder="JC-MGT-001"
                value={form.kode_jc}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    kode_jc: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="label">Tipe JC</label>
              <input
                type="text"
                className="input"
                placeholder="dome"
                value={form.tipe_jc}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    tipe_jc: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="label">Core In</label>
              <select
                className="input"
                value={form.jumlah_core_in}
                onChange={(e) => {
                  const value = Number(e.target.value);

                  setForm((p) => ({
                    ...p,
                    jumlah_core_in: value,
                    splice_connections: p.splice_connections.map((row) => ({
                      ...row,
                      in_core:
                        Number(row.in_core) > value ? value : Number(row.in_core),
                    })),
                  }));
                }}
                required
              >
                {coreOptions.map((core) => (
                  <option key={core} value={core}>
                    {core}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Core Out</label>
              <select
                className="input"
                value={form.jumlah_core_out}
                onChange={(e) => {
                  const value = Number(e.target.value);

                  setForm((p) => ({
                    ...p,
                    jumlah_core_out: value,
                    splice_connections: p.splice_connections.map((row) => ({
                      ...row,
                      out_core:
                        Number(row.out_core) > value
                          ? value
                          : Number(row.out_core),
                    })),
                  }));
                }}
                required
              >
                {coreOptions.map((core) => (
                  <option key={core} value={core}>
                    {core}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Latitude</label>
              <input
                type="text"
                className="input"
                placeholder="-7.6493"
                value={form.latitude}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    latitude: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="label">Longitude</label>
              <input
                type="text"
                className="input"
                placeholder="111.3382"
                value={form.longitude}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    longitude: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="label">Pilih Lokasi JC dari Map</label>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Klik pada map untuk mengisi latitude dan longitude secara
                    otomatis.
                  </p>
                </div>

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

            <SpliceVisual
              connections={form.splice_connections}
              setConnections={(rows) =>
                setForm((p) => ({
                  ...p,
                  splice_connections: rows,
                }))
              }
              jumlahCoreIn={form.jumlah_core_in}
              jumlahCoreOut={form.jumlah_core_out}
              kabelInId={form.kabel_in_id}
              kabelOutId={form.kabel_out_id}
              setKabelInId={(value) =>
                setForm((p) => ({
                  ...p,
                  kabel_in_id: value,
                }))
              }
              setKabelOutId={(value) =>
                setForm((p) => ({
                  ...p,
                  kabel_out_id: value,
                }))
              }
              kabelOptions={kabelOptions}
            />

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

            <div className="md:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-2 dark:border-white/10">
              <button type="button" onClick={resetForm} className="btn btn-ghost">
                Batal
              </button>

              <button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending}
                className="btn btn-primary"
              >
                {isEditing ? 'Perbarui JC' : 'Simpan JC'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10">
          <div className="search-box max-w-sm">
            <Search size={14} />
            <input
              placeholder="Cari kode JC..."
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
                  'Kode JC',
                  'Site',
                  'Tipe',
                  'Kabel In',
                  'Kabel Out',
                  'Core In',
                  'Core Out',
                  'Pair',
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

              {(data?.data || []).map((jc: any) => {
                const pairCount = Array.isArray(jc.splice_connections)
                  ? jc.splice_connections.length
                  : 0;

                return (
                  <tr key={jc.id}>
                    <td className="whitespace-nowrap font-mono text-xs font-bold text-orange-600">
                      {jc.kode_jc}
                    </td>

                    <td className="whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">
                      {jc.site?.nama_site || '—'}
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {jc.tipe_jc}
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {getKabelNameById(jc.kabel_in_id)}
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {getKabelNameById(jc.kabel_out_id)}
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {jc.jumlah_core_in || 0}
                    </td>

                    <td className="text-slate-600 dark:text-zinc-400">
                      {jc.jumlah_core_out || 0}
                    </td>

                    <td className="font-bold text-slate-800 dark:text-zinc-200">
                      {pairCount} pair
                    </td>

                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(jc)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => {
                            confirmAction('Hapus JC ini?', () =>
                              deleteMut.mutate(jc.id)
                            );
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
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
                  <td
                    colSpan={9}
                    className="py-12 text-center text-xs text-slate-400"
                  >
                    Belum ada data JC.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-zinc-400">
            <span>Total: {data.meta.total} JC</span>

            <div className="flex gap-1">
              {Array.from(
                { length: Math.min(data.meta.pages || 1, 5) },
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
    </div>
  );
}