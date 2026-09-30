import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { isSupportedChain } from "../constants/chains";

const STORAGE_KEY = "connectedWalletRdns";

export function useWallet(providers) {
  const [selected, setSelected] = useState(null); // { info, provider }
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(0);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const reset = useCallback(() => {
    setSelected(null);
    setAccount("");
    setChainId(0);
    setBalance("");
  }, []);

  useEffect(() => {
    if (!selected) return;
    const { provider } = selected;

    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        reset();
      } else {
        setAccount(accounts[0]);
      }
    }

    function handleChainChanged(hexChainId) {
      setChainId(parseInt(hexChainId, 16));
      setError("");
    }

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, [selected, reset]);

  useEffect(() => {
    if (selected) return;
    const savedRdns = localStorage.getItem(STORAGE_KEY);
    if (!savedRdns) return;
    const match = providers.find((p) => p.info.rdns === savedRdns);
    if (!match) return;

    let cancelled = false;
    (async () => {
      try {
        const accounts = await match.provider.request({ method: "eth_accounts" });
        if (cancelled) return;
        if (accounts.length === 0) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        const hex = await match.provider.request({ method: "eth_chainId" });
        if (cancelled) return;
        setSelected(match);
        setAccount(accounts[0]);
        setChainId(parseInt(hex, 16));
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [providers, selected]);

  useEffect(() => {
    if (!selected || !account) {
      setBalance("");
      return;
    }

    let cancelled = false;

    (async () => {
      setBalanceLoading(true);
      try {
        const provider = new BrowserProvider(selected.provider);
        const wei = await provider.getBalance(account);
        if (!cancelled) setBalance(formatEther(wei));
      } catch (err) {
        if (!cancelled) setError("Could not fetch balance: " + err.message);
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected, account, chainId, refreshTick]);

  const refreshBalance = useCallback(() => setRefreshTick((t) => t + 1), []);

  const connect = useCallback(async (walletDetail) => {
    setError("");
    try {
      const accounts = await walletDetail.provider.request({
        method: "eth_requestAccounts",
      });
      const hex = await walletDetail.provider.request({ method: "eth_chainId" });

      setSelected(walletDetail);
      setAccount(accounts[0]);
      setChainId(parseInt(hex, 16));
      localStorage.setItem(STORAGE_KEY, walletDetail.info.rdns);
    } catch (err) {
      if (err.code === 4001) {
        setError("You rejected the connection request.");
      } else if (err.code === -32002) {
        setError(
          "A request is already pending. Open your wallet extension and approve or reject it."
        );
      } else {
        setError(err.message);
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    const provider = selected?.provider;
    localStorage.removeItem(STORAGE_KEY);
    reset(); // listeners are removed by the effect cleanup above
    setError("");

    try {
      await provider?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch {
    }
  }, [selected, reset]);

  const switchChain = useCallback(
    async (chain) => {
      if (!selected) return;
      setError("");
      const { provider } = selected;

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chain.hexId }],
        });
        // success -> chainChanged fires -> state updates itself
      } catch (err) {
        // some wallets nest the real 4902 code inside err.data.originalError
        const notAdded =
          err.code === 4902 || err?.data?.originalError?.code === 4902;

        if (notAdded) {
          // wallet doesn't know this chain: add it, then switch
          try {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: chain.hexId,
                  chainName: chain.name,
                  rpcUrls: [chain.rpcUrl],
                  nativeCurrency: chain.currency,
                  blockExplorerUrls: [chain.explorer],
                },
              ],
            });
            await provider.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: chain.hexId }],
            });
          } catch (addErr) {
            setError(
              addErr.code === 4001
                ? "You rejected adding the network."
                : addErr.message
            );
          }
        } else if (err.code === 4001) {
          setError("You rejected the chain switch.");
        } else {
          setError(err.message);
        }
      }
    },
    [selected]
  );

  const isConnected = Boolean(selected && account);
  const isUnsupported = isConnected && !isSupportedChain(chainId); // derived

  return {
    walletInfo: selected?.info ?? null,
    account,
    chainId,
    error,
    isConnected,
    isUnsupported,
    balance,
    balanceLoading,
    refreshBalance,
    connect,
    disconnect,
    switchChain,
  };
}