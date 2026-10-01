export default function WalletList({ wallets, onConnect }) {
  return <div className="wallet-list">
    <h2>Choose your wallet</h2>
    {wallets.length === 0 ? <p>No browser wallet found. Install MetaMask or another EIP-1193 wallet, then reload.</p> : wallets.map((wallet) => <div key={wallet.info.uuid}><img src={wallet.info.icon} alt="" width="25" height="25"/><span>{wallet.info.name}</span><button onClick={() => onConnect(wallet)}>Connect ↗</button></div>)}
  </div>;
}
