import React, { useState } from "react";

export default function AddCardForm({
  onAdd,
}: {
  onAdd: (q: string, a: string) => void;
}) {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim() || !a.trim())
      return alert("Please provide question and answer");
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
