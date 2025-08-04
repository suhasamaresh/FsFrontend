"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { GraphQLClient, gql } from "graphql-request";

import FlashStudyabi from "../../../FlashStudy.json";


const CONTRACT_ADDRESS = "0x0d6484Ae57198Fe38d8EFcD45338cFfda58C2D64" as const;
const USDC_ADDRESS = "0x4C2AA252BEe766D3399850569713b55178934849" as const;
const GRAPHQL_ENDPOINT = "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FlashStudy/1.0.0/gn";

const USER_FUNDS_QUERY = gql`
  query GetUserFunds($user: String!) {
    # Funds created by user (as organizer)
    studyFundCreateds(where: { organizer: $user }, orderBy: timestamp, orderDirection: desc) {
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
    
    # Funds contributed to by user
    fundContributeds(where: { contributor: $user }, orderBy: timestamp, orderDirection: desc) {
      fundId
      contributor
      amount
      timestamp
      transactionHash
    }
    
    # All fund contributions (to calculate progress)
    fundContributeds(orderBy: timestamp, orderDirection: desc) {
      fundId
      contributor
      amount
      timestamp
    }
    
    # Target reached events
    fundTargetReacheds {
      fundId
      totalAmount
      participantCount
    }
    
    # Finalized funds
    fundFinalizeds {
      fundId
      organizer
      finalAmount
    }
    
    # Resource purchases
    resourcePurchaseds {
      fundId
      resourceURI
      purchaseAmount
    }
    
    # Access distributions
    accessDistributeds {
      fundId
      accessMetadataURI
      participantCount
    }
    
    # Access claims by user
    accessClaimeds(where: { contributor: $user }) {
      fundId
      contributor
      accessInfo
      timestamp
    }
    
    # Expired funds
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
  transactionHash: string;
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

type ResourcePurchased = {
  fundId: string;
  resourceURI: string;
  purchaseAmount: string;
};

type AccessDistributed = {
  fundId: string;
  accessMetadataURI: string;
  participantCount: string;
};

type AccessClaimed = {
  fundId: string;
  contributor: string;
  accessInfo: string;
  timestamp: string;
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

export default function MyStudyFunds() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"organized" | "contributed">("organized");
  
  // Data states
  const [organizedFunds, setOrganizedFunds] = useState<StudyFundCreated[]>([]);
  const [contributedFunds, setContributedFunds] = useState<string[]>([]);
  const [allContributions, setAllContributions] = useState<FundContributed[]>([]);
  const [targetReached, setTargetReached] = useState<FundTargetReached[]>([]);
  const [finalized, setFinalized] = useState<FundFinalized[]>([]);
  const [resourcePurchased, setResourcePurchased] = useState<ResourcePurchased[]>([]);
  const [accessDistributed, setAccessDistributed] = useState<AccessDistributed[]>([]);
  const [accessClaims, setAccessClaims] = useState<AccessClaimed[]>([]);
  const [expired, setExpired] = useState<FundExpired[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);

  // Contract interaction states
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  const { data: hash, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const fetchUserFunds = async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      const client = new GraphQLClient(GRAPHQL_ENDPOINT);
      const data = await client.request<{
        studyFundCreateds: StudyFundCreated[];
        fundContributeds: FundContributed[];
        fundTargetReacheds: FundTargetReached[];
        fundFinalizeds: FundFinalized[];
        resourcePurchaseds: ResourcePurchased[];
        accessDistributeds: AccessDistributed[];
        accessClaimeds: AccessClaimed[];
        fundExpireds: FundExpired[];
      }>(USER_FUNDS_QUERY, { user: address.toLowerCase() });

      setOrganizedFunds(data.studyFundCreateds || []);
      
      // Extract unique fund IDs that user contributed to
      const userContributions = data.fundContributeds.filter(c => 
        c.contributor.toLowerCase() === address.toLowerCase()
      );
      const uniqueFundIds = [...new Set(userContributions.map(c => c.fundId))];
      setContributedFunds(uniqueFundIds);
      
      setAllContributions(data.fundContributeds || []);
      setTargetReached(data.fundTargetReacheds || []);
      setFinalized(data.fundFinalizeds || []);
      setResourcePurchased(data.resourcePurchaseds || []);
      setAccessDistributed(data.accessDistributeds || []);
      setAccessClaims(data.accessClaimeds || []);
      setExpired(data.fundExpireds || []);
    } catch (err: any) {
      console.error("Failed to fetch user funds:", err);
      setError(err.message || "Failed to fetch user funds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchUserFunds();
    }
  }, [isConnected, address]);

  const getFundStatus = (fundId: string) => {
    if (expired.some(e => e.fundId === fundId)) return "expired";
    if (accessDistributed.some(a => a.fundId === fundId)) return "access_distributed";
    if (resourcePurchased.some(r => r.fundId === fundId)) return "resource_purchased";
    if (finalized.some(f => f.fundId === fundId)) return "finalized";
    if (targetReached.some(t => t.fundId === fundId)) return "funded";
    
    // Check if active fund has expired
    const fund = organizedFunds.find(f => f.fundId === fundId);
    if (fund) {
      const now = Date.now() / 1000;
      const deadline = parseInt(fund.deadline);
      if (now > deadline) return "expired";
    }
    
    return "active";
  };

  const getFundProgress = (fundId: string) => {
    const fund = organizedFunds.find(f => f.fundId === fundId);
    if (!fund) return 0;
    
    const fundContributions = allContributions.filter(c => c.fundId === fundId);
    const totalContributed = fundContributions.length * parseFloat(formatUnits(BigInt(fund.contributionAmount), 6));
    const target = parseFloat(formatUnits(BigInt(fund.targetAmount), 6));
    return Math.min((totalContributed / target) * 100, 100);
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
      case "finalized": return "bg-blue-500";
      case "resource_purchased": return "bg-purple-500";
      case "access_distributed": return "bg-emerald-500";
      case "expired": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "funded": return "Funded";
      case "finalized": return "Finalized";
      case "resource_purchased": return "Resource Purchased";
      case "access_distributed": return "Access Available";
      case "expired": return "Expired";
      default: return "Unknown";
    }
  };

  const handleFinalizeFund = async (fundId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`finalize_${fundId}`]: true }));
      setWriteError(null);

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FlashStudyabi.abi,
        functionName: "finalizeFund",
        args: [BigInt(fundId)],
      });
    } catch (err: any) {
      console.error("Finalize fund error:", err);
      setWriteError(err.message || "Failed to finalize fund");
    } finally {
      setActionLoading(prev => ({ ...prev, [`finalize_${fundId}`]: false }));
    }
  };

  const handleRecordPurchase = async (fundId: string, resourceURI: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`purchase_${fundId}`]: true }));
      setWriteError(null);

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FlashStudyabi.abi,
        functionName: "recordResourcePurchase",
        args: [BigInt(fundId), resourceURI],
      });
    } catch (err: any) {
      console.error("Record purchase error:", err);
      setWriteError(err.message || "Failed to record purchase");
    } finally {
      setActionLoading(prev => ({ ...prev, [`purchase_${fundId}`]: false }));
    }
  };

  const handleDistributeAccess = async (fundId: string, accessURI: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`distribute_${fundId}`]: true }));
      setWriteError(null);

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FlashStudyabi.abi,
        functionName: "distributeAccess",
        args: [BigInt(fundId), accessURI],
      });
    } catch (err: any) {
      console.error("Distribute access error:", err);
      setWriteError(err.message || "Failed to distribute access");
    } finally {
      setActionLoading(prev => ({ ...prev, [`distribute_${fundId}`]: false }));
    }
  };

  const handleClaimAccess = async (fundId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`claim_${fundId}`]: true }));
      setWriteError(null);

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FlashStudyabi.abi,
        functionName: "claimAccess",
        args: [BigInt(fundId)],
      });
    } catch (err: any) {
      console.error("Claim access error:", err);
      setWriteError(err.message || "Failed to claim access");
    } finally {
      setActionLoading(prev => ({ ...prev, [`claim_${fundId}`]: false }));
    }
  };

  // Get contributed fund details
  const getContributedFundDetails = (fundId: string) => {
    const fund = organizedFunds.find(f => f.fundId === fundId);
    if (fund) return fund;
    
    // If fund not in organized funds, it might be from another organizer
    // We'd need the fund details, but for now return null
    return null;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-800 p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400">
            Please connect your wallet to view your study funds
          </p>
        </motion.div>
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
        <h1 className="text-3xl font-bold text-white mb-2">My Study Funds</h1>
        <p className="text-gray-400">
          Track your organized funds, contributed learning opportunities, and access your educational resources
        </p>
      </motion.div>

      {/* Balance Display */}
      {usdcBalance !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-gray-700 rounded-lg"
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Your USDC Balance:</span>
            <span className="text-white font-bold text-lg">
              {formatUnits(usdcBalance, 6)} USDC
            </span>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("organized")}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              activeTab === "organized"
                ? "bg-emerald-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-600"
            }`}
          >
            Organized Funds ({organizedFunds.length})
          </button>
          <button
            onClick={() => setActiveTab("contributed")}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              activeTab === "contributed"
                ? "bg-emerald-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-600"
            }`}
          >
            Contributed Funds ({contributedFunds.length})
          </button>
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

      {writeError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <p className="text-red-400">{writeError}</p>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mr-3"
          />
          <span className="text-white">Loading your funds...</span>
        </div>
      ) : (
        <>
          {/* Organized Funds Tab */}
          {activeTab === "organized" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {organizedFunds.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Organized Funds</h3>
                  <p className="text-gray-400">
                    You don't have any study funds organized yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {organizedFunds.map((fund, index) => {
                    const status = getFundStatus(fund.fundId);
                    const progress = getFundProgress(fund.fundId);
                    const fundContributors = allContributions.filter(c => c.fundId === fund.fundId);
                    
                    return (
                      <motion.div
                        key={fund.fundId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-700 rounded-lg p-6"
                      >
                        {/* Fund Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {topicIcons[fund.topic as keyof typeof topicIcons] || "📦"}
                            </span>
                            <div>
                              <h3 className="font-semibold text-white">
                                Fund #{fund.fundId}
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
                        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                          {fund.description}
                        </p>

                        {/* Progress */}
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

                        {/* Fund Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-400">Target:</span>
                            <div className="text-white font-medium">
                              {formatUnits(BigInt(fund.targetAmount), 6)} USDC
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">Contributors:</span>
                            <div className="text-white font-medium">
                              {fundContributors.length}/{fund.maxParticipants}
                            </div>
                          </div>
                          {status === "active" && (
                            <div className="col-span-2">
                              <span className="text-gray-400">Time Remaining:</span>
                              <div className="text-white font-medium">
                                {getTimeRemaining(fund.deadline)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          {status === "funded" && !finalized.some(f => f.fundId === fund.fundId) && (
                            <motion.button
                              onClick={() => handleFinalizeFund(fund.fundId)}
                              disabled={actionLoading[`finalize_${fund.fundId}`]}
                              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {actionLoading[`finalize_${fund.fundId}`] ? "Finalizing..." : "Finalize Fund"}
                            </motion.button>
                          )}
                          
                          {status === "finalized" && !resourcePurchased.some(r => r.fundId === fund.fundId) && (
                            <motion.button
                              onClick={() => {
                                const resourceURI = prompt("Enter resource URI/link:");
                                if (resourceURI) handleRecordPurchase(fund.fundId, resourceURI);
                              }}
                              disabled={actionLoading[`purchase_${fund.fundId}`]}
                              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {actionLoading[`purchase_${fund.fundId}`] ? "Recording..." : "Record Purchase"}
                            </motion.button>
                          )}
                          
                          {status === "resource_purchased" && !accessDistributed.some(a => a.fundId === fund.fundId) && (
                            <motion.button
                              onClick={() => {
                                const accessURI = prompt("Enter access information URI:");
                                if (accessURI) handleDistributeAccess(fund.fundId, accessURI);
                              }}
                              disabled={actionLoading[`distribute_${fund.fundId}`]}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {actionLoading[`distribute_${fund.fundId}`] ? "Distributing..." : "Distribute Access"}
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Contributed Funds Tab */}
          {activeTab === "contributed" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {contributedFunds.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎓</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Contributions Yet</h3>
                  <p className="text-gray-400">
                    You haven't contributed to any study funds yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {contributedFunds.map((fundId, index) => {
                    const fund = getContributedFundDetails(fundId);
                    if (!fund) return null;
                    
                    const status = getFundStatus(fundId);
                    const hasAccess = accessDistributed.some(a => a.fundId === fundId);
                    const hasClaimed = accessClaims.some(c => c.fundId === fundId);
                    
                    return (
                      <motion.div
                        key={fundId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-700 rounded-lg p-6"
                      >
                        {/* Fund Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {topicIcons[fund.topic as keyof typeof topicIcons] || "📦"}
                            </span>
                            <div>
                              <h3 className="font-semibold text-white">
                                Fund #{fund.fundId}
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
                        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                          {fund.description}
                        </p>

                        {/* Contribution Info */}
                        <div className="bg-gray-600 rounded-lg p-3 mb-4">
                          <div className="text-sm text-gray-400 mb-1">Your Contribution</div>
                          <div className="text-white font-medium">
                            {formatUnits(BigInt(fund.contributionAmount), 6)} USDC
                          </div>
                        </div>

                        {/* Access Status */}
                        {hasAccess && !hasClaimed && (
                          <motion.button
                            onClick={() => handleClaimAccess(fundId)}
                            disabled={actionLoading[`claim_${fundId}`]}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {actionLoading[`claim_${fundId}`] ? "Claiming..." : "Claim Access"}
                          </motion.button>
                        )}
                        
                        {hasClaimed && (
                          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                            <div className="text-emerald-400 font-medium">✓ Access Claimed</div>
                            <div className="text-sm text-gray-400">You have access to the resource</div>
                          </div>
                        )}
                        
                        {!hasAccess && (
                          <div className="w-full bg-gray-600 rounded-lg p-3 text-center">
                            <div className="text-gray-400">Waiting for access distribution</div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}