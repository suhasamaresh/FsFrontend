"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits, formatUnits, erc20Abi } from "viem";
import { motion } from "framer-motion";
import { abi as FlashStudyAbi } from "../../../FlashStudy.json";

const CONTRACT_ADDRESS = "0x0d6484Ae57198Fe38d8EFcD45338cFfda58C2D64" as const; // Replace with actual FlashStudy contract address
const USDC_ADDRESS = "0x4C2AA252BEe766D3399850569713b55178934849" as const;

const topics = [
  { value: "programming", label: "Programming & Tech", icon: "💻", description: "Coding courses, certifications, and tools" },
  { value: "design", label: "Design & Creative", icon: "🎨", description: "Design software, courses, and resources" },
  { value: "business", label: "Business & Marketing", icon: "💼", description: "Business courses and marketing tools" },
  { value: "language", label: "Language Learning", icon: "🗣️", description: "Language courses and learning materials" },
  { value: "science", label: "Science & Research", icon: "🔬", description: "Research papers, lab access, and courses" },
  { value: "personal", label: "Personal Development", icon: "🌱", description: "Self-improvement courses and materials" },
  { value: "art", label: "Art & Music", icon: "🎭", description: "Art supplies, music tools, and courses" },
  { value: "health", label: "Health & Wellness", icon: "🏃", description: "Fitness programs and wellness courses" },
  { value: "other", label: "Other", icon: "📦", description: "Other educational resources" },
];

const durationOptions = [
  { value: 24, label: "1 Day" },
  { value: 72, label: "3 Days" },
  { value: 168, label: "1 Week" },
  { value: 336, label: "2 Weeks" },
  { value: 720, label: "1 Month" },
  { value: 2160, label: "3 Months" },
];

type StudyFundForm = {
  topic: string;
  description: string;
  contributionAmount: string;
  targetAmount: string;
  maxParticipants: string;
  duration: number;
};

