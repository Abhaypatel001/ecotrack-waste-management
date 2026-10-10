import { useState } from "react";
import { Save, Settings2, Bell, ShieldCheck } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";

export default function Settings() {
  const [form, setForm] = useState({
    organization: "EcoTrack Waste Management",
    email: "admin@example.com",
    phone: "",
    zone: "Kanpur",
    emailNotifications: true,
    pickupAlerts: true,
  });
  const [saved, setSaved] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your organization and notification preferences."
      />

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <Settings2 className="text-emerald-700" size={22} />
              <div>
                <h2 className="font-bold">Organization details</h2>
                <p className="mt-1 text-sm text-gray-500">General application settings</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                ["organization", "Organization name"],
                ["email", "Contact email"],
                ["phone", "Contact phone"],
                ["zone", "Primary operating zone"],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
                  <input
                    value={form[key]}
                    type={key === "email" ? "email" : "text"}
                    required={key !== "phone"}
                    onChange={(event) => update(key, event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <Bell className="text-emerald-700" size={22} />
              <div>
                <h2 className="font-bold">Notification preferences</h2>
                <p className="mt-1 text-sm text-gray-500">Choose which demo alerts to enable</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {[
                ["emailNotifications", "Email notifications", "General organization updates"],
                ["pickupAlerts", "Pickup alerts", "New requests and status changes"],
              ].map(([key, label, description]) => (
                <label key={key} className="flex cursor-pointer items-center justify-between gap-4">
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="mt-1 block text-xs text-gray-500">{description}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(event) => update(key, event.target.checked)}
                    className="size-5 accent-emerald-700"
                  />
                </label>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
              <Save size={17} /> Save preferences
            </button>
            {saved && (
              <span role="status" className="text-sm font-medium text-emerald-700">
                Demo settings saved in current page state.
              </span>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <ShieldCheck size={26} className="text-emerald-700" />
          <h2 className="mt-4 font-bold">Security & access</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Authentication, role permissions and account security will be connected to the backend in a later phase.
          </p>
        </aside>
      </form>
    </div>
  );
}