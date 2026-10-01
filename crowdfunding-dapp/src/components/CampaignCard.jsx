import { useState } from "react";
import { STATUS_LABELS } from "../constants/crowdfunding";
import { fmtUnits } from "../lib/crowdfunding";

const short = (a) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export default function CampaignCard({
  campaign,
  token,
  chainNow,
  account,
  busy,
  onAction,
  onContribute,
}) {
  const [amount, setAmount] = useState("");

  const decimals = token?.decimals ?? 18;
  const symbol = token?.symbol ?? "TOKEN";
  const fmt = (value) => fmtUnits(value, decimals);

  const isCreator = campaign.creator.toLowerCase() === account.toLowerCase();
  const deadlinePassed = chainNow >= campaign.deadline;
  const targetReached = campaign.moneyRaised >= campaign.target;
  const failed = deadlinePassed && !targetReached;

  let status = "Open for funding";
  if (campaign.cancelled) status = "Cancelled";
  else if (deadlinePassed && targetReached) status = "Funded";
  else if (failed) status = "Failed";

  const percent =
    campaign.target > 0n
      ? Math.min(100, Number((campaign.moneyRaised * 10000n) / campaign.target) / 100)
      : 0;

  // the same rules the contract enforces, so buttons only light up when they can work
  const canContribute = campaign.active && !deadlinePassed;
  const canApprove = campaign.active && deadlinePassed;
  const canWithdraw = isCreator && campaign.active && targetReached;
  const canCancel = isCreator && campaign.active;
  const canRefund = campaign.myContribution > 0n && (campaign.cancelled || failed);

  async function handleContribute(e) {
    e.preventDefault();
    const ok = await onContribute(campaign, amount);
    if (ok) setAmount("");
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Campaign #{campaign.id}</h2>
        <span className={`badge ${status.toLowerCase().split(" ")[0]}`}>{status}</span>
      </div>

      <p className="muted">
        Creator: <span title={campaign.creator}>{short(campaign.creator)}</span>
        {isCreator ? " (you)" : ""}
      </p>
      <p>
        Raised {fmt(campaign.moneyRaised)} of {fmt(campaign.target)} {symbol}
      </p>
      <div className="bar" aria-label={`${percent}% funded`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="muted">
        Deadline: {new Date(Number(campaign.deadline) * 1000).toLocaleString()}
        {deadlinePassed ? " (passed)" : ""}
      </p>
      <p className="muted">
        Not yet approved for milestones: {fmt(campaign.moneyAvailable)} {symbol}
      </p>
      {campaign.myContribution > 0n && (
        <p>
          Your contribution: {fmt(campaign.myContribution)} {symbol}
        </p>
      )}
      {token && !token.valid && (
        <p className="warn">This campaign's token could not be read as an ERC-20.</p>
      )}

      {campaign.milestones && (
        <>
          <h3 style={{ margin: "12px 0 4px" }}>Milestones</h3>
          {campaign.milestones.length === 0 ? (
            <p className="muted">This campaign has no milestones.</p>
          ) : (
            <ol className="milestones">
              {campaign.milestones.map((m, i) => (
                <li key={i}>
                  {fmt(m.amount)} {symbol} · {STATUS_LABELS[m.status] ?? m.status} ·{" "}
                  {m.paid ? "Paid" : m.approved ? "Approved, not withdrawn" : "Not approved"}
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {canContribute && (
        <form onSubmit={handleContribute} className="row" style={{ marginTop: 12 }}>
          <input
            placeholder={`Amount in ${symbol}`}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={busy || !amount.trim()}>
            Contribute
          </button>
        </form>
      )}
      {canContribute && token && (
        <p className="muted" style={{ fontSize: "0.8rem" }}>
          Your balance: {fmt(token.balance)} {symbol}. Contributing asks for a token approval
          first if one is needed.
        </p>
      )}

      <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
        <button
          disabled={busy || !canApprove}
          onClick={() => onAction("approveMilestones", campaign.id)}
          title="Anyone can approve milestones once the deadline has passed"
        >
          Approve milestones
        </button>
        <button
          disabled={busy || !canWithdraw}
          onClick={() => onAction("Withdrawal", campaign.id)}
          title="Creator only. Needs the target reached and an approved, unpaid milestone"
        >
          Withdraw next milestone
        </button>
        <button
          disabled={busy || !canRefund}
          onClick={() => onAction("refundMoney", campaign.id)}
          title="Available to contributors when the campaign is cancelled or failed"
        >
          Claim refund
        </button>
        <button
          disabled={busy || !canCancel}
          onClick={() => {
            if (window.confirm("Cancel this campaign? This cannot be undone.")) {
              onAction("cancelCampaign", campaign.id);
            }
          }}
          title="Creator only, while the campaign is active"
        >
          Cancel campaign
        </button>
      </div>
    </div>
  );
}
