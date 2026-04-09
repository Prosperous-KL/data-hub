export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
      <span className="h-2 w-2 animate-pulse rounded-full bg-brand-sky" />
      {label}
    </div>
  );
}
