import { SUPPORTED_CHAINS } from "../constants/chains";

export default function UnsupportedChainBanner({ chainId, onSwitch }) {
  return (
    <div
      style={{
        border: "1px solid #c0392b",
        background: "#fdecea",
        color: "#7b241c",
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <strong>Unsupported chain error:</strong> chain {chainId} is not supported by
      this app.
      <p>Please switch to a supported chain:</p>
      {SUPPORTED_CHAINS.map((chain) => (
        <button
          key={chain.id}
          onClick={() => onSwitch(chain)}
          style={{ marginRight: 8 }}
        >
          Switch to {chain.name}
        </button>
      ))}
    </div>
  );
}