import { useProviderDiscovery } from "./hooks/useProviderDiscovery";
import { useWallet } from "./hooks/useWallet";
import { useStudentRegistry } from "./hooks/useStudentRegistry";
import WalletList from "./components/WalletList";
import WalletStatus from "./components/WalletStatus";
import ChainSwitcher from "./components/ChainSwitcher";
import UnsupportedChainBanner from "./components/UnsupportedChainBanner";
import MyDetails from "./components/MyDetails";
import RegisterForm from "./components/RegisterForm";
import AllStudents from "./components/AllStudents";
import { getChainById } from "./constants/chains";
import { CONTRACT_CHAIN_ID, CONTRACT_CONFIGURED } from "./constants/studentRegistry";

function App() {
  const providers = useProviderDiscovery();
  const {
    walletInfo,
    rawProvider,
    account,
    chainId,
    error,
    isConnected,
    isUnsupported,
    balance,
    balanceError,
    balanceLoading,
    refreshBalance,
    connect,
    disconnect,
    switchChain,
  } = useWallet(providers);

  const registry = useStudentRegistry({ rawProvider, account, chainId });
  const contractChain = getChainById(CONTRACT_CHAIN_ID);

  return (
    <div>
      <h1>Student Registration dApp</h1>

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
            balanceError={balanceError}
            balanceLoading={balanceLoading}
            onRefresh={refreshBalance}
            onDisconnect={disconnect}
          />
          <ChainSwitcher chainId={chainId} onSwitch={switchChain} />

          {!CONTRACT_CONFIGURED ? (
            <p style={{ color: "#e0a030" }}>
              Set CONTRACT_ADDRESS in src/constants/studentRegistry.js.
            </p>
          ) : chainId !== CONTRACT_CHAIN_ID ? (
            <div style={{ border: "1px solid #e0a030", padding: 16, borderRadius: 8, marginTop: 16 }}>
              <p>
                The contract is on {contractChain?.name ?? `chain ${CONTRACT_CHAIN_ID}`}.
                Switch to use it.
              </p>
              {contractChain && (
                <button onClick={() => switchChain(contractChain)}>
                  Switch to {contractChain.name}
                </button>
              )}
            </div>
          ) : (
            <>
              <MyDetails
                me={registry.me}
                loading={registry.meLoading}
                error={registry.meError}
              />

              {registry.me && !registry.me.registered && (
                <RegisterForm
                  onRegister={registry.register}
                  txStatus={registry.txStatus}
                  error={registry.formError}
                />
              )}

              <AllStudents
                students={registry.students}
                addressCount={registry.addressCount}
                loading={registry.studentsLoading}
                error={registry.studentsError}
                account={account}
                onAdd={registry.addAddress}
                onRefresh={registry.refresh}
                onImport={registry.importFromExplorer}
              />
            </>
          )}
        </>
      ) : (
        <WalletList wallets={providers} onConnect={connect} />
      )}
    </div>
  );
}

export default App;
