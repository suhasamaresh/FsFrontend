"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useOpenConnectModal } from "@0xsequence/connect";
import { useOpenWalletModal } from "@0xsequence/wallet-widget";
import { Button } from "@0xsequence-demos/boilerplate-design-system";
import { motion, AnimatePresence } from "framer-motion";
import CreateExpenseGroupPage from "./createexpense";
import GroupsPage from "./allgroups";
import GroupDetailsPage from "./groupdetails";
import SettlePage from "./settle";
import UserProfileDashboard from "./profile";

const sidebarItems = [
  { label: "Create Group", key: "create-group", icon: "👥" },
  { label: "All Groups", key: "groups", icon: "📊" },
  { label: "Group Details", key: "group", icon: "🔍" },
  { label: "Settle Expense", key: "settle-expense", icon: "💎" },
  { label: "User Profile", key: "user-profile", icon: "👤" },
  { label: "Tokens", key: "tokens", icon: "🎯" },
  { label: "Achievements", key: "achievements", icon: "🏆" },
];

type SidebarProps = {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
};

// Sample components for each section
const CreateGroupComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Create Group</h2>
    <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-emerald-600 text-sm font-medium mb-2">Group Name</label>
          <input type="text" className="w-full p-3 bg-black border border-emerald-600/50 rounded-lg text-white focus:border-emerald-600 focus:outline-none" placeholder="Enter group name" />
        </div>
        <div>
          <label className="block text-emerald-600 text-sm font-medium mb-2">Description</label>
          <textarea className="w-full p-3 bg-black border border-emerald-600/50 rounded-lg text-white focus:border-emerald-600 focus:outline-none" rows={3} placeholder="Group description"></textarea>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors">
          Create Group
        </button>
      </div>
    </div>
  </div>
);

const AllGroupsComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">All Groups</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4].map((group) => (
        <div key={group} className="bg-black border border-emerald-600/30 rounded-xl p-6 hover:border-emerald-600/50 transition-colors">
          <h3 className="text-lg font-bold text-white mb-2">Group {group}</h3>
          <p className="text-gray-400 mb-4">Members: {Math.floor(Math.random() * 10) + 2}</p>
          <div className="flex justify-between items-center">
            <span className="text-emerald-600 font-medium">${Math.floor(Math.random() * 500) + 100} total</span>
            <button className="bg-emerald-600/20 text-emerald-600 px-3 py-1 rounded-lg text-sm hover:bg-emerald-600/30">
              View
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const GroupDetailsComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Group Details</h2>
    <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Group Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white">Weekend Trip</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Members:</span>
              <span className="text-white">5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Expenses:</span>
              <span className="text-emerald-600">$450.00</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Recent Expenses</h3>
          <div className="space-y-2">
            {['Hotel', 'Food', 'Gas'].map((expense, i) => (
              <div key={i} className="flex justify-between p-2 bg-emerald-600/10 rounded-lg">
                <span className="text-white">{expense}</span>
                <span className="text-emerald-600">${Math.floor(Math.random() * 100) + 50}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SettleExpenseComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Settle Expense</h2>
    <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Who Owes What</h3>
          <div className="space-y-3">
            {['Alice', 'Bob', 'Charlie'].map((person, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-emerald-600/10 rounded-lg">
                <span className="text-white">{person}</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">${Math.floor(Math.random() * 50) + 10}</span>
                  <button className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">Settle</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Payment History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[1, 2, 3, 4, 5].map((payment) => (
              <div key={payment} className="p-2 border border-emerald-600/20 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-white text-sm">Payment #{payment}</span>
                  <span className="text-emerald-600 text-sm">$25.00</span>
                </div>
                <span className="text-gray-400 text-xs">2 days ago</span>
              </div>
            ))}
          </div>
        </div>
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
          <p className="text-gray-400">Premium Member</p>
          <p className="text-emerald-600">Member since 2024</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-600/10 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-emerald-600">12</div>
          <div className="text-gray-400">Groups Joined</div>
        </div>
        <div className="bg-emerald-600/10 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-emerald-600">$1,250</div>
          <div className="text-gray-400">Total Expenses</div>
        </div>
        <div className="bg-emerald-600/10 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-emerald-600">8</div>
          <div className="text-gray-400">Settlements</div>
        </div>
      </div>
    </div>
  </div>
);

const TokensComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Tokens</h2>
    <div className="bg-black border border-emerald-600/30 rounded-xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Token Balance</h3>
          <div className="bg-emerald-600/10 p-4 rounded-lg">
            <div className="text-3xl font-bold text-emerald-600 mb-2">1,500 FST</div>
            <div className="text-gray-400">FlashSplit Tokens</div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {['Earned', 'Spent', 'Transferred'].map((type, i) => (
              <div key={i} className="flex justify-between p-2 border border-emerald-600/20 rounded-lg">
                <span className="text-white">{type}</span>
                <span className={`${type === 'Spent' ? 'text-red-400' : 'text-emerald-600'}`}>
                  {type === 'Spent' ? '-' : '+'}50 FST
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AchievementsComponent = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-white mb-6">Achievements</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { name: 'First Group', desc: 'Created your first group', earned: true },
        { name: 'Big Spender', desc: 'Spent over $1000', earned: true },
        { name: 'Socialite', desc: 'Join 10 groups', earned: false },
        { name: 'Quick Settler', desc: 'Settle 5 expenses', earned: true },
        { name: 'Token Master', desc: 'Earn 2000 tokens', earned: false },
        { name: 'Group Leader', desc: 'Lead 3 groups', earned: false },
      ].map((achievement, i) => (
        <div key={i} className={`p-6 rounded-xl border ${achievement.earned ? 'bg-emerald-600/10 border-emerald-600/30' : 'bg-gray-800/20 border-gray-600/30'}`}>
          <div className="text-center">
            <div className={`text-4xl mb-3 ${achievement.earned ? '' : 'grayscale opacity-50'}`}>🏆</div>
            <h3 className={`font-bold mb-2 ${achievement.earned ? 'text-emerald-600' : 'text-gray-400'}`}>
              {achievement.name}
            </h3>
            <p className="text-gray-400 text-sm">{achievement.desc}</p>
            {achievement.earned && (
              <span className="text-xs text-emerald-600 mt-2 block">✓ Earned</span>
            )}
          </div>
        </div>
      ))}
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
              <span className="text-sm font-bold text-black">F</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-lg text-white tracking-tight truncate">
                  FlashSplit
                </h1>
                <p className="text-xs text-emerald-600/70 truncate">Expense Manager</p>
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
                  <span className="text-xs font-bold text-black">U</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">John Doe</p>
                  <p className="text-xs text-emerald-600/70 truncate">Premium User</p>
                </div>
              </div>
              <div className="text-xs text-emerald-600/60 text-center">
                © FlashSplit 2025
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                <span className="text-xs font-bold text-black">U</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('create-group');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'create-group':
        return <CreateExpenseGroupPage />;
      case 'groups':
        return <GroupsPage />;
      case 'group':
        return <GroupDetailsPage />;
      case 'settle-expense':
        return <SettlePage />;
      case 'user-profile':
        return <UserProfileDashboard/>;
      case 'tokens':
        return <TokensComponent />;
      case 'achievements':
        return <AchievementsComponent />;
      default:
        return <CreateGroupComponent />;
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