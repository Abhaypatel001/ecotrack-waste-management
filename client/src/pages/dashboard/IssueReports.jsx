
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileWarning,
  Plus,
  Search,
  RefreshCw,
  X,
  MapPin,
  CalendarDays,
  Clock,
  CheckCircle2,
  Trash2,
  Eye,
  LoaderCircle,
  AlertCircle,
  Save,
  Camera,
  Upload,
} from "lucide-react";

import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL = `${API_BASE}/api/issues`;
const DEFAULT_POSITION = [26.4499, 80.3319];

const categories = [
  "Garbage Overflow",
  "Missed Waste Collection",
  "Illegal Dumping",
  "Street Cleaning",
  "Recycling Problem",
  "Other",
];

const statuses = ["Pending", "In Progress", "Resolved"];

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  "In Progress": "bg-blue-50 text-blue-700 ring-blue-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const emptyForm = {
  category: "Garbage Overflow",
  description: "",
  address: "",
};

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationPicker({ position, onChange }) {
  useMapEvents({
    click(event) {
      onChange([event.latlng.lat, event.latlng.lng]);
    },
  });

  return <Marker position={position} icon={markerIcon} />;
}

function reportReference(report) {
  return `ECO-${String(report._id || "").slice(-8).toUpperCase()}`;
}

