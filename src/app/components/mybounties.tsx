"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatEther } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { GraphQLClient, gql } from "graphql-request";

import FlashBountyAbi from "../../../FlashBounty.json";

const CONTRACT_ADDRESS = "0x0d6484Ae57198Fe38d8EFcD45338cFfda58C2D64" as const;
const GRAPHQL_ENDPOINT =
  "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FlashBounty/1.0.0/gn";

const USER_BOUNTIES_QUERY = gql`
  query GetUserBounties($userAddress: String!) {
    # Bounties posted by the user
    bountyPosteds(
      where: { poster: $userAddress }
      orderBy: timestamp_
      orderDirection: desc
    ) {
      bountyId
      poster
      description
      category
      stakeAmount
      tipAmount
      deadline
      timestamp_
    }
    
    # Bounties claimed by the user (as worker)
    bountyClaimeds(
      where: { worker: $userAddress }
      orderBy: timestamp_
      orderDirection: desc
    ) {
      bountyId
      worker
      stakeAmount
      timestamp_
    }
    
    # Bounties completed by the user (as worker) - for earnings calculation
    workerCompletedBounties: bountyCompleteds(
      where: { worker: $userAddress }
      orderBy: timestamp_
      orderDirection: desc
    ) {
      bountyId
      poster
      worker
      stakeRefund
      tipPaid
      timestamp_
    }
    
    # All completed bounties (to check status of posted bounties)
    allCompletedBounties: bountyCompleteds(
      orderBy: timestamp_
      orderDirection: desc
    ) {
      bountyId
      poster
      worker
      stakeRefund
      tipPaid
      timestamp_
    }
    
    # All bounty submissions (to check status and get proof data)
    bountySubmitteds(
      orderBy: timestamp_
      orderDirection: desc
    ) {
      bountyId
      worker
      proofHash
      timestamp_
    }
    
    # All claims (to check which posted bounties are claimed)
    allBountyClaims: bountyClaimeds(
      orderBy: timestamp_
      orderDirection: desc
    ) {
      bountyId
      worker
      stakeAmount
      timestamp_
    }
  }
`;

type PostedBounty = {
  bountyId: string;
  poster: string;
  description: string;
  category: string;
  stakeAmount: string;
  tipAmount: string;
  deadline: string;
  timestamp_: string;
};

type ClaimedBounty = {
  bountyId: string;
  worker: string;
  stakeAmount: string;
  timestamp_: string;
};

type CompletedBounty = {
  bountyId: string;
  poster: string;
  worker: string;
  stakeRefund: string;
  tipPaid: string;
  timestamp_: string;
};

type SubmittedBounty = {
  bountyId: string;
  worker: string;
  proofHash: string;
  timestamp_: string;
};

const categoryIcons = {
  errand: "🏃",
  chore: "🧹",
  creative: "🎨",
  tech: "💻",
  writing: "✍️",
  research: "🔬",
  other: "📦",
};

const categoryNames = {
  errand: "Errand",
  chore: "Chore",
  creative: "Creative",
  tech: "Tech",
  writing: "Writing",
  research: "Research",
  other: "Other",
};

// Helper function to safely format ether values
const safeFormatEther = (value: string | number, fallback: string = "0.00"): string => {
  try {
    if (!value || value === "0") {
      return "0.00";
    }
    
    // Convert to string if it's a number
    const valueStr = value.toString();
    
    // Check if it's a valid number string
    if (!/^\d+$/.test(valueStr)) {
      console.warn("Invalid value for formatting:", value);
      return fallback;
    }
    
    const bigIntValue = BigInt(valueStr);
    const etherValue = parseFloat(formatEther(bigIntValue));
    
    if (etherValue < 0.001 && etherValue > 0) {
      return etherValue.toFixed(6);
    }
    
    return etherValue.toFixed(2);
  } catch (error) {
    console.error("Error formatting ether value:", value, error);
    return fallback;
  }
};

