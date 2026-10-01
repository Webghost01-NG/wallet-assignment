import { useEffect, useState } from "react";

export function useProviderDiscovery() {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    function handleAnnounce(event) {
      const detail = event.detail;

      setProviders((prev) =>
        prev.some((p) => p.info.uuid === detail.info.uuid)
          ? prev
          : [...prev, detail]
      );
    }

    // 1. Listen first
    window.addEventListener("eip6963:announceProvider", handleAnnounce);

    // 2. Then ask every wallet to announce itself
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // 3. Cleanup
    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnounce);
    };
  }, []);

  return providers;
}
