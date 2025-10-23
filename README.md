# React + TypeScript Flashcards (Spaced Repetition) — Single-file project listing

This document contains the full small app that you can drop into a Vite + React + TypeScript project (the `src/` files).

---

## File: src/App.tsx
```tsx
import React, { useMemo, useState } from "react";
import "./index.css";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { Flashcard as FlashcardType } from "./types";
import Flashcard from "./components/Flashcard";
import AddCardForm from "./components/AddCardForm";
import { uid } from "./utils";

const DEMO_MODE = true; // set to false to switch intervals to days instead of minutes

export default function App(): JSX.Element {
  const [cards, setCards] = useLocalStorage<FlashcardType[]>(
n    "flashcards_v1",
    []
  );
  const [mode, setMode] = useState<"review" | "browse" | "add">("review");
  const now = Date.now();

  // produce due cards
  const due = useMemo(() => {
    return cards.filter((c) => (c.nextReview ?? 0) <= now).sort((a,b)=> (a.nextReview ?? 0) - (b.nextReview ?? 0));
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
          <button onClick={() => setMode("review")} className={mode === "review" ? "active" : undefined}>Review</button>
          <button onClick={() => setMode("browse")} className={mode === "browse" ? "active" : undefined}>Browse</button>
          <button onClick={() => setMode("add")} className={mode === "add" ? "active" : undefined}>Add</button>
          <button onClick={resetAll} className="danger">Reset</button>
        </div>
      </header>

      <main className="content">
        <aside className="sidebar">
          <section>
            <h3>Stats</h3>
            <p>Total: <strong>{cards.length}</strong></p>
            <p>Due now: <strong>{due.length}</strong></p>
            <p>Demo mode: <strong>{DEMO_MODE ? "minutes" : "days"}</strong></p>
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
                    <Flashcard key={c.id} card={c} onUpdate={updateCard} demoMode={DEMO_MODE} />
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
                      <p className="small">Next: {new Date(c.nextReview ?? c.created).toLocaleString()}</p>
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

      <footer className="footer">Built with ❤️ — good interview talking points: hooks, custom hook, localStorage, simple spaced repetition algorithm, TypeScript types.</footer>
    </div>
  );
}
```

---

## File: src/types.ts
```ts
export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  created: number;
  lastReviewed: number | null;
  interval: number; // minutes (if demo) or days
  ease: number; // ease factor
  lapses: number;
  nextReview?: number;
}
```

---

## File: src/hooks/useLocalStorage.ts
```ts
import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T | (() => T)) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
      return typeof initial === "function" ? (initial as any)() : initial;
    } catch (e) {
      console.error("reading localStorage failed", e);
      return typeof initial === "function" ? (initial as any)() : initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error("writing localStorage failed", e);
    }
  }, [key, state]);

  return [state, setState] as const;
}
```

---

## File: src/components/Flashcard.tsx
```tsx
import React, { useState } from "react";
import { Flashcard as FlashcardType } from "../types";

function minutesToMs(n: number) {
  return n * 60 * 1000;
}

function daysToMs(n: number) {
  return n * 24 * 60 * 60 * 1000;
}

export default function Flashcard({ card, onUpdate, demoMode = true }: { card: FlashcardType; onUpdate: (c: FlashcardType) => void; demoMode?: boolean; }) {
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
          <p className="small muted">Next: {new Date(card.nextReview ?? card.created).toLocaleString()}</p>
        </div>
      ) : (
        <div className="a">
          <div className="answer">{card.answer}</div>
          <div className="rating">
            <button onClick={() => rateCard(0)} className="danger">Again</button>
            <button onClick={() => rateCard(1)}>Hard</button>
            <button onClick={() => rateCard(2)}>Good</button>
            <button onClick={() => rateCard(3)} className="positive">Easy</button>
          </div>
        </div>
      )}
    </article>
  );
}
```

---

