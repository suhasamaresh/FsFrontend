"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatEther } from "viem";
import { GraphQLClient, gql } from "graphql-request";

const GRAPHQL_ENDPOINT = "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FlashBounty/1.0.0/gn";

const BOUNTY_DETAILS_QUERY = gql`
  query GetBountyDetails($bountyId: String!) {
    bountyPosteds(where: { bountyId: $bountyId }) {
      bountyId
      poster
      description
      category
      stakeAmount
      tipAmount
      deadline
      timestamp
      transactionHash
    }
    bountyClaimeds(where: { bountyId: $bountyId }) {
      bountyId
      worker
      stakeAmount
      timestamp
      transactionHash
    }
    bountySubmitteds(where: { bountyId: $bountyId }) {
      bountyId
      worker
      proofHash
      timestamp
      transactionHash
    }
    bountyCompleteds(where: { bountyId: $bountyId }) {
      bountyId
      poster
      worker
      stakeRefund
      tipPaid
      timestamp
      transactionHash
    }
  }
`;

type BountyPosted = {
  bountyId: string;
  poster: string;
  description: string;
  category: string;
  stakeAmount: string;
  tipAmount: string;
  deadline: string;
  timestamp: string;
  transactionHash: string;
};

type BountyClaimed = {
  bountyId: string;
  worker: string;
  stakeAmount: string;
  timestamp: string;
  transactionHash: string;
};

type BountySubmitted = {
  bountyId: string;
  worker: string;
  proofHash: string;
  timestamp: string;
  transactionHash: string;
};

type BountyCompleted = {
  bountyId: string;
  poster: string;
  worker: string;
  stakeRefund: string;
  tipPaid: string;
  timestamp: string;
  transactionHash: string;
};

const categoryIcons = {
  "errand": "🏃",
  "chore": "🧹", 
  "creative": "🎨",
  "tech": "💻",
  "writing": "✍️",
  "research": "🔬",
  "other": "📦"
};

const categoryNames = {
  "errand": "Errand",
  "chore": "Chore", 
  "creative": "Creative",
  "tech": "Tech",
  "writing": "Writing",
  "research": "Research",
  "other": "Other"
};

