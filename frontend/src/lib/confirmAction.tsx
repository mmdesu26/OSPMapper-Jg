import toast from 'react-hot-toast';

export function confirmAction(message: string, onConfirm: () => void) {
  toast((t) => (
    <div className="w-full max-w-sm">
      <div className="text-sm font-bold text-slate-900 dark:text-white">Konfirmasi</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{message}</div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10"
          onClick={() => toast.dismiss(t.id)}
        >
          Batal
        </button>
        <button
          type="button"
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
          onClick={() => { toast.dismiss(t.id); onConfirm(); }}
        >
          Hapus
        </button>
      </div>
    </div>
  ), { duration: 6000 });
}
