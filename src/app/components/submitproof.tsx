"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { GraphQLClient, gql } from "graphql-request";

import FlashBountyAbi from "../../../FlashBounty.json";


const CONTRACT_ADDRESS = "0x0d6484Ae57198Fe38d8EFcD45338cFfda58C2D64" as const;
const USDC_ADDRESS = "0x4C2AA252BEe766D3399850569713b55178934849" as const;
const GRAPHQL_ENDPOINT =
  "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FlashBounty/1.0.0/gn";

const categoryIcons: Record<string, string> = {
  errand: "🏃‍♂️",
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

export default function SubmitProofPage() {
  const { address, isConnected } = useAccount();

  const [claimedBounties, setClaimedBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBountyId, setSelectedBountyId] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitError, setSubmitError] = useState("");

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    async function fetchClaimedBounties() {
      if (!address) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const client = new GraphQLClient(GRAPHQL_ENDPOINT);
        const query = gql`
          query GetUserBounties($userAddress: String!) {
            bountyPosteds(orderBy: timestamp_, orderDirection: desc) {
              bountyId
              poster
              description
              category
              stakeAmount
              tipAmount
              deadline
              timestamp_
            }
            bountyClaimeds(where: { worker: $userAddress }, orderBy: timestamp_, orderDirection: desc) {
              bountyId
              worker
              stakeAmount
              timestamp_
            }
            bountySubmitteds(orderBy: timestamp_, orderDirection: desc) {
              bountyId
              worker
              proofHash
              timestamp_
            }
            bountyCompleteds(where: { worker: $userAddress }, orderBy: timestamp_, orderDirection: desc) {
              bountyId
              poster
              worker
              stakeRefund
              tipPaid
              timestamp_
            }
          }
        `;
        const data = await client.request(query, { userAddress: address.toLowerCase() }) as {
          bountyClaimeds: any[];
          bountyPosteds: any[];
          bountySubmitteds: any[];
          bountyCompleteds: any[];
        };

        const userClaimedBounties = data.bountyClaimeds || [];
        const allBountyPosts = data.bountyPosteds || [];
        const allSubmittedBounties = data.bountySubmitteds || [];
        const userCompletedBounties = data.bountyCompleteds || [];

        const submittedIds = new Set(
          allSubmittedBounties.filter((b: any) => b.worker?.toLowerCase() === address.toLowerCase()).map((b: any) => b.bountyId)
        );
        const completedIds = new Set(userCompletedBounties.map((c: any) => c.bountyId));

        const filtered = userClaimedBounties
          .filter((c: any) => !submittedIds.has(c.bountyId) && !completedIds.has(c.bountyId))
          .map((c: any) => {
            const post = allBountyPosts.find((p: any) => p.bountyId === c.bountyId);
            return {
              ...c,
              ...(post || {}),
            };
          });

        setClaimedBounties(filtered);
      } catch (err: any) {
        setError(err.message || "Failed to fetch bounties");
      } finally {
        setLoading(false);
      }
    }

    fetchClaimedBounties();
  }, [address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBountyId) {
      setSubmitError("Please select a bounty");
      return;
    }
    if (!proofUrl.trim()) {
      setSubmitError("Please enter the proof URL");
      return;
    }
    setSubmitError("");

    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FlashBountyAbi.abi,
        functionName: "submitBounty",
        args: [BigInt(selectedBountyId), proofUrl],
      });
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit proof");
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
            Please connect your wallet to submit proof
          </p>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-emerald-400 text-5xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Proof Submitted Successfully!
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Your proof for bounty #{selectedBountyId} has been submitted and is now under review.
          </p>
          <button
            onClick={() => {
              setSelectedBountyId("");
              setProofUrl("");
              setDescription("");
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/25"
          >
            Submit Another Proof
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Submit <span className="text-emerald-600">Proof</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Select your claimed bounty and provide proof of completion
          </p>
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
              <span className="text-lg">Loading your claimed bounties...</span>
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

        {/* No Bounties State */}
        {!loading && claimedBounties.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-blue-400 text-4xl">📋</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              No Claimed Bounties
            </h3>
            <p className="text-gray-400 text-lg">
              You currently have no claimed bounties available for submission.
            </p>
          </motion.div>
        )}

        {/* Bounty Selection */}
        {claimedBounties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-black to-gray-900 rounded-xl border border-emerald-600/30 p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-blue-400">🎯</span>
                Your Claimed Bounties
              </h2>
              
              <div className="grid gap-4">
                {claimedBounties.map((bounty, index) => {
                  const timeRemaining = getTimeRemaining(bounty.deadline);
                  const isSelected = selectedBountyId === bounty.bountyId;
                  
                  return (
                    <motion.div
                      key={bounty.bountyId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedBountyId(bounty.bountyId)}
                      className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg ${
                        isSelected
                          ? "bg-emerald-600/10 border-emerald-600 shadow-emerald-600/20"
                          : "border-gray-600/50 hover:border-gray-500 hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-xl">
                            {categoryIcons[bounty.category || "other"]}
                          </div>
                          <div>
                            <div className="text-white font-semibold text-lg">
                              Bounty #{bounty.bountyId}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full">
                                {categoryNames[bounty.category as keyof typeof categoryNames] || "Other"}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                timeRemaining === "Expired" 
                                  ? "bg-red-600/20 text-red-400" 
                                  : "bg-green-600/20 text-green-400"
                              }`}>
                                {timeRemaining === "Expired" ? "⚠️ Expired" : `⏰ ${timeRemaining}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-300 mb-4 line-clamp-2">
                        {bounty.description || "No description provided"}
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-yellow-600/10 rounded-lg p-3 border border-yellow-600/20">
                          <div className="text-xs text-gray-400 mb-1">Staked Amount</div>
                          <div className="text-yellow-400 font-semibold">
                            {formatUnits(BigInt(bounty.stakeAmount), 6)} USDC
                          </div>
                        </div>
                        <div className="bg-emerald-600/10 rounded-lg p-3 border border-emerald-600/20">
                          <div className="text-xs text-gray-400 mb-1">Potential Tip</div>
                          <div className="text-emerald-400 font-semibold">
                            {formatUnits(BigInt(bounty.tipAmount), 6)} USDC
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Proof Submission Form */}
        {claimedBounties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="bg-gradient-to-br from-black to-gray-900 rounded-xl border border-emerald-600/30 p-6">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-emerald-400">📄</span>
                Submit Your Proof
              </h3>

              {/* Selected Bounty Display */}
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-semibold mb-3">Selected Bounty</label>
                <div className={`p-4 rounded-xl border-2 transition-all ${
                  selectedBountyId 
                    ? "bg-emerald-600/10 border-emerald-600/30 text-emerald-400" 
                    : "bg-gray-800 border-gray-600 text-gray-400"
                }`}>
                  {selectedBountyId ? (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <span className="font-semibold">Bounty #{selectedBountyId}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👆</span>
                      <span>Please select a bounty above</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Proof URL Input */}
              <div className="mb-6">
                <label htmlFor="proofUrl" className="block text-gray-300 text-sm font-semibold mb-3">
                  Proof URL <span className="text-red-400">*</span>
                </label>
                <input
                  id="proofUrl"
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://example.com/your-proof.pdf"
                  required
                  className="w-full rounded-xl px-4 py-3 bg-gray-800 border-2 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-600 focus:outline-none transition-all"
                />
                <p className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                  <span>💡</span>
                  Make sure the URL is publicly accessible and contains your proof of work completion
                </p>
              </div>

              {/* Additional Notes */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-gray-300 text-sm font-semibold mb-3">
                  Additional Notes <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any additional information for the bounty creator..."
                  className="w-full rounded-xl px-4 py-3 bg-gray-800 border-2 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-600 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Error Messages */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl"
                >
                  <p className="text-red-400 font-semibold flex items-center gap-2">
                    <span>⚠️</span>
                    {submitError}
                  </p>
                </motion.div>
              )}

              {writeError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl"
                >
                  <p className="text-red-400 font-semibold flex items-center gap-2">
                    <span>⚠️</span>
                    {writeError.message}
                  </p>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedBountyId || !proofUrl || isPending || isConfirming}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                  isPending || isConfirming 
                    ? "bg-gray-600 cursor-not-allowed text-gray-300" 
                    : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg hover:shadow-emerald-600/25"
                }`}
              >
                {isPending || isConfirming ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    <span>{isPending ? "Submitting..." : "Confirming..."}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span>📤</span>
                    <span>Submit Proof</span>
                  </div>
                )}
              </button>

              {/* Help Text */}
              <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-xl">
                <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                  <span>💡</span>
                  Tips for Successful Submission
                </h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Ensure your proof URL is publicly accessible</li>
                  <li>• Include clear evidence of task completion</li>
                  <li>• Submit before the deadline to avoid expiration</li>
                  <li>• Add notes to help the bounty creator understand your work</li>
                </ul>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}