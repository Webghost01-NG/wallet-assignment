import { useState } from "react";

export default function RegisterForm({ onRegister, txStatus, error }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [course, setCourse] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");

    const ageNumber = Number(age);
    if (!name.trim() || !course.trim()) {
      setLocalError("Name and course are required.");
      return;
    }
    if (!Number.isInteger(ageNumber) || ageNumber <= 0) {
      setLocalError("Age must be a whole number greater than 0.");
      return;
    }

    const ok = await onRegister({
      name: name.trim(),
      age: ageNumber,
      course: course.trim(),
    });
    if (ok) {
      setName("");
      setAge("");
      setCourse("");
    }
  }

  const busy = Boolean(txStatus);

  return (
    <div style={{ border: "1px solid #888", padding: 16, borderRadius: 8, marginTop: 16 }}>
      <h2>Register as a student</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
        <input
          placeholder="Age"
          inputMode="numeric"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          disabled={busy}
        />
        <input
          placeholder="Course"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          disabled={busy}
        />
        <button type="submit" disabled={busy}>
          {busy ? txStatus : "Register"}
        </button>
      </form>
      {(localError || error) && (
        <p style={{ color: "#c0392b" }}>{localError || error}</p>
      )}
    </div>
  );
}
