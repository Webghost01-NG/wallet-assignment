import { useState } from "react";
import { isAddress } from "ethers";
import { STATUS_LABELS } from "../constants/crowdfunding";

export default function CreateCampaignForm({ onCreate, busy, chainNow }) {
  const [token, setToken] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [milestones, setMilestones] = useState([{ amount: "", status: 0 }]);
  const [localError, setLocalError] = useState("");

  const sum = milestones.reduce((total, m) => total + (Number(m.amount) || 0), 0);
  const sumMismatch = Number(target) > 0 && Math.abs(sum - Number(target)) > 1e-9;

  function updateMilestone(index, patch) {
    setMilestones((list) => list.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");

    if (!isAddress(token.trim())) {
      setLocalError("Enter a valid ERC-20 token address (0x...).");
      return;
    }
    if (!(Number(target) > 0)) {
      setLocalError("Target must be greater than zero.");
      return;
    }
    if (!deadline) {
      setLocalError("Pick a deadline.");
      return;
    }
    const deadlineSec = Math.floor(new Date(deadline).getTime() / 1000);
    if (deadlineSec <= Number(chainNow) + 120) {
      setLocalError("The deadline must be at least a couple of minutes in the future.");
      return;
    }
    if (milestones.some((m) => !(Number(m.amount) > 0))) {
      setLocalError("Every milestone needs an amount greater than zero.");
      return;
    }

    const ok = await onCreate({
      token: token.trim(),
      target: target.trim(),
      deadline: deadlineSec,
      milestones,
    });
    if (ok) {
      setToken("");
      setTarget("");
      setDeadline("");
      setMilestones([{ amount: "", status: 0 }]);
    }
  }

  return (
    <details className="card">
      <summary>
        <strong>Create a campaign</strong>
      </summary>

      <form onSubmit={handleSubmit} className="stack" style={{ marginTop: 12 }}>
        <input
          placeholder="ERC-20 token address (0x...)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={busy}
        />
        <input
          placeholder="Target (in whole tokens, e.g. 100)"
          inputMode="decimal"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={busy}
        />
        <label className="muted">
          Deadline (your local time)
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={busy}
            style={{ display: "block", marginTop: 4 }}
          />
        </label>

        <h3 style={{ margin: "8px 0 0" }}>Milestones</h3>
        {milestones.map((m, i) => (
          <div key={i} className="row">
            <input
              placeholder={`Milestone ${i + 1} amount`}
              inputMode="decimal"
              value={m.amount}
              onChange={(e) => updateMilestone(i, { amount: e.target.value })}
              disabled={busy}
              style={{ flex: 1 }}
            />
            <select
              value={m.status}
              onChange={(e) => updateMilestone(i, { status: Number(e.target.value) })}
              disabled={busy}
            >
              {STATUS_LABELS.map((label, value) => (
                <option key={label} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setMilestones((list) => list.filter((_, idx) => idx !== i))}
              disabled={busy || milestones.length === 1}
              aria-label={`Remove milestone ${i + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            onClick={() => setMilestones((list) => [...list, { amount: "", status: 0 }])}
            disabled={busy}
          >
            Add milestone
          </button>
        </div>

        {sumMismatch && (
          <p className="warn">
            Milestones add up to {sum}, but the target is {target}. The contract allows this,
            but funds beyond the milestones can never be withdrawn.
          </p>
        )}

        <button type="submit" disabled={busy}>
          {busy ? "Working..." : "Create campaign"}
        </button>
        {localError && <p className="err">{localError}</p>}
      </form>
    </details>
  );
}
