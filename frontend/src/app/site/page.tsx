'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteApi } from '@/lib/api';
import { Edit2, MapPin, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmAction } from '@/lib/confirmAction';

const initialForm = { kode_site: '', nama_site: '', kota: '', provinsi: 'Jawa Timur', latitude: '', longitude: '', status: 'aktif', catatan: '' };
const statusColor: Record<string,string> = { aktif: 'badge-aktif', non_aktif: 'badge-nonaktif' };

type ProvinceOption = {
  id: string;
  name: string;
};

type RegencyOption = {
  id: string;
  province_id: string;
  name: string;
};

export default function SitePage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['site', q, page], queryFn: () => siteApi.list({ q, page, limit: 20 }) });
  const { data: provinces = [], isLoading: isLoadingProvinces } = useQuery({
  queryKey: ['wilayah-provinces'],
  queryFn: async () => {
    const res = await fetch(
      'https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json'
    );

    if (!res.ok) {
      throw new Error('Gagal mengambil data provinsi');
    }

    return res.json() as Promise<ProvinceOption[]>;
  },
});

const { data: regencies = [], isLoading: isLoadingRegencies } = useQuery({
  queryKey: ['wilayah-regencies', selectedProvinceId],
  enabled: Boolean(selectedProvinceId),
  queryFn: async () => {
    const res = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvinceId}.json`
    );

    if (!res.ok) {
      throw new Error('Gagal mengambil data kota/kabupaten');
    }

    return res.json() as Promise<RegencyOption[]>;
  },
});
  const createMut = useMutation({ mutationFn: (d:any) => siteApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey:['site'] }); setShowForm(false); setForm(initialForm); setIsEditing(false); toast.success('Site berhasil disimpan'); }, onError: (e:any) => toast.error(e.response?.data?.message || 'Gagal menyimpan site') });
  const updateMut = useMutation({ mutationFn: ({id,d}:any) => siteApi.update(id,d), onSuccess: () => { qc.invalidateQueries({ queryKey:['site'] }); setShowForm(false); setForm(initialForm); setIsEditing(false); setSelectedId(null); toast.success('Site berhasil diperbarui'); }, onError: (e:any) => toast.error(e.response?.data?.message || 'Gagal memperbarui site') });
  const deleteMut = useMutation({ mutationFn: (id:string) => siteApi.remove(id), onSuccess: () => { qc.invalidateQueries({ queryKey:['site'] }); toast.success('Site dihapus'); }, onError: (e: any) =>
  toast.error(e.response?.data?.message || 'Gagal menghapus site'), });

  const openEdit = (site: any) => {
  const provinceName = site.provinsi || 'Jawa Timur';
  const matchedProvince = provinces.find(
    (item: ProvinceOption) =>
      item.name.toLowerCase() === provinceName.toLowerCase()
  );

  setSelectedId(site.id);
  setIsEditing(true);
  setShowForm(true);
  setSelectedProvinceId(matchedProvince?.id || '');

  setForm({
    kode_site: site.kode_site || '',
    nama_site: site.nama_site || '',
    kota: site.kota || '',
    provinsi: provinceName,
    latitude: site.latitude?.toString() || '',
    longitude: site.longitude?.toString() || '',
    status: site.status || 'aktif',
    catatan: site.catatan || '',
  });
};

  const submit = (e:any) => {
    e.preventDefault();
    const payload = {
      ...form,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
    };
    if (isEditing && selectedId) updateMut.mutate({ id: selectedId, d: payload });
    else createMut.mutate(payload);
  };

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Master Area</div>
          <h2 className="display-title">Site Management</h2>
          <p className="section-subtitle">Kelola semua site.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setIsEditing(false);
            setSelectedId(null);
            setSelectedProvinceId('');
            setForm(initialForm);
          }}
          className="btn btn-primary w-full sm:w-auto"
        >
          <Plus size={15} /> {showForm ? 'Tutup Form' : 'Tambah Site'}
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">{isEditing ? 'Edit Site' : 'Form Tambah Site'}</h3>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['Kode Site', 'kode_site', 'SITE-MAGETAN'],
              ['Nama Site', 'nama_site', 'Magetan'],
            ].map(([label, key, placeholder]: any) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
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
              <label className="label">Provinsi</label>
              <select
                className="input"
                value={selectedProvinceId}
                onChange={(e) => {
                  const provinceId = e.target.value;
                  const provinceName =
                    provinces.find((item: ProvinceOption) => item.id === provinceId)?.name ||
                    '';

                  setSelectedProvinceId(provinceId);

                  setForm((p) => ({
                    ...p,
                    provinsi: provinceName,
                    kota: '',
                  }));
                }}
                required
              >
                <option value="">
                  {isLoadingProvinces ? 'Memuat provinsi...' : '-- pilih provinsi --'}
                </option>

                {provinces.map((province: ProvinceOption) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Kota / Kabupaten</label>
              <select
                className="input"
                value={form.kota}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    kota: e.target.value,
                  }))
                }
                disabled={!selectedProvinceId}
                required
              >
                <option value="">
                  {!selectedProvinceId
                    ? '-- pilih provinsi dahulu --'
                    : isLoadingRegencies
                      ? 'Memuat kota/kabupaten...'
                      : '-- pilih kota/kabupaten --'}
                </option>

                {regencies.map((regency: RegencyOption) => (
                  <option key={regency.id} value={regency.name}>
                    {regency.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="aktif">aktif</option>
                <option value="non_aktif">non_aktif</option>
              </select>
            </div>
            <div className="md:col-span-2"><label className="label">Catatan</label><textarea className="input h-20 resize-none" value={form.catatan} onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} /></div>
            <div className="md:col-span-2 flex gap-2 justify-end border-t border-slate-100 pt-3 dark:border-white/10">
              <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
                setSelectedId(null);
                setSelectedProvinceId('');
                setForm(initialForm);
              }}
              className="btn btn-ghost"
            >
              Batal
            </button>
              <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn btn-primary">{isEditing ? 'Perbarui Site' : 'Simpan Site'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap dark:border-white/10">
          <div className="search-box max-w-sm">
            <Search size={14} />
            <input placeholder="Cari kode, nama, kota..." value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr>{['Kode','Nama','Kota','Provinsi','Status','Koordinat','Aksi'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center text-xs text-slate-400"><RefreshCw size={16} className="animate-spin mx-auto" /></td></tr>}
              {(data?.data || []).map((site:any) => (
                <tr key={site.id}>
                  <td className="font-mono text-xs font-bold text-orange-600 whitespace-nowrap">{site.kode_site}</td>
                  <td className="font-semibold text-slate-800 dark:text-zinc-200">{site.nama_site}</td>
                  <td className="text-slate-500 dark:text-zinc-400">{site.kota || '—'}</td>
                  <td className="text-slate-500 dark:text-zinc-400">{site.provinsi || '—'}</td>
                  <td><span className={`badge ${statusColor[site.status] || 'badge-nonaktif'}`}>{site.status}</span></td>
                  <td className="text-xs text-slate-500 dark:text-zinc-400">{site.latitude && site.longitude ? `${site.latitude}, ${site.longitude}` : '—'}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(site)} className="p-1.5 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-orange-600 dark:hover:bg-orange-500/10" title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => { confirmAction('Hapus site ini?', () => deleteMut.mutate(site.id)); }} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 dark:hover:bg-red-500/10" title="Hapus"><Trash2 size={14} /></button>
                      {site.latitude && site.longitude && <a href={`https://maps.google.com/?q=${site.latitude},${site.longitude}`} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:bg-emerald-500/10" title="Buka Maps"><MapPin size={14} /></a>}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.data?.length && <tr><td colSpan={7} className="text-center text-xs text-slate-400 py-12">Belum ada data site.</td></tr>}
            </tbody>
          </table>
        </div>
        {data?.meta && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 dark:border-white/10 dark:text-zinc-400">
            <span>Total: {data.meta.total} site</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(data.meta.pages || 1, 5) }, (_, i) => i + 1).map(p => <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold ${p === page ? 'bg-orange-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}>{p}</button>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
