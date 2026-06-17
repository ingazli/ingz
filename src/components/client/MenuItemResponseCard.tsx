"use client";
import { useState } from "react";

type Ingredient = { id: string; name: string; quantity: string | null; unit: string | null };
type Recipe = { id: string; name: string; description: string | null; prepTime: number | null; cookTime: number | null; servings: number | null; mealType: string; ingredients: Ingredient[] };
type Feedback = { rating: number; comment: string | null; favorited: boolean } | null;
type Item = { id: string; recipe: Recipe; mealType: string; approved: boolean | null; clientNote: string | null; feedback: Feedback };

export default function MenuItemResponseCard({ item }: { item: Item }) {
  const [approved, setApproved] = useState<boolean | null>(item.approved);
  const [note, setNote] = useState(item.clientNote ?? "");
  const [showNote, setShowNote] = useState(!!item.clientNote);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveResponse(newApproved: boolean | null, newNote: string) {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/client/menu-item/${item.id}/respond`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: newApproved, clientNote: newNote || null }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleApprove(val: boolean | null) {
    setApproved(val);
    saveResponse(val, note);
  }

  const mealLabel: Record<string, string> = {
    BREAKFAST: "Breakfast",
    LUNCH: "Lunch",
    DINNER: "Dinner",
    SNACK: "Snack",
    SIDE_DISH: "Side Dish",
    SALAD: "Salad",
    SOUP: "Soup",
    PASTA: "Pasta",
    BOWL: "Bowl",
    SANDWICH: "Sandwich",
    TACO: "Taco",
    CURRY: "Curry",
    CASSEROLE: "Casserole",
    STIR_FRY: "Stir Fry",
    ROAST: "Roast",
    SEAFOOD: "Seafood",
    DESSERT: "Dessert",
    DRINK_ALCOHOLIC: "Drink (Alcoholic)",
    DRINK_NON_ALCOHOLIC: "Drink (Non-Alcoholic)",
  };

  const borderColor =
    approved === true
      ? "border-green-400"
      : approved === false
      ? "border-red-300"
      : "border-gray-200";

  return (
    <div className={`bg-white rounded-xl border-2 ${borderColor} p-5 flex flex-col gap-3 transition-colors`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs uppercase tracking-wide text-gray-400 font-medium">
            {mealLabel[item.mealType] ?? item.mealType}
          </span>
          <h3 className="font-semibold text-[#3b2a1a] text-base leading-tight mt-0.5">
            {item.recipe.name}
          </h3>
        </div>
        {saved && <span className="text-xs text-green-600 font-medium shrink-0">Saved ✓</span>}
        {saving && <span className="text-xs text-gray-400 shrink-0">Saving…</span>}
      </div>

      {/* Description */}
      {item.recipe.description && (
        <p className="text-sm text-gray-600">{item.recipe.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {item.recipe.prepTime && <span>Prep: {item.recipe.prepTime} min</span>}
        {item.recipe.cookTime && <span>Cook: {item.recipe.cookTime} min</span>}
        {item.recipe.servings && <span>Serves: {item.recipe.servings}</span>}
      </div>

      {/* Ingredients toggle */}
      <details className="text-xs">
        <summary className="cursor-pointer text-[#7c5c3a] font-medium">View Ingredients</summary>
        <ul className="mt-2 pl-3 space-y-0.5 text-gray-600">
          {item.recipe.ingredients.map((ing) => (
            <li key={ing.id}>
              {ing.quantity} {ing.unit} {ing.name}
            </li>
          ))}
        </ul>
      </details>

      {/* Approve / Decline */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => handleApprove(approved === true ? null : true)}
          className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors ${
            approved === true
              ? "bg-green-500 text-white"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          ✓ Approve
        </button>
        <button
          onClick={() => handleApprove(approved === false ? null : false)}
          className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors ${
            approved === false
              ? "bg-red-500 text-white"
              : "bg-red-50 text-red-700 hover:bg-red-100"
          }`}
        >
          ✗ Decline
        </button>
      </div>

      {/* Note */}
      {!showNote ? (
        <button
          onClick={() => setShowNote(true)}
          className="text-xs text-[#7c5c3a] hover:underline text-left"
        >
          + Add modification note
        </button>
      ) : (
        <div>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => saveResponse(approved, note)}
            placeholder="E.g. no onions, extra spicy, gluten-free substitute..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#c9a97a]"
          />
        </div>
      )}

      {/* Previous feedback indicator */}
      {item.feedback && (
        <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
          <span>{"⭐".repeat(item.feedback.rating)}</span>
          {item.feedback.favorited && <span className="ml-1 text-red-500">♥ Favorited</span>}
        </div>
      )}
    </div>
  );
}
