import { useState } from "react";
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
export default function AllStudents({ students, addressCount, loading, error, account, onAdd }) {
  const [input, setInput] = useState("");
  function handleAdd(e) { e.preventDefault(); if (onAdd(input.trim())) setInput(""); }
  return <div className="directory-table-wrap">
    <div className="directory-toolbar"><span>{loading ? "Loading student records…" : `${students.length} verified profile${students.length === 1 ? "" : "s"} · ${addressCount} known wallet${addressCount === 1 ? "" : "s"}`}{error && <span className="form-error"> — {error}</span>}</span><form className="add-address" onSubmit={handleAdd}><input aria-label="Add wallet address" placeholder="Add a wallet address (0x…)" value={input} onChange={(e) => setInput(e.target.value)} /><button type="submit">Add address</button></form></div>
    {!loading && students.length === 0 ? <div className="empty-state">No student profiles found yet. Register above or import addresses from the explorer.</div> : <table className="directory-table"><thead><tr><th>WALLET ADDRESS</th><th>STUDENT NAME</th><th>AGE</th><th>COURSE</th><th>STATUS</th></tr></thead><tbody>{students.map((s) => <tr key={s.address}><td>{short(s.address)}{s.address.toLowerCase() === account.toLowerCase() && <span className="you-tag">YOU</span>}</td><td className="student-name">{s.name}</td><td>{s.age}</td><td>{s.course}</td><td><span className="live-tag"><i/> Verified</span></td></tr>)}</tbody></table>}
  </div>;
}
