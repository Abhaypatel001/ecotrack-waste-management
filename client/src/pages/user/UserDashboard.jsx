
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Leaf,
  LayoutDashboard,
  CalendarDays,
  Recycle,
  MapPin,
  Clock3,
  CheckCircle2,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  Truck,
  PackageCheck,
  CircleUserRound,
  LogOut,
  Sprout,
  TrendingUp,
  Trash2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const PICKUP_API = `${API_BASE}/api/pickups`;
const ISSUE_API = `${API_BASE}/api/issues`;

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My Pickups", icon: CalendarDays },
  { label: "Track Collection", icon: MapPin },
  { label: "Recycling & Impact", icon: Recycle },
  { label: "My Profile", icon: CircleUserRound },
  { label: "Report Issue", icon: CircleAlert },
  { label: "My Reports", icon: ClipboardList },
];

const emptyPickupForm = {
  type: "Dry recyclable waste",
  date: "",
  time: "09:00 AM - 11:00 AM",
  address: "",
  notes: "",
};

function readStoredUser() {
  try {
    const savedUser = localStorage.getItem("ecotrack-user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function StatusBadge({ status }) {
  const styles = {
    Scheduled: "bg-blue-50 text-blue-700 ring-blue-600/15",
    Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    "In Progress": "bg-amber-50 text-amber-700 ring-amber-600/15",
    Pending: "bg-slate-100 text-slate-600 ring-slate-500/15",
    Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    Cancelled: "bg-rose-50 text-rose-700 ring-rose-600/15",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || styles.Pending
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "Pending"}
    </span>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-7">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function formatDate(date) {
  if (!date) return "—";

  // Parse date-only values in local time to avoid a day shift.
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

function formatDateTime(date) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : parsed.toLocaleString("en-IN");
}

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function pickupReference(pickup) {
  return pickup.pickupCode || `ET-${String(pickup._id || "").slice(-8).toUpperCase()}`;
}

function getPhotoUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem("ecotrack-token");

  if (!token) {
    const error = new Error("Your session has ended. Please log in again.");
    error.status = 401;
    throw error;
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
  });
}

async function parseApiResponse(response) {
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

  if (!response.ok || result.success === false) {
    const error = new Error(
      result.message || "Request failed. Please try again."
    );
    error.status = response.status;
    throw error;
  }

  return result;
}