export default function BountyDetailsPage() {
  const [bountyId, setBountyId] = useState("");
  const [bountyPosted, setBountyPosted] = useState<BountyPosted | null>(null);
  const [bountyClaimed, setBountyClaimed] = useState<BountyClaimed | null>(null);
  const [bountySubmitted, setBountySubmitted] = useState<BountySubmitted | null>(null);
  const [bountyCompleted, setBountyCompleted] = useState<BountyCompleted | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBountyDetails = async (id: string) => {
    if (!id.trim()) {
      setError("Please enter a bounty ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const client = new GraphQLClient(GRAPHQL_ENDPOINT);
      const data = await client.request<{
        bountyPosteds: BountyPosted[];
        bountyClaimeds: BountyClaimed[];
        bountySubmitteds: BountySubmitted[];
        bountyCompleteds: BountyCompleted[];
      }>(BOUNTY_DETAILS_QUERY, { bountyId: id });

      if (data.bountyPosteds.length === 0) {
        setError("Bounty not found");
        setBountyPosted(null);
        setBountyClaimed(null);
        setBountySubmitted(null);
        setBountyCompleted(null);
        return;
      }

      setBountyPosted(data.bountyPosteds[0]);
      setBountyClaimed(data.bountyClaimeds[0] || null);
      setBountySubmitted(data.bountySubmitteds[0] || null);
      setBountyCompleted(data.bountyCompleteds[0] || null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch bounty details");
    } finally {
      setLoading(false);
    }
  };

  const getBountyStatus = () => {
    if (bountyCompleted) return "completed";
    if (bountySubmitted) return "submitted";
    if (bountyClaimed) return "claimed";
    if (bountyPosted) {
      const now = Date.now() / 1000;
      const deadline = parseInt(bountyPosted.deadline);
      if (now > deadline) return "expired";
      return "open";
    }
    return "unknown";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-500";
      case "claimed": return "bg-yellow-500";
      case "submitted": return "bg-blue-500";
      case "completed": return "bg-emerald-500";
      case "expired": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open": return "Open";
      case "claimed": return "Claimed";
      case "submitted": return "Submitted";
      case "completed": return "Completed";
      case "expired": return "Expired"; 
      default: return "Unknown";
    }
  };

  // Mock data for demo
  const mockBountyIds = ["1", "2", "3", "4", "5"];

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Bounty Details</h1>
          <p className="text-gray-400 text-lg">
            View detailed information about any bounty on the platform
          </p>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-xl p-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                onClick={() => fetchBountyDetails(bountyId)}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {loading ? "Loading..." : "Search"}
              </button>
            </div>
          </div>

          {/* Quick Access */}
          <div>
            <div className="text-sm text-gray-400 mb-3">Quick Access:</div>
            <div className="flex flex-wrap gap-2">
              {mockBountyIds.map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setBountyId(id);
                    fetchBountyDetails(id);
                  }}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
                >
                  Bounty #{id}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Bounty Details */}
        {bountyPosted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Main Info */}
            <div className="bg-gray-800 rounded-xl p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">
                    {categoryIcons[bountyPosted.category as keyof typeof categoryIcons] || "📦"}
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">Bounty #{bountyPosted.bountyId}</div>
                    <div className="text-emerald-400 text-lg">
                      {categoryNames[bountyPosted.category as keyof typeof categoryNames] || "Other"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(getBountyStatus())}`}>
                    <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                    {getStatusText(getBountyStatus())}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    {getTimeRemaining(bountyPosted.deadline)} remaining
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                  <p className="text-gray-300 leading-relaxed bg-gray-700 p-4 rounded-lg">
                    {bountyPosted.description}
                  </p>
                </div>

                {/* Financial Details */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Financial Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg">
                      <div className="text-yellow-400 font-semibold">Required Stake</div>
                      <div className="text-2xl font-bold text-white">
                        {(() => {
                          try {
                            const value = parseFloat(formatEther(BigInt(bountyPosted.stakeAmount)));
                            return value < 0.001 ? value.toFixed(6) : value.toFixed(2);
                          } catch (error) {
                            return '0.00';
                          }
                        })()} USDC
                      </div>
                    </div>
                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-lg">
                      <div className="text-emerald-400 font-semibold">Tip Amount</div>
                      <div className="text-2xl font-bold text-white">
                        {(() => {
                          try {
                            const value = parseFloat(formatEther(BigInt(bountyPosted.tipAmount)));
                            return value < 0.001 ? value.toFixed(6) : value.toFixed(2);
                          } catch (error) {
                            return '0.00';
                          }
                        })()} USDC
                      </div>
                    </div>
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                      <div className="text-blue-400 font-semibold">Total Payout</div>
                      <div className="text-2xl font-bold text-white">
                        {(() => {
                          try {
                            const stake = parseFloat(formatEther(BigInt(bountyPosted.stakeAmount)));
                            const tip = parseFloat(formatEther(BigInt(bountyPosted.tipAmount)));
                            const total = stake + tip;
                            return total < 0.001 ? total.toFixed(6) : total.toFixed(2);
                          } catch (error) {
                            return '0.00';
                          }
                        })()} USDC
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Timeline</h3>
                  <div className="space-y-4">
                    {/* Posted */}
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">Bounty Posted</div>
                        <div className="text-gray-400 text-sm">
                          {new Date(parseInt(bountyPosted.timestamp) * 1000).toLocaleString()}
                        </div>
                        <div className="text-gray-400 text-sm">
                          By {bountyPosted.poster.slice(0, 6)}...{bountyPosted.poster.slice(-4)}
                        </div>
                      </div>
                    </div>

                    {/* Claimed */}
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        bountyClaimed ? "bg-yellow-500" : "bg-gray-600"
                      }`}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${bountyClaimed ? "text-white" : "text-gray-500"}`}>
                          Bounty Claimed
                        </div>
                        {bountyClaimed ? (
                          <>
                            <div className="text-gray-400 text-sm">
                              {new Date(parseInt(bountyClaimed.timestamp) * 1000).toLocaleString()}
                            </div>
                            <div className="text-gray-400 text-sm">
                              By {bountyClaimed.worker.slice(0, 6)}...{bountyClaimed.worker.slice(-4)}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500 text-sm">Not claimed yet</div>
                        )}
                      </div>
                    </div>

                    {/* Submitted */}
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        bountySubmitted ? "bg-blue-500" : "bg-gray-600"
                      }`}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${bountySubmitted ? "text-white" : "text-gray-500"}`}>
                          Proof Submitted
                        </div>
                        {bountySubmitted ? (
                          <>
                            <div className="text-gray-400 text-sm">
                              {new Date(parseInt(bountySubmitted.timestamp) * 1000).toLocaleString()}
                            </div>
                            <div className="text-gray-400 text-sm">
                              IPFS: {bountySubmitted.proofHash.slice(0, 12)}...
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500 text-sm">Not submitted yet</div>
                        )}
                      </div>
                    </div>

                    {/* Completed */}
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        bountyCompleted ? "bg-emerald-500" : "bg-gray-600"
                      }`}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${bountyCompleted ? "text-white" : "text-gray-500"}`}>
                          Bounty Completed
                        </div>
                        {bountyCompleted ? (
                          <>
                            <div className="text-gray-400 text-sm">
                              {new Date(parseInt(bountyCompleted.timestamp) * 1000).toLocaleString()}
                            </div>
                            <div className="text-gray-400 text-sm">
                              Reward paid to {bountyCompleted.worker.slice(0, 6)}...{bountyCompleted.worker.slice(-4)}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500 text-sm">Not completed yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Hashes */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Transaction History</h3>
                  <div className="space-y-2">
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-sm text-gray-400">Posted Transaction</div>
                      <div className="text-emerald-400 font-mono text-sm break-all">
                        {bountyPosted.transactionHash}
                      </div>
                    </div>
                    {bountyClaimed && (
                      <div className="bg-gray-700 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Claimed Transaction</div>
                        <div className="text-yellow-400 font-mono text-sm break-all">
                          {bountyClaimed.transactionHash}
                        </div>
                      </div>
                    )}
                    {bountySubmitted && (
                      <div className="bg-gray-700 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Submitted Transaction</div>
                        <div className="text-blue-400 font-mono text-sm break-all">
                          {bountySubmitted.transactionHash}
                        </div>
                      </div>
                    )}
                    {bountyCompleted && (
                      <div className="bg-gray-700 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Completed Transaction</div>
                        <div className="text-emerald-400 font-mono text-sm break-all">
                          {bountyCompleted.transactionHash}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Section */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Bounty Lifecycle</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-400 font-semibold mb-1">1. Posted</div>
              <div className="text-gray-300">Bounty created with tip escrowed</div>
            </div>
            <div>
              <div className="text-blue-400 font-semibold mb-1">2. Claimed</div>
              <div className="text-gray-300">Worker stakes USDC to claim task</div>
            </div>
            <div>
              <div className="text-blue-400 font-semibold mb-1">3. Submitted</div>
              <div className="text-gray-300">Worker submits proof of completion</div>
            </div>
            <div>
              <div className="text-blue-400 font-semibold mb-1">4. Completed</div>
              <div className="text-gray-300">Worker receives stake + tip</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}