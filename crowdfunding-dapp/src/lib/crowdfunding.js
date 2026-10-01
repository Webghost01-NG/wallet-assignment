import {
  BrowserProvider,
  Contract,
  Interface,
  formatUnits,
  parseUnits,
} from "ethers";
import {
  CONTRACT_ADDRESS,
  CROWDFUNDING_ABI,
  ERC20_ABI,
  MULTICALL3_ADDRESS,
  MULTICALL3_ABI,
  DEPLOY_BLOCK,
  MAX_CAMPAIGNS,
} from "../constants/crowdfunding.js";

export const crowdIface = new Interface(CROWDFUNDING_ABI);
export const erc20Iface = new Interface(ERC20_ABI);

/* ---------------- errors ---------------- */

// An error whose message is already written for the user
export class UserError extends Error {
  constructor(message) {
    super(message);
    this.isUser = true;
  }
}

const REVERT_MESSAGES = {
  NotCreator: "Only the campaign creator can do this.",
  TokenNotAccepted: "This campaign does not accept that token.",
  InvalidToken: "The token address is not valid.",
  InvalidDeadline: "The deadline must be in the future.",
  InvalidAmount: "Amounts must be greater than zero.",
  InvalidMilestones: "Milestone amounts and statuses don't match.",
  NotActive: "This campaign is no longer active.",
  DeadlinePassed: "The deadline has passed, so contributions are closed.",
  DeadlineNotPassed: "Milestones can only be approved after the deadline.",
  UnableToContribute: "The token transfer failed. Check your balance and approval.",
  NotYetEligible:
    "Not eligible yet. Withdrawing needs the target reached and an approved, unpaid milestone. Refunds need a cancelled or failed campaign.",
  unableToWithdraw: "The token transfer to the creator failed.",
  alreadyCancelled: "This campaign is already cancelled.",
  unableToRefund: "The refund transfer failed.",
  alreadyRefunded: "Nothing left to refund for this account.",
};

export function friendlyError(err) {
  if (err?.isUser) return err.message;
  if (err?.code === "ACTION_REJECTED") return "You rejected the request in your wallet.";
  const name = err?.revert?.name;
  if (name && REVERT_MESSAGES[name]) return REVERT_MESSAGES[name];
  return (
    err?.reason ??
    err?.shortMessage ??
    "Something went wrong. Check the browser console for details."
  );
}

/* ---------------- small helpers ---------------- */

// "12.5" + 6 decimals -> 12500000n. Throws a UserError if the text is not a valid positive amount.
export function parseAmount(text, decimals, label = "Amount") {
  let value;
  try {
    value = parseUnits(String(text).trim(), decimals);
  } catch {
    throw new UserError(`${label} must be a number with at most ${decimals} decimal places.`);
  }
  if (value <= 0n) throw new UserError(`${label} must be greater than zero.`);
  return value;
}

// formatUnits gives "30.0"; show "30" instead
export function fmtUnits(value, decimals) {
  const text = formatUnits(value, decimals);
  return text.endsWith(".0") ? text.slice(0, -2) : text;
}

export async function getSignerContract(rawProvider) {
  const signer = await new BrowserProvider(rawProvider).getSigner();
  return new Contract(CONTRACT_ADDRESS, CROWDFUNDING_ABI, signer);
}

async function multicall(provider, calls) {
  const mc = new Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
  // aggregate3 is payable, so staticCall makes it a read, not a transaction
  return mc.aggregate3.staticCall(
    calls.map((c) => ({ target: c.target, allowFailure: true, callData: c.callData }))
  );
}

function tryDecode(iface, fn, result) {
  const [ok, data] = result;
  if (!ok || data === "0x") return null;
  try {
    return iface.decodeFunctionResult(fn, data);
  } catch {
    return null;
  }
}

/* ---------------- milestone details ---------------- */

