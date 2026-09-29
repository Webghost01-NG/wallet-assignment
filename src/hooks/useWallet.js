import { useCallback, useEffect, useState } from "react";
import { isSupportedChain } from "../constants/chains";

const STORAGE_KEY = "connectedWalletRdns";

export function useWallet(providers) {
  const [selected, setSelected] = useState(null); // { info, provider }
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(0);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setSelected(null);
    setAccount("");
    setChainId(0);
  }, []);
  
  //  let us listen to events from the selected provider
    useEffect(() => {
    if (!selected) return;
    const { provider } = selected;

    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        // wallet is supposed to be connected, but user disconnected it from the wallet side, so we reset our state and remove the localStorage entry
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

 // no-popup auto reconnect logic, if the user has previously connected a wallet, we try to reconnect it silently without any popup, if the wallet is still available and the user has not disconnected it from the wallet side
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
 // popup only connect logic, if the user has not previously connected a wallet, we show a popup to let the user select a wallet and connect it
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
      setError(
        err.code === 4001 ? "You rejected the connection request." : err.message
      );
    }
  }, []);
// trying the disconnect here, hoping this would work, if it works, do not touch it!.
  const disconnect = useCallback(async () => {
    const provider = selected?.provider;
    localStorage.removeItem(STORAGE_KEY);
    reset();
    setError("");

    try {
      await provider?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch {
    }

}, 
[selected, reset]);

// switching to supporting chains here!!!. LFG
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
        if (err.code === 4902) {
        // wallet does not know about this chain, so we try to add it first so wallet can switch to it properly, lets hope this works out
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
    connect,
    disconnect,
    switchChain,
  };
}