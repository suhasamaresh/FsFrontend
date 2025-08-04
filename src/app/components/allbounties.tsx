"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { GraphQLClient, gql } from "graphql-request";
import FlashBountyAbi from "../../../FlashBounty.json";

const GRAPHQL_ENDPOINT = "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FlashBounty/1.0.0/gn";
const CONTRACT_ADDRESS = "0x0d6484Ae57198Fe38d8EFcD45338cFfda58C2D64" as const;
const USDC_ADDRESS = "0x4C2AA252BEe766D3399850569713b55178934849" as const;

const BOUNTIES_QUERY = gql`
  query GetAllBounties($first: Int!, $skip: Int!, $orderBy: String!, $orderDirection: String!, $where: BountyPosted_filter) {
    bountyPosteds(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
      bountyId
      poster
      description
      category
      stakeAmount
      tipAmount
      deadline
    }
    bountyClaimeds(first: 1000) {
      bountyId
      worker
    }
    bountyCompleteds(first: 1000) {
      bountyId
      worker
    }
    bountyCancelleds(first: 1000) {
      bountyId
      poster
    }
    bountySubmitteds(first: 1000) {
      bountyId
      worker
    }
  }
`;

type Bounty = {
  bountyId: string;
  poster: string;
  description: string;
  category: string;
  stakeAmount: string;
  tipAmount: string;
  deadline: string;
  timestamp: string;
};

type BountyEvent = {
  bountyId: string;
  worker?: string;
  poster?: string;
  timestamp: string;
};

const categoryIcons = {
  "errand": "🏃‍♂️",
  "chore": "🧹", 
  "creative": "🎨",
  "tech": "💻",
  "writing": "✍️",
  "research": "🔬",
  "other": "📦"
};

const categoryNames = {
  "errand": "Quick Errands",
  "chore": "Home & Chores", 
  "creative": "Creative Work",
  "tech": "Tech & Code",
  "writing": "Content Writing",
  "research": "Research Tasks",
  "other": "Miscellaneous"
};

const statusStyles = {
  "open": {
    bg: "bg-gradient-to-br from-emerald-600/20 to-emerald-800/20",
    border: "border-emerald-600/30",
    text: "text-emerald-400",
    hoverBorder: "hover:border-emerald-600/60"
  },
  "claimed": {
    bg: "bg-gradient-to-br from-amber-600/20 to-amber-800/20",
    border: "border-amber-600/30",
    text: "text-amber-400",
    hoverBorder: "hover:border-amber-600/60"
  },
  "submitted": {
    bg: "bg-gradient-to-br from-blue-600/20 to-blue-800/20",
    border: "border-blue-600/30",
    text: "text-blue-400",
    hoverBorder: "hover:border-blue-600/60"
  },
  "completed": {
    bg: "bg-gradient-to-br from-emerald-600/20 to-green-800/20",
    border: "border-emerald-600/30",
    text: "text-emerald-400",
    hoverBorder: "hover:border-emerald-600/60"
  },
  "cancelled": {
    bg: "bg-gradient-to-br from-red-600/20 to-red-800/20",
    border: "border-red-600/30",
    text: "text-red-400",
    hoverBorder: "hover:border-red-600/60"
  },
  "expired": {
    bg: "bg-gradient-to-br from-gray-600/20 to-gray-800/20",
    border: "border-gray-600/30",
    text: "text-gray-400",
    hoverBorder: "hover:border-gray-600/60"
  }
};

// Helper function to safely format USDC amounts
const formatUSDCAmount = (amount: string): string => {
  try {
    if (!amount || amount === '0') return '0.00';
    const value = parseFloat(formatUnits(BigInt(amount), 6));
    return value < 0.001 ? value.toFixed(6) : value.toFixed(2);
  } catch (error) {
    console.error('Error formatting amount:', amount, error);
    return '0.00';
  }
};