// The contract exposes no milestone getter. We rebuild them from events:
//   CampaignCreated is followed by one milestoneCreated per milestone (same transaction),
//   and campaign ids are sequential, so the Nth CampaignCreated is campaign N-1.
// Approval is derived from money accounting: approved total = moneyRaised - moneyavailable,
// and milestones are always approved in order. Paid = number of withdrawal events.
async function loadMilestones(provider, campaigns, nextId) {
  const topics = [
    crowdIface.getEvent("CampaignCreated").topicHash,
    crowdIface.getEvent("milestoneCreated").topicHash,
    crowdIface.getEvent("withdrwalSuccessfully").topicHash,
  ];

  const logs = await provider.getLogs({
    address: CONTRACT_ADDRESS,
    fromBlock: DEPLOY_BLOCK,
    toBlock: "latest",
    topics: [topics],
  });
  logs.sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index);

  const groups = [];
  const paidCount = {};
  for (const log of logs) {
    const parsed = crowdIface.parseLog(log);
    if (!parsed) continue;
    if (parsed.name === "CampaignCreated") {
      groups.push([]);
    } else if (parsed.name === "milestoneCreated") {
      groups[groups.length - 1]?.push({
        amount: parsed.args[0],
        status: Number(parsed.args[1]),
      });
    } else if (parsed.name === "withdrwalSuccessfully") {
      const id = Number(parsed.args[2]);
      paidCount[id] = (paidCount[id] ?? 0) + 1;
    }
  }

  if (groups.length !== nextId) {
    throw new Error(`found ${groups.length} campaigns in logs, expected ${nextId}`);
  }

  for (const c of campaigns) {
    const approvedTotal = c.moneyRaised - c.moneyAvailable;
    let running = 0n;
    let stopped = false;
    c.milestones = groups[c.id].map((m, index) => {
      let approved = false;
      if (!stopped && running + m.amount <= approvedTotal) {
        approved = true;
        running += m.amount;
      } else {
        stopped = true;
      }
      return { ...m, approved, paid: index < (paidCount[c.id] ?? 0) };
    });
  }
}

/* ---------------- main loader ---------------- */

export async function loadAll(rawProvider, account) {
  const provider = new BrowserProvider(rawProvider);
  const crowd = new Contract(CONTRACT_ADDRESS, CROWDFUNDING_ABI, provider);
  const mc = new Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);

  const [nextIdBig, chainNow] = await Promise.all([
    crowd.NextCampignId(),
    mc.getCurrentBlockTimestamp(), // the same clock the contract uses for deadlines
  ]);
  const nextId = Number(nextIdBig);

  if (nextId === 0) {
    return { campaigns: [], tokens: {}, chainNow, milestoneNote: "" };
  }

  // 1) every campaign + my contribution to it, in ONE multicall
  const firstId = Math.max(0, nextId - MAX_CAMPAIGNS);
  const ids = [];
  for (let id = firstId; id < nextId; id++) ids.push(id);

  const results = await multicall(
    provider,
    ids.flatMap((id) => [
      { target: CONTRACT_ADDRESS, callData: crowdIface.encodeFunctionData("campaign", [id]) },
      {
        target: CONTRACT_ADDRESS,
        callData: crowdIface.encodeFunctionData("contributors", [id, account]),
      },
    ])
  );

  const campaigns = [];
  ids.forEach((id, i) => {
    const c = tryDecode(crowdIface, "campaign", results[i * 2]);
    if (!c) return;
    const mine = tryDecode(crowdIface, "contributors", results[i * 2 + 1]);
    campaigns.push({
      id,
      creator: c[0],
      target: c[1],
      deadline: c[2],
      moneyRaised: c[3],
      moneyAvailable: c[4],
      active: c[5],
      cancelled: c[6],
      token: c[7],
      myContribution: mine ? mine[0] : 0n,
      milestones: null,
    });
  });

  // 2) token details (symbol, decimals, my balance, my allowance), in ONE multicall
  const tokenAddrs = [...new Set(campaigns.map((c) => c.token))];
  const tokenResults = await multicall(
    provider,
    tokenAddrs.flatMap((t) => [
      { target: t, callData: erc20Iface.encodeFunctionData("symbol") },
      { target: t, callData: erc20Iface.encodeFunctionData("decimals") },
      { target: t, callData: erc20Iface.encodeFunctionData("balanceOf", [account]) },
      {
        target: t,
        callData: erc20Iface.encodeFunctionData("allowance", [account, CONTRACT_ADDRESS]),
      },
    ])
  );

  const tokens = {};
  tokenAddrs.forEach((address, i) => {
    const r = tokenResults.slice(i * 4, i * 4 + 4);
    const symbol = tryDecode(erc20Iface, "symbol", r[0]);
    const decimals = tryDecode(erc20Iface, "decimals", r[1]);
    const balance = tryDecode(erc20Iface, "balanceOf", r[2]);
    const allowance = tryDecode(erc20Iface, "allowance", r[3]);
    tokens[address.toLowerCase()] = {
      address,
      valid: decimals !== null,
      symbol: symbol ? symbol[0] : "TOKEN",
      decimals: decimals ? Number(decimals[0]) : 18,
      balance: balance ? balance[0] : 0n,
      allowance: allowance ? allowance[0] : 0n,
    };
  });

  // 3) milestones from event logs (best effort: the page works without them)
  let milestoneNote = "";
  try {
    await loadMilestones(provider, campaigns, nextId);
  } catch (err) {
    console.warn("Milestone details unavailable:", err);
    milestoneNote =
      "Milestone details are unavailable (the RPC rejected the log query or returned partial data). " +
      "Set DEPLOY_BLOCK in src/constants/crowdfunding.js to the contract's creation block.";
  }

  return { campaigns, tokens, chainNow, milestoneNote };
}
