import { useState } from "react";

export default function RegisterForm({ onRegister, txStatus, error }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [course, setCourse] = useState("");
  const [localError, setLocalError] = useState("");
  async function handleSubmit(e) {
    e.preventDefault(); setLocalError("");
    const ageNumber = Number(age);
    if (!name.trim() || !course.trim()) return setLocalError("Name and course are required.");
    if (!Number.isInteger(ageNumber) || ageNumber <= 0) return setLocalError("Age must be a whole number greater than 0.");
    const ok = await onRegister({ name: name.trim(), age: ageNumber, course: course.trim() });
    if (ok) { setName(""); setAge(""); setCourse(""); }
  }
  const busy = Boolean(txStatus);
  return <form onSubmit={handleSubmit}>
    <input aria-label="Full name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
    <input aria-label="Age" placeholder="Age" inputMode="numeric" type="number" min="1" value={age} onChange={(e) => setAge(e.target.value)} disabled={busy} />
    <input aria-label="Course of study" placeholder="Course of study" value={course} onChange={(e) => setCourse(e.target.value)} disabled={busy} />
    <button type="submit" disabled={busy}>{busy ? txStatus : "Register my profile →"}</button>
    {(localError || error) && <p className="form-error" role="alert">{localError || error}</p>}
  </form>;
}
