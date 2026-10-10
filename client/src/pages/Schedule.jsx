import { useState } from "react";
import { CalendarDays, Clock, MapPin, Truck } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import { requests } from "../data/mockData";

export default function Schedule() {
  const [date, setDate] = useState("2026-10-10");

  const scheduled = requests.filter((request) => request.date === date);

  return (
    <div>
      <PageHeader
        title="Collection Schedule"
        description="Review planned pickups by date and collection zone."
        action={
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
            <CalendarDays size={17} className="text-emerald-700" />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="min-w-0 bg-transparent text-sm outline-none"
            />
          </label>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Scheduled pickups", scheduled.length],
          ["Pending", scheduled.filter((r) => r.status === "Pending").length],
          ["Assigned", scheduled.filter((r) => r.status === "Assigned").length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {scheduled.length ? scheduled.map((request) => (
          <article key={request.id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <Truck size={22} />
              </div>
              <div>
                <p className="font-bold">{request.id} · {request.wasteType}</p>
                <p className="mt-1 text-sm text-gray-500">{request.citizen} · {request.quantity}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={15} /> {request.location}
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={14} /> Pickup time to be assigned
                </p>
              </div>
            </div>
            <StatusBadge status={request.status} />
          </article>
        )) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            No demo pickups scheduled for this date.
          </div>
        )}
      </div>
    </div>
  );
}