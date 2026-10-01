# Crowdfunding dApp

React + Vite + ethers v6 frontend for the `crowdFunding` contract on **Ethereum Sepolia**
(`0x0B14BDDb6890202147D35C80C4C285165643D642`).

## Features
- Wallet discovery (EIP-6963) and connection (EIP-1193), live account / chain / balance, disconnect, chain switching
- **Create a campaign**: ERC-20 token, target, deadline, and milestones (amount + Early / Medium / Late)
- **Contribute**: approves the token first when needed (two wallet steps), then calls `contributing`
- **Approve milestones**, **Withdraw** next milestone (creator), **Claim refund**, **Cancel campaign** (creator)
- All campaigns, tokens, and your contributions are loaded with Multicall3 (two multicalls total)
- Buttons only enable when the contract's own rules would let the call succeed; reverts are shown by name

## Run
```bash
npm install
npm run dev
```
Connect a wallet on Ethereum Sepolia. You need Sepolia ETH for gas and an ERC-20 token on Sepolia.

## How the contract's rules map to the UI
| Action | Who | When |
|---|---|---|
| Contribute | anyone | campaign active and before the deadline |
| Approve milestones | anyone | after the deadline; approves in order while funds cover each milestone |
| Withdraw | creator | active, target reached, next milestone approved (one milestone per call) |
| Refund | contributor | campaign cancelled, or deadline passed with target not reached |
| Cancel | creator | campaign active |

## Milestone details
The contract has no getter for milestones, so the app rebuilds them from event logs
(`CampaignCreated`, `milestoneCreated`, `withdrwalSuccessfully`). Approval is derived from
`moneyRaised - moneyavailable`, since milestones are approved in order. If your RPC rejects
the log query, the rest of the app still works; set `DEPLOY_BLOCK` in
`src/constants/crowdfunding.js` to the contract's creation block to narrow the query.
