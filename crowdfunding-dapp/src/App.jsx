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
    <div className="fund-shell">
      <header className="fund-topbar"><a className="fund-brand" href="#top"><span className="fund-logo">F</span>Fieldnote<span className="fund-brand-dot">.</span></a><nav><a className="fund-nav-active" href="#campaigns">Explore</a><a href="#create">Start a campaign</a></nav><div className="fund-top-right"><span className="fund-network"><i/> Ethereum Sepolia</span>{isConnected ? <button className="fund-wallet-pill" onClick={disconnect}>{account.slice(0, 6)}…{account.slice(-4)}</button> : <span className="fund-network">Connect wallet below</span>}</div></header>
      <section className="fund-hero" id="top"><div><div className="fund-eyebrow"><span/> COMMUNITY, IN MOTION</div><h1>Good things happen<br/>when we <em>fund together.</em></h1><p>Back ideas with a clear plan. Follow every milestone from first contribution to final delivery.</p><a href="#campaigns" className="fund-hero-link">Discover projects <b>↓</b></a></div><div className="fund-hero-art" aria-hidden="true"><div className="fund-art-circle"/><div className="fund-art-block block-a"/><div className="fund-art-block block-b"/><div className="fund-art-block block-c"/><span className="fund-art-star">✳</span><span className="fund-art-caption">SMALL GIFTS. BIG MOMENTUM.</span></div></section>
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

          <div className="fund-stats"><div><span>CONNECTED ACCOUNT</span><strong>{account.slice(0, 8)}…{account.slice(-6)}</strong><small>{walletInfo?.name || "Browser wallet"}</small></div><div><span>NETWORK</span><strong>{getChainById(chainId)?.name || `Chain ${chainId}`}</strong><small><i/> Wallet connected</small></div><div><span>AVAILABLE BALANCE</span><strong>{balanceLoading ? "Loading…" : `${balance || "—"} ${getChainById(chainId)?.currency.symbol || ""}`}</strong><small>{balanceError || "For network fees"}</small></div><div className="fund-stat-actions"><button className="fund-secondary" onClick={refreshBalance} disabled={balanceLoading}>↻ Refresh</button><ChainSwitcher chainId={chainId} onSwitch={switchChain} /></div></div>
          <div className="fund-wallet-hidden"><WalletStatus
            walletInfo={walletInfo}
            account={account}
            chainId={chainId}
            balance={balance}
            balanceError={balanceError}
            balanceLoading={balanceLoading}
            onRefresh={refreshBalance}
            onDisconnect={disconnect}
          />
          </div>

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
              <section className="fund-create" id="create"><div><div className="fund-eyebrow"><span/> PUT YOUR IDEA OUT THERE</div><h2>Start with a clear plan.</h2><p>Set a funding target, deadline and milestones. Your community can track progress as it happens.</p><div className="fund-create-note"><b>✳</b><span>Funds move transparently, milestone by milestone.</span></div></div><CreateCampaignForm
                onCreate={fund.createCampaign}
                busy={busy}
                chainNow={fund.chainNow}
              /></section>

              <div className="fund-section-head" id="campaigns"><div><div className="fund-eyebrow"><span/> COMMUNITY PROJECTS</div><h2>Campaigns worth backing</h2><p>Explore active projects and follow the progress.</p></div>
                <button className="fund-secondary" onClick={fund.refresh} disabled={fund.loading || busy}>
                  {fund.loading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {busy && <p className="status">{fund.busyText}</p>}
              {fund.actionError && <p className="err">{fund.actionError}</p>}
              {fund.loadError && <p className="err">{fund.loadError}</p>}
              {fund.milestoneNote && <p className="warn">{fund.milestoneNote}</p>}

              {!fund.loading && !fund.loadError && fund.campaigns.length === 0 && <div className="fund-empty"><span>✳</span><strong>No campaigns found yet</strong><p>Be the first to share a project with the community.</p><a href="#create">Create a campaign ↗</a></div>}

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
      ) : (<section className="fund-connect"><div><div className="fund-eyebrow"><span/> YOUR WALLET, YOUR CHOICE</div><h2>Connect to back<br/>a good idea.</h2><p>Choose a browser wallet to explore campaigns, contribute, or bring your own project to life.</p></div><WalletList wallets={providers} onConnect={connect} /></section>)}
      <footer className="fund-footer"><a className="fund-brand" href="#top"><span className="fund-logo">F</span>Fieldnote<span className="fund-brand-dot">.</span></a><span>Transparent funding for community ideas.</span><span>Ethereum Sepolia · <a href={`${contractChain?.explorer}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">Contract ↗</a></span></footer>
    </div>
  );
}

export default App;
