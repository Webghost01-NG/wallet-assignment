import { useProviderDiscovery } from "./hooks/useProviderDiscovery";
import { useWallet } from "./hooks/useWallet";
import WalletList from "./components/WalletList";
import WalletStatus from "./components/WalletStatus";
import ChainSwitcher from "./components/ChainSwitcher";
import UnsupportedChainBanner from "./components/UnsupportedChainBanner";

function App() {
  const providers = useProviderDiscovery();
  const {
    walletInfo,
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
  } = useWallet(providers);

  return (
    <div>
      <h1>Wallet Connect (EIP-1193 + EIP-6963)</h1>

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      {isConnected ? (
        <>
          {isUnsupported && (
            <UnsupportedChainBanner chainId={chainId} onSwitch={switchChain} />
          )}
          <WalletStatus
            walletInfo={walletInfo}
            account={account}
            chainId={chainId}
            balance={balance}
            balanceLoading={balanceLoading}
            onRefresh={refreshBalance}
            onDisconnect={disconnect}
          />
          <ChainSwitcher chainId={chainId} onSwitch={switchChain} />
        </>
      ) : (
        <WalletList wallets={providers} onConnect={connect} />
      )}
    </div>
  );
}

export default App;