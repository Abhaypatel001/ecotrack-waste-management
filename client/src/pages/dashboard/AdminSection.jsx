
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Truck,
  Users,
  Recycle,
  MessageSquareWarning,
  BarChart3,
  Settings,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Save,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Clock,
  Activity,
  Download,
  RotateCcw,
  MapPin,
  AlertCircle,
  LoaderCircle,
  Weight,
} from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const MANAGEMENT_API = "/api/admin-management";

const statusStyles = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Scheduled: "bg-blue-50 text-blue-700 ring-blue-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  "In Progress": "bg-violet-50 text-violet-700 ring-violet-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  Blocked: "bg-rose-50 text-rose-700 ring-rose-200",
};

const pageConfig = {
  "/admin/schedule": {
    key: "schedules",
    title: "Collection Schedule",
    subtitle: "Plan collection jobs and track their progress.",
    icon: CalendarDays,
    endpoint: "/schedules",
    addLabel: "Add Schedule",
    itemLabel: "schedule",
    activeLabel: "Scheduled",
    fields: [
      { key: "title", label: "Schedule name", required: true, maxLength: 150 },
      { key: "date", label: "Collection date", type: "date", required: true },
      {
        key: "time",
        label: "Collection time",
        type: "select",
        options: [
          "Morning",
          "Afternoon",
          "Evening",
          "09:00 AM - 11:00 AM",
          "11:00 AM - 01:00 PM",
          "02:00 PM - 04:00 PM",
        ],
        required: true,
      },
      { key: "area", label: "Collection area", required: true, maxLength: 200 },
      {
        key: "collectorId",
        label: "Assigned collector",
        type: "collector",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Scheduled", "In Progress", "Completed", "Cancelled"],
        defaultValue: "Scheduled",
      },
    ],
    columns: ["title", "date", "time", "area", "collectorId", "status"],
  },

  "/admin/collectors": {
    key: "collectors",
    title: "Collectors",
    subtitle: "Manage collection staff, contact details and assignments.",
    icon: Truck,
    endpoint: "/collectors",
    addLabel: "Add Collector",
    itemLabel: "collector",
    activeLabel: "Active",
    fields: [
      { key: "name", label: "Full name", required: true, maxLength: 100 },
      {
        key: "phone",
        label: "Phone number",
        type: "tel",
        required: true,
        maxLength: 20,
      },
      {
        key: "email",
        label: "Email address",
        type: "email",
        maxLength: 150,
      },
      { key: "area", label: "Assigned area", required: true, maxLength: 150 },
      { key: "vehicle", label: "Vehicle number", maxLength: 50 },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Active", "Inactive"],
        defaultValue: "Active",
      },
    ],
    columns: ["name", "phone", "email", "area", "vehicle", "status"],
  },

  "/admin/categories": {
    key: "categories",
    title: "Waste Categories",
    subtitle: "Organize waste types and maintain category records.",
    icon: Recycle,
    endpoint: "/categories",
    addLabel: "Add Category",
    itemLabel: "category",
    activeLabel: "Active",
    fields: [
      { key: "name", label: "Category name", required: true, maxLength: 100 },
      {
        key: "wasteType",
        label: "Waste type",
        type: "select",
        options: [
          "Household",
          "Organic",
          "Recyclable",
          "Plastic",
          "Electronic",
          "Hazardous",
          "Construction",
          "Other",
        ],
        required: true,
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        required: true,
        maxLength: 1000,
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Active", "Inactive"],
        defaultValue: "Active",
      },
    ],
    columns: ["name", "wasteType", "description", "status"],
  },
};

function makeEmptyForm(config) {
  return Object.fromEntries(
    config.fields.map((field) => [
      field.key,
      field.defaultValue ??
        (field.type === "select" ? field.options?.[0] ?? "" : ""),
    ])
  );
}

function getId(record) {
  return record?._id || record?.id || "";
}

