import { SUPPORTED_CHAINS } from "../constants/chains";

export default function ChainSwitcher({ chainId, onSwitch }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ margin: "0 0 8px" }}>Switch network</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {SUPPORTED_CHAINS.map((chain) => {
          const active = chain.id === chainId;
          return (
            <button
              key={chain.id}
              onClick={() => onSwitch(chain)}
              disabled={active}
              style={{
                borderColor: active ? "#2ecc71" : undefined,
                opacity: active ? 0.7 : 1,
              }}
            >
              {chain.name}
              {active ? " ✓" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}