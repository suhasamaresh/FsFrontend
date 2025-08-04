"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

import AllStudyFunds from "./allstudyfunds";
import CreateStudyFund from "./createstudyfund";
import MyStudyFunds from "./mystudyfunds";
import StudyFundDetails from "./studyfunddetails";

const sidebarItems = [
  {
    id: "allfunds",
    label: "All Study Funds",
    icon: "📚",
    component: <AllStudyFunds />,
  },
  {
    id: "createfund",
    label: "Create Fund",
    icon: "➕",
    component: <CreateStudyFund />,
  },
  {
    id: "myfunds",
    label: "My Funds",
    icon: "👤",
    component: <MyStudyFunds />,
  },
  {
    id: "details",
    label: "Fund Details",
    icon: "🔍",
    component: <StudyFundDetails />,
  },
];

export default function Sidebar() {
  const [selectedId, setSelectedId] = useState("allfunds");

  return (
    <div className="flex h-screen bg-gray-900">
      <aside className="w-64 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-bold">📖</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">FlashStudy</h1>
            <p className="text-xs text-gray-400">Shared Learning Funds</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-3 overflow-auto">
          {sidebarItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                selectedId === item.id
                  ? "bg-emerald-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </motion.button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-800 p-6">
        {sidebarItems.find((item) => item.id === selectedId)?.component}
      </main>
    </div>
  );
}