export default function AllBountiesPage() {
  const { address, isConnected } = useAccount();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [claimedBounties, setClaimedBounties] = useState<BountyEvent[]>([]);
  const [completedBounties, setCompletedBounties] = useState<BountyEvent[]>([]);
  const [cancelledBounties, setCancelledBounties] = useState<BountyEvent[]>([]);
  const [submittedBounties, setSubmittedBounties] = useState<BountyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [sortBy, _setSortBy] = useState("tipAmount");
  
  // Claim bounty state
  const [claimingBountyId, setClaimingBountyId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string>("");
  const [needsApproval, setNeedsApproval] = useState<Record<string, boolean>>({});

  // Contract hooks
  const { data: claimHash, isPending: isClaimPending, writeContract: writeClaim } = useWriteContract();
  const { data: approvalHash, isPending: isApprovePending, writeContract: writeApproval } = useWriteContract();
  
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // Read USDC allowance
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!address }
  });

  useEffect(() => {
    async function fetchBounties() {
      try {
        setLoading(true);
        setError(null);

        const client = new GraphQLClient(GRAPHQL_ENDPOINT);
        
        const variables = {
          first: 50,
          skip: 0,
          orderBy: sortBy,
          orderDirection: sortOrder,
          where: filter !== "all" ? { category: filter } : {}
        };

        const data = await client.request<{ 
          bountyPosteds: Bounty[],
          bountyClaimeds: BountyEvent[],
          bountyCompleteds: BountyEvent[],
          bountyCancelleds: BountyEvent[],
          bountySubmitteds: BountyEvent[]
        }>(BOUNTIES_QUERY, variables);
        
        setBounties(data.bountyPosteds);
        setClaimedBounties(data.bountyClaimeds);
        setCompletedBounties(data.bountyCompleteds);
        setCancelledBounties(data.bountyCancelleds);
        setSubmittedBounties(data.bountySubmitteds);
      } catch (e: any) {
        setError(e.message || "Failed to fetch bounties.");
      } finally {
        setLoading(false);
      }
    }

    fetchBounties();
  }, [filter, sortBy, sortOrder]);

  // Check approval status for all bounties
  useEffect(() => {
    if (bounties.length > 0 && usdcAllowance !== undefined) {
      const approvalStatus: Record<string, boolean> = {};
      bounties.forEach(bounty => {
        try {
          const stakeAmountWei = BigInt(bounty.stakeAmount);
          approvalStatus[bounty.bountyId] = usdcAllowance < stakeAmountWei;
        } catch {
          approvalStatus[bounty.bountyId] = true;
        }
      });
      setNeedsApproval(approvalStatus);
    }
  }, [bounties, usdcAllowance]);

  // Refetch allowance after approval success
  useEffect(() => {
    if (isApprovalSuccess) {
      refetchAllowance();
    }
  }, [isApprovalSuccess, refetchAllowance]);

  // Reset claiming state on success and refetch data
  useEffect(() => {
    if (isClaimSuccess) {
      setClaimingBountyId(null);
      setClaimError("");
      // Refetch bounties to update the UI
      const refetch = async () => {
        try {
          const client = new GraphQLClient(GRAPHQL_ENDPOINT);
          const variables = {
            first: 50,
            skip: 0,
            orderBy: sortBy,
            orderDirection: sortOrder,
            where: filter !== "all" ? { category: filter } : {}
          };
          const data = await client.request<{ 
            bountyPosteds: Bounty[],
            bountyClaimeds: BountyEvent[],
            bountyCompleteds: BountyEvent[],
            bountyCancelleds: BountyEvent[],
            bountySubmitteds: BountyEvent[]
          }>(BOUNTIES_QUERY, variables);
          
          setBounties(data.bountyPosteds);
          setClaimedBounties(data.bountyClaimeds);
          setCompletedBounties(data.bountyCompleteds);
          setCancelledBounties(data.bountyCancelleds);
          setSubmittedBounties(data.bountySubmitteds);
        } catch (e: any) {
          console.error("Failed to refetch bounties:", e);
        }
      };
      // Wait a bit for the subgraph to index the new event
      setTimeout(refetch, 3000);
    }
  }, [isClaimSuccess, filter, sortBy, sortOrder]);

  // Get actual bounty status based on events
  const getBountyStatus = (bounty: Bounty): string => {
    const now = Date.now() / 1000;
    const deadline = parseInt(bounty.deadline);
    
    // Check if bounty is completed
    if (completedBounties.some(cb => cb.bountyId === bounty.bountyId)) {
      return "completed";
    }
    
    // Check if bounty is cancelled
    if (cancelledBounties.some(cb => cb.bountyId === bounty.bountyId)) {
      return "cancelled";
    }
    
    // Check if bounty is submitted
    if (submittedBounties.some(sb => sb.bountyId === bounty.bountyId)) {
      return "submitted";
    }
    
    // Check if bounty is claimed
    if (claimedBounties.some(cb => cb.bountyId === bounty.bountyId)) {
      return "claimed";
    }
    
    // Check if expired
    if (now > deadline) {
      return "expired";
    }
    
    // Otherwise it's open
    return "open";
  };

  // Get worker address for claimed bounties
  const getBountyWorker = (bountyId: string): string | null => {
    const claimedBounty = claimedBounties.find(cb => cb.bountyId === bountyId);
    return claimedBounty?.worker || null;
  };

  // Handle USDC approval for staking
  const handleApprove = async (bounty: Bounty) => {
    if (!isConnected) {
      setClaimError("Please connect your wallet");
      return;
    }

    try {
      setClaimError("");
      const stakeAmountWei = BigInt(bounty.stakeAmount);
      
      writeApproval({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, stakeAmountWei],
      });
    } catch (err: any) {
      console.error("Approval error:", err);
      setClaimError(err.message || "Failed to approve USDC");
    }
  };

  // Handle bounty claim
  const handleClaimBounty = async (bounty: Bounty) => {
    if (!isConnected) {
      setClaimError("Please connect your wallet");
      return;
    }

    // Check if user is the poster
    if (address?.toLowerCase() === bounty.poster.toLowerCase()) {
      setClaimError("You cannot claim your own bounty");
      return;
    }

    // Check USDC balance
    if (usdcBalance !== undefined) {
      try {
        const stakeAmountWei = BigInt(bounty.stakeAmount);
        if (usdcBalance < stakeAmountWei) {
          setClaimError(`Insufficient USDC balance. You need ${formatUnits(stakeAmountWei, 6)} USDC to stake`);
          return;
        }
      } catch {
        setClaimError("Invalid stake amount");
        return;
      }
    }

    // Check if approval is needed
    if (needsApproval[bounty.bountyId]) {
      setClaimError("Please approve USDC spending first");
      return;
    }

    try {
      setClaimError("");
      setClaimingBountyId(bounty.bountyId);

      console.log("Claiming bounty:", {
        bountyId: bounty.bountyId,
        stakeAmount: bounty.stakeAmount,
        contractAddress: CONTRACT_ADDRESS
      });

      writeClaim({
        address: CONTRACT_ADDRESS,
        abi: FlashBountyAbi.abi,
        functionName: "claimBounty",
        args: [BigInt(bounty.bountyId)],
      });

    } catch (err: any) {
      console.error("Claim error:", err);
      
      let errorMessage = "Failed to claim bounty";
      if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas or token transfer";
      } else if (err.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected";
      } else if (err.message?.includes("execution reverted")) {
        errorMessage = "Transaction failed - bounty may no longer be available";
      } else if (err.cause?.message) {
        errorMessage = err.cause.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setClaimError(errorMessage);
      setClaimingBountyId(null);
    }
  };

  const filteredBounties = bounties.filter(bounty =>
    bounty.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bounty.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBounties = bounties.length;
  const totalValue = bounties.reduce((sum, bounty) => {
    try {
      return sum + parseFloat(formatUnits(BigInt(bounty.tipAmount), 6));
    } catch (error) {
      console.error('Error parsing tipAmount:', bounty.tipAmount, error);
      return sum;
    }
  }, 0);

  const getTimeRemaining = (deadline: string) => {
    const now = Date.now() / 1000;
    const deadlineTime = parseInt(deadline);
    const remaining = deadlineTime - now;
    
    if (remaining <= 0) return "Expired";
    
    const hours = Math.floor(remaining / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return `${Math.floor(remaining / 60)}m remaining`;
  };

  function setSortBy(value: string): void {
    _setSortBy(value);
  }

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
            Discover <span className="text-emerald-600">Bounties</span>
          </h1>
          <p className="text-gray-400">Explore premium micro-task opportunities from our vibrant community</p>
        </motion.div>

        {/* Wallet Connection Status */}
        {!isConnected && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-xl p-6 border border-amber-600/30 hover:border-amber-600/50 transition-all mb-8"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-amber-600/20 rounded-full flex items-center justify-center">
                <span className="text-amber-400 text-xl">🔗</span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-amber-400 mb-1">Connect Your Wallet</h3>
                <p className="text-gray-300">Please connect your wallet to claim bounties and start earning!</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-xl p-6 border border-emerald-600/30 hover:border-emerald-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-400 mb-1">{totalBounties}</div>
                <div className="text-gray-400 text-sm">Total Bounties</div>
                <div className="text-xs text-emerald-400/70 mt-1">Active, Claimed & Completed</div>
              </div>
              <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center">
                <span className="text-emerald-400 text-xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-6 border border-blue-600/30 hover:border-blue-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  ${totalValue < 0.001 ? totalValue.toFixed(6) : totalValue.toFixed(2)}
                </div>
                <div className="text-gray-400 text-sm">Total Rewards</div>
                <div className="text-xs text-blue-400/70 mt-1">USDC available to earn</div>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-6 border border-purple-600/30 hover:border-purple-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {new Set(bounties.map(b => b.poster)).size}
                </div>
                <div className="text-gray-400 text-sm">Active Creators</div>
                <div className="text-xs text-purple-400/70 mt-1">Building opportunities</div>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400 text-xl">👥</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* USDC Balance Display */}
        {isConnected && usdcBalance !== undefined && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl p-6 border border-green-600/30 hover:border-green-600/50 transition-all mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                  <span className="text-green-400 text-xl">💳</span>
                </div>
                <div>
                  <div className="text-green-400 font-medium">Your USDC Balance</div>
                  <div className="text-gray-400 text-sm">Available for staking</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-300">
                {formatUnits(usdcBalance, 6)} USDC
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search bounties, categories, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 border border-emerald-600/30 rounded-xl px-5 py-4 pl-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600/50 transition-all"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <select
              aria-label="Sort bounties"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/50 border border-emerald-600/30 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600/50 appearance-none pr-10"
            >
              <option value="tipAmount">💰 Highest Rewards</option>
              <option value="stakeAmount">🎯 Highest Stakes</option>
              <option value="deadline">⏰ Ending Soon</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-3 bg-black/50 border border-emerald-600/30 rounded-xl text-white hover:bg-emerald-600/20 hover:border-emerald-600/50 transition-all"
              title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
            >
              <motion.div
                animate={{ rotate: sortOrder === "asc" ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </motion.div>
            </button>
          </div>

          {/* Category Filter */}
          <div className="bg-black/50 rounded-xl p-2 border border-emerald-600/20 inline-flex gap-1 mx-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                filter === "all" 
                  ? "bg-emerald-600 text-white shadow-lg" 
                  : "text-gray-400 hover:text-white hover:bg-emerald-600/20"
              }`}
            >
              <span>✨</span>
              All Categories
            </button>
            
            {Object.entries(categoryIcons).map(([value, icon]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  filter === value
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-emerald-600/20"
                }`}
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{categoryNames[value as keyof typeof categoryNames]}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Success Modal */}
        <AnimatePresence>
          {isClaimSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-emerald-600/20 to-green-800/20 rounded-xl p-8 max-w-md w-full border border-emerald-600/30"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-emerald-400 text-3xl">🎉</span>
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-400 mb-4">Bounty Claimed Successfully!</h3>
                  <p className="text-gray-300 mb-6">
                    Congratulations! You have successfully claimed the bounty. Your stake has been escrowed and you can now work on completing the task.
                  </p>
                  <div className="bg-black/50 p-4 rounded-lg mb-6 border border-emerald-600/20">
                    <p className="text-sm text-gray-400 mb-2">Transaction Hash:</p>
                    <p className="text-emerald-400 font-mono text-xs break-all">{claimHash}</p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all w-full"
                  >
                    Continue Exploring
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg">Discovering amazing bounties for you...</span>
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
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-3xl">⚠️</span>
            </div>
            <h3 className="text-2xl font-bold text-red-400 mb-4">Oops! Something went wrong</h3>
            <p className="text-gray-300 mb-6 text-lg">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-medium transition-all"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredBounties.length === 0 && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-emerald-400 text-3xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No bounties found</h3>
            <p className="text-gray-400">
              {filter === "all" 
                ? "No bounties have been created yet." 
                : `No bounties found in the ${categoryNames[filter as keyof typeof categoryNames]} category.`}
            </p>
          </motion.div>
        )}

        {/* Premium Bounties Grid */}
        <AnimatePresence>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBounties.map((bounty, index) => {
              const status = getBountyStatus(bounty);
              const worker = getBountyWorker(bounty.bountyId);
              const timeRemaining = getTimeRemaining(bounty.deadline);
              const statusStyle = statusStyles[status as keyof typeof statusStyles];
              const isCurrentUserPoster = address?.toLowerCase() === bounty.poster.toLowerCase();
              const isCurrentUserWorker = worker && address?.toLowerCase() === worker.toLowerCase();
              const isClaimingThis = claimingBountyId === bounty.bountyId;
              const needsApprovalForThis = needsApproval[bounty.bountyId];
              
              return (
                <motion.div
                  key={bounty.bountyId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className={`group bg-gradient-to-br from-black to-gray-900 rounded-xl border-2 ${statusStyle.border} ${statusStyle.hoverBorder} shadow-lg hover:shadow-emerald-600/20 transition-all duration-300 overflow-hidden`}
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-emerald-600/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center text-xl">
                          {categoryIcons[bounty.category as keyof typeof categoryIcons] || "📦"}
                        </div>
                        <div>
                          <div className="text-emerald-400 font-semibold text-lg">
                            {categoryNames[bounty.category as keyof typeof categoryNames] || "Other"}
                          </div>
                          <div className="text-gray-400 text-sm">
                            Bounty #{bounty.bountyId}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`${statusStyle.bg} ${statusStyle.text} px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg backdrop-blur-sm border ${statusStyle.border}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === "claimed" && isCurrentUserWorker && " (by you)"}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <p className="text-gray-200 text-base leading-relaxed line-clamp-3 font-medium">
                        {bounty.description}
                      </p>
                    </div>

                    {/* Creator Info */}
                    <div className="bg-black/30 rounded-lg p-3 border border-gray-600/20">
                      <div className="text-gray-400 text-sm mb-1">Created by</div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                        <span className="text-emerald-400 font-mono font-medium text-sm">
                          {bounty.poster.slice(0, 8)}...{bounty.poster.slice(-6)}
                        </span>
                        {isCurrentUserPoster && (
                          <span className="text-blue-400 text-xs font-medium px-2 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                            You
                          </span>
                        )}
                      </div>
                      {worker && status === "claimed" && (
                        <div className="mt-2">
                          <div className="text-gray-400 text-sm mb-1">Claimed by</div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                            <span className="text-amber-400 font-mono font-medium text-sm">
                              {worker.slice(0, 8)}...{worker.slice(-6)}
                            </span>
                            {isCurrentUserWorker && (
                              <span className="text-amber-400 text-xs font-medium px-2 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Enhanced Amounts Display */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-amber-600/10 rounded-lg p-3 border border-amber-600/20">
                        <div className="text-amber-400 text-sm font-medium mb-1">Stake Required</div>
                        <div className="text-xl font-bold text-amber-300">
                          ${formatUSDCAmount(bounty.stakeAmount)}
                        </div>
                        <div className="text-amber-400/70 text-xs">USDC</div>
                      </div>
                      
                      <div className="bg-emerald-600/10 rounded-lg p-3 border border-emerald-600/20">
                        <div className="text-emerald-400 text-sm font-medium mb-1">Reward</div>
                        <div className="text-xl font-bold text-emerald-300">
                          ${formatUSDCAmount(bounty.tipAmount)}
                        </div>
                        <div className="text-emerald-400/70 text-xs">USDC</div>
                      </div>
                    </div>

                    {/* Total Payout Highlight */}
                    <div className="mb-4 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-lg p-4 border border-blue-600/20">
                      <div className="text-blue-400 text-sm font-medium mb-2 flex items-center gap-2">
                        <span>💎</span>
                        Total Earning Potential
                      </div>
                      <div className="text-2xl font-bold text-blue-300">
                        ${(() => {
                          try {
                            const stake = parseFloat(formatUnits(BigInt(bounty.stakeAmount), 6));
                            const tip = parseFloat(formatUnits(BigInt(bounty.tipAmount), 6));
                            const total = stake + tip;
                            return total < 0.001 ? total.toFixed(6) : total.toFixed(2);
                          } catch (error) {
                            return '0.00';
                          }
                        })()}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        Stake refund + reward upon completion
                      </div>
                    </div>

                    {/* Time Remaining */}
                    <div className="flex items-center justify-between mb-4 bg-black/30 rounded-lg p-3 border border-gray-600/20">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`font-medium text-sm ${status === "expired" ? "text-red-400" : "text-blue-400"}`}>
                          {timeRemaining}
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Action Button */}
                    <div className="relative">
                      {!isConnected ? (
                        <button 
                          disabled 
                          className="w-full bg-gray-600/50 text-gray-400 py-3 rounded-xl text-sm cursor-not-allowed font-medium border border-gray-600/30"
                        >
                          🔗 Connect Wallet to Claim
                        </button>
                      ) : isCurrentUserPoster ? (
                        <button 
                          disabled 
                          className="w-full bg-blue-600/20 text-blue-300 py-3 rounded-xl text-sm cursor-not-allowed font-medium border border-blue-600/30"
                        >
                          ✨ Your Bounty
                        </button>
                      ) : status === "claimed" && isCurrentUserWorker ? (
                        <button 
                          disabled 
                          className="w-full bg-amber-600/20 text-amber-300 py-3 rounded-xl text-sm cursor-not-allowed font-medium border border-amber-600/30"
                        >
                          🎯 Claimed by You - Submit Work
                        </button>
                      ) : status === "claimed" ? (
                        <button 
                          disabled 
                          className="w-full bg-amber-600/20 text-amber-300 py-3 rounded-xl text-sm cursor-not-allowed font-medium border border-amber-600/30"
                        >
                          👤 Already Claimed
                        </button>
                      ) : status === "submitted" ? (
                        <button 
                          disabled 
                          className="w-full bg-blue-600/20 text-blue-300 py-3 rounded-xl text-sm cursor-not-allowed font-medium border border-blue-600/30"
                        >
                          📋 Work Submitted - Awaiting Review
                        </button>
                      ) : status === "completed" ? (
                        <button 
                          disabled 
                          className="w-full bg-emerald-600/20 text-emerald-300 py-3 rounded-xl text-sm cursor-not-allowed font-medium border border-emerald-600/30"
                        >
                          ✅ Completed
                        </button>
                      ) : status === "cancelled" ? (
                        <button 
                          disabled 
                          className="w-full bg-red-600/20 text-red-300 py-3 rounded-xl text-sm cursor-not-allowed font-medium border border-red-600/30"
                        >
                          ❌ Cancelled
                        </button>
                      ) : status === "expired" ? (
                        <button 
                          disabled 
                          className="w-full bg-gray-600/50 text-gray-400 py-3 rounded-xl text-sm cursor-not-allowed font-medium border border-gray-600/30"
                        >
                          ⏰ Bounty Expired
                        </button>
                      ) : needsApprovalForThis ? (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleApprove(bounty)}
                          disabled={isApprovePending || isApprovalConfirming}
                          className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm transition-all font-semibold shadow-lg"
                        >
                          {isApprovePending || isApprovalConfirming ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Approving USDC...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <span>🔓</span>
                              Approve {formatUSDCAmount(bounty.stakeAmount)} USDC
                            </span>
                          )}
                        </motion.button>
                      ) : (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleClaimBounty(bounty)}
                          disabled={isClaimPending || isClaimConfirming || isClaimingThis}
                          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm transition-all font-semibold shadow-lg"
                        >
                          {isClaimPending || isClaimConfirming || isClaimingThis ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              {isClaimPending || isClaimingThis ? "Claiming..." : "Confirming..."}
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <span>⚡</span>
                              Claim This Bounty
                            </span>
                          )}
                        </motion.button>
                      )}

                      {/* Stake requirement info */}
                      {!isCurrentUserPoster && status === "open" && isConnected && (
                        <div className="mt-2 text-center">
                          <p className="text-xs text-gray-400">
                            Requires {formatUSDCAmount(bounty.stakeAmount)} USDC stake
                          </p>
                          {usdcBalance !== undefined && (
                            <p className="text-xs text-gray-500">
                              Your balance: {formatUnits(usdcBalance, 6)} USDC
                            </p>
                          )}
                        </div>
                      )}

                      {/* Error display */}
                      {claimError && claimingBountyId === bounty.bountyId && (
                        <div className="mt-3 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                          <p className="text-red-400 text-xs text-center">{claimError}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 pb-4">
                    <div className="text-xs text-gray-500 font-mono bg-black/20 rounded px-2 py-1 inline-block">
                      Bounty ID: {bounty.bountyId}
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-emerald-600/5 to-emerald-600/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>

        {/* Load More Button */}
        {filteredBounties.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-12"
          >
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-gray-700 to-slate-700 hover:from-emerald-600 hover:to-green-600 text-white px-12 py-4 rounded-xl transition-all duration-500 font-semibold text-lg shadow-lg hover:shadow-emerald-500/25"
            >
              Discover More Opportunities
            </motion.button>
          </motion.div>
        )}

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <div className="bg-gradient-to-r from-emerald-600/10 via-transparent to-emerald-600/10 rounded-xl p-6 border border-emerald-600/20">
            <h3 className="text-emerald-400 font-medium mb-4 text-center">✨ Why Choose FlashBounty?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-emerald-400 text-xl">🔒</span>
                </div>
                <div className="font-medium text-white mb-2">Completely Transparent</div>
                <div>Every bounty, transaction, and outcome is recorded on-chain for full transparency and trust.</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-emerald-400 text-xl">⚡</span>
                </div>
                <div className="font-medium text-white mb-2">Stake-Based Commitment</div>
                <div>Workers stake tokens to claim bounties, ensuring serious commitment and quality delivery.</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-emerald-400 text-xl">💎</span>
                </div>
                <div className="font-medium text-white mb-2">Fair & Rewarding</div>
                <div>Complete bounties to earn your stake back plus generous tips. Everyone wins!</div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}