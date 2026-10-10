const styles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Assigned: "bg-blue-50 text-blue-700 ring-blue-200",
  "In Progress": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Cancelled: "bg-gray-100 text-gray-600 ring-gray-200",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "On Leave": "bg-amber-50 text-amber-700 ring-amber-200",
  Open: "bg-rose-50 text-rose-700 ring-rose-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  High: "bg-rose-50 text-rose-700 ring-rose-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Low: "bg-gray-100 text-gray-600 ring-gray-200",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] ?? "bg-gray-100 text-gray-700 ring-gray-200"
      }`}
    >
      {status}
    </span>
  );
}