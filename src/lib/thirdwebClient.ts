import { createThirdwebClient, defineChain } from "thirdweb";

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "your_client_id_here",
});

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpc: "https://rpc.testnet.arc.network",
  blockExplorers: [{ name: "ArcScan", url: "https://testnet.arcscan.app" }],
});
