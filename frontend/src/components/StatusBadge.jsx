const STATUS_STYLES = {
  pending:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
};

const STATUS_DOTS = {
  pending:  'bg-amber-400',
  approved: 'bg-emerald-400',
  rejected: 'bg-rose-400'
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge border ${STATUS_STYLES[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'} capitalize`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
}
