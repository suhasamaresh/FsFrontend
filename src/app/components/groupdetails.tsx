"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { GraphQLClient, gql } from "graphql-request";


const GRAPHQL_ENDPOINT =
  "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FS/1.0.0/gn";

const USER_GROUPS_QUERY = gql`
  query UserGroups($userAddress: String!) {
    groupCreateds(
      where: { creator: $userAddress }
      orderBy: timestamp_
      orderDirection: desc
      first: 50
    ) {
      groupId
      creator
      members
      currency
      totalAmount
      category
      timestamp_
    }
    groupCreateds_member: groupCreateds(
      where: { members_contains: $userAddress }
      orderBy: timestamp_
      orderDirection: desc
      first: 50
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

type Group = {
  groupId: string;
  creator: string;
  members: string; // comma-separated
  groupName?: string;
  currency: string;
  totalAmount: string;
  category: string;
  timestamp_: string;
};

const categoryIcons: Record<string, string> = {
  0: "🍽️",
  1: "✈️",
  2: "💡",
  3: "🎬",
  4: "🛍️",
  5: "📦",
};

const categoryNames = ["Dining", "Travel", "Utilities", "Entertainment", "Shopping", "Other"];

// Helper to parse comma-separated addresses into array
const parseMembersArray = (membersString: string): string[] => {
  if (!membersString) return [];
  return membersString.split(",").map((m) => m.trim()).filter(Boolean);
};

// Merge two group arrays by groupId uniqueness
const mergeGroups = (a: Group[], b: Group[]) => {
  const map = new Map<string, Group>();
  for (const g of [...a, ...b]) map.set(g.groupId, g);
  return Array.from(map.values());
};

export default function UserGroupsPage() {
  const { address, isConnected } = useAccount();
  const [createdGroups, setCreatedGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [modalGroup, setModalGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setCreatedGroups([]);
      setJoinedGroups([]);
      return;
    }
    async function fetchUserGroups() {
      setLoading(true);
      setError(null);
      try {
        const client = new GraphQLClient(GRAPHQL_ENDPOINT);
        const normalizedAddress = address ? address.toLowerCase() : "";
        const data = await client.request<{ groupCreateds: Group[]; groupCreateds_member: Group[] }>(
          USER_GROUPS_QUERY,
          { userAddress: normalizedAddress }
        );
        // Remove overlap: joined = joined - created
        const joinedUnique = data.groupCreateds_member.filter(
          (g) => !data.groupCreateds.find(cg => cg.groupId === g.groupId)
        );
        // Sort by timestamp descending
        data.groupCreateds.sort((a, b) => Number(b.timestamp_) - Number(a.timestamp_));
        joinedUnique.sort((a, b) => Number(b.timestamp_) - Number(a.timestamp_));
        setCreatedGroups(data.groupCreateds);
        setJoinedGroups(joinedUnique);
      } catch (e: any) {
        setError(e.message || "Failed to fetch user groups.");
      } finally {
        setLoading(false);
      }
    }
    fetchUserGroups();
  }, [address]);

  // Helper to compute owed amount for EQUAL split
  function computeOwed(group: Group, membersArr: string[], addr: string) {
    if (!group || !membersArr.length) return "—";
    if (group.currency !== "0x0000000000000000000000000000000000000000") return "—"; // Display for native only
    // For EQUAL SplitType (assume 0), split equally, else unknown (you could improve if your subgraph adds more details)
    const splitTypeIsEqual = true; // If you have splitType in data, check it here
    if (splitTypeIsEqual) {
      try {
        return (parseFloat(ethers.formatEther(group.totalAmount)) / membersArr.length).toFixed(4);
      } catch {
        return "—";
      }
    }
    return "—";
  }

  // Pop-up modal rendering
  function DetailModal({ group, onClose }: { group: Group; onClose: () => void }) {
    const membersArr = parseMembersArray(group.members);
    const isCreator = address?.toLowerCase() === group.creator.toLowerCase();
    const createdAt = new Date(Number(group.timestamp_) * 1000).toLocaleString();

    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className=" bg-gray-900 rounded-2xl border-2 border-emerald-600 shadow-2xl p-8 relative overflow-y-auto"
            initial={{ scale: 0.95, y: 140 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 140 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 rounded-full w-9 h-9 bg-emerald-600 hover:bg-emerald-400 text-black text-lg font-extrabold flex items-center justify-center transition shadow"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
            {/* Card content */}
            <div className="mb-3 flex items-center justify-between">
              <div className="text-3xl">{categoryIcons[group.category] || "📦"}</div>
              <div className="text-xs bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded font-mono">
                ID: {group.groupId}
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-1 text-white break-all">
              {group.groupName || `Expense Group #${group.groupId}`}
            </h2>
            <p className="mb-1 text-sm text-emerald-400 font-bold">
              {isCreator ? "You created this group" : "You are a member"}
            </p>
            <p className="mb-2 text-xs text-gray-400">Created: {createdAt}</p>
            <div className="mb-3 flex flex-wrap gap-2 text-sm">
              <span>
                <strong>Currency:</strong>{" "}
                {group.currency === "0x0000000000000000000000000000000000000000"
                  ? "XTZ"
                  : group.currency}
              </span>
              <span>
                <strong>Category:</strong> {categoryNames[Number(group.category)] || "Other"}
              </span>
              <span>
                <strong>Total:</strong>{" "}
                {ethers.formatEther(group.totalAmount)} {group.currency === "0x0000000000000000000000000000000000000000" ? "XTZ" : ""}
              </span>
              <span>
                <strong>Members:</strong> {membersArr.length}
              </span>
              <span>
                <strong>Creator:</strong>{" "}
                <span className="font-mono text-xs bg-black/30 px-1 rounded">
                  {group.creator.slice(0, 6)}…{group.creator.slice(-4)}
                </span>
              </span>
            </div>
            <hr className="border-emerald-700/30 my-3" />
            <h3 className="text-lg font-bold text-emerald-400 mb-2 mt-2">Members</h3>
            <ul className="max-h-40 overflow-y-auto rounded-md">
              {membersArr.map((mem) => (
                <li
                  key={mem}
                  className={`flex justify-between items-center py-1 px-2 rounded-md border-b border-emerald-800/30 ${
                    mem.toLowerCase() === address?.toLowerCase()
                      ? "bg-emerald-600/10"
                      : ""
                  }`}
                >
                  <span className="font-mono truncate">{mem}</span>
                  <span className="ml-4 text-xs text-emerald-300">
                    Owes:{" "}
                    {computeOwed(group, membersArr, mem)}{" "}
                    {group.currency === "0x0000000000000000000000000000000000000000" ? "XTZ" : ""}
                  </span>
                  {mem.toLowerCase() === address?.toLowerCase() && (
                    <span className="ml-2 px-2 rounded-full bg-emerald-600 text-black text-xs font-bold">
                      YOU
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
        <h2 className="text-2xl mb-4">Connect your wallet to view your groups</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-emerald-400 p-6">
        Loading your groups...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-6 text-red-500 flex flex-col items-center justify-center">
        <h2 className="text-xl mb-2">Error loading groups</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Page content with cards for "You Created" and "You Joined"
  return (
    <div className="min-h-screen bg-black p-6 text-white max-w-6xl mx-auto">
      <motion.h1
        className="text-4xl font-bold mb-8 text-center text-emerald-600"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Your Expense Groups
      </motion.h1>

      <div className="grid md:grid-cols-2 gap-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">Groups You Created</h2>
          {createdGroups.length === 0 && (
            <p className="text-gray-400 mb-6">You haven't created any groups yet.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {createdGroups.map((group) => {
              const membersArr = parseMembersArray(group.members);
              let totalAmountNumber = 0;
              try {
                totalAmountNumber = parseFloat(ethers.formatEther(group.totalAmount));
              } catch {
                totalAmountNumber = 0;
              }
              return (
                <motion.div
                  key={group.groupId}
                  className="bg-gradient-to-br from-black to-gray-900 p-6 rounded-xl border-2 border-emerald-600/30 hover:border-emerald-600/60 shadow-lg cursor-pointer transition-all"
                  whileHover={{ y: -3, borderColor: "#059669" }}
                  onClick={() => setModalGroup(group)}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-3xl">{categoryIcons[group.category] || "📦"}</div>
                    <div className="text-xs font-mono bg-emerald-600/20 text-emerald-400 px-2 rounded">
                      ID: {group.groupId}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold break-all mb-1">
                    {group.groupName || `Expense Group #${group.groupId}`}
                  </h3>
                  <p className="text-xs text-emerald-400 mb-1">
                    {categoryNames[Number(group.category)] || "Other"}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-semibold">Members:</span> {membersArr.length}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-semibold">Total Amount:</span>{" "}
                    {totalAmountNumber.toFixed(4)}{" "}
                    {group.currency === "0x0000000000000000000000000000000000000000" ? "XTZ" : "Token"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(Number(group.timestamp_) * 1000).toLocaleString()}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">Groups You Joined</h2>
          {joinedGroups.length === 0 && (
            <p className="text-gray-400 mb-6">You are not a member of any group.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {joinedGroups.map((group) => {
              const membersArr = parseMembersArray(group.members);
              let totalAmountNumber = 0;
              try {
                totalAmountNumber = parseFloat(ethers.formatEther(group.totalAmount));
              } catch {
                totalAmountNumber = 0;
              }
              return (
                <motion.div
                  key={group.groupId}
                  className="bg-gradient-to-br from-black to-gray-900 p-6 rounded-xl border-2 border-emerald-600/30 hover:border-emerald-600/60 shadow-lg cursor-pointer transition-all"
                  whileHover={{ y: -3, borderColor: "#059669" }}
                  onClick={() => setModalGroup(group)}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-3xl">{categoryIcons[group.category] || "📦"}</div>
                    <div className="text-xs font-mono bg-emerald-600/20 text-emerald-400 px-2 rounded">
                      ID: {group.groupId}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold break-all mb-1">
                    {group.groupName || `Expense Group #${group.groupId}`}
                  </h3>
                  <p className="text-xs text-emerald-400 mb-1">
                    {categoryNames[Number(group.category)] || "Other"}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-semibold">Members:</span> {membersArr.length}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-semibold">Total Amount:</span>{" "}
                    {totalAmountNumber.toFixed(4)}{" "}
                    {group.currency === "0x0000000000000000000000000000000000000000" ? "XTZ" : "Token"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(Number(group.timestamp_) * 1000).toLocaleString()}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
      {/* Details Modal */}
      {modalGroup && <DetailModal group={modalGroup} onClose={() => setModalGroup(null)} />}
    </div>
  );
}
