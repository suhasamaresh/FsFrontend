"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount, useWalletClient, useSendTransaction } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import FlashSplitAbi from "../../../FlashSplit.json";

type ExpenseCategory = 0 | 1 | 2 | 3 | 4 | 5;
type SplitType = 0 | 1 | 2 | 3;

interface CreateExpenseGroupParams {
  groupName: string;
  members: string[];
  currency: string;
  totalAmountWei: string; 
  category: ExpenseCategory;
  splitType: SplitType;
  customSplits: string[];
  isRecurring: boolean;
  recurringInterval: number;
}

const CONTRACT_ADDRESS = "0x710B24E1e66244165728CDcfbe4916b48cE20faB";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const categoryIcons = {
  0: "🍽️", // Dining
  1: "✈️", // Travel
  2: "💡", // Utilities
  3: "🎬", // Entertainment
  4: "🛍️", // Shopping
  5: "📦"  // Other
};

const splitTypeDescriptions = {
  0: "Everyone pays an equal share",
  1: "Split by percentage",
  2: "Split by exact amounts",
  3: "Split by custom shares"
};

export default function CreateExpenseGroupPage() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { sendTransactionAsync, isPending } = useSendTransaction();

  const [currentStep, setCurrentStep] = useState(1);
  const [amountXtz, setAmountXtz] = useState("");
  const [form, setForm] = useState<CreateExpenseGroupParams>({
    groupName: "",
    members: [""],
    currency: ZERO_ADDRESS,
    totalAmountWei: "",
    category: 5,
    splitType: 0,
    customSplits: [],
    isRecurring: false,
    recurringInterval: 0,
  });

  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Keep totalAmountWei in sync with amountXtz
  useEffect(() => {
    try {
      const weiValue = amountXtz ? ethers.parseEther(amountXtz).toString() : "";
      setForm(f => ({ ...f, totalAmountWei: weiValue }));
    } catch {
      setForm(f => ({ ...f, totalAmountWei: "" }));
    }
  }, [amountXtz]);

  useEffect(() => {
    if (form.splitType !== 0) {
      if (form.customSplits.length !== form.members.length) {
        const newSplits = [...form.customSplits];
        while (newSplits.length < form.members.length) newSplits.push("0");
        while (newSplits.length > form.members.length) newSplits.pop();
        setForm(f => ({ ...f, customSplits: newSplits }));
      }
    } else if (form.customSplits.length > 0) {
      setForm(f => ({ ...f, customSplits: [] }));
    }
  }, [form.members.length, form.splitType]);

  function updateField<K extends keyof CreateExpenseGroupParams>(field: K, value: CreateExpenseGroupParams[K]) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function updateMember(index: number, value: string) {
    const newMembers = [...form.members];
    newMembers[index] = value;
    updateField("members", newMembers);
  }

  function addMember() {
    if (form.members.length < 20) {
      updateField("members", [...form.members, ""]);
      if (form.splitType !== 0) {
        updateField("customSplits", [...form.customSplits, "0"]);
      }
    }
  }

  function removeMember(index: number) {
    if (form.members.length > 2) {
      const newMembers = form.members.filter((_, i) => i !== index);
      updateField("members", newMembers);
      if (form.splitType !== 0) {
        const newSplits = form.customSplits.filter((_, i) => i !== index);
        updateField("customSplits", newSplits);
      }
    }
  }

  function updateCustomSplit(index: number, value: string) {
    const newSplits = [...form.customSplits];
    newSplits[index] = value;
    updateField("customSplits", newSplits);
  }

  const encodeCreateExpenseGroup = (params: CreateExpenseGroupParams) => {
    const iface = new ethers.Interface(FlashSplitAbi.abi);
    const customSplitsBigInt = params.customSplits.map(s => BigInt(s));
    return iface.encodeFunctionData("createExpenseGroup", [
      {
        groupName: params.groupName,
        members: params.members,
        currency: params.currency,
        totalAmount: BigInt(params.totalAmountWei),
        category: params.category,
        splitType: params.splitType,
        customSplits: customSplitsBigInt,
        isRecurring: params.isRecurring,
        recurringInterval: params.recurringInterval,
      },
    ]);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTxHash(null);

    if (!isConnected) {
      setError("Connect wallet first");
      return;
    }
    if (!walletClient) {
      setError("Wallet client not available");
      return;
    }
    if (form.groupName.trim().length < 2) {
      setError("Group name too short");
      return;
    }
    if (form.members.length < 2) {
      setError("Minimum 2 members required");
      return;
    }
    if (!ethers.isAddress(form.currency)) {
      setError("Invalid currency address");
      return;
    }
    for (const m of form.members) {
      if (!ethers.isAddress(m)) {
        setError(`Invalid member address: ${m}`);
        return;
      }
    }
    if (!form.totalAmountWei || BigInt(form.totalAmountWei) < BigInt("1000000000000000")) {
      setError("Total amount (wei) must be at least 0.001 XTZ");
      return;
    }
    if (BigInt(form.totalAmountWei) > BigInt("10000000000000000000000")) {
      setError("Are you sure? Amount is unusually high!");
      return;
    }
    if (form.splitType !== 0) {
      if (form.customSplits.length !== form.members.length) {
        setError("Custom splits must match members");
        return;
      }
    }

    try {
      const data = encodeCreateExpenseGroup(form);
      const hexData: `0x${string}` = data as `0x${string}`;
      const txRequest: Parameters<typeof sendTransactionAsync>[0] = {
        to: CONTRACT_ADDRESS,
        data: hexData,
      };
      if (form.currency === ZERO_ADDRESS) {
        txRequest.value = BigInt(form.totalAmountWei);
      }

      const txResponse = await sendTransactionAsync?.(txRequest);
      if (!txResponse) throw new Error("Failed to send transaction");

      setTxHash(
        typeof txResponse === "string"
          ? txResponse
          : (txResponse as { hash: string }).hash
      );
    } catch (err: any) {
      setError(err?.message ?? "Transaction failed");
    }
  }

  const steps = [
    { id: 1, title: "Basic Info", desc: "Group name and members" },
    { id: 2, title: "Financial Details", desc: "Amount and currency" },
    { id: 3, title: "Split Configuration", desc: "How to divide expenses" },
    { id: 4, title: "Review & Create", desc: "Confirm and deploy" }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-emerald-600 text-sm font-medium mb-3">Group Name</label>
              <input
                type="text"
                required
                minLength={2}
                className="w-full rounded-xl px-4 py-3 bg-black border-2 border-emerald-600/30 text-white focus:border-emerald-600 focus:outline-none transition-colors"
                value={form.groupName}
                onChange={e => updateField("groupName", e.target.value)}
                placeholder="e.g., Weekend Trip, Office Lunch, Birthday Party"
              />
            </div>

            <div>
              <label className="block text-emerald-600 text-sm font-medium mb-3">Group Members</label>
              <div className="space-y-3">
                {form.members.map((member, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 items-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-600 text-sm font-bold">{i + 1}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="0x..."
                      required
                      minLength={42}
                      maxLength={42}
                      className="flex-grow rounded-xl px-4 py-3 bg-black border-2 border-emerald-600/30 text-white focus:border-emerald-600 focus:outline-none transition-colors"
                      value={member}
                      onChange={e => updateMember(i, e.target.value)}
                    />
                    {form.members.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeMember(i)}
                        className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center"
                        aria-label={`Remove member #${i + 1}`}
                      >
                        ×
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
              <button
                type="button"
                onClick={addMember}
                disabled={form.members.length >= 20}
                className="mt-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-500 font-medium transition-colors disabled:opacity-50"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center text-sm">+</span>
                Add Member
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-emerald-600 text-sm font-medium mb-3">Currency Address</label>
              <input
                type="text"
                required
                minLength={42}
                maxLength={42}
                placeholder="0x0000... for native XTZ"
                className="w-full rounded-xl px-4 py-3 bg-black border-2 border-emerald-600/30 text-white focus:border-emerald-600 focus:outline-none transition-colors"
                value={form.currency}
                onChange={e => updateField("currency", e.target.value)}
              />
              <p className="mt-2 text-gray-400 text-sm">Use {ZERO_ADDRESS} for native XTZ</p>
            </div>

            <div>
              <label className="block text-emerald-600 text-sm font-medium mb-3">Total Amount (XTZ)</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min={0.001}
                  value={amountXtz}
                  onChange={e => setAmountXtz(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 bg-black border-2 border-emerald-600/30 text-white focus:border-emerald-600 focus:outline-none transition-colors"
                  required
                  placeholder="e.g. 1.5"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-emerald-600 font-medium">
                  XTZ
                </div>
              </div>
              {amountXtz && (
                <div className="mt-2 p-3 bg-emerald-600/10 rounded-lg border border-emerald-600/20">
                  <p className="text-sm text-gray-300">
                    Wei equivalent: <span className="text-emerald-600 font-mono">{ethers.parseEther(amountXtz).toString()}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-emerald-600 text-sm font-medium mb-3">Category</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(categoryIcons).map(([value, icon]) => {
                  const categoryNames = ["Dining", "Travel", "Utilities", "Entertainment", "Shopping", "Other"];
                  const isSelected = form.category === Number(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateField("category", Number(value) as ExpenseCategory)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? "border-emerald-600 bg-emerald-600/20" 
                          : "border-emerald-600/30 hover:border-emerald-600/50"
                      }`}
                    >
                      <div className="text-2xl mb-2">{icon}</div>
                      <div className="text-white font-medium">{categoryNames[Number(value)]}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-emerald-600 text-sm font-medium mb-3">Split Type</label>
              <div className="space-y-3">
                {Object.entries(splitTypeDescriptions).map(([value, description]) => {
                  const splitNames = ["Equal Split", "Percentage Split", "Exact Amount", "Custom Shares"];
                  const isSelected = form.splitType === Number(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateField("splitType", Number(value) as SplitType)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected 
                          ? "border-emerald-600 bg-emerald-600/20" 
                          : "border-emerald-600/30 hover:border-emerald-600/50"
                      }`}
                    >
                      <div className="font-medium text-white mb-1">{splitNames[Number(value)]}</div>
                      <div className="text-gray-400 text-sm">{description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.splitType !== 0 && (
              <div>
                <label className="block text-emerald-600 text-sm font-medium mb-3">Custom Splits</label>
                <div className="space-y-3">
                  {form.members.map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-600 text-sm font-bold">{i + 1}</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        required
                        className="flex-grow rounded-xl px-4 py-3 bg-black border-2 border-emerald-600/30 text-white focus:border-emerald-600 focus:outline-none transition-colors"
                        value={form.customSplits[i] || ""}
                        onChange={e => updateCustomSplit(i, e.target.value)}
                        placeholder="Enter custom split (wei)"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-emerald-600/10 rounded-xl border border-emerald-600/20">
              <input
                id="isRecurring"
                type="checkbox"
                checked={form.isRecurring}
                onChange={e => updateField("isRecurring", e.target.checked)}
                className="w-5 h-5 text-emerald-600 bg-black border-emerald-600 rounded focus:ring-emerald-600"
              />
              <label htmlFor="isRecurring" className="text-white font-medium cursor-pointer">
                Make this a recurring expense
              </label>
            </div>

            {form.isRecurring && (
              <div>
                <label className="block text-emerald-600 text-sm font-medium mb-3">Recurring Interval (seconds)</label>
                <input
                  type="number"
                  min={1}
                  required
                  className="w-full rounded-xl px-4 py-3 bg-black border-2 border-emerald-600/30 text-white focus:border-emerald-600 focus:outline-none transition-colors"
                  value={form.recurringInterval}
                  onChange={e => updateField("recurringInterval", Number(e.target.value))}
                  placeholder="e.g., 2592000 (30 days)"
                />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-emerald-600/10 rounded-xl p-6 border border-emerald-600/20">
              <h3 className="text-lg font-bold text-emerald-600 mb-4">Group Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Group Name</p>
                  <p className="text-white font-medium">{form.groupName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Members</p>
                  <p className="text-white font-medium">{form.members.length} people</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Amount</p>
                  <p className="text-white font-medium">{amountXtz} XTZ</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Split Type</p>
                  <p className="text-white font-medium">
                    {["Equal", "Percentage", "Exact Amount", "Shares"][form.splitType]}
                  </p>
                </div>
              </div>
            </div>

            {form.splitType === 0 && amountXtz && (
              <div className="bg-black/50 rounded-xl p-6 border border-emerald-600/20">
                <h4 className="text-emerald-600 font-medium mb-3">Per Person Breakdown</h4>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    {(parseFloat(amountXtz) / form.members.length).toFixed(4)} XTZ
                  </div>
                  <div className="text-gray-400 text-sm">per person</div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Create Expense Group</h1>
          <p className="text-gray-400">Split expenses fairly and transparently with smart contracts</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-emerald-600/10 rounded-xl p-6 border border-emerald-600/20">
            <div className="text-2xl font-bold text-emerald-600 mb-2">1,234</div>
            <div className="text-gray-400">Groups Created</div>
          </div>
          <div className="bg-emerald-600/10 rounded-xl p-6 border border-emerald-600/20">
            <div className="text-2xl font-bold text-emerald-600 mb-2">$2.5M</div>
            <div className="text-gray-400">Total Split</div>
          </div>
          <div className="bg-emerald-600/10 rounded-xl p-6 border border-emerald-600/20">
            <div className="text-2xl font-bold text-emerald-600 mb-2">15,678</div>
            <div className="text-gray-400">Active Users</div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  currentStep >= step.id 
                    ? "bg-emerald-600 border-emerald-600 text-white" 
                    : "border-emerald-600/30 text-emerald-600"
                }`}>
                  {currentStep > step.id ? "✓" : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 transition-colors ${
                    currentStep > step.id ? "bg-emerald-600" : "bg-emerald-600/30"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.id} className="text-center">
                <div className="text-white text-sm font-medium">{step.title}</div>
                <div className="text-gray-400 text-xs">{step.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black rounded-xl border-2 border-emerald-600/30 p-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-emerald-600/20 text-emerald-600 rounded-xl hover:bg-emerald-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isPending || !isConnected}
                className={`px-6 py-3 rounded-xl transition-colors ${
                  isPending || !isConnected
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {isPending ? "Creating..." : !isConnected ? "Connect Wallet" : "Create Group"}
              </button>
            )}
          </div>
        </motion.div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl"
            >
              <p className="text-red-400 font-medium">{error}</p>
            </motion.div>
          )}
          
          {txHash && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl"
            >
              <p className="text-emerald-400 font-medium mb-2">🎉 Group created successfully!</p>
              <a
                href={`https://testnet.explorer.etherlink.com/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:text-emerald-500 underline break-all"
              >
                View transaction: {txHash}
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-emerald-600/10 rounded-xl border border-emerald-600/20"
        >
          <h3 className="text-emerald-600 font-medium mb-2">💡 How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <div className="font-medium text-white mb-1">1. Create Group</div>
              <div>Add members and set expense details</div>
            </div>
            <div>
              <div className="font-medium text-white mb-1">2. Smart Contract</div>
              <div>Deployed on Etherlink with your rules</div>
            </div>
            <div>
              <div className="font-medium text-white mb-1">3. Auto Settlement</div>
              <div>Fair splits calculated automatically</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}