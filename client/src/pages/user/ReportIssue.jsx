
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Upload,
  X,
  CheckCircle2,
  LoaderCircle,
  Leaf,
  ShieldCheck,
  Clock3,
  LocateFixed,
  AlertTriangle,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL = `${API_BASE}/api/issues`;
const DEFAULT_POSITION = [26.4499, 80.3319];

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

const categories = [
  {
    value: "Garbage Overflow",
    emoji: "🗑️",
    desc: "Bins or garbage piles overflowing",
  },
  {
    value: "Missed Waste Collection",
    emoji: "🚛",
    desc: "Scheduled pickup was missed",
  },
  {
    value: "Illegal Dumping",
    emoji: "⚠️",
    desc: "Waste dumped in an unauthorized area",
  },
  {
    value: "Street Cleaning",
    emoji: "🧹",
    desc: "Litter or dirty public spaces",
  },
  {
    value: "Recycling Problem",
    emoji: "♻️",
    desc: "Recycling bin or sorting issue",
  },
  {
    value: "Other",
    emoji: "📍",
    desc: "Another sanitation concern",
  },
];

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function LocationPicker({ position, onChange }) {
  useMapEvents({
    click(event) {
      onChange([event.latlng.lat, event.latlng.lng]);
    },
  });

  return <Marker position={position} icon={markerIcon} />;
}

function MapRecenter({ position }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, Math.max(map.getZoom(), 14), {
      duration: 0.5,
    });
  }, [map, position]);

  return null;
}

