"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { GraphQLClient, gql } from "graphql-request";


const GRAPHQL_ENDPOINT =
  "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FlashBounty/1.0.0/gn";

const BOUNTIES_QUERY = gql`
  query GetAllBounties(
    $first: Int!
    $skip: Int!
    $orderBy: BountyPosted_orderBy!
    $orderDirection: OrderDirection!
    $where: BountyPosted_filter
  ) {
    bountyPosteds(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
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
      tipPaid
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

type BountyPosted = {
  bountyId: string;
  poster: string;
  description: string;
  category: string;
  stakeAmount: string;
  tipAmount: string;
  deadline: string;
};

type BountyClaimed = {
  bountyId: string;
  worker: string;
};

type BountyCompleted = {
  bountyId: string;
  worker: string;
  tipPaid: string;
};

interface EnrichedBounty extends BountyPosted {
  claimedBy?: string;
  completedBy?: string;
  tipPaid?: string;
  status: "Open" | "Claimed" | "Completed" | "Cancelled" | "Submitted";
}

const categories = [
  { key: "errand", label: "Errand", icon: "🏃‍♂️" },
  { key: "chore", label: "Chore", icon: "🧹" },
  { key: "creative", label: "Creative", icon: "🎨" },
  { key: "tech", label: "Tech", icon: "💻" },
  { key: "writing", label: "Writing", icon: "✍️" },
  { key: "research", label: "Research", icon: "🔬" },
  { key: "other", label: "Other", icon: "📦" },
];

const categoryColors: Record<string, string> = {
  errand: "from-emerald-600/20 to-emerald-800/20 border-emerald-600/30",
  chore: "from-blue-600/20 to-blue-800/20 border-blue-600/30",
  creative: "from-purple-600/20 to-purple-800/20 border-purple-600/30",
  tech: "from-cyan-600/20 to-cyan-800/20 border-cyan-600/30",
  writing: "from-orange-600/20 to-orange-800/20 border-orange-600/30",
  research: "from-pink-600/20 to-pink-800/20 border-pink-600/30",
  other: "from-gray-600/20 to-gray-800/20 border-gray-600/30",
};

const statusColors: Record<string, string> = {
  Open: "bg-emerald-600 text-white",
  Claimed: "bg-yellow-600 text-black",
  Submitted: "bg-blue-600 text-white",
  Completed: "bg-green-600 text-white",
  Cancelled: "bg-red-600 text-white",
};

function formatDate(timestamp: string | number) {
  if (!timestamp) return "-";
  const num = Number(timestamp) * 1000;
  if (isNaN(num)) return "-";
  return new Date(num).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatUSDC(amountStr: string) {
  try {
    return Number(formatUnits(BigInt(amountStr), 6)).toFixed(4);
  } catch {
    return "0.0000";
  }
}

const transition = {
  type: "spring" as const,
  stiffness: 70,
  damping: 17,
  mass: 0.8,
};

export default function UserBountiesDashboard() {
  const { address, isConnected } = useAccount();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bounties, setBounties] = useState<EnrichedBounty[]>([]);
  const [activeTab, setActiveTab] = useState<
    "posted" | "claimed" | "completed"
  >("posted");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (!isConnected || !address) {
      setBounties([]);
      setError(null);
      setLoading(false);
      return;
    }
    async function fetchBounties() {
      setError(null);
      setLoading(true);
      try {
        const client = new GraphQLClient(GRAPHQL_ENDPOINT);
        const data = await client.request<{
          bountyPosteds: BountyPosted[];
          bountyClaimeds: BountyClaimed[];
          bountyCompleteds: BountyCompleted[];
          bountyCancelleds: Array<{ bountyId: string; poster: string }>;
          bountySubmitteds: Array<{ bountyId: string; worker: string }>;
        }>(BOUNTIES_QUERY, {
          first: 200,
          skip: 0,
          orderBy: "bountyId",
          orderDirection: "desc",
          where: { poster: address ? address.toLowerCase() : "" },
        });

        const bountyMap = new Map<string, EnrichedBounty>();
        data.bountyPosteds.forEach((b) => {
          bountyMap.set(b.bountyId, { ...b, status: "Open" });
        });

        data.bountyClaimeds.forEach(({ bountyId, worker }) => {
          let bounty = bountyMap.get(bountyId);
          if (!bounty) {
            if (address && worker.toLowerCase() === address.toLowerCase()) {
              bounty = {
                bountyId,
                description: "(unknown)",
                category: "other",
                stakeAmount: "0",
                tipAmount: "0",
                deadline: "0",
                poster: "unknown",
                status: "Claimed",
                claimedBy: worker,
              };
              bountyMap.set(bountyId, bounty);
            }
          } else {
            bounty.status = "Claimed";
            bounty.claimedBy = worker;
          }
        });

        data.bountySubmitteds.forEach(({ bountyId, worker }) => {
          const bounty = bountyMap.get(bountyId);
          if (bounty) {
            bounty.status = "Submitted";
            bounty.claimedBy = worker;
          }
        });

        data.bountyCompleteds.forEach(({ bountyId, worker, tipPaid }) => {
          let bounty = bountyMap.get(bountyId);
          if (!bounty) {
            if (address && worker.toLowerCase() === address.toLowerCase()) {
              bounty = {
                bountyId,
                description: "(unknown)",
                category: "other",
                stakeAmount: "0",
                tipAmount: "0",
                deadline: "0",
                poster: "unknown",
                status: "Completed",
                completedBy: worker,
                tipPaid,
              };
              bountyMap.set(bountyId, bounty);
            }
          } else {
            bounty.status = "Completed";
            bounty.completedBy = worker;
            bounty.tipPaid = tipPaid;
          }
        });

        data.bountyCancelleds.forEach(({ bountyId }) => {
          const bounty = bountyMap.get(bountyId);
          if (bounty) bounty.status = "Cancelled";
        });

        setBounties(Array.from(bountyMap.values()));
      } catch (e: any) {
        setError(e.message || "Failed to load bounties");
      } finally {
        setLoading(false);
      }
    }
    fetchBounties();
  }, [address, isConnected]);

  const filteredBounties = useMemo(() => {
    if (!bounties.length) return [];
    let filtered = bounties.filter((b) => {
      if (activeTab === "posted")
        return b.poster.toLowerCase() === address?.toLowerCase();
      if (activeTab === "claimed")
        return b.claimedBy?.toLowerCase() === address?.toLowerCase();
      if (activeTab === "completed")
        return b.completedBy?.toLowerCase() === address?.toLowerCase();
      return false;
    });
    if (selectedCategory !== "all") {
      filtered = filtered.filter((b) => b.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const lowered = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.description.toLowerCase().includes(lowered) ||
          b.bountyId.toLowerCase().includes(lowered)
      );
    }
    filtered.sort((a, b) => Number(b.deadline || 0) - Number(a.deadline || 0));
    return filtered;
  }, [activeTab, bounties, searchTerm, selectedCategory, address]);

  const totalEarnings = useMemo(() => {
    return bounties.reduce((acc, b) => {
      if (
        b.completedBy?.toLowerCase() === address?.toLowerCase() &&
        b.tipPaid
      ) {
        try {
          return acc + Number(formatUnits(BigInt(b.tipPaid), 6));
        } catch {
          return acc;
        }
      }
      return acc;
    }, 0);
  }, [bounties, address]);

  const postedCount = bounties.filter(b => b.poster.toLowerCase() === address?.toLowerCase()).length;
  const claimedCount = bounties.filter(b => b.claimedBy?.toLowerCase() === address?.toLowerCase()).length;
  const completedCount = bounties.filter(b => b.completedBy?.toLowerCase() === address?.toLowerCase()).length;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-emerald-400 text-4xl">👤</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 text-lg">
            Please connect your wallet to access your dashboard
          </p>
        </motion.div>
      </div>
    );
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
            Your Bounty <span className="text-emerald-600">Dashboard</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your posted, claimed and completed bounties — track your micro-tasks in style
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
                <div className="text-2xl font-bold text-emerald-400 mb-1">{postedCount}</div>
                <div className="text-gray-400 text-sm">Posted Bounties</div>
              </div>
              <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center">
                <span className="text-emerald-400 text-xl">📝</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-6 border border-blue-600/30 hover:border-blue-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-400 mb-1">{claimedCount}</div>
                <div className="text-gray-400 text-sm">Claimed Bounties</div>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 text-xl">🎯</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-6 border border-purple-600/30 hover:border-purple-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-400 mb-1">{completedCount}</div>
                <div className="text-gray-400 text-sm">Completed Tasks</div>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400 text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl p-6 border border-green-600/30 hover:border-green-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-400 mb-1">
                  ${totalEarnings.toFixed(4)}
                </div>
                <div className="text-gray-400 text-sm">Total Earnings</div>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 text-xl">💰</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-black/50 rounded-xl p-2 border border-emerald-600/20 inline-flex gap-1">
            {[
              { key: "posted", label: "Posted", icon: "📝" },
              { key: "claimed", label: "Claimed", icon: "🎯" },
              { key: "completed", label: "Completed", icon: "✅" },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === key
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-emerald-600/20"
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="col-span-2">
            <input
              type="text"
              placeholder="Search bounties by ID or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-gray-900/50 border border-emerald-600/30 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <label htmlFor="category-select" className="sr-only">
              Filter by category
            </label>
            <select
              id="category-select"
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 bg-gray-900/50 border border-emerald-600/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600/50 transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map(({ key, label, icon }) => (
                <option key={key} value={key}>
                  {icon} {label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 transition text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-emerald-600/25"
            >
              Clear
            </button>
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
              <span className="text-lg">Loading bounties...</span>
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

        {/* Empty State */}
        {filteredBounties.length === 0 && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-emerald-400 text-3xl">📭</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Bounties Found</h3>
            <p className="text-gray-400">
              {activeTab === "posted" && "You haven't posted any bounties yet."}
              {activeTab === "claimed" && "You haven't claimed any bounties yet."}
              {activeTab === "completed" && "You haven't completed any bounties yet."}
            </p>
          </motion.div>
        )}

        {/* Bounties Grid */}
        <AnimatePresence>
          {filteredBounties.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBounties.map((bounty, index) => (
                <motion.div
                  key={bounty.bountyId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className={`group bg-gradient-to-br ${categoryColors[bounty.category] || categoryColors.other} rounded-xl border-2 hover:border-emerald-600/60 shadow-lg hover:shadow-emerald-600/20 transition-all duration-300 overflow-hidden`}
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center text-xl">
                          {categories.find(c => c.key === bounty.category)?.icon || "📦"}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1 truncate max-w-[200px]">
                            {bounty.description}
                          </h3>
                          <span className="px-2 py-1 bg-emerald-600/20 text-emerald-400 text-xs font-medium rounded-full">
                            {categories.find(c => c.key === bounty.category)?.label || "Other"}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusColors[bounty.status] || statusColors.Open}`}>
                        {bounty.status}
                      </span>
                    </div>

                    {/* Deadline */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Deadline:</span>
                      <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-1">
                        <span className="text-white font-medium">
                          {formatDate(bounty.deadline)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-gray-400 mb-1">Stake Amount</div>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-white">
                            {formatUSDC(bounty.stakeAmount)}
                          </span>
                          <span className="text-xs text-gray-400">USDC</span>
                        </div>
                      </div>
                      
                      <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-gray-400 mb-1">Tip Amount</div>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-white">
                            {formatUSDC(bounty.tipAmount)}
                          </span>
                          <span className="text-xs text-gray-400">USDC</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-3">
                      <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-gray-400 mb-2">Poster Address</div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                          <span className="font-mono text-xs text-emerald-300">
                            {bounty.poster.slice(0, 8)}...{bounty.poster.slice(-6)}
                          </span>
                        </div>
                      </div>

                      {bounty.claimedBy && (
                        <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                          <div className="text-xs text-gray-400 mb-2">Claimed By</div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                            <span className="font-mono text-xs text-blue-300">
                              {bounty.claimedBy.slice(0, 8)}...{bounty.claimedBy.slice(-6)}
                            </span>
                          </div>
                        </div>
                      )}

                      {bounty.tipPaid && (
                        <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                          <div className="text-xs text-gray-400 mb-2">Tip Paid</div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span className="font-mono text-xs text-green-300">
                              {formatUSDC(bounty.tipPaid)} USDC
                            </span>
                          </div>
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
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Footer Insights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <div className="bg-gradient-to-r from-emerald-600/10 via-transparent to-emerald-600/10 rounded-xl p-6 border border-emerald-600/20">
            <h3 className="text-emerald-400 font-medium mb-4 text-center">💡 Bounty Platform Insights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-300">
              <div className="text-center">
                <div className="font-medium text-white mb-1">Decentralized</div>
                <div>All bounties managed on-chain with smart contracts</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-white mb-1">Fair Payment</div>
                <div>Automatic escrow ensures secure transactions</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-white mb-1">Global Access</div>
                <div>Work with people from around the world</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}