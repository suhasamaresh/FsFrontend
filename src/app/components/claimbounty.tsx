"use client";

import React, { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { motion } from "framer-motion";
import FlashBountyAbi from "../../../FlashBounty.json";

const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual address

const categoryIcons = {
  "errand": "🏃",
  "chore": "🧹", 
  "creative": "🎨",
  "tech": "💻",
  "writing": "✍️",
  "research": "🔬",
  "other": "📦"
};

type BountyDetails = {
  bountyId: string;
  description: string;
  category: string;
  poster: string;
  stakeAmount: string;
  tipAmount: string;
  deadline: string;
  status: string;
};

export default function ClaimBountyPage() {
  const { address, isConnected } = useAccount();
  const [bountyId, setBountyId] = useState("");
  const [selectedBounty, setSelectedBounty] = useState<BountyDetails | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { data: hash, isPending, writeContract } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Mock bounty data - in real app, fetch from subgraph
  const mockBounties: BountyDetails[] = [
    {
      bountyId: "1",
      description: "Deliver groceries from supermarket to downtown apartment. Must handle with care and deliver within 2 hours.",
      category: "errand",
      poster: "0x1234567890123456789012345678901234567890",
      stakeAmount: "10",
      tipAmount: "25",
      deadline: String(Math.floor(Date.now() / 1000) + 86400), // 24 hours from now
      status: "open"
    },
    {
      bountyId: "2", 
      description: "Create a modern logo design for a tech startup. Include source files and multiple format exports.",
      category: "creative",
      poster: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      stakeAmount: "50",
      tipAmount: "150",
      deadline: String(Math.floor(Date.now() / 1000) + 172800), // 48 hours from now
      status: "open"
    },
    {
      bountyId: "3",
      description: "Fix Python script bug causing memory leaks. Code review and testing required.",
      category: "tech", 
      poster: "0x9876543210987654321098765432109876543210",
      stakeAmount: "30",
      tipAmount: "100",
      deadline: String(Math.floor(Date.now() / 1000) + 259200), // 72 hours from now
      status: "open"
    }
  ];

  const handleBountyLookup = () => {
    if (!bountyId.trim()) {
      setError("Please enter a bounty ID");
      return;
    }

    const bounty = mockBounties.find(b => b.bountyId === bountyId);
    if (!bounty) {
      setError("Bounty not found");
      setSelectedBounty(null);
      return;
    }

    if (bounty.status !== "open") {
      setError("This bounty is not available for claiming");
      setSelectedBounty(null);
      return;
    }

    const now = Date.now() / 1000;
    if (now > parseInt(bounty.deadline)) {
      setError("This bounty has expired");
      setSelectedBounty(null);
      return;
    }

    setError("");
    setSelectedBounty(bounty);
  };

  const handleClaimBounty = async () => {
    if (!isConnected) {
      setError("Please connect your wallet");
      return;
    }

    if (!selectedBounty) {
      setError("No bounty selected");
      return;
    }

    if (selectedBounty.poster.toLowerCase() === address?.toLowerCase()) {
      setError("You cannot claim your own bounty");
      return;
    }

    try {
      setError("");
      
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: FlashBountyAbi.abi,
        functionName: "claimBounty",
        args: [parseInt(selectedBounty.bountyId)],
      });
    } catch (err: any) {
      setError(err.message || "Failed to claim bounty");
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const now = Date.now() / 1000;
    const deadlineTime = parseInt(deadline);
    const remaining = deadlineTime - now;
    
    if (remaining <= 0) return "Expired";
    
    const hours = Math.floor(remaining / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(remaining / 60)}m`;
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-white mb-4">Bounty Claimed Successfully!</h2>
          <p className="text-gray-300 mb-6">
            You have successfully claimed bounty #{selectedBounty?.bountyId}. Your stake has been locked.
            Complete the task and submit proof before the deadline to earn the reward.
          </p>
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-400">Transaction Hash:</p>
            <p className="text-emerald-400 font-mono text-sm break-all">{hash}</p>
          </div>
          <button
            onClick={() => {
              setSelectedBounty(null);
              setBountyId("");
              setError("");
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Claim Another Bounty
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Claim a Bounty</h1>
          <p className="text-gray-400 text-lg">
            Stake USDC to claim bounties and earn rewards upon completion
          </p>
        </div>

        {/* Bounty Lookup */}
        <div className="bg-gray-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Find Bounty</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="bountyId" className="block text-sm font-medium text-gray-300 mb-2">
                Bounty ID
              </label>
              <input
                id="bountyId"
                type="text"
                value={bountyId}
                onChange={(e) => setBountyId(e.target.value)}
                placeholder="Enter bounty ID (e.g., 1, 2, 3)"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleBountyLookup}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Lookup
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Available Bounties Preview */}
        <div className="bg-gray-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Available Bounties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockBounties.map((bounty) => (
              <div
                key={bounty.bountyId}
                onClick={() => {
                  setBountyId(bounty.bountyId);
                  setSelectedBounty(bounty);
                  setError("");
                }}
                className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600 hover:border-emerald-500/50"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-xl">
                    {categoryIcons[bounty.category as keyof typeof categoryIcons]}
                  </div>
                  <div>
                    <div className="text-emerald-400 font-semibold">#{bounty.bountyId}</div>
                    <div className="text-xs text-gray-400 capitalize">{bounty.category}</div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                  {bounty.description}
                </p>
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-400">{bounty.stakeAmount} USDC stake</span>
                  <span className="text-emerald-400">{bounty.tipAmount} USDC tip</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {getTimeRemaining(bounty.deadline)} remaining
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bounty Details */}
        {selectedBounty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Bounty Details</h2>
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">
                    {categoryIcons[selectedBounty.category as keyof typeof categoryIcons]}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">Bounty #{selectedBounty.bountyId}</div>
                    <div className="text-emerald-400 capitalize">{selectedBounty.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Time Remaining</div>
                  <div className="text-lg font-semibold text-white">
                    {getTimeRemaining(selectedBounty.deadline)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                <p className="text-gray-300 leading-relaxed bg-gray-700 p-4 rounded-lg">
                  {selectedBounty.description}
                </p>
              </div>

              {/* Posted By */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Posted By</h3>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-emerald-400 font-mono">
                    {selectedBounty.poster.slice(0, 6)}...{selectedBounty.poster.slice(-4)}
                  </div>
                  <div className="text-sm text-gray-400">
                    Posted on {new Date(Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Financial Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg">
                    <div className="text-yellow-400 font-semibold">Required Stake</div>
                    <div className="text-2xl font-bold text-white">{selectedBounty.stakeAmount} USDC</div>
                    <div className="text-xs text-gray-400">You must stake to claim</div>
                  </div>
                  <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-lg">
                    <div className="text-emerald-400 font-semibold">Tip Amount</div>
                    <div className="text-2xl font-bold text-white">{selectedBounty.tipAmount} USDC</div>
                    <div className="text-xs text-gray-400">Payment upon completion</div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                    <div className="text-blue-400 font-semibold">Total Payout</div>
                    <div className="text-2xl font-bold text-white">
                      {parseFloat(selectedBounty.stakeAmount) + parseFloat(selectedBounty.tipAmount)} USDC
                    </div>
                    <div className="text-xs text-gray-400">Stake refund + tip</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-gray-700">
                <button
                  onClick={handleClaimBounty}
                  disabled={!isConnected || isPending || isConfirming}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  {isPending || isConfirming ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isPending ? "Claiming..." : "Confirming..."}</span>
                    </div>
                  ) : (
                    `Claim Bounty (Stake ${selectedBounty.stakeAmount} USDC)`
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* How It Works */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">How Claiming Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-400 font-semibold mb-1">1. Stake</div>
              <div className="text-gray-300">Stake required USDC to claim the bounty</div>
            </div>
            <div>
              <div className="text-blue-400 font-semibold mb-1">2. Complete</div>
              <div className="text-gray-300">Finish the task before the deadline</div>
            </div>
            <div>
              <div className="text-blue-400 font-semibold mb-1">3. Submit</div>
              <div className="text-gray-300">Submit proof of completion</div>
            </div>
            <div>
              <div className="text-blue-400 font-semibold mb-1">4. Earn</div>
              <div className="text-gray-300">Get your stake back plus the tip</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}