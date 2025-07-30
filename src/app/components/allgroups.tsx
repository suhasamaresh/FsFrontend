"use client";

import React, { useEffect, useState } from "react";
import { GraphQLClient, gql } from "graphql-request";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";

const GRAPHQL_ENDPOINT = "https://api.goldsky.com/api/public/project_cmd7nwdt58hqk01yf3ekxeozd/subgraphs/FS/1.0.0/gn"; 

const GROUPS_QUERY = gql`
  {
    groupCreateds(orderBy: timestamp_, orderDirection: desc) {
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
  members: string; // This comes as a comma-separated string from GraphQL
  currency: string;
  totalAmount: string;
  category: string;
  timestamp_: string;
};

const categoryIcons = {
  0: "🍽️", // Dining
  1: "✈️", // Travel
  2: "💡", // Utilities
  3: "🎬", // Entertainment
  4: "🛍️", // Shopping
  5: "📦"  // Other
};

const categoryNames = ["Dining", "Travel", "Utilities", "Entertainment", "Shopping", "Other"];

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Helper function to parse members from comma-separated string
  const parseMembersArray = (membersString: string): string[] => {
    if (!membersString || membersString.trim() === '') return [];
    return membersString.split(',').map(member => member.trim()).filter(member => member.length > 0);
  };

  useEffect(() => {
    async function fetchGroups() {
      try {
        setLoading(true);
        setError(null);
        const client = new GraphQLClient(GRAPHQL_ENDPOINT);
        const data = await client.request<{ groupCreateds: Group[] }>(GROUPS_QUERY);
        setGroups(data.groupCreateds);
      } catch (e: any) {
        setError(e.message || "Failed to fetch groups.");
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter(group => 
    filter === "all" || group.category === filter
  );

  const totalGroups = groups.length;
  const totalValue = groups.reduce((sum, group) => {
    try {
      return sum + parseFloat(ethers.formatEther(group.totalAmount));
    } catch (error) {
      console.error('Error parsing totalAmount:', group.totalAmount, error);
      return sum;
    }
  }, 0);
  const activeMembers = new Set(
    groups.flatMap(g => parseMembersArray(g.members))
  ).size;

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Recent <span className="text-emerald-600">Groups</span>
          </h1>
          <p className="text-gray-400">Discover and track expense groups across the platform</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-xl p-6 border border-emerald-600/30 hover:border-emerald-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-400 mb-1">{totalGroups}</div>
                <div className="text-gray-400 text-sm">Total Groups</div>
              </div>
              <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center">
                <span className="text-emerald-400 text-xl">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-6 border border-blue-600/30 hover:border-blue-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {totalValue < 0.001 ? totalValue.toFixed(6) : totalValue.toFixed(3)} XTZ
                </div>
                <div className="text-gray-400 text-sm">Total Value</div>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 text-xl">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-6 border border-purple-600/30 hover:border-purple-600/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-400 mb-1">{activeMembers}</div>
                <div className="text-gray-400 text-sm">Active Members</div>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400 text-xl">👤</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-black/50 rounded-xl p-2 border border-emerald-600/20 inline-flex gap-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "all" 
                  ? "bg-emerald-600 text-white shadow-lg" 
                  : "text-gray-400 hover:text-white hover:bg-emerald-600/20"
              }`}
            >
              All Categories
            </button>
            {Object.entries(categoryIcons).map(([value, icon]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  filter === value
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-emerald-600/20"
                }`}
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{categoryNames[Number(value)]}</span>
              </button>
            ))}
          </div>
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
              <span className="text-lg">Loading groups...</span>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center"
          >
            <div className="text-red-400 text-lg font-semibold mb-2">⚠️ Error Loading Groups</div>
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredGroups.length === 0 && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-emerald-400 text-3xl">📭</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Groups Found</h3>
            <p className="text-gray-400">
              {filter === "all" ? "No groups have been created yet." : `No groups found in the ${categoryNames[Number(filter)]} category.`}
            </p>
          </motion.div>
        )}

        {/* Groups Grid */}
        <AnimatePresence>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.groupId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group bg-gradient-to-br from-black to-gray-900 rounded-xl border-2 border-emerald-600/30 hover:border-emerald-600/60 shadow-lg hover:shadow-emerald-600/20 transition-all duration-300 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-emerald-600/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center text-xl">
                        {categoryIcons[Number(group.category) as keyof typeof categoryIcons] || "📦"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-1 bg-emerald-600/20 text-emerald-400 text-xs font-medium rounded-full">
                            {categoryNames[Number(group.category)]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-1">Created</div>
                      <span className="text-xs font-mono bg-emerald-600/10 text-emerald-400 px-2 py-1 rounded">
                        {new Date(Number(group.timestamp_) * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Created by</span>
                    <div className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-1">
                      <div className="w-4 h-4 bg-emerald-600/30 rounded-full"></div>
                      <span className="font-mono text-emerald-400 text-xs">
                        {group.creator.slice(0, 6)}...{group.creator.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-emerald-600/10 rounded-lg p-3 border border-emerald-600/20">
                      <div className="text-xs text-gray-400 mb-1">Members</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-emerald-400">
                          {parseMembersArray(group.members).length}
                        </span>
                        <span className="text-xs text-gray-400">people</span>
                      </div>
                    </div>
                    
                    <div className="bg-blue-600/10 rounded-lg p-3 border border-blue-600/20">
                      <div className="text-xs text-gray-400 mb-1">Total Amount</div>
                      <div className="flex items-center gap-1">
                        <span className="text-xl font-bold text-blue-400">
                          {(() => {
                            try {
                              const value = parseFloat(ethers.formatEther(group.totalAmount));
                              return value < 0.001 ? value.toFixed(6) : value.toFixed(3);
                            } catch (error) {
                              console.error('Error formatting amount:', group.totalAmount, error);
                              return '0.000';
                            }
                          })()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {group.currency === "0x0000000000000000000000000000000000000000" ? "XTZ" : "Token"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Currency Info */}
                  <div className="bg-black/30 rounded-lg p-3 border border-gray-600/20">
                    <div className="text-xs text-gray-400 mb-2">Currency Address</div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <span className="font-mono text-xs text-purple-300">
                        {group.currency === "0x0000000000000000000000000000000000000000"
                          ? "Native XTZ"
                          : `${group.currency.slice(0, 8)}...${group.currency.slice(-6)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 pb-4">
                  <div className="text-xs text-gray-500 font-mono bg-black/20 rounded px-2 py-1 inline-block">
                    Group ID: {group.groupId}
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-emerald-600/5 to-emerald-600/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-to-r from-emerald-600/10 via-transparent to-emerald-600/10 rounded-xl p-6 border border-emerald-600/20">
            <h3 className="text-emerald-400 font-medium mb-2">💡 Platform Insights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-300">
              <div>
                <div className="font-medium text-white mb-1">Transparent</div>
                <div>All transactions on-chain and verifiable</div>
              </div>
              <div>
                <div className="font-medium text-white mb-1">Automated</div>
                <div>Smart contracts handle fair splitting</div>
              </div>
              <div>
                <div className="font-medium text-white mb-1">Secure</div>
                <div>Built on Etherlink for reliability</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}