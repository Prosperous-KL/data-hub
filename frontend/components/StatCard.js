export default function StatCard({ title, value, tone = "default" }) {
  const toneMap = {
    default: "from-slate-700 to-slate-900",
    success: "from-emerald-600 to-emerald-800",
    info: "from-sky-600 to-sky-800",
    warning: "from-amber-500 to-amber-700"
  };

  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`mt-2 inline-block rounded-lg bg-gradient-to-r px-3 py-1 text-2xl font-bold text-white ${toneMap[tone]}`}>
        {value}
      </p>
    </div>
  );
}
