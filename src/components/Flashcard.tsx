import { useState } from "react";
import { type Flashcard as FlashcardType } from "../types";

function minutesToMs(n: number) {
  return n * 60 * 1000;
}

function daysToMs(n: number) {
  return n * 24 * 60 * 60 * 1000;
}

export default function Flashcard({
  card,
  onUpdate,
  demoMode = true,
}: {
  card: FlashcardType;
  onUpdate: (c: FlashcardType) => void;
  demoMode?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  function rateCard(score: 0 | 1 | 2 | 3) {
    // score: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
    const now = Date.now();

    let interval = card.interval;
    let ease = card.ease;
    if (score === 0) {
      interval = demoMode ? 1 : 1; // 1 minute / 1 day
      ease = Math.max(1.3, ease - 0.2);
      card.lapses += 1;
    } else if (score === 1) {
      // Hard — small increase
      interval = Math.max(1, Math.round(interval * 1.2));
      ease = Math.max(1.3, ease - 0.05);
    } else if (score === 2) {
      // Good
      interval = Math.max(1, Math.round(interval * 2));
    } else {
      // Easy
      interval = Math.max(1, Math.round(interval * 2.5));
      ease += 0.15;
    }

    const next = now + (demoMode ? minutesToMs(interval) : daysToMs(interval));

    const updated: FlashcardType = {
      ...card,
      lastReviewed: now,
      interval,
      ease,
      nextReview: next,
    };

    onUpdate(updated);
    setFlipped(false);
  }

  return (
    <article className="flashcard">
      <div className="q">{card.question}</div>
      {!flipped ? (
        <div className="actions">
          <button onClick={() => setFlipped(true)}>Reveal answer</button>
          <p className="small muted">
            Next: {new Date(card.nextReview ?? card.created).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="a">
          <div className="answer">{card.answer}</div>
          <div className="rating">
            <button onClick={() => rateCard(0)} className="danger">
              Again
            </button>
            <button onClick={() => rateCard(1)}>Hard</button>
            <button onClick={() => rateCard(2)}>Good</button>
            <button onClick={() => rateCard(3)} className="positive">
              Easy
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
