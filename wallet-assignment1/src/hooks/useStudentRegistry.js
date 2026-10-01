import { useCallback, useEffect, useState } from "react";
import {
  BrowserProvider,
  Contract,
  Interface,
  getAddress,
  isAddress,
} from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_CHAIN_ID,
  CONTRACT_CONFIGURED,
  STUDENT_ABI,
  MULTICALL3_ADDRESS,
  MULTICALL3_ABI,
  EXPLORER_API_KEY,
} from "../constants/studentRegistry";

const studentIface = new Interface(STUDENT_ABI);
const LIST_KEY = `studentAddresses:${CONTRACT_CHAIN_ID}:${CONTRACT_ADDRESS}`;

function loadSavedAddresses() {
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY)) ?? [];
  } catch {
    return [];
  }
}

function friendlyError(err) {
  if (err?.code === "ACTION_REJECTED") return "You rejected the transaction.";
  return (
    err?.reason ??
    err?.shortMessage ??
    "Something went wrong. Check the console for details."
  );
}

export function useStudentRegistry({ rawProvider, account, chainId }) {
  // true only when wallet is connected, on the contract's chain, and configured
  const ready =
    Boolean(rawProvider && account) &&
    chainId === CONTRACT_CHAIN_ID &&
    CONTRACT_CONFIGURED;

  const [me, setMe] = useState(null); // { registered, name, age, course }
  const [meLoading, setMeLoading] = useState(false);
  const [meError, setMeError] = useState("");

  const [addresses, setAddresses] = useState(loadSavedAddresses);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");

  const [txStatus, setTxStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [tick, setTick] = useState(0);

  // keep the address list saved between visits
  useEffect(() => {
    localStorage.setItem(LIST_KEY, JSON.stringify(addresses));
  }, [addresses]);

  const addAddresses = useCallback((list) => {
    setAddresses((prev) => {
      const next = [...prev];
      for (const a of list) {
        if (!isAddress(a)) continue;
        const checksummed = getAddress(a);
        if (!next.includes(checksummed)) next.push(checksummed);
      }
      return next.length === prev.length ? prev : next;
    });
  }, []);

  // manual add from the input box; returns true if the address was valid
  const addAddress = useCallback(
    (text) => {
      if (!isAddress(text)) {
        setStudentsError("That is not a valid address.");
        return false;
      }
      setStudentsError("");
      addAddresses([text]);
      return true;
    },
    [addAddresses]
  );

  // ---- View the logged-in user's details ----
  useEffect(() => {
    if (!ready) {
      setMe(null);
      return;
    }
    let cancelled = false;

    (async () => {
      setMeLoading(true);
      setMeError("");
      try {
        const provider = new BrowserProvider(rawProvider);
        const contract = new Contract(CONTRACT_ADDRESS, STUDENT_ABI, provider);

        const isRegistered = await contract.registered(account);
        if (cancelled) return;

        if (!isRegistered) {
          setMe({ registered: false });
          return;
        }

        const [name, age, course] = await contract.getStudent(account);
        if (cancelled) return;

        setMe({ registered: true, name, age: age.toString(), course });
        addAddresses([account]); // a registered user belongs in the list
      } catch (err) {
        console.error(err);
        if (!cancelled) setMeError(friendlyError(err));
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, rawProvider, account, chainId, tick, addAddresses]);

  // ---- Fetch all students with ONE multicall ----
  useEffect(() => {
    if (!ready || addresses.length === 0) {
      setStudents([]);
      return;
    }
    let cancelled = false;

    (async () => {
      setStudentsLoading(true);
      setStudentsError("");
      try {
        const provider = new BrowserProvider(rawProvider);
        const multicall = new Contract(
          MULTICALL3_ADDRESS,
          MULTICALL3_ABI,
          provider
        );

        const calls = addresses.map((addr) => ({
          target: CONTRACT_ADDRESS,
          allowFailure: true, // getStudent reverts for unregistered addresses
          callData: studentIface.encodeFunctionData("getStudent", [addr]),
        }));

        // aggregate3 is payable, so staticCall makes it a read, not a transaction
        const results = await multicall.aggregate3.staticCall(calls);
        if (cancelled) return;

        const list = [];
        results.forEach((result, i) => {
          const [success, returnData] = result;
          if (!success) return; // not registered, skip
          const [name, age, course] = studentIface.decodeFunctionResult(
            "getStudent",
            returnData
          );
          list.push({
            address: addresses[i],
            name,
            age: age.toString(),
            course,
          });
        });
        setStudents(list);
      } catch (err) {
        console.error(err);
        if (!cancelled) setStudentsError(friendlyError(err));
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, rawProvider, addresses, tick]);

  // ---- Optional: find past registrants through the block explorer API ----
  const importFromExplorer = useCallback(async () => {
    setStudentsError("");
    if (!EXPLORER_API_KEY) {
      setStudentsError(
        "Add VITE_EXPLORER_API_KEY to .env.local and restart the dev server."
      );
      return;
    }
    try {
      const url =
        `https://api.etherscan.io/v2/api?chainid=${CONTRACT_CHAIN_ID}` +
        `&module=account&action=txlist&address=${CONTRACT_ADDRESS}` +
        `&startblock=0&endblock=99999999&sort=asc&apikey=${EXPLORER_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!Array.isArray(json.result)) {
        throw new Error(String(json.result ?? json.message));
      }

      const registerSelector = studentIface.getFunction("register").selector;
      const senders = json.result
        .filter((tx) => tx.isError === "0" && tx.input?.startsWith(registerSelector))
        .map((tx) => tx.from);

      addAddresses(senders);
    } catch (err) {
      console.error(err);
      setStudentsError("Explorer import failed: " + (err.message ?? "unknown error"));
    }
  }, [addAddresses]);

  // ---- Register a student ----
  const register = useCallback(
    async ({ name, age, course }) => {
      setFormError("");
      try {
        setTxStatus("Confirm the transaction in your wallet...");
        const signer = await new BrowserProvider(rawProvider).getSigner();
        const contract = new Contract(CONTRACT_ADDRESS, STUDENT_ABI, signer);

        const tx = await contract.register(name, BigInt(age), course);
        setTxStatus("Waiting for confirmation...");
        await tx.wait();

        addAddresses([account]);
        setTick((t) => t + 1); // refresh "my details" and the multicall list
        return true;
      } catch (err) {
        console.error(err);
        setFormError(friendlyError(err));
        return false;
      } finally {
        setTxStatus("");
      }
    },
    [rawProvider, account, addAddresses]
  );

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return {
    ready,
    me,
    meLoading,
    meError,
    students,
    studentsLoading,
    studentsError,
    addressCount: addresses.length,
    txStatus,
    formError,
    register,
    addAddress,
    importFromExplorer,
    refresh,
  };
}
