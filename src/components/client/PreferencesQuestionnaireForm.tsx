"use client";

import { useMemo, useState } from "react";
import {
  CUISINES,
  DEFAULT_CUISINE_RATINGS,
  createDefaultPerson,
  PORTION_SIZE_OPTIONS,
  isQuestionnaireComplete,
  type PersonQuestionnaire,
  type QuestionnaireData,
} from "@/lib/client-questionnaire";

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

  const isIncomplete = useMemo(() => !isQuestionnaireComplete(form), [form]);

  function updateMember(index: number, update: Partial<PersonQuestionnaire>) {
    setForm((prev) => ({
      ...prev,
      household: prev.household.map((member, i) => (i === index ? { ...member, ...update } : member)),
    }));
  }

  function setCuisineRating(index: number, cuisine: string, rating: number) {
    setForm((prev) => ({
      ...prev,
      household: prev.household.map((member, i) =>
        i === index
          ? {
              ...member,
              cuisineRatings: { ...member.cuisineRatings, [cuisine]: rating },
            }
          : member
      ),
    }));
  }

  function toggleTryAnything(index: number, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      household: prev.household.map((member, i) =>
        i === index
          ? {
              ...member,
              tryAnything: checked,
              cuisineRatings: checked ? { ...DEFAULT_CUISINE_RATINGS } : member.cuisineRatings,
            }
          : member
      ),
    }));
  }

  function toggleAllergy(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      household: prev.household.map((member, i) => {
        if (i !== index) return member;
        const exists = member.allergies.includes(value);
        return {
          ...member,
          allergies: exists ? member.allergies.filter((a) => a !== value) : [...member.allergies, value],
        };
      }),
    }));
  }

  function addMember() {
    setForm((prev) => ({
      ...prev,
      household: [...prev.household, createDefaultPerson()],
    }));
  }

  function removeMember(index: number) {
    setForm((prev) => {
      if (prev.household.length <= 1) return prev;
      return {
        ...prev,
        household: prev.household.filter((_, i) => i !== index),
      };
    });
  }

  function getCuisineRatingLabel(member: PersonQuestionnaire, cuisine: string) {
    return LIKERT_LABELS[member.cuisineRatings[cuisine]] ?? "Not rated";
  }

  function renderCuisineRatings(member: PersonQuestionnaire, index: number) {
    return (
      <div className="space-y-4">
        {CUISINES.map((cuisine) => (
          <div key={`${index}-${cuisine}`} className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-gray-800">{cuisine}</p>
              <span className="text-xs font-medium text-[#7c5c3a] bg-[#faf5ef] border border-[#eadfce] rounded-full px-2 py-0.5">
                {getCuisineRatingLabel(member, cuisine)}
              </span>
            </div>
            <div>
              <input
                id={`cuisine-${index}-${cuisine}`}
                type="range"
                min={1}
                max={5}
                step={1}
                value={member.cuisineRatings[cuisine] || 1}
                onChange={(e) => setCuisineRating(index, cuisine, Number(e.target.value))}
                disabled={member.tryAnything}
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
    );
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
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[#3b2a1a] mb-2">Household Members</h2>
            <p className="text-sm text-gray-600">
              Add each person in your household and complete their questionnaire separately.
            </p>
          </div>
          <button
            type="button"
            onClick={addMember}
            className="rounded-lg border border-[#c9a97a] px-3 py-2 text-sm text-[#3b2a1a] hover:bg-[#faf5ef]"
          >
            + Add person
          </button>
        </div>
      </section>

      {form.household.map((member, index) => (
        <section key={`member-${index}`} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[#3b2a1a]">Person {index + 1}</h2>
            {form.household.length > 1 && (
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              value={member.personName}
              onChange={(e) => updateMember(index, { personName: e.target.value })}
              placeholder="Enter name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Portion size *</label>
            <select
              value={member.portionSize}
              onChange={(e) => updateMember(index, { portionSize: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            >
              {PORTION_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-[#3b2a1a] mb-2">Cuisine Preferences</h3>
            <p className="text-sm text-gray-600 mb-4">
              Rate each cuisine from Hate to Favorite so your chef can tailor menus for {member.personName || "this person"}.
            </p>

            <label className="inline-flex items-center gap-2 mb-4 rounded-lg border border-[#eadfce] bg-[#faf5ef] px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={member.tryAnything}
                onChange={(e) => toggleTryAnything(index, e.target.checked)}
                className="h-4 w-4 accent-[#3b2a1a]"
              />
              <span className="text-sm text-[#3b2a1a] font-medium">This person will try anything</span>
            </label>

            {member.tryAnything && (
              <p className="text-xs text-gray-600 mb-4">
                Cuisine ratings are set high by default. Uncheck this to customize each cuisine manually.
              </p>
            )}

            {member.tryAnything ? (
              <details className="rounded-lg border border-[#eadfce] bg-[#faf5ef] px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-[#3b2a1a]">
                  Regional cuisine ratings are collapsed while this is selected
                </summary>
                <div className="mt-4">{renderCuisineRatings(member, index)}</div>
              </details>
            ) : (
              renderCuisineRatings(member, index)
            )}
          </div>

          <div>
            <h3 className="text-[#3b2a1a] mb-2">Spiciness Preference</h3>
            <p className="text-sm text-gray-600 mb-4">Choose from No spice to Flaming.</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SPICE.map((option) => (
                <label
                  key={`spice-${index}-${option.value}`}
                  className={`text-xs sm:text-sm border rounded-md px-2 py-2 text-center cursor-pointer transition-colors ${
                    member.spiceLevel === option.value
                      ? "bg-[#3b2a1a] text-white border-[#3b2a1a]"
                      : "border-gray-300 text-gray-700 hover:border-[#c9a97a]"
                  }`}
                >
                  <input
                    type="radio"
                    name={`spiceLevel-${index}`}
                    className="sr-only"
                    checked={member.spiceLevel === option.value}
                    onChange={() => updateMember(index, { spiceLevel: option.value })}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[#3b2a1a] mb-2">Allergies</h3>
            <p className="text-sm text-gray-600 mb-4">Select allergies and add others if needed.</p>

            <div className="grid sm:grid-cols-3 gap-2 mb-4">
              {ALLERGY_OPTIONS.map((allergy) => (
                <label
                  key={`${index}-${allergy}`}
                  className={`text-sm border rounded-md px-3 py-2 cursor-pointer transition-colors ${
                    member.allergies.includes(allergy)
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "border-gray-300 text-gray-700 hover:border-[#c9a97a]"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={member.allergies.includes(allergy)}
                    onChange={() => toggleAllergy(index, allergy)}
                  />
                  {allergy}
                </label>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Other allergies (optional)</label>
            <input
              value={member.otherAllergies}
              onChange={(e) => updateMember(index, { otherAllergies: e.target.value })}
              placeholder="e.g. mustard, celery"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>

          <div>
            <h3 className="text-[#3b2a1a] mb-2">Foods They Love and Avoid</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Favorite foods</label>
                <textarea
                  rows={5}
                  value={member.favoriteFoods}
                  onChange={(e) => updateMember(index, { favoriteFoods: e.target.value })}
                  placeholder="e.g. salmon, lentil soup, roast chicken"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foods they will not eat</label>
                <textarea
                  rows={5}
                  value={member.avoidFoods}
                  onChange={(e) => updateMember(index, { avoidFoods: e.target.value })}
                  placeholder="e.g. mushrooms, olives, cilantro"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
                />
              </div>
            </div>
          </div>
        </section>
      ))}

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
          disabled={status === "saving" || isIncomplete}
          className="bg-[#3b2a1a] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#2e1f0f] disabled:opacity-60"
        >
          {status === "saving" ? "Saving..." : "Save Questionnaire"}
        </button>
        {isIncomplete && (
          <span className="text-xs text-amber-700">
            Please complete each person&apos;s name, cuisine ratings, and spice level.
          </span>
        )}
      </div>
    </form>
  );
}
