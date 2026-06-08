'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mapApi, odcApi } from '@/lib/api';
import {
  Building2,
  Antenna,
  Layers,
  Triangle,
  Cable,
  Activity,
  TrendingUp,
  MapPin,
  Coins,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const StatCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="card card-hover min-w-0 p-4 sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="eyebrow mb-1 break-words text-[10px] sm:text-[11px]">
          {label}
        </p>

        <p className="break-words text-xl font-extrabold leading-tight text-slate-950 sm:text-2xl dark:text-white">
          {value ?? '—'}
        </p>

        {sub && (
          <p className="mt-1 break-words text-[11px] leading-snug text-slate-400 sm:text-xs dark:text-zinc-500">
            {sub}
          </p>
        )}
      </div>

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl"
        style={{ background: color + '18' }}
      >
        <Icon size={18} style={{ color }} />
      </div>
    </div>
  </div>
);

const CORE_COLORS = ['#FF6A3D', '#10B981', '#EF4444', '#8B5CF6'];

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--text)',
};

export default function DashboardPage() {
  const [range, setRange] = useState<'all' | '1' | '2' | '3'>('all');

  const { data: stats, isLoading } = useQuery({
  queryKey: ['dashboard', range],
  queryFn: () => mapApi.dashboard({ months: range }),
});

  const { data: odcData } = useQuery({
    queryKey: ['odc-list', { limit: 5 }],
    queryFn: () => odcApi.list({ limit: 5 }),
  });

  const coreData = stats
    ? [
        { name: 'Used', value: stats.core?.used || 0 },
        { name: 'Spare', value: stats.core?.spare || 0 },
        { name: 'Broken', value: stats.core?.broken || 0 },
        { name: 'Reserved', value: stats.core?.reserved || 0 },
      ]
    : [];

  const statusColor: Record<string, string> = {
    aktif: 'badge-aktif',
    penuh: 'badge-penuh',
    maintenance: 'badge-maintenance',
  };

  const assetBySite = stats?.bySite || [];

  return (
    <div className="page-shell">
      {/* Heading */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">OSP MAPPER JAGONET</div>
          <h2 className="display-title">Dashboard Aset Jaringan</h2>
          <p className="section-subtitle">
            Angka dihitung langsung dari Site, ODC, ODP, JC, Kabel, Tiang, dan Core.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-7 sm:gap-4">
        <StatCard
          label="Site"
          value={isLoading ? '…' : stats?.site?.total}
          icon={MapPin}
          color="#FF6A3D"
          sub="Area operasi"
        />

        <StatCard
          label="ODC"
          value={isLoading ? '…' : stats?.odc?.total}
          icon={Building2}
          color="#2563EB"
          sub="Cabinet"
        />

        <StatCard
          label="ODP"
          value={isLoading ? '…' : stats?.odp?.total}
          icon={Antenna}
          color="#059669"
          sub="Distribution point"
        />

        <StatCard
          label="JC"
          value={isLoading ? '…' : stats?.jc?.total}
          icon={Layers}
          color="#D97706"
          sub="Joint closure"
        />

        <StatCard
          label="Tiang"
          value={isLoading ? '…' : stats?.tiang?.total}
          icon={Triangle}
          color="#6B7280"
          sub="Pole"
        />

        <StatCard
          label="Kabel"
          value={isLoading ? '…' : `${stats?.kabel?.total_km || 0} km`}
          icon={Cable}
          color="#7C3AED"
          sub={`${stats?.kabel?.total || 0} segmen`}
        />

        <StatCard
          label="Core Used"
          value={isLoading ? '…' : stats?.core?.used}
          icon={Activity}
          color="#10B981"
          sub="Core aktif"
        />
      </div>

<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
      Grafik Aset Jaringan
    </h3>
    <p className="text-xs text-slate-400 dark:text-zinc-500">
      Tampilkan data aset berdasarkan periode tertentu.
    </p>
  </div>

  <div className="flex flex-wrap gap-2">
    {[
      { label: 'Semua', value: 'all' },
      { label: '1 Bulan', value: '1' },
      { label: '2 Bulan', value: '2' },
      { label: '3 Bulan', value: '3' },
    ].map((item) => (
      <button
        key={item.value}
        onClick={() => setRange(item.value as 'all' | '1' | '2' | '3')}
        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
          range === item.value
            ? 'bg-orange-500 text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15'
        }`}
      >
        {item.label}
      </button>
    ))}
  </div>
</div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        {/* Bar Chart */}
        <div className="card p-4 sm:p-5 xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Jumlah Aset per Site
              {range !== 'all' && ` - ${range} Bulan Terakhir`}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[520px] sm:min-w-0">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={assetBySite} barGap={3} barCategoryGap="28%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,.2)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="nama_site"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                  <Bar dataKey="odc" name="ODC" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="odp" name="ODP" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="jc" name="JC" fill="#D97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tiang" name="Tiang" fill="#6B7280" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="kabel" name="Kabel" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-white">
            Status Core Kabel
          </h3>

          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={coreData}
                dataKey="value"
                nameKey="name"
                innerRadius={46}
                outerRadius={72}
                paddingAngle={3}
              >
                {coreData.map((_: any, i: number) => (
                  <Cell key={i} fill={CORE_COLORS[i % CORE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {coreData.map((d: any, i: number) => (
              <div
                key={d.name}
                className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: CORE_COLORS[i] }}
                />
                <span className="truncate">{d.name}:</span>
                <span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* ODC Terbaru */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4 dark:border-white/10">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              ODC Terbaru
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {(odcData?.data || []).map((o: any) => (
              <div
                key={o.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <div className="font-mono text-xs font-bold text-orange-600">
                    {o.kode_odc}
                  </div>
                  <div className="truncate text-sm text-slate-800 dark:text-zinc-200">
                    {o.nama_odc}
                  </div>
                  <div className="text-xs text-slate-400">
                    {o.site?.nama_site || 'Belum pilih site'}
                  </div>
                </div>

                <span
                  className={`badge w-fit shrink-0 ${
                    statusColor[o.status] || 'badge-nonaktif'
                  }`}
                >
                  {o.status}
                </span>
              </div>
            ))}

            {!odcData?.data?.length && (
              <div className="px-5 py-8 text-center text-xs text-slate-400">
                Belum ada data ODC.
              </div>
            )}
          </div>
        </div>

        {/* Ringkasan Nilai Aset */}
        <div className="card p-4 sm:p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">
            Total Keseluruhan Nilai Aset
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:p-4 dark:bg-white/5">
              <span className="text-slate-500 dark:text-zinc-400">
                Estimasi nilai kabel
              </span>
              <b className="break-words sm:text-right">
                {formatRupiah(stats?.kabel?.nilai_kabel || 0)}
              </b>
            </div>

            <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:p-4 dark:bg-white/5">
              <span className="text-slate-500 dark:text-zinc-400">
                Estimasi nilai tiang
              </span>
              <b className="break-words sm:text-right">
                {formatRupiah(stats?.tiang?.nilai_tiang || 0)}
              </b>
            </div>

            <div className="flex flex-col gap-1 rounded-2xl bg-orange-50 p-3 text-orange-700 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:p-4 dark:bg-orange-500/15 dark:text-orange-300">
              <span className="font-medium">Total estimasi</span>
              <b className="break-words sm:text-right">
                {formatRupiah(
                  (stats?.kabel?.nilai_kabel || 0) +
                    (stats?.tiang?.nilai_tiang || 0)
                )}
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}