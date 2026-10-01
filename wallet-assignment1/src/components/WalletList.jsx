export default function WalletList({ wallets, onConnect }) {
  return <div className="wallet-list">
    {wallets.length === 0 ? <p className="muted">No injected wallets detected. Install a browser wallet such as MetaMask, then reload.</p> : wallets.map((wallet) => <button key={wallet.info.uuid} onClick={() => onConnect(wallet)}><img src={wallet.info.icon} alt="" width="18" height="18" />{wallet.info.name}</button>)}
  </div>;
}