export default function MyBountiesPage() {
  const { address, isConnected } = useAccount();
  const [postedBounties, setPostedBounties] = useState<PostedBounty[]>([]);
  const [claimedBounties, setClaimedBounties] = useState<ClaimedBounty[]>([]);
  const [completedBounties, setCompletedBounties] = useState<CompletedBounty[]>([]);
  const [submittedBounties, setSubmittedBounties] = useState<SubmittedBounty[]>([]);
  const [allCompletedBounties, setAllCompletedBounties] = useState<CompletedBounty[]>([]);
  const [allBountyClaims, setAllBountyClaims] = useState<ClaimedBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"posted" | "claimed" | "completed">("posted");
  const [completingBounty, setCompletingBounty] = useState<string | null>(null);

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    async function fetchUserBounties() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const client = new GraphQLClient(GRAPHQL_ENDPOINT);
        const data = await client.request<{
          bountyPosteds: PostedBounty[];
          bountyClaimeds: ClaimedBounty[];
          workerCompletedBounties: CompletedBounty[];
          allCompletedBounties: CompletedBounty[];
          bountySubmitteds: SubmittedBounty[];
          allBountyClaims: ClaimedBounty[];
        }>(USER_BOUNTIES_QUERY, { userAddress: address.toLowerCase() });

        console.log("Fetched data:", data); // Debug log

        setPostedBounties(data.bountyPosteds);
        setClaimedBounties(data.bountyClaimeds);
        setCompletedBounties(data.workerCompletedBounties);
        setAllCompletedBounties(data.allCompletedBounties);
        setSubmittedBounties(data.bountySubmitteds);
        setAllBountyClaims(data.allBountyClaims);
      } catch (e: any) {
        console.error("Error fetching bounties:", e);
        setError(e.message || "Failed to fetch user bounties.");
      } finally {
        setLoading(false);
      }
    }

    fetchUserBounties();
  }, [address, isSuccess]);

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

  const getBountyStatus = (bounty: PostedBounty) => {
    const now = Date.now() / 1000;
    const deadline = parseInt(bounty.deadline);
    
    // Check if this bounty has been completed
    const completion = allCompletedBounties.find(c => c.bountyId === bounty.bountyId);
    if (completion) return "completed";
    
    // Check if this bounty has been submitted
    const submission = submittedBounties.find(s => s.bountyId === bounty.bountyId);
    if (submission) return "submitted";
    
    // Check if this bounty has been claimed
    const claim = allBountyClaims.find(c => c.bountyId === bounty.bountyId);
    if (claim) return "claimed";

    if (now > deadline) return "expired";
    return "open";
  };

  const getBountySubmission = (bountyId: string) => {
    return submittedBounties.find(s => s.bountyId === bountyId);
  };

  const handleCompleteBounty = async (bountyId: string) => {
    try {
      setCompletingBounty(bountyId);
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FlashBountyAbi.abi,
        functionName: "completeBounty",
        args: [BigInt(bountyId)],
      });
    } catch (err: any) {
      console.error("Failed to complete bounty:", err);
      setCompletingBounty(null);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setCompletingBounty(null);
    }
  }, [isSuccess]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-purple-500/20">
            <span className="text-purple-400 text-4xl">🔗</span>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 text-lg">
            Please connect your wallet to view your bounty portfolio
          </p>
        </motion.div>
      </div>
    );
  }

  // Calculate comprehensive metrics
  const now = Date.now() / 1000;
  
  // Posted bounties metrics
  const totalPostedBounties = postedBounties.length;
  const activePostedBounties = postedBounties.filter(bounty => {
    const status = getBountyStatus(bounty);
    return status !== "completed" && status !== "expired";
  });
  const completedPostedBounties = postedBounties.filter(bounty => {
    const status = getBountyStatus(bounty);
    return status === "completed";
  });
  
  // For the "Posted" tab, show ALL posted bounties, not just active ones
  const displayPostedBounties = postedBounties;

  // Claimed bounties metrics
  const totalClaimedBounties = claimedBounties.length;
  const activeClaims = claimedBounties.filter(claim => {
    const completion = allCompletedBounties.find(c => 
      c.bountyId === claim.bountyId && 
      c.worker.toLowerCase() === address?.toLowerCase()
    );
    return !completion;
  });

  // Completed work metrics
  const totalCompletedWork = completedBounties.length;
  const totalEarnings = completedBounties.reduce((sum, bounty) => {
    const tipValue = parseFloat(safeFormatEther(bounty.tipPaid, "0"));
    return sum + tipValue;
  }, 0);

  // Stake metrics
  const totalStakedAmount = activeClaims.reduce((sum, bounty) => {
    const stakeValue = parseFloat(safeFormatEther(bounty.stakeAmount, "0"));
    return sum + stakeValue;
  }, 0);

  // Success rate
  const completionRate = totalClaimedBounties > 0 
    ? Math.round((totalCompletedWork / totalClaimedBounties) * 100)
    : 0;

  // Average earnings per completed task
  const avgEarningsPerTask = totalCompletedWork > 0 
    ? totalEarnings / totalCompletedWork 
    : 0;

  // Pending submissions
  const pendingSubmissions = submittedBounties.filter(sub => {
    const completion = allCompletedBounties.find(c => c.bountyId === sub.bountyId);
    return !completion;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-4">
            My Bounty Portfolio
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Your comprehensive dashboard for managing bounties, tracking progress, and monitoring earnings
          </p>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Posted Bounties */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-purple-600/30 rounded-xl flex items-center justify-center">
                <span className="text-purple-400 text-2xl">📝</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-400">{totalPostedBounties}</div>
                <div className="text-purple-300 text-sm">Posted</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Active</span>
                <span className="text-purple-300 font-medium">{activePostedBounties.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Completed</span>
                <span className="text-green-400 font-medium">{completedPostedBounties.length}</span>
              </div>
            </div>
          </div>

          {/* Claimed Tasks */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-blue-600/30 rounded-xl flex items-center justify-center">
                <span className="text-blue-400 text-2xl">🎯</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-400">{totalClaimedBounties}</div>
                <div className="text-blue-300 text-sm">Claimed</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">In Progress</span>
                <span className="text-blue-300 font-medium">{activeClaims.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Success Rate</span>
                <span className="text-green-400 font-medium">{completionRate}%</span>
              </div>
            </div>
          </div>

          {/* Earnings & Rewards */}
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-800/20 rounded-2xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-green-600/30 rounded-xl flex items-center justify-center">
                <span className="text-green-400 text-2xl">💰</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {totalEarnings < 0.001 && totalEarnings > 0
                    ? totalEarnings.toFixed(6)
                    : totalEarnings.toFixed(2)}
                </div>
                <div className="text-green-300 text-sm">USDC Earned</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Avg/Task</span>
                <span className="text-green-300 font-medium">
                  {avgEarningsPerTask < 0.001 && avgEarningsPerTask > 0
                    ? avgEarningsPerTask.toFixed(6)
                    : avgEarningsPerTask.toFixed(2)} USDC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tasks Done</span>
                <span className="text-green-400 font-medium">{totalCompletedWork}</span>
              </div>
            </div>
          </div>

          {/* Stakes & Commitments */}
          <div className="bg-gradient-to-br from-yellow-600/20 to-orange-800/20 rounded-2xl p-6 border border-yellow-500/30 hover:border-yellow-400/50 transition-all backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-yellow-600/30 rounded-xl flex items-center justify-center">
                <span className="text-yellow-400 text-2xl">🔒</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">
                  {totalStakedAmount < 0.001 && totalStakedAmount > 0
                    ? totalStakedAmount.toFixed(6)
                    : totalStakedAmount.toFixed(2)}
                </div>
                <div className="text-yellow-300 text-sm">USDC Staked</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Active Stakes</span>
                <span className="text-yellow-300 font-medium">{activeClaims.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pending Review</span>
                <span className="text-orange-400 font-medium">{pendingSubmissions}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Activity Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-green-600/10 rounded-2xl p-6 border border-gray-700/50 mb-8 backdrop-blur-sm"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">📊 Activity Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-400 text-2xl">⚡</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{activePostedBounties.length + activeClaims.length}</div>
              <div className="text-gray-400 text-sm">Active Tasks</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 text-2xl">📈</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{completionRate}%</div>
              <div className="text-gray-400 text-sm">Success Rate</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-400 text-2xl">🎖️</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{totalCompletedWork}</div>
              <div className="text-gray-400 text-sm">Completed</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-400 text-2xl">⏳</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{pendingSubmissions}</div>
              <div className="text-gray-400 text-sm">Pending</div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-2xl p-3 border border-gray-700/50 inline-flex gap-2 backdrop-blur-sm">
            {[
              {
                key: "posted",
                label: "My Bounties",
                icon: "📝",
                count: totalPostedBounties, // Show total posted bounties count
                color: "purple"
              },
              {
                key: "claimed",
                label: "Working On",
                icon: "🎯",
                count: activeClaims.length,
                color: "blue"
              },
              {
                key: "completed",
                label: "Completed",
                icon: "✅",
                count: totalCompletedWork,
                color: "green"
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.key
                    ? `bg-gradient-to-r from-${tab.color}-600 to-${tab.color}-700 text-white shadow-lg transform scale-105`
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline font-semibold">{tab.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === tab.key 
                    ? "bg-white/20 text-white" 
                    : "bg-gray-600/50 text-gray-300"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-16"
          >
            <div className="flex items-center gap-4 text-purple-400">
              <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xl font-medium">Loading your portfolio...</span>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-8 text-center mb-8 backdrop-blur-sm"
          >
            <div className="text-red-400 text-2xl font-semibold mb-3">⚠️ Error Loading Portfolio</div>
            <p className="text-red-300 text-lg">{error}</p>
          </motion.div>
        )}

        {/* Write Error */}
        {writeError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-8 text-center mb-8 backdrop-blur-sm"
          >
            <div className="text-red-400 text-2xl font-semibold mb-3">⚠️ Transaction Error</div>
            <p className="text-red-300 text-lg">{writeError.message}</p>
          </motion.div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Posted Bounties Tab */}
            {activeTab === "posted" && (
              <div className="space-y-6">
                {displayPostedBounties.length === 0 && !loading ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-600/30 to-purple-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-purple-400 text-4xl">📝</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      No Posted Bounties
                    </h3>
                    <p className="text-gray-400 text-lg">
                      Start creating bounties to build your portfolio
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {displayPostedBounties.map((bounty, index) => {
                      const status = getBountyStatus(bounty);
                      const timeRemaining = getTimeRemaining(bounty.deadline);
                      const submission = getBountySubmission(bounty.bountyId);

                      return (
                        <motion.div
                          key={bounty.bountyId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -8, transition: { duration: 0.3 } }}
                          className="group bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl border-2 border-purple-500/30 hover:border-purple-400/60 shadow-xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                        >
                          {/* Card Header */}
                          <div className="p-6 border-b border-purple-500/20">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-600/30 to-purple-800/30 rounded-xl flex items-center justify-center text-2xl backdrop-blur-sm">
                                  {categoryIcons[
                                    bounty.category as keyof typeof categoryIcons
                                  ] || "📦"}
                                </div>
                                <div>
                                  <div className="text-purple-400 font-bold text-lg">
                                    Bounty #{bounty.bountyId}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="px-3 py-1 bg-gradient-to-r from-purple-600/20 to-purple-700/20 text-purple-300 text-xs font-medium rounded-full border border-purple-500/30">
                                      {categoryNames[
                                        bounty.category as keyof typeof categoryNames
                                      ] || "Other"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`px-3 py-2 rounded-lg text-xs font-semibold mb-3 ${
                                    status === "expired"
                                      ? "bg-gradient-to-r from-red-600/30 to-red-700/30 text-red-300 border border-red-500/30"
                                      : status === "submitted"
                                      ? "bg-gradient-to-r from-yellow-600/30 to-yellow-700/30 text-yellow-300 border border-yellow-500/30"
                                      : status === "claimed"
                                      ? "bg-gradient-to-r from-blue-600/30 to-blue-700/30 text-blue-300 border border-blue-500/30"
                                      : "bg-gradient-to-r from-green-600/30 to-green-700/30 text-green-300 border border-green-500/30"
                                  }`}
                                >
                                  {status.toUpperCase()}
                                </div>
                                <span className="text-xs font-mono bg-purple-600/10 text-purple-300 px-3 py-1 rounded-lg border border-purple-500/30">
                                  {new Date(Number(bounty.timestamp_) * 1000).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-6">
                            <p className="text-gray-300 text-sm mb-6 line-clamp-2 leading-relaxed">
                              {bounty.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-gradient-to-br from-green-600/10 to-green-700/10 rounded-xl p-4 border border-green-600/20">
                                <div className="text-xs text-gray-400 mb-2">Tip Amount</div>
                                <div className="text-green-400 font-bold text-lg">
                                  {safeFormatEther(bounty.tipAmount)} USDC
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-yellow-600/10 to-yellow-700/10 rounded-xl p-4 border border-yellow-600/20">
                                <div className="text-xs text-gray-400 mb-2">Required Stake</div>
                                <div className="text-yellow-400 font-bold text-lg">
                                  {safeFormatEther(bounty.stakeAmount)} USDC
                                </div>
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/30 mb-6">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 font-medium">Time remaining</span>
                                <span className={`font-bold ${
                                  timeRemaining === "Expired" ? "text-red-400" : "text-blue-400"
                                }`}>
                                  {timeRemaining}
                                </span>
                              </div>
                            </div>

                            {/* Proof Submission Section */}
                            {submission && (
                              <div className="bg-gradient-to-br from-yellow-600/10 to-orange-600/10 rounded-xl p-6 border border-yellow-600/20 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <span className="text-yellow-400 text-xl">📄</span>
                                    <span className="text-yellow-400 font-bold text-lg">Proof Submitted</span>
                                  </div>
                                  <span className="text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-lg">
                                    {new Date(Number(submission.timestamp_) * 1000).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div className="mb-4">
                                  <div className="text-xs text-gray-400 mb-2">Worker</div>
                                  <div className="text-yellow-400 text-sm font-mono bg-yellow-600/10 px-3 py-2 rounded-lg border border-yellow-600/20">
                                    {submission.worker.slice(0, 8)}...{submission.worker.slice(-6)}
                                  </div>
                                </div>
                                <div className="mb-6">
                                  <div className="text-xs text-gray-400 mb-3">Proof Link</div>
                                  <a
                                    href={submission.proofHash.startsWith('http') ? submission.proofHash : `https://${submission.proofHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 hover:from-yellow-600/30 hover:to-orange-600/30 text-yellow-300 hover:text-yellow-200 px-4 py-3 rounded-xl text-sm font-medium transition-all border border-yellow-600/30 hover:border-yellow-500/50 shadow-lg hover:shadow-yellow-500/20"
                                  >
                                    <span className="text-lg">🔗</span>
                                    <span className="font-semibold">View Submission</span>
                                    <span className="text-xs">↗</span>
                                  </a>
                                </div>
                                {status === "submitted" && (
                                  <button
                                    onClick={() => handleCompleteBounty(bounty.bountyId)}
                                    disabled={isPending || isConfirming || completingBounty === bounty.bountyId}
                                    className="w-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-300 hover:text-green-200 px-6 py-3 rounded-xl text-sm font-bold transition-all border border-green-600/30 hover:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/20"
                                  >
                                    {(isPending || isConfirming) && completingBounty === bounty.bountyId ? (
                                      <div className="flex items-center justify-center gap-3">
                                        <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Processing...</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-3">
                                        <span className="text-lg">✅</span>
                                        <span>Complete Bounty</span>
                                      </div>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Claimed Bounties Tab */}
            {activeTab === "claimed" && (
              <div className="space-y-6">
                {activeClaims.length === 0 && !loading ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-600/30 to-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-blue-400 text-4xl">🎯</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      No Active Claimed Bounties
                    </h3>
                    <p className="text-gray-400 text-lg">
                      Start claiming bounties to grow your earnings
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {activeClaims.map((bounty, index) => (
                      <motion.div
                        key={bounty.bountyId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        className="group bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl border-2 border-blue-500/30 hover:border-blue-400/60 shadow-xl hover:shadow-blue-500/20 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                      >
                        {/* Card Header */}
                        <div className="p-6 border-b border-blue-500/20">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-blue-600/30 to-blue-800/30 rounded-xl flex items-center justify-center text-2xl">
                                <span className="text-blue-400">🎯</span>
                              </div>
                              <div>
                                <div className="text-blue-400 font-bold text-lg">
                                  Bounty #{bounty.bountyId}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="px-3 py-1 bg-gradient-to-r from-blue-600/20 to-blue-700/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                                    Working On
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="px-3 py-2 rounded-lg text-xs font-semibold mb-3 bg-gradient-to-r from-yellow-600/30 to-yellow-700/30 text-yellow-300 border border-yellow-500/30">
                                IN PROGRESS
                              </div>
                              <span className="text-xs font-mono bg-blue-600/10 text-blue-300 px-3 py-1 rounded-lg border border-blue-500/30">
                                {new Date(Number(bounty.timestamp_) * 1000).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6">
                          <div className="bg-gradient-to-br from-yellow-600/10 to-orange-600/10 rounded-xl p-4 border border-yellow-600/20 mb-6">
                            <div className="text-xs text-gray-400 mb-2">Your Staked Amount</div>
                            <div className="text-yellow-400 font-bold text-xl">
                              {safeFormatEther(bounty.stakeAmount)} USDC
                            </div>
                            <div className="text-xs text-yellow-300 mt-2">🔒 Locked until completion</div>
                          </div>

                          <div className="flex items-center justify-center">
                            <button className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-300 hover:text-green-200 px-6 py-3 rounded-xl text-sm font-bold transition-all border border-green-600/30 hover:border-green-500/50 shadow-lg hover:shadow-green-500/20">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">📤</span>
                                <span>Submit Proof</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Completed Bounties Tab */}
            {activeTab === "completed" && (
              <div className="space-y-6">
                {completedBounties.length === 0 && !loading ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-green-600/30 to-green-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-green-400 text-4xl">✅</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      No Completed Work Yet
                    </h3>
                    <p className="text-gray-400 text-lg">
                      Complete bounties to build your success record
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {completedBounties.map((bounty, index) => (
                      <motion.div
                        key={bounty.bountyId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        className="group bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl border-2 border-green-500/30 hover:border-green-400/60 shadow-xl hover:shadow-green-500/20 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                      >
                        {/* Card Header */}
                        <div className="p-6 border-b border-green-500/20">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-green-600/30 to-green-800/30 rounded-xl flex items-center justify-center text-2xl">
                                <span className="text-green-400">✅</span>
                              </div>
                              <div>
                                <div className="text-green-400 font-bold text-lg">
                                  Bounty #{bounty.bountyId}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="px-3 py-1 bg-gradient-to-r from-green-600/20 to-green-700/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                                    Completed Task
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="px-3 py-2 rounded-lg text-xs font-semibold mb-3 bg-gradient-to-r from-green-600/30 to-green-700/30 text-green-300 border border-green-500/30">
                                COMPLETED
                              </div>
                              <span className="text-xs font-mono bg-green-600/10 text-green-300 px-3 py-1 rounded-lg border border-green-500/30">
                                {new Date(Number(bounty.timestamp_) * 1000).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-blue-600/10 to-blue-700/10 rounded-xl p-4 border border-blue-600/20">
                              <div className="text-xs text-gray-400 mb-2">Stake Refunded</div>
                              <div className="text-blue-400 font-bold text-lg">
                                {safeFormatEther(bounty.stakeRefund)} USDC
                              </div>
                              <div className="text-xs text-blue-300 mt-1">🔓 Unlocked</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-600/10 to-green-700/10 rounded-xl p-4 border border-green-600/20">
                              <div className="text-xs text-gray-400 mb-2">Tip Earned</div>
                              <div className="text-green-400 font-bold text-lg">
                                {safeFormatEther(bounty.tipPaid)} USDC
                              </div>
                              <div className="text-xs text-green-300 mt-1">💰 Received</div>
                            </div>
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600/0 via-green-600/5 to-green-600/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Enhanced Performance Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <div className="bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-green-600/10 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
            <h3 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
              🚀 Performance Analytics
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <span className="text-purple-400 text-3xl">📊</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {completionRate}%
                </div>
                <div className="text-gray-400 text-sm font-medium">Success Rate</div>
                <div className="text-xs text-purple-400 mt-2">Tasks completed successfully</div>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <span className="text-green-400 text-3xl">💰</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {totalEarnings < 0.001 && totalEarnings > 0
                    ? totalEarnings.toFixed(6)
                    : totalEarnings.toFixed(2)}
                </div>
                <div className="text-gray-400 text-sm font-medium">Total USDC</div>
                <div className="text-xs text-green-400 mt-2">Lifetime earnings</div>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <span className="text-blue-400 text-3xl">📈</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {avgEarningsPerTask < 0.001 && avgEarningsPerTask > 0
                    ? avgEarningsPerTask.toFixed(6)
                    : avgEarningsPerTask.toFixed(2)}
                </div>
                <div className="text-gray-400 text-sm font-medium">Avg/Task</div>
                <div className="text-xs text-blue-400 mt-2">Mean earning per task</div>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
                  <span className="text-yellow-400 text-3xl">⚡</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {totalStakedAmount < 0.001 && totalStakedAmount > 0
                    ? totalStakedAmount.toFixed(6)
                    : totalStakedAmount.toFixed(2)}
                </div>
                <div className="text-gray-400 text-sm font-medium">Active Stakes</div>
                <div className="text-xs text-yellow-400 mt-2">USDC currently staked</div>
              </div>
            </div>

            {/* Platform Features */}
            <div className="mt-12 pt-8 border-t border-gray-700/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-300">
                <div className="text-center">
                  <div className="font-bold text-white mb-2 text-lg">🔒 Secure Escrow</div>
                  <div className="leading-relaxed">Smart contracts ensure safe transactions and automatic payments</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white mb-2 text-lg">⚡ Instant Payments</div>
                  <div className="leading-relaxed">Get paid immediately upon successful task completion</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white mb-2 text-lg">🌍 Global Network</div>
                  <div className="leading-relaxed">Connect with employers and workers from around the world</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}