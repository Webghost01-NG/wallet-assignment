import { useState } from "react";

const short = (a) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export default function AllStudents({
  students,
  addressCount,
  loading,
  error,
  account,
  onAdd,
  onRefresh,
  onImport,
}) {
  const [input, setInput] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    if (onAdd(input.trim())) setInput("");
  }

  return (
    <div style={{ border: "1px solid #888", padding: 16, borderRadius: 8, marginTop: 16 }}>
      <h2>All registered students</h2>
      <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
        Fetched in one multicall for {addressCount} known address
        {addressCount === 1 ? "" : "es"}.
      </p>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Add an address (0x...)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit">Add</button>
      </form>

      <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
        <button onClick={onRefresh} disabled={loading}>
          {loading ? "Loading..." : "Refresh list"}
        </button>
        <button onClick={onImport}>Import from explorer</button>
      </div>

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      {students.length === 0 && !loading ? (
        <p>No registered students found for the known addresses.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>Name</th>
                <th>Age</th>
                <th>Course</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.address}>
                  <td title={s.address}>
                    {short(s.address)}
                    {s.address.toLowerCase() === account.toLowerCase() ? " (you)" : ""}
                  </td>
                  <td>{s.name}</td>
                  <td>{s.age}</td>
                  <td>{s.course}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
