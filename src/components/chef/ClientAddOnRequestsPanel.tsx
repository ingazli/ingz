"use client";

import { useMemo, useState } from "react";

type RequestItem = {
  id: string;
  recipeName: string;
  addOnType: string | null;
  requestedAt: string;
};

const ADD_ON_TYPE_LABEL: Record<string, string> = {
  JAM: "Jam",
  PICKLE: "Pickle",
  SAUCE: "Sauce",
  SPREAD: "Spread",
  CONDIMENT: "Condiment",
  FERMENT: "Ferment",
  DRINK: "Drink",
  DESSERT_SNACK: "Dessert / Snack",
  PANTRY_STAPLE: "Pantry Staple",
  OTHER: "Other",
};

export default function ClientAddOnRequestsPanel({
  initialRequests,
}: {
  initialRequests: RequestItem[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [messageById, setMessageById] = useState<Record<string, string>>({});
  const [statusById, setStatusById] = useState<Record<string, "idle" | "saving" | "error">>({});

  const count = requests.length;
  const hasRequests = count > 0;

  const sorted = useMemo(
    () => [...requests].sort((a, b) => +new Date(b.requestedAt) - +new Date(a.requestedAt)),
    [requests]
  );

  async function markPrepared(selectionId: string) {
    setStatusById((prev) => ({ ...prev, [selectionId]: "saving" }));

    const res = await fetch(`/api/chef/client-add-ons/${selectionId}/prepare`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messageById[selectionId] ?? "" }),
    });

    if (!res.ok) {
      setStatusById((prev) => ({ ...prev, [selectionId]: "error" }));
      return;
    }

    setRequests((prev) => prev.filter((req) => req.id !== selectionId));
    setStatusById((prev) => ({ ...prev, [selectionId]: "idle" }));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h2 className="font-semibold text-[#3b2a1a] mb-1">Client Add-On Requests</h2>
      <p className="text-xs text-gray-500 mb-3">{count} active request{count === 1 ? "" : "s"}</p>

      {!hasRequests ? (
        <p className="text-sm text-gray-500">No active add-on requests for this client.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((selection) => {
            const state = statusById[selection.id] ?? "idle";
            return (
              <div key={selection.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#3b2a1a]">{selection.recipeName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {ADD_ON_TYPE_LABEL[selection.addOnType ?? "OTHER"] ?? selection.addOnType ?? "Other"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={state === "saving"}
                    onClick={() => markPrepared(selection.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                      state === "saving"
                        ? "bg-gray-100 border-gray-200 text-gray-400"
                        : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {state === "saving" ? "Sending..." : "Prepared!"}
                  </button>
                </div>

                <input
                  value={messageById[selection.id] ?? ""}
                  onChange={(e) => setMessageById((prev) => ({ ...prev, [selection.id]: e.target.value }))}
                  placeholder="Optional note to client (defaults to Prepared!)"
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
                />

                {state === "error" && (
                  <p className="text-xs text-red-600 mt-2">Could not send prepared update. Please try again.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
