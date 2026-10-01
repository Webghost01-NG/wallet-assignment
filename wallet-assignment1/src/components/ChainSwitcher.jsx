import { SUPPORTED_CHAINS } from "../constants/chains";

export default function ChainSwitcher({ chainId, onSwitch }) {
  return (
    <div className="chain-switcher">
      <select aria-label="Switch network" value={chainId || ""} onChange={(event) => { const chain = SUPPORTED_CHAINS.find((item) => item.id === Number(event.target.value)); if (chain) onSwitch(chain); }}>
        {SUPPORTED_CHAINS.map((chain) => <option key={chain.id} value={chain.id}>{chain.name}{chain.id === chainId ? " ✓" : ""}</option>)}
      </select>
    </div>
  );
}
