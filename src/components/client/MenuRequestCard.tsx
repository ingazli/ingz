"use client";

import { useState } from "react";
import Link from "next/link";

type FormState = {
  mealsPerDay: string;
  portionsPerMeal: string;
  preferredCuisines: string;
  avoidFoods: string;
  dietaryNeeds: string;
  notes: string;
};

const INITIAL_FORM: FormState = {
  mealsPerDay: "",
  portionsPerMeal: "",
  preferredCuisines: "",
  avoidFoods: "",
  dietaryNeeds: "",
  notes: "",
};

export default function MenuRequestCard() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/client/menu-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus("error");
        setError(payload?.error ?? "Could not send your request. Please try again.");
        return;
      }

      setStatus("success");
      setForm(INITIAL_FORM);
      setShowForm(false);
    } catch {
      setStatus("error");
      setError("Could not send your request. Please try again.");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl mx-auto text-left">
      <h3 className="text-lg font-semibold text-[#3b2a1a]">Need your next menu?</h3>
      <p className="text-sm text-gray-600 mt-1">
        Send your chef a quick request with what you want this week.
      </p>

      {status === "success" && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Your menu request was sent. Your chef will see your preferences for the next menu.
        </div>
      )}

      {!showForm ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="bg-[#3b2a1a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2e1f0f] transition-colors"
          >
            Send Menu Request
          </button>
          <Link
            href="/client/preferences"
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Update Questionnaire
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Meals per day *</label>
              <input
                type="number"
                min="1"
                required
                value={form.mealsPerDay}
                onChange={(e) => updateField("mealsPerDay", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
                placeholder="e.g. 2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Portions per meal *</label>
              <input
                type="number"
                min="1"
                required
                value={form.portionsPerMeal}
                onChange={(e) => updateField("portionsPerMeal", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
                placeholder="e.g. 4"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Preferred cuisines</label>
            <input
              value={form.preferredCuisines}
              onChange={(e) => updateField("preferredCuisines", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
              placeholder="e.g. Mediterranean, Thai, Mexican"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Foods to avoid</label>
            <input
              value={form.avoidFoods}
              onChange={(e) => updateField("avoidFoods", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
              placeholder="e.g. mushrooms, shellfish"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Dietary needs</label>
            <input
              value={form.dietaryNeeds}
              onChange={(e) => updateField("dietaryNeeds", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
              placeholder="e.g. high protein, low carb"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Anything else for this week?</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a97a] resize-none"
              placeholder="Flavor preferences, schedule notes, guests, etc."
            />
          </div>

          {status === "error" && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-[#3b2a1a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2e1f0f] transition-colors disabled:opacity-60"
            >
              {status === "loading" ? "Sending..." : "Send Request"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError("");
                setStatus("idle");
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}