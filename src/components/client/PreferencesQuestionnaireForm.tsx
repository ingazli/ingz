"use client";

import { useMemo, useState } from "react";

type QuestionnaireData = {
  cuisineRatings: Record<string, number>;
  spiceLevel: number;
  allergies: string[];
  otherAllergies: string;
  favoriteFoods: string;
  avoidFoods: string;
};

const CUISINES = [
  "American Southern",
  "Mediterranean",
  "Italian",
  "French",
  "Mexican",
  "Japanese",
  "Chinese",
  "Thai",
  "Indian",
  "Middle Eastern",
  "Korean",
  "Caribbean",
  "Vietnamese",
  "Ethiopian",
];

const ALLERGY_OPTIONS = [
  "Peanuts",
  "Tree nuts",
  "Dairy",
  "Eggs",
  "Soy",
  "Wheat/Gluten",
  "Shellfish",
  "Fish",
  "Sesame",
];

const LIKERT_LABELS: Record<number, string> = {
  1: "Hate",
  2: "Dislike",
  3: "Neutral",
  4: "Like",
  5: "Favorite",
};

const SPICE = [
  { value: 1, label: "No spice" },
  { value: 2, label: "Mild" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Hot" },
  { value: 5, label: "Flaming" },
];

type Props = {
  initialData: QuestionnaireData;
};

export default function PreferencesQuestionnaireForm({ initialData }: Props) {
  const [form, setForm] = useState<QuestionnaireData>(initialData);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const missingCuisineRatings = useMemo(
    () => CUISINES.some((cuisine) => !form.cuisineRatings[cuisine]),
    [form.cuisineRatings]
  );

  function setCuisineRating(cuisine: string, rating: number) {
    setForm((prev) => ({
      ...prev,
      cuisineRatings: { ...prev.cuisineRatings, [cuisine]: rating },
    }));
  }

  function getCuisineRatingLabel(cuisine: string) {
    return LIKERT_LABELS[form.cuisineRatings[cuisine]] ?? "Not rated";
  }

  function toggleAllergy(value: string) {
    setForm((prev) => {
      const exists = prev.allergies.includes(value);
      return {
        ...prev,
        allergies: exists ? prev.allergies.filter((a) => a !== value) : [...prev.allergies, value],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    try {
      const res = await fetch("/api/client/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save");
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-[#3b2a1a] mb-2">Cuisine Preferences</h2>
        <p className="text-sm text-gray-600 mb-4">
          Rate each cuisine from Hate to Favorite so your chef can tailor your menus.
        </p>

        <div className="space-y-4">
          {CUISINES.map((cuisine) => (
            <div key={cuisine} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-gray-800">{cuisine}</p>
                <span className="text-xs font-medium text-[#7c5c3a] bg-[#faf5ef] border border-[#eadfce] rounded-full px-2 py-0.5">
                  {getCuisineRatingLabel(cuisine)}
                </span>
              </div>
              <div>
                <input
                  id={`cuisine-${cuisine}`}
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={form.cuisineRatings[cuisine] || 1}
                  onChange={(e) => setCuisineRating(cuisine, Number(e.target.value))}
                  className="w-full accent-[#3b2a1a]"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Hate</span>
                  <span>Favorite</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-[#3b2a1a] mb-2">Spiciness Preference</h2>
        <p className="text-sm text-gray-600 mb-4">Choose your preferred spice level from No spice to Flaming.</p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SPICE.map((option) => (
            <label
              key={`spice-${option.value}`}
              className={`text-xs sm:text-sm border rounded-md px-2 py-2 text-center cursor-pointer transition-colors ${
                form.spiceLevel === option.value
                  ? "bg-[#3b2a1a] text-white border-[#3b2a1a]"
                  : "border-gray-300 text-gray-700 hover:border-[#c9a97a]"
              }`}
            >
              <input
                type="radio"
                name="spiceLevel"
                className="sr-only"
                checked={form.spiceLevel === option.value}
                onChange={() => setForm((prev) => ({ ...prev, spiceLevel: option.value }))}
              />
              {option.label}
            </label>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-[#3b2a1a] mb-2">Allergies</h2>
        <p className="text-sm text-gray-600 mb-4">Select any food allergies and add others if needed.</p>

        <div className="grid sm:grid-cols-3 gap-2 mb-4">
          {ALLERGY_OPTIONS.map((allergy) => (
            <label
              key={allergy}
              className={`text-sm border rounded-md px-3 py-2 cursor-pointer transition-colors ${
                form.allergies.includes(allergy)
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "border-gray-300 text-gray-700 hover:border-[#c9a97a]"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={form.allergies.includes(allergy)}
                onChange={() => toggleAllergy(allergy)}
              />
              {allergy}
            </label>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">Other allergies (optional)</label>
        <input
          value={form.otherAllergies}
          onChange={(e) => setForm((prev) => ({ ...prev, otherAllergies: e.target.value }))}
          placeholder="e.g. mustard, celery"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
        />
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-[#3b2a1a] mb-2">Foods You Love and Avoid</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Favorite foods</label>
            <textarea
              rows={5}
              value={form.favoriteFoods}
              onChange={(e) => setForm((prev) => ({ ...prev, favoriteFoods: e.target.value }))}
              placeholder="e.g. salmon, lentil soup, roast chicken"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foods you will not eat</label>
            <textarea
              rows={5}
              value={form.avoidFoods}
              onChange={(e) => setForm((prev) => ({ ...prev, avoidFoods: e.target.value }))}
              placeholder="e.g. mushrooms, olives, cilantro"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>
        </div>
      </section>

      {status === "error" && (
        <p className="text-sm text-red-600">We could not save your questionnaire. Please try again.</p>
      )}

      {status === "saved" && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Questionnaire saved. Your chef can now use these preferences when planning menus.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving" || missingCuisineRatings || !form.spiceLevel}
          className="bg-[#3b2a1a] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#2e1f0f] disabled:opacity-60"
        >
          {status === "saving" ? "Saving..." : "Save Questionnaire"}
        </button>
        {(missingCuisineRatings || !form.spiceLevel) && (
          <span className="text-xs text-amber-700">Please rate every cuisine and select a spice level.</span>
        )}
      </div>
    </form>
  );
}
