import { useProviderDiscovery } from "./hooks/useProviderDiscovery";
import { useWallet } from "./hooks/useWallet";
import { useStudentRegistry } from "./hooks/useStudentRegistry";
import WalletList from "./components/WalletList";
import ChainSwitcher from "./components/ChainSwitcher";
import UnsupportedChainBanner from "./components/UnsupportedChainBanner";
import RegisterForm from "./components/RegisterForm";
import AllStudents from "./components/AllStudents";
import { getChainById } from "./constants/chains";
import { CONTRACT_CHAIN_ID, CONTRACT_ADDRESS } from "./constants/studentRegistry";

function App() {
  const providers = useProviderDiscovery();
  const wallet = useWallet(providers);
  const registry = useStudentRegistry({ rawProvider: wallet.rawProvider, account: wallet.account, chainId: wallet.chainId });
  const contractChain = getChainById(CONTRACT_CHAIN_ID);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-mark">R</span><span>Rollcall<span className="brand-dot">.</span></span></a>
        <nav><a className="nav-active" href="#overview">Overview</a><a href="#students">Directory</a><a href="#register">Registration</a></nav>
        <div className="topbar-right"><span className="network-pill"><i /> Sepolia</span>{wallet.isConnected ? <button className="connect-button connected" onClick={wallet.disconnect}>{wallet.account.slice(0, 6)}…{wallet.account.slice(-4)} <span>⌄</span></button> : <span className="network-pill">Connect below</span>}</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> ONCHAIN STUDENT DIRECTORY</div><h1>Every learner.<br /><em>On the record.</em></h1><p>A simple, transparent home for your academic identity. Register once, carry your record anywhere.</p><div className="hero-actions"><a href="#register" className="primary-link">Get registered <span>↗</span></a><a href="#students" className="text-link">Explore directory <span>↓</span></a></div></div>
        <div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-sun"/><div className="art-card"><span className="art-tag">STUDENT ID · 001</span><div className="art-avatar">✳</div><div className="art-line wide"/><div className="art-line"/><div className="art-card-bottom"><span>VERIFIED<br/>ON SEPOLIA</span><b>↗</b></div></div><span className="art-star star-one">✳</span><span className="art-star star-two">✳</span><span className="art-label">IDENTITY, OWNED BY YOU</span></div>
      </section>

      {wallet.error && <div className="notice error-notice">{wallet.error}</div>}
      {wallet.isConnected ? <>
        {wallet.isUnsupported && <UnsupportedChainBanner chainId={wallet.chainId} onSwitch={wallet.switchChain} />}
        <section className="stats-strip" id="overview"><div className="stat-item"><span className="stat-label">YOUR WALLET</span><strong>{wallet.account.slice(0, 8)}…{wallet.account.slice(-6)}</strong><small>{wallet.walletInfo?.name || "Connected wallet"}</small></div><div className="stat-item"><span className="stat-label">NETWORK</span><strong>{getChainById(wallet.chainId)?.name || `Chain ${wallet.chainId}`}</strong><small><i className="green-dot"/> Wallet connected</small></div><div className="stat-item"><span className="stat-label">WALLET BALANCE</span><strong>{wallet.balanceLoading ? "Loading…" : `${wallet.balance || "—"} ${getChainById(wallet.chainId)?.currency.symbol || ""}`}</strong><small>{wallet.balanceError || "Available for network fees"}</small></div><div className="stat-item stat-action"><button className="quiet-button" onClick={wallet.refreshBalance} disabled={wallet.balanceLoading}>↻ &nbsp;Refresh</button><ChainSwitcher chainId={wallet.chainId} onSwitch={wallet.switchChain} /></div></section>
        {wallet.chainId !== CONTRACT_CHAIN_ID ? <div className="notice warning-notice"><div><strong>Switch to {contractChain?.name}</strong><p>The registry contract is deployed on this network.</p></div><button className="primary-button" onClick={() => wallet.switchChain(contractChain)}>Switch network</button></div> : <>
          <section className="content-grid" id="register"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR PROFILE</div><h2>Your academic identity</h2></div><span className="live-tag"><i/> LIVE ONCHAIN</span></div><div className="profile-card"><div className="profile-top"><div className="profile-avatar">{registry.me?.name ? registry.me.name.slice(0, 1).toUpperCase() : "✳"}</div><div className="profile-title"><span>STUDENT PROFILE</span><h3>{registry.me?.registered ? registry.me.name : "Your profile starts here"}</h3><p>{registry.me?.registered ? registry.me.course : "Create your onchain academic record"}</p></div><span className={`profile-status ${registry.me?.registered ? "verified" : "pending"}`}><i/>{registry.me?.registered ? "VERIFIED" : "NOT REGISTERED"}</span></div><div className="profile-fields"><div><span>FULL NAME</span><strong>{registry.me?.registered ? registry.me.name : "—"}</strong></div><div><span>AGE</span><strong>{registry.me?.registered ? registry.me.age : "—"}</strong></div><div><span>COURSE OF STUDY</span><strong>{registry.me?.registered ? registry.me.course : "—"}</strong></div></div><div className="profile-footer"><span>Wallet address</span><code>{wallet.account}</code><a href={`${contractChain?.explorer}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">View contract ↗</a></div></div>
            <div className="register-card"><div className="eyebrow"><span className="eyebrow-line"/> NEW REGISTRATION</div><h3>{registry.me?.registered ? "Your record is onchain" : "Make it official."}</h3><p>{registry.me?.registered ? "Your student profile is verified and linked to your wallet." : "Add your details to the directory in one transaction."}</p>{registry.meLoading ? <p className="muted">Checking your record…</p> : registry.me?.registered ? <div className="success-note"><span>✓</span><div><strong>Registration complete</strong><small>Your record is permanently linked to this wallet.</small></div></div> : <RegisterForm onRegister={registry.register} txStatus={registry.txStatus} error={registry.meError || registry.formError} />}</div>
          </section>
          <section className="directory-section" id="students"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> THE COMMUNITY</div><h2>Student directory</h2><p className="section-subtitle">Verified profiles attached to known wallet addresses.</p></div><div className="directory-actions"><button className="quiet-button" onClick={registry.refresh} disabled={registry.studentsLoading}>↻ &nbsp;Refresh</button><button className="quiet-button" onClick={registry.importFromExplorer}>Import registrations</button></div></div><AllStudents students={registry.students} addressCount={registry.addressCount} loading={registry.studentsLoading} error={registry.studentsError} account={wallet.account} onAdd={registry.addAddress} /></section>
        </>}
      </> : <section className="connect-panel"><div className="connect-icon">↗</div><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR WEB3 IDENTITY</div><h2>Connect your wallet to begin</h2><p>Use a browser wallet to register a profile or explore student records.</p></div><WalletList wallets={providers} onConnect={wallet.connect} /></section>}
      <footer className="footer"><a className="brand" href="#top"><span className="brand-mark">R</span><span>Rollcall<span className="brand-dot">.</span></span></a><span>Student identity, owned by the student.</span><span>Ethereum Sepolia · <a href={`${contractChain?.explorer}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">Contract ↗</a></span></footer>
    </main>
  );
}

export default App;
