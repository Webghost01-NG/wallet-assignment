import { useProviderDiscovery } from "./hooks/useProviderDiscovery";
import { useWallet } from "./hooks/useWallet";
import { useCrowdfunding } from "./hooks/useCrowdfunding";
import WalletList from "./components/WalletList";
import WalletStatus from "./components/WalletStatus";
import ChainSwitcher from "./components/ChainSwitcher";
import UnsupportedChainBanner from "./components/UnsupportedChainBanner";
import CreateCampaignForm from "./components/CreateCampaignForm";
import CampaignCard from "./components/CampaignCard";
import { getChainById } from "./constants/chains";
import { CONTRACT_ADDRESS, CONTRACT_CHAIN_ID } from "./constants/crowdfunding";

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

  const fund = useCrowdfunding({ rawProvider, account, chainId });
  const contractChain = getChainById(CONTRACT_CHAIN_ID);
  const busy = Boolean(fund.busyText);

  return (
    <div>
      <h1>Crowdfunding dApp</h1>
      <p className="muted">
        Contract:{" "}
        <a
          href={`${contractChain?.explorer}/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
        >
          {CONTRACT_ADDRESS}
        </a>{" "}
        on {contractChain?.name}
      </p>

      {error && <p className="err">{error}</p>}

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

          {chainId !== CONTRACT_CHAIN_ID ? (
            <div className="card warn-box">
              <p>
                The contract is on {contractChain?.name}. Switch networks to use it.
              </p>
              {contractChain && (
                <button onClick={() => switchChain(contractChain)}>
                  Switch to {contractChain.name}
                </button>
              )}
            </div>
          ) : (
            <>
              <CreateCampaignForm
                onCreate={fund.createCampaign}
                busy={busy}
                chainNow={fund.chainNow}
              />

              <div className="row" style={{ justifyContent: "space-between", marginTop: 24 }}>
                <h2 style={{ margin: 0 }}>Campaigns</h2>
                <button onClick={fund.refresh} disabled={fund.loading || busy}>
                  {fund.loading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {busy && <p className="status">{fund.busyText}</p>}
              {fund.actionError && <p className="err">{fund.actionError}</p>}
              {fund.loadError && <p className="err">{fund.loadError}</p>}
              {fund.milestoneNote && <p className="warn">{fund.milestoneNote}</p>}

              {!fund.loading && !fund.loadError && fund.campaigns.length === 0 && (
                <p className="muted">No campaigns yet. Create the first one above.</p>
              )}

              {[...fund.campaigns].reverse().map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  token={fund.tokens[campaign.token.toLowerCase()]}
                  chainNow={fund.chainNow}
                  account={account}
                  busy={busy}
                  onAction={fund.campaignAction}
                  onContribute={fund.contribute}
                />
              ))}
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
