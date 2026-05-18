type StatCardProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
};

export default function StatCard({
  label,
  value,
  icon,
  trend = "neutral",
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
        ? "text-red-600"
        : "text-slate-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/40 to-teal-50/40 p-5 shadow-sm hover:shadow-md hover:border-cyan-300/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {icon && <div className="text-cyan-700 opacity-80">{icon}</div>}
      </div>
      <p className="text-3xl font-bold bg-linear-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">
        {value}
      </p>
      {trend !== "neutral" && (
        <p className={`text-xs font-semibold mt-2 ${trendColor}`}>
          {trend === "up" ? "↑ Trending up" : "↓ Trending down"}
        </p>
      )}
    </div>
  );
}
