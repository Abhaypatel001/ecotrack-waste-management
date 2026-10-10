
import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  Recycle,
  Users,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  RefreshCw,
  LoaderCircle,
  Weight,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "") + "/api/admin/dashboard";

function formatDate(date) {
  if (!date) return "—";

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T12:00:00`)
    : new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 break-words text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            {value}
          </p>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            colors[color] || colors.green
          }`}
        >
          <Icon size={22} />
        </span>
      </div>

      <p className="mt-4 text-xs leading-5 text-gray-500">{subtitle}</p>
    </article>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center px-5 text-center">
      <Recycle size={30} className="text-emerald-600" />
      <p className="mt-3 text-sm font-semibold text-gray-700">
        No recorded data yet
      </p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
        {message}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  const loadDashboard = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("ecotrack-token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal,
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("ecotrack-token");
        localStorage.removeItem("ecotrack-user");
        navigate("/login", { replace: true });
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "Admin permission required. Please log in with your Admin account."
        );
      }

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message ||
            `Dashboard API failed with status ${response.status}.`
        );
      }

      if (!result.data || !result.data.stats) {
        throw new Error("The server returned an unexpected dashboard response.");
      }

      setData(result.data);
    } catch (err) {
      if (err.name === "AbortError") return;

      console.error("Admin dashboard loading error:", err);
      setError(
        err.message ||
          "Unable to load dashboard data. Check your backend server."
      );
      setData(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();

    loadDashboard(controller.signal);

    return () => controller.abort();
  }, [loadDashboard, refreshCount]);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const stats = data?.stats;
  const monthlyWaste = data?.monthlyWaste || [];
  const wasteDistribution = data?.wasteDistribution || [];
  const requests = data?.requests || [];

  const weightValue =
    stats?.totalCollectedWeightKg === null ||
    stats?.totalCollectedWeightKg === undefined
      ? "Not recorded"
      : `${Number(stats.totalCollectedWeightKg).toLocaleString("en-IN")} kg`;

  const statCards = stats
    ? [
        {
          title: "Total Requests",
          value: stats.totalRequests,
          subtitle: "Pickup requests saved in MongoDB",
          icon: ClipboardList,
          color: "green",
        },
        {
          title: "Waste Collected",
          value: weightValue,
          subtitle:
            stats.recordedWeightCount > 0
              ? `Measured weight from ${stats.recordedWeightCount} completed collection(s)`
              : "Actual collection weight has not been recorded",
          icon: Weight,
          color: "blue",
        },
        {
          title: "Registered Users",
          value: stats.registeredUsers,
          subtitle: "Registered user accounts in MongoDB",
          icon: Users,
          color: "purple",
        },
        {
          title: "Open Issue Reports",
          value: stats.openIssues,
          subtitle: `${stats.totalIssueReports} total issue report(s)`,
          icon: AlertCircle,
          color: "amber",
        },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Live statistics from your EcoTrack database."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600">
              <CalendarDays size={17} />
              {todayLabel}
            </div>

            <button
              type="button"
              onClick={() => setRefreshCount((value) => value + 1)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <RefreshCw size={17} />
              )}
              Refresh
            </button>
          </div>
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Dashboard data could not be loaded</p>
            <p className="mt-1 break-words">{error}</p>
            <p className="mt-2 text-xs leading-5">
              Check that the backend is running, the admin API route is mounted
              and your account has the admin role.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshCount((value) => value + 1)}
            className="shrink-0 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !data && !error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          <LoaderCircle size={21} className="animate-spin text-emerald-700" />
          Loading live dashboard data...
        </div>
      )}

      {!loading && !data && error && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <AlertCircle size={30} className="mx-auto text-rose-600" />
          <h2 className="mt-3 font-bold text-gray-900">
            No dashboard data available
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Real database data will appear when the API request succeeds.
          </p>
          <button
            type="button"
            onClick={() => setRefreshCount((value) => value + 1)}
            className="mt-4 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Try again
          </button>
        </div>
      )}

      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </section>

          <section className="mt-7 grid gap-6 xl:grid-cols-3">
            {/* MONTHLY RECORDED WEIGHT */}
            <article className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 xl:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Collection Overview</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Recorded weight of completed collections, in kilograms
                  </p>
                </div>
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  Last 6 months
                </span>
              </div>

              <div className="mt-6 h-72 w-full">
                {stats.recordedWeightCount > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyWaste}>
                      <defs>
                        <linearGradient
                          id="collectedFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#059669"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#059669"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="#edf0ed"
                        strokeDasharray="4 4"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value) => [`${value} kg`, "Collected"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="collected"
                        name="Collected"
                        stroke="#059669"
                        fill="url(#collectedFill)"
                        strokeWidth={2.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="The chart will populate when actual weights are recorded for completed pickups." />
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-5 text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="size-2.5 rounded-full bg-emerald-600" />
                  Recorded collected weight
                </span>
              </div>
            </article>

            {/* CATEGORY DISTRIBUTION */}
            <article className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold">Waste Distribution</h2>
              <p className="mt-1 text-sm text-gray-500">
                Share of pickup requests by waste category
              </p>

              <div className="relative mt-4 h-56">
                {wasteDistribution.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wasteDistribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={62}
                          outerRadius={88}
                          paddingAngle={4}
                          stroke="none"
                        >
                          {wasteDistribution.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.fill}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value}%`, "Share"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">100%</span>
                      <span className="text-xs text-gray-500">
                        Requests
                      </span>
                    </div>
                  </>
                ) : (
                  <EmptyChart message="Category distribution will appear after pickup requests are saved." />
                )}
              </div>

              <div className="mt-3 space-y-3">
                {wasteDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm text-gray-600">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* LATEST REQUESTS FROM MONGODB */}
          <section className="mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 sm:px-6">
              <div>
                <h2 className="text-lg font-bold">
                  Recent Pickup Requests
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Latest pickup records returned by the API
                </p>
              </div>

              <Link
                to="/admin/requests"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              >
                View all <ArrowRight size={16} />
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardList
                  size={30}
                  className="mx-auto text-emerald-700"
                />
                <p className="mt-3 font-semibold text-gray-800">
                  No pickup requests found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Saved database requests will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Request ID
                      </th>
                      <th className="px-6 py-4 font-semibold">Citizen</th>
                      <th className="px-6 py-4 font-semibold">
                        Waste Type
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Quantity
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Pickup Date
                      </th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.slice(0, 5).map((request) => (
                      <tr
                        key={request.id}
                        className="transition hover:bg-gray-50/80"
                      >
                        <td className="px-6 py-4 font-semibold text-emerald-800">
                          {request.id}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {request.citizen}
                          {request.email && (
                            <span className="mt-1 block text-xs font-normal text-gray-400">
                              {request.email}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {request.wasteType}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {request.quantity}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(request.date)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={request.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* OPERATIONAL LINKS */}
          <section className="mt-7 grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="rounded-xl bg-white p-3 text-emerald-700">
                <Recycle size={23} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-emerald-950">
                  Recycling performance
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  View saved collection weights and pickup category statistics.
                </p>
                <Link
                  to="/admin/reports"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"
                >
                  Open reports <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="rounded-xl bg-white p-3 text-blue-700">
                <ClipboardList size={23} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-blue-950">
                  Collection operations
                </p>
                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Review saved pickup requests and update their status.
                </p>
                <Link
                  to="/admin/requests"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-800"
                >
                  Manage requests <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
