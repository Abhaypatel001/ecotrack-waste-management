
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Truck,
  Recycle,
  MessageSquareWarning,
  ChartNoAxesCombined,
  Settings,
  Leaf,
  X,
  LogOut,
  CalendarDays,
  FileWarning,
} from "lucide-react";

const navigation = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Pickup Requests", to: "/admin/requests", icon: ClipboardList },
      { label: "Schedule", to: "/admin/schedule", icon: CalendarDays },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { label: "Collectors", to: "/admin/collectors", icon: Truck },
      { label: "Users", to: "/admin/users", icon: Users },
      { label: "Waste Categories", to: "/admin/categories", icon: Recycle },
      { label: "Complaints", to: "/admin/complaints", icon: MessageSquareWarning },
      {
        label: "Issue Reports",
        to: "/admin/issue-reports",
        icon: FileWarning,
      },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      {
        label: "Reports & Analytics",
        to: "/admin/reports",
        icon: ChartNoAxesCombined,
      },
      { label: "Settings", to: "/admin/settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-19 items-center justify-between border-b border-gray-100 px-6">
          <NavLink
            to="/admin/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <span className="rounded-xl bg-emerald-700 p-2 text-white">
              <Leaf size={24} />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Eco<span className="text-emerald-700">Track</span>
            </span>
          </NavLink>

          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.16em] text-gray-400">
                {group.label}
              </p>

              <div className="space-y-1">
                {group.items.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-emerald-50 text-emerald-800"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                  >
                    <Icon size={19} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="rounded-2xl bg-emerald-950 p-4 text-white">
            <div className="flex items-center gap-2">
              <Recycle size={20} className="text-emerald-300" />
              <span className="font-semibold">Go greener</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-emerald-100">
              Better collection. Smarter recycling. Cleaner communities.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl p-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
              AD
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <LogOut size={17} className="text-gray-400" />
          </div>
        </div>
      </aside>
    </>
  );
}