## File: src/components/AddCardForm.tsx
```tsx
import React, { useState } from "react";

export default function AddCardForm({ onAdd }: { onAdd: (q: string, a: string) => void }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim() || !a.trim()) return alert("Please provide question and answer");
    onAdd(q.trim(), a.trim());
    setQ("");
    setA("");
  }

  return (
    <form className="add-form" onSubmit={submit}>
      <label>
        <div>Question</div>
        <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={3} />
      </label>
      <label>
        <div>Answer</div>
        <textarea value={a} onChange={(e) => setA(e.target.value)} rows={4} />
      </label>
      <div className="form-actions">
        <button type="submit">Add card</button>
      </div>
    </form>
  );
}
```

---

## File: src/utils.ts
```ts
export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
```

---

## File: src/index.css
```css
:root{
  --bg:#f6f7fb; --card:#fff; --muted:#666; --accent:#4f46e5; --danger:#dc2626; --ok:#16a34a;
}
*{box-sizing:border-box}
html,body,#root{height:100%}
body{font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial; margin:0; background:var(--bg); color:#111}
.app-root{display:flex; flex-direction:column; min-height:100vh}
.topbar{display:flex; align-items:center; justify-content:space-between; padding:16px 20px; gap:12px}
.topbar h1{margin:0; font-size:18px}
.topbar .controls button{margin-left:8px}
.controls button{padding:8px 10px; border-radius:6px; border:1px solid rgba(0,0,0,0.06); background:transparent; cursor:pointer}
.controls .active{background:var(--accent); color:white}
.controls .danger{background:transparent; border-color:var(--danger); color:var(--danger)}
.content{display:flex; gap:20px; padding:20px}
.sidebar{width:220px}
.main-area{flex:1}
.grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px}
.card-browse{background:var(--card); padding:12px; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,0.04)}
.flashcard{background:var(--card); padding:18px; border-radius:10px; box-shadow:0 4px 12px rgba(16,24,40,0.04); margin-bottom:12px}
.flashcard .q{font-weight:600; margin-bottom:12px}
.actions button{padding:8px 12px}
.a .rating{display:flex; gap:8px; margin-top:12px}
.danger{background:transparent; border:1px solid var(--danger); color:var(--danger)}
.positive{background:transparent; border:1px solid var(--ok); color:var(--ok)}
.add-form{background:var(--card); padding:16px; border-radius:8px}
.add-form textarea{width:100%; padding:8px; border-radius:6px; border:1px solid #e5e7eb; resize:vertical}
.form-actions{margin-top:10px}
.empty{padding:20px; background:linear-gradient(90deg,#fff,#fbfbff); border-radius:8px; text-align:center}
.footer{padding:12px 20px; margin-top:auto; color:var(--muted); font-size:13px}
.small{font-size:13px}
.muted{color:var(--muted)}
```

---

## How to use / where to put files

1. Drop the files into your existing Vite project's `src/` folder (replace your current `App.tsx` if you like). The `main.tsx` you already shared will work as-is.
2. Run the dev server: `npm install` (if necessary) and `npm run dev`.
3. The app stores data in `localStorage` under `flashcards_v1` — safe to inspect in the browser.

---

## What this exercise demonstrates (good interview talking points)
- TypeScript typing for domain models.
- React functional components and hooks.
- A custom `useLocalStorage` hook to persist state.
- Component composition and a small UI.
- A simple spaced-repetition algorithm (SM-2 inspired) and how you might test it.
- Local testing approach using `DEMO_MODE = true` which uses minutes for intervals so you can try rating flows quickly.

---

If you want, I can now:
- convert the CSS to Tailwind classes and provide a ready Tailwind setup,
- add unit tests (Jest + React Testing Library) for core logic,
- add a small README with example cards to import,
- or simplify / expand the algorithm to be a stricter SM-2 implementation.

Tell me which follow-up you prefer and I will implement it in the same canvas file.
