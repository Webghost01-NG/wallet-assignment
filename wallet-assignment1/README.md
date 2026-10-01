# Student Registration dApp

React + Vite + ethers v6 frontend for the `StudentRegistration` contract on **Ethereum Sepolia**
(`0xa551cb621e1b7b2350049d842bf73C1c4e89a126`).

## Features
- Wallet discovery (EIP-6963) and connection (EIP-1193), live account / chain / balance display
- Disconnect, supported-chain list, and chain switching (6 testnets)
- Register a student (`register(name, age, course)`)
- View the logged-in user's details (`registered` + `getStudent`)
- Fetch all registered students in a single **Multicall3** `aggregate3` call

## Run
```bash
npm install
npm run dev
```

Optional: copy `.env.example` to `.env.local` and add an Etherscan API key to enable "Import from explorer".

## Note on "all students"
The contract keeps no list of students and emits no events, so the app builds its address list from:
the connected account, addresses added by hand, and (optionally) past `register` transactions
imported from the block explorer. Those addresses are then read in one multicall.
