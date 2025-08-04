"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { GraphQLClient, gql } from "graphql-request";
import { motion } from "framer-motion";
import FlashSplitAbi from "../../../FlashSplit.json";

const CONTRACT_ADDRESS = "0x710B24E1e66244165728CDcfbe4916b48cE20faB";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const GRAPHQL_ENDPOINT =
  "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FS/1.0.0/gn";

const USER_GROUPS_QUERY = gql`
  query UserGroups($userAddress: String!) {
    groupCreateds_member: groupCreateds(
      where: { members_contains: $userAddress }
      orderBy: timestamp_
      orderDirection: desc
      first: 100
    ) {
      groupId
      creator
      members
      currency
      totalAmount
      category
      timestamp_
    }
  }
`;

const categoryIcons: Record<string, string> = {
  0: "🍽️",
  1: "✈️",
  2: "💡",
  3: "🎬",
  4: "🛍️",
  5: "📦",
};
const categoryNames = [
  "Dining",
  "Travel",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Other",
];

type Group = {
  groupId: string;
  creator: string;
  members: string; // comma separated
  currency: string;
  totalAmount: string;
  category: string;
  timestamp_: string;
};

export default function SettlePage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [groups, setGroups] = useState<Group[]>([]);
  const [unsettledGroups, setUnsettledGroups] = useState<
    (Group & { balanceWei: string })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [settleLoadingId, setSettleLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Helper: parse members array from comma separated string
  function parseMembers(m: string) {
    return m
      .split(",")
      .map((a) => a.trim())
      .filter((x) => x.length > 0);
  }

  // Step 1: Fetch all groups where user is a member
  useEffect(() => {
    if (!address) {
      setGroups([]);
      setUnsettledGroups([]);
      return;
    }
    setLoading(true);
    setError(null);
    setTxHash(null);

    async function fetchGroups() {
      try {
        const client = new GraphQLClient(GRAPHQL_ENDPOINT);
        const data = await client.request<{ groupCreateds_member: Group[] }>(
          USER_GROUPS_QUERY,
          { userAddress: address!.toLowerCase() }
        );
        setGroups(data.groupCreateds_member);
      } catch (e: any) {
        setError("Error loading groups: " + (e.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, [address]);

  // Step 2: For each group, check if user has settled and their balance
  useEffect(() => {
    if (!groups.length || !walletClient || !address) {
      setUnsettledGroups([]);
      return;
    }
    let cancelled = false;
    async function checkUnsettled() {
      setLoading(true);
      const provider = new ethers.BrowserProvider(walletClient as any);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FlashSplitAbi.abi, provider);

      const results: (Group & { balanceWei: string })[] = [];
      for (const group of groups) {
        try {
          const settled = await contract.hasUserSettled(group.groupId, address);
          if (settled) continue;
          const balance = await contract.getUserBalance(group.groupId, address);
          if (BigInt(balance) > BigInt(0)) {
            results.push({ ...group, balanceWei: balance.toString() });
          }
        } catch (error) {
          // show as failed to query group if error
        }
        if (cancelled) return;
      }
      if (!cancelled) setUnsettledGroups(results);
      setLoading(false);
    }
    checkUnsettled();
    return () => {
      cancelled = true;
    };
  }, [groups, walletClient, address]);

  // Handle settling a group
  async function handleSettle(groupId: string, currency: string, balanceWei: string) {
    if (!address || !walletClient) return;
    setError(null);
    setTxHash(null);
    setSettleLoadingId(groupId);
    try {
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FlashSplitAbi.abi, signer);
      let tx;
      // If native ETH/Xtz
      if (currency.toLowerCase() === ZERO_ADDRESS) {
        tx = await contract.settleExpense(groupId, { value: BigInt(balanceWei) });
      } else {
        // For tokens, assume user has already approved--in production show approve btn & call approve first!
        tx = await contract.settleExpense(groupId);
      }
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error("Transaction failed");
      setTxHash(receipt.hash || receipt.transactionHash);
      // Refresh unsettled groups on success
      setUnsettledGroups((prev) =>
        prev.filter((g) => g.groupId !== groupId)
      );
    } catch (err: any) {
      setError("Settlement failed: " + (err?.message || "Unknown error"));
    } finally {
      setSettleLoadingId(null);
    }
  }

  // Formatting helper
  function formatEther(wei: string) {
    try {
      return Number(ethers.formatEther(wei)).toFixed(4);
    } catch {
      return "0.0000";
    }
  }

  // Rendering
  return (
    <div className="min-h-screen bg-black p-6 text-white max-w-6xl mx-auto">
      <motion.h1
        className="text-4xl font-bold mb-8 text-center text-emerald-600"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Settle Your Expenses
      </motion.h1>

      {!isConnected && (
        <div className="text-center text-red-500 text-lg">
          Please connect your wallet to see your balances.
        </div>
      )}

      {loading && (
        <div className="text-center text-emerald-400 py-12 text-xl">
          Loading your pending expenses...
        </div>
      )}

      {error && !loading && (
        <div className="text-center text-red-500 py-6 text-lg">{error}</div>
      )}

      {!loading && !error && unsettledGroups.length === 0 && isConnected && (
        <div className="text-center text-gray-400 py-12 text-lg">
          🎉 You have no outstanding expenses to settle!
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {unsettledGroups.map((group) => {
          const membersArr = parseMembers(group.members);
          let totalAmount = "0.0000";
          try {
            totalAmount = Number(ethers.formatEther(group.totalAmount)).toFixed(4);
          } catch {}
          return (
            <motion.div
              key={group.groupId}
              className="bg-gradient-to-br from-black to-gray-900 rounded-xl border-2 border-emerald-600/30 p-6 shadow-lg hover:border-emerald-600/60 transition-colors"
              whileHover={{ y: -5 }}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="text-4xl">
                  {categoryIcons[group.category] || "📦"}
                </div>
                <div className="text-xs font-mono bg-emerald-600/20 px-2 rounded text-emerald-400">
                  ID: {group.groupId}
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-2">
                Expense Group #{group.groupId}
              </h2>
              <p className="text-sm mb-1">
                <span className="font-semibold">Creator:</span>{" "}
                {group.creator.slice(0, 6)}...{group.creator.slice(-4)}
              </p>
              <p className="text-sm mb-1">
                <span className="font-semibold">Members:</span> {membersArr.length}
              </p>
              <p className="text-sm mb-1">
                <span className="font-semibold">Total Amount:</span> {totalAmount}{" "}
                {group.currency === ZERO_ADDRESS ? "ETH" : "Token"}
              </p>
              <p className="text-sm mb-4 text-emerald-400">
                Category: {categoryNames[Number(group.category)] ?? "Other"}
              </p>
              <p className="text-sm mb-4">
                <span className="font-semibold">You Owe:</span>{" "}
                {formatEther(group.balanceWei)}{" "}
                {group.currency === ZERO_ADDRESS ? "ETH" : "Token"}
              </p>

              <button
                disabled={!!settleLoadingId}
                onClick={() =>
                  handleSettle(group.groupId, group.currency, group.balanceWei)
                }
                className="w-full py-3 bg-emerald-600 rounded-lg text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {settleLoadingId === group.groupId
                  ? "Processing..."
                  : "Settle Expense"}
              </button>
            </motion.div>
          );
        })}
      </div>
      {txHash && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-emerald-600/90 text-white px-6 py-3 rounded-lg shadow-lg cursor-pointer"
          onClick={() =>
            window.open(`https://testnet.explorer.etherlink.com/tx/${txHash}`, "_blank")
          }
        >
          Transaction Success: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </motion.div>
      )}
    </div>
  );
}
