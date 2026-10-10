export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "green",
  trend,
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
        </div>

        <span className={`rounded-xl p-3 ${colors[color] ?? colors.green}`}>
          <Icon size={22} />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        {trend && (
          <span className="font-semibold text-emerald-700">{trend}</span>
        )}
        <span className="text-gray-500">{subtitle}</span>
      </div>
    </article>
  );
}