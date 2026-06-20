"use client";

import { useMemo, useState } from "react";
type AddOnItem = {
  id: string;
  name: string;
  addOnType: string;
  tags: string | null;
  selected: boolean;
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

export default function AddOnBrowser({
  initialItems,
}: {
  initialItems: AddOnItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusById, setStatusById] = useState<Record<string, "idle" | "saving" | "error">>({});

  const availableTypes = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.addOnType).filter(Boolean))).sort((a, b) =>
      (ADD_ON_TYPE_LABEL[a] ?? a).localeCompare(ADD_ON_TYPE_LABEL[b] ?? b)
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== "ALL" && item.addOnType !== typeFilter) {
        return false;
      }

      if (!q) {
        return true;
      }

      const haystack = [
        item.name,
        ADD_ON_TYPE_LABEL[item.addOnType] ?? item.addOnType,
        item.tags ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query, typeFilter]);

  const selectedCount = items.filter((item) => item.selected).length;

  async function toggleSelected(itemId: string, selected: boolean) {
    const previous = items;
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, selected } : item))
    );
    setStatusById((current) => ({ ...current, [itemId]: "saving" }));

    const res = await fetch("/api/client/add-ons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: itemId, selected }),
    });

    if (!res.ok) {
      setItems(previous);
      setStatusById((current) => ({ ...current, [itemId]: "error" }));
      return;
    }

    setStatusById((current) => ({ ...current, [itemId]: "idle" }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="font-playfair text-2xl md:text-3xl font-bold text-[#3b2a1a] mb-1">Add-Ons</p>
          <p className="text-gray-500 text-sm">
            Browse optional extras like jams, pickles, sauces, or pantry staples and add them whenever you want.
          </p>
          <p className="text-xs text-gray-500 mt-1">{selectedCount} selected for upcoming menus</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search add-ons"
          className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-56 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
        >
          <option value="ALL">All types</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {ADD_ON_TYPE_LABEL[type] ?? type}
            </option>
          ))}
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
          No add-ons found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const state = statusById[item.id] ?? "idle";

            return (
              <article key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-playfair text-lg font-semibold text-[#3b2a1a] leading-tight">{item.name}</p>
                  <button
                    type="button"
                    disabled={state === "saving"}
                    onClick={() => toggleSelected(item.id, !item.selected)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                      item.selected
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white border-gray-300 text-gray-700 hover:border-[#c9a97a]"
                    } ${state === "saving" ? "opacity-60" : ""}`}
                  >
                    {state === "saving" ? "Saving..." : item.selected ? "Added" : "Add"}
                  </button>
                </div>

                <div className="mt-2">
                  <span className="text-[11px] bg-[#eef6ed] text-[#2f5f3b] border border-[#d9ead5] px-2 py-0.5 rounded-full">
                    {ADD_ON_TYPE_LABEL[item.addOnType] ?? item.addOnType}
                  </span>
                </div>

                {item.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={`${item.id}-${tag}`}
                          className="text-[11px] bg-[#f6f1ea] text-[#7c5c3a] border border-[#eadfce] px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}

                {state === "error" && (
                  <p className="text-xs text-red-600 mt-3">Could not update this item. Please try again.</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
