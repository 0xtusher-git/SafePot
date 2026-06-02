"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { BrowserProvider, Signer } from "ethers";
import { getTrustScore } from "./arcGrade";

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isTrusted: boolean;
  trustScore: number | null;
  connect: () => Promise<void>;
  changeWallet: () => Promise<void>;
  disconnect: () => void;
  provider: BrowserProvider | null;
  signer: Signer | null;
  networkError: string | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const ARC_TESTNET_CHAIN_ID = "0x4cef52"; // 5042002 in hex

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTrusted, setIsTrusted] = useState(false);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const p = new BrowserProvider((window as any).ethereum);
      setProvider(p);

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
    } else if (accounts[0] !== address) {
      const newAddress = accounts[0];
      setAddress(newAddress);
      setIsConnected(true);
      await fetchTrustData(newAddress);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const fetchTrustData = async (userAddress: string) => {
    const score = await getTrustScore(userAddress);
    setTrustScore(score);
    setIsTrusted(score !== null && score >= 50);
  };

  const connect = async () => {
    if (!provider) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      setNetworkError(null);
      const network = await provider.getNetwork();
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

      const accounts = await provider.send("eth_requestAccounts", []);
      const userAddress = accounts[0];
      const s = await provider.getSigner();
      
      setAddress(userAddress);
      setSigner(s);
      setIsConnected(true);
      
      await fetchTrustData(userAddress);

    } catch (error) {
      console.error("Error connecting to wallet", error);
      setNetworkError("Failed to connect wallet or switch network.");
    }
  };

  const changeWallet = async () => {
    if (!provider) return;
    try {
      // Force the wallet account picker to appear
      await (window as any).ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      // After user picks an account, fetch the newly selected one
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        const newAddress = accounts[0];
        const s = await provider.getSigner();
        setAddress(newAddress);
        setSigner(s);
        setIsConnected(true);
        await fetchTrustData(newAddress);
      }
    } catch (error) {
      console.error("Change wallet cancelled or failed", error);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    setSigner(null);
    setIsTrusted(false);
    setTrustScore(null);
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
      }}
    >
      {children}
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