function displayValue(record, key) {
  const value = record?.[key];

  if (key === "collectorId") {
    return value?.name || "Unassigned";
  }

  if (key === "date" || key === "createdAt") {
    return formatDate(value);
  }

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function formatDate(value) {
  if (!value) return "—";

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatDateTime(value) {
  if (!value) return "—";

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString("en-IN");
}

function useAdminApi() {
  const navigate = useNavigate();

  return useCallback(
    async (path, options = {}) => {
      const token = localStorage.getItem("ecotrack-token");

      if (!token) {
        navigate("/login", { replace: true });
        const error = new Error("Please log in to continue.");
        error.status = 401;
        throw error;
      }

      const headers = new Headers(options.headers || {});
      headers.set("Authorization", `Bearer ${token}`);
      headers.set("Accept", "application/json");

      if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("ecotrack-token");
        localStorage.removeItem("ecotrack-user");
        navigate("/login", { replace: true });
      }

      if (response.status === 401 || response.status === 403) {
        const error = new Error(
          result.message ||
            (response.status === 403
              ? "Admin permission is required."
              : "Your session has expired.")
        );
        error.status = response.status;
        throw error;
      }

      if (!response.ok || result.success === false) {
        const error = new Error(
          result.message || `Request failed (${response.status}).`
        );
        error.status = response.status;
        throw error;
      }

      return result;
    },
    [navigate]
  );
}

/* ---------- Shared reusable form controls ---------- */

function FieldControl({
  field,
  value,
  onChange,
  collectors = [],
  disabled = false,
}) {
  const common =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50";

  if (field.type === "collector") {
    return (
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={common}
      >
        <option value="">Unassigned</option>
        {collectors
          .filter((collector) => collector.status === "Active")
          .map((collector) => (
            <option key={collector._id} value={collector._id}>
              {collector.name} — {collector.area}
            </option>
          ))}
      </select>
    );
  }

  if (field.type === "select") {
    return (
      <select
        required={field.required}
        disabled={disabled}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className={common}
      >
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        required={field.required}
        maxLength={field.maxLength}
        rows={3}
        disabled={disabled}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Enter ${field.label.toLowerCase()}`}
        className={common}
      />
    );
  }

  return (
    <input
      required={field.required}
      maxLength={field.maxLength}
      type={field.type || "text"}
      disabled={disabled}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={`Enter ${field.label.toLowerCase()}`}
      className={common}
    />
  );
}

function Notice({ message, error = false, onClose }) {
  if (!message) return null;

  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
        error
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <div className="flex items-start gap-2">
        {error ? (
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
        ) : (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        )}
        <span className="break-words">{message}</span>
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss message">
        <X size={17} />
      </button>
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
        statusStyles[status] || "bg-slate-50 text-slate-600 ring-slate-200"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

/* ---------- Schedule, Collector and Category CRUD ---------- */

function EntityManagement({ config }) {
  const Icon = config.icon;
  const api = useAdminApi();

  const [records, setRecords] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => makeEmptyForm(config));

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const statusField = config.fields.find((field) => field.key === "status");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await api(`${MANAGEMENT_API}${config.endpoint}`);
      setRecords(Array.isArray(result.data) ? result.data : []);

      if (config.key === "schedules") {
        const collectorResult = await api(
          `${MANAGEMENT_API}/collectors`
        );
        setCollectors(
          Array.isArray(collectorResult.data) ? collectorResult.data : []
        );
      } else {
        setCollectors([]);
      }
    } catch (err) {
      setError(err.message || `Unable to load ${config.title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [api, config]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  function openAddForm() {
    setEditingId(null);
    setForm(makeEmptyForm(config));
    setShowForm(true);
    setNotice("");
    setError("");
  }

  function openEditForm(record) {
    const nextForm = Object.fromEntries(
      config.fields.map((field) => {
        let value = record[field.key];

        if (field.key === "collectorId") {
          value = value?._id || value || "";
        }

        if (value === null || value === undefined) value = "";

        return [field.key, value];
      })
    );

    setEditingId(getId(record));
    setForm(nextForm);
    setShowForm(true);
    setNotice("");
    setError("");
  }

  async function submitForm(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setNotice("");

    const payload = { ...form };

    if (config.key === "schedules") {
      payload.collectorId = payload.collectorId || null;
    }

    try {
      const endpoint = `${MANAGEMENT_API}${config.endpoint}${
        editingId ? `/${editingId}` : ""
      }`;

      const result = await api(endpoint, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      const saved = result.data;

      if (!saved?._id) {
        throw new Error("The server did not return the saved database record.");
      }

      setRecords((current) =>
        editingId
          ? current.map((record) =>
              getId(record) === editingId ? saved : record
            )
          : [saved, ...current]
      );

      setShowForm(false);
      setEditingId(null);
      setForm(makeEmptyForm(config));
      setNotice(result.message || `${config.itemLabel} saved successfully.`);
    } catch (err) {
      setError(err.message || `Unable to save ${config.itemLabel}.`);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(record, status) {
    if (record.status === status || busyId) return;

    const id = getId(record);
    setBusyId(id);
    setError("");
    setNotice("");

    try {
      const result = await api(
        `${MANAGEMENT_API}${config.endpoint}/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      setRecords((current) =>
        current.map((item) =>
          getId(item) === id ? result.data : item
        )
      );

      setNotice(result.message || "Status updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update status.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRecord(record) {
    const id = getId(record);

    if (!id || busyId) return;

    if (
      !window.confirm(
        `Delete this ${config.itemLabel}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setBusyId(id);
    setError("");
    setNotice("");

    try {
      const result = await api(
        `${MANAGEMENT_API}${config.endpoint}/${id}`,
        { method: "DELETE" }
      );

      setRecords((current) =>
        current.filter((item) => getId(item) !== id)
      );

      setNotice(result.message || `${config.itemLabel} deleted successfully.`);
    } catch (err) {
      setError(err.message || `Unable to delete ${config.itemLabel}.`);
    } finally {
      setBusyId(null);
    }
  }

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch = config.fields.some((field) =>
        displayValue(record, field.key).toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === "All" ||
        !statusField ||
        record[statusField.key] === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter, config, statusField]);

  const activeCount = statusField
    ? records.filter((record) => record.status === config.activeLabel).length
    : 0;

  const needsAttention = records.filter((record) =>
    ["Pending", "Inactive", "Cancelled"].includes(record.status)
  ).length;

  const exportCsv = () => {
    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      ["ID", ...config.columns].map(escapeCsv).join(","),
      ...filteredRecords.map((record) =>
        [
          getId(record),
          ...config.columns.map((key) => displayValue(record, key)),
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ecotrack-${config.key}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-600 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-8">
        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Icon size={25} />
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            {config.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-emerald-50 sm:text-base">
            {config.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 font-semibold transition hover:bg-white/20 disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-emerald-900 transition hover:bg-emerald-50"
          >
            <Plus size={19} />
            {config.addLabel}
          </button>
        </div>
      </section>

      <Notice message={notice} onClose={() => setNotice("")} />
      <Notice message={error} error onClose={() => setError("")} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: `Total ${config.title}`,
            value: records.length,
            icon: ClipboardList,
            style: "bg-slate-100 text-slate-700",
          },
          {
            label: config.activeLabel,
            value: activeCount,
            icon: CheckCircle2,
            style: "bg-emerald-100 text-emerald-700",
          },
          {
            label: "Needs Attention",
            value: needsAttention,
            icon: Clock,
            style: "bg-amber-100 text-amber-700",
          },
        ].map((stat) => {
          const StatIcon = stat.icon;

          return (
            <article
              key={stat.label}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {loading ? "…" : stat.value}
                </p>
              </div>
              <span className={`rounded-xl p-3 ${stat.style}`}>
                <StatIcon size={23} />
              </span>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {config.title} Directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading records from MongoDB..."
                : `${filteredRecords.length} of ${records.length} database records`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${config.itemLabel}...`}
                className="min-w-0 py-3 text-sm outline-none sm:w-48"
              />
            </div>

            {statusField && (
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                {statusField.options.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={exportCsv}
              disabled={!filteredRecords.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <LoaderCircle size={32} className="animate-spin text-emerald-700" />
            <p className="mt-4 font-semibold text-slate-800">
              Loading database records...
            </p>
          </div>
        ) : error && records.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle size={30} className="mx-auto text-rose-600" />
            <p className="mt-3 font-bold text-slate-900">
              Unable to load records
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Check the API endpoint and backend terminal.
            </p>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="mt-4 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Icon size={32} className="mx-auto text-emerald-700" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {records.length ? "No matching records" : `No ${config.itemLabel} records yet`}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {records.length
                ? "Try another search term or status filter."
                : "Create your first record. It will be saved in MongoDB."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {config.columns.map((key) => (
                    <th key={key} className="px-5 py-4">
                      {config.fields.find((field) => field.key === key)?.label || key}
                    </th>
                  ))}
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => {
                  const id = getId(record);

                  return (
                    <tr key={id} className="hover:bg-slate-50/70">
                      {config.columns.map((key) => (
                        <td key={key} className="max-w-xs px-5 py-4 text-slate-700">
                          {key === "status" && statusField?.options ? (
                            <select
                              value={record.status || statusField.options[0]}
                              disabled={busyId === id}
                              onChange={(event) => updateStatus(record, event.target.value)}
                              className={`rounded-full px-3 py-2 text-xs font-semibold ring-1 outline-none disabled:opacity-60 ${
                                statusStyles[record.status] ||
                                "bg-slate-50 text-slate-600 ring-slate-200"
                              }`}
                            >
                              {statusField.options.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="break-words">
                              {displayValue(record, key)}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Edit"
                            disabled={busyId === id}
                            onClick={() => openEditForm(record)}
                            className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            disabled={busyId === id}
                            onClick={() => deleteRecord(record)}
                            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {busyId === id ? (
                              <LoaderCircle size={17} className="animate-spin" />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? `Edit ${config.itemLabel}` : config.addLabel}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Changes will be saved in MongoDB.
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={submitForm} className="p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {config.fields.map((field) => (
                  <label
                    key={field.key}
                    className={`space-y-2 text-sm font-medium text-slate-700 ${
                      field.type === "textarea" ? "sm:col-span-2" : ""
                    }`}
                  >
                    {field.label}
                    {field.required && <span className="text-rose-500"> *</span>}
                    <FieldControl
                      field={field}
                      value={form[field.key]}
                      collectors={collectors}
                      disabled={saving}
                      onChange={(value) =>
                        setForm((old) => ({ ...old, [field.key]: value }))
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Real registered users ---------- */

function UserDirectory() {
  const api = useAdminApi();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const result = await api("/api/admin/users");
        if (alive) setUsers(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        if (alive) setError(err.message || "Unable to load registered users.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      alive = false;
    };
  }, [api, refreshKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) =>
      [user.name, user.email, user.role].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [users, search]);

  const residents = users.filter((user) => user.role === "user").length;
  const admins = users.filter((user) => user.role === "admin").length;

  return (
    <div className="space-y-6">
      <PageBanner
        title="Registered Users"
        subtitle="Real user accounts loaded from MongoDB."
        icon={Users}
        action={
          <RefreshButton
            loading={loading}
            onClick={() => setRefreshKey((value) => value + 1)}
          />
        }
      />

      <Notice message={error} error onClose={() => setError("")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Accounts" value={loading ? "…" : users.length} icon={Users} />
        <StatCard label="Resident Accounts" value={loading ? "…" : residents} icon={CheckCircle2} />
        <StatCard label="Admin Accounts" value={loading ? "…" : admins} icon={Activity} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">User Directory</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} of {users.length} database accounts
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or role..."
              className="min-w-0 py-3 text-sm outline-none sm:w-64"
            />
          </div>
        </div>

        {loading ? (
          <LoadingPanel />
        ) : filtered.length === 0 ? (
          <EmptyPanel title="No matching accounts" text="Users registered in MongoDB will appear here." icon={Users} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user.id || user._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {user.name || "Unnamed account"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{user.email}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={user.role === "admin" ? "Active" : "Scheduled"} />
                      <span className="ml-2 text-xs text-slate-600">
                        {user.role === "admin" ? "Admin" : "Resident"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
        This page is read-only. Blocking accounts, creating new user accounts and changing roles need separate backend authorization rules and database fields.
      </p>
    </div>
  );
}

/* ---------- Actual issue reports / complaints ---------- */

function ComplaintsManagement() {
  const api = useAdminApi();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const issueStatuses = ["Pending", "In Progress", "Resolved"];

  useEffect(() => {
    let alive = true;

    async function loadIssues() {
      setLoading(true);
      setError("");

      try {
        const result = await api("/api/issues");
        if (alive) setIssues(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        if (alive) setError(err.message || "Unable to load issue reports.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadIssues();
    return () => {
      alive = false;
    };
  }, [api, refreshKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchStatus = filter === "All" || issue.status === filter;
      const matchSearch = [
        issue.category,
        issue.description,
        issue.address,
        issue.status,
        issue.reporterId,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      return matchStatus && matchSearch;
    });
  }, [issues, search, filter]);

  async function updateStatus(issue, status) {
    if (busyId) return;

    setBusyId(issue._id);
    setError("");
    setNotice("");

    try {
      const result = await api(`/api/issues/${issue._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setIssues((current) =>
        current.map((item) =>
          item._id === issue._id
            ? { ...item, ...(result.data || {}), status }
            : item
        )
      );
      setNotice("Issue report status updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update report status.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteIssue(issue) {
    if (
      !window.confirm("Delete this issue report permanently?") ||
      busyId
    ) {
      return;
    }

    setBusyId(issue._id);
    setError("");
    setNotice("");

    try {
      const result = await api(`/api/issues/${issue._id}`, {
        method: "DELETE",
      });

      setIssues((current) =>
        current.filter((item) => item._id !== issue._id)
      );
      setNotice(result.message || "Issue report deleted.");
    } catch (err) {
      setError(err.message || "Unable to delete issue report.");
    } finally {
      setBusyId(null);
    }
  }

  const openCount = issues.filter(
    (issue) => !["Resolved", "Closed", "Completed"].includes(issue.status)
  ).length;

  return (
    <div className="space-y-6">
      <PageBanner
        title="Complaints"
        subtitle="Review actual user-submitted issue reports and track resolution."
        icon={MessageSquareWarning}
        action={
          <RefreshButton
            loading={loading}
            onClick={() => setRefreshKey((value) => value + 1)}
          />
        }
      />

      <Notice message={notice} onClose={() => setNotice("")} />
      <Notice message={error} error onClose={() => setError("")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Reports" value={loading ? "…" : issues.length} icon={ClipboardList} />
        <StatCard label="Open Reports" value={loading ? "…" : openCount} icon={Clock} />
        <StatCard
          label="Resolved"
          value={loading ? "…" : issues.filter((issue) => issue.status === "Resolved").length}
          icon={CheckCircle2}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">User Issue Reports</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} of {issues.length} real reports
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reports..."
                className="min-w-0 py-3 text-sm outline-none sm:w-52"
              />
            </div>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
              aria-label="Filter issue reports by status"
            >
              <option value="All">All statuses</option>
              {issueStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingPanel />
        ) : filtered.length === 0 ? (
          <EmptyPanel title="No issue reports found" text="User-submitted complaints will appear here after the Issues API returns them." icon={MessageSquareWarning} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Issue</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Address</th>
                  <th className="px-5 py-4">Submitted</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((issue) => (
                  <tr key={issue._id} className="align-top hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{issue.category || "Uncategorised"}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        ID: {String(issue._id).slice(-8).toUpperCase()}
                      </p>
                      {issue.photoUrl && (
                        <a
                          href={
                            /^https?:\/\//i.test(issue.photoUrl)
                              ? issue.photoUrl
                              : `${API_BASE}${issue.photoUrl.startsWith("/") ? "" : "/"}${issue.photoUrl}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block font-semibold text-emerald-700 hover:underline"
                        >
                          View photo
                        </a>
                      )}
                    </td>
                    <td className="max-w-xs whitespace-pre-wrap px-5 py-4 text-slate-600">
                      {issue.description || "—"}
                    </td>
                    <td className="max-w-xs px-5 py-4 text-slate-600">
                      <div className="flex items-start gap-1">
                        <MapPin size={15} className="mt-0.5 shrink-0" />
                        <span>{issue.address || "Not provided"}</span>
                      </div>
                      {issue.latitude != null && issue.longitude != null && (
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${issue.latitude}&mlon=${issue.longitude}#map=16/${issue.latitude}/${issue.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          View location
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDateTime(issue.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={issue.status || "Pending"}
                        disabled={busyId === issue._id}
                        onChange={(event) => updateStatus(issue, event.target.value)}
                        className={`rounded-full px-3 py-2 text-xs font-semibold ring-1 outline-none disabled:opacity-50 ${
                          statusStyles[issue.status] || statusStyles.Pending
                        }`}
                      >
                        {issueStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={busyId === issue._id}
                        onClick={() => deleteIssue(issue)}
                        title="Delete report"
                        className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        {busyId === issue._id ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- Real reports and analytics ---------- */

function ReportsAnalytics() {
  const api = useAdminApi();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadReport() {
      setLoading(true);
      setError("");

      try {
        const result = await api("/api/admin/dashboard");
        if (alive) setData(result.data);
      } catch (err) {
        if (alive) setError(err.message || "Unable to load database reports.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadReport();
    return () => { alive = false; };
  }, [api, refreshKey]);

  const stats = data?.stats;
  const monthlyWaste = data?.monthlyWaste || [];
  const distribution = data?.wasteDistribution || [];
  const requests = data?.requests || [];

  function exportCsv() {
    if (!data) return;

    const rows = [
      ["EcoTrack database report", ""],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Metric", "Value"],
      ["Total pickup requests", stats?.totalRequests ?? 0],
      ["Completed pickups", stats?.completedRequests ?? 0],
      ["Pending pickups", stats?.pendingRequests ?? 0],
      ["Registered users", stats?.registeredUsers ?? 0],
      ["Open issues", stats?.openIssues ?? 0],
      [
        "Recorded completed pickup weight (kg)",
        stats?.totalCollectedWeightKg ?? "Not recorded",
      ],
      [],
      ["Waste category", "Request count", "Request percentage"],
      ...distribution.map((item) => [
        item.name,
        item.count,
        `${item.value}%`,
      ]),
      [],
      ["Request ID", "Resident", "Waste type", "Date", "Status", "Quantity"],
      ...requests.map((item) => [
        item.id,
        item.citizen,
        item.wasteType,
        item.date,
        item.status,
        item.quantity,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ecotrack-database-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="Reports & Analytics"
        subtitle="Statistics and recent records loaded from the protected Admin API."
        icon={BarChart3}
        action={
          <div className="flex gap-2">
            <RefreshButton
              loading={loading}
              onClick={() => setRefreshKey((value) => value + 1)}
            />
            <button
              type="button"
              disabled={!data}
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-900 disabled:opacity-50"
            >
              <Download size={17} />
              Export CSV
            </button>
          </div>
        }
      />

      <Notice message={error} error onClose={() => setError("")} />

      {loading && !data ? (
        <LoadingPanel />
      ) : !data ? (
        <EmptyPanel title="No report data available" text="Check the Admin dashboard API and try refreshing." icon={BarChart3} />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Pickup Requests" value={stats.totalRequests} icon={Truck} />
            <StatCard label="Completed Pickups" value={stats.completedRequests} icon={CheckCircle2} />
            <StatCard label="Registered Users" value={stats.registeredUsers} icon={Users} />
            <StatCard label="Open Issue Reports" value={stats.openIssues} icon={MessageSquareWarning} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Recorded Collection Weight</h2>
              <p className="mt-1 text-sm text-slate-500">
                Completed pickups with actual weight recorded in the database.
              </p>
              <p className="mt-5 text-3xl font-extrabold text-emerald-800">
                {stats.totalCollectedWeightKg == null
                  ? "Not recorded"
                  : `${Number(stats.totalCollectedWeightKg).toLocaleString("en-IN")} kg`}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Recorded for {stats.recordedWeightCount || 0} completed collection(s).
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Waste Category Distribution</h2>
              <p className="mt-1 text-sm text-slate-500">
                Percentage of pickup requests by category, not waste weight.
              </p>
              {distribution.length ? (
                <div className="mt-5 space-y-4">
                  {distribution.map((item) => (
                    <div key={item.name}>
                      <div className="mb-1.5 flex justify-between gap-3 text-sm">
                        <span className="text-slate-700">{item.name}</span>
                        <span className="font-semibold text-slate-900">
                          {item.value}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, item.value))}%`,
                            backgroundColor: item.fill || "#059669",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">
                  No category records available.
                </p>
              )}
            </article>
          </section>

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">Monthly Recorded Collection</h2>
              <p className="mt-1 text-sm text-slate-500">
                Kilograms recorded for completed pickups during the last six months.
              </p>
            </div>
            <div className="p-5">
              {monthlyWaste.length ? (
                <div className="space-y-4">
                  {monthlyWaste.map((item) => {
                    const max = Math.max(
                      1,
                      ...monthlyWaste.map((entry) => Number(entry.collected || 0))
                    );

                    return (
                      <div key={item.month}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="text-slate-700">{item.month}</span>
                          <span className="font-semibold text-slate-900">
                            {Number(item.collected || 0).toLocaleString("en-IN")} kg
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{
                              width: `${(Number(item.collected || 0) / max) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No monthly data available.</p>
              )}
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">Recent Pickup Requests</h2>
              <p className="mt-1 text-sm text-slate-500">
                Actual database records returned by the Admin API.
              </p>
            </div>
            {requests.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Request ID</th>
                      <th className="px-5 py-4">Resident</th>
                      <th className="px-5 py-4">Type</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((item) => (
                      <tr key={item.id}>
                        <td className="px-5 py-4 font-semibold text-emerald-800">{item.id}</td>
                        <td className="px-5 py-4">{item.citizen}</td>
                        <td className="px-5 py-4">{item.wasteType}</td>
                        <td className="px-5 py-4">{formatDate(item.date)}</td>
                        <td className="px-5 py-4"><StatusPill status={item.status} /></td>
                        <td className="px-5 py-4">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-8 text-sm text-slate-500">No pickup requests found.</p>
            )}
          </article>
        </>
      )}
    </div>
  );
}

/* ---------- Settings (browser-local preferences for now) ---------- */

const defaultSettings = {
  organization: "EcoTrack Waste Management",
  email: "",
  phone: "",
  serviceArea: "Kanpur",
  workingHours: "9:00 AM - 6:00 PM",
  emailNotifications: true,
  pickupNotifications: true,
  complaintNotifications: true,
};

function AdminSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("ecotrack-admin-settings") || "null"
      );
      if (saved) setSettings({ ...defaultSettings, ...saved });
    } catch {
      // Start with defaults if browser settings cannot be parsed.
    }
  }, []);

  function update(key, value) {
    setSettings((old) => ({ ...old, [key]: value }));
  }

  function saveSettings(event) {
    event.preventDefault();
    localStorage.setItem("ecotrack-admin-settings", JSON.stringify(settings));
    setNotice("Settings saved in this browser. Server-side settings are not configured yet.");
  }

  function resetSettings() {
    if (!window.confirm("Reset settings to defaults?")) return;
    setSettings(defaultSettings);
    localStorage.setItem("ecotrack-admin-settings", JSON.stringify(defaultSettings));
    setNotice("Settings reset.");
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="Settings"
        subtitle="Organization preferences and notification options."
        icon={Settings}
      />
      <Notice message={notice} onClose={() => setNotice("")} />

      <form onSubmit={saveSettings} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold">Organization Details</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {[
              ["organization", "Organization name", "text"],
              ["email", "Support email", "email"],
              ["phone", "Contact phone", "tel"],
              ["serviceArea", "Service area", "text"],
              ["workingHours", "Working hours", "text"],
            ].map(([key, label, type]) => (
              <label key={key} className="space-y-2 text-sm font-medium text-slate-700">
                {label}
                <input
                  type={type}
                  required={key === "organization"}
                  value={settings[key]}
                  onChange={(event) => update(key, event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold">Notification Preferences</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {[
              ["emailNotifications", "Email notifications"],
              ["pickupNotifications", "Pickup updates"],
              ["complaintNotifications", "Complaint updates"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4 py-4 text-sm">
                <span className="font-medium text-slate-700">{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[key])}
                  onChange={(event) => update(key, event.target.checked)}
                  className="h-5 w-5 accent-emerald-700"
                />
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            These settings are still browser-local. Actual notifications require a notification service.
          </p>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={resetSettings}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={17} />
            Reset
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
          >
            <Save size={17} />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Shared display components ---------- */

function PageBanner({ title, subtitle, icon: Icon, action }) {
  return (
    <section className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-600 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-8">
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
          <Icon size={25} />
        </div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-50 sm:text-base">{subtitle}</p>
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </section>
  );
}

function RefreshButton({ loading, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
    >
      {loading ? (
        <LoaderCircle size={17} className="animate-spin" />
      ) : (
        <RefreshCw size={17} />
      )}
      Refresh
    </button>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <article className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
      </div>
      <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
        <Icon size={23} />
      </span>
    </article>
  );
}

function LoadingPanel() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <LoaderCircle size={32} className="animate-spin text-emerald-700" />
      <p className="mt-4 text-sm font-semibold text-slate-700">Loading database records...</p>
    </div>
  );
}

function EmptyPanel({ title, text, icon: Icon }) {
  return (
    <div className="p-12 text-center">
      <Icon size={32} className="mx-auto text-slate-300" />
      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

/* ---------- Route selection ---------- */

export default function AdminSection() {
  const location = useLocation();

  if (location.pathname === "/admin/users") {
    return <UserDirectory />;
  }

  if (location.pathname === "/admin/complaints") {
    return <ComplaintsManagement />;
  }

  if (location.pathname === "/admin/reports") {
    return <ReportsAnalytics />;
  }

  if (location.pathname === "/admin/settings") {
    return <AdminSettings />;
  }

  const config = pageConfig[location.pathname];

  if (config) {
    return <EntityManagement key={location.pathname} config={config} />;
  }

  return (
    <EmptyPanel
      title="Page not found"
      text="This admin section does not exist."
      icon={Settings}
    />
  );
}
