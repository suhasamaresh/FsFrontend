"use client";

import React, { useState, useEffect } from "react";
import { GraphQLClient, gql } from "graphql-request";
import { formatUnits } from "viem";
import { motion } from "framer-motion";

const GRAPHQL_ENDPOINT = "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FlashStudy/1.0.0/gn";

const STUDY_FUND_DETAILS_QUERY = gql`
  query GetStudyFundDetails($fundId: String!) {
    studyFundCreateds(where: { fundId: $fundId }) {
      fundId
      organizer
      topic
      description
      contributionAmount
      targetAmount
      deadline
      maxParticipants
    }
    
    fundContributeds(where: { fundId: $fundId }) {
      fundId
      contributor
      amount
    }
    
    fundTargetReacheds(where: { fundId: $fundId }) {
      fundId
      totalAmount
      participantCount
    }
    
    fundFinalizeds(where: { fundId: $fundId }) {
      fundId
      organizer
      finalAmount
    }
    
    resourcePurchaseds(where: { fundId: $fundId }) {
      fundId
      resourceURI
      purchaseAmount
    }
    
    accessDistributeds(where: { fundId: $fundId }) {
      fundId
      accessMetadataURI
      participantCount
    }
    
    accessClaimeds(where: { fundId: $fundId }) {
      fundId
      contributor
      accessInfo
    }
    
    fundExpireds(where: { fundId: $fundId }) {
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
};

type FundContributed = {
  fundId: string;
  contributor: string;
  amount: string;
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

export default function StudyFundDetailsPage() {
  const [fundId, setFundId] = useState("");
  const [studyFund, setStudyFund] = useState<StudyFundCreated | null>(null);
  const [contributions, setContributions] = useState<FundContributed[]>([]);
  const [targetReached, setTargetReached] = useState<FundTargetReached | null>(null);
  const [finalized, setFinalized] = useState<FundFinalized | null>(null);
  const [resourcePurchased, setResourcePurchased] = useState<ResourcePurchased | null>(null);
  const [accessDistributed, setAccessDistributed] = useState<AccessDistributed | null>(null);
  const [accessClaims, setAccessClaims] = useState<AccessClaimed[]>([]);
  const [expired, setExpired] = useState<FundExpired | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudyFundDetails = async (id: string) => {
    if (!id.trim()) {
      setError("Please enter a fund ID");
      return;
    }

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
      }>(STUDY_FUND_DETAILS_QUERY, { fundId: id });

      if (data.studyFundCreateds.length === 0) {
        setError("Study fund not found");
        setStudyFund(null);
        setContributions([]);
        setTargetReached(null);
        setFinalized(null);
        setResourcePurchased(null);
        setAccessDistributed(null);
        setAccessClaims([]);
        setExpired(null);
        return;
      }

      setStudyFund(data.studyFundCreateds[0]);
      setContributions(data.fundContributeds || []);
      setTargetReached(data.fundTargetReacheds[0] || null);
      setFinalized(data.fundFinalizeds[0] || null);
      setResourcePurchased(data.resourcePurchaseds[0] || null);
      setAccessDistributed(data.accessDistributeds[0] || null);
      setAccessClaims(data.accessClaimeds || []);
      setExpired(data.fundExpireds[0] || null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch study fund details");
    } finally {
      setLoading(false);
    }
  };

  const getFundStatus = () => {
    if (expired) return "expired";
    if (accessDistributed) return "access_distributed";
    if (resourcePurchased) return "resource_purchased";
    if (finalized) return "finalized";
    if (targetReached) return "funded";
    if (studyFund) {
      const now = Date.now() / 1000;
      const deadline = parseInt(studyFund.deadline);
      if (now > deadline) return "expired";
      return "active";
    }
    return "unknown";
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

  const getFundingProgress = () => {
    if (!studyFund) return 0;
    const totalContributed = contributions.length * parseFloat(formatUnits(BigInt(studyFund.contributionAmount), 6));
    const target = parseFloat(formatUnits(BigInt(studyFund.targetAmount), 6));
    return Math.min((totalContributed / target) * 100, 100);
  };

  // Mock data for demo
  const mockFundIds = ["1", "2", "3", "4", "5"];

  return (
    <div className="min-h-screen bg-gray-800 p-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Study Fund Details</h1>
        <p className="text-gray-400">
          View detailed information about any study fund on the platform
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fund ID
            </label>
            <input
              type="text"
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              placeholder="Enter fund ID (e.g., 1, 2, 3)"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <motion.button
              onClick={() => fetchStudyFundDetails(fundId)}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? "Loading..." : "Search"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Quick Access */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <p className="text-sm text-gray-400 mb-2">Quick Access:</p>
        <div className="flex flex-wrap gap-2">
          {mockFundIds.map((id) => (
            <motion.button
              key={id}
              onClick={() => {
                setFundId(id);
                fetchStudyFundDetails(id);
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Fund #{id}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Study Fund Details */}
      {studyFund && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Info */}
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-4xl">
                  {topicIcons[studyFund.topic as keyof typeof topicIcons] || "📦"}
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Study Fund #{studyFund.fundId}
                  </h2>
                  <p className="text-gray-400">
                    {topicNames[studyFund.topic as keyof typeof topicNames] || "Other"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm text-white ${getStatusColor(getFundStatus())}`}>
                  {getStatusText(getFundStatus())}
                </span>
                {studyFund && getFundStatus() === "active" && (
                  <p className="text-gray-400 text-sm mt-2">
                    {getTimeRemaining(studyFund.deadline)} remaining
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300">{studyFund.description}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Funding Progress</span>
                <span>{getFundingProgress().toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getFundingProgress()}%` }}
                  transition={{ duration: 1 }}
                  className="bg-emerald-500 h-3 rounded-full"
                />
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-600 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Required Contribution</h4>
                <p className="text-xl font-bold text-white">
                  {formatUnits(BigInt(studyFund.contributionAmount), 6)} USDC
                </p>
              </div>
              <div className="bg-gray-600 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Target Amount</h4>
                <p className="text-xl font-bold text-white">
                  {formatUnits(BigInt(studyFund.targetAmount), 6)} USDC
                </p>
              </div>
              <div className="bg-gray-600 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Participants</h4>
                <p className="text-xl font-bold text-white">
                  {contributions.length}/{studyFund.maxParticipants}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Timeline</h3>
            <div className="space-y-6">
              {/* Fund Created */}
              <div className="flex items-start space-x-4">
                <div className="w-4 h-4 bg-emerald-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">Study Fund Created</h4>
                  
                  <p className="text-sm text-gray-400">
                    By {studyFund.organizer.slice(0, 6)}...{studyFund.organizer.slice(-4)}
                  </p>
                </div>
              </div>

              {/* Target Reached */}
              <div className="flex items-start space-x-4">
                <div className={`w-4 h-4 rounded-full mt-2 ${targetReached ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">Target Reached</h4>
                  {targetReached ? (
                    <>
                      
                      <p className="text-sm text-gray-400">
                        {targetReached.participantCount} participants contributed
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Target not reached yet</p>
                  )}
                </div>
              </div>

              {/* Fund Finalized */}
              <div className="flex items-start space-x-4">
                <div className={`w-4 h-4 rounded-full mt-2 ${finalized ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">Fund Finalized</h4>
                  {finalized ? (
                    <>
                      <p className="text-sm text-gray-400">
                        {formatUnits(BigInt(finalized.finalAmount), 6)} USDC released to organizer
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Not finalized yet</p>
                  )}
                </div>
              </div>

              {/* Resource Purchased */}
              <div className="flex items-start space-x-4">
                <div className={`w-4 h-4 rounded-full mt-2 ${resourcePurchased ? 'bg-purple-500' : 'bg-gray-500'}`}></div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">Resource Purchased</h4>
                  {resourcePurchased ? (
                    <>
                      <p className="text-sm text-gray-400">
                        Resource: {resourcePurchased.resourceURI.slice(0, 50)}...
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Resource not purchased yet</p>
                  )}
                </div>
              </div>

              {/* Access Distributed */}
              <div className="flex items-start space-x-4">
                <div className={`w-4 h-4 rounded-full mt-2 ${accessDistributed ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">Access Distributed</h4>
                  {accessDistributed ? (
                    <>
                      <p className="text-sm text-gray-400">
                        Access available to {accessDistributed.participantCount} participants
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Access not distributed yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contributors */}
          {contributions.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Contributors</h3>
              <div className="space-y-3">
                {contributions.map((contribution, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-600 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {contribution.contributor.slice(0, 6)}...{contribution.contributor.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        {formatUnits(BigInt(contribution.amount), 6)} USDC
                      </p>
                      <p className="text-xs text-gray-400">
                        {accessClaims.some(claim => claim.contributor === contribution.contributor) ? 
                          "Access Claimed" : "Pending Access"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-600 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Fund Created Transaction</span>
                  
                </div>
              </div>
              
              {contributions.map((contribution, index) => (
                <div key={index} className="p-3 bg-gray-600 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">
                      Contribution #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-8 bg-gray-700 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Study Fund Lifecycle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">1</span>
            </div>
            <h4 className="font-medium text-white">Created</h4>
            <p className="text-sm text-gray-400">Fund created and accepting contributions</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">2</span>
            </div>
            <h4 className="font-medium text-white">Funded</h4>
            <p className="text-sm text-gray-400">Target reached, ready for resource purchase</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">3</span>
            </div>
            <h4 className="font-medium text-white">Purchased</h4>
            <p className="text-sm text-gray-400">Educational resource acquired</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">4</span>
            </div>
            <h4 className="font-medium text-white">Shared</h4>
            <p className="text-sm text-gray-400">Access distributed to all contributors</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}