export default function UserDashboard() {
  const navigate = useNavigate();

  const [currentUser] = useState(readStoredUser);
  const [activePage, setActivePage] = useState("Overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Real pickup records loaded from MongoDB.
  const [pickups, setPickups] = useState([]);
  const [pickupsLoading, setPickupsLoading] = useState(true);
  const [pickupError, setPickupError] = useState("");
  const [pickupRefresh, setPickupRefresh] = useState(0);
  const [submittingPickup, setSubmittingPickup] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const [search, setSearch] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({ ...emptyPickupForm });

  // User issue reports.
  const [issueReports, setIssueReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [reportsRefresh, setReportsRefresh] = useState(0);

  const displayName = currentUser?.name || "EcoTrack User";
  const displayEmail = currentUser?.email || "";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U";

  function handleLogout() {
    localStorage.removeItem("ecotrack-token");
    localStorage.removeItem("ecotrack-user");
    localStorage.removeItem("ecotrack-reporter-id");

    setShowUserMenu(false);
    setShowNotifications(false);
    setMobileMenu(false);

    navigate("/login", { replace: true });
  }

  function goTo(page) {
    setActivePage(page);
    setMobileMenu(false);
    setShowUserMenu(false);
    setShowNotifications(false);
    setNotice("");
    setPickupError("");
    setReportsError("");
  }

  // Load the logged-in user's pickup requests.
  const loadPickups = useCallback(async () => {
    setPickupsLoading(true);
    setPickupError("");

    try {
      const response = await authenticatedFetch(PICKUP_API);
      const result = await parseApiResponse(response);

      setPickups(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      if (error.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setPickupError(
        error.message || "Unable to load pickup requests."
      );
    } finally {
      setPickupsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadPickups();
  }, [loadPickups, pickupRefresh]);

  // Load reports for the logged-in user.
  const loadMyReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError("");

    try {
      const response = await authenticatedFetch(ISSUE_API);
      const result = await parseApiResponse(response);

      setIssueReports(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      if (error.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setReportsError(
        error.message || "Unable to load your issue reports."
      );
    } finally {
      setReportsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (activePage === "My Reports") {
      loadMyReports();
    }
  }, [activePage, reportsRefresh, loadMyReports]);

  // Save a new pickup request to MongoDB.
  async function schedulePickup(event) {
    event.preventDefault();

    if (submittingPickup) return;

    setFormError("");
    setPickupError("");
    setNotice("");

    if (!form.type || !form.date || !form.time || !form.address.trim()) {
      setFormError("Please complete waste type, date, time and address.");
      return;
    }

    if (form.date < getLocalDateString()) {
      setFormError("Please select today or a future date.");
      return;
    }

    if (form.address.trim().length > 500) {
      setFormError("Address must be 500 characters or fewer.");
      return;
    }

    if ((form.notes || "").trim().length > 2000) {
      setFormError("Notes must be 2000 characters or fewer.");
      return;
    }

    setSubmittingPickup(true);

    try {
      const response = await authenticatedFetch(PICKUP_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: form.type,
          date: form.date,
          time: form.time,
          address: form.address.trim(),
          notes: (form.notes || "").trim(),
        }),
      });

      const result = await parseApiResponse(response);

      if (!result.data?._id) {
        throw new Error("The server did not return the saved pickup.");
      }

      setPickups((current) => [result.data, ...current]);
      setShowSchedule(false);
      setForm({ ...emptyPickupForm });
      setActivePage("My Pickups");
      setNotice("Pickup request saved successfully in MongoDB.");
    } catch (error) {
      if (error.status === 401) {
        navigate("/login", { replace: true });
      } else {
        setFormError(error.message || "Unable to schedule pickup.");
      }
    } finally {
      setSubmittingPickup(false);
    }
  }

  // User cancellation uses the ownership check in the backend.
  async function cancelPickup(pickup) {
    if (!pickup?._id || cancellingId) return;

    if (
      !window.confirm(
        `Cancel pickup ${pickupReference(pickup)}?`
      )
    ) {
      return;
    }

    setCancellingId(pickup._id);
    setPickupError("");
    setNotice("");

    try {
      const response = await authenticatedFetch(
        `${PICKUP_API}/${pickup._id}`,
        { method: "DELETE" }
      );

      const result = await parseApiResponse(response);

      setPickups((current) =>
        current.filter((item) => item._id !== pickup._id)
      );

      setNotice(result.message || "Pickup cancelled successfully.");
    } catch (error) {
      if (error.status === 401) {
        navigate("/login", { replace: true });
      } else {
        setPickupError(error.message || "Unable to cancel pickup.");
      }
    } finally {
      setCancellingId(null);
    }
  }

  const filteredPickups = pickups.filter((pickup) =>
    `${pickupReference(pickup)} ${pickup.type} ${pickup.status} ${pickup.address}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const completedCount = pickups.filter(
    (pickup) => pickup.status === "Completed"
  ).length;
  const pickupsWithRecordedWeight = pickups.filter(
  (pickup) =>
    pickup.status === "Completed" &&
    pickup.collectedWeightKg !== null &&
    pickup.collectedWeightKg !== undefined &&
    pickup.collectedWeightKg !== "" &&
    Number.isFinite(Number(pickup.collectedWeightKg)) &&
    Number(pickup.collectedWeightKg) >= 0
);

const totalRecordedWeightKg = pickupsWithRecordedWeight.reduce(
  (total, pickup) => total + Number(pickup.collectedWeightKg),
  0
);

const recycledWeightDisplay =
  pickupsWithRecordedWeight.length > 0
    ? `${Number(totalRecordedWeightKg.toFixed(2))} kg`
    : "Not recorded";

  const upcomingCount = pickups.filter(
    (pickup) =>
      ["Scheduled", "Pending"].includes(pickup.status)
  ).length;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function openScheduleForm() {
    setForm({ ...emptyPickupForm });
    setFormError("");
    setPickupError("");
    setNotice("");
    setShowSchedule(true);
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-slate-800">
      {/* MOBILE SIDEBAR BACKDROP */}
      {mobileMenu && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[265px] flex-col overflow-y-auto overscroll-contain bg-[#0b2d23] text-white transition-transform duration-300 ${
          mobileMenu
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-[84px] shrink-0 items-center justify-between border-b border-white/10 px-6">
          <Link
            to="/"
            className="flex items-center gap-3"
            onClick={() => setMobileMenu(false)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
              <Leaf size={24} />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Eco<span className="text-emerald-400">Track</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenu(false)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="shrink-0 px-5 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/60">
            WORKSPACE
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.label;

              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => {
                    if (item.label === "Report Issue") {
                      setMobileMenu(false);
                      setShowUserMenu(false);
                      navigate("/user/report-issue");
                    } else {
                      goTo(item.label);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-lg shadow-black/10"
                      : "text-emerald-50/70 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  <span className="flex-1">{item.label}</span>

                  {item.label === "My Pickups" && upcomingCount > 0 && (
                    <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px]">
                      {upcomingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* SIDEBAR BOTTOM */}
        <div className="mt-auto shrink-0 p-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/15 text-lime-300">
              <Sprout size={22} />
            </span>
            <p className="mt-4 text-sm font-bold">Go greener every day</p>
            <p className="mt-2 text-xs leading-5 text-emerald-50/65">
              Every responsible choice helps build a cleaner community.
            </p>
            <button
              type="button"
              onClick={() => goTo("Recycling & Impact")}
              className="mt-4 flex items-center gap-2 text-xs font-bold text-lime-300 hover:text-white"
            >
              Explore your impact <ArrowRight size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex min-h-12 w-full shrink-0 items-center gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-left text-sm font-bold text-rose-200 ring-1 ring-inset ring-rose-300/30 transition-colors duration-200 hover:bg-rose-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-300/15">
              <LogOut size={19} />
            </span>
            <span className="flex-1">Log out</span>
            <ChevronRight size={16} className="shrink-0 opacity-70" />
          </button>

          <Link
            to="/"
            onClick={() => setMobileMenu(false)}
            className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-emerald-50/70 transition hover:bg-white/10 hover:text-white"
          >
            <Leaf size={18} />
            Back to Home
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="min-h-screen lg:pl-[265px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenu(true)}
              aria-label="Open navigation"
              className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                User Workspace
              </p>
              <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">
                Manage your waste, make a difference.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-5">
            <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 md:flex">
              <CalendarDays size={15} />
              {today}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications((value) => !value)}
                aria-label="Notifications"
                aria-expanded={showNotifications}
                className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <p className="font-semibold text-slate-900">
                    Notifications
                  </p>
                  <p className="mt-3 text-sm leading-5 text-slate-500">
                    You are all caught up on notifications.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="mt-3 text-sm font-semibold text-emerald-700"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            <div className="relative border-l border-slate-200 pl-3 sm:pl-5">
              <button
                type="button"
                onClick={() => setShowUserMenu((value) => !value)}
                aria-label="Open user profile menu"
                aria-expanded={showUserMenu}
                className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800">
                  {initials}
                </span>
                <span className="hidden sm:block">
                  <span className="block max-w-36 truncate text-sm font-bold text-slate-800">
                    {displayName}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    Resident account
                  </span>
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-14 z-50 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {displayName}
                    </p>
                    {displayEmail && (
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {displayEmail}
                      </p>
                    )}
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => goTo("My Profile")}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <CircleUserRound size={17} />
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut size={17} />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9">
          {notice && (
            <div
              role="status"
              className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            >
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {pickupError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <p className="flex-1 break-words">{pickupError}</p>
              <button
                type="button"
                onClick={() => setPickupError("")}
                aria-label="Dismiss pickup error"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* OVERVIEW */}
          {activePage === "Overview" && (
            <>
              <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-medium text-emerald-700">
                    {today}
                  </p>
                 <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
  Welcome back, {displayName}!{" "}
  <span className="inline-block">🌿</span>
</h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                    Here's your waste management overview. Ready to make
                    another positive impact today?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openScheduleForm}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-900"
                >
                  <Plus size={18} /> Schedule a Pickup
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    title: "Total Pickups",
                    value: pickups.length,
                    detail: "Saved pickup requests",
                    icon: PackageCheck,
                    tone: "bg-blue-50 text-blue-700",
                  },
                  {
                    title: "Upcoming Pickups",
                    value: upcomingCount,
                    detail: "Awaiting collection",
                    icon: CalendarDays,
                    tone: "bg-amber-50 text-amber-700",
                  },
                  {
                    title: "Completed Pickups",
                    value: completedCount,
                    detail: "Completed requests",
                    icon: CheckCircle2,
                    tone: "bg-emerald-50 text-emerald-700",
                  },
                  {
                   title: "Waste Recycled",
  value: recycledWeightDisplay,
  detail: "Actual weight recorded for completed pickups",
  icon: Recycle,
  tone: "bg-violet-50 text-violet-700",
                  },
                ].map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.title}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-500">
                            {stat.title}
                          </p>
                          <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                            {stat.value}
                          </p>
                        </div>
                        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}>
                          <Icon size={22} />
                        </span>
                      </div>
                      <p className="mt-4 text-xs text-slate-400">
                        {stat.detail}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="relative mt-7 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-700 p-6 text-white sm:p-9">
                <div className="absolute -right-10 -top-24 h-72 w-72 rounded-full border-[35px] border-white/[0.06]" />
                <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-lime-400/10 blur-3xl" />

                <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                      <Sprout size={15} /> YOUR IMPACT MATTERS
                    </span>
                    <h2 className="mt-5 text-2xl font-extrabold leading-tight sm:text-3xl">
                      A cleaner community starts with you.
                    </h2>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50/75">
                      Separate your waste, schedule collections and make
                      recycling part of your everyday routine.
                    </p>
                    <button
                      type="button"
                      onClick={() => goTo("Recycling & Impact")}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-900 transition hover:bg-lime-100"
                    >
                      Explore your impact <ArrowRight size={17} />
                    </button>
                  </div>
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center self-start rounded-full border border-white/20 bg-white/10 md:h-36 md:w-36 md:self-auto">
                    <Leaf size={64} className="text-lime-300" strokeWidth={1.4} />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                    <div>
                      <h2 className="font-extrabold text-slate-900">
                        Recent Pickups
                      </h2>
                      <p className="mt-1 text-xs text-slate-400">
                        Your latest collection activity
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => goTo("My Pickups")}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950"
                    >
                      View all <ChevronRight size={16} />
                    </button>
                  </div>

                  {pickupsLoading ? (
                    <div className="flex items-center justify-center gap-3 p-8 text-sm text-slate-500">
                      <LoaderCircle size={20} className="animate-spin" />
                      Loading your pickups...
                    </div>
                  ) : pickups.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-slate-500">
                        No pickup requests yet.
                      </p>
                      <button
                        type="button"
                        onClick={openScheduleForm}
                        className="mt-3 text-sm font-bold text-emerald-700 hover:underline"
                      >
                        Schedule your first pickup
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {pickups.slice(0, 4).map((pickup) => (
                        <div
                          key={pickup._id}
                          className="flex flex-col justify-between gap-3 px-5 py-5 sm:flex-row sm:items-center sm:px-6"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                              <Recycle size={21} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {pickup.type}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {pickupReference(pickup)} · {formatDate(pickup.date)}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={pickup.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="font-extrabold text-slate-900">
                    Quick Actions
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    What would you like to do?
                  </p>

                  <div className="mt-5 space-y-3">
                    {[
                      {
                        title: "Schedule a pickup",
                        desc: "Request a waste collection",
                        icon: CalendarDays,
                        action: openScheduleForm,
                      },
                      {
                        title: "Track my collection",
                        desc: "Check your pickup status",
                        icon: MapPin,
                        action: () => goTo("Track Collection"),
                      },
                      {
                        title: "View recycling impact",
                        desc: "Explore your contribution",
                        icon: TrendingUp,
                        action: () => goTo("Recycling & Impact"),
                      },
                      {
                        title: "Manage profile",
                        desc: "Review your account details",
                        icon: CircleUserRound,
                        action: () => goTo("My Profile"),
                      },
                    ].map((action) => {
                      const Icon = action.icon;

                      return (
                        <button
                          type="button"
                          key={action.title}
                          onClick={action.action}
                          className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50/60"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-emerald-100 group-hover:text-emerald-800">
                            <Icon size={19} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-slate-800">
                              {action.title}
                            </span>
                            <span className="mt-1 block text-xs text-slate-400">
                              {action.desc}
                            </span>
                          </span>
                          <ArrowUpRight size={17} className="text-slate-400 group-hover:text-emerald-800" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* MY PICKUPS */}
          {activePage === "My Pickups" && (
            <>
              <SectionHeading
                eyebrow="Collection management"
                title="My Pickups"
                description="Your saved pickup requests from MongoDB. You can cancel requests that have not started."
              />

              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by ID, waste type or status..."
                    aria-label="Search pickup requests"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setPickupRefresh((value) => value + 1)}
                  disabled={pickupsLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-emerald-50 disabled:opacity-60"
                >
                  <RefreshCw size={17} className={pickupsLoading ? "animate-spin" : ""} />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={openScheduleForm}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white hover:bg-emerald-900"
                >
                  <Plus size={18} /> New Pickup
                </button>
              </div>

              {pickupError && (
                <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {pickupError}
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 lg:grid">
                  <span>Pickup details</span>
                  <span>Date</span>
                  <span>Time slot</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>

                {pickupsLoading ? (
                  <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
                    <LoaderCircle size={22} className="animate-spin text-emerald-700" />
                    Loading pickups...
                  </div>
                ) : filteredPickups.length === 0 ? (
                  <div className="p-12 text-center">
                    <PackageCheck size={34} className="mx-auto text-emerald-700" />
                    <p className="mt-3 font-bold text-slate-800">
                      {pickups.length === 0 ? "No pickup requests yet" : "No matching pickups"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {pickups.length === 0
                        ? "Create a pickup request to see it here."
                        : "Try another search term."}
                    </p>
                    {pickups.length === 0 && (
                      <button
                        type="button"
                        onClick={openScheduleForm}
                        className="mt-4 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900"
                      >
                        Schedule a pickup
                      </button>
                    )}
                  </div>
                ) : (
                  filteredPickups.map((pickup) => (
                    <div
                      key={pickup._id}
                      className="grid gap-3 border-b border-slate-100 px-5 py-5 last:border-0 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-center lg:gap-4 lg:px-6"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                          <Trash2 size={19} />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{pickup.type}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {pickupReference(pickup)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{pickup.address}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400 lg:hidden">Date</p>
                        <p className="text-sm text-slate-600">{formatDate(pickup.date)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400 lg:hidden">Time slot</p>
                        <p className="text-sm text-slate-600">{pickup.time}</p>
                      </div>

                      <div>
                        <StatusBadge status={pickup.status} />
                      </div>

                      <div>
                        {["Scheduled", "Pending"].includes(pickup.status) && (
                          <button
                            type="button"
                            onClick={() => cancelPickup(pickup)}
                            disabled={cancellingId === pickup._id}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {cancellingId === pickup._id ? (
                              <LoaderCircle size={15} className="animate-spin" />
                            ) : (
                              <X size={15} />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* TRACK COLLECTION */}
          {activePage === "Track Collection" && (
            <>
              <SectionHeading
                eyebrow="Collection tracking"
                title="Track your collection"
                description="Review the latest pickup information returned by the server."
              />

              {pickupsLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                  <LoaderCircle className="mx-auto animate-spin text-emerald-700" size={28} />
                  <p className="mt-3 text-sm text-slate-500">Loading collection status...</p>
                </div>
              ) : pickups.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                  <Truck size={34} className="mx-auto text-emerald-700" />
                  <h2 className="mt-3 font-bold">No collection to track</h2>
                  <p className="mt-2 text-sm text-slate-500">Schedule a pickup to get started.</p>
                  <button type="button" onClick={openScheduleForm} className="mt-4 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900">
                    Schedule a pickup
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {pickups.map((pickup) => (
                    <article key={pickup._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                            <Truck size={23} />
                          </span>
                          <div>
                            <p className="font-bold">{pickup.type}</p>
                            <p className="mt-1 text-xs text-slate-400">{pickupReference(pickup)}</p>
                          </div>
                        </div>
                        <StatusBadge status={pickup.status} />
                      </div>

                      <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <CalendarDays size={17} className="text-emerald-700" />
                          {formatDate(pickup.date)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <Clock3 size={17} className="text-emerald-700" />
                          {pickup.time}
                        </div>
                        <div className="flex items-start gap-3 text-sm text-slate-600">
                          <MapPin size={17} className="mt-0.5 text-emerald-700" />
                          {pickup.address}
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        {pickup.status === "Completed"
                          ? "This pickup has been completed."
                          : pickup.status === "Cancelled"
                            ? "This pickup was cancelled."
                            : "This is the latest collection status saved by EcoTrack."}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* RECYCLING & IMPACT */}

{activePage === "Recycling & Impact" && (
  <>
    <SectionHeading
      eyebrow="Your green journey"
      title="Recycling & Impact"
      description="Your environmental dashboard, based on your saved pickup records."
    />

    {pickupError && (
      <div
        role="alert"
        className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
      >
        {pickupError}
      </div>
    )}

    {pickupsLoading ? (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <LoaderCircle
          size={30}
          className="mx-auto animate-spin text-emerald-700"
        />
        <p className="mt-3 text-sm text-slate-500">
          Loading your environmental data...
        </p>
      </div>
    ) : (
      <>
        {/*
          All counts below are calculated from the pickup records
          returned by the authenticated MongoDB API.
        */}
        {(() => {
          const completedPickups = pickups.filter(
            (pickup) => pickup.status === "Completed"
          );

          const upcomingPickups = pickups.filter(
            (pickup) =>
              ["Scheduled", "Pending"].includes(pickup.status) &&
              pickup.date >= getLocalDateString()
          );

          const inProgressPickups = pickups.filter(
            (pickup) => pickup.status === "In Progress"
          );

          const recordedWeights = completedPickups
            .map((pickup) => pickup.collectedWeightKg)
            .filter(
              (weight) =>
                weight !== null &&
                weight !== undefined &&
                weight !== "" &&
                Number.isFinite(Number(weight)) &&
                Number(weight) >= 0
            )
            .map(Number);

          const totalWeightKg = recordedWeights.reduce(
            (total, weight) => total + weight,
            0
          );

          const hasWeightData = recordedWeights.length > 0;

          const stats = [
            {
              label: "Total Pickups",
              value: pickups.length,
              description: "All your saved pickup requests",
              icon: PackageCheck,
              tone: "bg-blue-50 text-blue-700",
            },
            {
              label: "Completed Collections",
              value: completedPickups.length,
              description: "Collections marked completed",
              icon: CheckCircle2,
              tone: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Upcoming Collections",
              value: upcomingPickups.length,
              description: "Pending or scheduled in the future",
              icon: CalendarDays,
              tone: "bg-amber-50 text-amber-700",
            },
            {
              label: "In Progress",
              value: inProgressPickups.length,
              description: "Collections currently in progress",
              icon: Truck,
              tone: "bg-violet-50 text-violet-700",
            },
          ];

          return (
            <>
              {/* DATABASE-BASED STATISTICS */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-500">
                            {stat.label}
                          </p>
                          <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                            {stat.value}
                          </p>
                        </div>

                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}
                        >
                          <Icon size={22} />
                        </span>
                      </div>

                      <p className="mt-4 text-xs leading-5 text-slate-400">
                        {stat.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* ACTUAL RECORDED WASTE WEIGHT */}
              <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 p-6 text-white shadow-sm sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                      <Sprout size={15} />
                      YOUR RECYCLING RECORD
                    </div>

                    <h2 className="mt-5 text-2xl font-extrabold">
                      Waste collected
                    </h2>

                    <p className="mt-2 max-w-lg text-sm leading-6 text-emerald-50/75">
                      This total uses weight values recorded for your
                      completed collections. A collection without a
                      recorded weight is not included.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/10 p-6 sm:min-w-48">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100/80">
                      Recorded total
                    </p>

                    {hasWeightData ? (
                      <p className="mt-2 text-4xl font-black">
                        {Number(totalWeightKg.toFixed(2))}{" "}
                        <span className="text-lg font-semibold">kg</span>
                      </p>
                    ) : (
                      <p className="mt-2 text-xl font-extrabold">
                        Not recorded
                      </p>
                    )}

                    <p className="mt-2 text-xs text-emerald-100/70">
                      {recordedWeights.length} completed collection
                      {recordedWeights.length === 1 ? "" : "s"} with
                      recorded weight
                    </p>
                  </div>
                </div>

                {!hasWeightData && (
                  <div className="mt-6 rounded-xl border border-white/15 bg-black/10 p-4 text-sm leading-6 text-emerald-50/90">
                    Actual waste weight is not available yet. It will
                    appear when collection weights are saved in the
                    database.
                  </div>
                )}
              </div>

              {/* RECENT COLLECTION CONTRIBUTION */}
              <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                  <div>
                    <h2 className="font-extrabold text-slate-900">
                      Collection activity
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Your latest database records
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPickupRefresh((value) => value + 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50"
                  >
                    <RefreshCw size={16} />
                    Refresh data
                  </button>
                </div>

                {pickups.length === 0 ? (
                  <div className="p-10 text-center">
                    <Recycle
                      size={34}
                      className="mx-auto text-emerald-700"
                    />
                    <p className="mt-3 font-bold text-slate-800">
                      No collection records yet
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Schedule your first pickup to start building your
                      collection history.
                    </p>

                    <button
                      type="button"
                      onClick={openScheduleForm}
                      className="mt-4 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900"
                    >
                      Schedule a pickup
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {[...pickups]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt || b.date) -
                          new Date(a.createdAt || a.date)
                      )
                      .slice(0, 8)
                      .map((pickup) => (
                        <div
                          key={pickup._id}
                          className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                              <Recycle size={20} />
                            </span>

                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {pickup.type}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {pickupReference(pickup)} ·{" "}
                                {formatDate(pickup.date)}
                              </p>

                              {pickup.status === "Completed" &&
                                pickup.collectedWeightKg !== null &&
                                pickup.collectedWeightKg !== undefined &&
                                pickup.collectedWeightKg !== "" && (
                                  <p className="mt-2 text-sm font-semibold text-emerald-700">
                                    Recorded weight:{" "}
                                    {Number(pickup.collectedWeightKg)} kg
                                  </p>
                                )}
                            </div>
                          </div>

                          <StatusBadge status={pickup.status} />
                        </div>
                      ))}
                  </div>
                )}
              </section>

              {/* PRACTICAL GUIDANCE */}
              <section className="mt-7 rounded-2xl border border-emerald-100 bg-white p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <Leaf size={24} />
                  </span>

                  <div>
                    <h2 className="font-extrabold text-slate-900">
                      Make every collection count
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Simple practices for responsible waste management
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      title: "Separate waste",
                      description:
                        "Keep organic, recyclable and mixed waste separated.",
                    },
                    {
                      title: "Track your records",
                      description:
                        "Review completed pickups and their recorded weights.",
                    },
                    {
                      title: "Stay consistent",
                      description:
                        "Plan collections and avoid leaving waste uncollected.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl bg-emerald-50/70 p-5"
                    >
                      <CheckCircle2
                        size={21}
                        className="text-emerald-700"
                      />
                      <h3 className="mt-3 font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          );
        })()}
      </>
    )}
  </>
)}

          {/* MY REPORTS */}
          {activePage === "My Reports" && (
            <>
              <SectionHeading
                eyebrow="Community reports"
                title="My Issue Reports"
                description="Review submitted issues and check the latest status updated by the EcoTrack admin."
              />

              <div className="mb-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setReportsRefresh((value) => value + 1)}
                  disabled={reportsLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50 disabled:opacity-60"
                >
                  <RefreshCw size={17} className={reportsLoading ? "animate-spin" : ""} />
                  Refresh reports
                </button>
              </div>

              {reportsError && (
                <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <AlertCircle size={19} className="mt-0.5 shrink-0" />
                  <p>{reportsError}</p>
                </div>
              )}

              {reportsLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
                  <LoaderCircle size={32} className="mx-auto animate-spin text-emerald-700" />
                  <p className="mt-4 font-semibold text-slate-800">Loading your reports...</p>
                </div>
              ) : issueReports.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <ClipboardList size={30} />
                  </span>
                  <h2 className="mt-4 text-lg font-extrabold text-slate-900">No reports found</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Your submitted issue reports will appear here after they are saved successfully.
                  </p>
                  <button type="button" onClick={() => navigate("/user/report-issue")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900">
                    <Plus size={17} /> Report an issue
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                  {issueReports.map((report) => {
                    const reference = `ECO-${String(report._id || "").slice(-8).toUpperCase()}`;
                    const image = getPhotoUrl(report.photoUrl);
                    const hasLocation =
                      report.latitude !== null &&
                      report.latitude !== undefined &&
                      report.latitude !== "" &&
                      report.longitude !== null &&
                      report.longitude !== undefined &&
                      report.longitude !== "";

                    return (
                      <article key={report._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {image && (
                          <a href={image} target="_blank" rel="noreferrer">
                            <img src={image} alt="Reported issue" loading="lazy" className="h-48 w-full object-cover" />
                          </a>
                        )}
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{reference}</p>
                              <h2 className="mt-2 text-lg font-extrabold text-slate-900">{report.category}</h2>
                            </div>
                            <StatusBadge status={report.status || "Pending"} />
                          </div>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{report.description}</p>

                          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                            <div className="flex items-start gap-2 text-sm text-slate-600">
                              <CalendarDays size={17} className="mt-0.5 shrink-0 text-emerald-700" />
                              <span>Submitted: {formatDateTime(report.createdAt)}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-slate-600">
                              <MapPin size={17} className="mt-0.5 shrink-0 text-emerald-700" />
                              <span>{report.address || "Address not provided"}</span>
                            </div>
                            {hasLocation && (
                              <a
                                href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=16/${report.latitude}/${report.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
                              >
                                <MapPin size={16} /> View reported location
                              </a>
                            )}
                          </div>

                          <div className="mt-5 rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Current status</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{report.status || "Pending"}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Use Refresh reports to check for the latest update.
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* MY PROFILE */}
          {activePage === "My Profile" && (
            <>
              <SectionHeading
                eyebrow="Account settings"
                title="My Profile"
                description="Review your resident profile information."
              />
              <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-black text-emerald-800">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-extrabold">{displayName}</h2>
                    <p className="mt-1 break-all text-sm text-slate-500">{displayEmail || "Email not available"}</p>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <ShieldCheck size={14} /> Resident account
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Display name</label>
                    <input readOnly value={displayName} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                    <input readOnly type="email" value={displayEmail} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Account type</label>
                    <input readOnly value="Resident" className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500" />
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    Profile information is read from the account details saved at login.
                  </p>

                  <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700">
                    <LogOut size={17} /> Log out of EcoTrack
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        <footer className="border-t border-slate-200/80 px-5 py-5 text-xs text-slate-400 sm:px-9">
          © {new Date().getFullYear()} EcoTrack · User workspace · A cleaner tomorrow.
        </footer>
      </div>

      {/* PICKUP BOOKING MODAL */}
      {showSchedule && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Collection request
                </p>
                <h2 className="mt-2 text-2xl font-extrabold">Schedule a pickup</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Your request will be saved to your EcoTrack account.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSchedule(false);
                  setFormError("");
                }}
                disabled={submittingPickup}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={schedulePickup} className="mt-7 space-y-5">
              <div>
                <label htmlFor="pickup-type" className="mb-2 block text-sm font-semibold">
                  Waste type
                </label>
                <select
                  id="pickup-type"
                  required
                  value={form.type}
                  disabled={submittingPickup}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                >
                  <option>Dry recyclable waste</option>
                  <option>Wet / organic waste</option>
                  <option>Mixed household waste</option>
                  <option>E-waste</option>
                  <option>Garden waste</option>
                </select>
              </div>

              <div>
                <label htmlFor="pickup-date" className="mb-2 block text-sm font-semibold">
                  Preferred collection date
                </label>
                <input
                  id="pickup-date"
                  type="date"
                  required
                  min={getLocalDateString()}
                  value={form.date}
                  disabled={submittingPickup}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label htmlFor="pickup-time" className="mb-2 block text-sm font-semibold">
                  Preferred time slot
                </label>
                <select
                  id="pickup-time"
                  value={form.time}
                  disabled={submittingPickup}
                  onChange={(event) => setForm({ ...form, time: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                >
                  <option>09:00 AM - 11:00 AM</option>
                  <option>11:00 AM - 01:00 PM</option>
                  <option>02:00 PM - 04:00 PM</option>
                  <option>04:00 PM - 06:00 PM</option>
                </select>
              </div>

              <div>
                <label htmlFor="pickup-address" className="mb-2 block text-sm font-semibold">
                  Collection address
                </label>
                <input
                  id="pickup-address"
                  required
                  maxLength={500}
                  value={form.address}
                  disabled={submittingPickup}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  placeholder="Enter your collection address"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label htmlFor="pickup-notes" className="mb-2 block text-sm font-semibold">
                  Additional notes (optional)
                </label>
                <textarea
                  id="pickup-notes"
                  rows={3}
                  maxLength={2000}
                  value={form.notes}
                  disabled={submittingPickup}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Add any instructions for the collection team..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              {formError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  disabled={submittingPickup}
                  onClick={() => {
                    setShowSchedule(false);
                    setFormError("");
                  }}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingPickup}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60"
                >
                  {submittingPickup ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Saving pickup...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Submit Request
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
