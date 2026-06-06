import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/lib/Web3Context";
import { Navbar } from "@/components/Navbar";
import { ThirdwebProvider } from "thirdweb/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SafePot | Trust-Gated Group Savings",
  description: "Group savings powered by Arc Testnet. Only trusted wallets allowed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen flex flex-col">
        <ThirdwebProvider>
          <Web3Provider>
            <Navbar />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </Web3Provider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
