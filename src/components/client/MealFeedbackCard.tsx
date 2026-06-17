"use client";
import { useState } from "react";
import { format } from "date-fns";

type Recipe = { id: string; name: string; description: string | null };
type Feedback = { id: string; rating: number; comment: string | null; favorited: boolean } | null;
type Item = { id: string; recipe: Recipe; feedback: Feedback; menu: { weekStart: Date | string } };

export default function MealFeedbackCard({ item }: { item: Item }) {
  const [feedback, setFeedback] = useState<Feedback>(item.feedback);
  const [rating, setRating] = useState(item.feedback?.rating ?? 0);
  const [comment, setComment] = useState(item.feedback?.comment ?? "");
  const [favorited, setFavorited] = useState(item.feedback?.favorited ?? false);
  const [saving, setSaving] = useState(false);

  async function save(updates: { rating?: number; comment?: string; favorited?: boolean }) {
    setSaving(true);
    const body = {
      rating: updates.rating ?? rating,
      comment: updates.comment !== undefined ? updates.comment : comment,
      favorited: updates.favorited !== undefined ? updates.favorited : favorited,
      menuItemId: item.id,
      recipeId: item.recipe.id,
    };
    const res = await fetch("/api/client/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setFeedback(data);
    setSaving(false);
  }

  function handleStarClick(star: number) {
    setRating(star);
    save({ rating: star });
  }

  function toggleFavorite() {
    const next = !favorited;
    setFavorited(next);
    save({ favorited: next });
  }

  const weekDate = new Date(item.menu.weekStart);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-[#3b2a1a]">{item.recipe.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Week of {format(weekDate, "MMM d, yyyy")}
          </p>
        </div>
        <button
          onClick={toggleFavorite}
          className={`text-2xl transition-colors ${favorited ? "text-red-500" : "text-gray-300 hover:text-red-300"}`}
          title={favorited ? "Remove from favorites" : "Add to favorites"}
        >
          ♥
        </button>
      </div>

      {item.recipe.description && (
        <p className="text-sm text-gray-600">{item.recipe.description}</p>
      )}

      {/* Star Rating */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Your rating:</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              className={`text-2xl transition-colors ${
                star <= rating ? "text-amber-400" : "text-gray-200 hover:text-amber-200"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={() => rating > 0 && save({ comment })}
          placeholder={rating > 0 ? "Leave a comment (optional)…" : "Rate this meal first to leave feedback"}
          disabled={rating === 0}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#c9a97a] disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      {saving && <p className="text-xs text-gray-400">Saving…</p>}
      {!saving && feedback && <p className="text-xs text-green-600">Feedback saved ✓</p>}
    </div>
  );
}
