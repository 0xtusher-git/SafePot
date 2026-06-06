"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { BrowserProvider, JsonRpcProvider, Signer } from "ethers";
import { getTrustScore } from "./arcGrade";
import { motion, AnimatePresence } from "framer-motion";
import { User, CheckCircle2 } from "lucide-react";

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isTrusted: boolean;
  trustScore: number | null;
  connect: () => Promise<void>;
  changeWallet: () => Promise<void>;
  disconnect: () => void;
  provider: BrowserProvider | JsonRpcProvider | null;
  signer: Signer | null;
  networkError: string | null;
  displayNames: Record<string, string>;
  setDisplayName: (address: string, name: string) => void;
  loginMethod: "metamask" | "thirdweb" | null;
  userEmail: string | null;
}

import { useActiveAccount, useActiveWallet, useActiveWalletChain, useDisconnect } from "thirdweb/react";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { getUserEmail } from "thirdweb/wallets/in-app";
import { client } from "./thirdwebClient";

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const ARC_TESTNET_CHAIN_ID = "0x4cef52"; // 5042002 in hex

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTrusted, setIsTrusted] = useState(false);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<"metamask" | "thirdweb" | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [mmAddress, setMmAddress] = useState<string | null>(null);
  const [mmSigner, setMmSigner] = useState<Signer | null>(null);
  const [mmProvider, setMmProvider] = useState<BrowserProvider | null>(null);

  const thirdwebAccount = useActiveAccount();
  const thirdwebWallet = useActiveWallet();
  const thirdwebChain = useActiveWalletChain();
  const { disconnect: disconnectThirdweb } = useDisconnect();
  
  const [displayNames, setDisplayNamesState] = useState<Record<string, string>>({});
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [draftName, setDraftName] = useState("");

  // Load names from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("safepot_displayNames");
      if (stored) {
        setDisplayNamesState(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load display names", e);
    }
  }, []);

  const setDisplayName = (userAddress: string, name: string) => {
    const updated = { ...displayNames, [userAddress.toLowerCase()]: name };
    setDisplayNamesState(updated);
    try {
      localStorage.setItem("safepot_displayNames", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save display names", e);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const p = new BrowserProvider((window as any).ethereum);
      setMmProvider(p);

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      (window as any).ethereum.on("chainChanged", handleChainChanged);
    }
    return () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
        (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else if (accounts[0] !== mmAddress) {
      const newAddress = accounts[0];
      setMmAddress(newAddress);
      
      if (mmProvider) {
        try {
          const s = await mmProvider.getSigner();
          setMmSigner(s);
        } catch (e) {
          console.error("Failed to get mm signer", e);
        }
      }
    }
  };

  const checkNamePrompt = (userAddress: string) => {
    setDisplayNamesState((current) => {
      if (!current[userAddress.toLowerCase()]) {
        setShowNamePrompt(true);
      }
      return current;
    });
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  useEffect(() => {
    let active = true;

    if (thirdwebAccount && thirdwebChain) {
      (async () => {
        try {
          const [s, email] = await Promise.all([
            ethers6Adapter.signer.toEthers({ client, chain: thirdwebChain, account: thirdwebAccount }),
            getUserEmail({ client }),
          ]);
          if (!active) return;
          setAddress(thirdwebAccount.address);
          setSigner(s as unknown as Signer);
          setProvider(new JsonRpcProvider("https://rpc.testnet.arc.network"));
          setIsConnected(true);
          setLoginMethod("thirdweb");
          setUserEmail(email ?? null);
          fetchTrustData(thirdwebAccount.address);
          checkNamePrompt(thirdwebAccount.address);
        } catch (err) {
          console.error("Failed to get Thirdweb signer", err);
        }
      })();
    } else if (mmAddress && mmSigner) {
      setAddress(mmAddress);
      setSigner(mmSigner);
      setProvider(mmProvider);
      setIsConnected(true);
      setLoginMethod("metamask");
      fetchTrustData(mmAddress);
      checkNamePrompt(mmAddress);
    } else {
      setAddress(null);
      setSigner(null);
      setProvider(mmProvider);
      setIsConnected(false);
      setLoginMethod(null);
      setUserEmail(null);
      setTrustScore(null);
      setIsTrusted(false);
    }

    return () => {
      active = false;
    };
  }, [thirdwebAccount, thirdwebChain, mmAddress, mmSigner, mmProvider]);

  const fetchTrustData = async (userAddress: string) => {
    const score = await getTrustScore(userAddress);
    setTrustScore(score);
    setIsTrusted(score !== null && score >= 50);
  };

  const connect = async () => {
    if (!mmProvider) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      setNetworkError(null);
      const network = await mmProvider.getNetwork();
      if (network.chainId !== BigInt(5042002)) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ARC_TESTNET_CHAIN_ID }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: ARC_TESTNET_CHAIN_ID,
                  chainName: "Arc Testnet",
                  rpcUrls: ["https://rpc.testnet.arc.network"],
                  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      const accounts = await mmProvider.send("eth_requestAccounts", []);
      const userAddress = accounts[0];
      const s = await mmProvider.getSigner();
      
      setMmAddress(userAddress);
      setMmSigner(s);

    } catch (error) {
      console.error("Error connecting to wallet", error);
      setNetworkError("Failed to connect wallet or switch network.");
    }
  };

  const changeWallet = async () => {
    if (!mmProvider) return;
    try {
      // Force the wallet account picker to appear
      await (window as any).ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      // After user picks an account, fetch the newly selected one
      const accounts = await mmProvider.send("eth_accounts", []);
      if (accounts.length > 0) {
        const newAddress = accounts[0];
        const s = await mmProvider.getSigner();
        setMmAddress(newAddress);
        setMmSigner(s);
      }
    } catch (error) {
      console.error("Change wallet cancelled or failed", error);
    }
  };

  const disconnect = () => {
    if (loginMethod === "thirdweb" && thirdwebWallet) {
      disconnectThirdweb(thirdwebWallet);
    }
    setMmAddress(null);
    setMmSigner(null);
    setAddress(null);
    setIsConnected(false);
    setSigner(null);
    setIsTrusted(false);
    setTrustScore(null);
    setLoginMethod(null);
    setUserEmail(null);
  };

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected,
        isTrusted,
        trustScore,
        connect,
        changeWallet,
        disconnect,
        provider,
        signer,
        networkError,
        displayNames,
        setDisplayName,
        loginMethod,
        userEmail,
      }}
    >
      {children}

      <AnimatePresence>
        {showNamePrompt && address && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100"
            >
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-7 h-7 text-forest" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-2">Welcome to SafePot!</h2>
              <p className="text-gray-500 text-sm text-center mb-6 font-medium">
                Set a display name so your friends can recognize you in savings groups.
              </p>
              
              <div className="mb-6">
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="e.g. Tusher, John, Alice"
                  maxLength={20}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all font-bold text-center text-lg"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNamePrompt(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    if (draftName.trim()) {
                      setDisplayName(address, draftName.trim());
                      setShowNamePrompt(false);
                    }
                  }}
                  disabled={!draftName.trim()}
                  className="flex-[2] bg-forest hover:bg-forest/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Save Name
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
