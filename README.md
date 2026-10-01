# Wallet Assignment dApps

Two independent React + Vite + ethers frontends for Ethereum Sepolia contracts.

## Student registry

The `wallet-assignment1/` project connects to `StudentRegistration` at `0xa551cb621e1b7b2350049d842bf73C1c4e89a126`. Students can register, see their record, and view known student profiles. Directory reads use the provided Multicall2 `aggregate` method. Set `VITE_MULTICALL2_ADDRESS` if the deployment used for the assignment differs from the default Sepolia Multicall2 address. The contract has no student enumeration or registration event, so the directory is built from the connected address, manually added addresses, and addresses imported from the explorer.

## Crowdfunding

The `crowdfunding-dapp/` project connects to `crowdFunding` at `0x0B14BDDb6890202147D35C80C4C285165643D642`. It supports campaign creation, ERC-20 contributions, milestone approval and withdrawal, cancellation, and refunds. See that app's README for contract rules and milestone event reconstruction details.

## Run locally

Install and run each app separately:

```sh
cd wallet-assignment1 && npm install && npm run dev
```

```sh
cd crowdfunding-dapp && npm install && npm run dev
```

Build using `npm run build` from either project directory. Both project roots include a Vercel configuration. Create two Vercel projects linked to this GitHub repository and set their **Root Directory** to `wallet-assignment1` and `crowdfunding-dapp`, respectively. Use the Vite preset and the included build configuration.

Both contracts are on Ethereum Sepolia. A wallet needs Sepolia ETH for gas; contributors also need the ERC-20 token accepted by a campaign. The crowdfunding contract's deployment block is configurable in `crowdfunding-dapp/src/constants/crowdfunding.js` to limit milestone event queries.
