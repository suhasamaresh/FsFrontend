"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { GraphQLClient, gql } from "graphql-request";
import { motion } from "framer-motion";
import { abi as FlashSplitAbi } from "../../../FlashSplit.json";

const GRAPHQL_ENDPOINT =
  "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FS/1.0.0/gn";
const CONTRACT_ADDRESS = "0x710B24E1e66244165728CDcfbe4916b48cE20faB";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// GraphQL query (without `isCompleted` and `settledCount` as these come from contract)
const USER_STATS_QUERY = gql`
  query UserActivity($user: String!) {
    created: groupCreateds(
      where: { creator: $user }
      orderBy: timestamp_
      orderDirection: desc
    ) {
      groupId
      totalAmount
      currency
      category
      timestamp_
    }
    joined: groupCreateds(
      where: { members_contains: $user }
      orderBy: timestamp_
      orderDirection: desc
    ) {
      groupId
      totalAmount
      currency
      creator
      category
      timestamp_
    }
    settled: expenseSettleds(where: { payer: $user }) {
      groupId
      amount
      timestamp_
    }
    rep: userReputationUpdateds(
      where: { user: $user }
      orderBy: timestamp_
      orderDirection: desc
      first: 5
    ) {
      newScore
      reason
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

// Utility to format Wei to ETH string
function formatEther(wei: string | bigint) {
  try {
    return Number(ethers.formatEther(wei.toString())).toFixed(4);
  } catch {
    return "0.0000";
  }
}

export default function UserProfileDashboard() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groupsCreated, setGroupsCreated] = useState<any[]>([]);
  const [groupsJoined, setGroupsJoined] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [reputation, setReputation] = useState<number>(0);
  const [fastSettlements, setFastSettlements] = useState<number>(0);
  const [totalSplit, setTotalSplit] = useState<string>("0");

  const [claimedTxHash, setClaimedTxHash] = useState<string | null>(null);
  const [claimingGroupIds, setClaimingGroupIds] = useState<number[]>([]);
  const [groupStatus, setGroupStatus] = useState<
    Record<
      number,
      { isCompleted: boolean; settledCount: number; memberCount: number }
    >
  >({});

  // Fetch user event data + on-chain group status
  useEffect(() => {
    if (!address) return;

    setLoading(true);
    setError(null);

    type UserStatsResponse = {
      created: any[];
      joined: any[];
      settled: any[];
      rep: { newScore: string }[];
    };

    async function fetchData() {
      try {
        // Fetch data from subgraph
        const client = new GraphQLClient(GRAPHQL_ENDPOINT);
        const data = await client.request<UserStatsResponse>(USER_STATS_QUERY, {
          user: address ? address.toLowerCase() : "",
        });

        setGroupsCreated(data.created || []);
        setGroupsJoined(
          (data.joined || []).filter(
            (g: any) => !(data.created || []).some((c: any) => c.groupId === g.groupId)
          )
        );
        setSettlements(data.settled || []);

        let lastRep = 0;
        if (data.rep && data.rep.length > 0) {
          lastRep = Number(data.rep[0].newScore);
        }
        setReputation(lastRep);

        // Sum total expenses settled
        const totalSettled = (data.settled || [])
          .map((s: any) => BigInt(s.amount))
          .reduce((acc: bigint, val: bigint) => acc + val, BigInt(0));
        setTotalSplit(totalSettled.toString());

        // Fetch fast settlements count and update reputation if missing from contract
        let fastCount = 0;
        if (walletClient) {
          const provider = new ethers.BrowserProvider(walletClient);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, FlashSplitAbi, provider);
          try {
            const profile = await contract.getUserProfile(address);
            fastCount = Number(profile.fastSettlementCount ?? 0);
            if (!lastRep) setReputation(Number(profile.reputationScore ?? 0));
          } catch {}
        }
        setFastSettlements(fastCount);
      } catch (e: any) {
        setError(e.message || "Error loading stats");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [address, walletClient]);

  // Supplement on-chain group states for groups created
  useEffect(() => {
    if (!groupsCreated.length || !walletClient) return;
    let cancelled = false;

    async function fetchGroupStatuses() {
      try {
        if (!walletClient) return;
        const provider = new ethers.BrowserProvider(walletClient);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, FlashSplitAbi, provider);

        const statuses: Record<number, { isCompleted: boolean; settledCount: number; memberCount: number }> = {};

        for (const g of groupsCreated) {
          try {
            const [settledCount, memberCount, isCompleted] = await contract.getGroupSettlementStatus(g.groupId);
            statuses[g.groupId] = {
              isCompleted,
              settledCount: Number(settledCount),
              memberCount: Number(memberCount),
            };
          } catch {
            statuses[g.groupId] = { isCompleted: false, settledCount: 0, memberCount: 0 };
          }
        }
        if (!cancelled) setGroupStatus(statuses);
      } catch {
        // ignore errors here
      }
    }
    fetchGroupStatuses();
    return () => {
      cancelled = true;
    };
  }, [groupsCreated, walletClient]);

  // Claim reclaimFunds for a group
  async function handleReclaim(groupId: number) {
    if (!address || !walletClient) {
      setError("Connect your wallet to reclaim");
      return;
    }
    setClaimingGroupIds((ids) => [...ids, groupId]);
    setClaimedTxHash(null);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FlashSplitAbi, signer);

      const tx = await contract.reclaimFunds(groupId);
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error("Transaction reverted");

      setClaimedTxHash(receipt.transactionHash);
    } catch (err: any) {
      setError("Reclaim failed: " + (err.message || "Unknown error"));
    } finally {
      setClaimingGroupIds((ids) => ids.filter((id) => id !== groupId));
    }
  }

  // Logic to determine if reclaim button should show:
  // True if all members settled, or all except creator have settled
  function canReclaim(status: { isCompleted?: boolean; settledCount?: number; memberCount?: number }): boolean {
    if (!status) return false;
    const { isCompleted, settledCount, memberCount } = status;
    if (!memberCount) return false;
    return !!isCompleted || (settledCount === memberCount - 1);
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white max-w-5xl mx-auto">
      <motion.h1
        className="text-4xl font-bold mb-8 text-center text-emerald-600"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Your Dashboard
      </motion.h1>

      {!isConnected && (
        <div className="text-center text-red-500 text-lg">
          Please connect your wallet to see your dashboard.
        </div>
      )}

      {loading && (
        <div className="text-center text-emerald-400 py-12 text-xl">
          Loading your stats...
        </div>
      )}

      {error && !loading && (
        <div className="text-center text-red-500 py-6 text-lg">{error}</div>
      )}

      {!loading && isConnected && (
        <>
          {/* Stats Panels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
          >
            <StatCard label="Groups Created" value={groupsCreated.length.toString()} color="emerald" />
            <StatCard label="Groups Joined" value={groupsJoined.length.toString()} color="blue" />
            <StatCard label="Settlements Made" value={settlements.length.toString()} color="purple" />
            <StatCard label="Total Expenses Settled" value={`${formatEther(totalSplit)} XTZ`} color="emerald" />
            <StatCard label="Fast Settlements (<1hr)" value={fastSettlements.toString()} color="orange" />
            <StatCard label="Reputation Score" value={reputation.toString()} color="yellow" />
          </motion.div>

          {/* Groups Created with reclaim */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-emerald-500">
              Groups You Created (Option to Reclaim Funds)
            </h2>
            {groupsCreated.length === 0 && (
              <p className="text-gray-400">You have not created any groups yet.</p>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groupsCreated.map((group) => {
                const status = groupStatus[group.groupId] || {};
                const eligible = canReclaim(status);
                return (
                  <motion.div
                    key={group.groupId.toString()}
                    className="bg-gradient-to-br from-black to-gray-900 p-6 rounded-xl border-2 border-emerald-600/30 shadow hover:border-emerald-600/60 transition-colors"
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-4xl">
                        {categoryIcons[group.category] || "📦"}
                      </div>
                      <div className="text-xs font-mono bg-emerald-600/20 px-2 rounded text-emerald-400">
                        ID: {group.groupId.toString()}
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">
                      Expense Group #{group.groupId.toString()}
                    </h3>

                    <p className="text-sm mb-1">
                      <span className="font-semibold">Total Amount:</span>{" "}
                      {formatEther(group.totalAmount)}{" "}
                      {group.currency.toLowerCase() === ZERO_ADDRESS ? "ETH" : "Token"}
                    </p>

                    <p className="text-sm mb-4 text-emerald-400">
                      Category: {categoryNames[group.category] ?? "Other"}
                    </p>

                    <p className="text-sm mb-1">
                      Status:{" "}
                      {eligible ? (
                        <span className="text-green-400">Completed or Almost Completed</span>
                      ) : (
                        <span className="text-yellow-400">In Progress</span>
                      )}
                    </p>
                    <p className="text-sm mb-2">
                      Settled: {status.settledCount || 0}/{status.memberCount || "?"}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {claimedTxHash && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-green-600/20 rounded shadow text-green-100 font-mono cursor-pointer"
                onClick={() =>
                  window.open(
                    `https://testnet.explorer.etherlink.com/tx/${claimedTxHash}`,
                    "_blank"
                  )
                }
              >
                Successfully reclaimed! Tx:{" "}
                {`${claimedTxHash.slice(0, 10)}...${claimedTxHash.slice(-8)}`}
              </motion.div>
            )}
          </div>
        </>
      )}

      {/* Wallet address footer */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-xl border border-emerald-600/20 bg-emerald-600/10 p-6 text-center"
        >
          <div className="mb-2 text-gray-400 text-sm">Your address:</div>
          <div className="font-mono text-emerald-400 text-lg mb-2">
            {address?.slice(0, 8)}...{address?.slice(-6)}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// StatCard component
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color:
    | "emerald"
    | "blue"
    | "purple"
    | "orange"
    | "yellow"
    | "pink"
    | "violet";
}) {
  const colors: Record<string, string> = {
    emerald: "from-emerald-600 to-emerald-800 text-emerald-400 border-emerald-600",
    blue: "from-blue-600 to-blue-800 text-blue-400 border-blue-600",
    purple: "from-purple-600 to-purple-800 text-purple-400 border-purple-600",
    orange: "from-orange-500 to-orange-700 text-orange-400 border-orange-500",
    yellow: "from-yellow-400 to-yellow-600 text-yellow-300 border-yellow-400",
    pink: "from-pink-600 to-pink-800 text-pink-400 border-pink-600",
    violet: "from-violet-600 to-violet-800 text-violet-400 border-violet-600",
  };

  return (
    <motion.div
      className={`rounded-xl p-6 border-2 bg-gradient-to-br shadow-lg ${colors[color]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-3xl font-bold">{value}</div>
      <div className={`mt-2 text-sm opacity-80`}>{label}</div>
    </motion.div>
  );
}
