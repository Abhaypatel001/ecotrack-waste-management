import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "No records found",
  description = "Try changing your search or filters.",
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="rounded-2xl bg-gray-100 p-4 text-gray-500">
        <Inbox size={28} />
      </div>
      <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
    </div>
  );
}