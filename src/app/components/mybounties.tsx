"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { GraphQLClient, gql } from "graphql-request";
import { formatEther } from "viem";
import { motion, AnimatePresence } from "framer-motion";
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
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-emerald-400 text-4xl">🔗</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 text-lg">
            Please connect your wallet to view your bounties
          </p>
        </motion.div>
      </div>
    );
  }

  // Calculate metrics correctly
  const activePostedBounties = postedBounties.filter(bounty => {
    const status = getBountyStatus(bounty);
    return status !== "completed";
  });

  const activeBountyClaims = claimedBounties.filter(claim => {
    // Only count claims that haven't been completed yet
    const completion = allCompletedBounties.find(c => c.bountyId === claim.bountyId && c.worker.toLowerCase() === address?.toLowerCase());
    return !completion;
  });

  const completedTasksCount = completedBounties.length;

  const totalEarned = completedBounties.reduce((sum, bounty) => {
    const tipValue = parseFloat(safeFormatEther(bounty.tipPaid, "0"));
    return sum + tipValue;
  }, 0);

  const totalStaked = activeBountyClaims.reduce((sum, bounty) => {
    const stakeValue = parseFloat(safeFormatEther(bounty.stakeAmount, "0"));
    return sum + stakeValue;
  }, 0);

  const completionRate = claimedBounties.length > 0 
    ? Math.round((completedBounties.length / claimedBounties.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            My <span className="text-emerald-600">Bounties</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Track your posted bounties, claimed tasks, and completed work
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-xl p-6 border border-emerald-600/30 hover:border-emerald-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-emerald-400 mb-1">
                  {activePostedBounties.length}
                </div>
                <div className="text-gray-400 text-sm">Posted Bounties</div>
                <div className="text-emerald-400 text-xs mt-1">📝 Tasks created</div>
              </div>
              <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center">
                <span className="text-emerald-400 text-xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-6 border border-blue-600/30 hover:border-blue-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {activeBountyClaims.length}
                </div>
                <div className="text-gray-400 text-sm">Claimed Bounties</div>
                <div className="text-blue-400 text-xs mt-1">🎯 Tasks in progress</div>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 text-xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-6 border border-purple-600/30 hover:border-purple-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {completedTasksCount}
                </div>
                <div className="text-gray-400 text-sm">Completed Tasks</div>
                <div className="text-purple-400 text-xs mt-1">✅ Tasks finished</div>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400 text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 rounded-xl p-6 border border-yellow-600/30 hover:border-yellow-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-400 mb-1">
                  {totalEarned < 0.001 && totalEarned > 0
                    ? totalEarned.toFixed(6)
                    : totalEarned.toFixed(2)}{" "}
                  USDC
                </div>
                <div className="text-gray-400 text-sm">Total Earned</div>
                <div className="text-yellow-400 text-xs mt-1">💰 Tips received</div>
              </div>
              <div className="w-12 h-12 bg-yellow-600/20 rounded-full flex items-center justify-center">
                <span className="text-yellow-400 text-xl">💰</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-black/50 rounded-xl p-2 border border-emerald-600/20 inline-flex gap-1">
            {[
              {
                key: "posted",
                label: "Posted Bounties",
                icon: "📝",
                count: activePostedBounties.length,
              },
              {
                key: "claimed",
                label: "Claimed Tasks",
                icon: "🎯",
                count: activeBountyClaims.length,
              },
              {
                key: "completed",
                label: "Completed Work",
                icon: "✅",
                count: completedTasksCount,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-emerald-600/20"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="bg-black/30 text-xs px-2 py-1 rounded-full">
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
            className="flex items-center justify-center py-12"
          >
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg">Loading your bounties...</span>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center mb-8"
          >
            <div className="text-red-400 text-lg font-semibold mb-2">⚠️ Error Loading Bounties</div>
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Write Error */}
        {writeError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center mb-8"
          >
            <div className="text-red-400 text-lg font-semibold mb-2">⚠️ Transaction Error</div>
            <p className="text-red-300">{writeError.message}</p>
          </motion.div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Posted Bounties Tab */}
            {activeTab === "posted" && (
              <div className="space-y-4">
                {activePostedBounties.length === 0 && !loading ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-emerald-400 text-3xl">📝</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Active Posted Bounties
                    </h3>
                    <p className="text-gray-400">
                      You don't have any active bounties posted
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {activePostedBounties.map((bounty, index) => {
                      const status = getBountyStatus(bounty);
                      const timeRemaining = getTimeRemaining(bounty.deadline);
                      const submission = getBountySubmission(bounty.bountyId);

                      console.log(`Bounty ${bounty.bountyId}:`, {
                        tipAmount: bounty.tipAmount,
                        stakeAmount: bounty.stakeAmount,
                        formattedTip: safeFormatEther(bounty.tipAmount),
                        formattedStake: safeFormatEther(bounty.stakeAmount)
                      }); // Debug log

                      return (
                        <motion.div
                          key={bounty.bountyId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -5, transition: { duration: 0.2 } }}
                          className="group bg-gradient-to-br from-black to-gray-900 rounded-xl border-2 border-emerald-600/30 hover:border-emerald-600/60 shadow-lg hover:shadow-emerald-600/20 transition-all duration-300 overflow-hidden"
                        >
                          {/* Card Header */}
                          <div className="p-6 border-b border-emerald-600/20">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center text-xl">
                                  {categoryIcons[
                                    bounty.category as keyof typeof categoryIcons
                                  ] || "📦"}
                                </div>
                                <div>
                                  <div className="text-emerald-400 font-semibold">
                                    Bounty #{bounty.bountyId}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-1 bg-emerald-600/20 text-emerald-400 text-xs font-medium rounded-full">
                                      {categoryNames[
                                        bounty.category as keyof typeof categoryNames
                                      ] || "Other"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`px-2 py-1 rounded text-xs mb-2 ${
                                    status === "expired"
                                      ? "bg-red-900/30 text-red-400"
                                      : status === "submitted"
                                      ? "bg-yellow-900/30 text-yellow-400"
                                      : status === "claimed"
                                      ? "bg-blue-900/30 text-blue-400"
                                      : "bg-green-900/30 text-green-400"
                                  }`}
                                >
                                  {status}
                                </div>
                                <span className="text-xs font-mono bg-emerald-600/10 text-emerald-400 px-2 py-1 rounded">
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
                            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                              {bounty.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-emerald-600/10 rounded-lg p-3 border border-emerald-600/20">
                                <div className="text-xs text-gray-400 mb-1">Tip Amount</div>
                                <div className="text-emerald-400 font-semibold">
                                  {safeFormatEther(bounty.tipAmount)} USDC
                                </div>
                              </div>
                              <div className="bg-yellow-600/10 rounded-lg p-3 border border-yellow-600/20">
                                <div className="text-xs text-gray-400 mb-1">Required Stake</div>
                                <div className="text-yellow-400 font-semibold">
                                  {safeFormatEther(bounty.stakeAmount)} USDC
                                </div>
                              </div>
                            </div>

                            <div className="bg-black/30 rounded-lg p-3 border border-gray-600/20 mb-4">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Time remaining</span>
                                <span className={`font-medium ${
                                  timeRemaining === "Expired" ? "text-red-400" : "text-blue-400"
                                }`}>
                                  {timeRemaining}
                                </span>
                              </div>
                            </div>

                            {/* Proof Submission Section */}
                            {submission && (
                              <div className="bg-yellow-600/10 rounded-lg p-4 border border-yellow-600/20 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-yellow-400 text-sm">📄</span>
                                    <span className="text-yellow-400 font-semibold text-sm">Proof Submitted</span>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {new Date(Number(submission.timestamp_) * 1000).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div className="mb-3">
                                  <div className="text-xs text-gray-400 mb-1">Worker</div>
                                  <div className="text-yellow-400 text-sm font-mono">
                                    {submission.worker.slice(0, 6)}...{submission.worker.slice(-4)}
                                  </div>
                                </div>
                                <div className="mb-4">
                                  <div className="text-xs text-gray-400 mb-2">Proof Link</div>
                                  <a
                                    href={submission.proofHash.startsWith('http') ? submission.proofHash : `https://${submission.proofHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 hover:text-yellow-300 px-3 py-2 rounded-lg text-sm font-medium transition-all border border-yellow-600/30 hover:border-yellow-600/50"
                                  >
                                    <span>🔗</span>
                                    <span>View Proof</span>
                                    <span className="text-xs">↗</span>
                                  </a>
                                </div>
                                {status === "submitted" && (
                                  <button
                                    onClick={() => handleCompleteBounty(bounty.bountyId)}
                                    disabled={isPending || isConfirming || completingBounty === bounty.bountyId}
                                    className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-emerald-600/30 hover:border-emerald-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {(isPending || isConfirming) && completingBounty === bounty.bountyId ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Completing...</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-2">
                                        <span>✅</span>
                                        <span>Complete Bounty</span>
                                      </div>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-emerald-600/5 to-emerald-600/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Claimed Bounties Tab */}
            {activeTab === "claimed" && (
              <div className="space-y-4">
                {activeBountyClaims.length === 0 && !loading ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-blue-400 text-3xl">🎯</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Active Claimed Bounties
                    </h3>
                    <p className="text-gray-400">
                      You don't have any bounties in progress
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {activeBountyClaims.map((bounty, index) => (
                      <motion.div
                        key={bounty.bountyId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="group bg-gradient-to-br from-black to-gray-900 rounded-xl border-2 border-blue-600/30 hover:border-blue-600/60 shadow-lg hover:shadow-blue-600/20 transition-all duration-300 overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="p-6 border-b border-blue-600/20">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="text-blue-400 font-semibold">
                                Bounty #{bounty.bountyId}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full">
                                  Claimed Task
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="px-2 py-1 rounded text-xs bg-yellow-900/30 text-yellow-400 mb-2">
                                In Progress
                              </div>
                              <span className="text-xs font-mono bg-blue-600/10 text-blue-400 px-2 py-1 rounded">
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
                          <div className="bg-yellow-600/10 rounded-lg p-3 border border-yellow-600/20 mb-4">
                            <div className="text-xs text-gray-400 mb-1">Staked Amount</div>
                            <div className="text-yellow-400 font-semibold">
                              {safeFormatEther(bounty.stakeAmount)} USDC
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <button className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-emerald-600/30 hover:border-emerald-600/50">
                              Submit Proof
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
              <div className="space-y-4">
                {completedBounties.length === 0 && !loading ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-purple-400 text-3xl">✅</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Completed Work
                    </h3>
                    <p className="text-gray-400">
                      You haven't completed any bounties yet
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
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="group bg-gradient-to-br from-black to-gray-900 rounded-xl border-2 border-purple-600/30 hover:border-purple-600/60 shadow-lg hover:shadow-purple-600/20 transition-all duration-300 overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="p-6 border-b border-purple-600/20">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="text-purple-400 font-semibold">
                                Bounty #{bounty.bountyId}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs font-medium rounded-full">
                                  Completed Task
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="px-2 py-1 rounded text-xs bg-emerald-900/30 text-emerald-400 mb-2">
                                Completed
                              </div>
                              <span className="text-xs font-mono bg-purple-600/10 text-purple-400 px-2 py-1 rounded">
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
                            <div className="bg-blue-600/10 rounded-lg p-3 border border-blue-600/20">
                              <div className="text-xs text-gray-400 mb-1">Stake Refund</div>
                              <div className="text-blue-400 font-semibold">
                                {safeFormatEther(bounty.stakeRefund)} USDC
                              </div>
                            </div>
                            <div className="bg-emerald-600/10 rounded-lg p-3 border border-emerald-600/20">
                              <div className="text-xs text-gray-400 mb-1">Tip Earned</div>
                              <div className="text-emerald-400 font-semibold">
                                {safeFormatEther(bounty.tipPaid)} USDC
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Performance Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <div className="bg-gradient-to-r from-emerald-600/10 via-transparent to-emerald-600/10 rounded-xl p-6 border border-emerald-600/20">
            <h3 className="text-emerald-400 font-medium mb-6 text-center">💡 Performance Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-emerald-400 text-2xl">📊</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {completionRate}%
                </div>
                <div className="text-gray-400 text-sm">Completion Rate</div>
                <div className="text-xs text-emerald-400 mt-1">Tasks successfully finished</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-yellow-400 text-2xl">💰</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {totalEarned < 0.001 && totalEarned > 0
                    ? totalEarned.toFixed(6)
                    : totalEarned.toFixed(2)}{" "}
                  USDC
                </div>
                <div className="text-gray-400 text-sm">Total Earned</div>
                <div className="text-xs text-yellow-400 mt-1">Cumulative rewards received</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-400 text-2xl">📈</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {completedBounties.length > 0
                    ? (totalEarned / completedBounties.length).toFixed(2)
                    : "0.00"}{" "}
                  USDC
                </div>
                <div className="text-gray-400 text-sm">Average per Task</div>
                <div className="text-xs text-blue-400 mt-1">Mean earning per completion</div>
              </div>
            </div>

            {/* Additional Platform Info */}
            <div className="mt-8 pt-6 border-t border-emerald-600/20">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-300">
                <div className="text-center">
                  <div className="font-medium text-white mb-1">🔒 Secure</div>
                  <div>Smart contract protection for all transactions</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-white mb-1">⚡ Fast</div>
                  <div>Instant payments upon task completion</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-white mb-1">🌍 Global</div>
                  <div>Connect with workers worldwide</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}