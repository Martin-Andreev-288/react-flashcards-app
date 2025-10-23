import React, { useMemo, useState } from "react";
import "./index.css";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { type Flashcard as FlashcardType } from "./types.ts";
import Flashcard from "./components/Flashcard";
import AddCardForm from "./components/AddCardForm.tsx";
import { uid } from "./utils.ts";

const DEMO_MODE = true; // set to false to switch intervals to days instead of minutes

export default function App(): JSX.Element {
  const [cards, setCards] = useLocalStorage<FlashcardType[]>(
    "flashcards_v1",
    []
  );
  const [mode, setMode] = useState<"review" | "browse" | "add">("review");
  const now = Date.now();

  // produce due cards
  const due = useMemo(() => {
    return cards
      .filter((c) => (c.nextReview ?? 0) <= now)
      .sort((a, b) => (a.nextReview ?? 0) - (b.nextReview ?? 0));
  }, [cards, now]);

  function addCard(question: string, answer: string) {
    const baseInterval = DEMO_MODE ? 1 : 1; // minutes or days
    const created = Date.now();
    const card: FlashcardType = {
      id: uid(),
      question,
      answer,
      created,
      lastReviewed: null,
      interval: baseInterval,
      ease: 2.5,
      lapses: 0,
      nextReview: created,
    };
    setCards([card, ...cards]);
    setMode("review");
  }

  function updateCard(updated: FlashcardType) {
    setCards((s) => s.map((c) => (c.id === updated.id ? updated : c)));
  }

  function resetAll() {
    if (!confirm("Reset all cards? This cannot be undone.")) return;
    setCards([]);
  }

  return (
    <div className="app-root">
      <header className="topbar">
        <h1>Flashcards — Spaced Repetition</h1>
        <div className="controls">
          <button
            onClick={() => setMode("review")}
            className={mode === "review" ? "active" : undefined}
          >
            Review
          </button>
          <button
            onClick={() => setMode("browse")}
            className={mode === "browse" ? "active" : undefined}
          >
            Browse
          </button>
          <button
            onClick={() => setMode("add")}
            className={mode === "add" ? "active" : undefined}
          >
            Add
          </button>
          <button onClick={resetAll} className="danger">
            Reset
          </button>
        </div>
      </header>

      <main className="content">
        <aside className="sidebar">
          <section>
            <h3>Stats</h3>
            <p>
              Total: <strong>{cards.length}</strong>
            </p>
            <p>
              Due now: <strong>{due.length}</strong>
            </p>
            <p>
              Demo mode: <strong>{DEMO_MODE ? "minutes" : "days"}</strong>
            </p>
          </section>
          <section>
            <h3>Quick tips</h3>
            <ul>
              <li>Answer → reveal → rate (Again / Hard / Good / Easy)</li>
              <li>Use demo mode for quick testing (intervals in minutes)</li>
              <li>Reset clears localStorage</li>
            </ul>
          </section>
        </aside>

        <section className="main-area">
          {mode === "review" && (
            <div>
              {due.length === 0 ? (
                <div className="empty">No cards due — try adding some!</div>
              ) : (
                <div className="review-list">
                  {due.map((c) => (
                    <Flashcard
                      key={c.id}
                      card={c}
                      onUpdate={updateCard}
                      demoMode={DEMO_MODE}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === "browse" && (
            <div className="browse">
              {cards.length === 0 ? (
                <div className="empty">No cards yet. Add your first card.</div>
              ) : (
                <div className="grid">
                  {cards.map((c) => (
                    <div className="card-browse" key={c.id}>
                      <h4>{c.question}</h4>
                      <p className="small">
                        Next:{" "}
                        {new Date(c.nextReview ?? c.created).toLocaleString()}
                      </p>
                      <details>
                        <summary>Answer</summary>
                        <p>{c.answer}</p>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === "add" && (
            <div className="add">
              <AddCardForm onAdd={addCard} />
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        Built with ❤️ — good interview talking points: hooks, custom hook,
        localStorage, simple spaced repetition algorithm, TypeScript types.
      </footer>
    </div>
  );
}
