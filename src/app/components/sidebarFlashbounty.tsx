"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useOpenConnectModal } from "@0xsequence/connect";
import { useOpenWalletModal } from "@0xsequence/wallet-widget";
import { Button } from "@0xsequence-demos/boilerplate-design-system";
import { motion, AnimatePresence } from "framer-motion";
import PostBountyPage from "./postbounty";
import AllBountiesPage from "./allbounties";
import BountyDetailsPage from "./bountydetails";
import ClaimBountyPage from "./claimbounty";
import MyBountiesPage from "./mybounties";
import SubmitProofPage from "./submitproof";
import UserProfileDashboard from "./profile1";

const sidebarItems = [
    { label: "Post Bounty", key: "post-bounty", icon: "📝" },
    { label: "All Bounties", key: "all-bounties", icon: "📋" },
    { label: "My Bounties", key: "my-bounties", icon: "📊" },
    { label: "Submit Proof", key: "submit-proof", icon: "✅" },
    { label: "User Profile", key: "user-profile", icon: "👤" },
    { label: "Analytics", key: "analytics", icon: "📈" },
];

type SidebarProps = {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
};

// Sample components for each section
const PostBountyComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Post Bounty</h2>
    <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-emerald-600 text-sm font-medium mb-2">Bounty Title</label>
          <input type="text" className="w-full p-3 bg-black border border-emerald-600/50 rounded-lg text-white focus:border-emerald-600 focus:outline-none" placeholder="Enter bounty title" />
        </div>
        <div>
          <label className="block text-emerald-600 text-sm font-medium mb-2">Description</label>
          <textarea className="w-full p-3 bg-black border border-emerald-600/50 rounded-lg text-white focus:border-emerald-600 focus:outline-none" rows={3} placeholder="Describe the task"></textarea>
        </div>
        <div>
          <label className="block text-emerald-600 text-sm font-medium mb-2">Reward Amount</label>
          <input type="number" className="w-full p-3 bg-black border border-emerald-600/50 rounded-lg text-white focus:border-emerald-600 focus:outline-none" placeholder="Enter reward amount" />
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors">
          Post Bounty
        </button>
      </div>
    </div>
  </div>
);

const AllBountiesComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">All Bounties</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((bounty) => (
        <div key={bounty} className="bg-black border border-emerald-600/30 rounded-xl p-6 hover:border-emerald-600/50 transition-colors">
          <h3 className="text-lg font-bold text-white mb-2">Task #{bounty}</h3>
          <p className="text-gray-400 mb-4">Complete this micro-task for rewards</p>
          <div className="flex justify-between items-center">
            <span className="text-emerald-600 font-medium">${Math.floor(Math.random() * 100) + 10} reward</span>
            <button className="bg-emerald-600/20 text-emerald-600 px-3 py-1 rounded-lg text-sm hover:bg-emerald-600/30">
              Claim
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BountyDetailsComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Bounty Details</h2>
    <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Task Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Title:</span>
              <span className="text-white">Social Media Post</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Category:</span>
              <span className="text-white">Marketing</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Reward:</span>
              <span className="text-emerald-600">$25.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-yellow-500">Available</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Requirements</h3>
          <div className="space-y-2">
            {['Create engaging content', 'Include hashtags', 'Share on platform'].map((req, i) => (
              <div key={i} className="flex items-center p-2 bg-emerald-600/10 rounded-lg">
                <span className="text-emerald-600 mr-2">✓</span>
                <span className="text-white">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ClaimBountyComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Claim Bounty</h2>
    <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-xl font-bold text-white mb-2">Ready to Claim?</h3>
        <p className="text-gray-400 mb-6">Start working on this bounty to earn rewards</p>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg transition-colors">
          Start Task
        </button>
      </div>
    </div>
  </div>
);

const MyBountiesComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">My Bounties</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Active Tasks</h3>
        <div className="space-y-3">
          {['Content Creation', 'Data Entry', 'Survey'].map((task, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-emerald-600/10 rounded-lg">
              <span className="text-white">{task}</span>
              <span className="text-yellow-500 text-sm">In Progress</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Completed</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((task) => (
            <div key={task} className="p-2 border border-emerald-600/20 rounded-lg">
              <div className="flex justify-between">
                <span className="text-white text-sm">Task #{task}</span>
                <span className="text-emerald-600 text-sm">$15.00</span>
              </div>
              <span className="text-gray-400 text-xs">Completed 2 days ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SubmitProofComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Submit Proof</h2>
    <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-emerald-600 text-sm font-medium mb-2">Task Completion Proof</label>
          <textarea className="w-full p-3 bg-black border border-emerald-600/50 rounded-lg text-white focus:border-emerald-600 focus:outline-none" rows={4} placeholder="Describe how you completed the task"></textarea>
        </div>
        <div>
          <label className="block text-emerald-600 text-sm font-medium mb-2">Upload Files</label>
          <div className="border-2 border-dashed border-emerald-600/50 rounded-lg p-6 text-center">
            <div className="text-emerald-600 text-2xl mb-2">📁</div>
            <p className="text-gray-400">Drop files here or click to upload</p>
          </div>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors">
          Submit Proof
        </button>
      </div>
    </div>
  </div>
);

const UserProfileComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">User Profile</h2>
    <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center">
          <span className="text-2xl font-bold text-black">JD</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">John Doe</h3>
          <p className="text-gray-400">Bounty Hunter</p>
          <p className="text-emerald-600">Member since 2024</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-600/10 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-emerald-600">24</div>
          <div className="text-gray-400">Tasks Completed</div>
        </div>
        <div className="bg-emerald-600/10 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-emerald-600">$450</div>
          <div className="text-gray-400">Total Earned</div>
        </div>
        <div className="bg-emerald-600/10 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-emerald-600">95%</div>
          <div className="text-gray-400">Success Rate</div>
        </div>
      </div>
    </div>
  </div>
);

const CategoriesComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Categories</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { name: 'Social Media', icon: '📱', count: 12 },
        { name: 'Data Entry', icon: '📊', count: 8 },
        { name: 'Content Writing', icon: '✍️', count: 15 },
        { name: 'Design', icon: '🎨', count: 6 },
        { name: 'Research', icon: '🔍', count: 9 },
        { name: 'Translation', icon: '🌐', count: 4 },
      ].map((category, i) => (
        <div key={i} className="bg-black border border-emerald-600/30 rounded-xl p-6 hover:border-emerald-600/50 transition-colors cursor-pointer">
          <div className="text-center">
            <div className="text-4xl mb-3">{category.icon}</div>
            <h3 className="text-lg font-bold text-white mb-2">{category.name}</h3>
            <p className="text-emerald-600">{category.count} bounties</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LeaderboardComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Leaderboard</h2>
    <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
      <div className="space-y-4">
        {[
          { name: 'Alice Johnson', earnings: 1250, rank: 1 },
          { name: 'Bob Smith', earnings: 980, rank: 2 },
          { name: 'Carol Davis', earnings: 875, rank: 3 },
          { name: 'David Wilson', earnings: 720, rank: 4 },
          { name: 'Eve Brown', earnings: 650, rank: 5 },
        ].map((user, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-emerald-600/10 rounded-lg">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                user.rank === 1 ? 'bg-yellow-500 text-black' :
                user.rank === 2 ? 'bg-gray-400 text-black' :
                user.rank === 3 ? 'bg-amber-600 text-black' : 'bg-emerald-600 text-black'
              }`}>
                {user.rank}
              </div>
              <span className="text-white font-medium">{user.name}</span>
            </div>
            <span className="text-emerald-600 font-bold">${user.earnings}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AnalyticsComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Analytics</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Performance Overview</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Tasks This Month</span>
            <span className="text-emerald-600 font-bold">12</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Earnings This Month</span>
            <span className="text-emerald-600 font-bold">$240</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Average Rating</span>
            <span className="text-emerald-600 font-bold">4.8/5</span>
          </div>
        </div>
      </div>
      <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {['Completed social media task', 'Earned $25', 'New bounty available', 'Rating received'].map((activity, i) => (
            <div key={i} className="p-2 border border-emerald-600/20 rounded-lg">
              <span className="text-white text-sm">{activity}</span>
              <p className="text-gray-400 text-xs">{i + 1} hours ago</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection, isCollapsed, setIsCollapsed }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Wallet connection hooks
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { setOpenConnectModal } = useOpenConnectModal();
  const { setOpenWalletModal } = useOpenWalletModal();

  useEffect(() => {
    function handleClick(event: { target: any; }) {
      if (
        isMobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsMobileOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        aria-label="Open menu"
        className="fixed z-50 top-6 left-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-3 text-white shadow-xl backdrop-blur-sm border border-white/20 md:hidden hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 hover:scale-105"
        onClick={() => setIsMobileOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300 md:hidden ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar container */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 h-screen z-50 flex flex-col 
          bg-black
          border-r-2 border-emerald-600
          shadow-2xl shadow-emerald-600/20
          transition-all duration-500 ease-in-out
          ${
            isMobileOpen
              ? "translate-x-0 w-80"
              : "-translate-x-full w-80 md:translate-x-0"
          }
          ${isCollapsed ? "md:w-16" : "md:w-80"}
        `}
        aria-label="Dashboard sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-600/30 bg-black">
          <div className={`flex items-center space-x-3 ${isCollapsed ? "justify-center w-full" : ""}`}>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-sm font-bold text-black">FB</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-lg text-white tracking-tight truncate">
                  FlashBounty
                </h1>
                <p className="text-xs text-emerald-600/70 truncate">Micro-Task Platform</p>
              </div>
            )}
          </div>
          
          {/* Collapse toggle */}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="Collapse sidebar"
              className="hidden md:flex p-1.5 rounded-lg bg-emerald-600/20 text-emerald-600 hover:bg-emerald-600/30 hover:text-white transition-all duration-300 hover:scale-110 flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="Expand sidebar"
              className="hidden md:flex absolute top-4 right-2 p-1.5 rounded-lg bg-emerald-600/20 text-emerald-600 hover:bg-emerald-600/30 hover:text-white transition-all duration-300 hover:scale-110"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Wallet Connection Section */}
        <div className="p-4 border-b border-emerald-600/30">
          <AnimatePresence mode="wait">
            {!isConnected ? (
              <motion.div
                key="connect"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                {!isCollapsed ? (
                  <Button
                    variant="primary"
                    className="w-full font-semibold text-sm px-4 py-3 rounded-xl 
                      bg-emerald-600 hover:bg-emerald-700
                      text-white shadow-lg border border-emerald-600 hover:border-emerald-500 
                      transition-all duration-300 hover:scale-105"
                    onClick={() => setOpenConnectModal(true)}
                  >
                    Connect Wallet
                  </Button>
                ) : (
                  <button
                    className="w-full p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 transition-all duration-300 shadow-lg"
                    onClick={() => setOpenConnectModal(true)}
                    title="Connect Wallet"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mx-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="connected"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-3"
              >
                {!isCollapsed ? (
                  <>
                    <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-emerald-600/30">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-emerald-600 text-sm font-medium">
                          {address?.slice(0, 6)}…{address?.slice(-4)}
                        </span>
                        <span className="text-white text-xs bg-emerald-600/20 px-2 py-1 rounded-full border border-emerald-600/30">
                          {chain?.name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1 border border-emerald-600/50 text-emerald-600 hover:text-white hover:bg-emerald-600/20 text-xs px-3 py-2 rounded-lg transition-all duration-300"
                        onClick={() => setOpenWalletModal(true)}
                      >
                        Details
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 border border-emerald-600/30 text-emerald-600 hover:text-white hover:bg-emerald-600/20 text-xs px-3 py-2 rounded-lg transition-all duration-300"
                        onClick={() => disconnect()}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse"></div>
                    </div>
                    <button
                      className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-600 hover:bg-emerald-600/30 hover:text-white transition-all duration-300 hover:scale-110"
                      onClick={() => setOpenWalletModal(true)}
                      title="Wallet Details"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {sidebarItems.map(({ key, label, icon }, index) => {
            const isActive = activeSection === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveSection(key);
                  setIsMobileOpen(false); // Close mobile menu when item is clicked
                }}
                className={`
                  group relative flex items-center rounded-xl px-3 py-3 text-sm font-medium
                  transition-all duration-300 ease-in-out transform
                  ${isCollapsed ? "justify-center" : ""}
                  ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg scale-105 shadow-emerald-600/25"
                      : "text-gray-300 hover:bg-emerald-600/10 hover:text-white hover:scale-105 hover:shadow-lg hover:shadow-emerald-600/20"
                  }
                `}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Icon */}
                <span
                  className={`
                    flex-shrink-0 text-2xl transition-all duration-300
                    ${isActive ? "text-white" : "text-emerald-600 group-hover:text-white"}
                    ${isActive ? "animate-pulse" : ""}
                  `}
                >
                  {icon}
                </span>
                
                {/* Label */}
                {!isCollapsed && (
                  <span className="ml-3 truncate font-medium tracking-wide">
                    {label}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-sm rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50 border border-emerald-600/30">
                    {label}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black rotate-45 border-l border-b border-emerald-600/30" />
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-600/30 bg-black">
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-black">BH</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">Bounty Hunter</p>
                  <p className="text-xs text-emerald-600/70 truncate">Active Member</p>
                </div>
              </div>
              <div className="text-xs text-emerald-600/60 text-center">
                © FlashBounty 2025
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                <span className="text-xs font-bold text-black">BH</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('all-bounties');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'post-bounty':
        return <PostBountyPage />;
      case 'all-bounties':
        return <AllBountiesPage />;
      case 'bounty-details':
        return <BountyDetailsPage />;
      case 'claim-bounty':
        return <ClaimBountyPage />;
      case 'my-bounties':
        return <MyBountiesPage />;
      case 'submit-proof':
        return <SubmitProofPage />;
      case 'user-profile':
        return <UserProfileDashboard />;
      case 'categories':
        return <CategoriesComponent />;
      case 'leaderboard':
        return <LeaderboardComponent />;
      case 'analytics':
        return <AnalyticsComponent />;
      default:
        return <AllBountiesComponent />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      {/* Main Content */}
      <main 
        className={`transition-all duration-500 ease-in-out ${
          isCollapsed ? 'md:ml-16' : 'md:ml-80'
        }`}
      >
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}