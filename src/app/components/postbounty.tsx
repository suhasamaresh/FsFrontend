"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { erc20Abi, formatEther, formatUnits, parseEther, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import FlashBountyAbi from "../../../FlashBounty.json";


const CONTRACT_ADDRESS = "0x0d6484Ae57198Fe38d8EFcD45338cFfda58C2D64" as const;
const USDC_ADDRESS = "0x4C2AA252BEe766D3399850569713b55178934849" as const;

const categories = [
  { value: "errand", label: "Errand", icon: "🏃", description: "Quick tasks and deliveries" },
  { value: "chore", label: "Chore", icon: "🧹", description: "Household and maintenance tasks" },
  { value: "creative", label: "Creative", icon: "🎨", description: "Design, art, and creative work" },
  { value: "tech", label: "Tech", icon: "💻", description: "Programming and technical tasks" },
  { value: "writing", label: "Writing", icon: "✍️", description: "Content creation and copywriting" },
  { value: "research", label: "Research", icon: "🔬", description: "Data gathering and analysis" },
  { value: "other", label: "Other", icon: "📦", description: "Miscellaneous tasks" },
];

const durationOptions = [
  { value: 1, label: "1 Hour" },
  { value: 4, label: "4 Hours" },
  { value: 12, label: "12 Hours" },
  { value: 24, label: "1 Day" },
  { value: 48, label: "2 Days" },
  { value: 72, label: "3 Days" },
  { value: 168, label: "1 Week" },
];

type BountyForm = {
  description: string;
  category: string;
  stakeAmount: string;
  tipAmount: string;
  duration: number;
};

