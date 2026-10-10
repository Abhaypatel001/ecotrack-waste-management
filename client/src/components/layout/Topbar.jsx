
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  Search,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem("ecotrack-user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

export default function Topbar({ onMenuClick }) {
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navigate = useNavigate();
  const user = readStoredUser();

  const displayName = user?.name || "Admin User";
  const displayRole =
    user?.role === "admin" ? "Admin" : "Administrator";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "AD";

  function handleLogout() {
    // Clear the EcoTrack authentication session.
    localStorage.removeItem("ecotrack-token");
    localStorage.removeItem("ecotrack-user");

    setShowProfile(false);
    setShowNotifications(false);

    navigate("/login", { replace: true });
  }

  function openSettings() {
    setShowProfile(false);
    navigate("/admin/settings");
  }

  return (
    <header className="sticky top-0 z-30 flex h-19 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dashboard..."
            aria-label="Search dashboard"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
          />
        </div>

        <p className="truncate text-sm font-semibold text-gray-700 md:hidden">
          EcoTrack Admin
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setShowNotifications((value) => !value)
            }
            aria-label="Notifications"
            aria-expanded={showNotifications}
            className="relative rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50"
          >
            <Bell size={19} />

            <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
              <p className="font-semibold">Notifications</p>

              <p className="mt-3 text-sm text-gray-500">
                Your notification center will show pickup updates here.
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

        {/* Admin profile and logout */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfile((value) => !value)}
            aria-label="Open profile menu"
            aria-expanded={showProfile}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-gray-50"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
              {initials}
            </span>

            <span className="hidden text-left sm:block">
              <span className="block max-w-36 truncate text-sm font-semibold">
                {displayName}
              </span>

              <span className="block text-xs text-gray-500">
                {displayRole}
              </span>
            </span>

            <ChevronDown
              size={15}
              className="hidden text-gray-400 sm:block"
            />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-14 z-50 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {displayName}
                </p>

                <p className="mt-1 text-xs capitalize text-gray-500">
                  {displayRole} account
                </p>

                {user?.email && (
                  <p className="mt-1 break-all text-xs text-gray-500">
                    {user.email}
                  </p>
                )}
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={openSettings}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <Settings size={17} className="text-gray-500" />
                  Account settings
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
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
  );
}
