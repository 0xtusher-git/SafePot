"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertCircle, Info, X } from "lucide-react";

type TermsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
};

export default function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-16 pb-4 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-forest" />
              Terms & Rules
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <p className="text-sm text-gray-500 font-medium">
              Please carefully read the rules below. You must accept these terms before proceeding with any transaction on SafePot.
            </p>

            <div className="space-y-4">
              {/* Public Groups */}
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" /> PUBLIC GROUPS
                </h3>
                <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1.5 marker:text-blue-400 font-medium">
                  <li>Your contribution is locked in the smart contract — no human controls it.</li>
                  <li>You will never receive the full pot upfront.</li>
                  <li>Your winnings release gradually each round as you keep contributing.</li>
                  <li>If you stop contributing, your remaining winnings stop automatically and return to the group.</li>
                  <li className="font-bold">No refunds once you join.</li>
                </ul>
              </div>

              {/* Private Groups */}
              <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl">
                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> PRIVATE GROUPS
                </h3>
                <ul className="list-disc pl-5 text-sm text-amber-800 space-y-1.5 marker:text-amber-400 font-medium">
                  <li>Winner receives 70% of pot immediately.</li>
                  <li>Remaining 30% releases gradually each round.</li>
                  <li>If you stop contributing, your remaining 30% is lost automatically.</li>
                  <li>The person who invited you is financially responsible for your behavior.</li>
                  <li>If you rug, your inviter loses their held funds.</li>
                  <li className="font-bold">No refunds once you join.</li>
                </ul>
              </div>

              {/* General Rules */}
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-gray-500" /> GENERAL RULES
                </h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5 marker:text-gray-400 font-medium">
                  <li>All transactions are permanent and on-chain — nothing can be reversed.</li>
                  <li>SafePot is built on Arc Testnet — funds are testnet USDC only.</li>
                  <li>Your ArcGrade trust score affects your eligibility for public groups.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <label className="flex items-center gap-3 cursor-pointer mb-5 group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-lg checked:bg-forest checked:border-forest transition-colors cursor-pointer"
                />
                <svg
                  className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                I understand and agree to the Terms & Rules
              </span>
            </label>

            <button
              onClick={() => {
                if (agreed) onAccept();
              }}
              disabled={!agreed}
              className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-md ${
                agreed
                  ? "bg-forest hover:bg-forest/90 text-white hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Confirm & Continue
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