export default function PostBountyPage() {
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState<BountyForm>({
    description: "",
    category: "errand",
    stakeAmount: "",
    tipAmount: "",
    duration: 24,
  });
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Contract hooks
  const { data: hash, isPending, writeContract } = useWriteContract();
  const { data: approvalHash, isPending: isApprovePending, writeContract: writeApproval } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
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

  // Check if approval is needed when form changes
  useEffect(() => {
    if (form.tipAmount && usdcAllowance !== undefined) {
      try {
        const tipAmountWei = parseUnits(form.tipAmount, 6); // USDC has 6 decimals
        setNeedsApproval(usdcAllowance < tipAmountWei);
      } catch {
        setNeedsApproval(false);
      }
    }
  }, [form.tipAmount, usdcAllowance]);

  // Refetch allowance after approval success
  useEffect(() => {
    if (isApprovalSuccess) {
      refetchAllowance();
      setIsApproving(false);
    }
  }, [isApprovalSuccess, refetchAllowance]);

  const handleApprove = async () => {
    if (!form.tipAmount) {
      setError("Enter tip amount first");
      return;
    }

    try {
      setError("");
      setIsApproving(true);
      
      const tipAmountWei = parseUnits(form.tipAmount, 6); // USDC has 6 decimals
      
      writeApproval({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, tipAmountWei],
      });
    } catch (err: any) {
      console.error("Approval error:", err);
      setError(err.message || "Failed to approve USDC");
      setIsApproving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError("Please connect your wallet");
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }

    if (!form.stakeAmount || parseFloat(form.stakeAmount) <= 0) {
      setError("Stake amount must be greater than 0");
      return;
    }

    if (!form.tipAmount || parseFloat(form.tipAmount) <= 0) {
      setError("Tip amount must be greater than 0");
      return;
    }

    // Check USDC balance
    if (usdcBalance !== undefined) {
      try {
        const tipAmountWei = parseUnits(form.tipAmount, 6); // USDC has 6 decimals
        if (usdcBalance < tipAmountWei) {
          setError(`Insufficient USDC balance. You have ${formatUnits(usdcBalance, 6)} USDC`);
          return;
        }
      } catch {
        setError("Invalid tip amount");
        return;
      }
    }

    // Check if approval is needed
    if (needsApproval) {
      setError("Please approve USDC spending first");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      // Convert amounts to BigInt with proper precision
      const stakeAmountWei = parseUnits(form.stakeAmount, 6); // USDC has 6 decimals
      const tipAmountWei = parseUnits(form.tipAmount, 6); // USDC has 6 decimals
      const durationBigInt = BigInt(form.duration);

      console.log("Contract call params:", {
        description: form.description,
        category: form.category,
        stakeAmount: stakeAmountWei.toString(),
        tipAmount: tipAmountWei.toString(),
        duration: durationBigInt.toString(),
        contractAddress: CONTRACT_ADDRESS
      });

      // Call the contract with proper types
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: FlashBountyAbi.abi,
        functionName: "postBounty",
        args: [
          form.description,
          form.category,
          stakeAmountWei,
          tipAmountWei,
          durationBigInt,
        ],
        // Remove gas limit to let wagmi estimate
        // value: BigInt(0), // Remove value if not required by contract
      });

    } catch (err: any) {
      console.error("Contract call error:", err);
      
      // More specific error handling
      let errorMessage = "Failed to post bounty";
      
      if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas or token transfer";
      } else if (err.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected";
      } else if (err.message?.includes("execution reverted")) {
        errorMessage = "Transaction failed - check contract requirements";
      } else if (err.message?.includes("nonce")) {
        errorMessage = "Transaction nonce error - please try again";
      } else if (err.cause?.message) {
        errorMessage = err.cause.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Reset form when transaction is successful
  useEffect(() => {
    if (isSuccess) {
      setIsSubmitting(false);
    }
  }, [isSuccess]);

  const resetForm = () => {
    setForm({
      description: "",
      category: "errand",
      stakeAmount: "",
      tipAmount: "",
      duration: 24,
    });
    setError("");
    setIsSubmitting(false);
    setIsApproving(false);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-4">Bounty Posted Successfully!</h2>
          <p className="text-gray-300 mb-6">
            Your bounty has been posted and is now available for workers to claim.
          </p>
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-400">Transaction Hash:</p>
            <p className="text-emerald-400 font-mono text-sm break-all">{hash}</p>
          </div>
          <button
            onClick={resetForm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Post Another Bounty
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Post a New Bounty</h1>
          <p className="text-gray-400 text-lg">
            Create micro-task bounties with stake requirements and tips
          </p>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">⚠️</span>
              <span className="text-red-400 font-medium">Please connect your wallet to post a bounty</span>
            </div>
          </div>
        )}

        {/* USDC Balance Display */}
        {isConnected && usdcBalance !== undefined && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-400 font-medium">Your USDC Balance:</span>
              <span className="text-white font-bold">{formatUnits(usdcBalance, 6)} USDC</span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-gray-800 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Task Description *
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the task in detail..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                rows={4}
                required
                disabled={!isConnected}
              />
              <p className="text-gray-400 text-sm mt-1">
                Be specific about what needs to be done and any requirements
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <label
                    key={category.value}
                    className={`relative cursor-pointer rounded-lg p-4 border-2 transition-all ${
                      form.category === category.value
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-gray-600 hover:border-gray-500"
                    } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={form.category === category.value}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="sr-only"
                      disabled={!isConnected}
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div className="font-semibold text-white">{category.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{category.description}</div>
                    </div>
                    {form.category === category.value && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="stakeAmount" className="block text-sm font-medium text-gray-300 mb-2">
                  Required Stake (USDC) *
                </label>
                <div className="relative">
                  <input
                    id="stakeAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.stakeAmount}
                    onChange={(e) => setForm({ ...form, stakeAmount: e.target.value })}
                    placeholder="10.00"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                    disabled={!isConnected}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-400 text-sm">USDC</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Amount workers must stake to claim this bounty
                </p>
              </div>

              <div>
                <label htmlFor="tipAmount" className="block text-sm font-medium text-gray-300 mb-2">
                  Tip Amount (USDC) *
                </label>
                <div className="relative">
                  <input
                    id="tipAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.tipAmount}
                    onChange={(e) => setForm({ ...form, tipAmount: e.target.value })}
                    placeholder="25.00"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                    disabled={!isConnected}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-400 text-sm">USDC</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Payment to worker upon completion (plus stake refund)
                </p>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Deadline *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {durationOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-lg p-3 text-center border-2 transition-all ${
                      form.duration === option.value
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-gray-600 text-gray-300 hover:border-gray-500"
                    } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value={option.value}
                      checked={form.duration === option.value}
                      onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                      className="sr-only"
                      disabled={!isConnected}
                    />
                    <div className="font-semibold">{option.label}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Bounty Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Category:</span>
                  <span className="text-white ml-2">
                    {categories.find(c => c.value === form.category)?.label}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Deadline:</span>
                  <span className="text-white ml-2">
                    {durationOptions.find(d => d.value === form.duration)?.label}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Required Stake:</span>
                  <span className="text-white ml-2">{form.stakeAmount || "0"} USDC</span>
                </div>
                <div>
                  <span className="text-gray-400">Tip Amount:</span>
                  <span className="text-white ml-2">{form.tipAmount || "0"} USDC</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-400">Total Worker Payout:</span>
                  <span className="text-emerald-400 ml-2 font-semibold">
                    {(parseFloat(form.stakeAmount || "0") + parseFloat(form.tipAmount || "0")).toFixed(2)} USDC
                  </span>
                  <span className="text-gray-400 text-xs ml-1">(stake refund + tip)</span>
                </div>
              </div>
            </div>

            {/* Approval Section */}
            {needsApproval && form.tipAmount && isConnected && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                <h4 className="text-yellow-400 font-medium mb-3">USDC Approval Required</h4>
                <p className="text-gray-300 text-sm mb-4">
                  You need to approve the contract to spend {form.tipAmount} USDC for the tip escrow.
                </p>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApprovePending || isApprovalConfirming || isApproving}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  {isApprovePending || isApprovalConfirming || isApproving ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Approving...</span>
                    </div>
                  ) : (
                    `Approve ${form.tipAmount} USDC`
                  )}
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">⚠️</span>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={!isConnected || isPending || isConfirming || isSubmitting || needsApproval}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                {isPending || isConfirming || isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isPending || isSubmitting ? "Posting..." : "Confirming..."}</span>
                  </div>
                ) : !isConnected ? (
                  "Connect Wallet"
                ) : needsApproval ? (
                  "Approve USDC First"
                ) : (
                  "Post Bounty"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">How FlashBounty Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-blue-400 font-semibold mb-1">1. Post & Escrow</div>
              <div className="text-gray-300">Post your bounty and escrow the tip amount in USDC</div>
            </div>
            <div>
              <div className="text-blue-400 font-semibold mb-1">2. Workers Stake</div>
              <div className="text-gray-300">Workers stake USDC to claim and complete tasks</div>
            </div>
            <div>
              <div className="text-blue-400 font-semibold mb-1">3. Complete & Earn</div>
              <div className="text-gray-300">Workers get stake refund + tip upon completion</div>
            </div>
          </div>
        </div>

        {/* Contract Addresses */}
        <div className="bg-gray-800/50 border border-gray-600/30 rounded-xl p-4">
          <h4 className="text-gray-300 font-medium mb-2">Contract Information</h4>
          <div className="text-xs space-y-1">
            <div>
              <span className="text-gray-400">FlashBounty Contract:</span>
              <span className="text-emerald-400 font-mono ml-2">{CONTRACT_ADDRESS}</span>
            </div>
            <div>
              <span className="text-gray-400">USDC Token:</span>
              <span className="text-emerald-400 font-mono ml-2">{USDC_ADDRESS}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
