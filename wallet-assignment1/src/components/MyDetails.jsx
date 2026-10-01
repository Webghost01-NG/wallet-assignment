export default function MyDetails({ me, loading, error }) {
  return (
    <div style={{ border: "1px solid #888", padding: 16, borderRadius: 8, marginTop: 16 }}>
      <h2>My details</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      {!loading && !error && me && !me.registered && (
        <p>This account is not registered yet. Use the form below.</p>
      )}

      {!loading && me?.registered && (
        <>
          <p>Name: {me.name}</p>
          <p>Age: {me.age}</p>
          <p>Course: {me.course}</p>
        </>
      )}
    </div>
  );
}
