import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Filter,
  MapPin,
  Eye,
  Pencil,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import {
  requests,
  collectors,
  users,
  categories,
  complaints,
} from "../data/mockData";

const configs = {
  requests: {
    title: "Pickup Requests",
    description: "Review, search and manage waste collection requests.",
    rows: requests,
    searchFields: ["id", "citizen", "wasteType", "location"],
    columns: [
      ["id", "Request ID"],
      ["citizen", "Citizen"],
      ["wasteType", "Waste Type"],
      ["quantity", "Quantity"],
      ["location", "Location"],
      ["date", "Pickup Date"],
      ["status", "Status"],
    ],
    statuses: ["Pending", "Assigned", "In Progress", "Completed", "Cancelled"],
    action: "Create Request",
  },
  collectors: {
    title: "Collectors",
    description: "Manage collection personnel, zones and daily workload.",
    rows: collectors,
    searchFields: ["id", "name", "zone", "phone"],
    columns: [
      ["id", "Collector ID"],
      ["name", "Name"],
      ["zone", "Assigned Zone"],
      ["phone", "Phone"],
      ["tasks", "Tasks"],
      ["completed", "Completed"],
      ["status", "Status"],
    ],
    statuses: ["Active", "On Leave"],
    action: "Add Collector",
  },
  users: {
    title: "Users",
    description: "View citizen accounts and collection staff profiles.",
    rows: users,
    searchFields: ["id", "name", "email", "role"],
    columns: [
      ["id", "User ID"],
      ["name", "Name"],
      ["email", "Email"],
      ["role", "Role"],
      ["joined", "Joined"],
      ["status", "Status"],
    ],
    statuses: ["Active", "Inactive"],
    action: "Add User",
  },
  categories: {
    title: "Waste Categories",
    description: "Manage waste types and recycling classifications.",
    rows: categories,
    searchFields: ["id", "name", "type", "description"],
    columns: [
      ["id", "Category ID"],
      ["name", "Category"],
      ["type", "Classification"],
      ["description", "Description"],
      ["recyclable", "Recyclable"],
    ],
    action: "Add Category",
  },
  complaints: {
    title: "Complaints",
    description: "Track reported collection issues and resolutions.",
    rows: complaints,
    searchFields: ["id", "subject", "citizen", "priority"],
    columns: [
      ["id", "Complaint ID"],
      ["subject", "Subject"],
      ["citizen", "Reported By"],
      ["date", "Date"],
      ["priority", "Priority"],
      ["status", "Status"],
    ],
    statuses: ["Open", "In Progress", "Resolved"],
    action: "New Complaint",
  },
};

export default function ManagementPage({ type }) {
  const config = configs[type];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const filteredRows = useMemo(() => {
    return config.rows.filter((row) => {
      const matchesSearch = config.searchFields.some((field) =>
        String(row[field] ?? "")
          .toLowerCase()
          .includes(search.toLowerCase())
      );

      const matchesStatus =
        status === "All" ||
        String(row.status ?? "") === status;

      return matchesSearch && matchesStatus;
    });
  }, [config, search, status]);

  function exportCsv() {
    const headers = config.columns.map((column) => column[1]);

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const lines = [
      headers.map(escapeCsv).join(","),
      ...filteredRows.map((row) =>
        config.columns
          .map(([key]) =>
            escapeCsv(
              key === "recyclable"
                ? row[key] ? "Yes" : "No"
                : row[key]
            )
          )
          .join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${type}-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!config) return null;

  return (
    <div>
      <PageHeader
        title={config.title}
        description={config.description}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            <Plus size={18} />
            {config.action}
          </button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total records</p>
          <p className="mt-2 text-2xl font-bold">{config.rows.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Matching records</p>
          <p className="mt-2 text-2xl font-bold">{filteredRows.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Current view</p>
          <p className="mt-2 text-2xl font-bold">{status}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${config.title.toLowerCase()}...`}
              aria-label={`Search ${config.title}`}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {config.statuses && (
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3">
                <Filter size={16} className="text-gray-500" />
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  aria-label="Filter by status"
                  className="max-w-40 bg-transparent py-2.5 text-sm outline-none"
                >
                  <option value="All">All statuses</option>
                  {config.statuses.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            )}

            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                {config.columns.map(([key, label]) => (
                  <th key={key} className="px-5 py-4 font-semibold">
                    {label}
                  </th>
                ))}
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80">
                  {config.columns.map(([key]) => (
                    <td key={key} className="px-5 py-4 text-gray-600">
                      {key === "status" || key === "priority" ? (
                        <StatusBadge status={row[key]} />
                      ) : key === "id" ? (
                        <span className="font-semibold text-emerald-800">
                          {row[key]}
                        </span>
                      ) : key === "recyclable" ? (
                        row[key] ? "Yes" : "No"
                      ) : key === "location" ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} /> {row[key]}
                        </span>
                      ) : (
                        row[key] ?? "—"
                      )}
                    </td>
                  ))}

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelected(row)}
                        aria-label={`View ${row.id}`}
                        className="rounded-lg p-2 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        onClick={() => {
                          setSelected(row);
                          setShowForm(true);
                        }}
                        aria-label={`Edit ${row.id}`}
                        className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRows.length === 0 && (
            <EmptyState
              title="No matching records"
              description="Try a different search term or status filter."
            />
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
          Showing {filteredRows.length} of {config.rows.length} records
        </div>
      </section>

      {(selected || showForm) && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-gray-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null);
              setShowForm(false);
            }
          }}
        >
          <section className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">
                {selected && !showForm ? "Record details" : selected ? "Edit record" : config.action}
              </h2>
              <button
                onClick={() => {
                  setSelected(null);
                  setShowForm(false);
                }}
                className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            {selected && !showForm ? (
              <dl className="mt-5 space-y-4">
                {config.columns.map(([key, label]) => (
                  <div key={key} className="border-b border-gray-100 pb-3">
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {String(selected[key] ?? "—")}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                This is a frontend preview. Create and edit operations will be connected to the backend API in the integration phase.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}