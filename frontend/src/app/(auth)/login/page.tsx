'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Network } from 'lucide-react';
import ThemeToggle from '@/components/Common/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: 'admin@ospmapper.id', password: 'Admin@12345' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const data = await authApi.login(form);

    const accessToken =
      data?.accessToken ||
      data?.access_token ||
      data?.token;

    const user =
      data?.user ||
      data?.admin ||
      data?.profile ||
      {};

    if (!accessToken) {
      console.log('Response login:', data);
      toast.error('Login gagal. Token tidak ditemukan.');
      return;
    }

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    toast.success(`Login berhasil. Selamat datang, ${user.full_name || user.name || 'Admin'}`);

    router.replace('/dashboard');
  } catch (err: any) {
    console.log('Login error:', err?.response?.data || err);
    const rawMsg = err.response?.data?.message;
    const msg = typeof rawMsg === 'string' ? rawMsg : rawMsg?.message || 'Login gagal';
    toast.error(msg);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 p-4 text-slate-950 dark:bg-[#0D0F10] dark:text-white">
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-slate-500/10 blur-3xl" />
      <div className="absolute right-5 top-5 z-50"><ThemeToggle /></div>

      <div className="relative z-10 grid min-h-[calc(100vh-2rem)] place-items-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 shadow-2xl shadow-slate-900/10 backdrop-blur-xl md:grid-cols-[1.1fr_.9fr] dark:border-white/10 dark:bg-[#121516]/90">
          <div className="hidden p-10 md:flex flex-col justify-between bg-[#0D0F10] text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 20%, #FF6A3D, transparent 22rem)' }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 font-mono text-xs text-orange-200">
                <Network size={14} /> Fiber Asset Mapping
              </div>
              <h1 className="mt-8 max-w-sm text-6xl leading-none" style={{ fontFamily: 'Bebas Neue, Inter, sans-serif' }}>OSP MAPPER JAGONET</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-zinc-300">Sistem pemetaan aset OSP untuk site, ODC, ODP, JC, kabel, dan tiang secara terpusat.</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#0D0F10] grid place-items-center shadow-lg shadow-orange-500/20">
                <img src="/icon.svg" alt="OSP MAPPER JAGONET" className="h-10 w-10" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-950 dark:text-white">OSP MAPPER</div>
                <div className="font-mono text-[11px] font-bold tracking-[0.24em] text-orange-500">JAGONET</div>
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Masuk ke akun Anda</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Gunakan akun admin untuk mengelola data jaringan.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-10" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full btn btn-primary py-2.5 mt-2">
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
