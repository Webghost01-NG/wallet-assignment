import { getChainById } from "../constants/chains";

export default function WalletStatus({ walletInfo, account, chainId, onDisconnect }) {
  const chain = getChainById(chainId);

  return (
    <div style={{ border: "1px solid #888", padding: 16, borderRadius: 8 }}>
      <h2>Connected</h2>
      <p>Wallet: {walletInfo?.name}</p>
      <p>Account: {account}</p>
      <p>
        Chain ID: {chainId} {chain ? `(${chain.name})` : "(unsupported)"}
      </p>
      <button onClick={onDisconnect}>Disconnect</button>
    </div>
  );
}