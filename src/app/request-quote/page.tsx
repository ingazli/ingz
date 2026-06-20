"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  peopleCount: "1",
  mealsPerDay: "",
  additionalInfo: "",
};

type PersonQuestionnaire = {
  personName: string;
  portionSize: string;
  allergies: string;
  dislikes: string;
  favorites: string;
};

const PORTION_SIZE_OPTIONS = [
  "Kid-sized",
  "Small",
  "Standard",
  "Large",
  "Extra large",
];

function blankPersonQuestionnaire(): PersonQuestionnaire {
  return {
    personName: "",
    portionSize: "",
    allergies: "",
    dislikes: "",
    favorites: "",
  };
}

export default function RequestQuotePage() {
  const [form, setForm] = useState(initialForm);
  const [householdQuestionnaire, setHouseholdQuestionnaire] = useState<PersonQuestionnaire[]>([blankPersonQuestionnaire()]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const count = Math.max(1, Number(form.peopleCount) || 1);
    setHouseholdQuestionnaire((prev) => {
      if (count === prev.length) return prev;
      if (count < prev.length) return prev.slice(0, count);
      return [...prev, ...Array.from({ length: count - prev.length }, blankPersonQuestionnaire)];
    });
  }, [form.peopleCount]);

  function updatePersonQuestionnaire(index: number, field: keyof PersonQuestionnaire, value: string) {
    setHouseholdQuestionnaire((prev) => {
      const next = [...prev];
      const existing = next[index] ?? blankPersonQuestionnaire();
      next[index] = { ...existing, [field]: value };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          householdQuestionnaire,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error || "Failed to send request");
      }

      setStatus("success");
      setForm(initialForm);
      setHouseholdQuestionnaire([blankPersonQuestionnaire()]);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <main
      className="min-h-screen text-[#1f2f1a] flex flex-col items-center px-4 py-12"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, #c3cbbe 0 5rem, #9eb296 5rem 10rem)",
      }}
    >
      <div className="w-full max-w-5xl">
        <div className="mb-10 flex flex-col gap-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-[#6b754f]">Quote Request</p>
          <h2 className="text-xs sm:text-sm font-playfair font-semibold leading-normal">
            Tell me about your culinary needs so I can build the right meal plan.
          </h2>
          <p className="mx-auto max-w-3xl text-base leading-8 text-[#4c5b45]">
            Share your ideal meal count and household preferences. This gives me enough detail to build a personalized quote.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/"
              className="rounded-full border border-[#6b755f] bg-white px-5 py-3 text-sm font-semibold text-[#4c5b45] transition hover:bg-[#f0efe9]"
            >
              Back to Home
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[#5f7a53] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#516946]"
            >
              Client Login
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 rounded-[2rem] border border-[#d7d0c4] bg-white/90 p-8 shadow-lg backdrop-blur-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-[#3c4b35]">Full Name *</span>
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2] px-4 py-3 text-sm text-[#2e3a28] focus:border-[#5f7a53] focus:outline-none focus:ring-2 focus:ring-[#dbe4d4]"
                placeholder="Jane Doe"
              />
            </label>
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-[#3c4b35]">Email *</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2] px-4 py-3 text-sm text-[#2e3a28] focus:border-[#5f7a53] focus:outline-none focus:ring-2 focus:ring-[#dbe4d4]"
                placeholder="jane@example.com"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-[#3c4b35]">Phone</span>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2] px-4 py-3 text-sm text-[#2e3a28] focus:border-[#5f7a53] focus:outline-none focus:ring-2 focus:ring-[#dbe4d4]"
                placeholder="(555) 123-4567"
              />
            </label>
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-[#3c4b35]">How many people are you cooking for? *</span>
              <input
                type="number"
                min={1}
                name="peopleCount"
                value={form.peopleCount}
                onChange={(e) => setForm({ ...form, peopleCount: e.target.value })}
                required
                className="w-full rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2] px-4 py-3 text-sm text-[#2e3a28] focus:border-[#5f7a53] focus:outline-none focus:ring-2 focus:ring-[#dbe4d4]"
                placeholder="1"
              />
            </label>
          </div>

          <div className="grid gap-6">
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-[#3c4b35]">Meals per day *</span>
              <input
                type="number"
                min={1}
                name="mealsPerDay"
                value={form.mealsPerDay}
                onChange={(e) => setForm({ ...form, mealsPerDay: e.target.value })}
                required
                className="w-full rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2] px-4 py-3 text-sm text-[#2e3a28] focus:border-[#5f7a53] focus:outline-none focus:ring-2 focus:ring-[#dbe4d4]"
                placeholder="3"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2]/70 p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-[#3c4b35]">Household Questionnaire *</p>
              <p className="text-xs text-[#5f6f58] mt-1">Complete this for each person at the bottom of the form.</p>
            </div>

            {householdQuestionnaire.length === 0 ? (
              <p className="text-sm text-[#5f6f58]">Enter how many people you are cooking for to unlock the questionnaire.</p>
            ) : (
              <div className="space-y-4">
                {householdQuestionnaire.map((person, index) => (
                  <div key={`person-${index + 1}`} className="rounded-2xl border border-[#d7d0c4] bg-white/80 p-4 space-y-3">
                    <label className="space-y-1 block">
                      <span className="block text-sm font-medium text-[#3c4b35]">Person {index + 1} name *</span>
                      <input
                        required
                        value={person.personName}
                        onChange={(e) => updatePersonQuestionnaire(index, "personName", e.target.value)}
                        className="w-full rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2] px-4 py-3 text-sm text-[#2e3a28] focus:border-[#5f7a53] focus:outline-none focus:ring-2 focus:ring-[#dbe4d4]"
                        placeholder={`Person ${index + 1} name`}
                      />
                    </label>

                    <p className="text-sm font-semibold text-[#3c4b35]">{person.personName.trim() || `Person ${index + 1}`}</p>

                    <label className="space-y-1 block">
                      <span className="block text-sm font-medium text-[#3c4b35]">Portion size *</span>
                      <select
                        required
                        value={person.portionSize}
                        onChange={(e) => updatePersonQuestionnaire(index, "portionSize", e.target.value)}
                        className="w-full rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2] px-4 py-3 text-sm text-[#2e3a28] focus:border-[#5f7a53] focus:outline-none focus:ring-2 focus:ring-[#dbe4d4]"
                      >
                        <option value="">Select an option</option>
                        {PORTION_SIZE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 block">
                      <span className="block text-sm font-medium text-[#3c4b35]">Food allergies *</span>
                      <textarea
                        required
                        rows={2}
                        value={person.allergies}
                        onChange={(e) => updatePersonQuestionnaire(index, "allergies", e.target.value)}
                        className="w-full rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2] px-4 py-3 text-sm text-[#2e3a28] focus:border-[#5f7a53] focus:outline-none focus:ring-2 focus:ring-[#dbe4d4]"
                        placeholder="List food allergies or intolerances"
                      />
                    </label>

                    <label className="space-y-1 block">
                      <span className="block text-sm font-medium text-[#3c4b35]">Foods they do not eat *</span>
                      <textarea
                        required
                        rows={3}
                        value={person.dislikes}
                        onChange={(e) => updatePersonQuestionnaire(index, "dislikes", e.target.value)}
                        className="w-full rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2] px-4 py-3 text-sm text-[#2e3a28] focus:border-[#5f7a53] focus:outline-none focus:ring-2 focus:ring-[#dbe4d4] resize-none"
                        placeholder="List foods they avoid or do not eat"
                      />
                    </label>

                    <label className="space-y-1 block">
                      <span className="block text-sm font-medium text-[#3c4b35]">Foods they love *</span>
                      <textarea
                        required
                        rows={3}
                        value={person.favorites}
                        onChange={(e) => updatePersonQuestionnaire(index, "favorites", e.target.value)}
                        className="w-full rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2] px-4 py-3 text-sm text-[#2e3a28] focus:border-[#5f7a53] focus:outline-none focus:ring-2 focus:ring-[#dbe4d4] resize-none"
                        placeholder="List foods they enjoy most"
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-[#3c4b35]">Additional details</span>
            <textarea
              name="additionalInfo"
              rows={5}
              value={form.additionalInfo}
              onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
              className="w-full rounded-2xl border border-[#d7d0c4] bg-[#fbf8f2] px-4 py-3 text-sm text-[#2e3a28] focus:border-[#5f7a53] focus:outline-none focus:ring-2 focus:ring-[#dbe4d4] resize-none"
              placeholder="Anything else we should know about your household, schedule, or preferences."
            />
          </label>

          {status === "error" && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {status === "success" ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-6 text-center text-sm text-green-700">
              Your quote request is on its way. I&apos;ll be in touch soon.
            </div>
          ) : (
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#5f7a53] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#516946] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Sending request..." : "Submit request"}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
