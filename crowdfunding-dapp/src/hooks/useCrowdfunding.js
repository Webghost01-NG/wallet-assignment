import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, Contract, getAddress, isAddress } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_CHAIN_ID,
  ERC20_ABI,
} from "../constants/crowdfunding";
import {
  UserError,
  fmtUnits,
  friendlyError,
  getSignerContract,
  loadAll,
  parseAmount,
} from "../lib/crowdfunding";

export function useCrowdfunding({ rawProvider, account, chainId }) {
  // true only when a wallet is connected and on the contract's chain
  const ready = Boolean(rawProvider && account) && chainId === CONTRACT_CHAIN_ID;

  const [campaigns, setCampaigns] = useState([]);
  const [tokens, setTokens] = useState({});
  const [chainNow, setChainNow] = useState(0n);
  const [milestoneNote, setMilestoneNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [busyText, setBusyText] = useState(""); // non-empty while a transaction is in flight
  const [actionError, setActionError] = useState("");
  const [tick, setTick] = useState(0);

  // ---- load everything (campaigns, tokens, milestones) ----
  useEffect(() => {
    if (!ready) {
      setCampaigns([]);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await loadAll(rawProvider, account);
        if (cancelled) return;
        setCampaigns(data.campaigns);
        setTokens(data.tokens);
        setChainNow(data.chainNow);
        setMilestoneNote(data.milestoneNote);
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError(friendlyError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, rawProvider, account, chainId, tick]);

  // Runs one write flow: shows progress text, reports errors, reloads data on success
  const runTx = useCallback(async (work) => {
    setActionError("");
    setBusyText("Confirm in your wallet...");
    try {
      await work();
      setTick((t) => t + 1);
      return true;
    } catch (err) {
      console.error(err);
      setActionError(friendlyError(err));
      return false;
    } finally {
      setBusyText("");
    }
  }, []);

  // ---- approveMilestones / Withdrawal / refundMoney / cancelCampaign ----
  const campaignAction = useCallback(
    (method, campaignId) =>
      runTx(async () => {
        const contract = await getSignerContract(rawProvider);
        const tx = await contract[method](campaignId);
        setBusyText("Waiting for confirmation...");
        await tx.wait();
      }),
    [rawProvider, runTx]
  );

  // ---- createCampaign ----
  const createCampaign = useCallback(
    ({ token, target, deadline, milestones }) =>
      runTx(async () => {
        if (!isAddress(token)) throw new UserError("Enter a valid token address.");

        // read the token's decimals so amounts are entered in whole tokens
        let decimals;
        try {
          const erc20 = new Contract(token, ERC20_ABI, new BrowserProvider(rawProvider));
          decimals = Number(await erc20.decimals());
        } catch {
          throw new UserError("That address is not an ERC-20 token on Sepolia.");
        }

        const targetWei = parseAmount(target, decimals, "Target");
        const amounts = milestones.map((m, i) =>
          parseAmount(m.amount, decimals, `Milestone ${i + 1} amount`)
        );
        const statuses = milestones.map((m) => Number(m.status));

        const contract = await getSignerContract(rawProvider);
        const tx = await contract.createCampaign(
          targetWei,
          BigInt(deadline),
          getAddress(token),
          amounts,
          statuses
        );
        setBusyText("Waiting for confirmation...");
        await tx.wait();
      }),
    [rawProvider, runTx]
  );

  // ---- contributing (approves the token first when needed) ----
  const contribute = useCallback(
    (campaign, amountText) =>
      runTx(async () => {
        const provider = new BrowserProvider(rawProvider);
        const erc20Read = new Contract(campaign.token, ERC20_ABI, provider);

        let decimals;
        try {
          decimals = Number(await erc20Read.decimals());
        } catch {
          throw new UserError("This campaign's token could not be read.");
        }
        const amount = parseAmount(amountText, decimals, "Amount");

        // fresh balance and allowance, so a stale screen can't mislead us
        const [balance, allowance] = await Promise.all([
          erc20Read.balanceOf(account),
          erc20Read.allowance(account, CONTRACT_ADDRESS),
        ]);
        if (balance < amount) {
          throw new UserError(
            `You only hold ${fmtUnits(balance, decimals)} of this token.`
          );
        }

        const signer = await provider.getSigner();

        if (allowance < amount) {
          setBusyText("Step 1 of 2: approve the token in your wallet...");
          const erc20 = new Contract(campaign.token, ERC20_ABI, signer);
          const approveTx = await erc20.approve(CONTRACT_ADDRESS, amount);
          setBusyText("Step 1 of 2: waiting for the approval to confirm...");
          await approveTx.wait();
          setBusyText("Step 2 of 2: confirm the contribution in your wallet...");
        }

        const contract = await getSignerContract(rawProvider);
        const tx = await contract.contributing(amount, campaign.token, campaign.id);
        setBusyText("Waiting for confirmation...");
        await tx.wait();
      }),
    [rawProvider, account, runTx]
  );

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return {
    ready,
    campaigns,
    tokens,
    chainNow,
    milestoneNote,
    loading,
    loadError,
    busyText,
    actionError,
    createCampaign,
    contribute,
    campaignAction,
    refresh,
  };
}
