export function StatCard({
  icon,
  label,
  value,
  color,
  gradient,
  isTime,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  gradient?: string;
  isTime?: boolean;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          gradient || color || "bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <p className={`font-bold text-slate-900 ${isTime ? "text-sm" : "text-lg"} tabular-nums`}>
          {value}
        </p>
      </div>
    </div>
  );
}
