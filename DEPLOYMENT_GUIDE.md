# 🚀 Deploy TimeCapsule Contract to Arc Testnet

## Step 1: Get Arc Testnet USDC

1. Visit Arc Testnet Faucet (if available) or bridge testnet USDC
2. Make sure you have some testnet USDC for gas fees

## Step 2: Create .env File

Create a file named `.env` in the `TimeCapsule/contracts` directory:

```bash
PRIVATE_KEY=your_private_key_without_0x_prefix
```

⚠️ **IMPORTANT**: Never commit this file to git!

## Step 3: Deploy the Contract

Run this command from the `TimeCapsule/contracts` directory:

```bash
npx hardhat run scripts/deploy.js --network arc_testnet
```

## Step 4: Copy the Contract Address

After deployment, you'll see:
```
TimeCapsule deployed to: 0x1234567890abcdef1234567890abcdef12345678
```

**Copy this address!**

## Step 5: Update Frontend

Open `TimeCapsule/frontend/components/TimeCapsuleUI.tsx` and replace:

```typescript
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"
```

With your deployed address:

```typescript
const CONTRACT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678"
```

## Step 6: Test the dApp

1. Refresh your browser
2. Connect your wallet to Arc Testnet
3. Try locking some USDC!

---

## Troubleshooting

**If deployment fails:**
- Check your `.env` file has the correct private key
- Ensure you have testnet USDC for gas
- Verify the RPC URL is working: https://rpc.testnet.arc.network

**If contract address shows 0x000...:**
- You haven't deployed yet - follow steps above
- Or you forgot to update the CONTRACT_ADDRESS in TimeCapsuleUI.tsx
