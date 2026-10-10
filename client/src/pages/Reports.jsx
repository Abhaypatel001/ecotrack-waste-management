import {
  Download,
  Recycle,
  Truck,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import PageHeader from "../components/layout/PageHeader";
import StatCard from "../components/ui/StatCard";
import { monthlyWaste, wasteDistribution } from "../data/mockData";

export default function Reports() {
  function downloadReport() {
    const csv = [
      "Month,Collected (kg),Recycled (kg)",
      ...monthlyWaste.map(
        (row) => `${row.month},${row.collected},${row.recycled}`
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ecotrack-monthly-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Review waste collection, recycling and operational performance."
        action={
          <button
            onClick={downloadReport}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            <Download size={17} /> Export report
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Collected" value="2,390 kg" subtitle="Demo reporting period" icon={Truck} />
        <StatCard title="Recycled" value="1,680 kg" subtitle="Recorded recyclable waste" icon={Recycle} color="blue" />
        <StatCard title="Completion rate" value="92%" subtitle="Illustrative metric" icon={ClipboardCheck} color="purple" />
        <StatCard title="Performance" value="+8.2%" subtitle="Sample comparison" icon={TrendingUp} color="amber" />
      </div>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">Monthly waste collection</h2>
        <p className="mt-1 text-sm text-gray-500">Collected and recycled quantities in kilograms</p>

        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyWaste} barGap={8}>
              <CartesianGrid stroke="#edf0ed" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="collected" name="Collected (kg)" fill="#059669" radius={[5, 5, 0, 0]} />
              <Bar dataKey="recycled" name="Recycled (kg)" fill="#60a5fa" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">Category breakdown</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {wasteDistribution.map((item) => (
            <div key={item.name}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-500">{item.value}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: item.fill,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}