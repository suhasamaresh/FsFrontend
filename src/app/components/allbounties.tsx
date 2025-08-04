"use client";

import React, { useEffect, useState } from "react";
import { GraphQLClient, gql } from "graphql-request";
import { formatUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { erc20Abi } from "viem";
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
    bg: "bg-gradient-to-r from-emerald-500 to-green-500",
    text: "text-emerald-100",
    glow: "shadow-emerald-500/30"
  },
  "claimed": {
    bg: "bg-gradient-to-r from-amber-500 to-yellow-500",
    text: "text-amber-100", 
    glow: "shadow-amber-500/30"
  },
  "submitted": {
    bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
    text: "text-blue-100",
    glow: "shadow-blue-500/30"
  },
  "completed": {
    bg: "bg-gradient-to-r from-emerald-600 to-teal-600",
    text: "text-emerald-100",
    glow: "shadow-emerald-600/30"
  },
  "cancelled": {
    bg: "bg-gradient-to-r from-red-500 to-rose-500",
    text: "text-red-100",
    glow: "shadow-red-500/30"
  },
  "expired": {
    bg: "bg-gradient-to-r from-gray-600 to-slate-600",
    text: "text-gray-100",
    glow: "shadow-gray-600/30"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-12">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center relative"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
              Discover Bounties
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Explore premium micro-task opportunities from our vibrant community. 
              <span className="text-emerald-400 font-medium"> Stake, claim, and earn</span> with confidence.
            </p>
          </div>
        </motion.div>

        {/* Wallet Connection Status */}
        {!isConnected && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-amber-900/20 border border-amber-500/30 rounded-2xl p-6 text-center backdrop-blur-xl">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-bold text-amber-400 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-300">Please connect your wallet to claim bounties and start earning!</p>
            </div>
          </motion.div>
        )}

        {/* Enhanced Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-8 rounded-2xl hover:border-emerald-500/30 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📝</div>
                <div className="text-emerald-400 text-sm font-medium px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  Active, Claimed & Completed
                </div>
              </div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">{totalBounties}</div>
              <div className="text-gray-300 font-medium mb-1">Total Bounties</div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-8 rounded-2xl hover:border-blue-500/30 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">💰</div>
                <div className="text-blue-400 text-sm font-medium px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                  Rewards
                </div>
              </div>
              <div className="text-4xl font-bold text-blue-400 mb-2">
                ${totalValue < 0.001 ? totalValue.toFixed(6) : totalValue.toFixed(2)}
              </div>
              <div className="text-gray-300 font-medium mb-1">Total Rewards</div>
              <div className="text-sm text-blue-400/80">USDC available to earn</div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-8 rounded-2xl hover:border-purple-500/30 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">👥</div>
                <div className="text-purple-400 text-sm font-medium px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20">
                  Community
                </div>
              </div>
              <div className="text-4xl font-bold text-purple-400 mb-2">
                {new Set(bounties.map(b => b.poster)).size}
              </div>
              <div className="text-gray-300 font-medium mb-1">Active Creators</div>
              <div className="text-sm text-purple-400/80">Building opportunities</div>
            </div>
          </div>
        </motion.div>

        {/* USDC Balance Display */}
        {isConnected && usdcBalance !== undefined && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-green-900/20 border border-green-500/30 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">💳</div>
                  <div>
                    <div className="text-green-400 font-medium">Your USDC Balance</div>
                    <div className="text-gray-400 text-sm">Available for staking</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-300">
                  {formatUnits(usdcBalance, 6)} USDC
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800/40 to-slate-800/40 rounded-3xl blur-xl"></div>
          <div className="relative bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-6 lg:space-y-0 lg:space-x-8">
              
              {/* Enhanced Search */}
              <div className="flex-1 max-w-md">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <input
                    type="text"
                    placeholder="Search bounties, categories, keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="relative w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-5 py-4 pl-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-gray-700/70 transition-all duration-300"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4.5 group-hover:text-emerald-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Enhanced Sort Controls */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <select
                    aria-label="Sort bounties"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none pr-10 min-w-[160px]"
                  >
                    <option value="tipAmount">💰 Highest Rewards</option>
                    <option value="stakeAmount">🎯 Highest Stakes</option>
                    <option value="deadline">⏰ Ending Soon</option>
                  </select>
                  <svg className="w-4 h-4 text-gray-400 absolute right-3 top-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="p-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white hover:bg-emerald-600/20 hover:border-emerald-500/50 transition-all duration-300 group"
                  title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
                >
                  <motion.div
                    animate={{ rotate: sortOrder === "asc" ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className="w-5 h-5 group-hover:text-emerald-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </motion.div>
                </button>
              </div>
            </div>

            {/* Elegant Category Filter */}
            <div className="mt-8">
              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter("all")}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    filter === "all"
                      ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/25"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-600/30 hover:border-emerald-500/30"
                  }`}
                >
                  <span className="text-lg">✨</span>
                  All Categories
                </motion.button>
                
                {Object.entries(categoryIcons).map(([value, icon]) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilter(value)}
                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                      filter === value
                        ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/25"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-600/30 hover:border-emerald-500/30"
                    }`}
                  >
                    {icon}
                    {categoryNames[value as keyof typeof categoryNames]}
                  </motion.button>
                ))}
              </div>
            </div>
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
                className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-emerald-500/30 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-2xl blur-xl"></div>
                <div className="relative text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-emerald-400 mb-4">Bounty Claimed Successfully!</h3>
                  <p className="text-gray-300 mb-6">
                    Congratulations! You have successfully claimed the bounty. Your stake has been escrowed and you can now work on completing the task.
                  </p>
                  <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                    <p className="text-sm text-gray-400 mb-2">Transaction Hash:</p>
                    <p className="text-emerald-400 font-mono text-xs break-all">{claimHash}</p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
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
            className="text-center py-20"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/20 border-t-blue-500/50 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-gray-300 text-lg">Discovering amazing bounties for you...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-rose-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-red-900/20 border border-red-500/30 rounded-2xl p-8 text-center backdrop-blur-xl">
              <div className="text-6xl mb-6">⚠️</div>
              <h3 className="text-2xl font-bold text-red-400 mb-4">Oops! Something went wrong</h3>
              <p className="text-gray-300 mb-6 text-lg">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredBounties.length === 0 && !loading && !error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-8">🎯</div>
            <h3 className="text-3xl font-bold text-white mb-4">No bounties found</h3>
            <p className="text-gray-400 text-xl max-w-md mx-auto">
              {filter === "all" 
                ? "Be the first to post an exciting bounty and start building the community!" 
                : `No bounties available in ${categoryNames[filter as keyof typeof categoryNames]}. Try exploring other categories.`}
            </p>
          </motion.div>
        )}

        {/* Premium Bounties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredBounties.map((bounty, index) => {
              const status = getBountyStatus(bounty); // Now gets the REAL status
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
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.9 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative"
                >
                  {/* Card Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  <div className="relative bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 hover:border-emerald-500/30 transition-all duration-500 overflow-hidden">
                    
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full -mr-16 -mt-16"></div>
                    
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl p-3 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-white/10">
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
                      
                      <div className={`${statusStyle.bg} ${statusStyle.text} px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg ${statusStyle.glow} backdrop-blur-sm`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === "claimed" && isCurrentUserWorker && " (by you)"}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <p className="text-gray-200 text-base leading-relaxed line-clamp-3 font-medium">
                        {bounty.description}
                      </p>
                    </div>

                    {/* Creator Info */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-gray-700/30 to-slate-700/30 rounded-2xl border border-gray-600/20">
                      <div className="text-gray-400 text-sm mb-1">Created by</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-emerald-400 font-mono font-medium">
                          {bounty.poster.slice(0, 8)}...{bounty.poster.slice(-6)}
                        </span>
                        {isCurrentUserPoster && (
                          <span className="text-blue-400 text-xs font-medium px-2 py-1 bg-blue-500/10 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      {worker && status === "claimed" && (
                        <div className="mt-2">
                          <div className="text-gray-400 text-sm mb-1">Claimed by</div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                            <span className="text-amber-400 font-mono font-medium">
                              {worker.slice(0, 8)}...{worker.slice(-6)}
                            </span>
                            {isCurrentUserWorker && (
                              <span className="text-amber-400 text-xs font-medium px-2 py-1 bg-amber-500/10 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Amounts Display */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-2xl border border-amber-500/20">
                        <div className="text-amber-400 text-sm font-medium mb-1">Stake Required</div>
                        <div className="text-2xl font-bold text-amber-300">
                          ${formatUSDCAmount(bounty.stakeAmount)}
                        </div>
                        <div className="text-amber-400/70 text-xs">USDC</div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl border border-emerald-500/20">
                        <div className="text-emerald-400 text-sm font-medium mb-1">Reward</div>
                        <div className="text-2xl font-bold text-emerald-300">
                          ${formatUSDCAmount(bounty.tipAmount)}
                        </div>
                        <div className="text-emerald-400/70 text-xs">USDC</div>
                      </div>
                    </div>

                    {/* Total Payout Highlight */}
                    <div className="mb-6 p-5 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-2xl border border-blue-500/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-emerald-500/5 animate-pulse"></div>
                      <div className="relative">
                        <div className="text-blue-400 text-sm font-medium mb-2 flex items-center gap-2">
                          <span>💎</span>
                          Total Earning Potential
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
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
                    </div>

                    {/* Time Remaining */}
                    <div className="flex items-center justify-between mb-6 p-3 bg-gray-700/30 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`font-medium ${status === "expired" ? "text-red-400" : "text-blue-400"}`}>
                          {timeRemaining}
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Action Button */}
                    <div className="relative">
                      {!isConnected ? (
                        <button 
                          disabled 
                          className="w-full bg-gray-600/50 text-gray-400 py-4 rounded-2xl text-base cursor-not-allowed font-medium border border-gray-600/30"
                        >
                          🔗 Connect Wallet to Claim
                        </button>
                      ) : isCurrentUserPoster ? (
                        <button 
                          disabled 
                          className="w-full bg-blue-600/20 text-blue-300 py-4 rounded-2xl text-base cursor-not-allowed font-medium border border-blue-600/30"
                        >
                          ✨ Your Bounty
                        </button>
                      ) : status === "claimed" && isCurrentUserWorker ? (
                        <button 
                          disabled 
                          className="w-full bg-amber-600/20 text-amber-300 py-4 rounded-2xl text-base cursor-not-allowed font-medium border border-amber-600/30"
                        >
                          🎯 Claimed by You - Submit Work
                        </button>
                      ) : status === "claimed" ? (
                        <button 
                          disabled 
                          className="w-full bg-amber-600/20 text-amber-300 py-4 rounded-2xl text-base cursor-not-allowed font-medium border border-amber-600/30"
                        >
                          👤 Already Claimed
                        </button>
                      ) : status === "submitted" ? (
                        <button 
                          disabled 
                          className="w-full bg-blue-600/20 text-blue-300 py-4 rounded-2xl text-base cursor-not-allowed font-medium border border-blue-600/30"
                        >
                          📋 Work Submitted - Awaiting Review
                        </button>
                      ) : status === "completed" ? (
                        <button 
                          disabled 
                          className="w-full bg-emerald-600/20 text-emerald-300 py-4 rounded-2xl text-base cursor-not-allowed font-medium border border-emerald-600/30"
                        >
                          ✅ Completed
                        </button>
                      ) : status === "cancelled" ? (
                        <button 
                          disabled 
                          className="w-full bg-red-600/20 text-red-300 py-4 rounded-2xl text-base cursor-not-allowed font-medium border border-red-600/30"
                        >
                          ❌ Cancelled
                        </button>
                      ) : status === "expired" ? (
                        <button 
                          disabled 
                          className="w-full bg-gray-600/50 text-gray-400 py-4 rounded-2xl text-base cursor-not-allowed font-medium border border-gray-600/30"
                        >
                          ⏰ Bounty Expired
                        </button>
                      ) : needsApprovalForThis ? (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleApprove(bounty)}
                          disabled={isApprovePending || isApprovalConfirming}
                          className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-2xl text-base transition-all duration-300 font-semibold shadow-lg hover:shadow-yellow-500/25 border border-yellow-500/20"
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
                          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-2xl text-base transition-all duration-300 font-semibold shadow-lg hover:shadow-emerald-500/25 border border-emerald-500/20"
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
                        <div className="mt-3 text-center">
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
                        <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                          <p className="text-red-400 text-xs text-center">{claimError}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Load More */}
        {filteredBounties.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-gray-700 to-slate-700 hover:from-emerald-600 hover:to-green-600 text-white px-12 py-4 rounded-2xl transition-all duration-500 font-semibold text-lg shadow-lg hover:shadow-emerald-500/25"
            >
              Discover More Opportunities
            </motion.button>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
          <div className="relative bg-blue-900/20 border border-blue-500/30 rounded-3xl p-10 backdrop-blur-xl">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-8 text-center">
              ✨ Why Choose FlashBounty?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🔒</div>
                <div className="text-blue-400 font-bold text-xl mb-3">Completely Transparent</div>
                <div className="text-gray-300 leading-relaxed">Every bounty, transaction, and outcome is recorded on-chain for full transparency and trust.</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
                <div className="text-blue-400 font-bold text-xl mb-3">Stake-Based Commitment</div>
                <div className="text-gray-300 leading-relaxed">Workers stake tokens to claim bounties, ensuring serious commitment and quality delivery.</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">💎</div>
                <div className="text-blue-400 font-bold text-xl mb-3">Fair & Rewarding</div>
                <div className="text-gray-300 leading-relaxed">Complete bounties to earn your stake back plus generous tips. Everyone wins!</div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