export default function CreateStudyFund() {
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState<StudyFundForm>({
    topic: "programming",
    description: "",
    contributionAmount: "",
    targetAmount: "",
    maxParticipants: "10",
    duration: 720, // 1 month default
  });

  const [error, setError] = useState("");
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
    if (form.targetAmount && usdcAllowance !== undefined) {
      try {
        const targetAmountWei = parseUnits(form.targetAmount, 6); // USDC has 6 decimals
        setNeedsApproval(usdcAllowance < targetAmountWei);
      } catch {
        setNeedsApproval(false);
      }
    }
  }, [form.targetAmount, usdcAllowance]);

  // Refetch allowance after approval success
  useEffect(() => {
    if (isApprovalSuccess) {
      refetchAllowance();
      setIsApproving(false);
    }
  }, [isApprovalSuccess, refetchAllowance]);

  const handleApprove = async () => {
    if (!form.targetAmount) {
      setError("Enter target amount first");
      return;
    }

    try {
      setError("");
      setIsApproving(true);
      const targetAmountWei = parseUnits(form.targetAmount, 6); // USDC has 6 decimals

      writeApproval({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, targetAmountWei],
      });
    } catch (err: any) {
      console.error("Approval error:", err);
      setError(err.message || "Failed to approve USDC");
      setIsApproving(false);
    }
  };

  const validateForm = () => {
    if (!form.description.trim()) {
      setError("Description is required");
      return false;
    }

    if (!form.contributionAmount || parseFloat(form.contributionAmount) <= 0) {
      setError("Contribution amount must be greater than 0");
      return false;
    }

    if (!form.targetAmount || parseFloat(form.targetAmount) <= 0) {
      setError("Target amount must be greater than 0");
      return false;
    }

    if (parseFloat(form.targetAmount) < parseFloat(form.contributionAmount)) {
      setError("Target amount must be greater than or equal to contribution amount");
      return false;
    }

    const maxParticipants = parseInt(form.maxParticipants);
    if (maxParticipants < 1 || maxParticipants > 100) {
      setError("Max participants must be between 1 and 100");
      return false;
    }

    // Check if target is achievable with max participants
    const expectedTotal = parseFloat(form.contributionAmount) * maxParticipants;
    if (expectedTotal < parseFloat(form.targetAmount)) {
      setError("Target amount cannot be reached with current contribution amount and max participants");
      return false;
    }

    // Check USDC balance
    if (usdcBalance !== undefined) {
      try {
        const targetAmountWei = parseUnits(form.targetAmount, 6);
        if (usdcBalance < targetAmountWei) {
          setError(`Insufficient USDC balance. You have ${formatUnits(usdcBalance, 6)} USDC`);
          return false;
        }
      } catch {
        setError("Invalid target amount");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError("Please connect your wallet");
      return;
    }

    if (!validateForm()) {
      return;
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
      const contributionAmountWei = parseUnits(form.contributionAmount, 6);
      const targetAmountWei = parseUnits(form.targetAmount, 6);
      const durationBigInt = BigInt(form.duration);
      const maxParticipantsBigInt = BigInt(form.maxParticipants);

      console.log("Contract call params:", {
        topic: form.topic,
        description: form.description,
        contributionAmount: contributionAmountWei.toString(),
        targetAmount: targetAmountWei.toString(),
        duration: durationBigInt.toString(),
        maxParticipants: maxParticipantsBigInt.toString(),
        contractAddress: CONTRACT_ADDRESS
      });

      // Call the contract
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: FlashStudyAbi,
        functionName: "createStudyFund",
        args: [
          form.topic,
          form.description,
          contributionAmountWei,
          targetAmountWei,
          durationBigInt,
          maxParticipantsBigInt,
        ],
        value: BigInt(0),
      });
    } catch (err: any) {
      console.error("Contract call error:", err);
      let errorMessage = "Failed to create study fund";
      
      if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas or token transfer";
      } else if (err.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected";
      } else if (err.message?.includes("execution reverted")) {
        errorMessage = "Transaction failed - check contract requirements";
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
      topic: "programming",
      description: "",
      contributionAmount: "",
      targetAmount: "",
      maxParticipants: "10",
      duration: 720,
    });
    setError("");
    setIsSubmitting(false);
    setIsApproving(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-800 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto bg-gray-700 rounded-lg p-8 text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-4">Study Fund Created Successfully!</h2>
          <p className="text-gray-300 mb-6">
            Your study fund has been created and is now available for contributors to join.
          </p>
          
          <div className="mb-6 p-4 bg-gray-600 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Transaction Hash:</p>
            <p className="text-xs text-emerald-400 break-all">{hash}</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetForm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Create Another Fund
          </motion.button>
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
        <h1 className="text-3xl font-bold text-white mb-2">Create Study Fund</h1>
        <p className="text-gray-400">
          Start a collaborative learning fund and bring together a community of learners
        </p>
      </motion.div>

      {/* Connection Status */}
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
        >
          <div className="flex items-center text-yellow-400">
            <span className="text-xl mr-2">⚠️</span>
            <span>Please connect your wallet to create a study fund</span>
          </div>
        </motion.div>
      )}

      {/* USDC Balance Display */}
      {isConnected && usdcBalance !== undefined && (
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

      {/* Form */}
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Topic Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Learning Topic *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topics.map((topic) => (
              <motion.label
                key={topic.value}
                className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all ${
                  form.topic === topic.value
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-gray-600 bg-gray-700 hover:border-gray-500"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="radio"
                  name="topic"
                  value={topic.value}
                  checked={form.topic === topic.value}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="sr-only"
                  disabled={!isConnected}
                  placeholder={topic.label}
                  title={topic.label}
                />
                <div className="text-center">
                  <div className="text-2xl mb-2">{topic.icon}</div>
                  <div className="font-medium text-white text-sm">{topic.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{topic.description}</div>
                </div>
                {form.topic === topic.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-xs">✓</span>
                  </motion.div>
                )}
              </motion.label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fund Description *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what you want to learn and what resources you plan to purchase..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            rows={4}
            required
            disabled={!isConnected}
          />
          <p className="text-xs text-gray-400 mt-1">
            Be specific about the learning goals and how funds will be used
          </p>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contribution Amount (USDC) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.contributionAmount}
                onChange={(e) => setForm({ ...form, contributionAmount: e.target.value })}
                placeholder="25.00"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-16"
                required
                disabled={!isConnected}
                min="0"
                step="0.01"
              />
              <span className="absolute right-3 top-3 text-gray-400">USDC</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Amount each participant contributes
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Amount (USDC) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                placeholder="250.00"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-16"
                required
                disabled={!isConnected}
                min="0"
                step="0.01"
              />
              <span className="absolute right-3 top-3 text-gray-400">USDC</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Total funding goal for the resource
            </p>
          </div>
        </div>

        {/* Max Participants */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Maximum Participants *
          </label>
          <input
            type="number"
            value={form.maxParticipants}
            onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
            placeholder="10"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
            disabled={!isConnected}
            min="1"
            max="100"
          />
          <p className="text-xs text-gray-400 mt-1">
            Maximum number of contributors (1-100)
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Funding Duration *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {durationOptions.map((option) => (
              <motion.label
                key={option.value}
                className={`cursor-pointer p-3 rounded-lg border transition-colors ${
                  form.duration === option.value
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="radio"
                  name="duration"
                  value={option.value}
                  checked={form.duration === option.value}
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                  className="sr-only"
                  disabled={!isConnected}
                  placeholder={option.label}
                  title={option.label}
                />
                <div className="text-center font-medium">{option.label}</div>
              </motion.label>
            ))}
          </div>
        </div>

        {/* Fund Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-700 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Fund Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Topic:</span>
              <span className="text-white">
                {topics.find(t => t.value === form.topic)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">
                {durationOptions.find(d => d.value === form.duration)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Contribution Amount:</span>
              <span className="text-white">{form.contributionAmount || "0"} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Target Amount:</span>
              <span className="text-white">{form.targetAmount || "0"} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Participants:</span>
              <span className="text-white">{form.maxParticipants}</span>
            </div>
            {form.contributionAmount && form.maxParticipants && (
              <div className="flex justify-between text-emerald-400">
                <span>Potential Max Funding:</span>
                <span>
                  {(parseFloat(form.contributionAmount || "0") * parseInt(form.maxParticipants || "0")).toFixed(2)} USDC
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Approval Section */}
        {needsApproval && form.targetAmount && isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
          >
            <h3 className="text-yellow-400 font-medium mb-2">USDC Approval Required</h3>
            <p className="text-yellow-300 text-sm mb-4">
              You need to approve the contract to spend {form.targetAmount} USDC for fund creation.
            </p>
            <motion.button
              type="button"
              onClick={handleApprove}
              disabled={isApprovePending || isApprovalConfirming || isApproving}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isApprovePending || isApprovalConfirming || isApproving ? (
                "Approving..."
              ) : (
                `Approve ${form.targetAmount} USDC`
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
          >
            <div className="flex items-center text-red-400">
              <span className="text-xl mr-2">⚠️</span>
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <motion.button
            type="button"
            onClick={resetForm}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Clear Form
          </motion.button>

          <motion.button
            type="submit"
            disabled={isPending || isConfirming || isSubmitting || !isConnected || needsApproval}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isPending || isConfirming || isSubmitting ? (
              <span className="flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                {isPending || isSubmitting ? "Creating Fund..." : "Confirming..."}
              </span>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : needsApproval ? (
              "Approve USDC First"
            ) : (
              "Create Study Fund"
            )}
          </motion.button>
        </div>

        {/* How FlashStudy Works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-700 rounded-lg p-6 mt-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">How FlashStudy Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-medium text-white">Create & Fund</h4>
              <p className="text-sm text-gray-400">
                Create study fund and contributors join
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-medium text-white">Purchase</h4>
              <p className="text-sm text-gray-400">
                Organizer buys educational resource
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-medium text-white">Share</h4>
              <p className="text-sm text-gray-400">
                Access information shared with contributors
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">4</span>
              </div>
              <h4 className="font-medium text-white">Learn</h4>
              <p className="text-sm text-gray-400">
                Everyone learns together at lower cost
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contract Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-700 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Contract Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">FlashStudy Contract:</span>
              <span className="text-emerald-400 font-mono text-xs">{CONTRACT_ADDRESS}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">USDC Token:</span>
              <span className="text-emerald-400 font-mono text-xs">{USDC_ADDRESS}</span>
            </div>
          </div>
        </motion.div>
      </motion.form>
    </div>
  );
}