export default function ReportIssue() {
  const [category, setCategory] = useState("Garbage Overflow");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [position, setPosition] = useState([...DEFAULT_POSITION]);
  const [photo, setPhoto] = useState(null);

  const [locationStatus, setLocationStatus] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState("");
  const [error, setError] = useState("");

  // Clean up the previous image preview URL.
  useEffect(() => {
    if (!photo?.preview) return;

    const previewUrl = photo.preview;

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [photo]);

  function getCurrentLocation() {
    setError("");

    if (!navigator.geolocation) {
      setLocationStatus(
        "Your browser does not support location services."
      );
      return;
    }

    setLoadingLocation(true);
    setLocationStatus("Requesting location permission…");

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const coords = [
          result.coords.latitude,
          result.coords.longitude,
        ];

        setPosition(coords);
        setLocationStatus(
          "Location captured. You can still adjust the pin on the map."
        );
        setLoadingLocation(false);
      },
      (err) => {
        setLocationStatus(
          err.code === 1
            ? "Location permission denied. Allow access in your browser settings."
            : "Couldn't get your location. You can place the pin manually on the map."
        );

        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function handlePhoto(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      setError("Choose a JPG, PNG, WEBP or GIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Please choose a photo smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");

    setPhoto({
      file,
      preview: URL.createObjectURL(file),
    });
  }

  // Send the report using the JWT from the authenticated session.
  // The backend determines reporterId from the verified token.
  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setError("");

    const token = localStorage.getItem("ecotrack-token");

    if (!token) {
      setError(
        "You are not signed in. Please log in before submitting a report."
      );
      return;
    }

    if (!category.trim()) {
      setError("Please select an issue category.");
      return;
    }

    if (!description.trim()) {
      setError(
        "Please add a short description so the team understands the issue."
      );
      return;
    }

    if (description.trim().length > 1000) {
      setError("Description must be 1000 characters or fewer.");
      return;
    }

    if (address.trim().length > 500) {
      setError("Address must be 500 characters or fewer.");
      return;
    }

    const [latitude, longitude] = position;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError("Please select a valid location on the map.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();

      payload.append("category", category);
      payload.append("description", description.trim());
      payload.append("address", address.trim());
      payload.append("latitude", String(latitude));
      payload.append("longitude", String(longitude));

      // Do not send a browser-generated reporterId.
      // The backend will use req.user.id from the verified JWT.
      if (photo?.file) {
        payload.append("photo", photo.file);
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("ecotrack-token");
        localStorage.removeItem("ecotrack-user");

        throw new Error(
          "Your session is invalid or expired. Please log in again."
        );
      }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message ||
            "The server could not save your report. Please try again."
        );
      }

      const savedReport = result.data;

      if (!savedReport._id) {
        throw new Error(
          "The server did not return a report reference."
        );
      }

      setReportId(
        `ECO-${String(savedReport._id).slice(-8).toUpperCase()}`
      );

      setSubmitted(true);
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the EcoTrack server. Check that the backend is running on port 5000."
        );
      } else {
        setError(
          err.message ||
            "Could not submit your report. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setCategory("Garbage Overflow");
    setDescription("");
    setAddress("");
    setPosition([...DEFAULT_POSITION]);
    setPhoto(null);
    setError("");
    setLocationStatus("");
    setSubmitted(false);
    setReportId("");
  }

  // Show success only after the API confirms that the report was saved.
  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f5f8f5] px-4 py-10 sm:px-8">
        <div className="mx-auto flex min-h-[75vh] max-w-3xl items-center justify-center">
          <div className="w-full overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_24px_80px_-32px_rgba(6,78,59,.25)]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0b3328] via-emerald-800 to-emerald-600 px-7 py-12 text-center text-white sm:px-12">
              <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[28px] border-white/10" />
              <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-lime-300/10 blur-2xl" />

              <span className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-xl backdrop-blur">
                <CheckCircle2
                  size={42}
                  className="text-lime-300"
                />
              </span>

              <p className="relative mt-6 text-xs font-bold uppercase tracking-[.24em] text-emerald-100">
                Report received
              </p>

              <h1 className="relative mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Thank you for speaking up.
              </h1>

              <p className="relative mx-auto mt-3 max-w-lg text-sm leading-6 text-emerald-50/80">
                Your issue report has been saved to the EcoTrack
                database. Keep your reference number for future
                follow-up.
              </p>
            </div>

            <div className="p-7 sm:p-10">
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Reference number
                  </p>

                  <p className="mt-1 text-xl font-black tracking-wide text-slate-900">
                    {reportId}
                  </p>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
                  <Clock3 size={14} />
                  Pending review
                </span>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Your report was accepted by the API. Status updates
                and notifications depend on the EcoTrack backend
                features currently configured.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-900"
                >
                  <AlertTriangle size={17} />
                  Report another issue
                </button>

                <Link
                  to="/user/dashboard"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  Back to dashboard
                  <ChevronRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f8f5] text-slate-800">
      <div className="mx-auto max-w-[1600px] px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
        <Link
          to="/user/dashboard"
          className="group mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-800"
        >
          <ArrowLeft
            size={16}
            className="transition group-hover:-translate-x-0.5"
          />
          Back to Dashboard
        </Link>

        {/* Hero */}
        <section className="relative mb-4 overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[#062e25] via-[#0d6245] to-[#5f9c55] px-5 py-5 text-white shadow-[0_18px_45px_-28px_rgba(6,78,59,.55)] sm:px-7 sm:py-6 lg:px-9">
          <div className="absolute -right-12 -top-24 h-80 w-80 rounded-full border-[44px] border-white/[0.06]" />
          <div className="absolute right-1/4 top-10 h-48 w-48 rounded-full bg-lime-300/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[.2em] text-emerald-100 backdrop-blur">
                <Sparkles size={14} className="text-lime-300" />
                Community care · EcoTrack
              </span>

              <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                Let’s make your neighbourhood{" "}
                <span className="text-lime-300">cleaner.</span>
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
                Spot a waste or sanitation issue? Share the details
                and location. Every report is a step toward a
                healthier, greener community.
              </p>
            </div>

            <div className="hidden h-28 w-28 items-center justify-center rounded-[2rem] border border-white/15 bg-white/10 shadow-xl backdrop-blur lg:flex">
              <Leaf
                size={54}
                className="text-lime-300"
                strokeWidth={1.4}
              />
            </div>
          </div>

          <div className="relative mt-4 grid gap-2 border-t border-white/15 pt-3 sm:grid-cols-3">
            {[
              [
                ShieldCheck,
                "Authenticated account",
                "Submit using your signed-in session",
              ],
              [
                MapPin,
                "Pin the exact spot",
                "Choose your location on the map",
              ],
              [
                Clock3,
                "Track the report",
                "Keep your reference number",
              ],
            ].map(([Icon, title, desc]) => (
              <div
                key={title}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] p-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-300/15 text-lime-200">
                  <Icon size={19} />
                </span>

                <span>
                  <span className="block text-sm font-bold">
                    {title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-emerald-100/65">
                    {desc}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="grid items-stretch gap-3 xl:grid-cols-2"
        >
          {/* Issue details */}
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,.25)]">
            <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
              <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-emerald-700">
                01 · Issue details
              </p>

              <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">
                Tell us what’s happening
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                A few details help us understand the problem.
              </p>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Choose a category
                </label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      disabled={submitting}
                      onClick={() => setCategory(item.value)}
                      aria-pressed={category === item.value}
                      className={`flex min-h-[62px] items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
                        category === item.value
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10"
                          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg ${
                          category === item.value
                            ? "bg-white shadow-sm"
                            : "bg-slate-100"
                        }`}
                      >
                        {item.emoji}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold leading-4 text-slate-800">
                          {item.value}
                        </span>
                        <span className="hidden">{item.desc}</span>
                      </span>

                      {category === item.value && (
                        <CheckCircle2
                          size={17}
                          className="mt-1 shrink-0 text-emerald-700"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="issue-description"
                    className="text-sm font-bold text-slate-800"
                  >
                    Describe the issue{" "}
                    <span className="text-rose-500">*</span>
                  </label>

                  <span className="text-xs text-slate-400">
                    {description.length}/1000
                  </span>
                </div>

                <textarea
                  id="issue-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  required
                  disabled={submitting}
                  placeholder="For example: the community bin near the park has been overflowing since yesterday…"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm leading-5 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />

                <p className="mt-1 text-[11px] text-slate-400">
                  Tip: include how long it has been there and any nearby landmark.
                </p>
              </div>

              {/* Photo upload */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Add a photo{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                {photo ? (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img
                      src={photo.preview}
                      alt="Issue preview"
                      className="h-36 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      disabled={submitting}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      aria-label="Remove photo"
                    >
                      <X size={18} />
                    </button>

                    <div className="flex items-center gap-2 px-4 py-3">
                      <Camera size={16} className="text-emerald-700" />
                      <p className="truncate text-xs font-semibold text-slate-600">
                        {photo.file.name}
                      </p>
                      <span className="ml-auto shrink-0 text-[10px] font-bold uppercase text-emerald-700">
                        Attached
                      </span>
                    </div>
                  </div>
                ) : (
                  <label className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm transition group-hover:scale-105">
                      <Camera size={25} />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-800">
                        Click to upload a photo
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        PNG, JPG, WEBP or GIF · Max 5 MB
                      </span>
                    </span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      capture="environment"
                      disabled={submitting}
                      onChange={handlePhoto}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="issue-address"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Address or nearby landmark{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="issue-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    maxLength={500}
                    disabled={submitting}
                    placeholder="Street, area, landmark…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Location picker */}
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,.25)]">
            <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
              <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-emerald-700">
                02 · Location
              </p>

              <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">
                Where is the issue?
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Use your location or click on the map to move the pin.
              </p>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loadingLocation || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60"
              >
                {loadingLocation ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <LocateFixed size={18} />
                )}

                {loadingLocation
                  ? "Finding your location…"
                  : "Use my current location"}
              </button>

              {locationStatus && (
                <p
                  role="status"
                  className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600"
                >
                  {locationStatus}
                </p>
              )}

              <div className="relative h-[230px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-[250px]">
                <MapContainer
                  center={position}
                  zoom={14}
                  scrollWheelZoom
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <LocationPicker
                    position={position}
                    onChange={setPosition}
                  />

                  <MapRecenter position={position} />
                </MapContainer>

                <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-lg border border-white/80 bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow-md backdrop-blur">
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  Click map to pin
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Latitude
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-bold text-slate-800">
                    {position[0].toFixed(6)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Longitude
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-bold text-slate-800">
                    {position[1].toFixed(6)}
                  </p>
                </div>
              </div>

              <p className="flex items-start gap-2 text-[11px] leading-4 text-slate-500">
                <ShieldCheck
                  size={16}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                Location permission is requested by your browser.
                You can also select the spot directly on the map.
              </p>
            </div>
          </section>

          {/* API errors */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 xl:col-span-2"
            >
              <AlertTriangle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <div className="flex-1">
                <p>{error}</p>
                <p className="mt-1 text-xs font-normal">
                  Check that you are logged in and the backend is
                  running at localhost:5000.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* Submit */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-4 xl:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <CheckCircle2 size={22} />
                </span>

                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    Ready to send your report?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your report details, authenticated session,
                    coordinates and optional photo will be sent to
                    the EcoTrack backend.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Link
                  to="/user/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting || loadingLocation}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-700/20 disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Uploading report...
                    </>
                  ) : (
                    <>
                      <Upload size={17} />
                      Submit issue report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
          EcoTrack · Cleaner spaces begin with community action.
        </p>
      </div>
    </main>
  );
}
