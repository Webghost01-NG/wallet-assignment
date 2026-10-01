import { getChainById } from "../constants/chains";

export default function WalletStatus({
  walletInfo,
  account,
  chainId,
  balance,
  balanceError,
  balanceLoading,
  onRefresh,
  onDisconnect,
}) {
  const chain = getChainById(chainId);
  const symbol = chain?.currency.symbol ?? "";

  let balanceText = "-";
  if (balanceLoading) balanceText = "Loading...";
  else if (balanceError) balanceText = "Unavailable";
  else if (balance) balanceText = `${balance} ${symbol}`;

  return (
    <div style={{ border: "1px solid #888", padding: 16, borderRadius: 8 }}>
      <h2>Connected</h2>
      <p>Wallet: {walletInfo?.name}</p>
      <p>Account: {account}</p>
      <p>
        Chain ID: {chainId} {chain ? `(${chain.name})` : "(unsupported)"}
      </p>
      <p>Balance: {balanceText}</p>

      {balanceError && !balanceLoading && (
        <p style={{ color: "#e0a030", fontSize: "0.85rem" }}>{balanceError}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={onRefresh} disabled={balanceLoading}>
          {balanceLoading ? "Refreshing..." : "Refresh balance"}
        </button>
        <button onClick={onDisconnect}>Disconnect</button>
      </div>
    </div>
  );
}
