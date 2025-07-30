"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { abi as FlashSplitRewardsAbi } from "../../../FlashSplitRewards.json";
import { motion, AnimatePresence } from "framer-motion";
// You may want a confetti library like react-confetti or ts-confetti:
import Confetti from "react-confetti";

const REWARDS_CONTRACT = "YOUR_REWARDS_CONTRACT_ADDRESS"; // <-- Replace with your deployed address

// You may keep this in sync with the enum in your smart contract.
const achievementDefs = [
  {
    type: 0,
    code: "FAST_PAYER",
    label: "Fast Payer",
    desc: "Settled an expense within 1 hour!",
    color: "bg-green-600",
  },
  {
    type: 1,
    code: "SPEED_DEMON",
    label: "Speed Demon",
    desc: "Settled an expense in under 5 minutes!",
    color: "bg-blue-600",
  },
  {
    type: 2,
    code: "SPLIT_MASTER",
    label: "Split Master",
    desc: "Completed 10 group splits!",
    color: "bg-purple-600",
  },
  {
    type: 3,
    code: "BIG_SPENDER",
    label: "Big Spender",
    desc: "Spent over 1000 XTZ in total!",
    color: "bg-yellow-600",
  },
  {
    type: 4,
    code: "CONSISTENT_USER",
    label: "Consistent User",
    desc: "Settled expenses every week for a month.",
    color: "bg-emerald-700",
  },
  {
    type: 5,
    code: "POPULAR_SPLITTER",
    label: "Popular Splitter",
    desc: "Started groups with 10+ unique members!",
    color: "bg-red-500",
  },
  {
    type: 6,
    code: "EARLY_ADOPTER",
    label: "Early Adopter",
    desc: "Joined FlashSplit before official launch.",
    color: "bg-indigo-600",
  },
  {
    type: 7,
    code: "COMMUNITY_LEADER",
    label: "Community Leader",
    desc: "Reached the top of the reputation leaderboard.",
    color: "bg-pink-500",
  },
];

// Emerald gradient border utility (for unlocked achievements)
const gradientBorder =
  "border-2 border-emerald-400 bg-emerald-900 bg-opacity-80 shadow-lg shadow-emerald-400/10";

function useWindowSize() {
  // Hook for confetti
  const [size, setSize] = useState({ width: 1280, height: 720 });
  useEffect(() => {
    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

export default function Achievements() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [userTokens, setUserTokens] = useState<number[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Fetch all unlocked achievements (tokenIds) for the user
  useEffect(() => {
    if (!address || !walletClient) {
      setAchievements([]);
      setUserTokens([]);
      return;
    }
    setLoading(true);

    async function fetchAchievements() {
      try {
        const provider = new ethers.BrowserProvider(walletClient as any);
        const contract = new ethers.Contract(REWARDS_CONTRACT, FlashSplitRewardsAbi, provider);

        // Get user's minted achievement tokenIds (from onchain mapping/array)
        const tokens = await contract.getUserAchievements(address);
        setUserTokens(tokens.map((t: ethers.BigNumberish) => Number(t)));

        // Now fetch metadata for each tokenId
        const achs = await Promise.all(
          tokens.map(async (tid: ethers.BigNumberish) => {
            const tokenId = Number(tid);
            const ach = await contract.achievements(tokenId);
            return {
              tokenId,
              ...ach,
              achievementType: Number(ach.achievementType),
            };
          })
        );
        setAchievements(achs);

        if (achs.length && achs.length > userTokens.length) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        }
      } catch (e) {
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAchievements();
    // eslint-disable-next-line
  }, [address, walletClient]);

  const windowSize = useWindowSize();

  return (
    <div className="min-h-screen bg-black py-12 px-4 md:px-10">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            key="confetti"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              numberOfPieces={300}
              recycle={false}
              colors={["#34d399", "#a7f3d0", "#2563eb", "#fbbf24", "#f472b6", "#6366f1"]}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.h1
        className="text-4xl text-center mb-12 font-bold bg-gradient-to-r from-emerald-400 to-emerald-800 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Your Achievements
      </motion.h1>

      {!isConnected && (
        <div className="text-center text-red-500 text-lg">
          Please connect your wallet to see your achievements.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64 text-emerald-400 text-2xl">Loading achievements...</div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {achievementDefs.map((def) => {
            // Find user's achievement of this type (if unlocked)
            const userAch = achievements.find((a) => a.achievementType === def.type);
            const unlocked = !!userAch;
            return (
              <motion.div
                key={def.type}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * def.type }}
                className={`rounded-2xl border 
                ${unlocked ? gradientBorder : "border-gray-700 bg-gray-900"}
                flex flex-col items-center p-7 text-center
                relative overflow-hidden`}
              >
                {/* Animated reward badge ember green "aura" */}
                <div className="mb-6 relative">
                  <div className={`rounded-full w-24 h-24 flex items-center justify-center mx-auto
                    ${unlocked ? def.color + " shadow-2xl shadow-emerald-500/30 scale-105" : "bg-gray-800 opacity-50"}
                    transition-all duration-300`}>
                    {/* Animated check/trophy if unlocked: */}
                    {unlocked ? (
                      <motion.svg
                        viewBox="0 0 64 64"
                        width="44"
                        height="44"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="mx-auto"
                      >
                        <defs>
                          <radialGradient id={`grad${def.type}`} cx="50%" cy="50%" r="30%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </radialGradient>
                        </defs>
                        <circle cx="32" cy="32" r="27" fill={`url(#grad${def.type})`} />
                        <motion.path
                          d="M23 34 L30 41 L47 23"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.25, duration: 0.5 }}
                        />
                      </motion.svg>
                    ) : (
                      <svg width="40" height="40" viewBox="0 0 64 64" className="opacity-70 mx-auto">
                        <circle cx="32" cy="32" r="23" fill="#222829" />
                        <text x="50%" y="53%" dominantBaseline="middle" textAnchor="middle" fontSize="22" fill="#666">
                          ?
                        </text>
                      </svg>
                    )}
                  </div>
                  {/* Sparkle effect */}
                  {unlocked && (
                    <motion.span
                      className="absolute -top-3 -right-2 animate-pulse text-yellow-400 text-2xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.1 }}
                      transition={{ delay: 0.5, yoyo: Infinity }}
                    >✨</motion.span>
                  )}
                </div>
                <h3 className={`font-bold text-xl ${unlocked ? "text-emerald-300" : "text-gray-400"}`}>
                  {def.label}
                </h3>
                <div className={`text-md my-2 ${unlocked ? "text-white" : "text-gray-400"}`}>
                  {def.desc}
                </div>
                {unlocked ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="mt-auto pt-2"
                  >
                    <span className="inline-block px-4 py-2 rounded-full text-sm bg-emerald-600 text-emerald-50 shadow">
                      Unlocked{userAch.unlockedAt ? `: ${new Date(Number(userAch.unlockedAt) * 1000).toLocaleDateString()}` : ""}
                    </span>
                  </motion.div>
                ) : (
                  <span className="mt-auto pt-3 block text-xs text-gray-600 italic">Not yet earned</span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
