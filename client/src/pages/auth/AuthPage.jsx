
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Leaf,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  LockKeyhole,
  UserRound,
  CheckCircle2,
  Recycle,
  ShieldCheck,
  Sprout,
} from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState(
    location.pathname === "/signup" ? "signup" : "login"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  // /login aur /signup URL ke according correct form open karo.
  useEffect(() => {
    setMode(location.pathname === "/signup" ? "signup" : "login");
    setError("");
    setMessage("");
  }, [location.pathname]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const confirmPassword = String(data.get("confirmPassword") || "");

    if (isSignup && name.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (
      isSignup &&
      new TextEncoder().encode(password).length > 72
    ) {
      setError("Password is too long. Please use a shorter password.");
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignup ? "register" : "login";

      const payload = isSignup
        ? { name, email, password }
        : { email, password };

      const response = await fetch(
        `${API_BASE}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            (isSignup
              ? "Unable to create your account."
              : "Unable to sign in.")
        );
      }

      if (!result.token || !result.user) {
        throw new Error(
          "The server response is incomplete. Please try again."
        );
      }

      // Store the token and minimal user details for this frontend.
      // Backend authorization must still verify the token on protected APIs.
      try {
        localStorage.setItem("ecotrack-token", result.token);
        localStorage.setItem(
          "ecotrack-user",
          JSON.stringify(result.user)
        );
      } catch {
        throw new Error(
          "Your browser could not save the login session. Check your browser storage settings."
        );
      }

      setMessage(
        result.message ||
          (isSignup ? "Account created successfully." : "Login successful.")
      );

      // New public signups are normal users; admins go to admin dashboard.
      const destination =
        result.user.role === "admin"
          ? "/admin/dashboard"
          : "/user/dashboard";

      navigate(destination, { replace: true });
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the EcoTrack server. Please make sure the backend is running on port 5000."
        );
      } else {
        setError(
          err.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode) {
    setError("");
    setMessage("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setMode(nextMode);

    navigate(nextMode === "signup" ? "/signup" : "/login", {
      replace: true,
    });
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10";

  return (
    <main className="min-h-screen bg-[#f4f7f3] p-3 sm:p-5 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-7xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-emerald-950/10 sm:min-h-[calc(100vh-40px)] lg:grid-cols-[0.95fr_1.05fr] lg:rounded-[2.5rem]">
        {/* LEFT BRAND PANEL */}
        <section className="relative hidden overflow-hidden bg-[#092d22] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-28 top-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-16 top-32 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl" />

          <Link to="/" className="relative z-10 flex w-fit items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-950/30">
              <Leaf size={26} />
            </span>
            <span className="text-2xl font-extrabold tracking-tight">
              Eco<span className="text-emerald-400">Track</span>
            </span>
          </Link>

          <div className="relative z-10 my-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-white/[0.07] px-4 py-2 text-xs font-semibold tracking-wide text-emerald-200">
              <Sprout size={15} />
              A BETTER WAY TO MANAGE WASTE
            </span>

            <h1 className="mt-7 max-w-lg text-5xl font-black leading-[1.12] tracking-tight xl:text-6xl">
              Small actions.
              <span className="mt-2 block text-emerald-400">
                A greener future.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-8 text-emerald-100/70">
              Join a smarter approach to waste collection, responsible
              recycling and cleaner communities.
            </p>

            <div className="mt-9 space-y-4">
              {[
                "Simple waste pickup management",
                "A cleaner, more sustainable community",
                "Smart tools for responsible recycling",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2
                    size={19}
                    className="shrink-0 text-emerald-400"
                  />
                  <span className="text-sm text-emerald-50/85">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Recycle size={23} />
              </div>
              <div>
                <p className="font-semibold">Make every action count.</p>
                <p className="mt-1 text-sm leading-6 text-emerald-100/60">
                  Better waste habits begin with better tools.
                </p>
              </div>
            </div>
          </div>

          <p className="relative z-10 mt-6 text-xs text-emerald-100/40">
            © {new Date().getFullYear()} EcoTrack · Built for a greener tomorrow
          </p>
        </section>

        {/* RIGHT AUTH PANEL */}
        <section className="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <Link to="/" className="mb-9 flex w-fit items-center gap-2.5 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-800 text-white">
                <Leaf size={24} />
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-emerald-950">
                Eco<span className="text-emerald-700">Track</span>
              </span>
            </Link>

            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                {isSignup ? "JOIN THE MOVEMENT" : "WELCOME BACK"}
              </p>

              <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {isSignup ? "Create your account" : "Sign in to EcoTrack"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {isSignup
                  ? "Create an account to get started on your greener journey."
                  : "Your smarter waste management journey starts here."}
              </p>
            </div>

            {/* Mode switch */}
            <div className="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => changeMode("login")}
                className={`rounded-lg px-3 py-3 text-sm font-bold transition ${
                  !isSignup
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => changeMode("signup")}
                className={`rounded-lg px-3 py-3 text-sm font-bold transition ${
                  isSignup
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Create Account
              </button>
            </div>

            <form
              key={mode}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {isSignup && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full name
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={60}
                      placeholder="Enter your full name"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-emerald-800"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {isSignup && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder="Enter password again"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-emerald-800"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              {message && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900"
                >
                  {message}
                </div>
              )}

              {!isSignup && (
                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-700" />
                    Token-based sign-in
                  </span>
                  <span>EcoTrack Account</span>
                </div>
              )}

              {isSignup && (
                <p className="text-xs leading-5 text-slate-500">
                  Your password is hashed by the EcoTrack backend before
                  being stored. Keep your login details private.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-900 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading
                  ? isSignup
                    ? "Creating account..."
                    : "Signing in..."
                  : isSignup
                    ? "Create Account"
                    : "Sign In"}
                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            <div className="mt-7 text-center text-sm text-slate-500">
              {isSignup ? "Already have an account? " : "New to EcoTrack? "}
              <button
                type="button"
                onClick={() => changeMode(isSignup ? "login" : "signup")}
                className="font-bold text-emerald-800 hover:text-emerald-950"
              >
                {isSignup ? "Sign in" : "Create an account"}
              </button>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <Link
                to="/"
                className="text-sm font-semibold text-slate-500 transition hover:text-emerald-800"
              >
                ← Back to Home Page
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
