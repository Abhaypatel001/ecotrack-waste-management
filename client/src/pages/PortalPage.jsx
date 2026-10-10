import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  MapPin,
  CalendarDays,
  Recycle,
  ClipboardCheck,
  Truck,
} from "lucide-react";

import PageHeader from "../components/layout/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import { requests } from "../data/mockData";

export default function PortalPage({ role }) {
  const isCollector = role === "collector";
  const [items, setItems] = useState(requests.slice(0, 3));
  const [showForm, setShowForm] = useState(false);
  const [wasteType, setWasteType] = useState("Organic");
  const [quantity, setQuantity] = useState("5");
  const [location, setLocation] = useState("");

  function createDemoRequest(event) {
    event.preventDefault();

    const next = {
      id: `DEMO-${Date.now().toString().slice(-6)}`,
      citizen: "Demo Citizen",
      wasteType,
      quantity: `${quantity} kg`,
      location,
      date: new Date().toISOString().slice(0, 10),
      status: "Pending",
    };

    setItems((current) => [next, ...current]);
    setShowForm(false);
    setLocation("");
    setQuantity("5");
  }

  function advanceDemoTask(id) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        const nextStatus =
          item.status === "Assigned" ? "In Progress" :
          item.status === "In Progress" ? "Completed" :
          item.status;

        return { ...item, status: nextStatus };
      })
    );
  }

  return (
    <div>
      <PageHeader
        title={isCollector ? "My Collection Tasks" : "Citizen Dashboard"}
        description={
          isCollector
            ? "Review assigned pickups and update demo task progress."
            : "Book a waste pickup and review your collection requests."
        }
        action={
          !isCollector && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              <Plus size={18} /> New pickup
            </button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: isCollector ? "Assigned tasks" : "My requests",
            value: items.length,
            icon: ClipboardCheck,
          },
          {
            title: "Pending",
            value: items.filter((item) => item.status === "Pending").length,
            icon: CalendarDays,
          },
          {
            title: "Completed",
            value: items.filter((item) => item.status === "Completed").length,
            icon: Recycle,
          },
        ].map(({ title, value, icon: Icon }) => (
          <article key={title} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{title}</p>
              <Icon className="text-emerald-700" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={createDemoRequest}
          className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"
        >
          <h2 className="text-lg font-bold">Create demo pickup request</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium">
              Waste type
              <select
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3"
              >
                {["Organic", "Plastic", "Paper", "E-waste", "Mixed"].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Quantity (kg)
              <input
                type="number"
                min="0.1"
                max="10000"
                step="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3"
              />
            </label>

            <label className="text-sm font-medium">
              Pickup location
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Area / locality"
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3"
              />
            </label>
          </div>

          <div className="mt-5 flex gap-3">
            <button className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white">
              Add demo request
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-amber-700">
            This request exists only in current page memory and will not be saved to a database.
          </p>
        </form>
      )}

      <section className="mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold">
            {isCollector ? "Collection tasks" : "Pickup history"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Demo records for the selected workspace
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <article key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                  {isCollector ? <Truck size={22} /> : <Recycle size={22} />}
                </span>
                <div>
                  <p className="font-semibold">{item.id} · {item.wasteType}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.quantity} · {item.date}</p>
                  <p className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                    <MapPin size={14} /> {item.location}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={item.status} />
                {isCollector &&
                  ["Assigned", "In Progress"].includes(item.status) && (
                    <button
                      onClick={() => advanceDemoTask(item.id)}
                      className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                    >
                      {item.status === "Assigned" ? "Start task" : "Complete task"}
                    </button>
                  )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-5 text-sm text-gray-500">
        Need administrative access? <Link to="/login?role=admin" className="font-semibold text-emerald-700">Open admin demo</Link>
      </p>
    </div>
  );
}