function displayDate(date) {
  if (!date) return "—";

  const value = new Date(date);

  return Number.isNaN(value.getTime())
    ? "—"
    : value.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function getPhotoUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

function hasCoordinates(report) {
  return (
    report?.latitude !== null &&
    report?.latitude !== undefined &&
    report?.latitude !== "" &&
    report?.longitude !== null &&
    report?.longitude !== undefined &&
    report?.longitude !== "" &&
    Number.isFinite(Number(report.latitude)) &&
    Number.isFinite(Number(report.longitude)) &&
    Number(report.latitude) >= -90 &&
    Number(report.latitude) <= 90 &&
    Number(report.longitude) >= -180 &&
    Number(report.longitude) <= 180
  );
}

function readStoredUser() {
  try {
    const value = localStorage.getItem("ecotrack-user");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

// Attach the JWT to every protected API request.
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem("ecotrack-token");

  if (!token) {
    const error = new Error("Please log in to continue.");
    error.status = 401;
    throw error;
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  // Do not manually set Content-Type for FormData.
  return fetch(url, {
    ...options,
    headers,
  });
}

async function parseResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("ecotrack-token");
    localStorage.removeItem("ecotrack-user");

    const error = new Error(
      result.message || "Your session has expired. Please log in again."
    );
    error.status = 401;
    throw error;
  }

  if (response.status === 403) {
    const error = new Error(
      result.message || "You do not have permission to perform this action."
    );
    error.status = 403;
    throw error;
  }

  if (!response.ok || result.success === false) {
    const error = new Error(
      result.message || "Request failed. Please try again."
    );
    error.status = response.status;
    throw error;
  }

  return result;
}

export default function IssueReports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const [form, setForm] = useState({ ...emptyForm });
  const [formPosition, setFormPosition] = useState([
    ...DEFAULT_POSITION,
  ]);
  const [formPhoto, setFormPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Check the locally stored role for page navigation convenience.
  // The backend JWT verification remains the actual security check.
  const ensureAdminSession = useCallback(() => {
    const token = localStorage.getItem("ecotrack-token");
    const user = readStoredUser();

    if (!token) {
      navigate("/login", { replace: true });
      return false;
    }

    if (user?.role !== "admin") {
      navigate("/user/dashboard", { replace: true });
      return false;
    }

    return true;
  }, [navigate]);

  // Create and clean up the selected image preview.
  useEffect(() => {
    if (!formPhoto) {
      setPhotoPreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(formPhoto);
    setPhotoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [formPhoto]);

  // Load all reports; the backend only returns all reports to an admin.
  const fetchReports = useCallback(async () => {
    if (!ensureAdminSession()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await authenticatedFetch(API_URL);
      const result = await parseResponse(response);

      setReports(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      if (err.status === 401) {
        navigate("/login", { replace: true });
      }

      setError(
        err.message ||
          "Cannot load reports. Check whether the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, [ensureAdminSession, navigate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  function openAddForm() {
    if (!ensureAdminSession()) return;

    setForm({ ...emptyForm });
    setFormPosition([...DEFAULT_POSITION]);
    setFormPhoto(null);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  // Admin creates a report with optional photo and map coordinates.
  async function handleAddReport(event) {
    event.preventDefault();

    if (saving) return;

    if (!ensureAdminSession()) return;

    if (!form.description.trim()) {
      setError("Please enter an issue description.");
      return;
    }

    if (form.description.trim().length > 3000) {
      setError("Description must be 3000 characters or fewer.");
      return;
    }

    if (
      !Number.isFinite(formPosition[0]) ||
      !Number.isFinite(formPosition[1]) ||
      formPosition[0] < -90 ||
      formPosition[0] > 90 ||
      formPosition[1] < -180 ||
      formPosition[1] > 180
    ) {
      setError("Please select a valid map location.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = new FormData();

      payload.append("category", form.category);
      payload.append("description", form.description.trim());
      payload.append("address", form.address.trim());
      payload.append("latitude", String(formPosition[0]));
      payload.append("longitude", String(formPosition[1]));

      if (formPhoto) {
        payload.append("photo", formPhoto);
      }

      const response = await authenticatedFetch(API_URL, {
        method: "POST",
        body: payload,
      });

      const result = await parseResponse(response);

      if (!result.data?._id) {
        throw new Error("The server did not return the saved report.");
      }

      setReports((current) => [result.data, ...current]);
      setShowForm(false);
      setForm({ ...emptyForm });
      setFormPosition([...DEFAULT_POSITION]);
      setFormPhoto(null);

      setNotice("Issue report saved successfully.");
    } catch (err) {
      if (err.status === 401) {
        navigate("/login", { replace: true });
      }

      setError(err.message || "Could not save this issue report.");
    } finally {
      setSaving(false);
    }
  }

  // Admin updates report status in MongoDB.
  async function updateStatus(id, status) {
    if (!id || updatingId || !ensureAdminSession()) return;

    const previousReport = reports.find((report) => report._id === id);

    if (!previousReport || previousReport.status === status) return;

    setUpdatingId(id);
    setError("");
    setNotice("");

    try {
      const response = await authenticatedFetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await parseResponse(response);

      setReports((current) =>
        current.map((report) =>
          report._id === id ? result.data : report
        )
      );

      setSelectedReport((current) =>
        current?._id === id ? result.data : current
      );

      setNotice("Report status updated successfully.");
    } catch (err) {
      if (err.status === 401) {
        navigate("/login", { replace: true });
      }

      setError(err.message || "Could not update report status.");
    } finally {
      setUpdatingId(null);
    }
  }

  // Admin deletes a report through the protected endpoint.
  async function deleteReport(id) {
    if (!id || deletingId || !ensureAdminSession()) return;

    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }

    setDeletingId(id);
    setError("");
    setNotice("");

    try {
      const response = await authenticatedFetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      await parseResponse(response);

      setReports((current) =>
        current.filter((report) => report._id !== id)
      );

      setSelectedReport((current) =>
        current?._id === id ? null : current
      );

      setNotice("Issue report deleted successfully.");
    } catch (err) {
      if (err.status === 401) {
        navigate("/login", { replace: true });
      }

      setError(err.message || "Could not delete the report.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesStatus =
        statusFilter === "All" || report.status === statusFilter;

      const searchable = [
        reportReference(report),
        report.category,
        report.description,
        report.address,
        report.status,
      ];

      const matchesSearch = searchable.some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      return matchesStatus && matchesSearch;
    });
  }, [reports, search, statusFilter]);

  const stats = [
    {
      label: "Total Reports",
      value: reports.length,
      icon: FileWarning,
      color: "bg-slate-100 text-slate-700",
    },
    {
      label: "Pending",
      value: reports.filter((r) => r.status === "Pending").length,
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "In Progress",
      value: reports.filter((r) => r.status === "In Progress").length,
      icon: RefreshCw,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Resolved",
      value: reports.filter((r) => r.status === "Resolved").length,
      icon: CheckCircle2,
      color: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-600 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
            <FileWarning size={15} />
            COMMUNITY MANAGEMENT
          </span>

          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Issue Reports
          </h1>

          <p className="mt-2 max-w-xl text-sm text-emerald-50 sm:text-base">
            Review community issues, create reports and track resolutions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchReports}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 font-semibold hover:bg-white/20 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-emerald-900 shadow transition hover:bg-emerald-50"
          >
            <Plus size={19} />
            Add Report
          </button>
        </div>
      </section>

      {/* Notifications */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            {notice}
          </span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p className="flex-1 break-words">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {stat.value}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${stat.color}`}>
                <Icon size={23} />
              </div>
            </div>
          );
        })}
      </section>

      {/* Reports table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              All Issue Reports
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredReports.length} report
              {filteredReports.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
              <Search size={18} className="shrink-0 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports..."
                aria-label="Search issue reports"
                className="min-w-0 py-3 text-sm outline-none sm:w-48"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter reports by status"
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="All">All statuses</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              title="Reset filters"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Reset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16 text-center">
            <LoaderCircle
              size={34}
              className="animate-spin text-emerald-700"
            />
            <p className="mt-4 font-semibold text-slate-800">
              Loading issue reports...
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Fetching reports from MongoDB.
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <FileWarning size={30} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {reports.length === 0
                ? "No issue reports yet"
                : "No matching reports"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {reports.length === 0
                ? "Add a report manually or submit one through the user Report Issue form."
                : "Try a different search term or status filter."}
            </p>

            {reports.length === 0 && (
              <button
                type="button"
                onClick={openAddForm}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <Plus size={17} />
                Add First Report
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Category / Description</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Photo</th>
                  <th className="px-5 py-4">Reported On</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {reportReference(report)}
                      </p>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {report.category}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {report.description}
                      </p>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="flex items-start gap-1 text-slate-700">
                        <MapPin size={15} className="mt-0.5 shrink-0" />
                        <span>
                          {report.address ||
                            (hasCoordinates(report)
                              ? `${report.latitude}, ${report.longitude}`
                              : "Location not provided")}
                        </span>
                      </p>

                      {hasCoordinates(report) && (
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=16/${report.latitude}/${report.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Open map
                        </a>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {report.photoUrl ? (
                        <a
                          href={getPhotoUrl(report.photoUrl)}
                          target="_blank"
                          rel="noreferrer"
                          title="Open uploaded photo"
                        >
                          <img
                            src={getPhotoUrl(report.photoUrl)}
                            alt="Reported issue"
                            loading="lazy"
                            className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">
                          No photo
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {displayDate(report.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={report.status || "Pending"}
                        disabled={
                          updatingId === report._id ||
                          deletingId === report._id
                        }
                        onChange={(e) =>
                          updateStatus(report._id, e.target.value)
                        }
                        aria-label={`Update status of ${reportReference(report)}`}
                        className={`rounded-full px-3 py-2 text-xs font-semibold ring-1 outline-none disabled:opacity-60 ${
                          statusStyles[report.status] || statusStyles.Pending
                        }`}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(report)}
                          title="View report details"
                          aria-label={`View ${reportReference(report)}`}
                          className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          disabled={
                            deletingId === report._id ||
                            updatingId === report._id
                          }
                          onClick={() => deleteReport(report._id)}
                          title="Delete report"
                          aria-label={`Delete ${reportReference(report)}`}
                          className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deletingId === report._id ? (
                            <LoaderCircle
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredReports.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
            Showing {filteredReports.length} of {reports.length} reports
            from MongoDB.
          </div>
        )}
      </section>

      {/* Add report modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Issue Report
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add issue details, optional photo and map location.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleAddReport} className="space-y-5 p-5 sm:p-6">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Issue category *
                <select
                  required
                  disabled={saving}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-emerald-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Description *
                <textarea
                  required
                  disabled={saving}
                  rows={4}
                  maxLength={3000}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the sanitation issue..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Location / address
                <input
                  disabled={saving}
                  maxLength={500}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Street, area, landmark (optional if map pin is set)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>

              {/* Photo uploader */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Upload photo{" "}
                  <span className="font-normal text-slate-400">
                    (optional, maximum 5 MB)
                  </span>
                </label>

                {photoPreview && (
                  <div className="relative mb-3 overflow-hidden rounded-xl border border-slate-200">
                    <img
                      src={photoPreview}
                      alt="Selected issue preview"
                      className="max-h-64 w-full object-contain"
                    />

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setFormPhoto(null)}
                      className="flex w-full items-center justify-center gap-2 bg-slate-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <X size={16} />
                      Remove photo
                    </button>
                  </div>
                )}

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-emerald-400 hover:bg-emerald-50/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                    <Camera size={24} />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-800">
                      {formPhoto ? "Choose a different photo" : "Choose photo"}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {formPhoto ? formPhoto.name : "JPG, PNG, WEBP or GIF"}
                    </span>
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={saving}
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) return;

                      const allowedTypes = [
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "image/gif",
                      ];

                      if (!allowedTypes.includes(file.type)) {
                        setError("Choose a JPG, PNG, WEBP or GIF image.");
                        event.target.value = "";
                        return;
                      }

                      if (file.size > 5 * 1024 * 1024) {
                        setError("Photo must be 5 MB or smaller.");
                        event.target.value = "";
                        return;
                      }

                      setError("");
                      setFormPhoto(file);
                    }}
                    className="sr-only"
                  />

                  <Upload
                    size={18}
                    className="ml-auto shrink-0 text-slate-400"
                  />
                </label>
              </div>

              {/* Interactive map */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-slate-700">
                    Pin issue location
                  </label>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setFormPosition([...DEFAULT_POSITION])}
                    className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                  >
                    Reset map
                  </button>
                </div>

                <div className="h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <MapContainer
                    center={formPosition}
                    zoom={14}
                    scrollWheelZoom
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <LocationPicker
                      position={formPosition}
                      onChange={setFormPosition}
                    />
                  </MapContainer>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Map par click karke pin set karo. Coordinates:{" "}
                  {formPosition[0].toFixed(6)},{" "}
                  {formPosition[1].toFixed(6)}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report details */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Report details
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {reportReference(selectedReport)}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                aria-label="Close details"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Category
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedReport.category}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {selectedReport.description}
                </p>
              </div>

              {/* Full-size photo */}
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Photo evidence
                </p>

                {selectedReport.photoUrl ? (
                  <a
                    href={getPhotoUrl(selectedReport.photoUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block"
                  >
                    <img
                      src={getPhotoUrl(selectedReport.photoUrl)}
                      alt="Issue evidence"
                      className="max-h-72 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
                    />
                    <span className="mt-2 block text-xs font-semibold text-emerald-700">
                      Open full-size photo
                    </span>
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">
                    No photo was attached to this report.
                  </p>
                )}
              </div>

              {/* Map */}
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Map location
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {selectedReport.address || "Address not provided"}
                </p>

                {hasCoordinates(selectedReport) ? (
                  <>
                    <div className="mt-3 h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <MapContainer
                        key={[
                          selectedReport._id,
                          selectedReport.latitude,
                          selectedReport.longitude,
                        ].join("-")}
                        center={[
                          Number(selectedReport.latitude),
                          Number(selectedReport.longitude),
                        ]}
                        zoom={15}
                        scrollWheelZoom
                        className="h-full w-full"
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker
                          position={[
                            Number(selectedReport.latitude),
                            Number(selectedReport.longitude),
                          ]}
                          icon={markerIcon}
                        />
                      </MapContainer>
                    </div>

                    <a
                      href={`https://www.openstreetmap.org/?mlat=${selectedReport.latitude}&mlon=${selectedReport.longitude}#map=16/${selectedReport.latitude}/${selectedReport.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
                    >
                      <MapPin size={16} />
                      Open full map
                    </a>

                    <p className="mt-1 text-xs text-slate-500">
                      Latitude: {selectedReport.latitude} · Longitude:{" "}
                      {selectedReport.longitude}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No coordinates are available for this report.
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Submitted on
                </p>

                <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                  <CalendarDays size={16} />
                  {displayDate(selectedReport.createdAt)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-400">
                  Update status
                </p>

                <select
                  value={selectedReport.status || "Pending"}
                  disabled={updatingId === selectedReport._id}
                  onChange={(e) =>
                    updateStatus(selectedReport._id, e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-60"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
