"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { GraphQLClient, gql } from "graphql-request";
import { formatUnits } from "viem";
import { motion } from "framer-motion";
import { erc20Abi } from "viem";

const GRAPHQL_ENDPOINT = "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FlashStudy/1.0.0/gn";
const USDC_ADDRESS = "0x4C2AA252BEe766D3399850569713b55178934849" as const;

const ALL_STUDY_FUNDS_QUERY = gql`
  query GetAllStudyFunds($first: Int!, $skip: Int!, $where: StudyFundCreated_filter) {
    studyFundCreateds(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
      where: $where
    ) {
      fundId
      organizer
      topic
      description
      contributionAmount
      targetAmount
      deadline
      maxParticipants
      timestamp
      transactionHash
    }
    
    fundContributeds(orderBy: timestamp, orderDirection: desc) {
      fundId
      contributor
      amount
      timestamp
    }
    
    fundTargetReacheds {
      fundId
      totalAmount
      participantCount
    }
    
    fundFinalizeds {
      fundId
      organizer
      finalAmount
    }
    
    fundExpireds {
      fundId
      refundAmount
    }
  }
`;

type StudyFundCreated = {
  fundId: string;
  organizer: string;
  topic: string;
  description: string;
  contributionAmount: string;
  targetAmount: string;
  deadline: string;
  maxParticipants: string;
  timestamp: string;
  transactionHash: string;
};

type FundContributed = {
  fundId: string;
  contributor: string;
  amount: string;
  timestamp: string;
};

type FundTargetReached = {
  fundId: string;
  totalAmount: string;
  participantCount: string;
};

type FundFinalized = {
  fundId: string;
  organizer: string;
  finalAmount: string;
};

type FundExpired = {
  fundId: string;
  refundAmount: string;
};

const topicIcons = {
  "programming": "💻",
  "design": "🎨",
  "business": "💼",
  "language": "🗣️",
  "science": "🔬",
  "personal": "🌱",
  "art": "🎭",
  "health": "🏃",
  "other": "📦"
};

const topicNames = {
  "programming": "Programming & Tech",
  "design": "Design & Creative",
  "business": "Business & Marketing",
  "language": "Language Learning",
  "science": "Science & Research",
  "personal": "Personal Development",
  "art": "Art & Music",
  "health": "Health & Wellness",
  "other": "Other"
};

export default function AllStudyFunds() {
  const { address, isConnected } = useAccount();
  const [studyFunds, setStudyFunds] = useState<StudyFundCreated[]>([]);
  const [contributions, setContributions] = useState<FundContributed[]>([]);
  const [targetReached, setTargetReached] = useState<FundTargetReached[]>([]);
  const [finalized, setFinalized] = useState<FundFinalized[]>([]);
  const [expired, setExpired] = useState<FundExpired[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const fetchStudyFunds = async () => {
    try {
      setLoading(true);
      setError(null);
      const client = new GraphQLClient(GRAPHQL_ENDPOINT);
      
      const variables: any = {
        first: 50,
        skip: 0,
        where: {}
      };

      if (filter !== "all") {
        variables.where.topic = filter;
      }

      const data = await client.request<{
        studyFundCreateds: StudyFundCreated[];
        fundContributeds: FundContributed[];
        fundTargetReacheds: FundTargetReached[];
        fundFinalizeds: FundFinalized[];
        fundExpireds: FundExpired[];
      }>(ALL_STUDY_FUNDS_QUERY, variables);

      setStudyFunds(data.studyFundCreateds || []);
      setContributions(data.fundContributeds || []);
      setTargetReached(data.fundTargetReacheds || []);
      setFinalized(data.fundFinalizeds || []);
      setExpired(data.fundExpireds || []);
    } catch (err: any) {
      console.error("Failed to fetch study funds:", err);
      setError(err.message || "Failed to fetch study funds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyFunds();
  }, [filter]);

  const getFundStatus = (fund: StudyFundCreated) => {
    const fundId = fund.fundId;
    const now = Date.now() / 1000;
    const deadline = parseInt(fund.deadline);

    if (expired.some(e => e.fundId === fundId)) return "expired";
    if (finalized.some(f => f.fundId === fundId)) return "distributed";
    if (targetReached.some(t => t.fundId === fundId)) return "funded";
    if (now > deadline) return "expired";
    return "active";
  };

  const getFundProgress = (fund: StudyFundCreated) => {
    const fundContributions = contributions.filter(c => c.fundId === fund.fundId);
    const totalContributions = fundContributions.length * parseFloat(formatUnits(BigInt(fund.contributionAmount), 6));
    const target = parseFloat(formatUnits(BigInt(fund.targetAmount), 6));
    return Math.min((totalContributions / target) * 100, 100);
  };

  const getTimeRemaining = (deadline: string) => {
    const now = Date.now() / 1000;
    const deadlineTime = parseInt(deadline);
    const remaining = deadlineTime - now;
    
    if (remaining <= 0) return "Expired";
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(remaining / 60)}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "funded": return "bg-yellow-500";
      case "distributed": return "bg-blue-500";
      case "expired": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "funded": return "Funded";  
      case "distributed": return "Distributed";
      case "expired": return "Expired";
      default: return "Unknown";
    }
  };

  const filteredFunds = studyFunds.filter(fund => {
    const matchesSearch = fund.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fund.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 p-6">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
          />
          <span className="ml-3 text-white">Discovering amazing study funds for you...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 p-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Study Funds</h1>
        <p className="text-gray-400">
          Discover collaborative learning opportunities from our vibrant community. Contribute, learn, and grow together.
        </p>
        
        {!isConnected && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400">
              Please connect your wallet to contribute to study funds and start learning!
            </p>
          </div>
        )}
      </motion.div>

      {/* Balance Display */}
      {isConnected && usdcBalance !== undefined && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 p-4 bg-gray-700 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Your USDC Balance:</span>
            <span className="text-white font-bold text-lg">
              {formatUnits(usdcBalance, 6)} USDC
            </span>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search study funds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Topic Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              All Topics
            </button>
            {Object.entries(topicNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  filter === key
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <span>{topicIcons[key as keyof typeof topicIcons]}</span>
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Study Funds Grid */}
      {filteredFunds.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Study Funds Found</h3>
          <p className="text-gray-400">
            {filter === "all" 
              ? "Be the first to create an exciting study fund and start building the learning community!" 
              : `No study funds available in ${topicNames[filter as keyof typeof topicNames]}. Try exploring other topics.`
            }
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFunds.map((fund, index) => {
            const status = getFundStatus(fund);
            const progress = getFundProgress(fund);
            const fundContributions = contributions.filter(c => c.fundId === fund.fundId);
            
            return (
              <motion.div
                key={fund.fundId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Fund Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {topicIcons[fund.topic as keyof typeof topicIcons] || "📦"}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white truncate">
                        Study Fund #{fund.fundId}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {topicNames[fund.topic as keyof typeof topicNames] || "Other"}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(status)}`}>
                    {getStatusText(status)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  {fund.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="bg-emerald-500 h-2 rounded-full"
                    />
                  </div>
                </div>

                {/* Fund Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Contribution:</span>
                    <span className="text-white">
                      {formatUnits(BigInt(fund.contributionAmount), 6)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Target:</span>
                    <span className="text-white">
                      {formatUnits(BigInt(fund.targetAmount), 6)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Participants:</span>
                    <span className="text-white">
                      {fundContributions.length}/{fund.maxParticipants}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Time Remaining:</span>
                    <span className="text-white">
                      {getTimeRemaining(fund.deadline)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  View Details
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}