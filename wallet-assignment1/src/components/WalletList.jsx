export default function WalletList({ wallets, onConnect }) {
  if (wallets.length === 0) {
    return <p>No wallets detected. Install MetaMask, Rabby or Coinbase Wallet.</p>;
  }

  return (
    <div>
      <h2>Connect a wallet</h2>
      {wallets.map((wallet) => (
        <div
          key={wallet.info.uuid}
          style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}
        >
          <img src={wallet.info.icon} alt={wallet.info.name} width={40} height={40} />
          <span>{wallet.info.name}</span>
          <button onClick={() => onConnect(wallet)}>Connect</button>
        </div>
      ))}
    </div>
  );
}
