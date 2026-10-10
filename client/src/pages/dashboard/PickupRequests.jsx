
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  X,
  Clock,
  CheckCircle2,
  Truck,
  Trash2,
  MapPin,
  CalendarDays,
  RefreshCw,
  Package,
  AlertCircle,
  LoaderCircle,
  Weight,
  Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "") + "/api/pickups";

const initialForm = {
  type: "Dry recyclable waste",
  address: "",
  date: "",
  time: "09:00 AM - 11:00 AM",
  notes: "",
};

const statuses = [
  "Pending",
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
];

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Scheduled: "bg-blue-50 text-blue-700 ring-blue-200",
  "In Progress": "bg-violet-50 text-violet-700 ring-violet-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

function getLocalDateString() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getRequestLabel(request) {
  return (
    request.pickupCode ||
    `ET-${String(request._id || "").slice(-8).toUpperCase()}`
  );
}

function getResidentName(request) {
  return request.userId?.name || request.name || "Unassigned";
}

function getResidentEmail(request) {
  return request.userId?.email || "";
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(date))
    ? new Date(`${date}T12:00:00`)
    : new Date(date);

  if (Number.isNaN(parsed.getTime())) return String(date);

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString("en-IN");
}

function validWeight(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0
  );
}

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (response.status === 401) {
    const error = new Error(
      result.message || "Your login session has expired. Please log in again."
    );
    error.status = 401;
    throw error;
  }

  if (response.status === 403) {
    const error = new Error(
      result.message || "Admin permission is required for this action."
    );
    error.status = 403;
    throw error;
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed with status ${response.status}.`
    );
  }

  return result;
}

function StatusBadge({ status }) {
  const currentStatus = status || "Pending";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
        statusStyles[currentStatus] || statusStyles.Pending
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {currentStatus}
    </span>
  );
}

export default function PickupRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [weightDrafts, setWeightDrafts] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...initialForm });

  const [notice, setNotice] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [savingWeightId, setSavingWeightId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Every API call carries the logged-in Admin JWT.
  const authenticatedFetch = useCallback(
    async (url, options = {}) => {
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

      const response = await fetch(url, {
        ...options,
        headers,
      });

      try {
        return await readResponse(response);
      } catch (error) {
        if (error.status === 401) {
          localStorage.removeItem("ecotrack-token");
          localStorage.removeItem("ecotrack-user");
          navigate("/login", { replace: true });
        }

        throw error;
      }
    },
    [navigate]
  );

  // GET: load all pickup records from MongoDB.
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setApiError("");

    try {
      const result = await authenticatedFetch(API_URL);
      const records = Array.isArray(result.data) ? result.data : [];

      setRequests(records);

      setWeightDrafts(
        Object.fromEntries(
          records.map((request) => [
            request._id,
            validWeight(request.collectedWeightKg)
              ? String(request.collectedWeightKg)
              : "",
          ])
        )
      );
    } catch (error) {
      setApiError(
        error.message ||
          "Unable to load pickup requests from MongoDB."
      );
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // POST: create a request using the fields accepted by PickupRequest.
  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setApiError("");
    setNotice("");

    if (!form.date || !form.time || !form.address.trim()) {
      setApiError("Please provide a pickup date, time and address.");
      setSaving(false);
      return;
    }

    if (form.date < getLocalDateString()) {
      setApiError("Pickup date cannot be in the past.");
      setSaving(false);
      return;
    }

    try {
      const result = await authenticatedFetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          date: form.date,
          time: form.time,
          address: form.address.trim(),
          notes: form.notes.trim(),
        }),
      });

      if (!result.data?._id) {
        throw new Error(
          "The server did not return the saved pickup record."
        );
      }

      setRequests((current) => [
        result.data,
        ...current.filter((item) => item._id !== result.data._id),
      ]);

      setWeightDrafts((current) => ({
        ...current,
        [result.data._id]: "",
      }));

      setForm({ ...initialForm });
      setShowForm(false);
      setNotice("Pickup request saved successfully in MongoDB.");
    } catch (error) {
      setApiError(error.message || "Could not save the pickup request.");
    } finally {
      setSaving(false);
    }
  }

  // PATCH: update pickup status in MongoDB.
  async function updateStatus(id, newStatus) {
    if (!id || updatingId || savingWeightId === id) return;

    const previousRequest = requests.find((request) => request._id === id);

    if (!previousRequest || previousRequest.status === newStatus) return;

    setUpdatingId(id);
    setApiError("");
    setNotice("");

    try {
      const result = await authenticatedFetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      const returnedRequest = result.data;

      setRequests((current) =>
        current.map((request) =>
          request._id === id
            ? {
                ...request,
                ...(returnedRequest || {}),
                status: returnedRequest?.status || newStatus,
              }
            : request
        )
      );

      setNotice("Pickup status updated successfully.");

      if (newStatus === "Completed") {
        setNotice(
          "Pickup marked Completed. Enter the actual collected weight below to update the impact statistics."
        );
      }
    } catch (error) {
      setApiError(error.message || "Could not update the pickup status.");
    } finally {
      setUpdatingId(null);
    }
  }

  // PATCH: save the actual collected waste weight.
  // Backend route must validate this field and allow admins only.
  async function saveWeight(request) {
    const id = request._id;
    const rawValue = weightDrafts[id];

    if (!id || savingWeightId || updatingId === id) return;

    if (request.status !== "Completed" && String(rawValue).trim() !== "") {
      setApiError(
        "Mark the pickup as Completed before recording its collected weight."
      );
      return;
    }

    if (String(rawValue).trim() !== "" && !validWeight(rawValue)) {
      setApiError("Weight must be a valid number that is zero or greater.");
      return;
    }

    setSavingWeightId(id);
    setApiError("");
    setNotice("");

    const collectedWeightKg =
      String(rawValue).trim() === "" ? null : Number(rawValue);

    try {
      const result = await authenticatedFetch(`${API_URL}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ collectedWeightKg }),
      });

      setRequests((current) =>
        current.map((item) => {
          if (item._id !== id) return item;

          return {
            ...item,
            ...(result.data || {}),
            collectedWeightKg,
          };
        })
      );

      setNotice(
        collectedWeightKg === null
          ? "Recorded weight cleared successfully."
          : `Actual collected weight saved: ${collectedWeightKg} kg.`
      );
    } catch (error) {
      setApiError(
        error.message ||
          "Unable to save weight. Check the backend PATCH /api/pickups/:id route."
      );
    } finally {
      setSavingWeightId(null);
    }
  }

  // DELETE: delete the pickup record through the protected backend route.
  async function deleteRequest(request) {
    const id = request._id;

    if (!id || deletingId || updatingId === id || savingWeightId === id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete pickup ${getRequestLabel(request)}? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(id);
    setApiError("");
    setNotice("");

    try {
      await authenticatedFetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      setRequests((current) =>
        current.filter((item) => item._id !== id)
      );

      setWeightDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      setNotice("Pickup request deleted successfully.");
    } catch (error) {
      setApiError(error.message || "Could not delete the pickup request.");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        filter === "All" || request.status === filter;

      const searchValues = [
        getRequestLabel(request),
        request._id,
        getResidentName(request),
        getResidentEmail(request),
        request.type,
        request.address,
        request.date,
        request.time,
        request.status,
      ];

      const matchesSearch = searchValues.some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, filter]);

  const completedRequests = requests.filter(
    (request) => request.status === "Completed"
  );

  const recordedWeightRequests = completedRequests.filter((request) =>
    validWeight(request.collectedWeightKg)
  );

  const totalRecordedWeight = recordedWeightRequests.reduce(
    (total, request) => total + Number(request.collectedWeightKg),
    0
  );

  const stats = [
    {
      label: "Total Requests",
      value: requests.length,
      icon: ClipboardList,
      color: "bg-slate-100 text-slate-700",
    },
    {
      label: "Pending",
      value: requests.filter((request) => request.status === "Pending").length,
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "Scheduled",
      value: requests.filter((request) => request.status === "Scheduled").length,
      icon: CalendarDays,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Completed",
      value: completedRequests.length,
      icon: CheckCircle2,
      color: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-600 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
            <Truck size={15} />
            COLLECTION MANAGEMENT
          </span>

          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Pickup Requests
          </h1>

          <p className="mt-2 max-w-xl text-sm text-emerald-50 sm:text-base">
            Manage real collection requests, update their progress and record
            the actual waste collected.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 font-semibold transition hover:bg-white/20 disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setApiError("");
              setNotice("");
              setShowForm(true);
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-emerald-900 shadow transition hover:bg-emerald-50"
          >
            <Plus size={19} />
            Add Request
          </button>
        </div>
      </section>

      {/* Success message */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            {notice}
          </span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* API error message */}
      {apiError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 break-words">{apiError}</p>
            <p className="mt-2 text-xs text-rose-700">
              Check the backend terminal and the response from the pickup API.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setApiError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Database-based summary */}
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

      {/* Recorded weight summary */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-3 text-emerald-700">
            <Weight size={24} />
          </div>

          <div>
            <h2 className="font-bold text-emerald-950">
              Actual collected weight
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              Sum of recorded weights for completed pickups only.
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-2xl font-extrabold text-emerald-950">
            {recordedWeightRequests.length > 0
              ? `${Number(totalRecordedWeight.toFixed(2)).toLocaleString("en-IN")} kg`
              : "Not recorded"}
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            {recordedWeightRequests.length} pickup(s) with recorded weight
          </p>
        </div>
      </section>

      {/* Requests table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              All Pickup Requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""} found
              {` from ${requests.length} database record(s)`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
              <Search size={18} className="shrink-0 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search requests..."
                aria-label="Search pickup requests"
                className="min-w-0 py-3 text-sm outline-none sm:w-52"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter requests by status"
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
                setFilter("All");
              }}
              title="Reset filters"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Reset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <LoaderCircle size={34} className="animate-spin text-emerald-700" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Loading pickup requests
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Fetching records from MongoDB...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Package size={30} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {requests.length === 0
                ? "No pickup requests yet"
                : "No matching requests"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {requests.length === 0
                ? "Pickup requests saved by users or administrators will appear here."
                : "Try a different search term or status filter."}
            </p>

            {requests.length === 0 && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <Plus size={17} />
                Add First Request
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Request</th>
                    <th className="px-5 py-4">Resident</th>
                    <th className="px-5 py-4">Pickup Details</th>
                    <th className="px-5 py-4">Date / Time</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actual Weight (kg)</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filtered.map((request) => {
                    const residentName = getResidentName(request);
                    const canRecordWeight = request.status === "Completed";

                    return (
                      <tr
                        key={request._id}
                        className="align-top hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {getRequestLabel(request)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Created: {formatDateTime(request.createdAt)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {residentName}
                          </p>
                          {getResidentEmail(request) && (
                            <p className="mt-1 max-w-52 break-all text-xs text-slate-500">
                              {getResidentEmail(request)}
                            </p>
                          )}
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {request.type || request.wasteType || "Unspecified"}
                          </p>
                          <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
                            <MapPin size={14} className="mt-0.5 shrink-0" />
                            <span>{request.address || "Address not recorded"}</span>
                          </p>
                          {request.notes && (
                            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                              Notes: {request.notes}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-slate-700">
                            {formatDate(request.date)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {request.time || "Time not set"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={request.status || "Pending"}
                            disabled={
                              updatingId === request._id ||
                              deletingId === request._id ||
                              savingWeightId === request._id
                            }
                            onChange={(event) =>
                              updateStatus(request._id, event.target.value)
                            }
                            aria-label={`Update status for ${getRequestLabel(request)}`}
                            className={`rounded-full px-3 py-2 text-xs font-semibold ring-1 outline-none disabled:cursor-wait disabled:opacity-60 ${
                              statusStyles[request.status] || statusStyles.Pending
                            }`}
                          >
                            {statuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>

                          {updatingId === request._id && (
                            <LoaderCircle
                              size={14}
                              className="mt-2 animate-spin text-emerald-700"
                            />
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {canRecordWeight ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={weightDrafts[request._id] ?? ""}
                                  disabled={
                                    savingWeightId === request._id ||
                                    updatingId === request._id ||
                                    deletingId === request._id
                                  }
                                  onChange={(event) =>
                                    setWeightDrafts((current) => ({
                                      ...current,
                                      [request._id]: event.target.value,
                                    }))
                                  }
                                  aria-label={`Actual collected weight in kilograms for ${getRequestLabel(request)}`}
                                  placeholder="e.g. 12.5"
                                  className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
                                />
                                <span className="text-xs text-slate-500">kg</span>
                              </div>

                              <button
                                type="button"
                                disabled={
                                  savingWeightId === request._id ||
                                  updatingId === request._id ||
                                  deletingId === request._id
                                }
                                onClick={() => saveWeight(request)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
                              >
                                {savingWeightId === request._id ? (
                                  <LoaderCircle size={14} className="animate-spin" />
                                ) : (
                                  <Save size={14} />
                                )}
                                Save weight
                              </button>

                              {validWeight(request.collectedWeightKg) && (
                                <p className="text-xs text-emerald-700">
                                  Saved: {Number(request.collectedWeightKg)} kg
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs leading-5 text-slate-500">
                              Mark as Completed to enter measured weight.
                              {validWeight(request.collectedWeightKg) && (
                                <span className="mt-1 block font-semibold text-emerald-700">
                                  Recorded: {Number(request.collectedWeightKg)} kg
                                </span>
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={
                              deletingId === request._id ||
                              updatingId === request._id ||
                              savingWeightId === request._id
                            }
                            onClick={() => deleteRequest(request)}
                            title="Delete request"
                            aria-label={`Delete ${getRequestLabel(request)}`}
                            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-50"
                          >
                            {deletingId === request._id ? (
                              <LoaderCircle size={17} className="animate-spin" />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
              Showing {filtered.length} of {requests.length} pickup requests from MongoDB.
            </div>
          </>
        )}
      </section>

      {/* Add request modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Pickup Request
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create a collection request in MongoDB.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Waste Type *
                <select
                  required
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-500"
                >
                  <option>Dry recyclable waste</option>
                  <option>Wet / organic waste</option>
                  <option>Mixed household waste</option>
                  <option>Plastic waste</option>
                  <option>E-waste</option>
                  <option>Garden waste</option>
                  <option>Construction waste</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Pickup Address *
                <textarea
                  required
                  maxLength={500}
                  rows={3}
                  value={form.address}
                  onChange={(event) =>
                    setForm({ ...form, address: event.target.value })
                  }
                  placeholder="House number, street, area..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Preferred Date *
                  <input
                    type="date"
                    required
                    min={getLocalDateString()}
                    value={form.date}
                    onChange={(event) =>
                      setForm({ ...form, date: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Preferred Time *
                  <select
                    required
                    value={form.time}
                    onChange={(event) =>
                      setForm({ ...form, time: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-500"
                  >
                    <option>09:00 AM - 11:00 AM</option>
                    <option>11:00 AM - 01:00 PM</option>
                    <option>02:00 PM - 04:00 PM</option>
                    <option>04:00 PM - 06:00 PM</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Additional Notes
                <textarea
                  maxLength={2000}
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Any special collection instructions (optional)"
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-emerald-500"
                />
              </label>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                This request will be saved as an Admin-created pickup. It will
                show as Unassigned unless your backend assigns it to a registered
                user account.
              </div>

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
                      <Plus size={18} />
                      Save Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
